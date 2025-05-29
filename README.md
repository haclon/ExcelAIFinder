# ExcelAIFinder

![版本](https://img.shields.io/badge/版本-V1.0.0-blue)
![许可证](https://img.shields.io/badge/许可证-Apache_2.0-green)
![语言](https://img.shields.io/badge/语言-JavaScript-yellow)
![平台](https://img.shields.io/badge/平台-跨平台-orange)

这是一个用于查找和分析 Excel 文件内容的工具，支持批量处理文件、精确匹配和语义理解搜索。

## 项目介绍

ExcelAIFinder是一款由厦门佰能思维人工智能科技有限公司开发的智能Excel文件内容检索工具。该工具利用人工智能技术，实现对Excel文件内容的智能分析和检索，提供精准的内容匹配服务，大幅提升文档内容管理效率。

厦门佰能思维人工智能科技有限公司以创新为驱动，投身人工智能与元宇宙领域。凭借技术整合能力，融合AI、VR、AR、IoT等前沿科技，构建综合解决方案体系，服务政企客户及个人用户。

## 项目结构

项目采用前后端分离的结构，包含两个主要部分：

### 前端部分

Vue.js 开发的单页面应用，提供用户界面。

```
src/
├── components/          # 组件
│   └── ExcelContentFinder.vue  # 主要功能组件
├── App.vue              # 应用入口
└── main.js              # 主脚本
```

### 后端部分 (重构版)

基于 Express 的服务器应用，采用 MVC 架构。

```
restructure/server/
├── config/              # 配置文件
│   └── default.js       # 默认配置
├── controllers/         # 控制器
│   ├── fileController.js     # 文件处理控制器
│   ├── configController.js   # 配置管理控制器
│   └── systemController.js   # 系统控制器
├── middleware/          # 中间件
│   └── upload.js        # 文件上传中间件
├── routes/              # 路由定义
│   └── index.js         # API路由
├── services/            # 业务服务
│   ├── excel.js         # Excel分析服务
│   └── ai.js            # AI服务
├── utils/               # 工具函数
│   ├── file.js          # 文件操作工具
│   └── logger.js        # 日志工具
├── app.js               # Express应用配置
└── server.js            # 服务器入口
```

## 安装和运行

### 前端

```powershell
# 进入项目目录
cd "E:\Cursor_project\ExcelAIFinder"

# 安装依赖
npm install

# 运行开发服务器
npm run serve
```

### 后端 (重构版)

在 PowerShell 中使用分号分隔命令：

```powershell
# 进入重构后的服务器目录
cd restructure\server

# 安装依赖
npm install

# 运行服务器
node server.js
```

注意：PowerShell 中使用分号(`;`)而不是与号(`&&`)来分隔命令。单行执行多个命令的示例：

```powershell
cd restructure\server; npm install; node server.js
```

### 环境配置

1. 在 `restructure/server` 目录下创建 `.env` 文件:

```
PORT=3000
API_URL=<你的AI API地址>
API_KEY=<你的API密钥>
API_MODEL=DeepSeek-R1
```

2. 在前端项目根目录创建或编辑 `.env` 文件:

```
VUE_APP_API_BASE_URL=http://localhost:3000
```

## 主要功能

### 文件处理
- 支持选择多个Excel文件进行批量分析
- 自动过滤非Excel格式文件
- 支持大文件上传和分批处理

### 搜索功能
- **精确匹配模式**：查找文件中包含特定关键词的内容
- **语义理解模式**：使用AI分析文档内容与搜索词的相关性
- **混合模式**：结合精确匹配和语义理解的优势

### 结果展示
- 按相关度排序显示匹配结果
- 支持展开/折叠所有结果
- 高亮显示匹配的关键词
- 详细的工作表和单元格信息
- **查看完整内容**功能，可在弹窗中查看完整匹配内容
- 分页显示大量匹配项，提高性能

### API配置
- 支持自定义AI API设置
- API连接测试功能
- 支持多种AI模型配置

### 系统功能
- 服务器健康状态监控
- 详细的处理日志记录
- 连接状态实时显示

## 技术栈

### 前端
- Vue.js
- Element UI
- Axios
- Vue Router

### 后端
- Node.js
- Express
- Multer (文件上传)
- XLSX.js (Excel解析)
- Winston (日志记录)
- dotenv (环境变量)

## 开发者信息

**开发者**: 庄志龙  
**公司**: 厦门佰能思维人工智能科技有限公司  
**联系邮箱**: [qq538825006@gmail.com](mailto:qq538825006@gmail.com)

## 许可证

Apache License 2.0 - 详见 [LICENSE](LICENSE) 文件

## 系统要求

### 客户端
- 操作系统: Windows 10或更高版本，macOS 10.14或更高版本，Linux (Ubuntu 18.04+)
- 浏览器: Chrome 80+，Firefox 75+，Edge 80+
- 内存: 至少4GB RAM
- 磁盘空间: 至少200MB可用空间

### 服务端
- Node.js 14.0.0或更高版本
- NPM 6.0.0或更高版本
- 支持HTTPS的Web服务器（生产环境）

## 版本历史

### V1.0 (2023-12-15)
- 首次发布
- 支持Excel文件批量分析
- 实现精确匹配和语义理解搜索
- 添加API配置功能

### V0.9 (2023-11-20)
- 完成Beta测试版本
- 优化搜索算法
- 改进用户界面

### V0.8 (2023-10-15)
- 完成Alpha测试版本
- 实现基础功能

## 常见问题

### Q: 支持哪些Excel文件格式？
A: 目前支持.xlsx和.xls格式的Excel文件。

### Q: 如何提高语义搜索的准确性？
A: 建议使用更具体的搜索词，并选择与内容相关性更高的AI模型。

### Q: 文件大小有限制吗？
A: 单个文件默认限制为50MB，可通过修改配置文件调整。

### Q: 如何报告问题或提出建议？
A: 请发送邮件至[qq538825006@gmail.com](mailto:qq538825006@gmail.com)或提交GitHub Issue。

## 贡献指南

我们欢迎各种形式的贡献，包括但不限于：

1. 报告问题和提出建议
2. 提交代码改进
3. 完善文档
4. 分享使用经验

请确保您的提交符合项目的代码规范和文档标准。

## 相关文档

- [软件著作权登记信息](软件著作权登记信息.md) - 软著申请相关材料
- [开发教程](ExcelAIFinder_开发教程.md) - 使用Cursor开发本项目的详细教程

---
*Copyright © 2024 厦门佰能思维人工智能科技有限公司. All rights reserved.* 