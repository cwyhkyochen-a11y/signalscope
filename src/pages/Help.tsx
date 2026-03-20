import { Activity, GitBranch, Users, Radio, ListTodo, Upload, Search, MessageSquare, Settings, BarChart3, Clock, HelpCircle, Lightbulb, ListChecks, Eye, Filter, Globe, Key, Cpu, Zap } from 'lucide-react'

function UseCase({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-lg border-l-4 px-4 py-3" style={{ borderColor: 'var(--color-primary)', background: 'var(--color-bg-secondary)' }}>
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-primary)' }}>
        <Lightbulb size={13} /> Use Case
      </p>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{children}</p>
    </div>
  )
}

function FeatureCard({ icon: Icon, label, desc }: { icon: any, label: string, desc: string }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="mt-0.5 w-7 h-7 rounded flex items-center justify-center shrink-0" style={{ background: 'var(--color-bg-secondary)' }}>
        <Icon size={15} style={{ color: 'var(--color-text-tertiary)' }} />
      </div>
      <div>
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{label}</p>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{desc}</p>
      </div>
    </div>
  )
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border px-5 py-4 space-y-3" style={{ borderColor: 'var(--color-border)' }}>
      {children}
    </div>
  )
}

const sections = [
  {
    id: 'overview',
    title: 'SignalScope',
    icon: Activity,
    content: (
      <SectionCard>
        <table className="w-full text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--color-border-light)' }}>
              <td className="py-2.5 w-28 font-medium" style={{ color: 'var(--color-text-primary)' }}>定位</td>
              <td className="py-2.5">多源投资观点追踪系统，持续关注 KOL 在各平台的市场信号</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--color-border-light)' }}>
              <td className="py-2.5 font-medium" style={{ color: 'var(--color-text-primary)' }}>核心能力</td>
              <td className="py-2.5">跨平台聚合、AI 立场分析（看多 / 看空 / 中性）、信号打分、按天回溯</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--color-border-light)' }}>
              <td className="py-2.5 font-medium" style={{ color: 'var(--color-text-primary)' }}>数据源</td>
              <td className="py-2.5">Twitter、YouTube、Substack、Reddit、PDF 手动导入</td>
            </tr>
            <tr>
              <td className="py-2.5 font-medium" style={{ color: 'var(--color-text-primary)' }}>技术栈</td>
              <td className="py-2.5">Express + React + SQLite + Tailwind CSS</td>
            </tr>
          </tbody>
        </table>
      </SectionCard>
    ),
  },
  {
    id: 'workflow',
    title: '使用流程',
    icon: GitBranch,
    content: (
      <SectionCard>
        {[
          { step: '1', title: 'Settings — 配置系统参数', items: ['配置大模型（Base URL / API Key / Model Name）', '可选：配置 Twitter Bearer Token、YouTube API Key'] },
          { step: '2', title: 'People — 添加关注人物', items: ['创建 KOL（如 Dylan Patel）', '设置标签（semiconductor、AI、macro）用于分类'] },
          { step: '3', title: 'Sources — 关联信息源', items: ['为每个人关联 Twitter / YouTube / Substack / Reddit 源', '设置每个源的采集频次（15min ~ 4h）'] },
          { step: '4', title: 'Tasks + Dashboard — 开始追踪', items: ['系统自动创建采集任务并定时执行', '在 Dashboard 看概览，Timeline 按天浏览'] },
        ].map(({ step, title, items }) => (
          <div key={step} className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-white" style={{ background: 'var(--color-primary)' }}>
              {step}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold mb-1.5" style={{ color: 'var(--color-text-primary)' }}>{title}</p>
              <ul className="space-y-1 text-sm list-disc pl-4" style={{ color: 'var(--color-text-secondary)' }}>
                {items.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          </div>
        ))}
      </SectionCard>
    ),
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: BarChart3,
    subtitle: '全局概览',
    content: (
      <SectionCard>
        <FeatureCard icon={Eye} label="今日内容量" desc="今天采集到的新内容数量" />
        <FeatureCard icon={BarChart3} label="立场分布" desc="所有信号中看多 / 看空 / 中性的比例" />
        <FeatureCard icon={Zap} label="热点信号" desc="按分数排序的最新观点" />
        <FeatureCard icon={ListChecks} label="今日内容" desc="最新采集的内容列表，可直接查看原文" />
        <FeatureCard icon={Users} label="人物快照" desc="每个人物最近的立场摘要和趋势" />
      </SectionCard>
    ),
  },
  {
    id: 'timeline',
    title: 'Timeline',
    icon: Clock,
    subtitle: '时间线',
    content: (
      <SectionCard>
        <FeatureCard icon={Clock} label="日期导航" desc="左侧仅展示有数据的日期，点击即可查看当天内容" />
        <FeatureCard icon={BarChart3} label="今日概况" desc="采集量、活跃来源数、最新采集时间" />
        <FeatureCard icon={Users} label="按人分组" desc="每条内容显示人物、来源平台、AI 立场和分数" />
        <FeatureCard icon={Filter} label="筛选" desc="按人物、来源类型过滤" />
        <UseCase>
          跟踪 Dylan Patel 的半导体观点，在 Timeline 左侧只点有他的日子，快速对比不同时间的立场变化 —— 比如上周 Twitter 上说看多 NVDA，本周 Podcast 里转为谨慎。
        </UseCase>
      </SectionCard>
    ),
  },
  {
    id: 'people',
    title: 'People',
    icon: Users,
    subtitle: '人物管理',
    content: (
      <SectionCard>
        <FeatureCard icon={Users} label="添加人物" desc="填入名字、简介、标签（逗号分隔）" />
        <FeatureCard icon={Filter} label="标签分类" desc="用 semiconductor、macro、AI 等标签组织人物" />
        <FeatureCard icon={Eye} label="人物详情" desc="点击卡片进入详情页，查看该人物的所有信号和每日摘要" />
        <FeatureCard icon={Settings} label="编辑 / 删除" desc="卡片右上角可直接操作" />
        <UseCase>
          创建 Dylan Patel，标签填 semiconductor、chips、AI。系统把他所有平台的内容归拢到名下 —— YouTube 访谈、SemiAnalysis 文章、Twitter 动态，全部聚合显示。
        </UseCase>
      </SectionCard>
    ),
  },
  {
    id: 'sources',
    title: 'Sources',
    icon: Radio,
    subtitle: '信息源',
    content: (
      <SectionCard>
        <table className="w-full text-sm border-collapse" style={{ color: 'var(--color-text-secondary)' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
              <th className="text-left py-2 px-3 font-semibold" style={{ color: 'var(--color-text-primary)' }}>类型</th>
              <th className="text-left py-2 px-3 font-semibold" style={{ color: 'var(--color-text-primary)' }}>配置</th>
              <th className="text-left py-2 px-3 font-semibold" style={{ color: 'var(--color-text-primary)' }}>说明</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--color-border-light)' }}>
              <td className="py-2 px-3 font-medium">Twitter</td>
              <td className="py-2 px-3">用户名 + Bearer Token</td>
              <td className="py-2 px-3">抓取指定用户的推文和互动</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--color-border-light)' }}>
              <td className="py-2 px-3 font-medium">YouTube</td>
              <td className="py-2 px-3">频道 ID</td>
              <td className="py-2 px-3">自动抓取新视频，通过 RSS 采集</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--color-border-light)' }}>
              <td className="py-2 px-3 font-medium">Substack</td>
              <td className="py-2 px-3">Feed URL</td>
              <td className="py-2 px-3">通过 RSS 采集文章</td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-medium">Reddit</td>
              <td className="py-2 px-3">Subreddit 名称</td>
              <td className="py-2 px-3">抓取热帖和评论</td>
            </tr>
          </tbody>
        </table>
        <div className="flex gap-4 pt-1">
          <FeatureCard icon={Clock} label="独立频次" desc="每个源可设 15min / 30min / 1h / 2h / 4h" />
          <FeatureCard icon={Zap} label="手动采集" desc="点击刷新按钮立即触发" />
          <FeatureCard icon={Key} label="隐私保护" desc="Token 等敏感字段自动掩码显示" />
        </div>
        <UseCase>
          为 Dylan Patel 配置 4 个信息源：Twitter（用户名 dylan522p，30min）、YouTube（频道 ID，1h）、Substack（SemiAnalysis RSS，2h）、Reddit（SemiAnalysis 版块，4h）。各自独立频次运行，内容全部归属到 Dylan Patel 名下。
        </UseCase>
      </SectionCard>
    ),
  },
  {
    id: 'tasks',
    title: 'Tasks',
    icon: ListTodo,
    subtitle: '采集任务',
    content: (
      <SectionCard>
        <FeatureCard icon={ListChecks} label="自动创建" desc="每个信息源对应一个采集任务" />
        <FeatureCard icon={Clock} label="定时执行" desc="按源的采集频次自动运行，显示下次执行时间" />
        <FeatureCard icon={Zap} label="Run Now" desc="手动触发立即执行，不用等调度" />
        <FeatureCard icon={Activity} label="错误处理" desc="任务出错时显示错误信息，支持重试" />
      </SectionCard>
    ),
  },
  {
    id: 'upload',
    title: 'Upload',
    icon: Upload,
    subtitle: '手动导入',
    content: (
      <SectionCard>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-md border px-4 py-3" style={{ borderColor: 'var(--color-border)' }}>
            <p className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              <Upload size={14} /> PDF 上传
            </p>
            <table className="w-full text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              <tbody>
                <tr><td className="py-0.5 w-14 font-medium">输入</td><td className="py-0.5">PDF 文件（拖拽或点击上传）</td></tr>
                <tr><td className="py-0.5 font-medium">前置</td><td className="py-0.5">先选择关联人物</td></tr>
                <tr><td className="py-0.5 font-medium">处理</td><td className="py-0.5">自动提取文本 → AI 分析立场</td></tr>
              </tbody>
            </table>
          </div>
          <div className="rounded-md border px-4 py-3" style={{ borderColor: 'var(--color-border)' }}>
            <p className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              <Globe size={14} /> URL 导入
            </p>
            <table className="w-full text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              <tbody>
                <tr><td className="py-0.5 w-14 font-medium">输入</td><td className="py-0.5">文章 URL</td></tr>
                <tr><td className="py-0.5 font-medium">前置</td><td className="py-0.5">先选择关联人物</td></tr>
                <tr><td className="py-0.5 font-medium">处理</td><td className="py-0.5">抓取网页内容 → AI 分析立场</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <UseCase>
          订阅 SemiAnalysis 的付费专栏，看到 Dylan Patel 的深度文章。PDF tab — 下载 PDF 上传；URL tab — 粘贴文章链接。两种方式都自动提取核心观点。
        </UseCase>
      </SectionCard>
    ),
  },
  {
    id: 'search',
    title: 'Search',
    icon: Search,
    subtitle: '全局搜索',
    content: (
      <SectionCard>
        <FeatureCard icon={Globe} label="全量搜索" desc="覆盖所有已采集内容（Twitter、YouTube、Substack、Reddit、PDF）" />
        <FeatureCard icon={Filter} label="筛选" desc="按人物、来源类型过滤结果" />
        <FeatureCard icon={Eye} label="结果展示" desc="内容摘要、立场标签、来源平台、原文链接" />
        <UseCase>
          回顾 Dylan Patel 所有关于 NVDA 的观点，搜索 "NVDA" 并筛选他，系统列出所有提到 NVDA 的内容和对应立场。
        </UseCase>
      </SectionCard>
    ),
  },
  {
    id: 'prompts',
    title: 'Prompts',
    icon: MessageSquare,
    subtitle: '提示词管理',
    content: (
      <SectionCard>
        <FeatureCard icon={Cpu} label="AI 分析引擎" desc="提示词决定系统如何从内容中提取观点和判断立场" />
        <FeatureCard icon={MessageSquare} label="预设模板" desc="已内置通用投资信号分析提示词" />
        <FeatureCard icon={Settings} label="自定义" desc="可创建针对特定领域的提示词（半导体、加密货币等）" />
        <FeatureCard icon={Activity} label="变量注入" desc="支持 {`{content}`}, {`{person}`}, {`{date}`} 等占位符" />
        <UseCase>
          关注半导体领域，创建专门提示词，要求 AI 重点关注芯片供需、代工产能、设计进展等维度，而不是泛泛判断看多看空。
        </UseCase>
      </SectionCard>
    ),
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: Settings,
    subtitle: '系统设置',
    content: (
      <SectionCard>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>首次使用应优先完成此页面配置。</p>
        <div className="rounded-md border" style={{ borderColor: 'var(--color-border)' }}>
          <div className="px-4 py-3">
            <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>LLM 大模型（OpenAI 兼容格式）</p>
            <table className="w-full text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--color-border-light)' }}><td className="py-1.5 w-28 font-medium">Base URL</td><td className="py-1.5">API 端点，如 https://api.openai.com/v1</td></tr>
                <tr style={{ borderBottom: '1px solid var(--color-border-light)' }}><td className="py-1.5 font-medium">API Key</td><td className="py-1.5">密钥（密码框，点击眼睛可显示）</td></tr>
                <tr><td className="py-1.5 font-medium">Model Name</td><td className="py-1.5">模型标识，如 gpt-4o-mini、deepseek-chat</td></tr>
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3" style={{ borderTop: '1px solid var(--color-border-light)' }}>
            <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>平台参数</p>
            <table className="w-full text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--color-border-light)' }}><td className="py-1.5 w-28 font-medium">Twitter</td><td className="py-1.5">Bearer Token（Twitter Developer Portal 获取）</td></tr>
                <tr><td className="py-1.5 font-medium">YouTube</td><td className="py-1.5">API Key（Google Cloud Console 获取）</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <UseCase>
          用 DeepSeek 分析信号：Base URL 填 https://api.deepseek.com/v1，Model Name 填 deepseek-chat。如需采集 Twitter 内容，再在平台参数填入 Bearer Token。
        </UseCase>
      </SectionCard>
    ),
  },
]

export default function Help() {
  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-[28px] font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>User Manual</h1>
        <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>SignalScope v1.2.0 使用手册</p>
      </div>

      {/* TOC */}
      <div className="mb-10 rounded-lg border px-5 py-4" style={{ borderColor: 'var(--color-border)' }}>
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--color-text-tertiary)' }}>Contents</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
          {sections.map(({ id, title, subtitle }) => (
            <a key={id} href={`#${id}`} className="text-sm hover:underline" style={{ color: 'var(--color-primary)' }}>
              {subtitle ? `${title} — ${subtitle}` : title}
            </a>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-10">
        {sections.map(({ id, title, subtitle, icon: Icon, content }) => (
          <section key={id} id={id}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2.5" style={{ color: 'var(--color-text-primary)' }}>
              <Icon size={20} strokeWidth={2} style={{ color: 'var(--color-primary)' }} />
              {title}
              {subtitle && <span className="text-base font-normal" style={{ color: 'var(--color-text-tertiary)' }}>— {subtitle}</span>}
            </h2>
            {content}
          </section>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-14 pt-6 text-center" style={{ borderTop: '1px solid var(--color-border)' }}>
        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>SignalScope v1.2.0 · Built with Express + React + SQLite</p>
      </div>
    </div>
  )
}
