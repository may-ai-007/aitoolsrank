#!/bin/bash

# 进入项目目录
cd airank

# 安装依赖
npm install

# 解密数据文件
node ../github_decode.js

# 构建项目
npm run build

# 输出构建成功信息
echo "构建完成，可以部署到 Cloudflare Pages 了"
