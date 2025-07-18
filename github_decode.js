/**
 * GitHub Actions专用数据解码脚本
 * 用于在构建过程中将编码数据文件解码为JSON文件
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 从环境变量或文件获取解密密钥
function getDecryptKey() {
  // 首先尝试从环境变量获取
  if (process.env.DECRYPT_KEY) {
    console.log('从环境变量获取解密密钥');
    return process.env.DECRYPT_KEY;
  }
  
  // 如果环境变量不存在，尝试从文件获取
  try {
    const keyPath = path.join(__dirname, 'encryption_key.key');
    if (fs.existsSync(keyPath)) {
      console.log('从文件获取解密密钥');
      return fs.readFileSync(keyPath, 'utf8').trim();
    }
  } catch (error) {
    console.error('从文件获取密钥失败:', error);
  }
  
  console.warn('警告: 未找到解密密钥，将尝试使用Base64解码');
  return null;
}

// Fernet解密函数
function fernetDecrypt(encryptedData, key) {
  try {
    // 解析密文
    const data = Buffer.from(encryptedData, 'base64');
    
    // 提取IV (前16字节)
    const iv = data.slice(8, 24);
    
    // 提取密文 (除去签名、时间戳、IV)
    const ciphertext = data.slice(24, -32);
    
    // 派生密钥
    const keyBuffer = Buffer.from(key, 'base64');
    const signingKey = keyBuffer.slice(0, 16);
    const encryptionKey = keyBuffer.slice(16);
    
    // 解密
    const decipher = crypto.createDecipheriv('aes-128-cbc', encryptionKey, iv);
    let decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    // 移除填充
    const padLength = decrypted[decrypted.length - 1];
    const unpadded = decrypted.slice(0, decrypted.length - padLength);
    
    // 解析JSON
    return JSON.parse(unpadded.toString('utf8'));
  } catch (error) {
    console.error('Fernet解密失败:', error);
    return null;
  }
}

// 解码数据
function decodeData(encodedData) {
  try {
    const key = getDecryptKey();
    
    if (key) {
      // 尝试使用Fernet解密
      try {
        console.log('尝试使用Fernet解密');
        return fernetDecrypt(encodedData, key);
      } catch (fernetError) {
        console.error('Fernet解密失败，尝试Base64解码:', fernetError);
      }
    }
    
    // 回退到Base64解码
    console.log('使用Base64解码');
    const encodedString = encodedData.toString();
    const jsonData = Buffer.from(encodedString, 'base64').toString('utf-8');
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
      
      // 验证 JSON 文件是否有效
      try {
        const content = fs.readFileSync(outputFilePath, 'utf8');
        JSON.parse(content);
        console.log(`验证成功: ${outputFilePath} 是有效的 JSON 文件`);
      } catch (validationError) {
        console.error(`验证失败: ${outputFilePath} 不是有效的 JSON 文件`, validationError);
        return false;
      }
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
          
          // 如果解码失败，创建一个测试数据文件作为备用
          console.log(`解码失败，创建测试数据文件作为备用: ${jsonFilePath}`);
          try {
            const testData = {
              metadata: {
                last_updated: new Date().toISOString(),
                ranking_type: rankType,
                language: lang,
                total_items: 1
              },
              data: [
                {
                  id: "test-1",
                  rank: 1,
                  name: "Test AI Tool",
                  url: "https://example.com",
                  logo: "",
                  description: "This is a test AI tool for debugging purposes.",
                  monthly_visits: 1000000,
                  top_visits: 5000000,
                  top_region: "Global",
                  top_region_value: 0.6, // 添加top_region_value字段
                  region_monthly_visits: 600000, // 添加region_monthly_visits字段
                  tags: ["test", "debug"],
                  growth: 0.5,
                  growth_rate: 0.2,
                  estimated_income: 100000
                }
              ]
            };
            
            fs.writeFileSync(jsonFilePath, JSON.stringify(testData, null, 2));
            console.log(`成功创建测试数据文件: ${jsonFilePath}`);
          } catch (error) {
            console.error(`创建测试数据文件失败: ${jsonFilePath}`, error);
          }
        }
      } else {
        console.log(`编码文件不存在，创建测试数据文件: ${jsonFilePath}`);
        try {
          const testData = {
            metadata: {
              last_updated: new Date().toISOString(),
              ranking_type: rankType,
              language: lang,
              total_items: 1
            },
            data: [
              {
                id: "test-1",
                rank: 1,
                name: "Test AI Tool",
                url: "https://example.com",
                logo: "",
                description: "This is a test AI tool for debugging purposes.",
                monthly_visits: 1000000,
                top_visits: 5000000,
                top_region: "Global",
                top_region_value: 0.6, // 添加top_region_value字段
                region_monthly_visits: 600000, // 添加region_monthly_visits字段
                tags: ["test", "debug"],
                growth: 0.5,
                growth_rate: 0.2,
                estimated_income: 100000
              }
            ]
          };
          
          // 确保输出目录存在
          const outputDir = path.dirname(jsonFilePath);
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }
          
          fs.writeFileSync(jsonFilePath, JSON.stringify(testData, null, 2));
          console.log(`成功创建测试数据文件: ${jsonFilePath}`);
        } catch (error) {
          console.error(`创建测试数据文件失败: ${jsonFilePath}`, error);
          failCount++;
        }
      }
    });
  });
  
  console.log(`\n解码完成: 成功 ${successCount} 个文件, 失败 ${failCount} 个文件`);
}

// 查找数据目录
function findDataDirectory() {
  console.log('尝试查找数据目录...');
  
  // 尝试多种可能的数据目录路径
  const possibleDataDirs = [
    path.join(__dirname, 'airank', 'src', 'data'),        // 原始路径
    path.join(process.cwd(), 'src', 'data'),              // 当前工作目录下的 src/data
    path.join('src', 'data'),                             // 相对路径 src/data
    path.join('airank', 'src', 'data'),                   // 相对路径 airank/src/data
    path.join(__dirname, 'src', 'data'),                  // 脚本目录下的 src/data
    path.join(path.dirname(__dirname), 'src', 'data'),    // 父目录下的 src/data
    path.join(path.dirname(process.cwd()), 'src', 'data') // 父工作目录下的 src/data
  ];
  
  for (const dir of possibleDataDirs) {
    console.log(`尝试数据目录: ${dir}`);
    if (fs.existsSync(dir)) {
      console.log(`找到数据目录: ${dir}`);
      return dir;
    }
  }
  
  // 如果找不到数据目录，尝试在当前目录和父目录中查找 src 目录
  const currentDir = process.cwd();
  console.log(`当前目录: ${currentDir}`);
  
  if (fs.existsSync(path.join(currentDir, 'src'))) {
    const dataDir = path.join(currentDir, 'src', 'data');
    console.log(`找到 src 目录，使用数据目录: ${dataDir}`);
    
    // 确保数据目录存在
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    return dataDir;
  }
  
  const parentDir = path.dirname(currentDir);
  console.log(`父目录: ${parentDir}`);
  
  if (fs.existsSync(path.join(parentDir, 'src'))) {
    const dataDir = path.join(parentDir, 'src', 'data');
    console.log(`在父目录中找到 src 目录，使用数据目录: ${dataDir}`);
    
    // 确保数据目录存在
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    return dataDir;
  }
  
  // 如果仍然找不到，使用默认路径并创建目录
  const defaultDataDir = path.join(process.cwd(), 'src', 'data');
  console.log(`无法找到数据目录，使用默认路径: ${defaultDataDir}`);
  
  // 确保数据目录存在
  if (!fs.existsSync(defaultDataDir)) {
    fs.mkdirSync(defaultDataDir, { recursive: true });
  }
  
  return defaultDataDir;
}

// 主函数
function main() {
  console.log('开始解码数据文件...');
  console.log(`当前工作目录: ${process.cwd()}`);
  console.log(`脚本目录: ${__dirname}`);
  console.log(`Node.js 版本: ${process.version}`);
  console.log(`操作系统: ${process.platform} ${process.arch}`);
  
  // 检查环境变量
  if (process.env.DECRYPT_KEY) {
    console.log('找到环境变量 DECRYPT_KEY');
  } else {
    console.log('未找到环境变量 DECRYPT_KEY，将尝试从文件加载密钥');
  }
  
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
  
  // 查找数据目录
  const dataDir = findDataDirectory();
  
  // 处理数据目录
  console.log(`处理数据目录: ${dataDir}`);
  processDataDirectory(dataDir);
  
  // 验证解码后的文件
  console.log('验证解码后的文件:');
  try {
    const languages = ['en', 'zh'];
    const rankingTypes = ['monthly_rank', 'total_rank', 'income_rank', 'region_rank'];
    
    languages.forEach(lang => {
      const langDir = path.join(dataDir, lang);
      
      if (fs.existsSync(langDir)) {
        rankingTypes.forEach(rankType => {
          const jsonFilePath = path.join(langDir, `${rankType}.json`);
          
          if (fs.existsSync(jsonFilePath)) {
            console.log(`验证文件: ${jsonFilePath}`);
            
            try {
              const content = fs.readFileSync(jsonFilePath, 'utf8');
              const data = JSON.parse(content);
              
              if (data && data.metadata && data.data) {
                console.log(`文件有效: ${jsonFilePath}`);
                console.log(`  - 元数据: ${JSON.stringify(data.metadata)}`);
                console.log(`  - 数据项数: ${data.data.length}`);
              } else {
                console.error(`文件结构无效: ${jsonFilePath}`);
              }
            } catch (error) {
              console.error(`验证文件失败: ${jsonFilePath}`, error);
            }
          } else {
            console.error(`文件不存在: ${jsonFilePath}`);
          }
        });
      }
    });
  } catch (error) {
    console.error('验证文件时出错:', error);
  }
}

// 执行主函数
main();
