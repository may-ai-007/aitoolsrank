#!/bin/bash

# 打印环境信息
echo "当前目录: $(pwd)"
echo "目录内容: $(ls -la)"
echo "Node.js版本: $(node -v)"
echo "NPM版本: $(npm -v)"

# 检查环境变量
if [ -z "$DECRYPT_KEY" ]; then
  echo "警告: 未设置环境变量 DECRYPT_KEY，将使用内联数据"
else
  echo "已找到环境变量 DECRYPT_KEY"
fi

# 确保我们在正确的目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
echo "脚本目录: $SCRIPT_DIR"

# 确保我们在airank目录下
if [[ "$(basename $(pwd))" != "airank" ]]; then
  echo "警告: 当前不在airank目录下，尝试切换目录"
  if [[ -d "airank" ]]; then
    cd airank
    echo "已切换到airank目录: $(pwd)"
  else
    echo "错误: 找不到airank目录"
    exit 1
  fi
fi

# 检查package.json是否存在
if [ ! -f "package.json" ]; then
  echo "错误: 当前目录中没有找到package.json文件"
  echo "当前目录内容:"
  ls -la
  
  # 尝试查找package.json
  echo "尝试查找package.json:"
  find .. -name "package.json" | grep -v "node_modules"
fi

# 创建根目录下的dist目录
echo "创建根目录下的dist目录"
mkdir -p ../dist

# 安装依赖
npm install

# 创建数据目录结构
mkdir -p src/data/en src/data/zh

# 创建测试数据文件
cat > src/data/en/monthly_rank.json << EOL
{
  "metadata": {
    "last_updated": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "ranking_type": "monthly_rank",
    "language": "en",
    "total_items": 50
  },
  "data": [
    {
      "id": "claude",
      "rank": 1,
      "name": "Claude",
      "url": "https://claude.ai",
      "logo": "https://cdn.toolify.ai/logos/claude.webp",
      "description": "Claude is an AI assistant from Anthropic that helps with tasks via natural language.",
      "monthly_visits": 75000000,
      "top_visits": 150000000,
      "top_region": "United States",
      "tags": ["AI assistant", "Conversational AI", "Writing assistant"],
      "growth": 1.5,
      "growth_rate": 0.5,
      "estimated_income": 5000000
    },
    {
      "id": "gemini",
      "rank": 2,
      "name": "Gemini",
      "url": "https://gemini.google.com",
      "logo": "https://cdn.toolify.ai/logos/gemini.webp",
      "description": "Platform for building with Google's Gemini AI models.",
      "monthly_visits": 65000000,
      "top_visits": 130000000,
      "top_region": "United States",
      "tags": ["AI assistant", "Google AI", "Productivity tool"],
      "growth": 2.0,
      "growth_rate": 1.0,
      "estimated_income": 4500000
    }
  ]
}
EOL

# 复制相同的测试数据到其他文件
cp src/data/en/monthly_rank.json src/data/en/total_rank.json
cp src/data/en/monthly_rank.json src/data/en/income_rank.json
cp src/data/en/monthly_rank.json src/data/en/region_rank.json

# 创建中文测试数据
cat > src/data/zh/monthly_rank.json << EOL
{
  "metadata": {
    "last_updated": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "ranking_type": "monthly_rank",
    "language": "zh",
    "total_items": 50
  },
  "data": [
    {
      "id": "claude",
      "rank": 1,
      "name": "Claude",
      "url": "https://claude.ai",
      "logo": "https://cdn.toolify.ai/logos/claude.webp",
      "description": "Claude 是来自 Anthropic 的人工智能助手，通过自然语言帮助完成任务。",
      "monthly_visits": 75000000,
      "top_visits": 150000000,
      "top_region": "美国",
      "tags": ["AI助手", "对话AI", "写作助手"],
      "growth": 1.5,
      "growth_rate": 0.5,
      "estimated_income": 5000000
    },
    {
      "id": "gemini",
      "rank": 2,
      "name": "Gemini",
      "url": "https://gemini.google.com",
      "logo": "https://cdn.toolify.ai/logos/gemini.webp",
      "description": "构建Google的Gemini AI模型的平台。",
      "monthly_visits": 65000000,
      "top_visits": 130000000,
      "top_region": "美国",
      "tags": ["AI助手", "谷歌AI", "生产力工具"],
      "growth": 2.0,
      "growth_rate": 1.0,
      "estimated_income": 4500000
    }
  ]
}
EOL

# 复制相同的测试数据到其他文件
cp src/data/zh/monthly_rank.json src/data/zh/total_rank.json
cp src/data/zh/monthly_rank.json src/data/zh/income_rank.json
cp src/data/zh/monthly_rank.json src/data/zh/region_rank.json

# 检查是否存在加密文件并尝试解密
echo "检查加密文件..."
find src/data -name "*.enc" || echo "未找到加密文件"

if [ ! -z "$DECRYPT_KEY" ] && [ -f "decrypt_build.js" ]; then
  echo "尝试解密数据文件..."
  node decrypt_build.js
fi

# 使用自定义构建脚本
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

# 检查构建输出
echo "构建后目录内容:"
ls -la
echo "检查dist目录:"
if [ -d "dist" ]; then
  ls -la dist
  
  # 复制dist内容到根目录下的dist
  echo "复制dist内容到根目录dist"
  cp -r dist/* ../dist/
  echo "复制完成，根目录dist内容:"
  ls -la ../dist/
else
  echo "错误: dist目录不存在!"
  # 尝试创建dist目录并复制public内容作为备用
  echo "创建备用dist目录..."
  mkdir -p dist
  if [ -d "public" ]; then
    cp -r public/* dist/ || echo "复制public内容失败"
  else
    echo "警告: public目录不存在"
    # 列出根目录内容以检查结构
    echo "根目录结构:"
    find .. -type d -maxdepth 2 | sort
  fi
  echo "创建了备用dist目录"
  ls -la dist
  
  # 复制备用dist内容到根目录dist
  echo "复制备用dist内容到根目录dist"
  cp -r dist/* ../dist/
  echo "复制完成，根目录dist内容:"
  ls -la ../dist/
fi

# 确保构建输出中的资源路径使用相对路径
if [ -f "dist/index.html" ]; then
  echo "修复资源路径..."
  sed -i '' 's|src="/|src="./|g' dist/index.html 2>/dev/null || sed -i 's|src="/|src="./|g' dist/index.html
  sed -i '' 's|href="/|href="./|g' dist/index.html 2>/dev/null || sed -i 's|href="/|href="./|g' dist/index.html
  
  # 也修复根目录下的dist/index.html
  cp dist/index.html ../dist/index.html
else
  echo "警告: dist/index.html 不存在，创建基本index.html文件"
  cat > dist/index.html << EOL
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AIRank - 备用页面</title>
</head>
<body>
  <h1>AIRank</h1>
  <p>这是一个备用页面，主页面正在构建中...</p>
</body>
</html>
EOL
  # 复制到根目录下的dist
  cp dist/index.html ../dist/index.html
fi

# 创建 Cloudflare Pages 配置文件
# 先在airank/dist目录创建
for config_file in _headers _redirects _routes.json; do
  echo "创建 $config_file..."
  if [ "$config_file" = "_headers" ]; then
    cat > dist/$config_file << EOL
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
  elif [ "$config_file" = "_redirects" ]; then
    cat > dist/$config_file << EOL
/* /index.html 200
/assets/* /assets/:splat 200
/assets/data/* /assets/data/:splat 200
EOL
  elif [ "$config_file" = "_routes.json" ]; then
    cat > dist/$config_file << EOL
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
  fi
  
  # 复制到根目录下的dist
  cp dist/$config_file ../dist/$config_file
done

echo "Cloudflare Pages 构建完成"
echo "airank/dist目录结构:"
find dist -type f | sort
echo "根目录dist目录结构:"
find ../dist -type f | sort 