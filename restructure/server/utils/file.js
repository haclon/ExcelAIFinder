/**
 * 文件操作工具
 * 提供文件处理相关的辅助函数
 */

const fs = require('fs');
const path = require('path');

/**
 * 删除文件
 * @param {string} filePath - 要删除的文件路径
 * @returns {boolean} 删除成功返回true，否则返回false
 */
function deleteFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`已删除文件: ${filePath}`);
      return true;
    }
    return false;
  } catch (err) {
    console.error(`删除文件失败 ${filePath}:`, err);
    return false;
  }
}

/**
 * 确保目录存在，如不存在则创建
 * @param {string} dirPath - 目录路径
 */
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`已创建目录: ${dirPath}`);
  }
}

/**
 * 清空目录中的所有文件（但保留目录）
 * @param {string} dirPath - 目录路径
 * @param {boolean} recursive - 是否递归处理子目录
 */
function clearDirectory(dirPath, recursive = false) {
  if (!fs.existsSync(dirPath)) return;
  
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory() && recursive) {
      clearDirectory(filePath, recursive);
      fs.rmdirSync(filePath);
    } else if (!stats.isDirectory()) {
      fs.unlinkSync(filePath);
    }
  }
}

/**
 * 将对象写入JSON文件
 * @param {string} filePath - 文件路径
 * @param {Object} data - 要写入的数据
 * @returns {boolean} 写入成功返回true，否则返回false
 */
function writeJsonToFile(filePath, data) {
  try {
    const dirPath = path.dirname(filePath);
    ensureDirectoryExists(dirPath);
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error(`写入JSON文件失败 ${filePath}:`, err);
    return false;
  }
}

/**
 * 从JSON文件读取对象
 * @param {string} filePath - 文件路径
 * @param {Object} defaultValue - 如果文件不存在或读取失败，返回的默认值
 * @returns {Object} 读取的数据或默认值
 */
function readJsonFromFile(filePath, defaultValue = {}) {
  try {
    if (!fs.existsSync(filePath)) {
      return defaultValue;
    }
    
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`读取JSON文件失败 ${filePath}:`, err);
    return defaultValue;
  }
}

module.exports = {
  deleteFile,
  ensureDirectoryExists,
  clearDirectory,
  writeJsonToFile,
  readJsonFromFile
}; 