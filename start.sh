#!/bin/bash
# ExcelAIFinder 一键启动脚本 (Linux/Mac)

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================"
echo -e "   ExcelAIFinder 一键启动脚本"
echo -e "========================================${NC}"

# 检查 Node.js 环境
echo -e "${YELLOW}检查 Node.js 环境...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ 未找到 Node.js，请先安装 Node.js 14.0.0 或更高版本${NC}"
    echo -e "${BLUE}下载地址: https://nodejs.org/${NC}"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✓ Node.js 版本: $NODE_VERSION${NC}"

# 检查 npm 环境
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ 未找到 npm${NC}"
    exit 1
fi

NPM_VERSION=$(npm --version)
echo -e "${GREEN}✓ npm 版本: $NPM_VERSION${NC}"

# 检查并创建服务器环境配置文件
echo -e "\n${YELLOW}检查服务器配置...${NC}"
if [ ! -f "server/.env" ]; then
    echo -e "${YELLOW}⚠ 未找到 server/.env 文件，正在创建...${NC}"
    
    if [ -f "server/env.example" ]; then
        cp "server/env.example" "server/.env"
        echo -e "${GREEN}✓ 已从 env.example 创建 .env 文件${NC}"
        
        # 修改端口为3000以匹配前端默认配置
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # Mac OS X
            sed -i '' 's/PORT=3001/PORT=3000/' "server/.env"
        else
            # Linux
            sed -i 's/PORT=3001/PORT=3000/' "server/.env"
        fi
        echo -e "${GREEN}✓ 已将端口设置为 3000${NC}"
    else
        echo -e "${YELLOW}创建默认 .env 文件...${NC}"
        cat > "server/.env" << 'EOF'
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
EOF
        echo -e "${GREEN}✓ 已创建默认 .env 文件${NC}"
    fi
    
    echo -e "${YELLOW}⚠ 请编辑 server/.env 文件，配置您的 API 密钥！${NC}"
    echo -e "${BLUE}   文件位置: server/.env${NC}"
    echo -e "${RED}   重要: 需要设置 SOPHNET_API_KEY 为您的真实API密钥${NC}"
else
    echo -e "${GREEN}✓ 找到 server/.env 配置文件${NC}"
fi

# 检查前端依赖
echo -e "\n${YELLOW}检查前端依赖...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}正在安装前端依赖...${NC}"
    npm install
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 前端依赖安装完成${NC}"
    else
        echo -e "${RED}✗ 前端依赖安装失败${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ 前端依赖已存在${NC}"
fi

# 检查后端依赖
echo -e "\n${YELLOW}检查后端依赖...${NC}"
if [ ! -d "server/node_modules" ]; then
    echo -e "${YELLOW}正在安装后端依赖...${NC}"
    cd server
    npm install
    cd ..
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 后端依赖安装完成${NC}"
    else
        echo -e "${RED}✗ 后端依赖安装失败${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ 后端依赖已存在${NC}"
fi

# 创建必要的目录
echo -e "\n${YELLOW}创建必要目录...${NC}"
for dir in "server/uploads" "server/logs"; do
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        echo -e "${GREEN}✓ 创建目录: $dir${NC}"
    fi
done

# 检查端口占用
echo -e "\n${YELLOW}检查端口占用...${NC}"

# 检查 3000 端口
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠ 端口 3000 已被占用，可能需要手动停止相关进程${NC}"
    lsof -Pi :3000 -sTCP:LISTEN
fi

# 检查 8080 端口
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠ 端口 8080 已被占用，可能需要手动停止相关进程${NC}"
    lsof -Pi :8080 -sTCP:LISTEN
fi

# 启动确认
echo -e "\n${CYAN}========================================"
echo -e "准备启动 ExcelAIFinder 应用程序"
echo -e "${BLUE}前端: http://localhost:8080"
echo -e "后端: http://localhost:3000"
echo -e "${CYAN}========================================${NC}"

echo -en "\n是否现在启动应用? (Y/n): "
read -r confirmation

if [[ "$confirmation" == "" || "$confirmation" == "Y" || "$confirmation" == "y" ]]; then
    echo -e "\n${GREEN}正在启动应用程序...${NC}"
    echo -e "${BLUE}启动命令: npm run dev${NC}"
    echo -e "${YELLOW}按 Ctrl+C 可停止所有服务${NC}"
    echo ""
    
    # 启动应用
    npm run dev
else
    echo -e "\n${YELLOW}取消启动。您可以稍后运行以下命令启动应用:${NC}"
    echo -e "${BLUE}npm run dev${NC}"
    echo -e "\n${YELLOW}或分别启动:${NC}"
    echo -e "${BLUE}前端: npm run serve${NC}"
    echo -e "${BLUE}后端: npm run server:dev${NC}"
fi

echo -e "\n${GREEN}启动脚本执行完成！${NC}" 