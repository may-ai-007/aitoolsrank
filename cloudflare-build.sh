#!/bin/bash

# 设置错误时退出
set -e

echo "===== 开始 Cloudflare 构建流程 ====="
echo "当前目录: $(pwd)"
echo "目录内容: $(ls -la)"

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
echo "创建数据目录..."
mkdir -p dist/assets/data/en
mkdir -p dist/assets/data/zh

# 创建数据文件
echo "创建数据文件..."
# 英文版本
cat > dist/assets/data/en/total_rank.json << EOL
{
  "metadata": {
    "last_updated": "$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")",
    "ranking_type": "total_rank",
    "language": "en",
    "total_items": 10
  },
  "data": [
    {
      "id": "1",
      "rank": 1,
      "name": "ChatGPT",
      "url": "https://chat.openai.com",
      "logo": "https://example.com/chatgpt.png",
      "description": "ChatGPT is a large language model developed by OpenAI.",
      "monthly_visits": 1500000000,
      "top_visits": 2000000000,
      "top_region": "United States",
      "tags": ["AI", "Chatbot", "Language Model"],
      "growth": 0.15,
      "growth_rate": 0.15,
      "estimated_income": 100000000
    },
    {
      "id": "2",
      "rank": 2,
      "name": "Claude",
      "url": "https://claude.ai",
      "logo": "https://example.com/claude.png",
      "description": "Claude is a next-generation AI assistant from Anthropic.",
      "monthly_visits": 800000000,
      "top_visits": 1000000000,
      "top_region": "United States",
      "tags": ["AI", "Chatbot", "Language Model"],
      "growth": 0.25,
      "growth_rate": 0.25,
      "estimated_income": 50000000
    }
  ]
}
EOL

cat > dist/assets/data/en/monthly_rank.json << EOL
{
  "metadata": {
    "last_updated": "$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")",
    "ranking_type": "monthly_rank",
    "language": "en",
    "total_items": 10
  },
  "data": [
    {
      "id": "1",
      "rank": 1,
      "name": "ChatGPT",
      "url": "https://chat.openai.com",
      "logo": "https://example.com/chatgpt.png",
      "description": "ChatGPT is a large language model developed by OpenAI.",
      "monthly_visits": 1500000000,
      "top_visits": 2000000000,
      "top_region": "United States",
      "tags": ["AI", "Chatbot", "Language Model"],
      "growth": 0.15,
      "growth_rate": 0.15,
      "estimated_income": 100000000
    },
    {
      "id": "2",
      "rank": 2,
      "name": "Claude",
      "url": "https://claude.ai",
      "logo": "https://example.com/claude.png",
      "description": "Claude is a next-generation AI assistant from Anthropic.",
      "monthly_visits": 800000000,
      "top_visits": 1000000000,
      "top_region": "United States",
      "tags": ["AI", "Chatbot", "Language Model"],
      "growth": 0.25,
      "growth_rate": 0.25,
      "estimated_income": 50000000
    }
  ]
}
EOL

cat > dist/assets/data/en/income_rank.json << EOL
{
  "metadata": {
    "last_updated": "$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")",
    "ranking_type": "income_rank",
    "language": "en",
    "total_items": 10
  },
  "data": [
    {
      "id": "1",
      "rank": 1,
      "name": "ChatGPT",
      "url": "https://chat.openai.com",
      "logo": "https://example.com/chatgpt.png",
      "description": "ChatGPT is a large language model developed by OpenAI.",
      "monthly_visits": 1500000000,
      "top_visits": 2000000000,
      "top_region": "United States",
      "tags": ["AI", "Chatbot", "Language Model"],
      "growth": 0.15,
      "growth_rate": 0.15,
      "estimated_income": 100000000
    },
    {
      "id": "2",
      "rank": 2,
      "name": "Claude",
      "url": "https://claude.ai",
      "logo": "https://example.com/claude.png",
      "description": "Claude is a next-generation AI assistant from Anthropic.",
      "monthly_visits": 800000000,
      "top_visits": 1000000000,
      "top_region": "United States",
      "tags": ["AI", "Chatbot", "Language Model"],
      "growth": 0.25,
      "growth_rate": 0.25,
      "estimated_income": 50000000
    }
  ]
}
EOL

cat > dist/assets/data/en/region_rank.json << EOL
{
  "metadata": {
    "last_updated": "$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")",
    "ranking_type": "region_rank",
    "language": "en",
    "total_items": 10
  },
  "data": [
    {
      "id": "1",
      "rank": 1,
      "name": "ChatGPT",
      "url": "https://chat.openai.com",
      "logo": "https://example.com/chatgpt.png",
      "description": "ChatGPT is a large language model developed by OpenAI.",
      "monthly_visits": 1500000000,
      "top_visits": 2000000000,
      "top_region": "United States",
      "tags": ["AI", "Chatbot", "Language Model"],
      "growth": 0.15,
      "growth_rate": 0.15,
      "estimated_income": 100000000
    },
    {
      "id": "2",
      "rank": 2,
      "name": "Claude",
      "url": "https://claude.ai",
      "logo": "https://example.com/claude.png",
      "description": "Claude is a next-generation AI assistant from Anthropic.",
      "monthly_visits": 800000000,
      "top_visits": 1000000000,
      "top_region": "United States",
      "tags": ["AI", "Chatbot", "Language Model"],
      "growth": 0.25,
      "growth_rate": 0.25,
      "estimated_income": 50000000
    }
  ]
}
EOL

# 中文版本
cat > dist/assets/data/zh/total_rank.json << EOL
{
  "metadata": {
    "last_updated": "$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")",
    "ranking_type": "total_rank",
    "language": "zh",
    "total_items": 10
  },
  "data": [
    {
      "id": "1",
      "rank": 1,
      "name": "ChatGPT",
      "url": "https://chat.openai.com",
      "logo": "https://example.com/chatgpt.png",
      "description": "ChatGPT 是由 OpenAI 开发的大型语言模型。",
      "monthly_visits": 1500000000,
      "top_visits": 2000000000,
      "top_region": "美国",
      "tags": ["AI", "聊天机器人", "语言模型"],
      "growth": 0.15,
      "growth_rate": 0.15,
      "estimated_income": 100000000
    },
    {
      "id": "2",
      "rank": 2,
      "name": "Claude",
      "url": "https://claude.ai",
      "logo": "https://example.com/claude.png",
      "description": "Claude 是 Anthropic 开发的下一代 AI 助手。",
      "monthly_visits": 800000000,
      "top_visits": 1000000000,
      "top_region": "美国",
      "tags": ["AI", "聊天机器人", "语言模型"],
      "growth": 0.25,
      "growth_rate": 0.25,
      "estimated_income": 50000000
    }
  ]
}
EOL

cp -v dist/assets/data/zh/total_rank.json dist/assets/data/zh/monthly_rank.json
cp -v dist/assets/data/zh/total_rank.json dist/assets/data/zh/income_rank.json
cp -v dist/assets/data/zh/total_rank.json dist/assets/data/zh/region_rank.json

# 检查文件是否成功创建
echo "验证数据文件..."
ls -la dist/assets/data/en/
ls -la dist/assets/data/zh/

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
    "/test-data.json",
    "/_headers",
    "/_routes.json"
  ]
}
EOL

# 输出构建成功信息
echo "===== 构建完成 ====="
echo "构建目录内容:"
ls -la dist/
echo "可以部署到 Cloudflare Pages 了" 