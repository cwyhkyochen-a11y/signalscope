import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getPeople, getPersonContents, getPersonSignals, getPersonDailySummaries } from '../api'
import { SignalBadge, SourceIcon, Skeleton } from '../components/UI'
import { User, ArrowLeft } from 'lucide-react'

export default function PeopleDetail() {
  const { id } = useParams()
  const [person, setPerson] = useState<any>(null)
  const [contents, setContents] = useState<any[]>([])
  const [signals, setSignals] = useState<any>(null)
  const [dailySummaries, setDailySummaries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      getPeople().then(r => (r.data || r).find((p: any) => p.id === Number(id))),
      getPersonContents(Number(id)),
      getPersonSignals(Number(id)),
      getPersonDailySummaries(Number(id), 30),
    ]).then(([p, c, s, ds]) => {
      setPerson(p)
      setContents(c.data || c)
      setSignals(s)
      setDailySummaries(ds.data || ds)
    }).finally(() => setLoading(false))
  }, [id])

  if (loading) return <Skeleton lines={8} />
  if (!person) return <p>Person not found.</p>

  return (
    <div>
      <Link to="/people" className="inline-flex items-center gap-2 text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
        <ArrowLeft size={16} /> Back to People
      </Link>

      {/* Person Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'var(--color-bg-tertiary)' }}>
          <User size={28} style={{ color: 'var(--color-text-tertiary)' }} />
        </div>
        <div>
          <h1 className="text-[28px] font-bold" style={{ color: 'var(--color-text-primary)' }}>{person.name}</h1>
          {person.bio && <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>{person.bio}</p>}
          {person.tags && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {person.tags.split(',').map((t: string, i: number) => (
                <span key={i} className="px-2 py-0.5 rounded-full text-xs" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
                  {t.trim()}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Signal Stats */}
      {signals && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="border rounded-xl p-4" style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-xs font-medium uppercase mb-1" style={{ color: 'var(--color-text-tertiary)' }}>Bullish</p>
            <p className="text-xl font-bold" style={{ color: 'var(--signal-bullish)' }}>{signals.bullish || 0}</p>
          </div>
          <div className="border rounded-xl p-4" style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-xs font-medium uppercase mb-1" style={{ color: 'var(--color-text-tertiary)' }}>Bearish</p>
            <p className="text-xl font-bold" style={{ color: 'var(--signal-bearish)' }}>{signals.bearish || 0}</p>
          </div>
          <div className="border rounded-xl p-4" style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-xs font-medium uppercase mb-1" style={{ color: 'var(--color-text-tertiary)' }}>Neutral</p>
            <p className="text-xl font-bold" style={{ color: 'var(--signal-neutral)' }}>{signals.neutral || 0}</p>
          </div>
        </div>
      )}

      {/* Daily Summary Trends */}
      {dailySummaries.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>观点趋势</h2>
          <div className="space-y-2">
            {dailySummaries.map((ds: any) => (
              <div key={ds.id} className="border rounded-lg p-4" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{ds.date}</span>
                  <SignalBadge stance={ds.overall_stance} score={Math.round(ds.overall_score)} />
                </div>
                {ds.summary && (
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{ds.summary}</p>
                )}
                <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-tertiary)' }}>
                  综合 {ds.content_count} 条内容
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content Timeline */}
      <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Content Timeline</h2>
      {contents.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>No content yet.</p>
      ) : (
        <div className="space-y-3">
          {contents.map((item: any) => (
            <div key={item.id} className="border rounded-lg p-4 hover:shadow-sm transition-all" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-start gap-3">
                <SourceIcon type={item.source_type} size={20} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{item.title || item.body?.slice(0, 80)}</span>
                    {item.stance && <SignalBadge stance={item.stance} score={item.score} />}
                  </div>
                  <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {item.published_at ? new Date(item.published_at).toLocaleString() : ''}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
