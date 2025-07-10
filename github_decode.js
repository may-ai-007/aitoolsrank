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
    console.log(`尝试解码文件: ${encodedFilePath}`);
    
    // 检查编码文件是否存在
    if (!fs.existsSync(encodedFilePath)) {
      console.error(`编码文件不存在: ${encodedFilePath}`);
      return false;
    }
    
    // 读取编码文件
    const encodedData = fs.readFileSync(encodedFilePath);
    console.log(`已读取编码文件，大小: ${encodedData.length} 字节`);
    
    // 解码数据
    const decodedData = decodeData(encodedData);
    
    if (!decodedData) {
      console.error(`解码失败: ${encodedFilePath}`);
      return false;
    }
    
    // 确保输出目录存在
    const outputDir = path.dirname(outputFilePath);
    if (!fs.existsSync(outputDir)) {
      console.log(`创建输出目录: ${outputDir}`);
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 写入解码后的文件
    fs.writeFileSync(outputFilePath, JSON.stringify(decodedData, null, 2));
    console.log(`成功解码: ${encodedFilePath} -> ${outputFilePath}`);
    
    // 检查文件是否已写入
    if (fs.existsSync(outputFilePath)) {
      const stats = fs.statSync(outputFilePath);
      console.log(`已写入文件，大小: ${stats.size} 字节`);
    } else {
      console.error(`文件写入失败: ${outputFilePath}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`解码文件失败: ${encodedFilePath}`, error);
    return false;
  }
}

// 处理数据目录
function processDataDirectory(dataDir) {
  console.log(`开始处理数据目录: ${dataDir}`);
  
  // 检查数据目录是否存在
  if (!fs.existsSync(dataDir)) {
    console.error(`数据目录不存在: ${dataDir}`);
    console.log('当前目录内容:');
    const parentDir = path.dirname(dataDir);
    if (fs.existsSync(parentDir)) {
      console.log(fs.readdirSync(parentDir));
    } else {
      console.log(`父目录 ${parentDir} 不存在`);
    }
    
    // 尝试创建数据目录
    try {
      console.log(`尝试创建数据目录: ${dataDir}`);
      fs.mkdirSync(dataDir, { recursive: true });
      console.log(`成功创建数据目录: ${dataDir}`);
    } catch (error) {
      console.error(`创建数据目录失败: ${dataDir}`, error);
      return;
    }
  }
  
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
      console.log(`语言目录不存在，创建: ${langDir}`);
      try {
        fs.mkdirSync(langDir, { recursive: true });
      } catch (error) {
        console.error(`创建语言目录失败: ${langDir}`, error);
        return;
      }
    }
    
    console.log(`处理语言目录: ${langDir}`);
    if (fs.existsSync(langDir)) {
      console.log(`目录内容: ${fs.readdirSync(langDir).join(', ')}`);
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
  console.log('开始解码数据文件...');
  console.log(`当前工作目录: ${process.cwd()}`);
  console.log(`脚本目录: ${__dirname}`);
  
  // 检查目录结构
  console.log('检查目录结构:');
  try {
    const files = fs.readdirSync('.');
    console.log(`当前目录内容: ${files.join(', ')}`);
    
    if (fs.existsSync('./src')) {
      console.log('src 目录存在');
      console.log(`内容: ${fs.readdirSync('./src').join(', ')}`);
      
      if (fs.existsSync('./src/data')) {
        console.log('src/data 目录存在');
        console.log(`内容: ${fs.readdirSync('./src/data').join(', ')}`);
      }
    }
  } catch (error) {
    console.error('检查目录结构时出错:', error);
  }
  
  // 尝试多种可能的数据目录路径
  const possibleDataDirs = [
    path.join(__dirname, 'airank', 'src', 'data'),  // 原始路径
    path.join(process.cwd(), 'src', 'data'),        // 当前工作目录下的 src/data
    path.join('src', 'data')                        // 相对路径 src/data
  ];
  
  let dataDir = null;
  for (const dir of possibleDataDirs) {
    console.log(`尝试数据目录: ${dir}`);
    if (fs.existsSync(dir)) {
      dataDir = dir;
      console.log(`找到数据目录: ${dataDir}`);
      break;
    }
  }
  
  if (!dataDir) {
    console.error('无法找到数据目录，使用默认路径');
    dataDir = path.join(process.cwd(), 'src', 'data');
  }
  
  console.log(`处理数据目录: ${dataDir}`);
  processDataDirectory(dataDir);
}

// 执行主函数
main();
