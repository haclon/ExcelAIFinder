const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log('   ExcelAIFinder 环境配置设置');
console.log('========================================');

// 检查并创建server/.env文件
const serverEnvPath = path.join(__dirname, '..', 'server', '.env');
const serverEnvExamplePath = path.join(__dirname, '..', 'server', 'env.example');

if (!fs.existsSync(serverEnvPath)) {
  console.log('⚠ 未找到 server/.env 文件，正在创建...');
  
  if (fs.existsSync(serverEnvExamplePath)) {
    // 复制并修改env.example
    let envContent = fs.readFileSync(serverEnvExamplePath, 'utf8');
    envContent = envContent.replace('PORT=3001', 'PORT=3000');
    
    fs.writeFileSync(serverEnvPath, envContent, 'utf8');
    console.log('✓ 已从 env.example 创建 .env 文件');
    console.log('✓ 已将端口设置为 3000');
  } else {
    // 创建默认.env文件
    const defaultEnv = `# Excel AI Finder 服务器配置
PORT=3000
NODE_ENV=development

# SophNet AI API配置 (用于语义分析)
SOPHNET_API_URL=https://www.sophnet.com/api/open-apis/v1/chat/completions
SOPHNET_API_KEY=your_sophnet_api_key_here
SOPHNET_MODEL=DeepSeek-R1
SOPHNET_MAX_TOKENS=32768

# 文件上传配置
MAX_FILE_SIZE=50MB
UPLOAD_PATH=./uploads

# 日志配置
LOG_LEVEL=info
LOG_FILE=./logs/app.log

# CORS配置 (Vue前端默认端口)
CORS_ORIGIN=http://localhost:8080
`;
    
    fs.writeFileSync(serverEnvPath, defaultEnv, 'utf8');
    console.log('✓ 已创建默认 .env 文件');
  }
  
  console.log('⚠ 请编辑 server/.env 文件，配置您的 API 密钥！');
  console.log('   文件位置: server/.env');
  console.log('   重要: 需要设置 SOPHNET_API_KEY 为您的真实API密钥');
} else {
  console.log('✓ 找到 server/.env 配置文件');
}

// 创建必要的目录
const directories = [
  path.join(__dirname, '..', 'server', 'uploads'),
  path.join(__dirname, '..', 'server', 'logs')
];

console.log('\n创建必要目录...');
directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✓ 创建目录: ${path.relative(path.join(__dirname, '..'), dir)}`);
  }
});

console.log('\n环境配置设置完成！');
console.log('\n下一步：');
console.log('1. 编辑 server/.env 文件，设置您的 API 密钥');
console.log('2. 运行 npm run dev 启动应用程序');
console.log('   或者使用一键启动脚本：');
console.log('   - Windows: 双击 start.bat 或运行 start.ps1');
console.log('   - Linux/Mac: ./start.sh'); 