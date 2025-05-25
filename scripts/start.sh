#!/bin/bash
echo "============================================"
echo "      ExcelAIFinder 服务启动脚本 (Unix-like)"
echo "============================================"

# 启动后端服务
echo "正在启动后端服务..."
cd server && node index.js &
SERVER_PID=$!

# 等待2秒确保后端先启动
sleep 2

# 启动前端服务
echo "正在启动前端服务..."
cd ..
npm run serve &
FRONTEND_PID=$!

echo "============================================"
echo "服务启动完成!"
echo "请访问:"
echo "   前端开发服务: http://localhost:8080"
echo "   后端API: http://localhost:3000"
echo "============================================"
echo "注意: 按 Ctrl+C 关闭所有服务"

# 处理进程终止
trap "kill $SERVER_PID $FRONTEND_PID; exit" INT TERM

# 等待子进程结束
wait 