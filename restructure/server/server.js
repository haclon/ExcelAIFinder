/**
 * 服务器入口文件
 * 负责启动HTTP服务
 */

const http = require('http');
const app = require('./app');
const config = require('./config/default');
const logger = require('./utils/logger');

// 设置端口
const port = parseInt(process.env.PORT || config.port, 10);
app.set('port', port);

// 创建HTTP服务器
const server = http.createServer(app);

// 监听指定端口
server.listen(port);

// 服务器事件处理
server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

  // 处理特定的监听错误
  switch (error.code) {
    case 'EACCES':
      logger.error(`${bind} 需要更高权限`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(`${bind} 已被占用`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

server.on('listening', () => {
  const addr = server.address();
  const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
  logger.info(`服务器监听在 ${bind}`);
  console.log(`服务器已启动，监听在端口 ${port}`);
  console.log(`打开浏览器访问: http://localhost:${port}`);
});

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常:', error);
  console.error('未捕获的异常:', error);
});

// 处理未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的Promise拒绝:', reason);
  console.error('未处理的Promise拒绝:', reason);
}); 