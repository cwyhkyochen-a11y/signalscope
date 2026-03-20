# SignalScope 📊

**KOL 观点追踪与 AI 信号分析系统**

实时追踪意见领袖（KOL）的观点变化，通过 AI 分析提取投资信号，帮助快速了解市场脉搏。

---

## ✨ Features

| 功能 | 说明 |
|------|------|
| **KOL 管理** | 添加/编辑/删除意见领袖人物 |
| **信息源管理** | 配置 Twitter / YouTube / 公众号 / RSS 等信息源 |
| **内容上传** | 上传 PDF 文件或提取网页内容 |
| **AI 信号分析** | 对每条内容自动提取立场（看多/看空/中性）、评分、摘要 |
| **Timeline 时间线** | 按天浏览信号数据，支持日期选择和筛选 |
| **人物档案** | 查看每位 KOL 的历史观点和立场变化 |
| **自定义分析** | 多选日期 + 多选内容 + 自定义 Prompt 进行深度分析 |
| **Dashboard** | 数据概览、立场分布、趋势图表 |
| **Prompt 管理** | 自定义 AI 分析模板 |
| **搜索** | 全文搜索所有内容 |

---

## 🛠️ Tech Stack

| 层级 | 技术 |
|------|------|
| **前端** | React 19 + TypeScript + Vite + Tailwind CSS v4 + Lucide React |
| **后端** | Node.js + Express + better-sqlite3 |
| **认证** | JWT (jsonwebtoken) |
| **AI 分析** | OpenAI 兼容 API（支持 OpenRouter / Anthropic / 本地模型） |
| **内容提取** | @mozilla/readability + jsdom + cheerio + pdf-parse v1.1.1 |
| **调度** | node-cron（定时轮询信息源） |

---

## 📦 Requirements

- **Node.js** >= 18.0
- **npm** >= 9.0
- **SQLite3**（bundled via better-sqlite3, no external DB needed）

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/cwyhkyochen-a11y/signalscope.git
cd signalscope
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Required — generate with: openssl rand -hex 32
JWT_SECRET=your-random-secret-here

# Required — set your admin password
ADMIN_PASSWORD=your-secure-password

# Optional
PORT=3020
CORS_ORIGINS=http://localhost:5173
```

> ⚠️ `ADMIN_PASSWORD` is only read on first run (when DB is created). To change password later, use the app UI.

### 3. Development

```bash
npm run dev          # Start dev server (port 3020)
npm run dev:frontend # Start Vite dev server (port 5173, proxies to :3020)
```

Open http://localhost:5173 in your browser.

### 4. Production Build

```bash
npm run build        # Build frontend
npm start            # Start production server
```

---

## 📁 Project Structure

```
signalscope/
├── src/                        # Frontend source
│   ├── App.tsx                 # Main app + routing
│   ├── main.tsx                # Entry point
│   ├── index.css               # Global styles
│   ├── components/
│   │   ├── Sidebar.tsx         # Navigation sidebar
│   │   ├── Toast.tsx           # Toast notification system
│   │   └── UI.tsx              # Shared UI components
│   └── pages/
│       ├── Dashboard.tsx       # Data overview
│       ├── Timeline.tsx        # Signal timeline
│       ├── People.tsx          # KOL management
│       ├── Sources.tsx         # Source management
│       ├── Upload.tsx          # PDF/URL upload
│       ├── Analysis.tsx        # Custom analysis
│       ├── Search.tsx          # Full-text search
│       ├── Prompts.tsx         # Prompt template management
│       ├── Settings.tsx        # System settings
│       ├── Help.tsx            # User manual
│       └── Login.tsx           # Authentication
├── server/                     # Backend source
│   ├── index.js                # Express server entry
│   ├── auth.js                 # JWT authentication
│   ├── db.js                   # SQLite schema + seed
│   ├── middleware/
│   │   └── errorHandler.js     # Unified error handling
│   ├── routes/
│   │   ├── auth.js             # Login endpoint
│   │   ├── people.js           # KOL CRUD
│   │   ├── sources.js          # Source CRUD
│   │   ├── contents.js         # Content CRUD
│   │   ├── signals.js          # Signal CRUD + daily summary
│   │   ├── tasks.js            # Task CRUD
│   │   ├── upload.js           # PDF/URL upload
│   │   ├── upload.js           # PDF/URL upload
│   │   ├── prompts.js          # Prompt CRUD
│   │   ├── settings.js         # System settings
│   │   ├── dashboard.js        # Dashboard data
│   │   ├── search.js           # Search endpoint
│   │   └── analysis.js         # Analysis endpoints
│   ├── workers/
│   │   ├── analyzer.js         # AI analysis worker
│   │   └── scheduler.js        # Cron scheduler
│   ├── lib/
│   │   └── llm.js              # LLM integration
│   └── data/                   # SQLite DB + uploads (auto-created)
│       ├── signalscope.db      # SQLite database
│       └── uploads/            # Uploaded PDF files
├── public/                     # Built frontend assets
├── vite.config.ts              # Vite configuration
├── package.json                # Dependencies
└── .env.example                # Environment template
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | ✅ | — | JWT signing secret (generate with `openssl rand -hex 32`) |
| `ADMIN_PASSWORD` | ✅ | — | Admin password (first run only) |
| `PORT` | ❌ | `3020` | Server port |
| `CORS_ORIGINS` | ❌ | `*` | Comma-separated allowed origins |
| `DB_PATH` | ❌ | `./server/data/signalscope.db` | Database file path |

### LLM Configuration (in-app)

Settings → LLM 配置:
- **Base URL**: OpenAI-compatible API endpoint (e.g., `https://api.openai.com/v1`)
- **API Key**: Your API key
- **Model**: Model name (e.g., `gpt-4o-mini`)

### Platform Configuration (in-app)

Settings → 平台参数:
- **Twitter Bearer Token**: For Twitter RSS content fetching
- **YouTube API Key**: For YouTube RSS content fetching

---

## 🔄 Content Pipeline

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│   Sources   │ ──→ │  Scheduler   │ ──→ │   Contents  │ ──→ │   Analyzer   │
│ (Twitter,   │     │ (node-cron)  │     │ (raw text)  │     │ (LLM call)   │
│  YouTube)   │     │              │     │             │     │              │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────────┘
                           │                    │                     │
                    ┌──────▼──────┐      ┌──────▼──────┐      ┌──────▼──────┐
                    │   Tasks     │      │   Upload    │      │   Signals   │
                    │ (queue)     │      │ (PDF/URL)   │      │ (analysis)  │
                    └─────────────┘      └─────────────┘      └─────────────┘
```

1. **Sources**: Configure Twitter, YouTube, or other RSS sources
2. **Scheduler**: Runs every minute, checks sources for new content
3. **Upload**: Manual PDF upload or URL content extraction
4. **Analyzer**: LLM extracts stance, score, summary from each content item
5. **Signals**: View in Timeline, Dashboard, or custom Analysis

---

## 🐳 Docker (Optional)

```dockerfile
FROM node:18-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
ENV NODE_ENV=production
EXPOSE 3020
CMD ["node", "server/index.js"]
```

```bash
docker build -t signalscope .
docker run -d \
  -p 3020:3020 \
  -e JWT_SECRET=$(openssl rand -hex 32) \
  -e ADMIN_PASSWORD=your-secure-password \
  -v signalscope-data:/app/server/data \
  signalscope
```

---

## 🔧 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login (returns JWT) |
| GET | `/api/auth/me` | Current user info |
| GET/POST | `/api/people` | List / create KOLs |
| GET/PUT/DELETE | `/api/people/:id` | Get / update / delete KOL |
| GET/POST | `/api/sources` | List / create sources |
| GET/PUT/DELETE | `/api/sources/:id` | Get / update / delete source |
| GET | `/api/contents` | List contents (with filters) |
| GET | `/api/signals` | List all signals |
| GET | `/api/signals/dates` | Dates with data |
| GET | `/api/signals/daily-summary` | Daily signal summary |
| POST | `/api/upload/pdf` | Upload PDF file |
| POST | `/api/upload/url` | Extract content from URL |
| DELETE | `/api/upload/:id` | Delete uploaded content |
| GET/POST | `/api/prompts` | List / create prompt templates |
| GET/PUT | `/api/settings` | Get / update system settings |
| GET | `/api/dashboard` | Dashboard data |
| GET | `/api/search` | Full-text search |
| GET/POST | `/api/analysis/records` | List / run analysis |

---

## 📝 License

MIT

---

## 🙏 Acknowledgments

- [OpenReadability](https://github.com/mozilla/readability) - Content extraction
- [pdf-parse](https://github.com/nicolo-ribaudo/pdf-parse) - PDF text extraction
- [Lucide](https://lucide.dev/) - Icons
- [Tailwind CSS](https://tailwindcss.com/) - Styling
