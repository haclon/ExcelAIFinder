/**
 * 配置控制器
 * 处理API配置相关的请求
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const logger = require('../utils/logger');
const { testConnection } = require('../services/ai');
const { writeJsonToFile } = require('../utils/file');

// 环境变量文件路径
const envFilePath = path.resolve(process.cwd(), '.env');

/**
 * 获取API配置
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
function getApiConfig(req, res) {
  try {
    // 重新读取.env文件以获取最新配置
    const envConfig = dotenv.config({ path: envFilePath }).parsed || {};
    
    // 返回配置（过滤敏感信息）
    const config = {
      SOPHNET_API_URL: envConfig.API_URL || '',
      SOPHNET_API_KEY: envConfig.API_KEY ? '********' : '', // 不返回实际API密钥
      SOPHNET_MODEL: envConfig.API_MODEL || 'DeepSeek-R1',
      SOPHNET_MAX_TOKENS: envConfig.API_MAX_TOKENS || '32768'
    };
    
    return res.json({ config });
    
  } catch (error) {
    logger.error('获取API配置失败', error);
    return res.status(500).json({ error: `获取配置失败: ${error.message}` });
  }
}

/**
 * 更新API配置
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
function updateApiConfig(req, res) {
  try {
    // 验证必要的参数
    const { SOPHNET_API_URL, SOPHNET_API_KEY } = req.body;
    
    if (!SOPHNET_API_URL && !SOPHNET_API_KEY) {
      return res.status(400).json({ error: '至少需要提供API URL或API密钥' });
    }
    
    // 读取现有配置
    let envConfig = {};
    if (fs.existsSync(envFilePath)) {
      envConfig = dotenv.config({ path: envFilePath }).parsed || {};
    }
    
    // 更新配置
    if (SOPHNET_API_URL !== undefined) {
      envConfig.API_URL = SOPHNET_API_URL;
    }
    
    if (SOPHNET_API_KEY !== undefined && SOPHNET_API_KEY !== '********') {
      envConfig.API_KEY = SOPHNET_API_KEY;
    }
    
    if (req.body.SOPHNET_MODEL) {
      envConfig.API_MODEL = req.body.SOPHNET_MODEL;
    }
    
    if (req.body.SOPHNET_MAX_TOKENS) {
      envConfig.API_MAX_TOKENS = req.body.SOPHNET_MAX_TOKENS;
    }
    
    // 生成.env文件内容
    const envContent = Object.entries(envConfig)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    // 写入.env文件
    fs.writeFileSync(envFilePath, envContent);
    
    // 更新进程环境变量
    Object.entries(envConfig).forEach(([key, value]) => {
      process.env[key] = value;
    });
    
    logger.info('API配置已更新');
    return res.json({ success: true });
    
  } catch (error) {
    logger.error('更新API配置失败', error);
    return res.status(500).json({ error: `更新配置失败: ${error.message}` });
  }
}

/**
 * 测试API连接
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function testApiConnection(req, res) {
  try {
    // 如果请求中提供了配置，临时设置环境变量进行测试
    const originalEnv = {
      API_URL: process.env.API_URL,
      API_KEY: process.env.API_KEY,
      API_MODEL: process.env.API_MODEL
    };
    
    if (req.body.SOPHNET_API_URL) {
      process.env.API_URL = req.body.SOPHNET_API_URL;
    }
    
    if (req.body.SOPHNET_API_KEY && req.body.SOPHNET_API_KEY !== '********') {
      process.env.API_KEY = req.body.SOPHNET_API_KEY;
    }
    
    if (req.body.SOPHNET_MODEL) {
      process.env.API_MODEL = req.body.SOPHNET_MODEL;
    }
    
    // 测试连接
    const testResult = await testConnection();
    
    // 恢复原始环境变量
    Object.entries(originalEnv).forEach(([key, value]) => {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    });
    
    // 返回测试结果
    if (testResult.success) {
      logger.info('API连接测试成功');
      return res.json({ success: true, message: testResult.message });
    } else {
      logger.warn(`API连接测试失败: ${testResult.message}`);
      return res.json({ success: false, error: testResult.message });
    }
    
  } catch (error) {
    logger.error('API连接测试失败', error);
    return res.status(500).json({ error: `测试连接失败: ${error.message}` });
  }
}

module.exports = {
  getApiConfig,
  updateApiConfig,
  testApiConnection
};