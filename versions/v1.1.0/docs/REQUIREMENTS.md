# SignalScope v1.1.0 — 需求文档

> 版本：v1.1.0
> 基线：v1.0.0
> 日期：2026-03-21

---

## 目标

补全核心信息源、打通分析闭环、实现"综合多源看一个人"的核心价值。

---

## 变更清单

### 1. YouTube Channel RSS 采集 Worker 🆕

**文件**: `server/workers/youtube.js`

**功能**:
- 支持 YouTube Channel RSS 采集（`https://www.youtube.com/feeds/videos.xml?channel_id=XXX`）
- 新增 source type: `youtube_rss`
- config 字段: `{ channel_id: "UC..." }`
- 解析 RSS 获取: 视频标题、描述、链接、发布时间
- external_id 用视频 ID（`yt:video_id`）
- 写入 contents 表，source_type = `youtube`

**前端改动**:
- `Sources.tsx` SOURCE_TYPES 添加 `youtube_rss` 选项
- 字段: Channel ID（placeholder: UC...）
- `UI.tsx` SourceIcon 添加 YouTube 图标

**Scheduler 支持**:
- `scheduler.js` switch 添加 `youtube_rss` case

---

### 2. PDF 上传后立即触发分析 🐛

**文件**: `server/routes/upload.js`

**问题**: PDF 上传后只 INSERT contents，不触发 AI 分析。用户要等 scheduler 下一轮（最长 30 分钟）。

**修复**:
- `POST /api/upload/pdf` 成功后，立即调用 `analyzePendingContents()` 或直接对刚插入的 content 调 analyzer
- 同理 `POST /api/upload/url` 也应触发分析

---

### 3. 人物+日期维度综合分析 🆕 核心功能

**文件**: `server/workers/day-summary.js` (新增)

**问题**: 当前 analyzer 逐条独立分析。同一个人今天发了 3 条 Twitter + 1 篇 Substack，AI 看到的是 4 个独立判断，没有"这个人今天整体怎么看"。

**设计**:

新增数据表:
```sql
CREATE TABLE IF NOT EXISTS daily_person_summaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  person_id INTEGER REFERENCES people(id),
  date TEXT NOT NULL,
  overall_stance TEXT,
  overall_score REAL,
  summary TEXT,
  reasoning TEXT,
  content_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(person_id, date)
);
```

**综合分析逻辑**:
1. 每天对每个多内容的人物生成一条综合分析
2. 触发时机：scheduler 每次跑完采集后，检查今天有新内容的人物
3. Prompt 会包含该人物当天所有内容的标题+摘要+各自 stance
4. AI 返回：overall_stance / overall_score / summary（一段话概括今日观点）/ reasoning

**默认综合 Prompt 模板**:
```
你是一个投资信号分析师。请综合分析以下某位 KOL 今日的所有内容，给出整体判断。

KOL: {person_name}
日期: {date}
今日内容（共 {content_count} 条）:

{contents_list}

请综合所有内容，返回 JSON:
{
  "overall_stance": "bullish | bearish | neutral",
  "overall_score": 1-10,
  "summary": "一段话概括此人今日的整体观点和关键论点（200字以内）",
  "reasoning": "综合判断依据（100字以内）"
}
```

**API 改动**:
- `GET /api/signals/daily-summary?date=` 响应中增加 `person_daily_summaries` 字段
- 新增 `GET /api/people/:id/daily-summaries?days=30` — 某人近期综合观点时间线

**前端改动**:
- Timeline 人物分组头部：显示当日综合摘要（而非仅 stance 数量统计）
- PeopleDetail 页：增加"观点趋势"区块，展示近 N 天的 overall_stance + summary

---

### 4. JWT Secret 从环境变量读取 🔧

**文件**: `server/auth.js`

**改动**:
```js
const SECRET = process.env.JWT_SECRET || 'signalscope-secret-key-2024';
```

---

## 技术约束

- 不引入新依赖（YouTube RSS 用现有 rss-parser）
- 数据库 migration 用 `CREATE TABLE IF NOT EXISTS`（SQLite 简单场景）
- 不改动 v1.0 的 API 响应结构（只扩展字段）
- 前端继续用 Tailwind + Lucide，不引入新 UI 库

## 验收标准

1. ✅ 添加 YouTube Channel RSS 源后，能自动抓取视频列表
2. ✅ 上传 PDF 后立即看到 AI 分析结果（不等 scheduler）
3. ✅ Timeline 人物分组显示"今日综合观点摘要"
4. ✅ 人物详情页可以看到近 30 天的综合观点时间线
5. ✅ JWT_SECRET 环境变量生效
