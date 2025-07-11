#!/bin/bash

# 设置错误时退出
set -e

echo "===== 开始构建流程 ====="
echo "当前目录: $(pwd)"

# 进入项目目录
cd airank
echo "进入项目目录: $(pwd)"

# 安装依赖
echo "安装依赖..."
npm install

# 解密数据文件
echo "解密数据文件..."
node ../github_decode.js

# 构建项目
echo "构建项目..."
npm run build

# 确保数据文件存在于构建目录中
echo "检查和复制数据文件..."
mkdir -p dist/assets/data/en
mkdir -p dist/assets/data/zh

# 复制数据文件到构建目录
cp -v src/data/en/*.json dist/assets/data/en/ || echo "警告: 无法复制英文数据文件"
cp -v src/data/zh/*.json dist/assets/data/zh/ || echo "警告: 无法复制中文数据文件"

# 复制测试数据文件
cp -v public/test-data.json dist/ || echo "警告: 无法复制测试数据文件"

# 检查文件是否成功复制
echo "验证数据文件..."
ls -la dist/assets/data/en/
ls -la dist/assets/data/zh/
ls -la dist/test-data.json || echo "测试数据文件不存在"

# 输出构建成功信息
echo "===== 构建完成 ====="
echo "构建目录内容:"
ls -la dist/
echo "可以部署到 Cloudflare Pages 了"
