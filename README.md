# 智能软件著作权登记材料生成器

![版本](https://img.shields.io/badge/版本-V1.0.0-blue)
![许可证](https://img.shields.io/badge/许可证-MIT-green)
![语言](https://img.shields.io/badge/语言-JavaScript-yellow)
![平台](https://img.shields.io/badge/平台-跨平台-orange)

## 项目简介

智能软件著作权登记材料生成器是一款基于AI技术的自动化工具，专门用于生成软件著作权登记所需的各种申请材料。只需上传项目源代码和相关文档，系统即可自动调用DeepSeek等大语言模型，智能生成符合国家版权局要求的程序鉴别材料和文档鉴别材料。

## 核心功能

### 🚀 智能文档生成
- **程序鉴别材料**：自动提取源代码，生成符合要求的前30页和后30页程序清单
- **文档鉴别材料**：基于项目信息智能生成完整的软件说明书（60页）
- **申请表自动填写**：根据项目分析结果自动填写软件著作权登记申请表

### 🤖 AI 智能分析
- **项目结构分析**：自动分析项目目录结构和技术架构
- **功能特性提取**：智能识别软件的核心功能和技术特点
- **开发信息推导**：基于代码和文档自动推导开发背景、技术路线等信息

### 📁 多格式支持
- **源代码**：支持各种编程语言（JavaScript、Python、Java、C#等）
- **项目文档**：支持README、设计文档、API文档等
- **输出格式**：生成HTML、PDF等多种格式的申请材料

### ⚡ 高效便捷
- **一键生成**：上传项目文件后一键生成所有申请材料
- **模板定制**：提供多种文档模板，适应不同类型的软件项目
- **批量处理**：支持多个项目的批量处理

## 系统架构

```
software-copyright-generator/
├── client/                 # 前端应用 (React)
│   ├── src/
│   │   ├── components/     # 可复用组件
│   │   ├── pages/         # 页面组件
│   │   ├── services/      # API服务
│   │   └── utils/         # 工具函数
│   ├── public/            # 静态资源
│   └── package.json       # 前端依赖
├── server/                # 后端服务 (Node.js + Express)
│   ├── controllers/       # 控制器
│   ├── services/         # 业务逻辑
│   ├── models/           # 数据模型
│   ├── middlewares/      # 中间件
│   ├── templates/        # 文档模板
│   ├── routes/           # 路由配置
│   ├── utils/            # 工具函数
│   ├── uploads/          # 文件上传目录
│   ├── generated/        # 生成文件目录
│   └── package.json      # 后端依赖
├── docs/                 # 项目文档
├── examples/             # 示例项目
└── README.md            # 项目说明
```

## 技术栈

### 前端技术
- **React 18**：现代化的用户界面框架
- **Ant Design**：企业级UI设计语言和组件库
- **React Router**：单页应用路由管理
- **Axios**：HTTP客户端库
- **React Dropzone**：文件拖拽上传组件

### 后端技术
- **Node.js**：JavaScript运行时环境
- **Express.js**：Web应用框架
- **Multer**：文件上传中间件
- **Handlebars**：模板引擎
- **Puppeteer**：PDF生成工具
- **Axios**：HTTP客户端（AI API调用）

### AI集成
- **DeepSeek API**：主要AI模型服务
- **通义千问 API**：备选AI模型服务
- **OpenAI API**：兼容的AI模型服务

## 快速开始

### 环境要求
- Node.js >= 14.0.0
- npm >= 6.0.0
- 现代浏览器（Chrome、Firefox、Safari、Edge）

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/bnai-tech/software-copyright-generator.git
cd software-copyright-generator
```

2. **安装依赖**
```bash
# 安装所有依赖（根目录、服务端、客户端）
npm run install:all
```

3. **配置环境变量**
```bash
# 复制环境变量模板
cp server/env.example server/.env

# 编辑环境变量文件，配置AI API密钥
nano server/.env
```

4. **启动开发服务**
```bash
# 同时启动前端和后端开发服务
npm run dev
```

5. **访问应用**
- 前端应用：http://localhost:3000
- 后端API：http://localhost:5000

### 生产部署

1. **构建前端应用**
```bash
npm run build
```

2. **启动生产服务**
```bash
npm start
```

## 使用指南

### 基本使用流程

1. **上传项目文件**
   - 支持拖拽上传或点击选择
   - 可上传源代码文件、压缩包、文档等
   - 自动解压和文件分析

2. **填写项目信息**
   - 软件名称、版本号
   - 开发公司、联系方式
   - 软件类型、开发方式等

3. **AI智能分析**
   - 自动分析项目结构
   - 识别技术栈和框架
   - 生成项目描述和技术特点

4. **生成申请材料**
   - 程序鉴别材料（前30页+后30页）
   - 文档鉴别材料（60页软件说明书）
   - 软件著作权登记申请表

5. **下载和提交**
   - 支持HTML和PDF格式下载
   - 可直接用于软著申请提交

### AI模型配置

系统支持多种AI模型，需要配置相应的API密钥：

#### DeepSeek配置
```env
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions
DEEPSEEK_MODEL=deepseek-chat
```

#### 通义千问配置
```env
QWEN_API_KEY=your_qwen_api_key
QWEN_API_URL=https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation
QWEN_MODEL=qwen-max
```

#### OpenAI配置
```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_API_URL=https://api.openai.com/v1/chat/completions
OPENAI_MODEL=gpt-4
```

## API文档

### 项目管理接口

#### 上传项目文件
```http
POST /api/project/upload
Content-Type: multipart/form-data

参数：
- files: 项目文件（支持多文件）
- projectInfo: 项目基本信息（JSON字符串）

返回：
{
  "success": true,
  "projectId": "uuid",
  "filesCount": 10,
  "message": "项目文件上传成功"
}
```

#### 分析项目结构
```http
POST /api/project/:projectId/analyze

返回：
{
  "success": true,
  "analysis": {
    "totalFiles": 50,
    "totalSize": 1024000,
    "languages": {"JavaScript": 30, "CSS": 10},
    "frameworks": ["React", "Express.js"]
  }
}
```

### AI服务接口

#### 生成项目描述
```http
POST /api/ai/describe-project

参数：
{
  "projectInfo": {...},
  "analysis": {...},
  "model": "deepseek"
}

返回：
{
  "success": true,
  "description": "AI生成的项目描述",
  "message": "项目描述生成成功"
}
```

### 文档生成接口

#### 生成完整申请包
```http
POST /api/generate/complete-package/:projectId

参数：
{
  "aiContent": {
    "description": "...",
    "features": "...",
    "functionalDescription": "..."
  },
  "options": {...}
}

返回：
{
  "success": true,
  "files": [
    {"name": "程序鉴别材料.html", "path": "/generated/..."},
    {"name": "文档鉴别材料.html", "path": "/generated/..."},
    {"name": "软件著作权登记申请表.html", "path": "/generated/..."}
  ]
}
```

## 开发指南

### 项目结构说明

```
client/src/
├── components/          # 可复用组件
│   ├── FileUpload.js   # 文件上传组件
│   ├── ProjectForm.js  # 项目信息表单
│   ├── FileTree.js     # 文件树组件
│   └── CodePreview.js  # 代码预览组件
├── pages/              # 页面组件
│   ├── HomePage.js     # 首页
│   └── GeneratorPage.js # 生成器页面
├── services/           # API服务
│   ├── api.js         # API配置
│   ├── project.js     # 项目相关API
│   ├── ai.js          # AI服务API
│   └── generate.js    # 文档生成API
└── utils/             # 工具函数
    ├── file.js        # 文件处理工具
    └── format.js      # 格式化工具
```

### 添加新的AI模型

1. **在服务端添加模型配置**
```javascript
// server/routes/ai.js
const AI_MODELS = {
  // 现有模型...
  newmodel: {
    name: 'New Model',
    url: process.env.NEWMODEL_API_URL,
    key: process.env.NEWMODEL_API_KEY,
    model: process.env.NEWMODEL_MODEL
  }
};
```

2. **实现API调用逻辑**
```javascript
// 在callAI函数中添加新模型的处理逻辑
if (modelType === 'newmodel') {
  // 实现新模型的API调用
}
```

3. **更新环境变量模板**
```env
# server/env.example
NEWMODEL_API_KEY=your_newmodel_api_key
NEWMODEL_API_URL=https://api.newmodel.com/v1/chat
NEWMODEL_MODEL=newmodel-latest
```

### 自定义文档模板

1. **创建新模板文件**
```handlebars
<!-- server/templates/custom-template.hbs -->
<!DOCTYPE html>
<html>
<head>
    <title>{{project.name}} - 自定义模板</title>
</head>
<body>
    <!-- 模板内容 -->
</body>
</html>
```

2. **在生成服务中使用**
```javascript
// server/routes/generate.js
async function generateCustomDocument(projectData, options) {
  const templatePath = path.join(__dirname, '../templates/custom-template.hbs');
  const template = await fs.readFile(templatePath, 'utf8');
  const compiledTemplate = handlebars.compile(template);
  return compiledTemplate(projectData);
}
```

## 常见问题

### Q: 支持哪些编程语言？
A: 系统支持主流编程语言，包括但不限于：JavaScript、TypeScript、Python、Java、C#、Go、PHP、Ruby、C/C++等。

### Q: 生成的文档是否符合国家版权局要求？
A: 是的，生成的文档完全按照《计算机软件著作权登记办法》的要求设计，包括程序鉴别材料（前30页+后30页）和文档鉴别材料（60页）。

### Q: 可以处理多大的项目？
A: 系统支持最大100MB的文件上传，可以处理包含数千个文件的大型项目。

### Q: AI生成的内容准确吗？
A: AI会基于项目代码和结构进行智能分析，生成的内容具有较高的准确性。建议用户在提交前进行必要的检查和修改。

### Q: 是否支持离线使用？
A: 目前需要网络连接来调用AI服务。我们计划在未来版本中支持本地AI模型。

## 贡献指南

我们欢迎社区贡献！请遵循以下步骤：

1. Fork 项目仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 代码规范
- 使用ESLint进行代码检查
- 遵循Prettier代码格式化规则
- 编写清晰的注释和文档
- 添加适当的测试用例

## 许可证

本项目采用 MIT 许可证。详情请参阅 [LICENSE](LICENSE) 文件。

## 联系我们

- **公司**：厦门佰能思维人工智能科技有限公司
- **邮箱**：contact@bnai.tech
- **网站**：https://www.bnai.tech
- **GitHub**：https://github.com/bnai-tech

## 更新日志

### v1.0.0 (2024-05-30)
- 🎉 首次发布
- ✨ 支持多种编程语言项目分析
- ✨ 集成DeepSeek、通义千问等AI模型
- ✨ 自动生成程序鉴别材料和文档鉴别材料
- ✨ 支持HTML和PDF格式输出
- ✨ 现代化的Web界面
- ✨ 完整的API文档和使用指南

---

**感谢使用智能软件著作权生成器！如果这个项目对您有帮助，请给我们一个⭐️** 