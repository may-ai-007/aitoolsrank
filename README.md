# AI Tools Ranking

一个展示 AI 工具排名的 React 应用，支持中英文切换，提供多种排名视图。

## 功能特点

- 🌐 多语言支持（中文/英文）
- 📊 多种排名视图（月度热门、总体排名、收入排名、地区分布）
- 🔍 搜索和过滤功能
- 📱 响应式设计，适配各种设备
- 🚀 基于 React、TypeScript、Tailwind CSS 构建

## 安装与运行

### 前提条件

- Node.js 16.x 或更高版本
- npm 或 yarn

### 安装步骤

1. 克隆仓库

```bash
git clone https://github.com/yourusername/aitoolsrank.git
cd aitoolsrank
```

2. 安装依赖

```bash
cd airank
npm install
```

3. 开发模式运行

```bash
npm run dev
```

4. 构建生产版本

```bash
npm run build
```

## 数据更新

项目使用 Python 脚本从 Toolify.ai 获取最新的 AI 工具排名数据：

```bash
python3 scrape_toolify.py --type all --lang all --pages 10
```

## 项目结构

```
airank/
├── public/              # 静态资源
├── src/
│   ├── components/      # React 组件
│   ├── contexts/        # React 上下文
│   ├── data/            # 排名数据
│   │   ├── en/          # 英文数据
│   │   └── zh/          # 中文数据
│   ├── i18n/            # 国际化配置
│   ├── pages/           # 页面组件
│   ├── utils/           # 工具函数
│   ├── App.tsx          # 主应用组件
│   └── main.tsx         # 应用入口
└── package.json         # 项目配置
```

## 许可

MIT 