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

# 构建项目
echo "开始构建项目..."
npm run build

# 创建数据目录
echo "创建数据目录..."
mkdir -p dist/assets/data/en
mkdir -p dist/assets/data/zh

# 解密数据文件
echo "解密数据文件..."
node ../github_decode.js

# 检查解密后的文件位置
echo "检查解密后的文件位置..."
find src -name "*.json" | sort
find . -name "*.json" | sort

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

echo "Cloudflare Pages 构建完成" 