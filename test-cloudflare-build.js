/**
 * 模拟 Cloudflare Pages 构建环境的测试脚本
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
    
    return true;
  } catch (error) {
    console.error(`解码文件失败: ${encodedFilePath}`, error);
    return false;
  }
}

// 模拟构建过程
function simulateBuild() {
  console.log('模拟 Cloudflare Pages 构建过程');
  console.log(`当前工作目录: ${process.cwd()}`);
  
  try {
    // 1. 创建构建目录
    const buildDir = path.join('test-build');
    const dataDir = path.join(buildDir, 'assets', 'data');
    
    console.log(`创建构建目录: ${buildDir}`);
    if (fs.existsSync(buildDir)) {
      console.log('清理现有构建目录');
      fs.rmSync(buildDir, { recursive: true, force: true });
    }
    
    fs.mkdirSync(buildDir, { recursive: true });
    
    // 2. 创建数据目录
    console.log(`创建数据目录: ${dataDir}`);
    fs.mkdirSync(path.join(dataDir, 'en'), { recursive: true });
    fs.mkdirSync(path.join(dataDir, 'zh'), { recursive: true });
    
    // 3. 解码数据文件
    const languages = ['en', 'zh'];
    const rankingTypes = ['monthly_rank', 'total_rank', 'income_rank', 'region_rank'];
    
    languages.forEach(lang => {
      rankingTypes.forEach(rankType => {
        const encFilePath = path.join('airank', 'src', 'data', lang, `${rankType}.enc`);
        const jsonFilePath = path.join(dataDir, lang, `${rankType}.json`);
        
        if (fs.existsSync(encFilePath)) {
          decodeFile(encFilePath, jsonFilePath);
        } else {
          console.log(`编码文件不存在，跳过: ${encFilePath}`);
        }
      });
    });
    
    // 4. 创建测试 index.html
    const indexHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>测试页面</title>
</head>
<body>
  <h1>数据文件测试</h1>
  <div id="result">加载中...</div>
  
  <script>
    async function loadData() {
      try {
        const response = await fetch('./assets/data/en/monthly_rank.json');
        if (!response.ok) {
          throw new Error(\`HTTP error! status: \${response.status}\`);
        }
        const data = await response.json();
        document.getElementById('result').innerHTML = \`
          <p>数据加载成功!</p>
          <p>总项目数: \${data.data.length}</p>
          <p>第一项: \${data.data[0].name}</p>
          <pre>\${JSON.stringify(data.data[0], null, 2)}</pre>
        \`;
      } catch (error) {
        document.getElementById('result').innerHTML = \`加载失败: \${error.message}\`;
      }
    }
    
    loadData();
  </script>
</body>
</html>
    `;
    
    fs.writeFileSync(path.join(buildDir, 'index.html'), indexHtml);
    
    console.log('模拟构建完成');
    console.log(`构建目录内容: ${fs.readdirSync(buildDir).join(', ')}`);
    console.log(`数据目录内容: ${fs.readdirSync(path.join(dataDir, 'en')).join(', ')}`);
    
    return true;
  } catch (error) {
    console.error('模拟构建失败:', error);
    return false;
  }
}

// 执行模拟构建
simulateBuild(); 