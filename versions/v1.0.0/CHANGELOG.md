# SignalScope v1.0.0

封版日期: 2026-03-20

## 功能

- 人物管理 CRUD
- 信息源管理（Substack RSS / Twitter API / Reddit RSS）
- 抓取任务管理（Cron 调度 + 手动触发）
- 内容列表（按天、按人物分组、按立场筛选）
- AI 信号分析（看多/看空/中性 + 评分 + 摘要）
- Dashboard 仪表盘（今日概览 + 7 天趋势 + 人物快照）
- Timeline 时间线（三栏布局）
- 搜索（全文搜索 + 多维筛选）
- 手动上传（PDF / URL / 纯文本）
- JWT 登录认证
- Prompt 模板管理

## 部署

- 服务器: 腾讯云 43.163.227.232
- 地址: https://kyochen.art/signalscope/
- SSL: Caddy（uri strip_prefix /signalscope）
- 进程: PM2 (signalscope, 端口 3020)

## 修复的问题

1. 创建 search 路由（之前缺失）
2. 修复 /api/auth/me（内联 JWT 验证）
3. 重写 analyzer.js（正确 schema + 模板变量）
4. 重写 3 个 Worker（config JSON 解析 + person_id）
5. 创建 scheduler.js（node-cron 调度）
6. 修复 daily-summary 计算 + stance_changes
7. Dashboard 添加趋势图 + 人物快照
8. SourceIcon 改用 Lucide 图标
9. Skeleton 添加 shimmer 动画
10. Tasks JOIN 补全
11. Contents stance 筛选
12. Caddy SSL 配置修复
