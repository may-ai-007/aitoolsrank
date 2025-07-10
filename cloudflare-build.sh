#!/bin/bash

# 设置错误时退出
set -e

# 显示当前目录
echo "当前工作目录: $(pwd)"
ls -la

# 进入项目目录
cd airank
echo "进入项目目录: $(pwd)"

# 安装依赖
echo "安装依赖..."
npm install

# 构建项目前先解密数据文件
echo "解密数据文件..."
node ../github_decode.js

# 检查解密后的文件位置
echo "检查解密后的文件位置..."
find src -name "*.json" | sort
find . -name "*.json" | sort

# 验证JSON文件内容
echo "验证JSON文件内容..."
for jsonFile in $(find src/data -name "*.json" 2>/dev/null); do
  echo "验证文件: $jsonFile"
  # 检查文件是否为有效的JSON
  if node -e "try { JSON.parse(require('fs').readFileSync('$jsonFile', 'utf8')); console.log('有效的JSON'); } catch(e) { console.error('无效的JSON:', e.message); process.exit(1); }"; then
    echo "✅ $jsonFile 是有效的JSON文件"
  else
    echo "❌ $jsonFile 不是有效的JSON文件"
    exit 1
  fi
done

# 构建项目
echo "开始构建项目..."
npm run build

# 创建数据目录
echo "创建数据目录..."
mkdir -p dist/assets/data/en
mkdir -p dist/assets/data/zh

# 复制解密后的数据文件到构建输出目录
echo "复制数据文件到构建目录..."
if [ -d "src/data/en" ] && [ "$(ls -A src/data/en/*.json 2>/dev/null)" ]; then
  echo "复制英文数据文件..."
  cp -v src/data/en/*.json dist/assets/data/en/
else
  echo "警告: 未找到英文数据文件"
  ls -la src/data/en/ || echo "目录不存在"
fi

if [ -d "src/data/zh" ] && [ "$(ls -A src/data/zh/*.json 2>/dev/null)" ]; then
  echo "复制中文数据文件..."
  cp -v src/data/zh/*.json dist/assets/data/zh/
else
  echo "警告: 未找到中文数据文件"
  ls -la src/data/zh/ || echo "目录不存在"
fi

# 检查复制后的文件
echo "检查构建目录中的数据文件..."
find dist -name "*.json" | sort

# 验证复制后的JSON文件内容
echo "验证复制后的JSON文件内容..."
for jsonFile in $(find dist/assets/data -name "*.json" 2>/dev/null); do
  echo "验证文件: $jsonFile"
  # 检查文件是否为有效的JSON
  if node -e "try { JSON.parse(require('fs').readFileSync('$jsonFile', 'utf8')); console.log('有效的JSON'); } catch(e) { console.error('无效的JSON:', e.message); process.exit(1); }"; then
    echo "✅ $jsonFile 是有效的JSON文件"
  else
    echo "❌ $jsonFile 不是有效的JSON文件"
    exit 1
  fi
done

# 确保构建输出中的资源路径使用相对路径
echo "修正资源路径..."
sed -i '' 's|src="/|src="./|g' dist/index.html
sed -i '' 's|href="/|href="./|g' dist/index.html

# 创建 Cloudflare Pages 配置文件
echo "创建 Cloudflare Pages 配置文件..."
cat > dist/_headers << EOL
/*
  X-Content-Type-Options: nosniff
  
/assets/data/*
  Content-Type: application/json

/assets/*.js
  Content-Type: application/javascript

/assets/*.css
  Content-Type: text/css

/assets/*.json
  Content-Type: application/json
EOL

cat > dist/_redirects << EOL
/assets/data/* /assets/data/:splat 200
/assets/data/en/* /assets/data/en/:splat 200
/assets/data/zh/* /assets/data/zh/:splat 200
/* /index.html 200
EOL

cat > dist/_routes.json << EOL
{
  "version": 1,
  "include": [
    "/*",
    "/assets/data/*",
    "/assets/data/en/*",
    "/assets/data/zh/*",
    "/assets/*.js",
    "/assets/*.css",
    "/assets/*",
    "/images/*", 
    "/*.ico", 
    "/*.svg"
  ],
  "exclude": [],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
EOL

# 创建一个测试文件，用于验证数据文件是否可访问
echo "创建测试文件..."
cat > dist/test-data.html << EOL
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>数据文件测试</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .result { margin-top: 20px; padding: 10px; border: 1px solid #ddd; }
    .success { color: green; }
    .error { color: red; }
    pre { background: #f5f5f5; padding: 10px; overflow: auto; }
  </style>
</head>
<body>
  <h1>数据文件测试</h1>
  
  <div>
    <h2>英文数据文件测试</h2>
    <div id="en-result" class="result">加载中...</div>
  </div>
  
  <div>
    <h2>中文数据文件测试</h2>
    <div id="zh-result" class="result">加载中...</div>
  </div>
  
  <script>
    // 测试加载英文数据
    async function testEnglishData() {
      const result = document.getElementById('en-result');
      try {
        const response = await fetch('./assets/data/en/monthly_rank.json');
        const contentType = response.headers.get('content-type');
        
        if (!response.ok) {
          throw new Error(\`HTTP error! status: \${response.status}, content-type: \${contentType}\`);
        }
        
        const text = await response.text();
        console.log('Raw response text:', text.substring(0, 100) + '...');
        
        try {
          const data = JSON.parse(text);
          result.innerHTML = \`
            <p class="success">数据加载成功!</p>
            <p>Content-Type: \${contentType}</p>
            <p>总项目数: \${data.data ? data.data.length : 'unknown'}</p>
            <p>元数据: \${JSON.stringify(data.metadata || {})}</p>
            \${data.data && data.data.length > 0 ? \`
              <p>第一项: \${data.data[0].name}</p>
              <pre>\${JSON.stringify(data.data[0], null, 2)}</pre>
            \` : ''}
          \`;
        } catch (parseError) {
          result.innerHTML = \`
            <p class="error">JSON解析失败: \${parseError.message}</p>
            <p>Content-Type: \${contentType}</p>
            <p>原始响应 (前100个字符):</p>
            <pre>\${text.substring(0, 100).replace(/</g, '&lt;').replace(/>/g, '&gt;')}...</pre>
          \`;
        }
      } catch (error) {
        result.innerHTML = \`<p class="error">加载失败: \${error.message}</p>\`;
      }
    }
    
    // 测试加载中文数据
    async function testChineseData() {
      const result = document.getElementById('zh-result');
      try {
        const response = await fetch('./assets/data/zh/monthly_rank.json');
        const contentType = response.headers.get('content-type');
        
        if (!response.ok) {
          throw new Error(\`HTTP error! status: \${response.status}, content-type: \${contentType}\`);
        }
        
        const text = await response.text();
        console.log('Raw response text:', text.substring(0, 100) + '...');
        
        try {
          const data = JSON.parse(text);
          result.innerHTML = \`
            <p class="success">数据加载成功!</p>
            <p>Content-Type: \${contentType}</p>
            <p>总项目数: \${data.data ? data.data.length : 'unknown'}</p>
            <p>元数据: \${JSON.stringify(data.metadata || {})}</p>
            \${data.data && data.data.length > 0 ? \`
              <p>第一项: \${data.data[0].name}</p>
              <pre>\${JSON.stringify(data.data[0], null, 2)}</pre>
            \` : ''}
          \`;
        } catch (parseError) {
          result.innerHTML = \`
            <p class="error">JSON解析失败: \${parseError.message}</p>
            <p>Content-Type: \${contentType}</p>
            <p>原始响应 (前100个字符):</p>
            <pre>\${text.substring(0, 100).replace(/</g, '&lt;').replace(/>/g, '&gt;')}...</pre>
          \`;
        }
      } catch (error) {
        result.innerHTML = \`<p class="error">加载失败: \${error.message}</p>\`;
      }
    }
    
    // 运行测试
    testEnglishData();
    testChineseData();
  </script>
</body>
</html>
EOL

echo "Cloudflare Pages 构建完成" 