/**
 * 默认配置文件
 * 包含应用程序的默认配置项
 */

const path = require('path');

module.exports = {
  // 服务器端口
  port: process.env.PORT || 3000,
  
  // 文件上传配置
  upload: {
    // 上传目录
    directory: path.join(__dirname, '../uploads'),
    // 最大文件大小 (10MB)
    maxFileSize: 10 * 1024 * 1024,
    // 最大文件数
    maxFiles: 100,
    // 允许的文件类型
    allowedTypes: ['.xlsx', '.xls'],
    // 允许的MIME类型
    allowedMimeTypes: [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/octet-stream'
    ]
  },
  
  // Excel分析配置
  analysis: {
    // 最大匹配行数
    maxMatchedLines: 100,
    // 最大文本分析长度
    maxContentLength: 2000,
    // 分析超时时间 (毫秒)
    timeout: 300000 // 5分钟
  },
  
  // API配置
  api: {
    // API变量名称
    urlEnvName: 'SOPHNET_API_URL',
    keyEnvName: 'SOPHNET_API_KEY',
    modelEnvName: 'SOPHNET_MODEL',
    maxTokensEnvName: 'SOPHNET_MAX_TOKENS',
    // 默认值
    defaultModel: 'DeepSeek-R1',
    defaultMaxTokens: 32768
  },
  
  // 日志配置
  logs: {
    // 日志目录
    directory: path.join(__dirname, '../logs'),
    // API响应日志文件
    apiResponsesLog: 'api_responses.log'
  }
}; 