# Excel文件内容查找工具 - 服务器端

这是一个用于分析Excel文件内容并查找相关信息的服务器应用程序，通过API提供文件上传、内容分析和结果查询功能。

## 项目架构

项目采用模块化设计，遵循MVC架构模式，主要结构如下：

```
server/
├── config/             # 配置文件
│   └── default.js      # 默认配置
├── controllers/        # 控制器模块
│   ├── fileController.js    # 文件处理控制器
│   ├── configController.js  # 配置管理控制器
│   └── systemController.js  # 系统状态控制器
├── middleware/         # 中间件
│   └── upload.js       # 文件上传中间件
├── routes/             # 路由定义
│   └── index.js        # API路由
├── services/           # 业务服务
│   ├── excel.js        # Excel分析服务
│   └── ai.js           # AI服务
├── utils/              # 工具函数
│   ├── file.js         # 文件操作工具
│   └── logger.js       # 日志工具
├── uploads/            # 上传文件临时存储
├── logs/               # 日志存储
├── app.js              # Express应用配置
├── server.js           # 服务器入口
└── package.json        # 项目依赖
```

## 功能特性

- Excel文件上传和分析
- 内容相关性分析（支持精确匹配和语义理解）
- AI内容分析集成
- API配置管理
- 系统状态监控
- 详细日志记录

## 安装和运行

### 前提条件

- Node.js (v14.0.0或更高版本)
- npm (v6.0.0或更高版本)

### 安装步骤

1. 克隆仓库或下载源代码

2. 安装依赖
   ```bash
   cd server
   npm install
   ```

3. 创建环境变量文件，命名为`.env`，添加以下内容：
   ```
   PORT=3000
   API_URL=<你的AI API地址>
   API_KEY=<你的API密钥>
   API_MODEL=<使用的模型名称>
   ```

4. 启动服务器
   ```bash
   # 开发模式（带自动重载）
   npm run dev
   
   # 生产模式
   npm start
   ```

## API接口

### 文件上传和分析
- `POST /api/upload-and-analyze`
  - 请求体: FormData，包含files字段(文件)和searchContent字段(搜索内容)
  - 可选参数: understandingMode, minRelevanceThreshold, analysisDepth
  - 响应: 分析结果列表

### 配置管理
- `GET /api/config` - 获取API配置
- `POST /api/config` - 更新API配置
- `POST /api/test-connection` - 测试API连接

### 系统状态
- `GET /api/health` - 健康检查
- `GET /api/logs` - 获取API调用日志

## 技术栈

- Express.js - Web服务器框架
- Multer - 文件上传处理
- XLSX.js - Excel文件解析
- Axios - HTTP客户端
- Winston - 日志记录
- dotenv - 环境变量管理

## 许可证

MIT 