# AIrank 数据管理指南

本文档介绍如何管理和使用 AIrank 项目的数据文件。

## 目录结构

项目目录结构如下：
```
/AIrank/                      <- 外层目录
    airank/                   <- 内层目录，包含实际项目代码
        src/
            data/             <- 数据文件存放位置
                en/
                zh/
        package.json
        ...其他项目文件
    scrape_toolify.py         <- 数据抓取脚本
    decrypt_build.js          <- 数据解码脚本
    build.sh                  <- 构建脚本
    ...其他文件
```

## 数据文件结构

数据文件分为两种类型：
1. **示例数据文件 (.json)**: 包含前10条记录，用于开发和预览
2. **编码数据文件 (.enc)**: 包含完整数据，使用Base64编码

数据文件按语言和排名类型组织：
```
airank/src/data/
  ├── en/
  │   ├── monthly_rank.json    # 示例数据（前10条）
  │   ├── monthly_rank.enc     # 编码的完整数据
  │   ├── total_rank.json
  │   ├── total_rank.enc
  │   ├── income_rank.json
  │   ├── income_rank.enc
  │   ├── region_rank.json
  │   └── region_rank.enc
  └── zh/
      ├── monthly_rank.json
      ├── monthly_rank.enc
      └── ...
```

## 数据抓取

使用 `scrape_toolify.py` 脚本抓取数据：

```bash
# 进入外层目录
cd /path/to/AIrank

# 抓取中文月度排行榜数据（1页）并编码
python3 scrape_toolify.py --type monthly_rank --lang zh --pages 1 --encrypt

# 抓取所有类型的英文数据（每种类型最多10页）并编码
python3 scrape_toolify.py --lang en --pages 10 --encrypt

# 抓取所有语言和类型的数据（每种类型最多10页）并编码
python3 scrape_toolify.py --pages 10 --encrypt
```

## 构建流程

### 本地构建

本地构建时，使用 `build.sh` 脚本：

```bash
# 进入外层目录
cd /path/to/AIrank

# 运行构建脚本
chmod +x build.sh
./build.sh
```

脚本会自动：
1. 进入内层 `airank` 目录
2. 检测并解码 `.enc` 文件
3. 运行 `npm run build`

### GitHub Actions 构建

GitHub Actions 工作流程会自动：
1. 检出代码
2. 安装依赖
3. 解码数据文件
4. 构建项目
5. 部署到 GitHub Pages

## 数据安全

- 只有示例数据（前10条记录）会以明文形式提交到仓库
- 完整数据以编码形式存储，保护数据安全
- 在本地开发时，可以使用解码后的完整数据
- 在 GitHub Actions 中，编码数据会在构建过程中解码

## 手动解码数据

如需手动解码数据文件：

```bash
# 进入外层目录
cd /path/to/AIrank

# 使用Python脚本解码
python3 scrape_toolify.py --decode airank/src/data/zh/monthly_rank.enc --output airank/src/data/zh/monthly_rank_full.json

# 或使用Node.js脚本解码
node decrypt_build.js
```
