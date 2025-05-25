/**
 * Express应用程序主文件
 * 负责配置和启动Express服务器
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');
const { ensureDirectoryExists } = require('./utils/file');
const config = require('./config/default');
const routes = require('./routes');
const logger = require('./utils/logger');

// 加载环境变量
dotenv.config();

// 创建Express应用
const app = express();

// 确保上传和日志目录存在
ensureDirectoryExists(config.upload.directory);
ensureDirectoryExists(path.join(__dirname, 'logs'));

// 配置中间件
app.use(cors({
  origin: config.server.corsOrigins
}));

// JSON解析中间件
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// 请求日志
app.use(morgan('dev'));

// 静态文件服务 - 前端资源
app.use(express.static(path.join(__dirname, 'public')));

// API路由
app.use('/api', routes);

// 错误处理中间件
app.use((err, req, res, next) => {
  logger.error('应用程序错误', err);
  res.status(err.status || 500).json({
    error: err.message || '服务器内部错误'
  });
});

// 未找到路由处理
app.use((req, res) => {
  res.status(404).json({
    error: '未找到请求的资源'
  });
});

module.exports = app; 