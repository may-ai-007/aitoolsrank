/**
 * 自定义构建脚本
 * 用于在构建过程中处理数据文件
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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
      rankingTypes.forEach(rankType => {
        const jsonFilePath = path.join(dataDir, lang, `${rankType}.json`);
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
      console.warn('部分数据文件不存在或格式无效，将尝试重新解密');
      
      // 尝试使用不同的解密方法
      try {
        console.log('尝试使用github_decode.js解密数据...');
        if (fs.existsSync('../github_decode.js')) {
          execSync('node ../github_decode.js', { stdio: 'inherit' });
        } else if (fs.existsSync('./github_decode.js')) {
          execSync('node ./github_decode.js', { stdio: 'inherit' });
        } else {
          console.warn('找不到github_decode.js，跳过解密步骤');
        }
      } catch (error) {
        console.error('使用github_decode.js解密数据失败:', error);
      }
      
      // 检查是否有decrypt_build.js
      try {
        console.log('尝试使用decrypt_build.js解密数据...');
        if (fs.existsSync('./decrypt_build.js')) {
          execSync('node ./decrypt_build.js', { stdio: 'inherit' });
        } else {
          console.warn('找不到decrypt_build.js，跳过解密步骤');
        }
      } catch (error) {
        console.error('使用decrypt_build.js解密数据失败:', error);
      }
    }
    
    // 运行标准构建命令
    console.log('运行标准构建命令...');
    execSync('npm run build', { stdio: 'inherit' });
    
    console.log('构建完成!');
  } catch (error) {
    console.error('构建过程中出错:', error);
    process.exit(1);
  }
}

// 执行主函数
main(); 