#!/bin/bash

# 打印环境信息
echo "当前目录: $(pwd)"
echo "目录内容: $(ls -la)"
echo "Node.js版本: $(node -v)"
echo "NPM版本: $(npm -v)"

# 检查环境变量
if [ -z "$DECRYPT_KEY" ]; then
  echo "警告: 未设置环境变量 DECRYPT_KEY，数据可能无法正确解密"
else
  echo "已找到环境变量 DECRYPT_KEY"
fi

# 安装依赖
npm install

# 解密数据文件 - 使用相对路径或绝对路径
if [ -f "../github_decode.js" ]; then
  echo "使用相对路径 ../github_decode.js"
  node ../github_decode.js
elif [ -f "./github_decode.js" ]; then
  echo "使用当前目录 ./github_decode.js"
  node ./github_decode.js
elif [ -f "$PWD/github_decode.js" ]; then
  echo "使用绝对路径 $PWD/github_decode.js"
  node "$PWD/github_decode.js"
elif [ -f "../../../github_decode.js" ]; then
  echo "使用相对路径 ../../../github_decode.js"
  node ../../../github_decode.js
else
  echo "找不到 github_decode.js，尝试复制一份到当前目录"
  # 尝试从仓库根目录复制
  cp -f ../github_decode.js . 2>/dev/null || echo "无法复制 github_decode.js"
  if [ -f "./github_decode.js" ]; then
    node ./github_decode.js
  else
    echo "警告：无法找到 github_decode.js，尝试创建一个简单的解密脚本"
    
    # 创建一个简单的解密脚本
    cat > ./temp_decode.js << EOL
/**
 * 临时解密脚本
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 从环境变量获取解密密钥
const key = process.env.DECRYPT_KEY;
if (!key) {
  console.error('错误: 未设置环境变量 DECRYPT_KEY');
  process.exit(1);
}

// 解密函数
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
    console.error('解密失败:', error);
    return null;
  }
}

// 处理数据目录
function processDataDirectory(dataDir) {
  console.log(`处理数据目录: ${dataDir}`);
  
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
      
      // 检查编码文件是否存在
      if (fs.existsSync(encFilePath)) {
        console.log(`处理: ${encFilePath}`);
        
        try {
          // 读取编码文件
          const encryptedData = fs.readFileSync(encFilePath);
          
          // 解密数据
          const decodedData = fernetDecrypt(encryptedData, key);
          
          if (!decodedData) {
            console.error(`解密失败: ${encFilePath}`);
            failCount++;
            return;
          }
          
          // 确保输出目录存在
          const outputDir = path.dirname(jsonFilePath);
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }
          
          // 写入解密后的文件
          fs.writeFileSync(jsonFilePath, JSON.stringify(decodedData, null, 2));
          console.log(`成功解密: ${encFilePath} -> ${jsonFilePath}`);
          successCount++;
        } catch (error) {
          console.error(`解密文件失败: ${encFilePath}`, error);
          failCount++;
        }
      } else {
        console.log(`编码文件不存在，跳过: ${encFilePath}`);
      }
    });
  });
  
  console.log(`\n解密完成: 成功 ${successCount} 个文件, 失败 ${failCount} 个文件`);
}

// 查找数据目录
function findDataDirectory() {
  const possibleDataDirs = [
    path.join(process.cwd(), 'src', 'data'),
    path.join('src', 'data')
  ];
  
  for (const dir of possibleDataDirs) {
    if (fs.existsSync(dir)) {
      return dir;
    }
  }
  
  const defaultDataDir = path.join(process.cwd(), 'src', 'data');
  if (!fs.existsSync(defaultDataDir)) {
    fs.mkdirSync(defaultDataDir, { recursive: true });
  }
  
  return defaultDataDir;
}

// 主函数
function main() {
  const dataDir = findDataDirectory();
  processDataDirectory(dataDir);
}

// 执行主函数
main();
EOL
    
    # 执行临时解密脚本
    node ./temp_decode.js
  fi
fi

# 使用我们的自定义构建脚本
if [ -f "build-with-data.cjs" ]; then
  echo "使用 build-with-data.cjs 构建"
  node build-with-data.cjs
elif [ -f "build-with-data.js" ]; then
  echo "使用 build-with-data.js 构建"
  node build-with-data.js
else
  echo "未找到自定义构建脚本，使用标准构建命令"
  npm run build
fi

# 确保构建输出中的资源路径使用相对路径
sed -i '' 's|src="/|src="./|g' dist/index.html 2>/dev/null || sed -i 's|src="/|src="./|g' dist/index.html
sed -i '' 's|href="/|href="./|g' dist/index.html 2>/dev/null || sed -i 's|href="/|href="./|g' dist/index.html

# 创建 Cloudflare Pages 配置文件
cat > dist/_headers << EOL
/*
  X-Content-Type-Options: nosniff
  
/assets/*.js
  Content-Type: application/javascript

/assets/*.css
  Content-Type: text/css

/assets/data/*/*.json
  Content-Type: application/json
  Access-Control-Allow-Origin: *
EOL

cat > dist/_redirects << EOL
/* /index.html 200
/assets/* /assets/:splat 200
/assets/data/* /assets/data/:splat 200
EOL

cat > dist/_routes.json << EOL
{
  "version": 1,
  "include": ["/*"],
  "exclude": ["/assets/*", "/images/*", "/*.ico", "/*.svg"],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
EOL

echo "Cloudflare Pages 构建完成" 