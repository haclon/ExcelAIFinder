# 使用Cursor开发ExcelAIFinder系统教程

本教程将详细介绍使用Cursor AI编辑器开发Excel内容查找工具(ExcelAIFinder)的全过程，从项目结构设计到功能实现，再到重构优化，完整呈现基于AI辅助的开发流程。

## 一、项目概述

### 项目背景

ExcelAIFinder是一款由厦门佰能思维人工智能科技有限公司开发的智能Excel文件内容检索工具。该工具利用人工智能技术，实现对Excel文件内容的智能分析和检索，提供精准的内容匹配服务，大幅提升文档内容管理效率。

### 核心功能

- **批量Excel文件分析**：同时处理多个Excel文件
- **多种搜索模式**：支持精确匹配和语义理解
- **高亮显示匹配内容**：直观展示匹配结果
- **完整内容查看**：支持查看匹配项的完整上下文

### 技术栈

- **前端**：Vue.js + Element UI
- **后端**：Node.js + Express
- **文件处理**：XLSX.js
- **AI集成**：大型语言模型API

## 二、开发环境准备

### 安装Cursor编辑器

1. 访问[Cursor官网](https://cursor.sh/)下载安装
2. 配置AI功能，确保Claude AI模型可用

### 项目初始化

```powershell
# 创建项目目录
mkdir "ExcelAIFinder"
cd "ExcelAIFinder"

# 初始化前端项目
vue create .
# 选择Vue 2配置

# 安装依赖
npm install element-ui axios
```

## 三、前端开发过程

### 1. 创建主组件结构

使用Cursor AI辅助创建主组件`ExcelContentFinder.vue`：

1. 在Cursor中创建新文件
2. 向AI描述需求："创建一个Excel文件内容查找工具的Vue组件"
3. 根据AI建议，编写基础组件结构：
   - 文件选择区域
   - 搜索内容输入框
   - 结果显示区域

### 2. 实现文件选择功能

```javascript
// 处理文件夹选择
handleFolderSelection(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;
  
  // 清空之前选择的文件
  this.selectedFiles = [];
  
  // 过滤出Excel文件
  Array.from(files).forEach(file => {
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      this.selectedFiles.push(file);
    }
  });
}
```

### 3. 实现搜索功能

```javascript
// 开始批量分析处理
startBatchAnalysis() {
  // 检查准备状态
  if (!this.serverConnected || !this.searchContent || this.selectedFiles.length === 0) {
    this.$message.warning('请确保服务器连接正常并选择文件和输入搜索内容');
    return;
  }
  
  // 准备批处理信息
  this.initializeBatchProcess();
  
  // 处理第一批
  this.processBatch();
}
```

### 4. 优化匹配结果显示

在开发过程中，我们遇到了匹配内容显示不完整的问题。利用Cursor AI，通过以下步骤解决：

1. 向AI描述问题："搜索结果的内容无法完全展开"
2. 接收AI建议，修改CSS样式:

```css
.match-content {
  white-space: pre-wrap;
  word-break: break-word;
  font-family: 'Consolas', monospace;
  font-size: 13px;
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 4px;
  line-height: 1.6;
  border: 1px solid #e0e0e0;
  color: #303133;
  min-height: 40px;
  position: relative;
  overflow: visible; /* 允许内容溢出显示，不截断 */
}
```

### 5. 添加"查看完整内容"功能

为了更好地查看匹配结果，添加完整内容查看功能：

```html
<el-dialog
  title="完整匹配内容"
  :visible.sync="fullContentDialog.visible"
  width="80%"
  class="full-content-dialog"
>
  <div class="sheet-info">
    <span class="sheet-name-full">工作表: {{ fullContentDialog.match.sheet }}</span>
    <span class="row-number-full">行: {{ fullContentDialog.match.row }}</span>
  </div>
  <div class="full-content-wrapper">
    <div v-html="highlightMatch(fullContentDialog.match.content, lastSearchedContent)" class="full-content"></div>
  </div>
</el-dialog>
```

## 四、后端开发过程

### 1. 创建Express服务器

初始设计采用单文件方式，随着功能增加，代码变得复杂。使用Cursor AI帮助设计更合理的结构：

```javascript
// 初始server/index.js
const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Excel内容查找工具后端');
});

app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
});
```

### 2. 实现文件上传功能

使用multer处理文件上传：

```javascript
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

app.post('/api/upload-and-analyze', upload.array('files'), async (req, res) => {
  // 处理上传的文件
  const files = req.files;
  const searchContent = req.body.searchContent;
  
  // 执行分析并返回结果
  // ...分析逻辑
});
```

### 3. 实现Excel内容分析

```javascript
async function analyzeExcelContent(filePath, searchContent, options) {
  // 读取Excel文件
  const workbook = XLSX.readFile(filePath);
  
  // 查找匹配内容
  const results = [];
  // ...查找逻辑
  
  // 使用AI分析相关性
  // ...AI分析
  
  return results;
}
```

## 五、重构与优化

### 1. 后端代码重构

随着项目功能增加，后端代码变得复杂。使用Cursor AI帮助重构为MVC架构：

1. 创建项目结构并分离关注点：

```
restructure/server/
├── config/              # 配置文件
├── controllers/         # 控制器
├── middleware/          # 中间件
├── routes/              # 路由定义
├── services/            # 业务服务
├── utils/               # 工具函数
├── app.js               # Express应用配置
└── server.js            # 服务器入口
```

2. 为各个部分编写代码，例如文件控制器:

```javascript
// controllers/fileController.js
async function uploadAndAnalyze(req, res) {
  try {
    // 检查是否有文件上传
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '未上传文件' });
    }
    
    // 获取搜索内容和选项
    const searchContent = req.body.searchContent;
    const options = {/*...*/};
    
    // 使用服务层处理分析
    const results = [];
    for (const file of req.files) {
      const analysisResult = await excelService.analyzeExcelContent(
        file.path, searchContent, options
      );
      results.push({/*...*/});
    }
    
    return res.json({ results });
    
  } catch (error) {
    return res.status(500).json({ error: `处理请求失败: ${error.message}` });
  }
}
```

### 2. 前端优化

使用Cursor AI优化匹配结果的展示：

1. 添加分页功能，避免大量匹配项导致性能问题
2. 增强高亮显示效果，提高可读性
3. 添加"查看完整内容"功能，支持在弹窗中查看详情

### 3. 测试和问题修复

开发过程中遇到几个问题并使用Cursor AI辅助解决：

1. **PowerShell命令分隔符错误**：在PowerShell中，应使用分号(`;`)而非与号(`&&`)分隔命令
2. **CSS注释语法错误**：将`//`注释改为`/* */`格式
3. **文件路径问题**：确保正确指定重构后代码的路径

## 六、部署与使用

### 1. 前端部署

```powershell
# 构建生产版本
npm run build
```

### 2. 后端部署

```powershell
# 安装依赖
cd restructure/server
npm install

# 配置环境变量
# 创建.env文件添加API配置

# 启动服务器
node server.js
```

### 3. 使用说明

1. 选择包含Excel文件的文件夹
2. 输入要搜索的内容
3. 选择搜索模式（精确匹配/语义理解/混合模式）
4. 点击分析按钮
5. 查看匹配结果，可展开查看详情或点击"查看完整内容"

## 七、Cursor AI的关键贡献

在整个开发过程中，Cursor AI提供了以下关键帮助：

1. **代码补全与生成**：根据需求描述自动生成代码
2. **代码重构**：帮助将单文件后端重构为MVC架构
3. **问题诊断**：识别CSS语法错误和PowerShell命令格式问题
4. **UI优化建议**：提供展示匹配内容的最佳实践
5. **文档生成**：帮助编写项目文档和注释

## 八、总结与经验

### 开发经验总结

1. **AI辅助开发提升效率**：Cursor AI大幅减少编码时间，特别是在处理重复性任务时
2. **代码重构的价值**：MVC架构使代码更易维护和扩展
3. **用户体验优先**：针对匹配内容的展示进行多次优化，确保用户能方便查看结果
4. **错误处理的重要性**：完善的错误处理和日志记录帮助快速定位问题

### 未来改进方向

1. 支持更多文件格式的内容搜索
2. 增加更多AI分析选项，支持更复杂的搜索需求
3. 增强批处理功能，提升大量文件的处理效率
4. 添加用户权限管理，支持多用户场景

---

通过本教程，您可以了解使用Cursor AI编辑器开发一个完整的Excel内容查找工具的全过程。这种AI辅助开发方法不仅提高了开发效率，也帮助解决了复杂问题，使开发人员能够专注于业务逻辑和用户体验的优化。 