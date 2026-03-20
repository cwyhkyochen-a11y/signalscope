# SignalScope — 开发需求文档

> 多源观点追踪与股票信号分析系统
> 版本: v1.0.0 MVP
> 日期: 2026-03-20

---

## 一、产品概述

**SignalScope** 是一个 KOL 观点聚合与分析工具，帮助用户跟踪特定人物在多个平台上的内容，通过 AI 提取观点和信号，按天汇总，辅助投资决策。

**核心价值**：把散落在 Twitter、Substack、Reddit、YouTube、PDF 中的观点，汇聚到一个界面，用 AI 帮你看"他在说什么、态度变了没有"。

---

## 二、认证与权限

### 登录系统

- JWT Token 认证
- 默认账号：admin / Admin@2024
- 所有页面需登录才能访问
- API 请求 Header 携带 `Authorization: Bearer <token>`

### 页面

- `/login` — 登录页
  - 用户名 + 密码表单
  - 登录成功跳转 Dashboard
  - Token 有效期 7 天

---

## 三、用户角色

| 角色 | 说明 |
|------|------|
| **管理员** | 配置信息源、管理抓取任务、上传 PDF |
| **查看者** | 浏览内容、查看信号、搜索观点 |

MVP 阶段只有一个管理员角色（即系统使用者本人）。

---

## 四、信息源类型

### 4.1 订阅式 / API 式（自动采集）

| 类型 | 采集方式 | 用户操作 |
|------|---------|---------|
| **Substack RSS** | 定时拉取 RSS feed | 填入 feed URL + 轮询频率 |
| **Twitter API** | 调用 Twitter API v2 | 填入 Bearer Token + 用户名 |
| **Reddit RSS** | 定时拉取 subreddit RSS | 填入 subreddit 名称 |

> **V2 延后**：YouTube 字幕采集、Web 内容抓取等高级信息源类型将在 V2 中实现。MVP 仅支持上述三种自动采集 + PDF/文本手动上传。

**去重策略**：每个信息源有唯一 `external_id`，相同内容不会重复入库。
- Substack: RSS `guid` 字段
- Twitter: 推文 `id` 字段
- Reddit: RSS `link` 字段
- PDF: 文件 MD5 hash
- 手动文本: 无去重（每次都是新内容）

用户在后台**手动创建**抓取任务，指定：
- 关联的 KOL 人物
- 信息源类型
- 配置参数（URL / Token / 用户名）
- 轮询频率（15min / 30min / 1h / 2h / 4h）

系统按频率自动轮询，新内容入库。

### 4.2 非订阅式（手动上传）

| 类型 | 操作方式 |
|------|---------|
| **PDF 文件** | 用户手动上传，系统解析文本 |
| **网页文章** | 用户粘贴 URL，系统抓取正文 |
| **纯文本** | 用户手动录入 |

用户在后台手动操作，关联到 KOL 人物。

---

## 五、功能模块

### 4.1 人物管理

- CRUD 管理 KOL 人物
- 字段：姓名、简介、标签（逗号分隔）、头像（可选）
- 每个人物可关联多个信息源

### 4.2 信息源管理

- 为指定人物添加信息源
- 选择类型 → 填写配置 → 设置轮询频率 → 启用/禁用
- 显示状态：上次轮询时间、采集条数、错误次数
- 支持手动触发一次轮询（调试用）

### 4.3 抓取任务管理

- 列表展示所有抓取任务
- 任务状态：运行中 / 已暂停 / 出错
- 显示：任务名称、信息源类型、关联人物、频率、上次运行时间、下次运行时间
- 操作：启用 / 暂停 / 立即执行 / 编辑 / 删除

### 4.4 内容管理

- **按天汇总视图**（核心页面）
  - 左侧：日期列表（最近 30 天）
  - 中间：当日所有内容，按人物分组
  - 右侧：点击某条内容查看详细 + AI 信号

- 内容卡片展示：
  - 来源图标（Twitter/Substack/Reddit/YouTube/PDF）
  - 人物名称
  - 标题 / 摘要
  - 发布时间
  - AI 信号徽章（看多/看空/中性 + 评分）
  - 点击展开全文

### 4.5 AI 信号分析

- 每条内容入库后，异步调用 AI 分析：
  - **观点摘要**：一句话概括核心观点
  - **立场判断**：bullish / bearish / neutral
  - **信号强度**：1-10 分
  - **关键词提取**：涉及的股票/公司/技术
  - **分析依据**：为什么给出这个判断

- 每日汇总：
  - 当日各人物立场汇总
  - 信号强度 Top 5
  - 立场变化检测（与前日对比）

### 4.6 搜索

- 全文搜索所有内容
- 按人物筛选
- 按时间范围筛选
- 按来源类型筛选
- 按信号立场筛选
- 按关键词筛选

---

## 五、数据库设计

```sql
-- 用户
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 被关注的人
CREATE TABLE people (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  bio TEXT,
  avatar TEXT,
  tags TEXT,                     -- 逗号分隔：半导体,AI,芯片
  created_at TEXT DEFAULT (datetime('now'))
);

-- 信息源配置
CREATE TABLE sources (
  id INTEGER PRIMARY KEY,
  person_id INTEGER REFERENCES people(id),
  type TEXT NOT NULL,            -- substack_rss / twitter / reddit_rss / pdf
  config TEXT NOT NULL,          -- JSON: {feed_url, bearer_token, subreddit, username}
  poll_interval_min INTEGER DEFAULT 30,
  last_polled_at TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 统一内容表
CREATE TABLE contents (
  id INTEGER PRIMARY KEY,
  person_id INTEGER REFERENCES people(id),
  source_id INTEGER REFERENCES sources(id),
  source_type TEXT NOT NULL,     -- substack / twitter / reddit / pdf / manual
  external_id TEXT,              -- 原平台 ID（去重用）
  title TEXT,
  body TEXT,
  url TEXT,
  published_at TEXT,
  fetched_at TEXT DEFAULT (datetime('now')),
  is_read INTEGER DEFAULT 0,
  UNIQUE(source_type, external_id)
);

-- AI 信号
CREATE TABLE signals (
  id INTEGER PRIMARY KEY,
  content_id INTEGER REFERENCES contents(id),
  person_id INTEGER REFERENCES people(id),
  summary TEXT,
  stance TEXT,                   -- bullish / bearish / neutral
  confidence REAL,
  score INTEGER,                 -- 1-10
  keywords TEXT,                 -- JSON 数组
  reasoning TEXT,
  prompt_template_id INTEGER REFERENCES prompt_templates(id),
  created_at TEXT DEFAULT (datetime('now'))
);

-- Prompt 模板
CREATE TABLE prompt_templates (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  template TEXT NOT NULL,
  is_default INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 抓取任务
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY,
  source_id INTEGER REFERENCES sources(id),
  status TEXT DEFAULT 'active',  -- active / paused / error
  last_run_at TEXT,
  next_run_at TEXT,
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 初始化默认用户
INSERT INTO users (username, password_hash) VALUES ('admin', '<bcrypt_hash_of_Admin@2024>');

-- 初始化默认 Prompt 模板
INSERT INTO prompt_templates (name, template, is_default) VALUES (
  '默认',
  '你是一个投资信号分析助手。请分析以下内容，提取关键观点。\n\n内容来源：{source_type}\n作者：{person_name}\n标题：{title}\n正文：{body}\n\n请返回 JSON（严格 JSON，不要加 markdown 格式）：\n{{\n  "summary": "一句话概括核心观点（50字以内）",\n  "stance": "bullish | bearish | neutral",\n  "confidence": 0.0-1.0,\n  "score": 1-10,\n  "keywords": ["关键词1", "关键词2"],\n  "reasoning": "为什么给出这个判断（100字以内）"\n}}',
  1
);
```

---

## 六、页面结构

```
SignalScope
│
├── /login              登录页
│
├── /dashboard          仪表盘 — 今日信号总览、信号强度趋势
│
├── /timeline           时间线 — 按天浏览所有内容
│   └── /timeline/:date 某天详情
│
├── /people             人物列表
│   └── /people/:id     人物详情 — 观点时间线、历史信号
│
├── /sources            信息源管理
│   └── /sources/new    新建信息源
│
├── /tasks              抓取任务管理
│
├── /upload             手动上传（PDF / URL / 文本）
│
└── /search             搜索
```

---

## 七、页面详细规格

### 6.0 Login（登录页）

**布局**：居中卡片，max-width 380px

- Logo + 系统名称 "SignalScope"
- 用户名输入框
- 密码输入框
- 登录按钮（Primary，全宽）
- 错误提示：用户名或密码错误

### 6.1 Dashboard（仪表盘）

**布局**：单栏，max-width 1200px 居中

**区块**：
1. **今日概览**（顶部卡片行）
   - 今日新增内容数
   - 看多/看空/中性比例（三个小数字）
   - 信号强度最高的 3 条（标题 + 评分 + 人物）

2. **信号趋势图**（折线图）
   - X 轴：最近 7-30 天
   - Y 轴：每日平均信号强度
   - 按人物分色

3. **今日内容流**（列表）
   - 按时间倒序
   - 每条：来源图标 + 人物 + 摘要 + 信号徽章 + 时间
   - 点击进入详情

4. **人物快照**（卡片网格）
   - 每个人物一张卡
   - 显示：姓名、最新观点摘要、最近 7 天立场趋势

### 6.2 Timeline（时间线）

**核心场景**：每天打开看看"这些人今天说了什么"。

**布局**：三栏

```
┌──────────┬────────────────────┬──────────────┐
│ 日期列表  │   当日内容列表       │  内容详情     │
│          │   按人物分组         │  全文+信号    │
└──────────┴────────────────────┴──────────────┘
```

- 左栏宽度 200px，日期列表，默认选中今天；有内容的日期加粗显示
- 中栏自适应，默认显示今天的内容
- 右栏 400px，点击内容卡片展开详情

**中栏内容分组规则**：
- 先按人物分组（每个人物一个区块）
- 每个人物区块顶部：人物头像 + 姓名 + 当日立场汇总（"今日：2 看多 / 1 看空 / 3 中性"）
- 区块内按时间倒序排列内容卡片
- 无内容的人物不显示（或显示为灰色"今日无更新"）
- 顶部可切换为"按时间线排列"（取消人物分组）

**内容卡片**：
- 来源图标 + 人物名 + 标题/摘要（前 100 字）
- 信号徽章：立场色 + 评分数字
- 发布时间
- 已读/未读标记

### 6.3 People（人物管理）

- 列表：卡片式，每行显示头像 + 姓名 + 标签 + 信息源数量 + 最新观点
- 新建/编辑：弹窗表单
- 详情页：人物信息 + 该人物所有内容时间线 + 信号统计

### 6.4 Sources（信息源管理）

- 列表：表格形式
  - 列：类型 | 配置摘要 | 关联人物 | 频率 | 状态 | 上次轮询 | 操作
- 新建：表单页面
  - 选择类型 → 动态显示配置字段 → 选择人物 → 设频率

### 6.5 Tasks（抓取任务）

- 列表：表格
  - 列：任务名 | 信息源 | 人物 | 频率 | 状态 | 上次/下次运行 | 操作
- 状态指示灯：绿=正常，黄=暂停，红=出错
- 支持手动触发

### 6.6 Upload（手动上传）

- Tab 切换：PDF 上传 / URL 导入 / 纯文本
- PDF：拖拽上传区域，上传后关联人物
- URL：输入框 + 抓取按钮，抓取后预览
- 纯文本：富文本编辑器，填入标题、关联人物

### 6.7 Search（搜索）

- 顶部搜索框（全局）
- 筛选栏：人物 / 时间范围 / 来源 / 立场 / 关键词
- 结果列表：与时间线内容卡片一致
- 高亮匹配关键词

---

## 八、抓取任务流程

```
用户创建任务
    │
    ▼
任务存入 tasks 表（含 cron 表达式）
    │
    ▼
Cron 调度器检查是否有到期任务
    │
    ▼
┌───────────────┐
│ 执行采集 Worker │
│                │
│ 根据 source_type│
│ 分发到对应采集器 │
└───┬───┬───┬───┘
    │   │   │
    ▼   ▼   ▼
 RSS  API  ...
  │    │
  ▼    ▼
 去重（检查 external_id）
  │
  ▼
 写入 contents 表
  │
  ▼
 异步触发 AI 分析
  │
  ▼
 写入 signals 表
```

### 采集器实现

**Substack RSS**
```javascript
// feedparser 或 rss-parser
// 配置: { feed_url: "https://newsletter.xxx.com/feed/token" }
// 解析: title, content:encoded, pubDate, guid
```

**Twitter API**
```javascript
// twitter-api-v2
// 配置: { bearer_token, username }
// 获取用户 ID → 拉取最近推文
// 推文字段: id, text, created_at, public_metrics
```

**Reddit RSS**
```javascript
// 直接 fetch RSS
// 配置: { subreddit: "SemiAnalysis" }
// URL: https://reddit.com/r/{sub}/.rss
// 解析: title, content, author, published, link
```

**PDF 上传**
```javascript
// multer 处理上传
// pdf-parse 提取文本
// 存入 contents，source_type = "pdf"
```

---

## 九、AI 分析 Prompt

### Prompt 模板系统

Prompt 存储在数据库 `prompt_templates` 表中，支持通过后台修改，无需改代码。

```sql
CREATE TABLE prompt_templates (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,              -- 默认 / 半导体专家 / 宏观分析师
  description TEXT,
  template TEXT NOT NULL,          -- Prompt 模板内容
  is_default INTEGER DEFAULT 0,   -- 是否默认模板
  created_at TEXT DEFAULT (datetime('now'))
);
```

### 默认模板

```
你是一个投资信号分析助手。请分析以下内容，提取关键观点。

内容来源：{source_type}
作者：{person_name}
标题：{title}
正文：{body}

请返回 JSON（严格 JSON，不要加 markdown 格式）：
{
  "summary": "一句话概括核心观点（50字以内）",
  "stance": "bullish | bearish | neutral",
  "confidence": 0.0-1.0,
  "score": 1-10,
  "keywords": ["关键词1", "关键词2"],
  "reasoning": "为什么给出这个判断（100字以内）"
}
```

### 模板变量

| 变量 | 说明 |
|------|------|
| `{source_type}` | 来源类型（substack / twitter / reddit / pdf） |
| `{person_name}` | 人物姓名 |
| `{title}` | 内容标题 |
| `{body}` | 内容正文（截取前 8000 字符） |
| `{keywords}` | 该人物的标签（如：半导体,AI,芯片） |

### 使用规则

- 每条内容入库后，异步触发 AI 分析
- 优先使用该人物关联的 prompt 模板，无则用默认模板
- 分析失败自动重试 1 次，仍失败则标记 `analysis_failed`
- 支持手动触发重新分析（`POST /api/contents/:id/reanalyze`）

---

## 十、技术规格

### 后端

- **框架**: Express.js
- **数据库**: better-sqlite3
- **认证**: jsonwebtoken (JWT)
- **定时任务**: node-cron
- **RSS 解析**: rss-parser
- **Twitter**: twitter-api-v2
- **PDF 解析**: pdf-parse
- **网页抓取**: cheerio + node-fetch
- **AI**: OpenAI SDK（或直接 fetch 调 API）
- **文件上传**: multer
- **进程管理**: PM2

### 前端

- **框架**: React 18 + TypeScript
- **构建**: Vite
- **样式**: Tailwind CSS v4
- **图表**: Chart.js 或 Recharts（信号趋势图）
- **图标**: Lucide React
- **路由**: react-router-dom

### 项目结构

```
signalscope/
├── server/
│   ├── index.js              # Express 入口
│   ├── db.js                 # 数据库初始化
│   ├── auth.js               # JWT 认证中间件
│   ├── routes/
│   │   ├── auth.js           # 登录 API
│   │   ├── people.js         # 人物 API
│   │   ├── sources.js        # 信息源 API
│   │   ├── tasks.js          # 任务 API
│   │   ├── contents.js       # 内容 API
│   │   ├── signals.js        # 信号 API
│   │   ├── prompts.js        # Prompt 模板 API
│   │   └── upload.js         # 上传 API
│   ├── workers/
│   │   ├── scheduler.js      # Cron 调度器
│   │   ├── substack.js       # Substack 采集
│   │   ├── twitter.js        # Twitter 采集
│   │   ├── reddit.js         # Reddit 采集
│   │   ├── pdf.js            # PDF 解析
│   │   └── analyzer.js       # AI 分析
│   └── data/
│       └── signalscope.db    # SQLite 数据库
├── public/                   # 前端构建产物
│   └── index.html
├── src/                      # 前端源码
│   ├── App.tsx
│   ├── main.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Timeline.tsx
│   │   ├── People.tsx
│   │   ├── Sources.tsx
│   │   ├── Tasks.tsx
│   │   ├── Upload.tsx
│   │   └── Search.tsx
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── ContentCard.tsx
│   │   ├── SignalBadge.tsx
│   │   ├── SourceIcon.tsx
│   │   ├── DatePicker.tsx
│   │   └── Skeleton.tsx
│   └── styles/
│       └── index.css
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── README.md
```

### 部署

- **端口**: 3020（或可用端口）
- **PM2 进程名**: signalscope
- **Nginx**: `/signalscope/` 代理到 :3020
- **服务器**: 火山云 14.103.210.113

---

## 十一、开发优先级

### P0 — 能跑通（第 1 周）

1. 项目初始化（Express + SQLite + React + Vite + Tailwind）
2. 数据库 schema 创建（含 users、prompt_templates）
3. JWT 登录认证（登录页 + auth 中间件）
4. 人物 CRUD
5. 信息源 CRUD
6. Substack RSS 采集 Worker
7. Twitter 采集 Worker
8. 内容列表页（按天，按人物分组）
9. AI 分析 Worker（含 prompt 模板系统）

### P1 — 能用（第 2 周）

10. Dashboard 仪表盘
11. Timeline 时间线页（三栏，按人物分组）
12. 抓取任务管理页
13. PDF 上传 + 解析
14. Reddit RSS 采集
15. 搜索功能
16. 信号趋势图
17. 每日汇总 API（daily-summary）

### P2 — 好用（第 3 周）

18. 每日汇总推送（飞书）
19. 立场变化检测
20. 人物详情页（观点时间线）
21. URL 导入
20. 错误处理 + 重试机制
21. 骨架屏加载

---

## 十二、API 端点设计

```
# 认证
POST   /api/auth/login               # 登录，返回 JWT
GET    /api/auth/me                   # 当前用户信息

# 人物
GET    /api/people
POST   /api/people
GET    /api/people/:id
PUT    /api/people/:id
DELETE /api/people/:id
GET    /api/people/:id/contents       # 某人的所有内容
GET    /api/people/:id/signals        # 某人的信号统计

# 信息源
GET    /api/sources
POST   /api/sources
PUT    /api/sources/:id
DELETE /api/sources/:id
POST   /api/sources/:id/sync          # 手动触发一次轮询

# 抓取任务
GET    /api/tasks
PUT    /api/tasks/:id                 # 更新状态（启用/暂停）
POST   /api/tasks/:id/run             # 手动执行

# 内容
GET    /api/contents?date=&person=&source=&stance=&q=&page=
GET    /api/contents/:id
POST   /api/contents/:id/reanalyze    # 重新分析单条内容

# 信号
GET    /api/signals?date=&person=&min_score=
GET    /api/signals/daily-summary?date=  # 某天的汇总

# signals/daily-summary 返回格式：
# {
#   "date": "2026-03-20",
#   "total_contents": 15,
#   "stance_breakdown": { "bullish": 5, "bearish": 3, "neutral": 7 },
#   "top_signals": [{ "id": 1, "score": 9, "summary": "...", "person": "Dylan Patel" }],
#   "person_summaries": [
#     {
#       "person": "Dylan Patel",
#       "contents_count": 3,
#       "dominant_stance": "bullish",
#       "avg_score": 7.5,
#       "key_points": ["观点1", "观点2"]
#     }
#   ],
#   "stance_changes": [{ "person": "Dylan Patel", "from": "neutral", "to": "bullish" }]
# }

# 上传
POST   /api/upload/pdf
POST   /api/upload/url

# 搜索
GET    /api/search?q=&person=&from=&to=&source=&stance=

# Dashboard（聚合接口）
GET    /api/dashboard                 # 今日概览、趋势、人物快照
```

---

## 十三、环境变量

```bash
# 数据库
DATABASE_PATH=./data/signalscope.db

# 认证
JWT_SECRET=signalscope-secret-key-2024

# Twitter
TWITTER_BEARER_TOKEN=your_token_here

# AI 分析
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini           # 成本控制用 mini

# 服务
PORT=3020
```

---

## 十四、验收标准

1. ✅ 能通过后台添加一个 KOL 人物
2. ✅ 能为该人物添加 Substack RSS 源，自动抓取文章
3. ✅ 能为该人物添加 Twitter 源，自动抓取推文
4. ✅ 所有内容按天分组展示
5. ✅ 每条内容有 AI 生成的信号（立场 + 评分）
6. ✅ 能手动上传 PDF 并关联人物
7. ✅ Dashboard 显示今日信号概览
8. ✅ 搜索能找到历史内容

---

*最后更新: 2026-03-20*
