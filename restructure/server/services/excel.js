/**
 * Excel分析服务
 * 提供Excel文件内容分析功能
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const config = require('../config/default');
const logger = require('../utils/logger');
const aiService = require('./ai');
const { deleteFile } = require('../utils/file');

/**
 * 分析Excel文件内容
 * @param {string} filePath - Excel文件路径
 * @param {string} searchContent - 搜索内容
 * @param {Object} options - 分析选项
 * @returns {Object} 分析结果
 */
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
      logger.error(`文件未找到: ${filePath}`);
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
      logger.error(`读取Excel文件 ${path.basename(filePath)} 出错:`, readError);
      return { score: 0, error: '无法读取Excel文件' };
    }
    
    // 确保有工作表
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return { score: 0, error: 'Excel文件没有工作表' };
    }
    
    // 设置最大匹配行数限制，避免返回过多数据
    const MAX_MATCHED_LINES = config.analysis.maxMatchedLines;
    
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
        logger.error(`解析工作表 ${sheetName} 出错:`, error);
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
          logger.error(`提取工作表 ${sheetName} 样本时出错:`, error);
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
    const maxContentLength = analysisOptions.analysisDepth === 'deep' ? 
      config.analysis.maxContentLength * 1.5 : 
      config.analysis.maxContentLength;
    
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
    
    // 如果有明确的关键词匹配，可以跳过API调用直接返回较高分数
    if (matchedLines.length > 5 && (analysisOptions.understandingMode === 'exact' || 
        (analysisOptions.understandingMode === 'balanced' && matchedLines.length > 10))) {
      logger.info(`文件 ${path.basename(filePath)} 有 ${matchedLines.length} 处直接匹配，跳过API分析 (${analysisOptions.understandingMode}模式)`);
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
      logger.info(`文件 ${path.basename(filePath)} 在精确匹配模式下发现 ${matchedLines.length} 处匹配，评分: ${score}`);
      return { 
        score,
        matchedLines: matchedLines.length > 0 ? matchedLines : null,
        sheets: sheets.map(s => s.name),
        totalMatches: matchedLines.length + (matchCountExceedsLimit ? '+' : ''),
        matchCountExceedsLimit,
        apiSkipped: true // 标记跳过了API调用
      };
    }
    
    // 使用AI服务对内容进行评分
    const analysisResult = await aiService.analyzeContent(
      searchContent, 
      contentSnippet, 
      analysisOptions
    );
    
    // 如果有匹配行，确保相关度至少为50
    if (matchedLines.length > 0 && analysisResult.score < 50) {
      const originalScore = analysisResult.score;
      analysisResult.score = 50 + Math.min(matchedLines.length * 2, 50); // 根据匹配行数增加分数，最高100
      logger.info(`文件 ${path.basename(filePath)} 有 ${matchedLines.length} 处直接匹配，将分数从 ${originalScore} 提高到 ${analysisResult.score}`);
    }
    
    // 组合结果
    return {
      score: analysisResult.score,
      matchedLines: matchedLines.length > 0 ? matchedLines : null,
      sheets: sheets.map(s => s.name),
      totalMatches: matchedLines.length + (matchCountExceedsLimit ? '+' : ''),
      matchCountExceedsLimit,
      apiWarning: analysisResult.warning
    };
    
  } catch (error) {
    logger.error(`处理文件时发生错误:`, error);
    return { score: 0, error: `处理文件时发生错误: ${error.message}` };
  }
}

module.exports = {
  analyzeExcelContent
}; 