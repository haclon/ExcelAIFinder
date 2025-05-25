/**
 * 文件上传中间件
 * 处理Excel文件上传
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config/default');
const { ensureDirectoryExists } = require('../utils/file');
const logger = require('../utils/logger');

// 确保上传目录存在
ensureDirectoryExists(config.upload.directory);

// 配置multer存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.upload.directory);
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
  // 检查MIME类型
  const isAllowedMimeType = config.upload.allowedMimeTypes.includes(file.mimetype);
  
  // 检查文件扩展名
  const ext = path.extname(file.originalname).toLowerCase();
  const isAllowedExtension = config.upload.allowedTypes.includes(ext);
  
  if (isAllowedMimeType || isAllowedExtension) {
    cb(null, true);
  } else {
    logger.warn(`拒绝上传不支持的文件类型: ${file.originalname} (${file.mimetype})`);
    cb(new Error('只允许上传Excel文件 (.xlsx, .xls)'));
  }
};

// 配置multer上传中间件
const uploadMiddleware = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize, // 限制文件大小
    files: config.upload.maxFiles // 最多可上传文件数
  }
});

module.exports = uploadMiddleware; 