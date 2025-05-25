/**
 * 日志工具模块
 * 提供应用程序日志记录功能
 */

const fs = require('fs');
const path = require('path');
const winston = require('winston');
const { format, transports } = winston;

// 确保日志目录存在
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// API响应日志文件路径
const apiLogPath = path.join(logDir, 'api_responses.json');

// 确保API响应日志文件存在
if (!fs.existsSync(apiLogPath)) {
  fs.writeFileSync(apiLogPath, JSON.stringify([], null, 2));
}

// 创建日志格式
const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

// 创建控制台输出格式
const consoleFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level}]: ${message}`;
  })
);

// 创建Winston日志记录器
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'excel-finder' },
  transports: [
    // 错误日志文件
    new transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // 所有日志文件
    new transports.File({ 
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // 控制台输出
    new transports.Console({
      format: consoleFormat,
    }),
  ],
});

// 记录API响应
function logApiResponse(query, apiResponse, score) {
  try {
    // 读取现有日志
    let apiLogs = [];
    if (fs.existsSync(apiLogPath)) {
      const fileContent = fs.readFileSync(apiLogPath, 'utf8');
      if (fileContent) {
        apiLogs = JSON.parse(fileContent);
      }
    }

    // 创建日志条目
    const logEntry = {
      timestamp: new Date().toISOString(),
      query,
      score,
      model: apiResponse.model,
      usage: apiResponse.usage,
      responseId: apiResponse.id
    };

    // 添加新日志
    apiLogs.push(logEntry);

    // 保留最新的50条记录
    if (apiLogs.length > 50) {
      apiLogs = apiLogs.slice(-50);
    }

    // 写回文件
    fs.writeFileSync(apiLogPath, JSON.stringify(apiLogs, null, 2));
  } catch (error) {
    logger.error('记录API响应时出错:', error);
  }
}

// 获取API日志
function getApiLogs() {
  try {
    if (fs.existsSync(apiLogPath)) {
      const fileContent = fs.readFileSync(apiLogPath, 'utf8');
      if (fileContent) {
        return JSON.parse(fileContent);
      }
    }
    return [];
  } catch (error) {
    logger.error('读取API日志时出错:', error);
    return [];
  }
}

// 增强日志对象
const enhancedLogger = {
  ...logger,
  logApiResponse,
  getApiLogs
};

module.exports = enhancedLogger; 