const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const archiver = require('archiver');
const unzipper = require('unzipper');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        fs.ensureDirSync(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // 保持原始文件名，添加时间戳避免冲突
        const timestamp = Date.now();
        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        cb(null, `${timestamp}_${originalName}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
        files: 100 // 最多100个文件
    },
    fileFilter: (req, file, cb) => {
        // 允许的文件类型
        const allowedTypes = [
            '.js', '.ts', '.jsx', '.tsx', '.vue', '.py', '.java', '.c', '.cpp', '.cs', '.go', '.php', '.rb',
            '.html', '.css', '.scss', '.less', '.json', '.xml', '.yaml', '.yml', '.md', '.txt',
            '.zip', '.rar', '.7z', '.tar', '.gz'
        ];
        
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext) || file.mimetype.startsWith('text/')) {
            cb(null, true);
        } else {
            cb(new Error(`不支持的文件类型: ${ext}`), false);
        }
    }
});

// 上传项目文件
router.post('/upload', upload.array('files'), async (req, res) => {
    try {
        const { projectInfo } = req.body;
        const files = req.files;
        
        if (!files || files.length === 0) {
            return res.status(400).json({ error: '请选择要上传的文件' });
        }
        
        // 生成项目ID
        const projectId = uuidv4();
        const projectDir = path.join(__dirname, '../uploads', projectId);
        await fs.ensureDir(projectDir);
        
        // 处理上传的文件
        const processedFiles = [];
        
        for (const file of files) {
            const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
            const targetPath = path.join(projectDir, originalName);
            
            // 确保目标目录存在
            await fs.ensureDir(path.dirname(targetPath));
            
            // 移动文件到项目目录
            await fs.move(file.path, targetPath);
            
            // 如果是压缩文件，解压
            if (['.zip', '.rar', '.7z'].includes(path.extname(originalName).toLowerCase())) {
                await extractArchive(targetPath, path.dirname(targetPath));
            }
            
            processedFiles.push({
                originalName: originalName,
                path: targetPath,
                size: file.size,
                type: path.extname(originalName)
            });
        }
        
        // 保存项目信息
        const projectData = {
            id: projectId,
            info: JSON.parse(projectInfo || '{}'),
            files: processedFiles,
            uploadTime: new Date().toISOString(),
            status: 'uploaded'
        };
        
        const projectInfoPath = path.join(projectDir, 'project.json');
        await fs.writeJson(projectInfoPath, projectData, { spaces: 2 });
        
        res.json({
            success: true,
            projectId: projectId,
            filesCount: processedFiles.length,
            message: '项目文件上传成功'
        });
        
    } catch (error) {
        console.error('文件上传错误:', error);
        res.status(500).json({
            error: '文件上传失败',
            message: error.message
        });
    }
});

// 获取项目信息
router.get('/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const projectDir = path.join(__dirname, '../uploads', projectId);
        const projectInfoPath = path.join(projectDir, 'project.json');
        
        if (!await fs.pathExists(projectInfoPath)) {
            return res.status(404).json({ error: '项目不存在' });
        }
        
        const projectData = await fs.readJson(projectInfoPath);
        res.json(projectData);
        
    } catch (error) {
        console.error('获取项目信息错误:', error);
        res.status(500).json({
            error: '获取项目信息失败',
            message: error.message
        });
    }
});

// 分析项目结构
router.post('/:projectId/analyze', async (req, res) => {
    try {
        const { projectId } = req.params;
        const projectDir = path.join(__dirname, '../uploads', projectId);
        
        if (!await fs.pathExists(projectDir)) {
            return res.status(404).json({ error: '项目不存在' });
        }
        
        // 分析项目结构
        const analysis = await analyzeProjectStructure(projectDir);
        
        // 更新项目信息
        const projectInfoPath = path.join(projectDir, 'project.json');
        const projectData = await fs.readJson(projectInfoPath);
        projectData.analysis = analysis;
        projectData.status = 'analyzed';
        await fs.writeJson(projectInfoPath, projectData, { spaces: 2 });
        
        res.json({
            success: true,
            analysis: analysis,
            message: '项目分析完成'
        });
        
    } catch (error) {
        console.error('项目分析错误:', error);
        res.status(500).json({
            error: '项目分析失败',
            message: error.message
        });
    }
});

// 获取项目文件列表
router.get('/:projectId/files', async (req, res) => {
    try {
        const { projectId } = req.params;
        const projectDir = path.join(__dirname, '../uploads', projectId);
        
        if (!await fs.pathExists(projectDir)) {
            return res.status(404).json({ error: '项目不存在' });
        }
        
        const fileTree = await buildFileTree(projectDir);
        res.json(fileTree);
        
    } catch (error) {
        console.error('获取文件列表错误:', error);
        res.status(500).json({
            error: '获取文件列表失败',
            message: error.message
        });
    }
});

// 读取文件内容
router.get('/:projectId/files/*', async (req, res) => {
    try {
        const { projectId } = req.params;
        const filePath = req.params[0];
        const fullPath = path.join(__dirname, '../uploads', projectId, filePath);
        
        if (!await fs.pathExists(fullPath)) {
            return res.status(404).json({ error: '文件不存在' });
        }
        
        const stats = await fs.stat(fullPath);
        if (stats.isDirectory()) {
            return res.status(400).json({ error: '不能读取目录' });
        }
        
        // 检查文件大小，避免读取过大的文件
        if (stats.size > 1024 * 1024) { // 1MB
            return res.status(400).json({ error: '文件过大，无法预览' });
        }
        
        const content = await fs.readFile(fullPath, 'utf8');
        res.json({
            path: filePath,
            content: content,
            size: stats.size,
            modified: stats.mtime
        });
        
    } catch (error) {
        console.error('读取文件错误:', error);
        res.status(500).json({
            error: '读取文件失败',
            message: error.message
        });
    }
});

// 辅助函数：解压文件
async function extractArchive(archivePath, extractDir) {
    const ext = path.extname(archivePath).toLowerCase();
    
    if (ext === '.zip') {
        return new Promise((resolve, reject) => {
            fs.createReadStream(archivePath)
                .pipe(unzipper.Extract({ path: extractDir }))
                .on('close', resolve)
                .on('error', reject);
        });
    }
    
    // 其他格式的解压可以后续添加
}

// 辅助函数：分析项目结构
async function analyzeProjectStructure(projectDir) {
    const analysis = {
        totalFiles: 0,
        totalSize: 0,
        fileTypes: {},
        languages: {},
        frameworks: [],
        structure: {}
    };
    
    const files = await fs.readdir(projectDir, { recursive: true });
    
    for (const file of files) {
        const filePath = path.join(projectDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isFile() && file !== 'project.json') {
            analysis.totalFiles++;
            analysis.totalSize += stats.size;
            
            const ext = path.extname(file).toLowerCase();
            analysis.fileTypes[ext] = (analysis.fileTypes[ext] || 0) + 1;
            
            // 检测编程语言
            const language = detectLanguage(ext);
            if (language) {
                analysis.languages[language] = (analysis.languages[language] || 0) + 1;
            }
        }
    }
    
    // 检测框架
    analysis.frameworks = await detectFrameworks(projectDir);
    
    return analysis;
}

// 辅助函数：检测编程语言
function detectLanguage(ext) {
    const languageMap = {
        '.js': 'JavaScript',
        '.ts': 'TypeScript',
        '.jsx': 'React',
        '.tsx': 'React TypeScript',
        '.vue': 'Vue.js',
        '.py': 'Python',
        '.java': 'Java',
        '.c': 'C',
        '.cpp': 'C++',
        '.cs': 'C#',
        '.go': 'Go',
        '.php': 'PHP',
        '.rb': 'Ruby',
        '.html': 'HTML',
        '.css': 'CSS',
        '.scss': 'SCSS',
        '.less': 'Less'
    };
    
    return languageMap[ext];
}

// 辅助函数：检测框架
async function detectFrameworks(projectDir) {
    const frameworks = [];
    
    // 检查package.json
    const packageJsonPath = path.join(projectDir, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
        try {
            const packageJson = await fs.readJson(packageJsonPath);
            const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
            
            if (dependencies.vue) frameworks.push('Vue.js');
            if (dependencies.react) frameworks.push('React');
            if (dependencies.angular) frameworks.push('Angular');
            if (dependencies.express) frameworks.push('Express.js');
            if (dependencies.koa) frameworks.push('Koa.js');
            if (dependencies['element-ui']) frameworks.push('Element UI');
            if (dependencies['ant-design-vue']) frameworks.push('Ant Design Vue');
        } catch (error) {
            console.warn('解析package.json失败:', error.message);
        }
    }
    
    // 检查其他配置文件
    const configFiles = [
        { file: 'vue.config.js', framework: 'Vue.js' },
        { file: 'angular.json', framework: 'Angular' },
        { file: 'next.config.js', framework: 'Next.js' },
        { file: 'nuxt.config.js', framework: 'Nuxt.js' }
    ];
    
    for (const config of configFiles) {
        if (await fs.pathExists(path.join(projectDir, config.file))) {
            if (!frameworks.includes(config.framework)) {
                frameworks.push(config.framework);
            }
        }
    }
    
    return frameworks;
}

// 辅助函数：构建文件树
async function buildFileTree(dir, basePath = '') {
    const items = await fs.readdir(dir);
    const tree = [];
    
    for (const item of items) {
        if (item === 'project.json') continue; // 跳过项目配置文件
        
        const itemPath = path.join(dir, item);
        const stats = await fs.stat(itemPath);
        const relativePath = path.join(basePath, item);
        
        if (stats.isDirectory()) {
            const children = await buildFileTree(itemPath, relativePath);
            tree.push({
                name: item,
                type: 'directory',
                path: relativePath,
                children: children
            });
        } else {
            tree.push({
                name: item,
                type: 'file',
                path: relativePath,
                size: stats.size,
                modified: stats.mtime,
                extension: path.extname(item)
            });
        }
    }
    
    return tree.sort((a, b) => {
        // 目录排在前面，然后按名称排序
        if (a.type !== b.type) {
            return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
    });
}

module.exports = router; 