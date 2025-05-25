require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const XLSX = require('xlsx');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const glob = require('glob');

const app = express();

// 设置multer存储配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    // 确保上传目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名，防止文件名冲突
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // 保留原始文件扩展名
    const ext = path.extname(file.originalname);
    // 将原始文件名进行解码以避免乱码
    const decodedName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    // 保存解码后的文件名
    file.decodedOriginalName = decodedName;
    cb(null, uniqueSuffix + ext);
  }
});

// 限制上传文件类型 - 只接受Excel文件
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/octet-stream' // 有时Excel文件会被报告为这种类型
  ];
  
  // 也可以通过文件扩展名来过滤
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.xlsx' || ext === '.xls' || allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传Excel文件 (.xlsx, .xls)'));
  }
};

// 配置multer上传中间件
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 限制文件大小为10MB
    files: 100 // 最多可上传100个文件
  }
});

// 中间件
app.use(cors());
app.use(express.json());

// 静态文件服务
const publicPath = path.join(__dirname, 'public');
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
  console.log(`提供静态文件服务: ${publicPath}`);
}

// 删除文件的辅助函数
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`已删除文件: ${filePath}`);
    }
  } catch (err) {
    console.error(`删除文件失败 ${filePath}:`, err);
  }
};

// 分析Excel文件内容
async function analyzeExcelContent(filePath, searchContent, options = {}) {
  // 设置默认选项
  const defaultOptions = {
    understandingMode: 'semantic', // semantic, exact, balanced
    minRelevanceThreshold: 0,
    analysisDepth: 'shallow' // shallow, deep
  };
  
  // 合并选项
  const analysisOptions = { ...defaultOptions, ...options };
  
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`文件未找到: ${filePath}`);
      return { score: 0, error: '文件未找到' };
    }
    
    // 读取Excel文件
    let workbook;
    try {
      // 使用更高效的选项读取，只读取可见工作表
      workbook = XLSX.readFile(filePath, {
        type: 'binary',
        sheetStubs: true,  // 生成空单元格
        cellStyles: false, // 不读取样式信息，提高性能
        bookVBA: false,    // 不读取宏，提高性能
        cellDates: true,   // 将日期转换为JS日期对象
        dateNF: 'yyyy-mm-dd' // 日期格式
      });
    } catch (readError) {
      console.error(`读取Excel文件 ${path.basename(filePath)} 出错:`, readError);
      return { score: 0, error: '无法读取Excel文件' };
    }
    
    // 确保有工作表
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return { score: 0, error: 'Excel文件没有工作表' };
    }
    
    // 设置最大匹配行数限制，避免返回过多数据
    const MAX_MATCHED_LINES = 100;
    
    // 分析所有工作表
    const sheets = [];
    const matchedLines = [];
    let matchCountExceedsLimit = false;
    
    // 如果搜索内容为空，则返回0分
    if (!searchContent || searchContent.trim() === '') {
      return { score: 0, error: '搜索内容为空' };
    }
    
    // 转为小写以便不区分大小写比较
    const searchContentLower = searchContent.toLowerCase();
    
    // 处理每个工作表
    for (const sheetName of workbook.SheetNames) {
      // 如果已达到最大匹配数，跳过后续工作表
      if (matchedLines.length >= MAX_MATCHED_LINES) {
        matchCountExceedsLimit = true;
        break;
      }
      
      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) continue; // 跳过无效的工作表
      
      // 转换为JSON
      let jsonData;
      try {
        jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          raw: false, // 将所有值转为字符串以简化搜索
          defval: ''  // 空单元格的默认值
        });
      } catch (error) {
        console.error(`解析工作表 ${sheetName} 出错:`, error);
        continue; // 跳过出错的工作表
      }
      
      // 存储这个工作表的信息
      sheets.push({
        name: sheetName,
        rowCount: jsonData.length
      });
      
      // 查找匹配的行
      for (let rowIndex = 0; rowIndex < jsonData.length; rowIndex++) {
        // 如果已达到最大匹配数，跳出循环
        if (matchedLines.length >= MAX_MATCHED_LINES) {
          matchCountExceedsLimit = true;
          break;
        }
        
        const row = jsonData[rowIndex];
        if (!row || row.length === 0) continue;
        
        // 过滤掉空值，并转为字符串
        const filteredRow = row.map(cell => {
          // 处理各种类型的单元格值
          if (cell === null || cell === undefined) return '';
          if (typeof cell === 'object') {
            // 处理日期或其他复杂对象
            if (cell instanceof Date) {
              return cell.toISOString().split('T')[0]; // 只返回日期部分
            }
            return JSON.stringify(cell);
          }
          return String(cell);
        });
        
        const rowText = filteredRow.join(' ');
        
        // 不区分大小写搜索
        if (rowText.toLowerCase().includes(searchContentLower)) {
          matchedLines.push({
            sheet: sheetName,
            row: rowIndex + 1, // Excel行号从1开始
            content: rowText,
            cells: filteredRow
          });
        }
      }
    }
    
    // 提取用于分析的文本样本
    let textForAnalysis = '';
    
    // 如果有匹配行，优先使用匹配行的内容
    if (matchedLines.length > 0) {
      // 使用匹配行构建上下文，但同时保留一些非匹配行以获取更完整的上下文
      const matchedTexts = matchedLines.map(line => line.content);
      textForAnalysis = matchedTexts.join('\n\n');
    } else {
      // 从所有工作表中提取内容样本
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) continue;
        
        try {
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          textForAnalysis += `【工作表: ${sheetName}】\n`;
          
          // 提取更多内容，最多处理15行
          const sampleRows = jsonData.slice(0, 15);
          for (const row of sampleRows) {
            if (row && row.length > 0) {
              const rowText = row
                .filter(cell => cell !== null && cell !== undefined)
                .map(cell => {
                  if (typeof cell === 'object') {
                    if (cell instanceof Date) {
                      return cell.toISOString().split('T')[0];
                    }
                    return JSON.stringify(cell);
                  }
                  return String(cell);
                })
                .join(' | ');
                
              if (rowText.trim()) {
                textForAnalysis += rowText + '\n';
              }
              
              // 如果已收集足够的文本，停止收集当前工作表
              if (textForAnalysis.length > 3000) {
                textForAnalysis += `[...工作表${sheetName}包含更多内容...]\n`;
                break;
              }
            }
          }
          
          textForAnalysis += '\n';
        } catch (error) {
          console.error(`提取工作表 ${sheetName} 样本时出错:`, error);
          continue; // 跳过出错的工作表
        }
        
        // 如果已收集足够的总体文本，停止收集更多工作表
        if (textForAnalysis.length > 4000) {
          const remainingSheets = workbook.SheetNames.slice(
            workbook.SheetNames.indexOf(sheetName) + 1
          );
          if (remainingSheets.length > 0) {
            textForAnalysis += `[...文档还包含${remainingSheets.length}个工作表未显示...]\n`;
          }
          break;
        }
      }
    }
    
    // 如果内容太少，可能不是一个有效的文档
    if (textForAnalysis.length < 10) {
      return { score: 0, error: 'Excel文件内容不足' };
    }
    
    // 预处理文本，去除多余空白字符
    textForAnalysis = textForAnalysis.replace(/\s+/g, ' ').trim();
    
    // 智能选择分析片段长度，根据语义内容提取关键部分
    let contentSnippet = '';
    const maxContentLength = 2000; // 增加最大分析内容长度
    
    if (textForAnalysis.length <= maxContentLength) {
      // 如果总文本不超过限制，使用全部内容
      contentSnippet = textForAnalysis;
    } else if (matchedLines.length > 0) {
      // 如果有匹配行，组合一些重要匹配行和上下文
      // 优先使用匹配度高的行
      const sortedMatches = [...matchedLines].sort((a, b) => {
        const scoreA = (a.content.toLowerCase().includes(searchContent.toLowerCase())) ? 2 : 1;
        const scoreB = (b.content.toLowerCase().includes(searchContent.toLowerCase())) ? 2 : 1;
        return scoreB - scoreA;
      });
      
      // 取最重要的匹配行，最多1000字符
      let importantMatches = '';
      for (const match of sortedMatches) {
        if (importantMatches.length + match.content.length + 10 < 1000) {
          importantMatches += match.content + '\n\n';
        } else {
          break;
        }
      }
      
      // 添加文档开头的内容作为上下文
      const intro = textForAnalysis.substring(0, 500);
      
      // 组合内容，确保总长度不超过maxContentLength
      contentSnippet = intro + '\n\n' + importantMatches;
      if (contentSnippet.length > maxContentLength) {
        contentSnippet = contentSnippet.substring(0, maxContentLength);
      }
    } else {
      // 没有匹配行，使用文档的开头、中间和结尾部分
      const beginning = textForAnalysis.substring(0, maxContentLength * 0.4);
      const middle = textForAnalysis.substring(
        Math.floor(textForAnalysis.length / 2 - maxContentLength * 0.2),
        Math.floor(textForAnalysis.length / 2 + maxContentLength * 0.2)
      );
      const end = textForAnalysis.substring(textForAnalysis.length - maxContentLength * 0.2);
      
      contentSnippet = beginning + '\n\n' + middle + '\n\n' + end;
      if (contentSnippet.length > maxContentLength) {
        contentSnippet = contentSnippet.substring(0, maxContentLength);
      }
    }
    
    // 调用SophNet API进行分析
    try {
      // 准备API密钥，确保格式正确
      const apiKey = process.env.SOPHNET_API_KEY ? process.env.SOPHNET_API_KEY.trim() : '';
      if (!apiKey) {
        console.error('API密钥未设置');
        return { score: 0, error: 'API密钥未设置，请配置API密钥' };
      }
      
      if (!process.env.SOPHNET_API_URL) {
        console.error('API地址未设置');
        return { score: 0, error: 'API地址未设置，请配置API地址' };
      }
      
      // 如果有明确的关键词匹配，可以跳过API调用直接返回较高分数
      if (matchedLines.length > 5 && (analysisOptions.understandingMode === 'exact' || 
          (analysisOptions.understandingMode === 'balanced' && matchedLines.length > 10))) {
        console.log(`文件 ${path.basename(filePath)} 有 ${matchedLines.length} 处直接匹配，跳过API分析 (${analysisOptions.understandingMode}模式)`);
        const score = 70 + Math.min(matchedLines.length, 30); // 基于匹配数计算分数，最高100
        return { 
          score,
          matchedLines: matchedLines.length > 0 ? matchedLines : null,
          sheets: sheets.map(s => s.name),
          totalMatches: matchedLines.length + (matchCountExceedsLimit ? '+' : ''),
          matchCountExceedsLimit,
          apiSkipped: true // 标记跳过了API调用
        };
      }
      
      // 在精确匹配模式下，即使匹配较少也可以基于匹配结果返回分数
      if (analysisOptions.understandingMode === 'exact' && matchedLines.length > 0) {
        const score = 50 + Math.min(matchedLines.length * 5, 50); // 基于匹配行数计算分数
        console.log(`文件 ${path.basename(filePath)} 在精确匹配模式下发现 ${matchedLines.length} 处匹配，评分: ${score}`);
        return { 
          score,
          matchedLines: matchedLines.length > 0 ? matchedLines : null,
          sheets: sheets.map(s => s.name),
          totalMatches: matchedLines.length + (matchCountExceedsLimit ? '+' : ''),
          matchCountExceedsLimit,
          apiSkipped: true // 标记跳过了API调用
        };
      }
      
      // 没有匹配项或匹配项较少，或者用户选择语义分析模式，使用API进行语义分析
      // 构建请求数据
      const model = process.env.SOPHNET_MODEL || "DeepSeek-R1";
      
      // 根据分析深度调整内容长度
      const maxContentLength = analysisOptions.analysisDepth === 'deep' ? 2000 : 1000;
      
      // 根据分析模式调整提示词
      let systemPrompt = '';
      if (analysisOptions.understandingMode === 'semantic') {
        systemPrompt = `你是一个专业的文档内容分析助手，专门负责分析Excel文件内容与搜索查询之间的语义关联度。
请理解用户的搜索意图，不仅关注关键词的直接匹配，还要理解搜索内容的深层含义和上下文语境。
文档内容可能涉及工作报表、合同、签证、财务或项目数据等领域。

分析任务:
1. 理解搜索关键词的核心意图和可能的同义表达
2. 分析文本内容是否包含与搜索意图相关的信息，即使没有直接使用相同的词汇
3. 考虑业务术语和专业用语的相关性
4. 评估内容的整体相关程度

请返回一个0到100之间的整数表示相关度分数:
- 0-20: 基本无关
- 21-40: 轻微相关
- 41-60: 中度相关
- 61-80: 高度相关
- 81-100: 极高相关

只返回数字分数，不要包含任何其他文字、解释或标点符号。`;
      } else if (analysisOptions.understandingMode === 'balanced') {
        systemPrompt = `你是一个内容分析助手，负责评估Excel文件内容与搜索关键词之间的相关度。
请同时考虑直接匹配和语义相关性，平衡两者影响:
1. 关键词的精确匹配应有较高权重
2. 同时考虑同义词和相关概念
3. 合理评估内容的整体相关性

请返回一个0到100之间的整数表示相关度分数:
- 0-20: 基本无关
- 21-40: 轻微相关
- 41-60: 中度相关
- 61-80: 高度相关
- 81-100: 极高相关

只返回数字分数，不要包含任何解释或其他文字。`;
      } else {
        // exact模式
        systemPrompt = `你是一个精确匹配分析助手，负责检查Excel文件内容是否包含搜索关键词。
请主要关注关键词的直接匹配：
1. 搜索关键词的精确出现
2. 关键词的微小变体(如单复数、大小写差异)
3. 关键词的直接组合

对于完全不包含关键词或其变体的内容，应给予较低分数。

请返回一个0到100之间的整数表示匹配程度:
- 0-20: 未找到关键词
- 21-50: 找到少量关键词或间接出现
- 51-80: 找到多处关键词
- 81-100: 找到大量关键词或完全匹配

只返回数字分数，不要包含任何解释或其他文字。`;
      }
      
      const requestData = {
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `搜索关键词: "${searchContent}"

文档类型: Excel工作表
文本内容片段: 
"${contentSnippet}"`
          }
        ],
        model: model,
        max_tokens: 50, // 减少使用的Token数，因为我们只需要一个数字
        temperature: analysisOptions.understandingMode === 'semantic' ? 0.3 : 0.1 // 语义模式下温度略高，允许更多理解空间
      };
      
      console.log(`使用模型: ${model} 分析文件: ${path.basename(filePath)}`);
      
      // SophNet API调用
      const response = await axios.post(
        process.env.SOPHNET_API_URL,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30秒超时，减少等待时间
        }
      );

      // 确保响应和必要的字段存在
      if (!response || !response.data || !response.data.choices || !response.data.choices[0] || !response.data.choices[0].message) {
        console.warn(`API响应格式异常: ${JSON.stringify(response.data)}`);
        // 如果有匹配行，则使用基于匹配行的评分
        if (matchedLines.length > 0) {
          const score = 50 + Math.min(matchedLines.length * 2, 50);
          return { 
            score,
            matchedLines: matchedLines,
            sheets: sheets.map(s => s.name),
            totalMatches: matchedLines.length + (matchCountExceedsLimit ? '+' : ''),
            matchCountExceedsLimit,
            apiWarning: '响应格式异常'
          };
        }
        return { score: 0, error: 'API响应格式异常' };
      }

      // 处理结果
      const rawContent = response.data.choices[0].message.content ? response.data.choices[0].message.content.trim() : '';
      let score = 0;
      
      // 增强数字提取能力
      const extractNumber = (text) => {
        // 首先尝试直接解析整个字符串
        const directMatch = parseInt(text);
        if (!isNaN(directMatch) && directMatch >= 0 && directMatch <= 100) {
          return directMatch;
        }
        
        // 查找字符串中的所有数字
        const matches = text.match(/\d+/g);
        if (matches && matches.length > 0) {
          // 筛选出0-100范围内的有效数字
          const validScores = matches.map(m => parseInt(m))
            .filter(n => !isNaN(n) && n >= 0 && n <= 100);
          
          if (validScores.length > 0) {
            // 如果有多个数字，尝试找到最相关的一个
            // 通常是第一个数字，或者是与"分数"、"相关度"等关键词最接近的数字
            const mostLikelyScore = validScores[0];
            console.log(`从文本 "${text}" 中提取出多个数字，使用最可能的分数: ${mostLikelyScore}`);
            return mostLikelyScore;
          }
        }
        
        // 使用启发式方法估算分数
        if (text.includes('高度相关') || text.includes('极高相关') || text.includes('非常相关')) {
          console.log(`从文本 "${text}" 中未找到有效数字，根据文本内容估算为高分`);
          return 85;
        } else if (text.includes('中度相关') || text.includes('相关')) {
          return 65;
        } else if (text.includes('轻微相关') || text.includes('略微相关')) {
          return 35;
        } else if (text.includes('无关') || text.includes('不相关')) {
          return 10;
        }
        
        // 默认返回一个中间值
        console.warn(`无法从 "${text}" 中提取有效分数，默认为50分`);
        return 50;
      };
      
      if (!isNaN(parseInt(rawContent))) {
        // 直接是数字，直接使用
        score = Math.min(Math.max(parseInt(rawContent), 0), 100);
        console.log(`文件 ${path.basename(filePath)} 分析得分: ${score}`);
      } else {
        // 如果不是纯数字，尝试更智能地提取
        console.warn(`SophNet返回非标准分数格式: '${rawContent}'，尝试智能提取`);
        score = extractNumber(rawContent);
        console.log(`文件 ${path.basename(filePath)} 分析得分(智能提取): ${score}`);
        
        // 记录异常响应以便未来改进
        const logPath = path.join(__dirname, 'logs', 'api_responses.log');
        try {
          // 确保日志目录存在
          if (!fs.existsSync(path.join(__dirname, 'logs'))) {
            fs.mkdirSync(path.join(__dirname, 'logs'), { recursive: true });
          }
          
          const logEntry = `${new Date().toISOString()} | 查询: "${searchContent}" | 响应: "${rawContent}" | 提取分数: ${score}\n`;
          fs.appendFileSync(logPath, logEntry);
        } catch (logError) {
          console.error('记录API响应日志失败:', logError);
        }
      }
      
      // 如果有匹配行，确保相关度至少为50
      if (matchedLines.length > 0 && score < 50) {
        const originalScore = score;
        score = 50 + Math.min(matchedLines.length * 2, 50); // 根据匹配行数增加分数，最高100
        console.log(`文件 ${path.basename(filePath)} 有 ${matchedLines.length} 处直接匹配，将分数从 ${originalScore} 提高到 ${score}`);
      }
      
      // 基于分数生成相关度解释
      const relevanceExplanation = generateRelevanceExplanation(score, matchedLines.length, searchContent);
      
      // 返回分析结果
      return { 
        score,
        matchedLines: matchedLines.length > 0 ? matchedLines : null,
        sheets: sheets.map(s => s.name),
        totalMatches: matchedLines.length + (matchCountExceedsLimit ? '+' : ''),
        matchCountExceedsLimit,
        relevanceExplanation
      };
    } catch (error) {
      let errorMessage = 'Unknown analysis error';
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'API超时';
        console.error(`分析超时: SophNet API Timeout`);
        
        // 超时情况下，使用备用评分方法 - 基于直接匹配
        if (matchedLines.length > 0) {
          const backupScore = 50 + Math.min(matchedLines.length * 5, 50);
          console.log(`API超时，使用备用评分: ${backupScore}`);
          return {
            score: backupScore,
            matchedLines: matchedLines.length > 0 ? matchedLines : null,
            sheets: sheets.map(s => s.name),
            totalMatches: matchedLines.length + (matchCountExceedsLimit ? '+' : ''),
            matchCountExceedsLimit,
            apiWarning: 'API超时，使用备用评分',
            relevanceExplanation: `文件中包含 ${matchedLines.length} 处直接匹配，可能相关`
          };
        }
      } else if (error.response) {
        // 增强401错误处理
        if (error.response.status === 401) {
          errorMessage = `认证失败 (401): 请检查API密钥是否正确`;
          console.error(`认证失败: API密钥可能不正确或格式有误`, error.response.data);
        } else {
          errorMessage = `API错误 (${error.response.status})`;
          console.error(`API错误 - 状态 ${error.response.status}`, error.response.data);
        }
      } else if (error.request) {
        errorMessage = 'API无响应';
        console.error(`API无响应: 请检查API地址是否正确`);
      } else {
        errorMessage = error.message;
        console.error(`分析错误:`, error.message);
      }
      return { score: 0, error: errorMessage };
    }
  } catch (error) {
    console.error(`处理文件时发生错误:`, error);
    return { score: 0, error: `处理文件时发生错误: ${error.message}` };
  }
}

// 分析文本情感偏向，返回0-1之间的分数
function analyzeTextSentiment(text) {
  // 正面词汇
  const positiveWords = ['相关', '匹配', '符合', '包含', '类似', '相似', '对应', '相同', '一致', '适合', '合适', '适当', '有关', '近似'];
  // 负面词汇
  const negativeWords = ['不相关', '无关', '不匹配', '无法匹配', '不符合', '不包含', '不一致', '不适合', '不适当', '无关联'];
  
  const lowerText = text.toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;
  
  // 计算出现的正面和负面词汇数量
  positiveWords.forEach(word => {
    const regex = new RegExp(word, 'g');
    const matches = lowerText.match(regex);
    if (matches) positiveCount += matches.length;
  });
  
  negativeWords.forEach(word => {
    const regex = new RegExp(word, 'g');
    const matches = lowerText.match(regex);
    if (matches) negativeCount += matches.length;
  });
  
  // 如果没有情感词汇，返回中性值
  if (positiveCount === 0 && negativeCount === 0) return 0.5;
  
  // 计算情感分数，正面词汇多则偏高，负面词汇多则偏低
  return Math.min(Math.max(0.5 + (positiveCount - negativeCount * 2) * 0.1, 0), 1);
}

// 基于分数生成相关度解释
function generateRelevanceExplanation(score, matchCount, searchContent) {
  if (score >= 90) {
    return `内容与"${searchContent}"高度相关，可能包含直接匹配或非常接近的同义概念`;
  } else if (score >= 75) {
    return `内容与"${searchContent}"显著相关，包含相关概念或上下文`;
  } else if (score >= 60) {
    return `内容与"${searchContent}"中等相关，包含一些间接相关的概念`;
  } else if (score >= 40) {
    return `内容与"${searchContent}"轻微相关，可能包含相似的主题领域`;
  } else if (score >= 20) {
    return `内容与"${searchContent}"相关性低，仅有很少的相关之处`;
  } else {
    return `内容与"${searchContent}"几乎无关`;
  }
}

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 文件上传与分析接口
app.post('/api/upload-and-analyze', upload.array('files'), async (req, res) => {
  const files = req.files;
  const searchContent = req.body.searchContent;
  
  // 获取高级搜索选项
  const understandingMode = req.body.understandingMode || 'semantic';
  const minRelevanceThreshold = parseInt(req.body.minRelevanceThreshold || '0');
  const analysisDepth = req.body.analysisDepth || 'shallow';
  
  console.log(`收到分析请求: 搜索内容="${searchContent}", 文件数量=${files ? files.length : 0}, 模式=${understandingMode}`);
  
  // 验证输入
  if (!searchContent) {
    return res.status(400).json({ error: '请提供搜索内容' });
  }
  
  if (!files || files.length === 0) {
    return res.status(400).json({ error: '请上传至少一个Excel文件' });
  }
  
  try {
    // 分析所有文件
    const results = [];
    let completedFiles = 0;
    
    for (const file of files) {
      // 获取原始文件名和临时文件路径
      const originalName = file.decodedOriginalName || file.originalname;
      const filePath = file.path;
      
      try {
        console.log(`[${++completedFiles}/${files.length}] 分析文件: ${originalName}, 理解模式: ${understandingMode}`);
        
        // 分析文件内容，传递高级搜索选项
        const analysisResult = await analyzeExcelContent(filePath, searchContent, {
          understandingMode,
          minRelevanceThreshold,
          analysisDepth
        });
        
        // 构建结果对象
        let relevanceExplanation = null;
        if (analysisResult.score > 80) {
          relevanceExplanation = '内容与搜索高度相关';
        } else if (analysisResult.score > 60) {
          relevanceExplanation = '内容与搜索较为相关';
        } else if (analysisResult.score > 40) {
          relevanceExplanation = '内容与搜索部分相关';
        } else if (analysisResult.score > 20) {
          relevanceExplanation = '内容与搜索相关度较低';
        } else {
          relevanceExplanation = '内容与搜索几乎无关';
        }
        
        // 过滤结果，如果分数低于阈值则不包含在结果中
        if (analysisResult.score >= minRelevanceThreshold) {
          results.push({
            fileName: originalName,
            relevance: analysisResult.score,
            suggestedLocation: analysisResult.score > 80 ? '很可能在此文件中' :
                              analysisResult.score > 50 ? '可能在此文件中' :
                              '不太可能在此文件中',
            matchedLines: analysisResult.matchedLines || [],
            sheets: analysisResult.sheets || [],
            relevanceExplanation: relevanceExplanation,
            error: analysisResult.error || null,
            apiSkipped: analysisResult.apiSkipped || false,
            apiWarning: analysisResult.apiWarning || null,
            useSemanticMatch: understandingMode === 'semantic' && !analysisResult.apiSkipped,
            matchCountExceedsLimit: analysisResult.matchCountExceedsLimit || false
          });
        } else {
          console.log(`文件 ${originalName} 相关度评分 ${analysisResult.score} 低于阈值 ${minRelevanceThreshold}，被过滤`);
        }
        
      } catch (fileError) {
        console.error(`处理文件 ${originalName} 时出错:`, fileError);
        results.push({
          fileName: originalName,
          relevance: 0,
          suggestedLocation: '分析出错',
          matchedLines: [],
          sheets: [],
          error: fileError.message || '处理文件时发生未知错误'
        });
      } finally {
        // 分析完成后删除临时文件
        deleteFile(filePath);
      }
    }
    
    // 按相关度降序排序结果
    const sortedResults = results.sort((a, b) => {
      // 首先按是否有匹配行排序
      if (a.matchedLines.length > 0 && b.matchedLines.length === 0) return -1;
      if (a.matchedLines.length === 0 && b.matchedLines.length > 0) return 1;
      // 其次按相关度排序
      return b.relevance - a.relevance;
    });
    
    // 返回结果
    res.json({
      total: files.length,
      results: sortedResults,
      searchOptions: {
        understandingMode,
        minRelevanceThreshold,
        analysisDepth
      }
    });
  } catch (error) {
    console.error('处理上传文件时出错:', error);
    res.status(500).json({ error: '服务器内部错误' });
    
    // 确保所有临时文件都被删除
    if (files && files.length > 0) {
      files.forEach(file => {
        if (file.path) {
          deleteFile(file.path);
        }
      });
    }
  }
});

// 获取API配置
app.get('/api/config', (req, res) => {
  try {
    // 只返回需要的配置项，避免泄露其他敏感信息
    const config = {
      SOPHNET_API_URL: process.env.SOPHNET_API_URL || '',
      SOPHNET_API_KEY: process.env.SOPHNET_API_KEY || '',
      SOPHNET_MODEL: process.env.SOPHNET_MODEL || 'DeepSeek-v3',
      SOPHNET_MAX_TOKENS: process.env.SOPHNET_MAX_TOKENS || '32768'
    };
    
    res.json({ success: true, config });
  } catch (error) {
    console.error('获取配置失败:', error);
    res.status(500).json({ success: false, error: '获取配置失败' });
  }
});

// 更新API配置
app.post('/api/config', express.json(), (req, res) => {
  try {
    const { SOPHNET_API_URL, SOPHNET_API_KEY, SOPHNET_MODEL, SOPHNET_MAX_TOKENS } = req.body;
    
    // 验证必要的配置项
    if (!SOPHNET_API_URL || !SOPHNET_API_KEY) {
      return res.status(400).json({ success: false, error: 'API地址和密钥不能为空' });
    }
    
    // 读取当前.env文件内容
    const envPath = path.join(__dirname, '.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // 更新或添加配置项
    const envVars = envContent.split('\n').filter(line => line.trim() !== '');
    const newEnvVars = [];
    
    const updateEnvVar = (name, value) => {
      let found = false;
      
      for (let i = 0; i < envVars.length; i++) {
        if (envVars[i].startsWith(`${name}=`)) {
          envVars[i] = `${name}=${value}`;
          found = true;
          break;
        }
      }
      
      if (!found) {
        envVars.push(`${name}=${value}`);
      }
    };
    
    updateEnvVar('SOPHNET_API_URL', SOPHNET_API_URL);
    updateEnvVar('SOPHNET_API_KEY', SOPHNET_API_KEY);
    
    if (SOPHNET_MODEL) {
      updateEnvVar('SOPHNET_MODEL', SOPHNET_MODEL);
    }
    
    if (SOPHNET_MAX_TOKENS) {
      updateEnvVar('SOPHNET_MAX_TOKENS', SOPHNET_MAX_TOKENS);
    }
    
    // 写入.env文件
    fs.writeFileSync(envPath, envVars.join('\n') + '\n');
    
    // 更新进程中的环境变量
    process.env.SOPHNET_API_URL = SOPHNET_API_URL;
    process.env.SOPHNET_API_KEY = SOPHNET_API_KEY;
    if (SOPHNET_MODEL) {
      process.env.SOPHNET_MODEL = SOPHNET_MODEL;
    }
    if (SOPHNET_MAX_TOKENS) {
      process.env.SOPHNET_MAX_TOKENS = SOPHNET_MAX_TOKENS;
    }
    
    res.json({ success: true, message: '配置已更新' });
  } catch (error) {
    console.error('更新配置失败:', error);
    res.status(500).json({ success: false, error: '更新配置失败: ' + error.message });
  }
});

// 测试API连接
app.post('/api/test-connection', express.json(), async (req, res) => {
  try {
    // 使用提供的配置进行测试，而不是直接修改环境变量
    const { SOPHNET_API_URL, SOPHNET_API_KEY, SOPHNET_MODEL, SOPHNET_MAX_TOKENS } = req.body;
    
    if (!SOPHNET_API_URL || !SOPHNET_API_KEY) {
      return res.status(400).json({ success: false, error: 'API地址和密钥不能为空' });
    }
    
    // 确保API密钥格式正确
    const apiKey = SOPHNET_API_KEY.trim();
    
    // 发送一个简单的测试请求
    const response = await axios.post(
      SOPHNET_API_URL,
      {
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant."
          },
          {
            role: "user",
            content: "Test connection"
          }
        ],
        model: SOPHNET_MODEL || "DeepSeek-R1",
        max_tokens: parseInt(SOPHNET_MAX_TOKENS || 32768)
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10秒超时
      }
    );
    
    // 如果没有抛出异常，则连接成功
    res.json({ 
      success: true, 
      message: 'API连接成功',
      modelResponse: response.data.choices[0].message.content
    });
  } catch (error) {
    console.error('API连接测试失败:', error);
    
    let errorMessage = '未知错误';
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'API请求超时，请稍后重试';
    } else if (error.response) {
      // 增强401错误处理
      if (error.response.status === 401) {
        errorMessage = `认证失败 (401): 请检查API密钥是否正确，确保格式为 "Bearer API密钥"`;
        console.error('API认证失败:', error.response.data);
      } else {
        errorMessage = `服务器返回错误 (${error.response.status}): ${JSON.stringify(error.response.data)}`;
      }
    } else if (error.request) {
      errorMessage = '未收到API响应，请检查API地址是否正确';
    } else {
      errorMessage = error.message;
    }
    
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// SPA前端路由支持
app.get('*', (req, res) => {
  // 避免API路由被重定向到index.html
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API路由不存在' });
  }
  
  const indexPath = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('应用未构建，请先构建前端应用');
  }
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  
  // 确保上传目录存在
  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log(`已创建上传目录: ${uploadsDir}`);
  }
}); 