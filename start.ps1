#!/usr/bin/env pwsh
# ExcelAIFinder 一键启动脚本 (PowerShell)
# 支持 Windows PowerShell 和 PowerShell Core

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   ExcelAIFinder 一键启动脚本" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan

# 检查 Node.js 环境
Write-Host "检查 Node.js 环境..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js 版本: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ 未找到 Node.js，请先安装 Node.js 14.0.0 或更高版本" -ForegroundColor Red
    Write-Host "下载地址: https://nodejs.org/" -ForegroundColor Blue
    exit 1
}

# 检查 npm 环境
try {
    $npmVersion = npm --version
    Write-Host "✓ npm 版本: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ 未找到 npm" -ForegroundColor Red
    exit 1
}

# 检查并创建服务器环境配置文件
Write-Host "`n检查服务器配置..." -ForegroundColor Yellow
if (-not (Test-Path "server\.env")) {
    Write-Host "⚠ 未找到 server/.env 文件，正在创建..." -ForegroundColor Yellow
    
    if (Test-Path "server\env.example") {
        Copy-Item "server\env.example" "server\.env"
        Write-Host "✓ 已从 env.example 创建 .env 文件" -ForegroundColor Green
        
        # 修改端口为3000以匹配前端默认配置
        $envContent = Get-Content "server\.env" -Raw
        $envContent = $envContent -replace "PORT=3001", "PORT=3000"
        Set-Content "server\.env" -Value $envContent -Encoding UTF8
        Write-Host "✓ 已将端口设置为 3000" -ForegroundColor Green
    } else {
        Write-Host "创建默认 .env 文件..." -ForegroundColor Yellow
        $defaultEnv = @"
# Excel AI Finder 服务器配置
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
"@
        Set-Content "server\.env" -Value $defaultEnv -Encoding UTF8
        Write-Host "✓ 已创建默认 .env 文件" -ForegroundColor Green
    }
    
    Write-Host "⚠ 请编辑 server/.env 文件，配置您的 API 密钥！" -ForegroundColor Yellow
    Write-Host "   文件位置: server\.env" -ForegroundColor Blue
    Write-Host "   重要: 需要设置 SOPHNET_API_KEY 为您的真实API密钥" -ForegroundColor Red
} else {
    Write-Host "✓ 找到 server/.env 配置文件" -ForegroundColor Green
}

# 检查前端依赖
Write-Host "`n检查前端依赖..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "正在安装前端依赖..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ 前端依赖安装完成" -ForegroundColor Green
    } else {
        Write-Host "✗ 前端依赖安装失败" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✓ 前端依赖已存在" -ForegroundColor Green
}

# 检查后端依赖
Write-Host "`n检查后端依赖..." -ForegroundColor Yellow
if (-not (Test-Path "server\node_modules")) {
    Write-Host "正在安装后端依赖..." -ForegroundColor Yellow
    Set-Location "server"
    npm install
    Set-Location ".."
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ 后端依赖安装完成" -ForegroundColor Green
    } else {
        Write-Host "✗ 后端依赖安装失败" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✓ 后端依赖已存在" -ForegroundColor Green
}

# 创建必要的目录
Write-Host "`n创建必要目录..." -ForegroundColor Yellow
$directories = @("server\uploads", "server\logs")
foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "✓ 创建目录: $dir" -ForegroundColor Green
    }
}

# 检查端口占用
Write-Host "`n检查端口占用..." -ForegroundColor Yellow
$port3000 = netstat -an | Select-String ":3000.*LISTENING"
$port8080 = netstat -an | Select-String ":8080.*LISTENING"

if ($port3000) {
    Write-Host "⚠ 端口 3000 已被占用，可能需要手动停止相关进程" -ForegroundColor Yellow
    Write-Host "   占用情况: $port3000" -ForegroundColor Blue
}

if ($port8080) {
    Write-Host "⚠ 端口 8080 已被占用，可能需要手动停止相关进程" -ForegroundColor Yellow
    Write-Host "   占用情况: $port8080" -ForegroundColor Blue
}

# 启动确认
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "准备启动 ExcelAIFinder 应用程序" -ForegroundColor Cyan
Write-Host "前端: http://localhost:8080" -ForegroundColor Blue
Write-Host "后端: http://localhost:3000" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Cyan

$confirmation = Read-Host "是否现在启动应用? (Y/n)"
if ($confirmation -eq "" -or $confirmation -eq "Y" -or $confirmation -eq "y") {
    Write-Host "`n正在启动应用程序..." -ForegroundColor Green
    
    # 使用 npm run dev 启动前后端
    Write-Host "启动命令: npm run dev" -ForegroundColor Blue
    Write-Host "按 Ctrl+C 可停止所有服务" -ForegroundColor Yellow
    Write-Host "`n" -ForegroundColor White
    
    # 启动应用
    npm run dev
} else {
    Write-Host "`n取消启动。您可以稍后运行以下命令启动应用:" -ForegroundColor Yellow
    Write-Host "npm run dev" -ForegroundColor Blue
    Write-Host "`n或分别启动:" -ForegroundColor Yellow
    Write-Host "前端: npm run serve" -ForegroundColor Blue
    Write-Host "后端: npm run server:dev" -ForegroundColor Blue
}

Write-Host "`n启动脚本执行完成！" -ForegroundColor Green 