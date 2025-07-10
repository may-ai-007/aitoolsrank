/**
 * 构建时数据解密脚本
 * 用于在构建过程中将加密数据文件解密为JSON文件
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 密码应从环境变量中获取
const password = process.env.DECRYPT_PASSWORD;
if (!password) {
  console.error('错误: 未设置环境变量 DECRYPT_PASSWORD');
  process.exit(1);
}

// 固定盐值，需与Python脚本中使用的相同
const salt = Buffer.from('toolify_airank_salt');

// 生成密钥
function generateKey(password, salt) {
  // 使用PBKDF2算法从密码生成密钥
  return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
}

// 解密数据
function decryptData(encryptedData, key) {
  try {
    // 从加密数据中提取IV和密文
    const iv = encryptedData.slice(0, 16);
    const ciphertext = encryptedData.slice(16);
    
    // 创建解密器
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
    // 解密数据
    let decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    // 解析JSON
    return JSON.parse(decrypted.toString());
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
    
    // 生成密钥
    const key = generateKey(password, salt);
    
    // 解密数据
    const decryptedData = decryptData(encryptedData, key);
    
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
      console.log(`语言目录不存在，跳过: ${langDir}`);
      return;
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
        }
      } else {
        console.log(`加密文件不存在，跳过: ${encFilePath}`);
      }
    });
  });
  
  console.log(`\n解密完成: 成功 ${successCount} 个文件, 失败 ${failCount} 个文件`);
  
  // 如果有失败的文件，返回非零状态码
  if (failCount > 0) {
    process.exit(1);
  }
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