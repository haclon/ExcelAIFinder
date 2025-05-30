const express = require('express');
const axios = require('axios');

const router = express.Router();

// AI模型配置
const AI_MODELS = {
    deepseek: {
        name: 'DeepSeek',
        url: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions',
        key: process.env.DEEPSEEK_API_KEY,
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat'
    },
    qwen: {
        name: 'Qwen',
        url: process.env.QWEN_API_URL || 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
        key: process.env.QWEN_API_KEY,
        model: process.env.QWEN_MODEL || 'qwen-max'
    },
    openai: {
        name: 'OpenAI',
        url: process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions',
        key: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-4'
    }
};

// 测试AI连接
router.post('/test', async (req, res) => {
    try {
        const { model = 'deepseek' } = req.body;
        const aiConfig = AI_MODELS[model];
        
        if (!aiConfig || !aiConfig.key) {
            return res.status(400).json({
                error: 'AI模型配置不完整',
                message: `请检查${aiConfig?.name || model}的API密钥配置`
            });
        }
        
        const testMessage = '你好，请回复"连接成功"';
        const response = await callAI(model, testMessage);
        
        res.json({
            success: true,
            model: aiConfig.name,
            response: response,
            message: 'AI连接测试成功'
        });
        
    } catch (error) {
        console.error('AI连接测试失败:', error);
        res.status(500).json({
            error: 'AI连接测试失败',
            message: error.message
        });
    }
});

// 获取可用的AI模型列表
router.get('/models', (req, res) => {
    const models = Object.keys(AI_MODELS).map(key => ({
        id: key,
        name: AI_MODELS[key].name,
        available: !!AI_MODELS[key].key
    }));
    
    res.json(models);
});

// 生成项目描述
router.post('/describe-project', async (req, res) => {
    try {
        const { projectInfo, analysis, model = 'deepseek' } = req.body;
        
        if (!projectInfo || !analysis) {
            return res.status(400).json({ error: '缺少项目信息或分析数据' });
        }
        
        const prompt = buildProjectDescriptionPrompt(projectInfo, analysis);
        const description = await callAI(model, prompt);
        
        res.json({
            success: true,
            description: description,
            message: '项目描述生成成功'
        });
        
    } catch (error) {
        console.error('生成项目描述失败:', error);
        res.status(500).json({
            error: '生成项目描述失败',
            message: error.message
        });
    }
});

// 生成技术特点
router.post('/technical-features', async (req, res) => {
    try {
        const { projectInfo, analysis, codeSnippets, model = 'deepseek' } = req.body;
        
        const prompt = buildTechnicalFeaturesPrompt(projectInfo, analysis, codeSnippets);
        const features = await callAI(model, prompt);
        
        res.json({
            success: true,
            features: features,
            message: '技术特点生成成功'
        });
        
    } catch (error) {
        console.error('生成技术特点失败:', error);
        res.status(500).json({
            error: '生成技术特点失败',
            message: error.message
        });
    }
});

// 生成功能说明
router.post('/functional-description', async (req, res) => {
    try {
        const { projectInfo, analysis, model = 'deepseek' } = req.body;
        
        const prompt = buildFunctionalDescriptionPrompt(projectInfo, analysis);
        const description = await callAI(model, prompt);
        
        res.json({
            success: true,
            description: description,
            message: '功能说明生成成功'
        });
        
    } catch (error) {
        console.error('生成功能说明失败:', error);
        res.status(500).json({
            error: '生成功能说明失败',
            message: error.message
        });
    }
});

// 通用AI调用接口
router.post('/chat', async (req, res) => {
    try {
        const { message, model = 'deepseek', context = [] } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: '请提供消息内容' });
        }
        
        const response = await callAI(model, message, context);
        
        res.json({
            success: true,
            response: response,
            model: AI_MODELS[model]?.name || model
        });
        
    } catch (error) {
        console.error('AI对话失败:', error);
        res.status(500).json({
            error: 'AI对话失败',
            message: error.message
        });
    }
});

// 核心AI调用函数
async function callAI(modelType, message, context = []) {
    const aiConfig = AI_MODELS[modelType];
    
    if (!aiConfig || !aiConfig.key) {
        throw new Error(`AI模型 ${modelType} 配置不完整`);
    }
    
    const messages = [
        ...context,
        { role: 'user', content: message }
    ];
    
    try {
        let response;
        
        if (modelType === 'qwen') {
            // 通义千问API格式
            response = await axios.post(aiConfig.url, {
                model: aiConfig.model,
                input: {
                    messages: messages
                },
                parameters: {
                    temperature: 0.7,
                    max_tokens: 2000
                }
            }, {
                headers: {
                    'Authorization': `Bearer ${aiConfig.key}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });
            
            return response.data.output.text;
            
        } else {
            // OpenAI兼容格式 (DeepSeek, OpenAI等)
            response = await axios.post(aiConfig.url, {
                model: aiConfig.model,
                messages: messages,
                temperature: 0.7,
                max_tokens: 2000
            }, {
                headers: {
                    'Authorization': `Bearer ${aiConfig.key}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });
            
            return response.data.choices[0].message.content;
        }
        
    } catch (error) {
        console.error(`${aiConfig.name} API调用失败:`, error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            throw new Error(`${aiConfig.name} API密钥无效`);
        } else if (error.response?.status === 429) {
            throw new Error(`${aiConfig.name} API调用频率超限`);
        } else if (error.code === 'ECONNABORTED') {
            throw new Error(`${aiConfig.name} API调用超时`);
        } else {
            throw new Error(`${aiConfig.name} API调用失败: ${error.message}`);
        }
    }
}

// 构建项目描述提示词
function buildProjectDescriptionPrompt(projectInfo, analysis) {
    return `请根据以下信息，为软件著作权申请生成一个专业的项目描述：

项目基本信息：
- 软件名称：${projectInfo.name || '未指定'}
- 版本号：${projectInfo.version || '1.0.0'}
- 开发公司：${projectInfo.company || '未指定'}
- 软件类型：${projectInfo.type || '应用软件'}

项目技术分析：
- 总文件数：${analysis.totalFiles}
- 主要编程语言：${Object.keys(analysis.languages).join(', ')}
- 使用框架：${analysis.frameworks.join(', ')}
- 文件类型分布：${JSON.stringify(analysis.fileTypes)}

请生成一个包含以下内容的项目描述：
1. 软件的主要功能和用途
2. 技术架构和实现方式
3. 创新点和技术特色
4. 适用场景和目标用户

要求：
- 语言专业、准确
- 突出技术特点和创新性
- 符合软件著作权申请要求
- 字数控制在500-800字`;
}

// 构建技术特点提示词
function buildTechnicalFeaturesPrompt(projectInfo, analysis, codeSnippets) {
    return `请根据以下信息，为软件著作权申请生成详细的技术特点说明：

项目信息：
- 软件名称：${projectInfo.name || '未指定'}
- 主要技术栈：${Object.keys(analysis.languages).join(', ')}
- 使用框架：${analysis.frameworks.join(', ')}

代码特征：
${codeSnippets ? `关键代码片段：\n${codeSnippets}` : ''}

请从以下角度分析技术特点：
1. 架构设计特点
2. 核心算法和技术实现
3. 性能优化措施
4. 安全性设计
5. 用户体验优化
6. 可扩展性和维护性

要求：
- 技术描述准确专业
- 突出创新性和先进性
- 每个特点都要有具体说明
- 字数控制在800-1200字`;
}

// 构建功能说明提示词
function buildFunctionalDescriptionPrompt(projectInfo, analysis) {
    return `请根据以下信息，为软件著作权申请生成详细的功能说明：

项目信息：
- 软件名称：${projectInfo.name || '未指定'}
- 软件类型：${projectInfo.type || '应用软件'}
- 主要技术：${Object.keys(analysis.languages).join(', ')}

请生成包含以下内容的功能说明：
1. 核心功能模块
2. 用户操作流程
3. 数据处理能力
4. 系统集成功能
5. 管理和配置功能

要求：
- 功能描述清晰具体
- 按模块分类说明
- 突出实用性和完整性
- 字数控制在600-1000字`;
}

module.exports = router; 