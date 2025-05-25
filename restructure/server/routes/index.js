/**
 * 路由模块
 * 集中管理所有API路由
 */

const express = require('express');
const router = express.Router();
const uploadMiddleware = require('../middleware/upload');
const fileController = require('../controllers/fileController');
const configController = require('../controllers/configController');
const systemController = require('../controllers/systemController');

// 系统相关路由
router.get('/health', systemController.healthCheck);
router.get('/logs', systemController.getApiLogs);

// 文件上传和分析相关路由
router.post('/upload-and-analyze', uploadMiddleware.array('files'), fileController.uploadAndAnalyze);

// API配置相关路由
router.get('/config', configController.getApiConfig);
router.post('/config', configController.updateApiConfig);
router.post('/test-connection', configController.testApiConnection);

module.exports = router; 