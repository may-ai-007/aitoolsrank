/**
 * 修复加密文件解密问题
 * 
 * 问题分析：
 * 1. 加密文件是先用Fernet加密，再进行Base64编码
 * 2. 解密脚本尝试直接解密而不先进行Base64解码，导致解密失败
 * 3. 本脚本正确处理Base64解码步骤，成功解密文件
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 密钥 (可接受多种格式，但推荐使用标准Base64格式 '+' 而非 '-')
const DECRYPT_KEY = process.env.DECRYPT_KEY || "SeS1+J7QZI2sIi4fDF3ObSuDuUN1L3yLOimJFkKTEjg=";

// 支持的语言和排名类型
const LANGUAGES = ['en', 'zh'];
const RANKING_TYPES = ['monthly_rank', 'total_rank', 'income_rank', 'region_rank'];

// 统计
let successCount = 0;
let failCount = 0;

// Fernet解密类
class Fernet {
  constructor(key) {
    try {
      // 从Base64解码密钥
      const keyBuffer = Buffer.from(key, 'base64');
      if (keyBuffer.length !== 32) {
        console.warn(`警告: 密钥长度应为32字节，实际为${keyBuffer.length}字节`);
      }
      this.signingKey = keyBuffer.slice(0, 16);
      this.encryptionKey = keyBuffer.slice(16);
      console.log(`密钥信息: 签名密钥长度=${this.signingKey.length}, 加密密钥长度=${this.encryptionKey.length}`);
    } catch (error) {
      console.error('创建Fernet实例失败:', error);
      throw error;
    }
  }
  
  // 解密Fernet格式的数据
  decryptFernetToken(token) {
    try {
      // 验证令牌是否为有效的Fernet格式
      if (token[0] !== 0x80) {
        console.error("不是有效的Fernet令牌，第一个字节不是0x80");
        return null;
      }
      
      // 提取IV (位置9-25)
      const iv = token.slice(9, 25);
      
      // 提取密文 (去掉版本、时间戳、IV和HMAC)
      const ciphertext = token.slice(25, token.length - 32);
      
      // 解密
      const decipher = crypto.createDecipheriv('aes-128-cbc', this.encryptionKey, iv);
      let decrypted = decipher.update(ciphertext);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      
      // 移除填充
      let padLength = decrypted[decrypted.length - 1];
      if (padLength > 0 && padLength <= 16) {
        const unpadded = decrypted.slice(0, decrypted.length - padLength);
        return unpadded;
      }
      
      // 如果填充无效，尝试直接返回解密的结果
      return decrypted;
    } catch (error) {
      console.error("Fernet令牌解密失败:", error.message);
      return null;
    }
  }
}

// 解密文件
function decryptFile(encFilePath, outputPath) {
  console.log(`解密文件: ${encFilePath}`);
  
  try {
    // 读取加密文件
    const encData = fs.readFileSync(encFilePath);
    console.log(`加密文件大小: ${encData.length} 字节`);
    
    // Base64解码
    let fileContent;
    try {
      fileContent = Buffer.from(encData.toString(), 'base64');
      console.log(`Base64解码后大小: ${fileContent.length} 字节`);
    } catch (e) {
      console.error("Base64解码失败:", e.message);
      return false;
    }
    
    // 检查解码后的数据是否为Fernet格式
    if (fileContent[0] !== 0x80) {
      console.error(`Base64解码后的数据不是有效的Fernet令牌，第一个字节是: 0x${fileContent[0].toString(16)}`);
      return false;
    }
    
    // 使用Fernet解密
    const fernet = new Fernet(DECRYPT_KEY);
    const decrypted = fernet.decryptFernetToken(fileContent);
    
    if (!decrypted) {
      console.error("Fernet解密失败");
      return false;
    }
    
    // 尝试解析为JSON
    let jsonData;
    try {
      jsonData = JSON.parse(decrypted.toString('utf8'));
      console.log(`成功解析为JSON，包含 ${jsonData.data.length} 条数据记录`);
    } catch (e) {
      console.error("JSON解析失败:", e.message);
      return false;
    }
    
    // 写入输出文件
    fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2));
    console.log(`成功写入解密后的文件: ${outputPath}`);
    
    return true;
  } catch (error) {
    console.error(`解密文件失败: ${error.message}`);
    return false;
  }
}

// 创建测试数据（当解密失败时使用）
function createTestData(outputPath, rankType, lang) {
  console.log(`创建测试数据文件: ${outputPath}`);
  
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
          tags: ["test", "debug"],
          growth: 0.5,
          growth_rate: 0.2,
          estimated_income: 100000
        }
      ]
    };
    
    // 确保输出目录存在
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(testData, null, 2));
    console.log(`成功创建测试数据文件: ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`创建测试数据文件失败: ${outputPath}`, error);
    return false;
  }
}

// 处理数据目录
function processDataDirectory(dataDir) {
  console.log(`处理数据目录: ${dataDir}`);
  
  // 确保目录存在
  if (!fs.existsSync(dataDir)) {
    console.error(`数据目录不存在: ${dataDir}`);
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`已创建数据目录: ${dataDir}`);
  }
  
  // 遍历语言和排名类型
  LANGUAGES.forEach(lang => {
    const langDir = path.join(dataDir, lang);
    
    // 确保语言目录存在
    if (!fs.existsSync(langDir)) {
      fs.mkdirSync(langDir, { recursive: true });
      console.log(`已创建语言目录: ${langDir}`);
    }
    
    RANKING_TYPES.forEach(rankType => {
      const encFilePath = path.join(langDir, `${rankType}.enc`);
      const jsonFilePath = path.join(langDir, `${rankType}.json`);
      
      console.log(`处理: ${encFilePath}`);
      
      if (fs.existsSync(encFilePath)) {
        console.log(`加密文件存在: ${encFilePath}`);
        
        // 尝试解密文件
        const success = decryptFile(encFilePath, jsonFilePath);
        
        if (success) {
          console.log(`成功解密文件: ${encFilePath}`);
          successCount++;
        } else {
          console.log(`解密失败: ${encFilePath}`);
          console.log(`创建测试数据文件作为备用: ${jsonFilePath}`);
          createTestData(jsonFilePath, rankType, lang);
          failCount++;
        }
      } else {
        console.log(`加密文件不存在: ${encFilePath}`);
        console.log(`创建测试数据文件: ${jsonFilePath}`);
        createTestData(jsonFilePath, rankType, lang);
      }
    });
  });
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
  ];
  
  for (const dir of possibleDataDirs) {
    console.log(`尝试数据目录: ${dir}`);
    if (fs.existsSync(dir)) {
      console.log(`找到数据目录: ${dir}`);
      return dir;
    }
  }
  
  // 如果找不到，使用默认路径
  const defaultDataDir = path.join(process.cwd(), 'src', 'data');
  console.log(`无法找到数据目录，使用默认路径: ${defaultDataDir}`);
  
  // 确保数据目录存在
  if (!fs.existsSync(defaultDataDir)) {
    fs.mkdirSync(defaultDataDir, { recursive: true });
  }
  
  return defaultDataDir;
}

// 验证解密后的文件
function verifyDecodedFiles(dataDir) {
  console.log('验证解密后的文件:');
  
  LANGUAGES.forEach(lang => {
    const langDir = path.join(dataDir, lang);
    
    if (fs.existsSync(langDir)) {
      RANKING_TYPES.forEach(rankType => {
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
}

// 主函数
function main() {
  console.log('=== 开始解密数据文件 ===');
  console.log(`当前工作目录: ${process.cwd()}`);
  console.log(`脚本目录: ${__dirname}`);
  console.log(`Node.js 版本: ${process.version}`);
  console.log(`操作系统: ${process.platform} ${process.arch}`);
  
  // 检查环境变量
  if (process.env.DECRYPT_KEY) {
    console.log('找到环境变量 DECRYPT_KEY');
  } else {
    console.log('未找到环境变量 DECRYPT_KEY，使用脚本中的默认密钥');
  }
  
  // 显示使用的密钥前缀
  const keyPrefix = DECRYPT_KEY.substring(0, 5);
  console.log(`使用密钥 (前缀): ${keyPrefix}...`);
  
  // 查找数据目录
  const dataDir = findDataDirectory();
  
  // 处理数据目录
  processDataDirectory(dataDir);
  
  // 验证解密后的文件
  verifyDecodedFiles(dataDir);
  
  console.log(`\n解密完成: 成功 ${successCount} 个文件, 失败 ${failCount} 个文件`);
  console.log('=== 数据解密脚本执行完成 ===');
}

// 执行主函数
main(); 