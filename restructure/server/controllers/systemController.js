/**
 * 系统控制器
 * 处理系统状态和健康检查相关的请求
 */

const os = require('os');
const logger = require('../utils/logger');

/**
 * 健康检查
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
function healthCheck(req, res) {
  try {
    // 系统基本信息
    const systemInfo = {
      uptime: Math.floor(process.uptime()),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem()
      },
      cpu: os.cpus().length,
      platform: os.platform(),
      hostname: os.hostname()
    };
    
    // 返回健康状态
    return res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      system: systemInfo
    });
    
  } catch (error) {
    logger.error('健康检查失败', error);
    return res.status(500).json({ error: `健康检查失败: ${error.message}` });
  }
}

/**
 * 获取API日志
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
function getApiLogs(req, res) {
  try {
    // 获取API日志
    const logs = logger.getApiLogs();
    return res.json({ logs });
    
  } catch (error) {
    logger.error('获取API日志失败', error);
    return res.status(500).json({ error: `获取API日志失败: ${error.message}` });
  }
}

module.exports = {
  healthCheck,
  getApiLogs
}; 