/**
 * 构建时数据解密脚本
 * 用于在构建过程中将加密数据文件解密为JSON文件
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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
      console.warn('将继续使用测试数据');
    }
  } catch (error) {
    console.error('加载密钥文件失败:', error);
    console.warn('将继续使用测试数据');
  }
}

// 内联实现多种Fernet解密方法
class InlineFernet {
  constructor(key) {
    // 从Base64解码密钥
    const keyBuffer = Buffer.from(key, 'base64');
    if (keyBuffer.length !== 32) {
      console.warn(`警告: 密钥长度应为32字节，实际为${keyBuffer.length}字节`);
    }
    this.signingKey = keyBuffer.slice(0, 16);
    this.encryptionKey = keyBuffer.slice(16);
    console.log(`密钥信息: 签名密钥长度=${this.signingKey.length}, 加密密钥长度=${this.encryptionKey.length}`);
  }
  
  // 方法1: 标准Fernet解密
  decrypt(token) {
    try {
      console.log(`开始解密数据，token长度: ${token.length}`);
      // 解析token
      const data = Buffer.from(token, 'base64');
      console.log(`解码后数据长度: ${data.length}`);
      
      // 验证版本
      if (data[0] !== 128) {
        console.error(`无效的Fernet令牌版本: ${data[0]}`);
        throw new Error('Invalid Fernet token version');
      }
      
      // 提取IV (位置8-24)
      const iv = data.slice(8, 24);
      console.log(`IV长度: ${iv.length}`);
      
      // 提取密文 (位置24到倒数32)
      const ciphertext = data.slice(24, -32);
      console.log(`密文长度: ${ciphertext.length}`);
      
      // 解密
      const decipher = crypto.createDecipheriv('aes-128-cbc', this.encryptionKey, iv);
      let decrypted = decipher.update(ciphertext);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      console.log(`解密后长度: ${decrypted.length}`);
      
      // 移除填充
      const padLength = decrypted[decrypted.length - 1];
      console.log(`填充长度: ${padLength}`);
      if (padLength > decrypted.length) {
        console.error(`填充长度错误: ${padLength} > ${decrypted.length}`);
        throw new Error('Invalid padding');
      }
      
      const unpadded = decrypted.slice(0, decrypted.length - padLength);
      console.log(`移除填充后长度: ${unpadded.length}`);
      
      return unpadded;
    } catch (error) {
      console.error('标准Fernet解密失败:', error);
      throw error;
    }
  }
  
  // 方法2: 简化的解密方法，适应Python cryptography.fernet库
  decryptAlt(token) {
    try {
      console.log('尝试使用简化的解密方法...');
      const data = Buffer.from(token, 'base64');
      
      // 假设加密数据以常规格式存储:
      // 8字节时间戳 + 16字节IV + 密文 + 32字节HMAC
      // 尝试提取这些成分
      
      const iv = data.slice(8, 24);
      const ciphertext = data.slice(24, data.length - 32);
      
      // 使用AES-128-CBC解密
      const decipher = crypto.createDecipheriv('aes-128-cbc', this.encryptionKey, iv);
      let decrypted = decipher.update(ciphertext);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      
      // 移除PKCS7填充
      const padLength = decrypted[decrypted.length - 1];
      if (padLength <= 0 || padLength > 16) {
        throw new Error('Invalid padding value');
      }
      
      // 验证所有填充字节是否一致
      for (let i = 1; i <= padLength; i++) {
        if (decrypted[decrypted.length - i] !== padLength) {
          throw new Error('Invalid padding bytes');
        }
      }
      
      const unpadded = decrypted.slice(0, decrypted.length - padLength);
      return unpadded;
    } catch (error) {
      console.error('简化解密方法失败:', error);
      throw error;
    }
  }
  
  // 方法3: 最简单的解密方法，不验证HMAC
  decryptSimple(token) {
    try {
      console.log('尝试使用最简单的解密方法...');
      // 尝试直接base64解码
      const data = Buffer.from(token, 'base64');
      if (data.length < 56) { // 版本(1) + 时间戳(8) + IV(16) + 最小密文(1) + HMAC(32) = 58
        throw new Error('数据太短，无法是有效的Fernet令牌');
      }
      
      const iv = data.slice(8, 24);
      // 假设密文在IV之后，HMAC之前
      const ciphertext = data.slice(24, data.length - 32);
      
      // 解密
      const decipher = crypto.createDecipheriv('aes-128-cbc', this.encryptionKey, iv);
      decipher.setAutoPadding(true); // 自动处理填充
      let decrypted = decipher.update(ciphertext);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      
      return decrypted;
    } catch (error) {
      console.error('最简单解密方法失败:', error);
      throw error;
    }
  }
}

// 解密数据 - 尝试多种方法
function decryptData(encryptedData, key) {
  console.log(`尝试解密数据，长度: ${encryptedData.length}字节`);
  
  // 首先尝试将数据转换为Base64
  let base64Data;
  if (Buffer.isBuffer(encryptedData)) {
    base64Data = encryptedData.toString('base64');
  } else {
    // 如果已经是字符串，尝试确认它是否是Base64编码
    try {
      Buffer.from(encryptedData.toString(), 'base64');
      base64Data = encryptedData.toString();
    } catch (e) {
      base64Data = Buffer.from(encryptedData.toString()).toString('base64');
    }
  }
  
  try {
    // 尝试方法1: 标准Fernet解密
    try {
      console.log('尝试标准Fernet解密');
      const fernet = new InlineFernet(key);
      const decrypted = fernet.decrypt(base64Data);
      const jsonString = decrypted.toString('utf8');
      console.log(`解密成功，JSON长度: ${jsonString.length}`);
      return JSON.parse(jsonString);
    } catch (error1) {
      console.error('标准Fernet解密失败:', error1);
      
      // 尝试方法2: 简化的解密方法
      try {
        console.log('尝试简化的解密方法');
        const fernet = new InlineFernet(key);
        const decrypted = fernet.decryptAlt(base64Data);
        const jsonString = decrypted.toString('utf8');
        console.log(`解密成功，JSON长度: ${jsonString.length}`);
        return JSON.parse(jsonString);
      } catch (error2) {
        console.error('简化解密方法失败:', error2);
        
        // 尝试方法3: 最简单的解密方法
        try {
          console.log('尝试最简单的解密方法');
          const fernet = new InlineFernet(key);
          const decrypted = fernet.decryptSimple(base64Data);
          const jsonString = decrypted.toString('utf8');
          console.log(`解密成功，JSON长度: ${jsonString.length}`);
          return JSON.parse(jsonString);
        } catch (error3) {
          console.error('最简单解密方法失败:', error3);
        }
      }
    }
    
    // 回退到Base64解码
    console.log('尝试直接Base64解码');
    const jsonData = Buffer.from(encryptedData.toString(), 'base64').toString('utf-8');
    return JSON.parse(jsonData);
  } catch (error) {
    console.error('所有解密方法都失败:', error);
    return null;
  }
}

// 解密文件
function decryptFile(encryptedFilePath, outputFilePath) {
  try {
    console.log(`尝试解密文件: ${encryptedFilePath}`);
    
    // 检查加密文件是否存在
    if (!fs.existsSync(encryptedFilePath)) {
      console.error(`加密文件不存在: ${encryptedFilePath}`);
      return false;
    }
    
    // 读取加密文件
    const encryptedData = fs.readFileSync(encryptedFilePath);
    console.log(`已读取加密文件，大小: ${encryptedData.length} 字节`);
    
    // 解密数据
    const decryptedData = decryptData(encryptedData, process.env.DECRYPT_KEY);
    
    if (!decryptedData) {
      console.error(`解密失败: ${encryptedFilePath}`);
      return false;
    }
    
    // 确保输出目录存在
    const outputDir = path.dirname(outputFilePath);
    if (!fs.existsSync(outputDir)) {
      console.log(`创建输出目录: ${outputDir}`);
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 写入解密后的文件
    fs.writeFileSync(outputFilePath, JSON.stringify(decryptedData, null, 2));
    console.log(`成功解密: ${encryptedFilePath} -> ${outputFilePath}`);
    
    // 验证JSON文件是否有效
    try {
      const content = fs.readFileSync(outputFilePath, 'utf8');
      JSON.parse(content);
      console.log(`验证成功: ${outputFilePath} 是有效的JSON文件`);
      return true;
    } catch (validationError) {
      console.error(`验证失败: ${outputFilePath} 不是有效的JSON文件`, validationError);
      return false;
    }
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
                total_items: 1,
                is_test_data: true
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
        console.log(`加密文件不存在: ${encFilePath}，检查JSON文件`);
        
        // 如果JSON文件已存在，检查它是否有效
        if (fs.existsSync(jsonFilePath)) {
          try {
            const content = fs.readFileSync(jsonFilePath, 'utf8');
            const data = JSON.parse(content);
            if (data && data.metadata && data.data && data.data.length > 0) {
              console.log(`JSON文件已存在且有效: ${jsonFilePath}`);
              successCount++;
            } else {
              console.log(`JSON文件格式无效: ${jsonFilePath}`);
              failCount++;
            }
          } catch (error) {
            console.error(`读取JSON文件失败: ${jsonFilePath}`, error);
            failCount++;
          }
        } else {
          console.log(`加密文件和JSON文件都不存在，跳过: ${encFilePath}`);
        }
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
  
  // 检查数据目录是否存在
  if (!fs.existsSync(dataDir)) {
    console.log(`数据目录不存在，创建: ${dataDir}`);
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  processDataDirectory(dataDir);
}

// 执行主函数
main(); 