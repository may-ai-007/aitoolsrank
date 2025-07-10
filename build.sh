#!/bin/bash

# 构建脚本，用于本地构建和解码数据

# 进入项目目录
cd "$(dirname "$0")/airank" || exit 1

# 检查是否有编码数据文件
if [ -f "src/data/zh/monthly_rank.enc" ] || [ -f "src/data/en/monthly_rank.enc" ]; then
  echo "发现编码数据文件，准备解码..."
  
  # 运行解码脚本（在外层目录）
  cd .. && node decrypt_build.js && cd airank
  
  if [ $? -ne 0 ]; then
    echo "解码失败，构建终止"
    exit 1
  fi
  
  echo "解码成功，继续构建..."
else
  echo "未发现编码数据文件，使用示例数据继续构建..."
fi

# 运行构建命令
npm run build

echo "构建完成"
