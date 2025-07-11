#!/bin/bash

# 显示环境信息
echo "当前目录: $(pwd)"
echo "目录内容: $(ls -la)"
echo "Node.js版本: $(node --version)"
echo "NPM版本: $(npm --version)"

# 检查关键环境变量
if [ -z "$DECRYPT_KEY" ]; then
  echo "警告: 环境变量 DECRYPT_KEY 未设置或为空"
  echo "请确保在 Cloudflare Pages 的环境变量设置中添加了 DECRYPT_KEY，并且值是标准 Base64 格式"
  echo "标准 Base64 格式应使用 '+' 字符，而不是 '-' 字符"
  exit 1
else
  echo "已找到环境变量 DECRYPT_KEY"
fi

# 确定脚本目录
SCRIPT_DIR="$(dirname "$0")"
echo "脚本目录: $SCRIPT_DIR"

# 切换到脚本目录
if [ "$(pwd)" != "$SCRIPT_DIR" ]; then
  echo "警告: 当前不在airank目录下，尝试切换目录"
  cd "$SCRIPT_DIR"
  echo "已切换到airank目录: $(pwd)"
fi

# 创建根目录下的dist目录
echo "创建根目录下的dist目录"

# 确保项目依赖安装
echo "安装项目依赖..."
npm ci

# 检查inlineData.ts文件是否正确设置
echo "检查inlineData.ts文件..."

# 检查加密文件是否存在
echo "检查加密文件..."
find src/data -name "*.enc" | sort

# 解密数据文件
echo "尝试解密数据文件..."
echo "使用 decrypt_build.cjs 解密..."
node decrypt_build.cjs

# 检查解密后的JSON文件
echo "解密后的JSON文件:"
find src/data -name "*.json" | sort

# 使用build-with-data.cjs构建
echo "使用 build-with-data.cjs 构建"
node build-with-data.cjs

# 复制数据文件到构建目录
echo "复制数据文件到构建目录..."
mkdir -p dist/src/data/en
mkdir -p dist/src/data/zh
cp -v src/data/en/*.json dist/src/data/en/
cp -v src/data/zh/*.json dist/src/data/zh/

# 显示构建文件信息
echo "构建后目录内容:"
ls -la
echo "检查dist目录:"
ls -la dist

# 确保dist/assets/data目录存在
echo "确保dist/assets/data目录存在"
mkdir -p dist/assets/data/en
mkdir -p dist/assets/data/zh

# 复制JSON文件到assets/data目录
echo "检查并复制JSON文件到dist/assets/data目录"
for lang in en zh; do
  for type in monthly_rank total_rank income_rank region_rank; do
    echo "复制: src/data/$lang/${type}.json -> dist/assets/data/$lang/${type}.json"
    cp -f "src/data/$lang/${type}.json" "dist/assets/data/$lang/${type}.json"
  done
done

# 复制dist目录内容到根目录dist
echo "复制dist内容到根目录dist"
if [ -d "../dist" ]; then
  cp -r dist/* ../dist/
fi
echo "复制完成，根目录dist内容:"
ls -la ../dist

# 修复资源路径
echo "修复资源路径..."

# 创建辅助文件
echo "创建 _headers..."
echo "创建 _redirects..."
echo "创建 _routes.json..."

echo "Cloudflare Pages 构建完成"
echo "airank/dist目录结构:"
find dist -type f | sort
echo "根目录dist目录结构:"
find ../dist -type f | sort 