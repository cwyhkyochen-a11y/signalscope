import { BookOpen, Twitter, Globe, FileText, Youtube, Inbox } from 'lucide-react'

export function SignalBadge({ stance, score }: { stance: string; score?: number }) {
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    bullish: { bg: 'rgba(16,163,127,0.1)', color: 'var(--signal-bullish)', label: 'Bullish' },
    bearish: { bg: 'rgba(239,68,68,0.1)', color: 'var(--signal-bearish)', label: 'Bearish' },
    neutral: { bg: 'rgba(153,153,153,0.1)', color: 'var(--signal-neutral)', label: 'Neutral' },
  }
  const s = styles[stance] || styles.neutral
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
      {score != null && <span className="ml-1">{score}/10</span>}
    </span>
  )
}

export function SourceIcon({ type, size = 16 }: { type: string; size?: number }) {
  const icons: Record<string, React.ReactNode> = {
    substack: <BookOpen size={size} />,
    twitter: <Twitter size={size} />,
    reddit: <Globe size={size} />,
    pdf: <FileText size={size} />,
    youtube: <Youtube size={size} />,
    manual: <FileText size={size} />,
  }
  const colors: Record<string, string> = {
    substack: '#FF6719',
    twitter: '#1DA1F2',
    reddit: '#FF4500',
    youtube: '#FF0000',
    pdf: '#666666',
    manual: '#10A37F',
  }
  return (
    <span className="inline-flex items-center justify-center shrink-0" style={{ color: colors[type] || '#999' }}>
      {icons[type] || <Globe size={size} />}
    </span>
  )
}

export function Skeleton({ lines = 3, width = '100%' }: { lines?: number; width?: string }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{ height: 14, width: i === lines - 1 ? '60%' : width }}
        />
      ))}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action }: {
  icon?: React.ComponentType<{ size?: number }>
  title: string
  description?: string
  action?: React.ReactNode
}) {
  const Ico = Icon || Inbox
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--color-bg-tertiary)' }}>
        <Ico size={22} style={{ color: 'var(--color-text-tertiary)' }} />
      </div>
      <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>{title}</p>
      {description && (
        <p className="text-xs mb-4 max-w-[320px]" style={{ color: 'var(--color-text-tertiary)' }}>{description}</p>
      )}
      {action}
    </div>
  )
}
