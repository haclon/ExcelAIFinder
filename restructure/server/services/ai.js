/**
 * AI服务
 * 提供对接外部AI API的功能
 */

const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const config = require('../config/default');
const logger = require('../utils/logger');

/**
 * 读取环境变量配置
 */
dotenv.config();

/**
 * 测试API连接
 * @returns {Promise<Object>} 测试结果
 */
async function testConnection() {
  try {
    const apiUrl = process.env.API_URL || '';
    const apiKey = process.env.API_KEY || '';
    
    if (!apiUrl || !apiKey) {
      return { success: false, message: 'API配置不完整' };
    }
    
    const timeout = 10000; // 10秒超时
    
    // 发送简短的测试请求
    const response = await axios({
      method: 'post',
      url: apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      data: {
        model: process.env.API_MODEL || config.api.defaultModel,
        messages: [
          { role: 'system', content: '你是一个帮助分析文档的助手。' },
          { role: 'user', content: '这是一个API连接测试，请回复"连接成功"。' }
        ],
        max_tokens: 20,
        temperature: 0
      },
      timeout: timeout
    });
    
    return { 
      success: true, 
      message: '连接成功',
      model: response.data.model || process.env.API_MODEL || config.api.defaultModel
    };
  } catch (error) {
    logger.error('API连接测试失败:', error);
    
    // 根据错误类型返回不同的错误信息
    if (error.code === 'ECONNABORTED') {
      return { success: false, message: '连接超时' };
    } else if (error.response) {
      // 有响应但状态码不是2xx
      if (error.response.status === 401) {
        return { success: false, message: 'API密钥无效' };
      } else if (error.response.status === 404) {
        return { success: false, message: 'API地址无效' };
      } else {
        return { 
          success: false, 
          message: `API错误 (${error.response.status}): ${error.response.data.error?.message || '未知错误'}`
        };
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      return { success: false, message: '无法连接到API服务器' };
    } else {
      // 请求设置时出错
      return { success: false, message: `请求错误: ${error.message}` };
    }
  }
}

/**
 * 分析内容相关性
 * @param {string} query - 查询内容
 * @param {string} content - 要分析的文档内容
 * @param {Object} options - 分析选项
 * @returns {Promise<Object>} 分析结果
 */
async function analyzeContent(query, content, options = {}) {
  try {
    const apiUrl = process.env.API_URL;
    const apiKey = process.env.API_KEY;
    const modelName = process.env.API_MODEL || config.api.defaultModel;
    const maxTokens = parseInt(process.env.API_MAX_TOKENS || config.api.defaultMaxTokens);
    
    // 验证API配置是否完整
    if (!apiUrl || !apiKey) {
      logger.warn('缺少API配置，无法进行内容分析');
      return { 
        score: options.understandingMode === 'exact' ? 0 : 50, 
        warning: '未配置API，无法进行语义分析'
      };
    }
    
    // 构建查询和内容指令
    const systemPrompt = `你是一个专业的文档相关性评估助手。你的任务是评估文档内容与用户查询的相关程度。
以1到100的分数评估，其中:
1-20: 几乎无关
21-40: 稍微相关
41-60: 中等相关
61-80: 非常相关
81-100: 完全匹配

仅返回数字评分，不要包含其他任何文本。`;

    const userPrompt = `查询内容: "${query}"
    
文档内容:
${content}

请给出1-100的相关性评分:`;

    // 设置请求超时
    const timeout = config.analysis.analysisTimeout;
    
    // 发送请求到API
    const response = await axios({
      method: 'post',
      url: apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      data: {
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: maxTokens,
        temperature: 0.1
      },
      timeout: timeout
    });
    
    // 提取分数
    let score = 0;
    let warning = null;
    
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const responseText = response.data.choices[0].message.content.trim();
      
      // 尝试从响应中提取数字
      const matches = responseText.match(/(\d+)/);
      if (matches && matches.length > 0) {
        score = parseInt(matches[0]);
        
        // 验证分数范围
        if (score < 1) score = 1;
        if (score > 100) score = 100;
      } else {
        // 如果无法提取数字，使用默认分数
        score = 50;
        warning = '无法从API响应中提取分数';
        logger.warn(`无法从API响应中提取分数。原始响应: ${responseText}`);
      }
    } else {
      // API响应格式不正确
      score = 50;
      warning = 'API响应格式不正确';
      logger.warn('API响应格式不正确:', response.data);
    }
    
    // 记录API调用
    logger.logApiResponse(query, response.data, score);
    
    // 返回分析结果
    return { 
      score, 
      warning,
      model: response.data.model || modelName,
      requestId: response.data.id
    };
    
  } catch (error) {
    logger.error('API分析内容出错:', error);
    
    // 根据错误类型返回不同的错误信息
    let warning = null;
    
    if (error.code === 'ECONNABORTED') {
      warning = 'API请求超时';
    } else if (error.response) {
      // 有响应但状态码不是2xx
      if (error.response.status === 401) {
        warning = 'API密钥无效';
      } else if (error.response.status === 404) {
        warning = 'API地址无效';
      } else {
        warning = `API错误 (${error.response.status}): ${error.response.data.error?.message || '未知错误'}`;
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      warning = '无法连接到API服务器';
    } else {
      // 请求设置时出错
      warning = `请求错误: ${error.message}`;
    }
    
    // 在API出错的情况下，根据理解模式返回一个默认分数
    const defaultScore = options.understandingMode === 'exact' ? 0 : 50;
    
    return { 
      score: defaultScore, 
      warning,
      error: error.message
    };
  }
}

module.exports = {
  testConnection,
  analyzeContent
}; 