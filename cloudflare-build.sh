#!/bin/bash

# 设置错误时退出
set -e

echo "===== 开始 Cloudflare 构建流程 ====="
echo "当前目录: $(pwd)"

# 安装依赖
echo "安装依赖..."
npm install

# 解密数据文件
echo "解密数据文件..."
# 尝试多种可能的路径
if [ -f "./github_decode.js" ]; then
  echo "使用 ./github_decode.js"
  node ./github_decode.js
elif [ -f "../github_decode.js" ]; then
  echo "使用 ../github_decode.js"
  node ../github_decode.js
else
  echo "找不到 github_decode.js 文件，尝试下载..."
  curl -o github_decode.js https://raw.githubusercontent.com/yourusername/AIrank/main/github_decode.js
  node github_decode.js
fi

# 检查解密后的数据文件
echo "检查解密后的数据文件..."
find src/data -name "*.json" | sort

# 构建项目
echo "构建项目..."
npm run build

# 确保构建输出中的资源路径使用相对路径
echo "修复资源路径..."
sed -i '' 's|src="/|src="./|g' dist/index.html || echo "警告: sed 命令失败"
sed -i '' 's|href="/|href="./|g' dist/index.html || echo "警告: sed 命令失败"

# 确保数据文件存在于构建目录中
echo "复制数据文件到构建目录..."
mkdir -p dist/assets/data/en
mkdir -p dist/assets/data/zh

# 复制数据文件到构建目录
cp -v src/data/en/*.json dist/assets/data/en/ || echo "警告: 无法复制英文数据文件"
cp -v src/data/zh/*.json dist/assets/data/zh/ || echo "警告: 无法复制中文数据文件"

# 检查文件是否成功复制
echo "验证数据文件..."
ls -la dist/assets/data/en/
ls -la dist/assets/data/zh/

# 如果数据文件复制失败，则使用内联数据创建备用数据文件
if [ ! -s dist/assets/data/en/total_rank.json ]; then
  echo "创建备用数据文件..."
  # 创建备用数据文件的代码（保留原有代码）
  # ...
fi

# 创建 Cloudflare Pages 配置文件
echo "创建 Cloudflare Pages 配置文件..."
cat > dist/_headers << EOL
/*
  X-Content-Type-Options: nosniff
  
/assets/data/*/*.json
  Content-Type: application/json
  Access-Control-Allow-Origin: *

/assets/*.js
  Content-Type: application/javascript

/assets/*.css
  Content-Type: text/css
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
  "include": ["/*"],
  "exclude": [
    "/assets/data/*/*.json",
    "/_headers",
    "/_redirects",
    "/_routes.json"
  ]
}
EOL

# 输出构建成功信息
echo "===== 构建完成 ====="
echo "构建目录内容:"
ls -la dist/
echo "可以部署到 Cloudflare Pages 了" 