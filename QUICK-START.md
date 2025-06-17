# ExcelAIFinder 快速启动指南

## 🚀 一键启动

我们提供了多种一键启动方式，选择适合您系统的方式：

### Windows 用户

#### 方式1: 批处理脚本（推荐）
```cmd
双击 start.bat 文件
```

#### 方式2: PowerShell 脚本
```powershell
.\start.ps1
```

#### 方式3: 命令行
```cmd
npm run quick-start
```

### Linux/Mac 用户

#### 方式1: Shell 脚本（推荐）
```bash
./start.sh
```

#### 方式2: 命令行
```bash
npm run quick-start
```

## ⚙️ 脚本功能

所有启动脚本都会自动完成以下操作：

1. ✅ **环境检查** - 检查 Node.js 和 npm 版本
2. ✅ **配置创建** - 自动创建 `server/.env` 配置文件
3. ✅ **依赖安装** - 安装前端和后端依赖包
4. ✅ **目录创建** - 创建必要的目录（uploads, logs）
5. ✅ **端口检查** - 检查端口占用情况
6. ✅ **应用启动** - 同时启动前端和后端服务

## 🔧 手动配置（如需要）

### 1. 环境配置
```bash
# 设置环境
npm run setup

# 或单独安装依赖
npm run install:all
```

### 2. 配置API密钥
编辑 `server/.env` 文件：
```env
SOPHNET_API_KEY=your_real_api_key_here
```

### 3. 启动服务
```bash
# 同时启动前后端
npm run dev

# 或分别启动
npm run frontend  # 前端 (端口8080)
npm run backend   # 后端 (端口3000)
```

## 🌐 访问应用

启动成功后，在浏览器中访问：
- **前端界面**: http://localhost:8080
- **后端API**: http://localhost:3000

## 🛠️ 常用命令

```bash
# 快速启动（推荐新用户）
npm run quick-start

# 开发模式启动
npm run dev

# 只启动前端
npm run frontend

# 只启动后端  
npm run backend

# 环境设置
npm run setup

# 清理并重新安装
npm run reset
```

## ❓ 常见问题

### Q: 端口被占用怎么办？
**A**: 脚本会自动检测端口占用。如果被占用，请：
- 关闭占用端口的程序
- 或修改 `server/.env` 中的 `PORT` 设置

### Q: API连接测试失败？
**A**: 请确保：
1. 已正确配置 `SOPHNET_API_KEY`
2. 网络连接正常
3. API密钥有效且有余额

### Q: 依赖安装失败？
**A**: 尝试：
```bash
# 清理并重新安装
npm run reset

# 或手动清理
npm run clean     # Linux/Mac
npm run clean:win # Windows
```

### Q: 如何停止服务？
**A**: 在终端中按 `Ctrl+C` 停止所有服务

## 📝 注意事项

1. 首次使用必须配置API密钥
2. 确保Node.js版本 >= 14.0.0
3. 确保端口3000和8080未被占用
4. 网络环境需要能访问SophNet API

## 🔄 更新应用

拉取最新代码后，运行：
```bash
npm run setup  # 更新依赖和配置
npm run dev    # 启动应用
```

---

**享受使用 ExcelAIFinder！** 🎉 