# AI工具排行榜 (AI Tools Ranking)

这是一个展示AI工具排名的React应用，支持多种排名方式和多语言支持。

## 功能特点

- 多种排名方式：月访问量、总访问量、预估收入和地区排名
- 多语言支持：中文和英文
- 响应式设计：适配桌面和移动设备
- 数据过滤和搜索
- 无限滚动加载

## 技术栈

- React + TypeScript
- Vite
- Tailwind CSS
- i18next (国际化)

## 项目结构

```
airank/
├── public/              # 静态资源
├── src/
│   ├── assets/          # 图片等资源文件
│   ├── components/      # React组件
│   ├── contexts/        # React上下文
│   ├── data/            # 数据文件
│   │   ├── en/          # 英文数据
│   │   └── zh/          # 中文数据
│   ├── i18n/            # 国际化配置和翻译文件
│   ├── pages/           # 页面组件
│   └── utils/           # 工具函数
└── scripts/             # 数据抓取和处理脚本
```

## 数据管理

### 数据文件结构

数据按排行榜类型和语言分类存储：

- `data/en/monthly_rank.json` - 英文月访问量排行
- `data/en/top_rank.json` - 英文总访问量排行
- `data/en/income_rank.json` - 英文预估收入排行
- `data/en/region_rank.json` - 英文地区排行
- `data/zh/monthly_rank.json` - 中文月访问量排行
- `data/zh/top_rank.json` - 中文总访问量排行
- `data/zh/income_rank.json` - 中文预估收入排行
- `data/zh/region_rank.json` - 中文地区排行

### 数据格式

每个数据文件包含元数据和实际数据：

```json
{
  "metadata": {
    "last_updated": "2023-06-15T12:30:45.123Z",
    "ranking_type": "monthly_rank",
    "language": "en",
    "total_items": 100
  },
  "data": [
    {
      "id": "monthly_rank_1",
      "rank": 1,
      "name": "Tool Name",
      "url": "https://example.com",
      "logo": "https://example.com/logo.png",
      "description": "Tool description",
      "monthly_visits": 1000000,
      "top_visits": 5000000,
      "top_region": "United States",
      "tags": ["Tag1", "Tag2", "Tag3"],
      "growth": 50000,
      "growth_rate": 0.05,
      "estimated_income": 100000
    },
    // ... 更多工具数据
  ]
}
```

### 数据更新

数据通过Python脚本`scrape_toolify.py`从Toolify.ai网站抓取。我们采用**定期更新存储至本地**的方式，而不是实时抓取，这样可以：

1. 提高应用性能和用户体验
2. 避免触发目标网站的反爬机制
3. 确保数据稳定性，即使目标网站暂时不可用
4. 减轻对目标网站的负担

#### 更新数据步骤

1. 运行数据抓取脚本：

```bash
# 更新所有数据
python scrape_toolify.py

# 更新特定类型和语言的数据
python scrape_toolify.py --type monthly_rank --lang en
```

2. 脚本会自动将数据保存到对应的JSON文件中

3. 数据更新频率建议：每周1-2次，避免频繁请求

## 开发指南

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 部署

构建后的应用可以部署到任何静态网站托管服务，如Netlify、Vercel、GitHub Pages等。
