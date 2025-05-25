/**
 * ExcelAIFinder 启动脚本
 * 自动检测操作系统并使用合适的命令启动前后端服务
 */

const { spawn, exec } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

// 确定是否为Windows系统
const isWindows = os.platform() === 'win32';
// 确定是否为PowerShell
const isPowerShell = process.env.PSModulePath !== undefined;

console.log('============================================');
console.log('      启动 ExcelAIFinder 服务                  ');
console.log('============================================');
console.log(`操作系统: ${os.platform()} (${isWindows ? 'Windows' : 'Unix-like'})`);
console.log(`Shell环境: ${isPowerShell ? 'PowerShell' : 'CMD/Bash'}`);
console.log('============================================');

// 启动后端服务
function startBackend() {
  console.log('正在启动后端服务...');
  
  let serverProcess;
  
  if (isWindows) {
    if (isPowerShell) {
      // PowerShell方式启动
      serverProcess = spawn('powershell.exe', ['-Command', 'cd server; node index.js']);
    } else {
      // CMD方式启动
      serverProcess = spawn('cmd.exe', ['/c', 'cd server && node index.js']);
    }
  } else {
    // Unix-like系统启动
    serverProcess = spawn('sh', ['-c', 'cd server && node index.js']);
  }
  
  serverProcess.stdout.on('data', (data) => {
    console.log(`后端: ${data}`);
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.error(`后端错误: ${data}`);
  });
  
  serverProcess.on('close', (code) => {
    console.log(`后端服务已退出，退出码: ${code}`);
    process.exit(code);
  });
  
  return serverProcess;
}

// 启动前端服务
function startFrontend() {
  console.log('正在启动前端服务...');
  
  let frontendProcess;
  
  if (isWindows) {
    if (isPowerShell) {
      // PowerShell方式启动
      frontendProcess = spawn('powershell.exe', ['-Command', 'npm run serve']);
    } else {
      // CMD方式启动
      frontendProcess = spawn('cmd.exe', ['/c', 'npm run serve']);
    }
  } else {
    // Unix-like系统启动
    frontendProcess = spawn('sh', ['-c', 'npm run serve']);
  }
  
  frontendProcess.stdout.on('data', (data) => {
    console.log(`前端: ${data}`);
  });
  
  frontendProcess.stderr.on('data', (data) => {
    console.error(`前端错误: ${data}`);
  });
  
  frontendProcess.on('close', (code) => {
    console.log(`前端服务已退出，退出码: ${code}`);
  });
  
  return frontendProcess;
}

// 检查.env文件是否存在，没有则创建示例配置
function checkEnvFile() {
  const envPath = path.join(__dirname, '..', 'server', '.env');
  const envExamplePath = path.join(__dirname, '..', 'server', '.env.example');
  
  if (!fs.existsSync(envPath)) {
    console.log('警告: .env文件不存在，创建默认配置示例');
    
    // 创建示例配置内容
    const exampleContent = 
`# SophNet API配置
SOPHNET_API_URL=https://api.example.com/v1/chat/completions
SOPHNET_API_KEY=your_api_key_here
SOPHNET_MODEL=DeepSeek-R1
SOPHNET_MAX_TOKENS=32768`;

    // 写入示例配置
    try {
      fs.writeFileSync(envExamplePath, exampleContent);
      console.log(`已创建示例配置: ${envExamplePath}`);
      console.log('请复制并重命名为.env，然后填入您的实际API配置');
    } catch (err) {
      console.error('创建示例配置文件失败:', err);
    }
  }
}

// 启动应用
function startApp() {
  // 检查环境配置
  checkEnvFile();
  
  // 启动后端
  const serverProcess = startBackend();
  
  // 等待1秒后启动前端，确保后端先启动
  setTimeout(() => {
    const frontendProcess = startFrontend();
    
    // 处理进程退出
    process.on('SIGINT', () => {
      console.log('正在关闭服务...');
      frontendProcess.kill();
      serverProcess.kill();
      process.exit(0);
    });
    
  }, 1000);
}

// 启动应用
startApp(); 