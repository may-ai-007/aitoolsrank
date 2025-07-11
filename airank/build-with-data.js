/**
 * 自定义构建脚本
 * 用于在构建过程中处理数据文件并执行构建
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 主函数
function main() {
  console.log('开始自定义构建过程...');
  
  try {
    // 检查数据文件是否已解密
    const dataDir = path.join(__dirname, 'src', 'data');
    const languages = ['en', 'zh'];
    const rankingTypes = ['monthly_rank', 'total_rank', 'income_rank', 'region_rank'];
    let allDataReady = true;
    
    languages.forEach(lang => {
      const langDir = path.join(dataDir, lang);
      
      // 确保语言目录存在
      if (!fs.existsSync(langDir)) {
        console.log(`创建语言目录: ${langDir}`);
        fs.mkdirSync(langDir, { recursive: true });
      }
      
      rankingTypes.forEach(rankType => {
        const jsonFilePath = path.join(langDir, `${rankType}.json`);
        if (!fs.existsSync(jsonFilePath)) {
          console.log(`数据文件不存在: ${jsonFilePath}`);
          allDataReady = false;
        } else {
          try {
            const content = fs.readFileSync(jsonFilePath, 'utf8');
            const data = JSON.parse(content);
            if (!data || !data.metadata || !data.data || data.data.length === 0) {
              console.log(`数据文件格式无效: ${jsonFilePath}`);
              allDataReady = false;
            } else {
              console.log(`数据文件有效: ${jsonFilePath}`);
            }
          } catch (error) {
            console.error(`读取数据文件失败: ${jsonFilePath}`, error);
            allDataReady = false;
          }
        }
      });
    });
    
    if (!allDataReady) {
      console.warn('部分数据文件不存在或格式无效');
      
      // 检查是否有decrypt_build.js
      if (fs.existsSync('./decrypt_build.js')) {
        console.log('尝试使用decrypt_build.js解密数据...');
        try {
          execSync('node ./decrypt_build.js', { stdio: 'inherit' });
        } catch (error) {
          console.error('使用decrypt_build.js解密数据失败:', error);
        }
      }
      
      // 检查.enc文件并警告
      languages.forEach(lang => {
        const langDir = path.join(dataDir, lang);
        if (fs.existsSync(langDir)) {
          rankingTypes.forEach(rankType => {
            const encFilePath = path.join(langDir, `${rankType}.enc`);
            const jsonFilePath = path.join(langDir, `${rankType}.json`);
            
            if (fs.existsSync(encFilePath) && !fs.existsSync(jsonFilePath)) {
              console.warn(`警告: 存在加密文件但未解密: ${encFilePath}`);
            }
          });
        }
      });
    }
    
    // 确保dist/assets/data目录存在
    const distDataDir = path.join(__dirname, 'dist', 'assets', 'data');
    fs.mkdirSync(distDataDir, { recursive: true });
    
    // 运行标准构建命令
    console.log('运行标准构建命令...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // 构建后再次复制数据文件到dist/assets/data目录
    console.log('复制数据文件到构建目录...');
    languages.forEach(lang => {
      const srcLangDir = path.join(dataDir, lang);
      const destLangDir = path.join(distDataDir, lang);
      
      // 确保目标语言目录存在
      fs.mkdirSync(destLangDir, { recursive: true });
      
      if (fs.existsSync(srcLangDir)) {
        rankingTypes.forEach(rankType => {
          const jsonFilePath = path.join(srcLangDir, `${rankType}.json`);
          const destFilePath = path.join(destLangDir, `${rankType}.json`);
          
          if (fs.existsSync(jsonFilePath)) {
            fs.copyFileSync(jsonFilePath, destFilePath);
            console.log(`已复制数据文件: ${jsonFilePath} -> ${destFilePath}`);
          } else {
            console.warn(`警告: 数据文件不存在，无法复制: ${jsonFilePath}`);
          }
        });
      }
    });
    
    console.log('构建完成!');
  } catch (error) {
    console.error('构建过程中出错:', error);
    process.exit(1);
  }
}

// 执行主函数
main(); 