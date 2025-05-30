const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// 中间件配置
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/generated', express.static(path.join(__dirname, 'generated')));

// 确保必要的目录存在
const ensureDirectories = () => {
    const dirs = [
        path.join(__dirname, 'uploads'),
        path.join(__dirname, 'generated'),
        path.join(__dirname, 'temp')
    ];
    
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`创建目录: ${dir}`);
        }
    });
};

ensureDirectories();

// 路由配置
const projectRoutes = require('./routes/project');
const generateRoutes = require('./routes/generate');
const aiRoutes = require('./routes/ai');

app.use('/api/project', projectRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/ai', aiRoutes);

// 健康检查接口
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: '软件著作权生成器服务运行正常',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({
        error: '服务器内部错误',
        message: err.message,
        timestamp: new Date().toISOString()
    });
});

// 404处理
app.use('*', (req, res) => {
    res.status(404).json({
        error: '接口不存在',
        path: req.originalUrl,
        timestamp: new Date().toISOString()
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 软件著作权生成器服务已启动`);
    console.log(`📡 服务地址: http://localhost:${PORT}`);
    console.log(`📝 API文档: http://localhost:${PORT}/api/health`);
    console.log(`⏰ 启动时间: ${new Date().toLocaleString('zh-CN')}`);
});

module.exports = app; 