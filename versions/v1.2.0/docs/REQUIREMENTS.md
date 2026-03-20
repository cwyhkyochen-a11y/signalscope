# SignalScope v1.2.0 需求文档

**版本**: v1.2.0
**基础版本**: v1.1.0
**开始日期**: 2026-03-21
**状态**: 🟢 迭代中

---

## 需求概述

v1.2 聚焦于两个方向：**设置与配置管理** + **用户体验优化**。

---

## 功能需求

### 1. 设置页（Settings）

**目标**: 让用户在 Web 界面完成所有配置，无需手动编辑配置文件。

#### 1.1 大模型配置

支持 OpenAI 兼容格式的 LLM 配置：

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| Base URL | string | API 端点 | `https://api.openai.com/v1` |
| API Key | string (password) | 认证密钥 | `sk-xxxxx` |
| Model Name | string | 模型标识 | `gpt-4o-mini` |

- 存储在 SQLite 的 `settings` 表中
- 保存后立即生效（无需重启服务）
- 提供"测试连接"功能，验证配置是否正确

#### 1.2 平台参数配置

各信息源需要的认证参数：

| 平台 | 参数 | 说明 |
|------|------|------|
| Twitter | Bearer Token | 用于 Twitter API v2 认证 |
| YouTube | API Key | 用于 YouTube Data API（可选，当前用 RSS 免费采集） |
| RSS | 无额外参数 | 直接抓取 |

- 平台列表可扩展
- 参数值以 password 字段显示
- 支持启用/禁用某个平台

#### 1.3 数据库迁移

当前数据库没有 settings 表，需要新增：

```sql
CREATE TABLE settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,        -- 'llm' | 'twitter' | 'youtube' | ...
  key TEXT NOT NULL,             -- 'api_key' | 'base_url' | 'model_name' | 'bearer_token'
  value TEXT,                    -- 配置值（加密存储或明文）
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category, key)
);
```

#### 1.4 前端路由

- `/settings` — 设置页
- Sidebar 添加"设置"入口

---

### 2. Timeline 优化

**目标**: 只展示有信号数据的日期，同时展示今日概况。

#### 2.1 日期过滤

当前 Timeline 展示所有日期（含无数据的空白日）。优化后：
- 后端 API 增加日期过滤：只返回有 signals 记录的日期
- 前端日历组件标记有数据的日期（高亮圆点）
- 点击有数据的日期加载当日信号

#### 2.2 今日概况

即使今天没有采集到信号，也展示今日区域：
- 今日日期标题
- 当前采集状态（已采集 X 个源 / Y 条信号）
- 最后采集时间
- 快速入口：手动触发采集

---

## 技术约束

- 前端：React 18 + Vite + Tailwind CSS v4 + Lucide React
- 后端：Express + better-sqlite3
- API 格式：RESTful JSON
- 部署：腾讯云 43.163.227.232，PM2 + Caddy
- 子路径：`/signalscope/`

## 非功能需求

- 设置变更即时生效，无需重启
- API Key / Bearer Token 等敏感信息在前端显示为 password 类型
- 前端路由 basename 保持 `/signalscope`

---

## v1.2 完整功能清单

| # | 功能 | 优先级 | 说明 |
|---|------|--------|------|
| 1 | Reanalyze 按钮 + 已读标记 | P1 | 信号详情页操作 |
| 2 | 立场趋势时间线可视化 | P1 | 人物立场随时间变化 |
| 3 | Scheduler → Job Queue | P2 | 任务队列模式 |
| 4 | TypeScript 类型收严 | P2 | 消除 any |
| 5 | 设置页 | P0 | 大模型 + 平台参数配置 |
| 6 | Timeline 优化 | P0 | 仅展示有数据日期 + 今日概况 |

> P0 = 本次必须完成，P1 = 尽量完成，P2 = 有时间再做
