/**
 * 测试数据解密功能
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

// 测试解码单个文件
function testDecode(encFilePath) {
  console.log(`测试解码文件: ${encFilePath}`);
  
  try {
    // 检查文件是否存在
    if (!fs.existsSync(encFilePath)) {
      console.error(`文件不存在: ${encFilePath}`);
      return false;
    }
    
    // 读取编码文件
    const encodedData = fs.readFileSync(encFilePath);
    console.log(`已读取文件，大小: ${encodedData.length} 字节`);
    
    // 解码数据
    const decodedData = decodeData(encodedData);
    
    if (!decodedData) {
      console.error(`解码失败: ${encFilePath}`);
      return false;
    }
    
    // 输出解码后的数据摘要
    console.log('解码成功，数据摘要:');
    console.log(`- 元数据: ${JSON.stringify(decodedData.metadata || {})}`);
    console.log(`- 数据项数量: ${decodedData.data ? decodedData.data.length : 0}`);
    if (decodedData.data && decodedData.data.length > 0) {
      console.log(`- 第一项: ${JSON.stringify(decodedData.data[0])}`);
    }
    
    return true;
  } catch (error) {
    console.error(`测试解码失败: ${encFilePath}`, error);
    return false;
  }
}

// 主函数
function main() {
  console.log('测试数据解密功能');
  console.log(`当前工作目录: ${process.cwd()}`);
  
  // 测试英文月度排名文件
  const testFile = path.join('airank', 'src', 'data', 'en', 'monthly_rank.enc');
  testDecode(testFile);
}

// 执行主函数
main(); 