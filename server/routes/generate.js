const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const handlebars = require('handlebars');
const puppeteer = require('puppeteer');
const moment = require('moment');

const router = express.Router();

// 生成程序鉴别材料
router.post('/program-material/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { options = {} } = req.body;
        
        const projectDir = path.join(__dirname, '../uploads', projectId);
        const projectInfoPath = path.join(projectDir, 'project.json');
        
        if (!await fs.pathExists(projectInfoPath)) {
            return res.status(404).json({ error: '项目不存在' });
        }
        
        const projectData = await fs.readJson(projectInfoPath);
        
        // 提取源代码
        const sourceCode = await extractSourceCode(projectDir, options);
        
        // 生成程序鉴别材料
        const programMaterial = await generateProgramMaterial(projectData, sourceCode, options);
        
        // 保存生成的文件
        const outputPath = path.join(__dirname, '../generated', `${projectId}_program_material.html`);
        await fs.ensureDir(path.dirname(outputPath));
        await fs.writeFile(outputPath, programMaterial, 'utf8');
        
        res.json({
            success: true,
            filePath: `/generated/${projectId}_program_material.html`,
            message: '程序鉴别材料生成成功'
        });
        
    } catch (error) {
        console.error('生成程序鉴别材料失败:', error);
        res.status(500).json({
            error: '生成程序鉴别材料失败',
            message: error.message
        });
    }
});

// 生成文档鉴别材料
router.post('/document-material/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { aiContent, options = {} } = req.body;
        
        const projectDir = path.join(__dirname, '../uploads', projectId);
        const projectInfoPath = path.join(projectDir, 'project.json');
        
        if (!await fs.pathExists(projectInfoPath)) {
            return res.status(404).json({ error: '项目不存在' });
        }
        
        const projectData = await fs.readJson(projectInfoPath);
        
        // 生成文档鉴别材料
        const documentMaterial = await generateDocumentMaterial(projectData, aiContent, options);
        
        // 保存生成的文件
        const outputPath = path.join(__dirname, '../generated', `${projectId}_document_material.html`);
        await fs.ensureDir(path.dirname(outputPath));
        await fs.writeFile(outputPath, documentMaterial, 'utf8');
        
        res.json({
            success: true,
            filePath: `/generated/${projectId}_document_material.html`,
            message: '文档鉴别材料生成成功'
        });
        
    } catch (error) {
        console.error('生成文档鉴别材料失败:', error);
        res.status(500).json({
            error: '生成文档鉴别材料失败',
            message: error.message
        });
    }
});

// 生成完整的软著申请包
router.post('/complete-package/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { aiContent, options = {} } = req.body;
        
        const projectDir = path.join(__dirname, '../uploads', projectId);
        const projectInfoPath = path.join(projectDir, 'project.json');
        
        if (!await fs.pathExists(projectInfoPath)) {
            return res.status(404).json({ error: '项目不存在' });
        }
        
        const projectData = await fs.readJson(projectInfoPath);
        
        // 生成所有材料
        const sourceCode = await extractSourceCode(projectDir, options);
        const programMaterial = await generateProgramMaterial(projectData, sourceCode, options);
        const documentMaterial = await generateDocumentMaterial(projectData, aiContent, options);
        const applicationForm = await generateApplicationForm(projectData, options);
        
        // 保存所有文件
        const outputDir = path.join(__dirname, '../generated', projectId);
        await fs.ensureDir(outputDir);
        
        const files = [
            { name: '程序鉴别材料.html', content: programMaterial },
            { name: '文档鉴别材料.html', content: documentMaterial },
            { name: '软件著作权登记申请表.html', content: applicationForm }
        ];
        
        const generatedFiles = [];
        for (const file of files) {
            const filePath = path.join(outputDir, file.name);
            await fs.writeFile(filePath, file.content, 'utf8');
            generatedFiles.push({
                name: file.name,
                path: `/generated/${projectId}/${file.name}`
            });
        }
        
        res.json({
            success: true,
            files: generatedFiles,
            message: '软著申请材料包生成成功'
        });
        
    } catch (error) {
        console.error('生成软著申请包失败:', error);
        res.status(500).json({
            error: '生成软著申请包失败',
            message: error.message
        });
    }
});

// 转换为PDF
router.post('/convert-to-pdf/:projectId/:fileName', async (req, res) => {
    try {
        const { projectId, fileName } = req.params;
        const htmlPath = path.join(__dirname, '../generated', projectId, fileName);
        
        if (!await fs.pathExists(htmlPath)) {
            return res.status(404).json({ error: 'HTML文件不存在' });
        }
        
        const pdfPath = htmlPath.replace('.html', '.pdf');
        await convertHtmlToPdf(htmlPath, pdfPath);
        
        res.json({
            success: true,
            pdfPath: `/generated/${projectId}/${path.basename(pdfPath)}`,
            message: 'PDF转换成功'
        });
        
    } catch (error) {
        console.error('PDF转换失败:', error);
        res.status(500).json({
            error: 'PDF转换失败',
            message: error.message
        });
    }
});

// 提取源代码
async function extractSourceCode(projectDir, options = {}) {
    const {
        maxLines = 3000,
        frontPages = 30,
        backPages = 30,
        linesPerPage = 50
    } = options;
    
    const sourceFiles = [];
    const allowedExtensions = ['.js', '.ts', '.jsx', '.tsx', '.vue', '.py', '.java', '.c', '.cpp', '.cs', '.go', '.php', '.rb'];
    
    // 递归查找源代码文件
    async function findSourceFiles(dir, basePath = '') {
        const items = await fs.readdir(dir);
        
        for (const item of items) {
            if (item === 'project.json' || item.startsWith('.')) continue;
            
            const itemPath = path.join(dir, item);
            const stats = await fs.stat(itemPath);
            const relativePath = path.join(basePath, item);
            
            if (stats.isDirectory()) {
                // 跳过常见的无关目录
                if (['node_modules', '.git', 'dist', 'build', '.vscode'].includes(item)) {
                    continue;
                }
                await findSourceFiles(itemPath, relativePath);
            } else if (allowedExtensions.includes(path.extname(item).toLowerCase())) {
                try {
                    const content = await fs.readFile(itemPath, 'utf8');
                    sourceFiles.push({
                        path: relativePath,
                        content: content,
                        lines: content.split('\n').length
                    });
                } catch (error) {
                    console.warn(`读取文件失败: ${relativePath}`, error.message);
                }
            }
        }
    }
    
    await findSourceFiles(projectDir);
    
    // 按文件路径排序
    sourceFiles.sort((a, b) => a.path.localeCompare(b.path));
    
    // 合并所有源代码
    let allLines = [];
    for (const file of sourceFiles) {
        allLines.push(`// 文件: ${file.path}`);
        allLines.push(...file.content.split('\n'));
        allLines.push(''); // 空行分隔
    }
    
    // 计算前30页和后30页
    const totalPages = Math.ceil(allLines.length / linesPerPage);
    const frontEndLine = frontPages * linesPerPage;
    const backStartLine = Math.max(frontEndLine, allLines.length - (backPages * linesPerPage));
    
    const frontLines = allLines.slice(0, frontEndLine);
    const backLines = allLines.slice(backStartLine);
    
    return {
        frontLines,
        backLines,
        totalLines: allLines.length,
        totalPages,
        sourceFiles: sourceFiles.map(f => ({ path: f.path, lines: f.lines }))
    };
}

// 生成程序鉴别材料
async function generateProgramMaterial(projectData, sourceCode, options = {}) {
    const templatePath = path.join(__dirname, '../templates/program-material.hbs');
    const template = await fs.readFile(templatePath, 'utf8');
    const compiledTemplate = handlebars.compile(template);
    
    const data = {
        project: projectData.info,
        sourceCode: sourceCode,
        generatedDate: moment().format('YYYY年MM月DD日'),
        options: options
    };
    
    return compiledTemplate(data);
}

// 生成文档鉴别材料
async function generateDocumentMaterial(projectData, aiContent, options = {}) {
    const templatePath = path.join(__dirname, '../templates/document-material.hbs');
    const template = await fs.readFile(templatePath, 'utf8');
    const compiledTemplate = handlebars.compile(template);
    
    const data = {
        project: projectData.info,
        analysis: projectData.analysis,
        aiContent: aiContent,
        generatedDate: moment().format('YYYY年MM月DD日'),
        options: options
    };
    
    return compiledTemplate(data);
}

// 生成申请表
async function generateApplicationForm(projectData, options = {}) {
    const templatePath = path.join(__dirname, '../templates/application-form.hbs');
    const template = await fs.readFile(templatePath, 'utf8');
    const compiledTemplate = handlebars.compile(template);
    
    const data = {
        project: projectData.info,
        analysis: projectData.analysis,
        generatedDate: moment().format('YYYY年MM月DD日'),
        options: options
    };
    
    return compiledTemplate(data);
}

// HTML转PDF
async function convertHtmlToPdf(htmlPath, pdfPath) {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        const htmlContent = await fs.readFile(htmlPath, 'utf8');
        
        await page.setContent(htmlContent, {
            waitUntil: 'networkidle0'
        });
        
        await page.pdf({
            path: pdfPath,
            format: 'A4',
            margin: {
                top: '20mm',
                right: '20mm',
                bottom: '20mm',
                left: '20mm'
            },
            printBackground: true
        });
        
    } finally {
        await browser.close();
    }
}

module.exports = router; 