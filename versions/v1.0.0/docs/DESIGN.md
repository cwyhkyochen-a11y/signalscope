# SignalScope — 设计规范文档

> 统一设计提示词，用于指导所有页面的视觉风格、组件样式和交互模式。
> 风格基准：OpenAI 官网 / ChatGPT Web 端 — 明亮、干净、专业。

---

## 1. 设计哲学

- **Less is more** — 每个元素必须有存在的理由
- **内容优先** — 界面是内容的容器，不应喧宾夺主
- **呼吸感** — 大量留白，间距宽松，不拥挤
- **一致性** — 所有页面共享同一套视觉语言

---

## 2. 色彩系统

### 主色

```css
--color-primary: #10A37F;          /* OpenAI 绿，主操作按钮、链接 */
--color-primary-hover: #0D8C6D;
--color-primary-light: #E6F7F2;    /* 浅绿背景，用于高亮行/卡片 */

--color-accent: #1A73E8;           /* 辅助强调色，次级链接 */
```

### 中性色（灰色系）

```css
--color-bg: #FFFFFF;               /* 页面背景 */
--color-bg-secondary: #F7F7F8;     /* 侧边栏、次级区域背景 */
--color-bg-tertiary: #ECECF1;      /* 输入框背景、hover 状态 */

--color-border: #E5E5E5;           /* 所有边框 */
--color-border-light: #F0F0F0;     /* 轻分隔线 */

--color-text-primary: #1A1A1A;     /* 主文字 */
--color-text-secondary: #666666;   /* 次级文字、说明 */
--color-text-tertiary: #999999;    /* 占位符、时间戳 */
--color-text-disabled: #CCCCCC;    /* 禁用状态 */
```

### 语义色

```css
--color-success: #10A37F;          /* 成功、正面信号 */
--color-warning: #E8A317;          /* 警告 */
--color-error: #EF4444;            /* 错误、负面信号 */
--color-info: #1A73E8;             /* 信息提示 */
```

### 信号专用色

```css
--signal-bullish: #10A37F;         /* 看多 — 绿色 */
--signal-bearish: #EF4444;         /* 看空 — 红色 */
--signal-neutral: #999999;         /* 中性 — 灰色 */
```

---

## 3. 字体系统

### 字体族

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', 'SF Mono', Monaco, Consolas, monospace;
--font-cn: 'PingFang SC', 'Microsoft YaHei', sans-serif;  /* 中文回退 */
```

### 字号层级

| 用途 | 大小 | 行高 | 字重 | 颜色 |
|------|------|------|------|------|
| 页面标题 (h1) | 28px | 36px | 700 | text-primary |
| 区块标题 (h2) | 20px | 28px | 600 | text-primary |
| 卡片标题 (h3) | 16px | 24px | 600 | text-primary |
| 正文 | 14px | 22px | 400 | text-primary |
| 辅助文字 | 13px | 20px | 400 | text-secondary |
| 标签/徽章 | 12px | 18px | 500 | text-secondary |
| 时间戳 | 12px | 16px | 400 | text-tertiary |

---

## 4. 间距系统

基于 4px 网格：

```css
--space-1: 4px;    /* 图标与文字间距 */
--space-2: 8px;    /* 紧凑元素间距 */
--space-3: 12px;   /* 表单元素内间距 */
--space-4: 16px;   /* 卡片内边距 */
--space-5: 20px;   /* 区块间距 */
--space-6: 24px;   /* 页面内容边距 */
--space-8: 32px;   /* 大区块间距 */
--space-10: 40px;  /* 页面级间距 */
--space-12: 48px;  /* 大空白区域 */
```

---

## 5. 圆角系统

```css
--radius-sm: 6px;    /* 小按钮、标签 */
--radius-md: 8px;    /* 输入框、卡片 */
--radius-lg: 12px;   /* 模态框、大卡片 */
--radius-xl: 16px;   /* 全屏面板 */
--radius-full: 9999px; /* 胶囊按钮 */
```

---

## 6. 阴影系统

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);        /* 卡片默认 */
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);        /* 下拉菜单 */
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);        /* 模态框 */
--shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.16);       /* 全屏面板 */
```

---

## 7. 核心组件规范

### 7.1 按钮

**主按钮（Primary）**
- 背景：`--color-primary`，文字：白色
- Hover：`--color-primary-hover`
- 高度：36px，内边距：16px 20px
- 圆角：`--radius-md`，字重：600
- 禁用：背景 `--color-bg-tertiary`，文字 `--color-text-disabled`

**次按钮（Secondary）**
- 背景：透明，边框：`--color-border`
- 文字：`--color-text-primary`
- Hover：背景 `--color-bg-secondary`

**文字按钮（Text）**
- 无背景无边框
- 文字：`--color-primary`
- Hover：加下划线

**图标按钮**
- 32x32px，图标居中
- Hover 背景：`--color-bg-tertiary`

### 7.2 输入框

- 高度：40px，内边距：10px 14px
- 边框：1px solid `--color-border`
- 圆角：`--radius-md`
- Focus：边框变为 `--color-primary`，无 outline
- 占位符颜色：`--color-text-tertiary`
- 错误态：边框 `--color-error`

### 7.3 卡片

- 背景：白色
- 边框：1px solid `--color-border`
- 圆角：`--radius-lg`
- 内边距：20px
- Hover：box-shadow `--shadow-sm`（轻微浮起，默认无阴影）
- 过渡：all 0.15s ease

### 7.4 标签/徽章（Badge）

- 内边距：2px 8px
- 圆角：`--radius-full`
- 字号：12px，字重：500
- 类型变体：
  - 默认：背景 `--color-bg-tertiary`，文字 `--color-text-secondary`
  - 看多：背景 `rgba(16,163,127,0.1)`，文字 `--signal-bullish`
  - 看空：背景 `rgba(239,68,68,0.1)`，文字 `--signal-bearish`
  - 来源：背景 `rgba(26,115,232,0.1)`，文字 `--color-accent`

### 7.5 侧边栏

- 宽度：260px（可折叠到 64px）
- 背景：`--color-bg-secondary`
- 右边框：1px solid `--color-border-light`
- 选中项：背景 `--color-bg-tertiary`，左侧 3px 竖线 `--color-primary`
- 内边距：12px 8px

### 7.6 表格

- 无外边框
- 行分隔线：1px solid `--color-border-light`
- 表头：背景 `--color-bg-secondary`，字号 12px，字重 600，大写
- Hover 行：背景 `--color-bg-secondary`
- 单元格内边距：12px 16px

### 7.7 模态框/抽屉

- 遮罩：rgba(0, 0, 0, 0.4)
- 模态：圆角 `--radius-xl`，阴影 `--shadow-lg`
- 抽屉：从右侧滑入，宽度 480px，高度 100vh
- 关闭按钮：右上角 X 图标

### 7.8 空状态

- 插图或图标居中
- 标题：16px，字重 600
- 描述：14px，`--color-text-secondary`
- 可选操作按钮

### 7.9 骨架屏（Skeleton）

- 背景：`--color-bg-tertiary`
- 动画：shimmer（左到右渐变扫过）
- 圆角：`--radius-sm`
- 行高：14px，与文字行高一致

---

## 8. 页面布局规范

### 8.1 主布局

```
┌─────────────────────────────────────────────┐
│  顶部导航栏 (56px)                           │
├────────┬────────────────────────────────────┤
│        │                                    │
│ 侧边栏 │  主内容区域                         │
│ 260px  │  padding: 24px 32px                │
│        │  max-width: 1200px 居中            │
│        │                                    │
└────────┴────────────────────────────────────┘
```

### 8.2 内容区域

- 最大宽度：1200px，居中
- 内边距：24px 垂直，32px 水平
- 区块间距：32px
- 卡片网格间距：16px

### 8.3 响应式断点

```css
--breakpoint-sm: 640px;    /* 手机 */
--breakpoint-md: 768px;    /* 平板 */
--breakpoint-lg: 1024px;   /* 小桌面 */
--breakpoint-xl: 1280px;   /* 桌面 */
```

移动端：侧边栏折叠为底部 Tab，内容区域全宽。

---

## 9. 图标规范

- 使用 **Lucide Icons**（统一图标库）
- 默认尺寸：16px / 20px / 24px
- 颜色继承父元素 `color`
- 图标与文字间距：6px

---

## 10. 动效规范

- 过渡时长：150ms（快）/ 250ms（中）/ 350ms（慢）
- 缓动函数：`ease` 或 `cubic-bezier(0.4, 0, 0.2, 1)`
- 不使用弹跳、旋转等花哨动效
- 加载用 skeleton + shimmer，不用 spinner（除非按钮内）

---

## 11. 暗色模式（暂不启用）

当前版本只做亮色。预留 CSS 变量结构，未来可扩展暗色主题。

---

## 12. 不允许出现的元素

- ❌ 渐变背景
- ❌ 玻璃态（Glassmorphism）
- ❌ 多彩阴影
- ❌ 自定义滚动条样式（用系统默认）
- ❌ emoji 作为功能图标（只用 Lucide SVG）
- ❌ 纯装饰性动画

---

*最后更新: 2026-03-20*
