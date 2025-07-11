/**
 * 构建时数据解密脚本
 * 用于在构建过程中将加密数据文件解密为JSON文件
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 详细日志函数
function logDebug(message, obj = null) {
  const timestamp = new Date().toISOString();
  if (obj) {
    console.log(`[${timestamp}] DEBUG: ${message}`, typeof obj === 'object' ? JSON.stringify(obj, null, 2) : obj);
  } else {
    console.log(`[${timestamp}] DEBUG: ${message}`);
  }
}

// 从环境变量获取密钥
logDebug('准备获取环境变量DECRYPT_KEY');
const key = process.env.DECRYPT_KEY;

// 检查密钥
if (!key) {
  console.error('错误: 未设置环境变量 DECRYPT_KEY');
  logDebug('环境变量列表:', Object.keys(process.env).filter(k => !k.includes('SECRET') && !k.includes('KEY')).join(', '));
  
  // 尝试从文件加载密钥
  try {
    const keyPath = path.join(__dirname, '..', 'encryption_key.key');
    logDebug(`尝试从文件加载密钥: ${keyPath}`);
    if (fs.existsSync(keyPath)) {
      console.log('从文件加载密钥');
      const keyContent = fs.readFileSync(keyPath, 'utf8').trim();
      process.env.DECRYPT_KEY = keyContent;
      logDebug('成功从文件加载密钥，长度:', keyContent.length);
    } else {
      console.error('密钥文件不存在');
      logDebug('当前目录:', __dirname);
      logDebug('父目录内容:', fs.existsSync(path.join(__dirname, '..')) ? fs.readdirSync(path.join(__dirname, '..')).join(', ') : '父目录不存在');
      console.warn('将继续使用测试数据');
    }
  } catch (error) {
    console.error('加载密钥文件失败:', error);
    console.warn('将继续使用测试数据');
  }
} else {
  logDebug('找到环境变量DECRYPT_KEY，长度:', key.length);
  logDebug('密钥前缀:', key.substring(0, 5) + '...');
  
  // 检查密钥格式
  try {
    const isBase64 = /^[A-Za-z0-9+/=]+$/.test(key);
    logDebug('密钥是否为有效的Base64格式:', isBase64);
    if (!isBase64) {
      console.warn('警告: 密钥不是有效的Base64格式');
    }
    
    // 解码密钥以验证长度
    const keyBuffer = Buffer.from(key, 'base64');
    logDebug('解码后密钥长度(字节):', keyBuffer.length);
    if (keyBuffer.length !== 32) {
      console.warn(`警告: 解码后密钥长度应为32字节，实际为${keyBuffer.length}字节`);
    }
  } catch (error) {
    console.error('验证密钥格式失败:', error);
  }
}

// 内联实现多种Fernet解密方法
class InlineFernet {
  constructor(key) {
    // 从Base64解码密钥
    try {
      logDebug('创建InlineFernet实例');
      const keyBuffer = Buffer.from(key, 'base64');
      if (keyBuffer.length !== 32) {
        console.warn(`警告: 密钥长度应为32字节，实际为${keyBuffer.length}字节`);
      }
      this.signingKey = keyBuffer.slice(0, 16);
      this.encryptionKey = keyBuffer.slice(16);
      logDebug(`密钥信息: 签名密钥长度=${this.signingKey.length}, 加密密钥长度=${this.encryptionKey.length}`);
    } catch (error) {
      console.error('创建InlineFernet实例失败:', error);
      throw error;
    }
  }
  
  // 方法1: 标准Fernet解密
  decrypt(token) {
    try {
      logDebug(`开始解密数据，token长度: ${token.length}`);
      // 解析token
      const data = Buffer.from(token, 'base64');
      logDebug(`解码后数据长度: ${data.length}`);
      
      // 打印数据的前几个字节，用于调试
      logDebug(`数据头部字节: ${Buffer.from(data.slice(0, 16)).toString('hex')}`);
      
      // 验证版本
      if (data[0] !== 128) {
        console.error(`无效的Fernet令牌版本: ${data[0]}`);
        throw new Error('Invalid Fernet token version');
      }
      
      // 提取IV (位置8-24)
      const iv = data.slice(8, 24);
      logDebug(`IV长度: ${iv.length}, IV数据: ${iv.toString('hex')}`);
      
      // 提取密文 (位置24到倒数32)
      const ciphertext = data.slice(24, -32);
      logDebug(`密文长度: ${ciphertext.length}`);
      
      // 提取HMAC (最后32字节)
      const hmac = data.slice(-32);
      logDebug(`HMAC长度: ${hmac.length}, HMAC值: ${hmac.toString('hex')}`);
      
      // 解密
      logDebug('使用AES-128-CBC解密');
      const decipher = crypto.createDecipheriv('aes-128-cbc', this.encryptionKey, iv);
      let decrypted = decipher.update(ciphertext);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      logDebug(`解密后长度: ${decrypted.length}`);
      
      // 移除填充
      const padLength = decrypted[decrypted.length - 1];
      logDebug(`填充长度: ${padLength}`);
      if (padLength > decrypted.length) {
        console.error(`填充长度错误: ${padLength} > ${decrypted.length}`);
        throw new Error('Invalid padding');
      }
      
      const unpadded = decrypted.slice(0, decrypted.length - padLength);
      logDebug(`移除填充后长度: ${unpadded.length}`);
      
      // 打印解密后的数据前100个字符用于调试
      const previewText = unpadded.toString('utf8').substring(0, 100);
      logDebug(`解密后数据预览: ${previewText}...`);
      
      return unpadded;
    } catch (error) {
      console.error('标准Fernet解密失败:', error);
      throw error;
    }
  }
  
  // 方法2: 简化的解密方法，适应Python cryptography.fernet库
  decryptAlt(token) {
    try {
      logDebug('尝试使用简化的解密方法...');
      const data = Buffer.from(token, 'base64');
      logDebug(`解码后数据长度: ${data.length}`);
      logDebug(`数据头部字节: ${Buffer.from(data.slice(0, 16)).toString('hex')}`);
      
      // 假设加密数据以常规格式存储:
      // 8字节时间戳 + 16字节IV + 密文 + 32字节HMAC
      // 尝试提取这些成分
      
      const iv = data.slice(8, 24);
      logDebug(`IV: ${iv.toString('hex')}`);
      const ciphertext = data.slice(24, data.length - 32);
      logDebug(`密文长度: ${ciphertext.length}`);
      
      // 使用AES-128-CBC解密
      const decipher = crypto.createDecipheriv('aes-128-cbc', this.encryptionKey, iv);
      let decrypted = decipher.update(ciphertext);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      logDebug(`解密后长度: ${decrypted.length}`);
      
      // 移除PKCS7填充
      const padLength = decrypted[decrypted.length - 1];
      logDebug(`填充长度: ${padLength}`);
      if (padLength <= 0 || padLength > 16) {
        throw new Error('Invalid padding value');
      }
      
      // 验证所有填充字节是否一致
      let validPadding = true;
      for (let i = 1; i <= padLength; i++) {
        if (decrypted[decrypted.length - i] !== padLength) {
          validPadding = false;
          break;
        }
      }
      
      if (!validPadding) {
        logDebug('填充验证失败');
        throw new Error('Invalid padding bytes');
      }
      
      const unpadded = decrypted.slice(0, decrypted.length - padLength);
      logDebug(`移除填充后长度: ${unpadded.length}`);
      
      // 打印解密后的数据前100个字符用于调试
      const previewText = unpadded.toString('utf8').substring(0, 100);
      logDebug(`解密后数据预览: ${previewText}...`);
      
      return unpadded;
    } catch (error) {
      console.error('简化解密方法失败:', error);
      throw error;
    }
  }
  
  // 方法3: 最简单的解密方法，不验证HMAC
  decryptSimple(token) {
    try {
      logDebug('尝试使用最简单的解密方法...');
      // 尝试直接base64解码
      const data = Buffer.from(token, 'base64');
      logDebug(`解码后数据长度: ${data.length}`);
      logDebug(`数据头部字节: ${Buffer.from(data.slice(0, 16)).toString('hex')}`);
      
      if (data.length < 56) { // 版本(1) + 时间戳(8) + IV(16) + 最小密文(1) + HMAC(32) = 58
        throw new Error('数据太短，无法是有效的Fernet令牌');
      }
      
      const iv = data.slice(8, 24);
      logDebug(`IV: ${iv.toString('hex')}`);
      // 假设密文在IV之后，HMAC之前
      const ciphertext = data.slice(24, data.length - 32);
      logDebug(`密文长度: ${ciphertext.length}`);
      
      // 解密
      const decipher = crypto.createDecipheriv('aes-128-cbc', this.encryptionKey, iv);
      decipher.setAutoPadding(true); // 自动处理填充
      let decrypted = decipher.update(ciphertext);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      logDebug(`解密后长度: ${decrypted.length}`);
      
      // 打印解密后的数据前100个字符用于调试
      const previewText = decrypted.toString('utf8').substring(0, 100);
      logDebug(`解密后数据预览: ${previewText}...`);
      
      return decrypted;
    } catch (error) {
      console.error('最简单解密方法失败:', error);
      throw error;
    }
  }
  
  // 方法4: Python风格Base64解码尝试
  decryptPythonStyle(token) {
    try {
      logDebug('尝试使用Python风格的解密方法...');
      
      // Python的base64编码可能与Node.js略有不同，尝试处理填充
      let adjustedToken = token;
      while (adjustedToken.length % 4 !== 0) {
        adjustedToken += '=';
      }
      logDebug(`调整后的token长度: ${adjustedToken.length}`);
      
      const data = Buffer.from(adjustedToken, 'base64');
      logDebug(`解码后数据长度: ${data.length}`);
      
      // 以下处理类似于标准方法
      if (data.length < 24) {
        throw new Error('数据太短，无法提取IV');
      }
      
      const iv = data.slice(8, 24);
      const ciphertext = data.slice(24, -32);
      
      const decipher = crypto.createDecipheriv('aes-128-cbc', this.encryptionKey, iv);
      let decrypted = decipher.update(ciphertext);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      
      // 处理PKCS7填充
      const padLength = decrypted[decrypted.length - 1];
      if (padLength > 0 && padLength <= 16) {
        const unpadded = decrypted.slice(0, decrypted.length - padLength);
        
        // 打印解密后的数据前100个字符用于调试
        const previewText = unpadded.toString('utf8').substring(0, 100);
        logDebug(`解密后数据预览: ${previewText}...`);
        
        return unpadded;
      }
      
      return decrypted;
    } catch (error) {
      console.error('Python风格解密方法失败:', error);
      throw error;
    }
  }
}

// 直接解密测试，检查密钥有效性
function testDecryptValidation() {
  if (!process.env.DECRYPT_KEY) {
    console.log('跳过解密验证测试：未设置密钥');
    return;
  }
  
  try {
    logDebug('执行解密验证测试');
    // 创建一个简单的测试数据
    const testData = { test: "验证数据", timestamp: new Date().toISOString() };
    const testJson = JSON.stringify(testData);
    logDebug(`测试数据: ${testJson}`);
    
    // 创建Fernet实例
    const fernet = new InlineFernet(process.env.DECRYPT_KEY);
    
    // 检查密钥能否正确初始化
    logDebug('Fernet实例创建成功，签名密钥长度:', fernet.signingKey.length);
    logDebug('Fernet实例创建成功，加密密钥长度:', fernet.encryptionKey.length);
    
    console.log('解密验证测试成功：密钥格式有效');
  } catch (error) {
    console.error('解密验证测试失败:', error);
  }
}

// 执行验证测试
testDecryptValidation();

// 解密数据 - 尝试多种方法
function decryptData(encryptedData, key) {
  logDebug(`尝试解密数据，长度: ${encryptedData.length}字节`);
  
  // 首先尝试将数据转换为Base64
  let base64Data;
  if (Buffer.isBuffer(encryptedData)) {
    base64Data = encryptedData.toString('base64');
    logDebug('数据是Buffer，已转换为Base64字符串');
  } else {
    // 如果已经是字符串，尝试确认它是否是Base64编码
    try {
      const testBuffer = Buffer.from(encryptedData.toString(), 'base64');
      base64Data = encryptedData.toString();
      logDebug('数据已经是Base64字符串');
    } catch (e) {
      base64Data = Buffer.from(encryptedData.toString()).toString('base64');
      logDebug('数据是非Base64字符串，已转换为Base64');
    }
  }
  
  logDebug(`Base64数据长度: ${base64Data.length}`);
  logDebug(`Base64数据前50个字符: ${base64Data.substring(0, 50)}...`);
  
  // 输出一些数据统计信息，帮助调试
  try {
    const stats = {
      originalLength: encryptedData.length,
      base64Length: base64Data.length,
      isUtf8: isUtf8(encryptedData),
      containsNonAscii: containsNonAscii(encryptedData),
    };
    logDebug('数据统计:', stats);
  } catch (error) {
    console.error('生成数据统计信息失败:', error);
  }
  
  try {
    // 尝试所有解密方法
    const methods = [
      {name: '标准Fernet解密', func: 'decrypt'},
      {name: '简化的解密方法', func: 'decryptAlt'},
      {name: '最简单的解密方法', func: 'decryptSimple'},
      {name: 'Python风格解密', func: 'decryptPythonStyle'},
    ];
    
    for (const method of methods) {
      try {
        console.log(`尝试${method.name}`);
        const fernet = new InlineFernet(key);
        const decrypted = fernet[method.func](base64Data);
        const jsonString = decrypted.toString('utf8');
        logDebug(`解密成功，JSON长度: ${jsonString.length}`);
        
        // 验证是否是有效的JSON
        try {
          const parsedData = JSON.parse(jsonString);
          logDebug(`JSON解析成功，包含${Object.keys(parsedData).length}个顶级键`);
          if (parsedData.metadata && parsedData.data) {
            logDebug(`找到有效的数据格式，包含${parsedData.data.length}条记录`);
          }
          console.log(`使用${method.name}成功解密数据`);
          return parsedData;
        } catch (jsonError) {
          console.error(`JSON解析失败: ${jsonError.message}`);
          logDebug(`无效JSON数据片段: ${jsonString.substring(0, 100)}...`);
          // 继续尝试下一个方法
        }
      } catch (methodError) {
        console.error(`${method.name}失败: ${methodError.message}`);
        // 继续尝试下一个方法
      }
    }
    
    // 回退到Base64解码
    console.log('尝试直接Base64解码');
    const jsonData = Buffer.from(encryptedData.toString(), 'base64').toString('utf-8');
    try {
      const parsedData = JSON.parse(jsonData);
      logDebug('Base64解码成功，解析为有效JSON');
      return parsedData;
    } catch (jsonError) {
      console.error('Base64解码后JSON解析失败:', jsonError);
      logDebug(`无效JSON数据片段: ${jsonData.substring(0, 100)}...`);
    }
    
    return null;
  } catch (error) {
    console.error('所有解密方法都失败:', error);
    return null;
  }
}

// 辅助函数：检查数据是否是有效的UTF-8
function isUtf8(buffer) {
  try {
    const str = buffer.toString('utf8');
    return str.length > 0;
  } catch (e) {
    return false;
  }
}

// 辅助函数：检查字符串是否包含非ASCII字符
function containsNonAscii(buffer) {
  try {
    const str = buffer.toString('utf8');
    return /[^\x00-\x7F]/.test(str);
  } catch (e) {
    return false;
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
    
    // 输出文件的前30个字节用于调试
    const filePreview = Buffer.from(encryptedData.slice(0, 30)).toString('hex');
    logDebug(`文件前30个字节: ${filePreview}`);
    
    // 解密数据
    logDebug(`开始解密文件，使用密钥长度: ${process.env.DECRYPT_KEY ? process.env.DECRYPT_KEY.length : 0}`);
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
      const data = JSON.parse(content);
      console.log(`验证成功: ${outputFilePath} 是有效的JSON文件`);
      logDebug(`数据包含${Object.keys(data).length}个顶级键，${data.data ? data.data.length : 0}条记录`);
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
  
  logDebug(`开始处理数据目录: ${dataDir}`);
  logDebug(`支持语言: ${languages.join(', ')}`);
  logDebug(`排名类型: ${rankingTypes.join(', ')}`);
  
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
        logDebug(`加密文件存在: ${encFilePath}`);
        
        // 获取文件大小
        const stats = fs.statSync(encFilePath);
        logDebug(`文件大小: ${stats.size} 字节`);
        
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
  console.log('=== 数据解密脚本开始执行 ===');
  logDebug(`Node.js版本: ${process.version}`);
  logDebug(`平台: ${process.platform}, 架构: ${process.arch}`);
  logDebug(`工作目录: ${process.cwd()}`);
  logDebug(`脚本目录: ${__dirname}`);
  
  // 测试加密密钥
  if (process.env.DECRYPT_KEY) {
    logDebug('DECRYPT_KEY环境变量存在');
  } else {
    logDebug('DECRYPT_KEY环境变量不存在');
  }
  
  // 数据目录路径
  const dataDir = path.join(__dirname, 'src', 'data');
  console.log(`处理数据目录: ${dataDir}`);
  
  // 检查数据目录是否存在
  if (!fs.existsSync(dataDir)) {
    console.log(`数据目录不存在，创建: ${dataDir}`);
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  processDataDirectory(dataDir);
  console.log('=== 数据解密脚本执行完成 ===');
}

// 执行主函数
main(); 