/**
 * 文件控制器
 * 处理文件上传和分析相关的请求
 */

const path = require('path');
const { analyzeExcelContent } = require('../services/excel');
const logger = require('../utils/logger');
const { deleteFile } = require('../utils/file');

/**
 * 上传并分析文件
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function uploadAndAnalyze(req, res) {
  try {
    // 检查是否有文件上传
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '未上传文件' });
    }

    // 获取搜索内容
    const searchContent = req.body.searchContent;
    if (!searchContent) {
      return res.status(400).json({ error: '未提供搜索内容' });
    }

    // 获取分析选项
    const options = {
      understandingMode: req.body.understandingMode || 'semantic',
      minRelevanceThreshold: parseInt(req.body.minRelevanceThreshold || '0', 10),
      analysisDepth: req.body.analysisDepth || 'shallow'
    };

    logger.info(`开始分析 ${req.files.length} 个文件，搜索内容: "${searchContent}"`, {
      options,
      filesCount: req.files.length
    });

    // 存储分析结果
    const results = [];
    
    // 处理每个文件
    for (const file of req.files) {
      try {
        const filePath = file.path;
        const originalName = file.decodedOriginalName || file.originalname;
        
        logger.info(`分析文件: ${originalName}`);
        
        // 分析文件内容
        const analysisResult = await analyzeExcelContent(filePath, searchContent, options);
        
        // 组织结果
        results.push({
          fileName: originalName,
          fileSize: file.size,
          relevance: analysisResult.score,
          matchedLines: analysisResult.matchedLines,
          sheets: analysisResult.sheets,
          totalMatches: analysisResult.totalMatches,
          matchCountExceedsLimit: analysisResult.matchCountExceedsLimit,
          apiSkipped: analysisResult.apiSkipped,
          apiWarning: analysisResult.apiWarning,
          error: analysisResult.error
        });
        
        // 删除临时文件
        deleteFile(filePath);
        
      } catch (fileError) {
        logger.error(`处理文件失败: ${file.originalname}`, fileError);
        
        // 添加错误结果
        results.push({
          fileName: file.decodedOriginalName || file.originalname,
          fileSize: file.size,
          relevance: 0,
          error: `处理文件时出错: ${fileError.message}`
        });
        
        // 删除临时文件
        if (file.path) {
          deleteFile(file.path);
        }
      }
    }

    // 返回结果
    logger.info(`分析完成，找到 ${results.length} 个结果`);
    return res.json({ results });
    
  } catch (error) {
    logger.error('上传分析处理失败', error);
    return res.status(500).json({ error: `处理请求失败: ${error.message}` });
  }
}

module.exports = {
  uploadAndAnalyze
}; 