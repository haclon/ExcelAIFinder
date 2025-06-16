# ExcelAIFinder - Excel内容智能查找工具

![版本](https://img.shields.io/badge/版本-V1.0.0-blue)
![许可证](https://img.shields.io/badge/许可证-MIT-green)
![语言](https://img.shields.io/badge/语言-JavaScript-yellow)
![平台](https://img.shields.io/badge/平台-跨平台-orange)

## 项目简介

ExcelAIFinder 是一款基于AI技术的Excel内容智能查找工具，支持批量处理文件、精确匹配和语义理解搜索。通过集成SophNet AI服务，系统能够理解搜索意图，提供比传统关键字搜索更智能的内容检索功能。

## 核心功能

### 🔍 智能内容搜索
- **精确匹配**：传统关键字搜索，快速定位包含特定文本的单元格
- **语义理解**：使用AI模型分析内容语义，理解搜索意图
- **混合模式**：结合精确匹配和语义分析，提供最佳搜索结果

### 📊 Excel文件处理
- **批量处理**：支持同时处理多个Excel文件
- **多格式支持**：兼容.xlsx和.xls格式
- **工作表分析**：逐个工作表进行内容分析
- **大文件优化**：支持处理大型Excel文件（最大50MB）

### 🤖 AI 智能分析
- **SophNet API集成**：使用DeepSeek-R1/v3等先进模型
- **相关度评分**：为每个匹配结果提供0-100的相关度分数
- **智能优化**：自动跳过高匹配度内容的AI分析，节约Token消耗
- **批量优化**：支持设置批处理限制，避免超时

### 📈 结果展示与导出
- **详细结果显示**：显示匹配位置、工作表名称、具体内容
- **相关度排序**：按匹配程度对结果进行智能排序
- **导出功能**：支持将搜索结果导出为CSV格式
- **进度跟踪**：实时显示批量处理进度

## 系统架构

```
excel-ai-finder/
├── src/                    # Vue前端应用
│   ├── components/         # Vue组件
│   │   └── ExcelContentFinder.vue  # 主功能组件
│   ├── App.vue            # 应用入口
│   └── main.js            # 主脚本
├── server/                # Node.js后端服务
│   ├── index.js           # 主服务文件（ExcelAIFinder入口）
│   ├── app.js             # 备用服务文件
│   ├── routes/            # API路由
│   │   ├── ai.js          # AI服务接口
│   │   └── project.js     # 项目管理接口
│   ├── uploads/           # 文件上传目录
│   ├── logs/              # 日志文件
│   └── package.json       # 后端依赖
├── restructure/           # 重构版本（可选）
│   └── server/            # 模块化后端架构
├── public/                # 静态资源
└── README.md             # 项目说明
```

## 技术栈

### 前端技术
- **Vue 2.6.14**：渐进式JavaScript框架
- **Element UI 2.15.13**：企业级UI组件库
- **Axios**：HTTP客户端库
- **Vue CLI 5**：前端构建工具

### 后端技术
- **Node.js**：JavaScript运行时环境
- **Express 4.18.2**：Web应用框架
- **XLSX.js 0.18.5**：Excel文件处理库
- **Multer**：文件上传中间件
- **Winston**：日志记录系统

### AI集成
- **SophNet API**：主要AI服务提供商
- **DeepSeek模型**：支持DeepSeek-R1、DeepSeek-v3等模型
- **智能优化**：Token使用优化和批处理策略

## 快速开始

### 环境要求
- Node.js >= 14.0.0
- npm >= 6.0.0
- 现代浏览器（Chrome、Firefox、Safari、Edge）

### 安装步骤

1. **克隆项目**
```bash
git clone git@github.com:haclon/ExcelAIFinder.git
cd ExcelAIFinder
```

2. **安装依赖**
```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server
npm install

# 返回项目根目录
cd ..
```

3. **配置环境变量**
```bash
# 复制环境变量模板
cp server/env.example server/.env

# 编辑环境变量文件，配置API密钥
# Windows: notepad server/.env
# Linux/Mac: nano server/.env
```

4. **启动服务**

**方式1：同时启动前端和后端（推荐）**
```bash
# 安装Vue CLI服务（如果还没有）
npm install

# 同时启动前端(8080端口)和后端(3001端口)
npm run dev
```

**方式2：分别启动前端和后端**
```bash
# 终端1：启动后端服务
npm run server:dev

# 终端2：启动前端开发服务器
npm run serve
```

**方式3：仅启动后端API服务**
```bash
# Windows PowerShell:
cd server
node index.js

# Linux/Mac:
cd server && node index.js
```

5. **访问应用**
- 前端应用：http://localhost:8080 （Vue开发服务器）
- 后端API：http://localhost:3001 （Express服务器）
- API测试：http://localhost:3001/api/config

### 环境配置

编辑 `server/.env` 文件，配置以下参数：

```env
# Excel AI Finder 服务器配置
PORT=3001
NODE_ENV=development

# SophNet AI API配置 (用于语义分析)
SOPHNET_API_URL=https://www.sophnet.com/api/open-apis/v1/chat/completions
SOPHNET_API_KEY=your_sophnet_api_key
SOPHNET_MODEL=DeepSeek-R1
SOPHNET_MAX_TOKENS=32768

# 备用AI模型配置（可选）
DEEPSEEK_API_KEY=your_deepseek_api_key_here  
DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions
DEEPSEEK_MODEL=deepseek-chat

# 文件上传配置
MAX_FILE_SIZE=50MB
UPLOAD_PATH=./uploads

# 日志配置
LOG_LEVEL=info
LOG_FILE=./logs/app.log

# CORS配置 (Vue前端默认端口)
CORS_ORIGIN=http://localhost:8080
```

## 使用指南

### 基本使用流程

1. **选择Excel文件**
   - 点击"选择本地文件夹"按钮
   - 选择包含Excel文件的文件夹
   - 系统自动识别.xlsx和.xls文件

2. **输入搜索内容**
   - 在搜索框中输入要查找的内容
   - 可以是关键词、短语或描述性文本
   - 支持中英文混合搜索

3. **配置搜索选项**
   - 选择理解模式：语义理解/精确匹配/平衡模式
   - 设置相关度阈值
   - 配置批处理选项

4. **开始分析**
   - 点击"分析"按钮开始处理
   - 实时查看处理进度
   - 等待分析完成

5. **查看结果**
   - 按相关度排序查看匹配结果
   - 查看具体匹配位置和内容
   - 导出结果到CSV文件

### API配置

系统需要配置SophNet API密钥才能使用AI语义分析功能：

#### SophNet配置
```env
SOPHNET_API_URL=https://www.sophnet.com/api/open-apis/v1/chat/completions
SOPHNET_API_KEY=your_sophnet_api_key
SOPHNET_MODEL=DeepSeek-R1
SOPHNET_MAX_TOKENS=32768
```

## 特色功能

### 智能优化策略
- **自动跳过策略**：当直接匹配超过5处时，自动跳过AI分析节约Token
- **文本截取优化**：只分析必要的文本片段（最多1000字符）
- **批处理限制**：支持设置最大同时处理文件数量

### 高级搜索选项
- **理解模式选择**：智能语义理解、精确匹配、平衡模式
- **相关度阈值**：过滤低相关度结果
- **分析深度**：浅层分析vs深度分析选项
- **批处理配置**：自定义批处理参数

### 结果处理
- **智能排序**：按相关度、匹配数量、文件名等多种方式排序
- **详细展示**：显示工作表名称、行号、列号、具体内容
- **导出功能**：支持CSV格式导出，便于进一步分析

## API文档

### 文件上传接口
```http
POST /upload-files
Content-Type: multipart/form-data

参数：
- files: Excel文件数组
- searchContent: 搜索内容
- options: 搜索选项（可选）
```

### 配置管理接口
```http
GET /api/config
# 获取当前API配置

POST /api/config
Content-Type: application/json

{
  "SOPHNET_API_URL": "API地址",
  "SOPHNET_API_KEY": "API密钥",
  "SOPHNET_MODEL": "模型名称",
  "SOPHNET_MAX_TOKENS": "最大Token数"
}
```

### API连接测试
```http
POST /api/test-connection
Content-Type: application/json

{
  "SOPHNET_API_URL": "API地址",
  "SOPHNET_API_KEY": "API密钥",
  "SOPHNET_MODEL": "模型名称",
  "SOPHNET_MAX_TOKENS": "最大Token数"
}
```

## 故障排除

### 常见问题

**Q: 出现 "Error: listen EADDRINUSE: address already in use :::3000" 错误？**
```powershell
# 解决方案1：杀死占用3000端口的进程
# 查找占用3000端口的进程
netstat -ano | findstr :3000
# 根据PID杀死进程（替换<PID>为实际进程ID）
taskkill /PID <PID> /F

# 解决方案2：使用不同的端口
# 在server目录创建或编辑.env文件
cd server
echo PORT=3001 >> .env

# 解决方案3：重启计算机（简单粗暴）
# 如果不确定哪个进程占用了端口

# 解决方案4：使用PowerShell查找并杀死Node进程
Get-Process node | Stop-Process -Force
```

**Q: 出现 "'nodemon' 不是内部或外部命令" 错误？**
```powershell
# 解决方案1：使用npx运行（推荐）
cd server
npx nodemon index.js

# 解决方案2：全局安装nodemon
npm install -g nodemon

# 解决方案3：直接使用node启动（不支持热重载）
cd server
node index.js

# 解决方案4：确保server目录依赖已安装
cd server
npm install
```

**Q: Windows PowerShell中出现 "标记'&&'不是此版本中的有效语句分隔符" 错误？**
```powershell
# 错误命令（Linux/Mac格式）：
cd server && node index.js

# 正确命令（Windows PowerShell格式）：
cd server
node index.js

# 或者使用npm脚本（推荐）：
npm run dev
```

**Q: 启动时出现 "Cannot find module 'glob'" 错误？**
```bash
# 解决方案：安装缺失的依赖
cd server
npm install glob
```

**Q: 启动时出现 "Cannot find module" 相关错误？**
```bash
# 确保所有依赖已正确安装
cd server
npm install

# 如果仍有问题，清除缓存重新安装
cd server
rm -rf node_modules package-lock.json
npm install
```

**Q: 前端无法访问？**
```bash
# 检查后端是否正常启动
curl http://localhost:3001/api/config
# 或在浏览器中直接访问 http://localhost:3001
```

**Q: API连接失败？**
- 检查 `server/.env` 文件中的API配置
- 确保SophNet API密钥正确
- 测试网络连接是否正常

**Q: 文件上传失败？**
- 检查文件格式是否为.xlsx或.xls
- 确认文件大小不超过50MB
- 检查uploads目录权限

### 正确的启动命令

**❌ 错误的启动方式：**
```bash
node app.js                    # app.js不在根目录
cd server; node app.js         # 主文件是index.js，不是app.js
npm run serve                  # 没有serve脚本
```

**✅ 正确的启动方式：**
```bash
# 方式1：使用npm脚本（推荐）
npm run dev

# 方式2：直接启动后端
# Windows PowerShell:
cd server
node index.js

# Linux/Mac:
cd server && node index.js

# 方式3：使用start脚本
npm start
```

### 支持的Excel文件格式
- Microsoft Excel 2007及以上版本 (.xlsx)
- Microsoft Excel 97-2003 (.xls)
- 最大文件大小：50MB

### 性能建议
- 单次处理文件数量建议不超过20个
- 大文件建议拆分后再处理
- 设置合理的相关度阈值以过滤结果

## 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 项目仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 开发规范
- 使用UTF-8编码，中文注释
- 遵循ESLint代码规范
- 保持函数功能单一
- 编写清晰的commit信息

## 许可证

本项目采用 MIT 许可证。详情请参阅 [LICENSE](LICENSE) 文件。

## 联系我们

- **项目地址**：https://github.com/haclon/ExcelAIFinder
- **问题反馈**：https://github.com/haclon/ExcelAIFinder/issues
- **邮箱**：contact@bnai.tech

## 更新日志

### v1.0.0 (2024-01-01)
- 🎉 首次发布
- ✨ 支持Excel文件批量处理
- ✨ 集成SophNet AI语义分析
- ✨ 智能搜索和结果排序
- ✨ 结果导出功能
- ✨ 现代化Vue界面
- ✨ 完整的API接口

---

**感谢使用ExcelAIFinder！如果这个项目对您有帮助，请给我们一个⭐️**