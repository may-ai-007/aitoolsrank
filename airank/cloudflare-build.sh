#!/bin/bash

# 显示环境信息
echo "环境信息:"
echo "Node.js 版本: $(node --version)"
echo "NPM 版本: $(npm --version)"
echo "当前目录: $(pwd)"

# 检查关键环境变量
if [ -z "$DECRYPT_KEY" ]; then
  echo "警告: 环境变量 DECRYPT_KEY 未设置或为空"
  echo "请确保在 Cloudflare Pages 的环境变量设置中添加了 DECRYPT_KEY，并且值是标准 Base64 格式"
  echo "标准 Base64 格式应使用 '+' 字符，而不是 '-' 字符"
else
  echo "环境变量 DECRYPT_KEY 已设置，前缀: ${DECRYPT_KEY:0:5}..."
fi

# 确保项目依赖安装
echo "安装项目依赖..."
npm ci

# 解密数据文件
echo "解密数据文件..."
node decrypt_build.cjs

# 构建项目
echo "构建项目..."
npm run build

# 复制数据文件到构建目录
echo "复制数据文件到构建目录..."
mkdir -p dist/src/data/en
mkdir -p dist/src/data/zh
cp -v src/data/en/*.json dist/src/data/en/
cp -v src/data/zh/*.json dist/src/data/zh/

# 显示构建文件信息
echo "构建文件信息:"
find dist -type f | sort
echo ""
echo "构建完成!" 