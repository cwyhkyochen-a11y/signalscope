import { useState, useEffect } from 'react'
import { getDashboard } from '../api'
import { SignalBadge, SourceIcon, Skeleton, EmptyState } from '../components/UI'
import { TrendingUp, TrendingDown, Minus, FileText, BarChart3 } from 'lucide-react'

export default function Dashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboard().then(setData).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton lines={8} />
  if (!data) return <EmptyState icon={BarChart3} title="No dashboard data" description="Add sources and start collecting signals to see your dashboard." />

  const { today_count, stance_breakdown, top_signals, contents, trends, people_snapshot } = data

  return (
    <div>
      <h1 className="text-[28px] font-bold mb-8" style={{ color: 'var(--color-text-primary)' }}>Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="border rounded-xl p-5" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-2 mb-2">
            <FileText size={18} style={{ color: 'var(--color-text-tertiary)' }} />
            <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-tertiary)' }}>Today</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{today_count || 0}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>new contents</p>
        </div>
        <div className="border rounded-xl p-5" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} style={{ color: 'var(--signal-bullish)' }} />
            <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-tertiary)' }}>Bullish</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'var(--signal-bullish)' }}>{stance_breakdown?.bullish || 0}</p>
        </div>
        <div className="border rounded-xl p-5" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={18} style={{ color: 'var(--signal-bearish)' }} />
            <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-tertiary)' }}>Bearish</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'var(--signal-bearish)' }}>{stance_breakdown?.bearish || 0}</p>
        </div>
        <div className="border rounded-xl p-5" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Minus size={18} style={{ color: 'var(--signal-neutral)' }} />
            <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-tertiary)' }}>Neutral</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'var(--signal-neutral)' }}>{stance_breakdown?.neutral || 0}</p>
        </div>
      </div>

      {/* Signal Trends */}
      {trends && trends.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Signal Trends (7 Days)</h2>
          <div className="border rounded-xl p-5" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex items-end gap-2 h-32">
              {trends.map((t: any) => {
                const maxScore = Math.max(...trends.map((x: any) => x.avg_score || 0), 1)
                const height = ((t.avg_score || 0) / maxScore) * 100
                return (
                  <div key={t.date} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      {(t.avg_score || 0).toFixed(1)}
                    </span>
                    <div
                      className="w-full rounded-t"
                      style={{
                        height: `${Math.max(height, 4)}%`,
                        background: 'var(--color-primary)',
                        minHeight: 4,
                      }}
                    />
                    <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      {t.date.slice(5)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* People Snapshot */}
      {people_snapshot && people_snapshot.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>People Snapshot</h2>
          <div className="grid grid-cols-3 gap-4">
            {people_snapshot.map((p: any) => (
              <div key={p.id} className="border rounded-xl p-5 transition-all hover:shadow-sm" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{p.name}</span>
                  {p.latest_stance && <SignalBadge stance={p.latest_stance} score={p.avg_score_7d ? Math.round(p.avg_score_7d) : undefined} />}
                </div>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {p.latest_summary || 'No signals yet'}
                </p>
                {p.avg_score_7d != null && (
                  <p className="text-xs mt-2" style={{ color: 'var(--color-text-tertiary)' }}>
                    7-day avg: {Number(p.avg_score_7d).toFixed(1)}/10
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today Contents */}
      <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Today's Content</h2>
      {!contents || contents.length === 0 ? (
        <EmptyState icon={FileText} title="No content today" description="New signals will appear here as sources are collected." />
      ) : (
        <div className="space-y-3">
          {contents.map((item: any) => (
            <div
              key={item.id}
              className="border rounded-lg p-4 transition-all cursor-pointer hover:shadow-sm"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-start gap-3">
                <SourceIcon type={item.source_type} size={20} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {item.person_name || 'Unknown'}
                    </span>
                    {item.stance && <SignalBadge stance={item.stance} score={item.score} />}
                  </div>
                  <p className="text-sm truncate" style={{ color: 'var(--color-text-secondary)' }}>
                    {item.title || item.body?.slice(0, 100)}
                  </p>
                </div>
                <span className="text-xs shrink-0" style={{ color: 'var(--color-text-tertiary)' }}>
                  {item.published_at ? new Date(item.published_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
