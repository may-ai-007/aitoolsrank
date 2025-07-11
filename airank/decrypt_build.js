/**
 * 构建时数据解密脚本
 * 用于在构建过程中将加密数据文件解密为JSON文件
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Fernet } = require('./fernet');

// 从环境变量获取密钥
const key = process.env.DECRYPT_KEY;
if (!key) {
  console.error('错误: 未设置环境变量 DECRYPT_KEY');
  
  // 尝试从文件加载密钥
  try {
    const keyPath = path.join(__dirname, '..', 'encryption_key.key');
    if (fs.existsSync(keyPath)) {
      console.log('从文件加载密钥');
      const keyContent = fs.readFileSync(keyPath, 'utf8').trim();
      process.env.DECRYPT_KEY = keyContent;
    } else {
      console.error('密钥文件不存在');
      process.exit(1);
    }
  } catch (error) {
    console.error('加载密钥文件失败:', error);
    process.exit(1);
  }
}

// 内联实现Fernet解密
class InlineFernet {
  constructor(key) {
    // 从Base64解码密钥
    const keyBuffer = Buffer.from(key, 'base64');
    this.signingKey = keyBuffer.slice(0, 16);
    this.encryptionKey = keyBuffer.slice(16);
  }
  
  decrypt(token) {
    // 解析token
    const data = Buffer.from(token, 'base64');
    
    // 验证版本
    if (data[0] !== 128) {
      throw new Error('Invalid Fernet token version');
    }
    
    // 提取IV (位置8-24)
    const iv = data.slice(8, 24);
    
    // 提取密文 (位置24到倒数32)
    const ciphertext = data.slice(24, -32);
    
    // 解密
    const decipher = crypto.createDecipheriv('aes-128-cbc', this.encryptionKey, iv);
    let decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    // 移除填充
    const padLength = decrypted[decrypted.length - 1];
    const unpadded = decrypted.slice(0, decrypted.length - padLength);
    
    return unpadded;
  }
}

// 解密数据
function decryptData(encryptedData, key) {
  try {
    // 尝试使用内联Fernet解密
    try {
      console.log('尝试使用内联Fernet解密');
      const fernet = new InlineFernet(key);
      const decrypted = fernet.decrypt(encryptedData.toString('base64'));
      return JSON.parse(decrypted.toString('utf8'));
    } catch (fernetError) {
      console.error('内联Fernet解密失败:', fernetError);
    }
    
    // 回退到Base64解码
    console.log('尝试使用Base64解码');
    const jsonData = Buffer.from(encryptedData.toString(), 'base64').toString('utf-8');
    return JSON.parse(jsonData);
  } catch (error) {
    console.error('解密失败:', error);
    return null;
  }
}

// 解密文件
function decryptFile(encryptedFilePath, outputFilePath) {
  try {
    // 读取加密文件
    const encryptedData = fs.readFileSync(encryptedFilePath);
    
    // 解密数据
    const decryptedData = decryptData(encryptedData, process.env.DECRYPT_KEY);
    
    if (!decryptedData) {
      console.error(`解密失败: ${encryptedFilePath}`);
      return false;
    }
    
    // 写入解密后的文件
    fs.writeFileSync(outputFilePath, JSON.stringify(decryptedData, null, 2));
    console.log(`成功解密: ${encryptedFilePath} -> ${outputFilePath}`);
    return true;
  } catch (error) {
    console.error(`解密文件失败: ${encryptedFilePath}`, error);
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
      console.log(`语言目录不存在，创建: ${langDir}`);
      try {
        fs.mkdirSync(langDir, { recursive: true });
      } catch (error) {
        console.error(`创建语言目录失败: ${langDir}`, error);
        return;
      }
    }
    
    rankingTypes.forEach(rankType => {
      const encFilePath = path.join(langDir, `${rankType}.enc`);
      const jsonFilePath = path.join(langDir, `${rankType}.json`);
      
      // 检查加密文件是否存在
      if (fs.existsSync(encFilePath)) {
        console.log(`处理: ${encFilePath}`);
        const success = decryptFile(encFilePath, jsonFilePath);
        if (success) {
          successCount++;
        } else {
          failCount++;
          
          // 如果解密失败，创建一个测试数据文件作为备用
          console.log(`解密失败，创建测试数据文件作为备用: ${jsonFilePath}`);
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
            
            fs.writeFileSync(jsonFilePath, JSON.stringify(testData, null, 2));
            console.log(`成功创建测试数据文件: ${jsonFilePath}`);
          } catch (error) {
            console.error(`创建测试数据文件失败: ${jsonFilePath}`, error);
          }
        }
      } else {
        console.log(`加密文件不存在，跳过: ${encFilePath}`);
      }
    });
  });
  
  console.log(`\n解密完成: 成功 ${successCount} 个文件, 失败 ${failCount} 个文件`);
}

// 主函数
function main() {
  // 数据目录路径
  const dataDir = path.join(__dirname, 'src', 'data');
  console.log(`处理数据目录: ${dataDir}`);
  processDataDirectory(dataDir);
}

// 执行主函数
main(); 