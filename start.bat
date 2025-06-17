@echo off
chcp 65001 >nul
title ExcelAIFinder

echo ========================================
echo    ExcelAIFinder 启动脚本
echo ========================================
echo.

echo 步骤1: 检查Node.js
call node --version
echo.
echo 步骤2: 检查npm  
call npm --version
echo.
echo 步骤3: 显示菜单

echo.
echo 选择启动方式:
echo 1. 启动前后端
echo 2. 启动前端
echo 3. 启动后端
echo.

set /p choice=请选择 (1-3): 

if "%choice%"=="1" (
    echo 正在启动前后端...
    npm run dev
)
if "%choice%"=="2" (
    echo 正在启动前端...
    npm run serve
)
if "%choice%"=="3" (
    echo 正在启动后端...
    npm run server:dev
)

echo.
pause 