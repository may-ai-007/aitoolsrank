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

# 确保构建输出中的资源路径使用相对路径
echo "修正资源路径..."
sed -i '' 's|src="/|src="./|g' dist/index.html
sed -i '' 's|href="/|href="./|g' dist/index.html

# 创建 Cloudflare Pages 配置文件
echo "创建 Cloudflare Pages 配置文件..."
cat > dist/_headers << EOL
/*
  X-Content-Type-Options: nosniff
  
/assets/*.js
  Content-Type: application/javascript

/assets/*.css
  Content-Type: text/css

/assets/*.json
  Content-Type: application/json
EOL

cat > dist/_redirects << EOL
/* /index.html 200
/assets/* /assets/:splat 200
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

# 创建一个测试文件，用于验证数据文件是否可访问
echo "创建测试文件..."
cat > dist/test-data.html << EOL
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>数据文件测试</title>
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
EOL

echo "Cloudflare Pages 构建完成" 