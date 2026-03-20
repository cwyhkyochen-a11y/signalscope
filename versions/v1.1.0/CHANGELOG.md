# SignalScope v1.1.0 CHANGELOG

**发布日期**: 2026-03-21
**状态**: 已封版 ✅

---

## 新功能

### 1. YouTube Channel RSS Worker
- 新建 `server/workers/youtube.js`
- 支持 YouTube Channel RSS 源采集
- Sources 页面新增 YouTube 类型选项

### 2. PDF 上传即时分析
- 修改 `server/routes/upload.js`
- 上传 PDF 后立即调用 AI 分析，不再等待下次采集
- 分析结果直接入库 signals 表

### 3. 人物+日期综合分析
- 新建 `server/workers/day-summary.js`
- Timeline 页面按人物分组展示当日信号
- PeopleDetail 页面展示人物信号统计

### 4. JWT Secret 环境变量
- `server/auth.js` 改用 `process.env.JWT_SECRET`
- 不再硬编码密钥

### 5. 部署子路径支持
- Vite `base: '/signalscope/'` 配置
- Caddy `uri strip_prefix /signalscope` 反向代理
- 前端资源路径正确生成

## Bug 修复

### 1. 登录无反应 (关键修复)
- **根因**: `api.ts` 中 `BASE = '/api'` 硬编码，部署在 `/signalscope/` 子路径下时，浏览器请求 `/api/auth/login` 不经过 Caddy 路由，返回空响应
- **修复**: 新增 `getBase()` 函数，动态检测 `/signalscope` 前缀
- **影响文件**: `src/api.ts`

### 2. 登录成功后页面不跳转
- **根因**: Login 组件成功后只调用 `onLogin()` 设置 token，不触发路由跳转，导致 Login 组件反复渲染
- **修复**: 添加 `navigate('/dashboard', { replace: true })` 确保跳转
- **影响文件**: `src/pages/Login.tsx`

### 3. 401 重定向路径硬编码
- **根因**: `window.location.href = '/signalscope/login'` 硬编码
- **修复**: 新增 `getLoginPath()` 动态检测路径
- **影响文件**: `src/api.ts`

### 4. Review 发现的问题
- day-summary prompt 模板双花括号 → 改为单花括号
- analyzer.js 代码重复 → 提取 `callAnalyzeAI` + `saveSignal`
- `getDominant` 空对象崩溃 → 加 length > 0 防御

## 部署信息

| 项目 | 值 |
|------|-----|
| 服务器 | 腾讯云 43.163.227.232 |
| 部署路径 | /opt/signalscope/ |
| 端口 | 3020 |
| PM2 进程 | signalscope |
| 访问地址 | https://kyochen.art/signalscope/ |
| 代理 | Caddy (strip_prefix /signalscope) |
| 账号 | admin / Admin@2024 |

## v1.2 待办

- [ ] Reanalyze 按钮 + 已读标记 UI
- [ ] 立场趋势时间线可视化
- [ ] Scheduler 改用 Job Queue
- [ ] 前端 TypeScript 类型收严
- [ ] 设置页 — 大模型配置（base url / key / name，OpenAI 格式）+ 各平台参数（如 Twitter Bearer Token）
- [ ] Timeline 仅展示有数据的日期 + 今日概况
