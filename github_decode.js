/**
 * GitHub Actions专用数据解码脚本
 * 用于在构建过程中将编码数据文件解码为JSON文件
 */

const fs = require('fs');
const path = require('path');

// 解码数据
function decodeData(encodedData) {
  try {
    // 将Buffer转换为字符串，以便进行Base64解码
    const encodedString = encodedData.toString();
    
    // Base64解码
    const jsonData = Buffer.from(encodedString, 'base64').toString('utf-8');
    
    // 解析JSON
    return JSON.parse(jsonData);
  } catch (error) {
    console.error('解码失败:', error);
    return null;
  }
}

// 解码文件
function decodeFile(encodedFilePath, outputFilePath) {
  try {
    // 读取编码文件
    const encodedData = fs.readFileSync(encodedFilePath);
    
    // 解码数据
    const decodedData = decodeData(encodedData);
    
    if (!decodedData) {
      console.error(`解码失败: ${encodedFilePath}`);
      return false;
    }
    
    // 写入解码后的文件
    fs.writeFileSync(outputFilePath, JSON.stringify(decodedData, null, 2));
    console.log(`成功解码: ${encodedFilePath} -> ${outputFilePath}`);
    return true;
  } catch (error) {
    console.error(`解码文件失败: ${encodedFilePath}`, error);
    return false;
  }
}

// 处理数据目录
function processDataDirectory(dataDir) {
  // 支持的语言和排名类型
  const languages = ['en', 'zh'];
  const rankingTypes = ['monthly_rank', 'total_rank', 'income_rank', 'region_rank'];
  
  let successCount = 0;
  let failCount = 0;
  
  // 遍历语言和排名类型
  languages.forEach(lang => {
    const langDir = path.join(dataDir, lang);
    
    // 确保语言目录存在
    if (!fs.existsSync(langDir)) {
      console.log(`语言目录不存在，跳过: ${langDir}`);
      return;
    }
    
    rankingTypes.forEach(rankType => {
      const encFilePath = path.join(langDir, `${rankType}.enc`);
      const jsonFilePath = path.join(langDir, `${rankType}.json`);
      
      // 检查编码文件是否存在
      if (fs.existsSync(encFilePath)) {
        console.log(`处理: ${encFilePath}`);
        const success = decodeFile(encFilePath, jsonFilePath);
        if (success) {
          successCount++;
        } else {
          failCount++;
        }
      } else {
        console.log(`编码文件不存在，跳过: ${encFilePath}`);
      }
    });
  });
  
  console.log(`\n解码完成: 成功 ${successCount} 个文件, 失败 ${failCount} 个文件`);
  
  // 如果有失败的文件，返回非零状态码
  if (failCount > 0) {
    process.exit(1);
  }
}

// 主函数
function main() {
  // 数据目录路径 - 修正为内层airank目录下的src/data
  const dataDir = path.join(__dirname, 'airank', 'src', 'data');
  console.log(`处理数据目录: ${dataDir}`);
  processDataDirectory(dataDir);
}

// 执行主函数
main();
