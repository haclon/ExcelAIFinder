@echo off
echo ============================================
echo        ExcelAIFinder 服务启动脚本 (Windows)
echo ============================================

REM 启动后端服务
echo 正在启动后端服务...
start cmd /c "cd server && node index.js"

REM 等待2秒确保后端先启动
timeout /t 2 > nul

REM 启动前端服务
echo 正在启动前端服务...
start cmd /c "npm run serve"

echo ============================================
echo 服务启动完成!
echo 请访问:
echo    前端开发服务: http://localhost:8080
echo    后端API: http://localhost:3000
echo ============================================ 