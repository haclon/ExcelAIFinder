/**
 * ExcelAIFinder 生产环境构建脚本
 * 构建前端应用并为部署做准备
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('============================================');
console.log('     ExcelAIFinder 生产环境构建                 ');
console.log('============================================');

// 确保目标目录存在
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`创建目录: ${dirPath}`);
  }
}

// 复制文件
function copyFile(source, target) {
  fs.copyFileSync(source, target);
  console.log(`复制文件: ${source} -> ${target}`);
}

// 构建前端应用
function buildFrontend() {
  console.log('正在构建前端应用...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('前端应用构建成功');
    return true;
  } catch (error) {
    console.error('前端应用构建失败:', error);
    return false;
  }
}

// 准备服务器文件
function prepareServer() {
  console.log('正在准备服务器文件...');
  
  const serverDir = path.join(__dirname, '..', 'server');
  const distDir = path.join(__dirname, '..', 'dist');
  const deployDir = path.join(__dirname, '..', 'deploy');
  
  // 确保部署目录存在
  ensureDirectoryExists(deployDir);
  
  // 复制服务器文件
  try {
    // 复制服务器核心文件
    copyFile(
      path.join(serverDir, 'index.js'),
      path.join(deployDir, 'index.js')
    );
    
    // 复制package.json并修改
    const packageJson = require(path.join(serverDir, 'package.json'));
    // 移除开发依赖，只保留生产依赖
    delete packageJson.devDependencies;
    // 修改启动脚本
    packageJson.scripts = {
      start: 'node index.js'
    };
    // 写入修改后的package.json
    fs.writeFileSync(
      path.join(deployDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    console.log('创建生产环境package.json');
    
    // 复制.env.example文件
    if (fs.existsSync(path.join(serverDir, '.env.example'))) {
      copyFile(
        path.join(serverDir, '.env.example'),
        path.join(deployDir, '.env.example')
      );
    } else {
      // 创建一个.env.example文件
      const envExample = 
`# SophNet API配置
SOPHNET_API_URL=https://api.example.com/v1/chat/completions
SOPHNET_API_KEY=your_api_key_here
SOPHNET_MODEL=DeepSeek-R1
SOPHNET_MAX_TOKENS=32768`;
      
      fs.writeFileSync(path.join(deployDir, '.env.example'), envExample);
      console.log('创建.env.example配置示例');
    }
    
    // 创建uploads目录
    ensureDirectoryExists(path.join(deployDir, 'uploads'));
    
    // 创建logs目录
    ensureDirectoryExists(path.join(deployDir, 'logs'));
    
    // 复制前端构建文件
    ensureDirectoryExists(path.join(deployDir, 'public'));
    
    // 复制dist目录下所有文件到public目录
    if (fs.existsSync(distDir)) {
      const files = fs.readdirSync(distDir);
      files.forEach(file => {
        const sourcePath = path.join(distDir, file);
        const targetPath = path.join(deployDir, 'public', file);
        
        if (fs.statSync(sourcePath).isDirectory()) {
          // 递归复制目录
          const copyDir = (src, dest) => {
            ensureDirectoryExists(dest);
            const dirFiles = fs.readdirSync(src);
            dirFiles.forEach(f => {
              const srcPath = path.join(src, f);
              const destPath = path.join(dest, f);
              if (fs.statSync(srcPath).isDirectory()) {
                copyDir(srcPath, destPath);
              } else {
                copyFile(srcPath, destPath);
              }
            });
          };
          
          copyDir(sourcePath, targetPath);
        } else {
          copyFile(sourcePath, targetPath);
        }
      });
      console.log('前端构建文件复制完成');
    } else {
      console.warn('警告: 前端构建目录不存在，请先构建前端应用');
      return false;
    }
    
    // 创建启动说明
    const readmeContent = 
`# ExcelAIFinder 部署指南

## 安装步骤

1. 安装依赖
\`\`\`
npm install
\`\`\`

2. 配置环境变量
\`\`\`
cp .env.example .env
\`\`\`
然后编辑.env文件，填入您的API配置

3. 启动服务
\`\`\`
npm start
\`\`\`

4. 访问应用
打开浏览器访问: http://localhost:3000

## 目录结构
- /public - 前端静态文件
- /uploads - 临时上传文件目录
- /logs - 日志目录

## 配置说明
可在.env文件中配置以下参数:
- SOPHNET_API_URL - API 地址
- SOPHNET_API_KEY - API 密钥
- SOPHNET_MODEL - 使用的模型名称
- SOPHNET_MAX_TOKENS - 最大token数量

## 注意事项
- 上传的Excel文件会临时存储在uploads目录，处理完成后自动删除
- API调用日志保存在logs目录
`;
    
    fs.writeFileSync(
      path.join(deployDir, 'README.md'),
      readmeContent
    );
    console.log('创建部署说明文档');
    
    return true;
  } catch (error) {
    console.error('准备服务器文件失败:', error);
    return false;
  }
}

// 主构建流程
async function build() {
  let success = true;
  
  // 构建前端
  if (!buildFrontend()) {
    success = false;
  }
  
  // 准备服务器文件
  if (!prepareServer()) {
    success = false;
  }
  
  if (success) {
    console.log('============================================');
    console.log('构建成功! 部署文件已准备好，位于 ./deploy 目录');
    console.log('============================================');
    console.log('部署步骤:');
    console.log('1. 复制 ./deploy 目录到您的服务器');
    console.log('2. 运行 "npm install" 安装依赖');
    console.log('3. 复制 .env.example 为 .env 并填入您的API配置');
    console.log('4. 运行 "npm start" 启动服务');
    console.log('5. 访问 http://your-server:3000');
    console.log('============================================');
  } else {
    console.error('============================================');
    console.error('构建过程中出现错误，请查看上方日志');
    console.error('============================================');
    process.exit(1);
  }
}

// 执行构建
build(); 