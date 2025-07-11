#!/bin/bash

# 安装依赖
npm install

# 解密数据文件 - 使用相对路径或绝对路径
if [ -f "../github_decode.js" ]; then
  echo "使用相对路径 ../github_decode.js"
  node ../github_decode.js
elif [ -f "./github_decode.js" ]; then
  echo "使用当前目录 ./github_decode.js"
  node ./github_decode.js
elif [ -f "$PWD/github_decode.js" ]; then
  echo "使用绝对路径 $PWD/github_decode.js"
  node "$PWD/github_decode.js"
else
  echo "找不到 github_decode.js，尝试复制一份到当前目录"
  # 尝试从仓库根目录复制
  cp -f ../github_decode.js . 2>/dev/null || echo "无法复制 github_decode.js"
  if [ -f "./github_decode.js" ]; then
    node ./github_decode.js
  else
    echo "警告：无法找到 github_decode.js，数据可能无法正确解密"
  fi
fi

# 使用我们的自定义构建脚本
node build-with-data.cjs

# 确保构建输出中的资源路径使用相对路径
sed -i '' 's|src="/|src="./|g' dist/index.html 2>/dev/null || sed -i 's|src="/|src="./|g' dist/index.html
sed -i '' 's|href="/|href="./|g' dist/index.html 2>/dev/null || sed -i 's|href="/|href="./|g' dist/index.html

# 创建 Cloudflare Pages 配置文件
cat > dist/_headers << EOL
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

cat > dist/_redirects << EOL
/* /index.html 200
/assets/* /assets/:splat 200
/assets/data/* /assets/data/:splat 200
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