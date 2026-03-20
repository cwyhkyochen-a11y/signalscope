# SignalScope

多源观点追踪与股票信号分析系统

## 功能

- **人物管理** — CRUD 管理 KOL 人物，关联标签
- **信息源** — Substack RSS / Twitter API / Reddit RSS 自动采集
- **AI 分析** — 自动提取观点、判断立场（看多/看空/中性）、评分
- **Dashboard** — 今日概览、信号趋势、人物快照
- **Timeline** — 按天浏览，按人物分组，三栏布局
- **搜索** — 全文搜索，支持按人物/来源/立场筛选
- **手动上传** — PDF 上传、URL 导入、纯文本录入

## 技术栈

| 层 | 技术 |
|---|------|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS v4 |
| 图标 | Lucide React |
| 后端 | Express.js + better-sqlite3 |
| 认证 | JWT (jsonwebtoken) |
| 定时任务 | node-cron |
| RSS | rss-parser |
| PDF | pdf-parse |
| 部署 | PM2 + Nginx |

## 项目结构

```
signalscope/
├── server/
│   ├── index.js              # Express 入口
│   ├── db.js                 # 数据库初始化 + 种子数据
│   ├── auth.js               # JWT 认证中间件
│   ├── routes/
│   │   ├── auth.js           # 登录 / 当前用户
│   │   ├── people.js         # 人物 CRUD
│   │   ├── sources.js        # 信息源 CRUD + 手动同步
│   │   ├── tasks.js          # 抓取任务管理
│   │   ├── contents.js       # 内容查询 + 重新分析
│   │   ├── signals.js        # 信号查询 + 每日汇总
│   │   ├── prompts.js        # Prompt 模板管理
│   │   ├── upload.js         # PDF / URL 上传
│   │   ├── dashboard.js      # 聚合仪表盘数据
│   │   └── search.js         # 全文搜索
│   ├── workers/
│   │   ├── scheduler.js      # Cron 调度器
│   │   ├── analyzer.js       # AI 信号分析
│   │   ├── substack.js       # Substack RSS 采集
│   │   ├── twitter.js        # Twitter API 采集
│   │   └── reddit.js         # Reddit RSS 采集
│   └── data/
│       └── signalscope.db    # SQLite 数据库
├── src/
│   ├── main.tsx              # React 入口
│   ├── App.tsx               # 路由配置
│   ├── api.ts                # API 客户端
│   ├── index.css             # 全局样式 + CSS 变量
│   ├── components/
│   │   ├── Sidebar.tsx       # 侧边栏导航
│   │   └── UI.tsx            # 通用组件 (SignalBadge, SourceIcon, Skeleton)
│   └── pages/
│       ├── Login.tsx         # 登录
│       ├── Dashboard.tsx     # 仪表盘
│       ├── Timeline.tsx      # 时间线
│       ├── People.tsx        # 人物管理
│       ├── PeopleDetail.tsx  # 人物详情
│       ├── Sources.tsx       # 信息源管理
│       ├── Tasks.tsx         # 任务管理
│       ├── Upload.tsx        # 手动上传
│       └── Search.tsx        # 搜索
├── public/                   # Vite 构建产物
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 快速开始

### 本地开发

```bash
# 安装依赖
npm install

# 启动后端
node server/index.js

# 另一个终端启动前端 (Vite dev)
npx vite
```

### 生产部署

```bash
# 构建前端
npx vite build

# 启动服务
pm2 start server/index.js --name signalscope
```

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | 3020 | 服务端口 |
| `JWT_SECRET` | `signalscope-secret-key-2024` | JWT 密钥 |
| `OPENAI_API_KEY` | — | OpenAI API Key (AI 分析) |
| `OPENAI_MODEL` | `gpt-4o-mini` | AI 模型 |
| `TWITTER_BEARER_TOKEN` | — | Twitter API Token |

## 默认账号

- 用户名: `admin`
- 密码: `Admin@2024`

## 数据库

7 张表: `users`, `people`, `sources`, `contents`, `signals`, `prompt_templates`, `tasks`

首次启动自动创建表 + 种子数据（默认用户 + 默认 Prompt 模板）。

## 采集流程

```
用户创建信息源 → 自动创建任务
    ↓
Cron 调度器每分钟检查到期任务
    ↓
分发到对应 Worker (Substack/Twitter/Reddit)
    ↓
去重写入 contents 表
    ↓
AI 分析 → 写入 signals 表
```

## 设计规范

基于 OpenAI 官网风格：明亮、干净、专业。主色 `#10A37F`，Inter 字体，Lucide 图标。

详细规范见 `docs/DESIGN.md`。
