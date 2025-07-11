/**
 * 简单的Fernet加密库实现
 */

const crypto = require('crypto');

class Fernet {
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

module.exports = { Fernet }; 