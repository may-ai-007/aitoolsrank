#!/bin/bash

# 进入项目目录
cd airank

# 安装依赖
npm install

# 解密数据文件
node ../github_decode.js

# 构建项目
npm run build

# 确保构建输出中的资源路径使用相对路径
sed -i '' 's|src="/|src="./|g' dist/index.html
sed -i '' 's|href="/|href="./|g' dist/index.html

# 创建 Cloudflare Pages 配置文件
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