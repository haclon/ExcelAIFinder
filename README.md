# ExcelAIFinder - Excel内容智能查找工具

![版本](https://img.shields.io/badge/版本-V1.2.0-blue)
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
├── server/                # Node.js后端服务（原版）
│   ├── index.js           # 主服务文件
│   ├── uploads/           # 文件上传目录
│   └── package.json       # 后端依赖
├── restructure/           # 重构版本（推荐使用）
│   └── server/            # 模块化后端架构
│       ├── config/        # 配置文件
│       ├── controllers/   # 控制器
│       ├── middleware/    # 中间件
│       ├── routes/        # 路由定义
│       ├── services/      # 业务逻辑
│       ├── utils/         # 工具函数
│       ├── app.js         # Express应用配置
│       └── server.js      # 服务器入口
├── scripts/               # 启动脚本
│   ├── start.bat          # Windows一键启动脚本
│   ├── start.ps1          # PowerShell启动脚本
│   └── start.sh           # Linux/Mac启动脚本
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
- **Node.js**：JavaScript运行时环境（推荐14.0.0+）
- **Express 4.18.2**：Web应用框架
- **XLSX.js 0.18.5**：Excel文件处理库
- **Multer**：文件上传中间件
- **Winston**：日志记录系统
- **dotenv**：环境变量管理

### AI集成
- **SophNet API**：主要AI服务提供商
- **DeepSeek模型**：支持DeepSeek-R1、DeepSeek-v3等模型
- **智能优化**：Token使用优化和批处理策略

## 🚀 快速开始

### 环境要求
- Node.js >= 14.0.0
- npm >= 6.0.0
- 现代浏览器（Chrome、Firefox、Safari、Edge）

### 💡 一键启动（推荐）

**Windows 用户**：
```bash
# 双击运行 start.bat 文件，或在命令行中执行：
start.bat
```

**Linux/Mac 用户**：
```bash
# 给脚本执行权限并运行
chmod +x start.sh
./start.sh
```

**PowerShell 用户**：
```powershell
# 在 PowerShell 中执行
.\start.ps1
```

一键启动脚本会自动：
- ✅ 检查Node.js和npm环境
- ✅ 安装所需依赖
- ✅ 创建环境配置文件
- ✅ 启动前端和后端服务
- ✅ 自动在浏览器中打开应用

### 手动安装步骤

1. **克隆项目**
```bash
git clone git@github.com:haclon/ExcelAIFinder.git
cd ExcelAIFinder
```

2. **安装依赖**
```bash
# 安装前端依赖
npm install

# 安装后端依赖（重构版）
cd restructure/server
npm install

# 返回项目根目录
cd ../..
```

3. **配置环境变量**
```bash
# 配置文件会自动创建，也可以手动编辑
# Windows: notepad restructure/server/.env
# Linux/Mac: nano restructure/server/.env
```

4. **启动服务**

**方式1：同时启动前后端（推荐）**
```bash
npm run dev
```

**方式2：分别启动**
```bash
# 终端1：启动后端服务（端口3000）
npm run server:dev

# 终端2：启动前端开发服务器（端口8080）
npm run serve
```

5. **访问应用**
- 前端应用：http://localhost:8080
- 后端API：http://localhost:3000
- API测试：http://localhost:3000/api/health

### 环境配置

编辑 `restructure/server/.env` 文件，配置以下参数：

```env
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
```

## 使用指南

### 基本使用流程

1. **选择Excel文件**
   - 点击"选择本地文件夹"按钮或直接拖拽文件
   - 选择包含Excel文件的文件夹
   - 系统自动识别.xlsx和.xls文件

2. **输入搜索内容**
   - 在搜索框中输入要查找的内容
   - 可以是关键词、短语或描述性文本
   - 支持中英文混合搜索

3. **配置搜索选项**
   - 选择理解模式：语义理解/精确匹配/平衡模式
   - 设置相关度阈值（推荐50-70）
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
SOPHNET_API_KEY=your_sophnet_api_key_here
SOPHNET_MODEL=DeepSeek-R1
SOPHNET_MAX_TOKENS=32768
```

**注意**：如果没有配置API密钥，系统仍可使用精确匹配和模糊搜索功能。

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
POST /api/upload-files
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

### 健康检查
```http
GET /api/health
# 检查后端服务状态
```

## 🔧 故障排除

### 常见问题

**Q: 启动脚本闪退或显示乱码？**
```bash
# 解决方案1：使用UTF-8编码启动
# 在start.bat顶部已添加 chcp 65001 命令

# 解决方案2：手动启动
npm run dev

# 解决方案3：检查Node.js和npm是否正确安装
node --version
npm --version
```

**Q: 端口3000被占用错误？**
```bash
# Windows解决方案：
# 查找占用端口的进程
netstat -ano | findstr :3000
# 杀死进程（替换<PID>为实际进程ID）
taskkill /PID <PID> /F

# 或者修改后端端口
# 编辑 restructure/server/.env 文件
PORT=3001
```

**Q: API连接测试失败？**
- ✅ 检查网络连接
- ✅ 确认API密钥是否正确配置
- ✅ 查看 `restructure/server/.env` 文件
- ✅ 检查API服务是否可用

**Q: 文件上传失败？**
- ✅ 确认文件格式为.xlsx或.xls
- ✅ 检查文件大小不超过50MB
- ✅ 确保uploads目录有写入权限
- ✅ 检查后端服务是否正常运行

**Q: 依赖安装失败？**
```bash
# 清除缓存重新安装
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# 检查网络连接
npm config set registry https://registry.npmmirror.com/
```

**Q: 前端页面无法加载？**
- ✅ 检查后端服务是否在端口3000运行
- ✅ 检查CORS配置是否正确
- ✅ 确认前端服务在端口8080运行
- ✅ 检查浏览器控制台是否有错误信息

### 正确的启动命令

**✅ 推荐的启动方式：**
```bash
# 方式1：一键启动脚本（最简单）
start.bat                 # Windows
./start.sh                # Linux/Mac

# 方式2：npm脚本
npm run dev               # 同时启动前后端

# 方式3：分别启动
npm run server:dev        # 启动后端
npm run serve             # 启动前端（另一个终端）
```

**❌ 过时的启动方式：**
```bash
cd server && node index.js    # 旧版本路径
node app.js                   # 不正确的入口文件
npm run start                 # 未定义的脚本
```

### 支持的Excel文件格式
- Microsoft Excel 2007及以上版本 (.xlsx)
- Microsoft Excel 97-2003 (.xls)
- 最大文件大小：50MB
- 支持多工作表文件

### 性能建议
- 单次处理文件数量建议不超过20个
- 大文件建议拆分后再处理
- 设置合理的相关度阈值（50-70）以过滤结果
- 使用精确匹配模式可节约API消耗

## 更新日志

### v1.2.0 (2024-01-15)
- 🎉 添加一键启动脚本（start.bat, start.ps1, start.sh）
- ✨ 重构后端架构，模块化设计
- ✨ 优化启动流程，简化安装步骤
- 🐛 修复中文乱码问题
- 🐛 修复端口冲突问题
- 📝 更新文档和故障排除指南
- ⚡ 提升批量处理性能
- 🔧 改进环境配置管理

### v1.1.0 (2024-01-08)
- ✨ 增强语义分析功能
- ✨ 添加批量处理优化
- 🐛 修复大文件处理问题
- 📝 完善API文档

### v1.0.0 (2024-01-01)
- 🎉 首次发布
- ✨ 支持Excel文件批量处理
- ✨ 集成SophNet AI语义分析
- ✨ 智能搜索和结果排序
- ✨ 结果导出功能
- ✨ 现代化Vue界面
- ✨ 完整的API接口

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
- 保持向下兼容性

## 许可证

本项目采用 MIT 许可证。详情请参阅 [LICENSE](LICENSE) 文件。

## 关于我们

### 🏢 公司简介

**厦门佰能思维人工智能科技有限公司** 是一家以创新为驱动的前沿科技企业，专注投身人工智能与元宇宙领域。公司凭借强大的技术整合能力，融合AI、VR、AR、IoT等前沿科技，构建综合解决方案体系，为政企客户及个人用户提供专业服务。

服务政府助力智慧城市建设，为决策提供数据支撑；帮助企业数字化转型，嵌入前沿技术提升效率与竞争力。公司汇聚行业精英，专注研发攻克难题。面向个人布局娱乐与生活应用。

### 📞 联系方式

#### 🏢 公司地址
**地址**：厦门火炬高新区软件园一期思明软件园2号科讯楼3F

#### 📧 邮箱联系
**联系邮箱**：538825006@qq.com

#### 💻 开发平台
- **GitHub主页**：https://github.com/haclon
- **项目地址**：https://github.com/haclon/ExcelAIFinder
- **问题反馈**：https://github.com/haclon/ExcelAIFinder/issues

### 📄 企业信息

- **公司全称**：厦门佰能思维人工智能科技有限公司
- **统一社会信用代码**：91350200MADWLHRY05
- **经营范围**：人工智能技术研发、元宇宙应用开发、物联网技术服务

---

**感谢使用ExcelAIFinder！如果这个项目对您有帮助，请给我们一个⭐️**

**商务合作 | 技术支持 | 产品咨询，请随时联系我们！**