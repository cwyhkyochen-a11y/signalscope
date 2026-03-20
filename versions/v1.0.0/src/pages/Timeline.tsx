import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getContents, getDailySummary } from '../api'
import { SignalBadge, SourceIcon, Skeleton } from '../components/UI'
import { User } from 'lucide-react'

export default function Timeline() {
  const { date: paramDate } = useParams()
  const today = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState(paramDate || today)
  const [contents, setContents] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [selectedContent, setSelectedContent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Generate last 30 days
  const dates = Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return d.toISOString().split('T')[0]
  })

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getContents({ date: selectedDate }).then(r => r.data || r),
      getDailySummary(selectedDate).catch(() => null),
    ]).then(([c, s]) => {
      setContents(Array.isArray(c) ? c : c?.data || [])
      setSummary(s)
      if (c?.length > 0 && !selectedContent) setSelectedContent(c[0])
    }).finally(() => setLoading(false))
  }, [selectedDate])

  // Group by person
  const grouped: Record<string, any[]> = {}
  contents.forEach(c => {
    const name = c.person_name || 'Unknown'
    if (!grouped[name]) grouped[name] = []
    grouped[name].push(c)
  })

  const getPersonStanceCount = (items: any[]) => {
    const counts = { bullish: 0, bearish: 0, neutral: 0 }
    items.forEach(i => {
      if (i.stance) (counts as any)[i.stance]++
    })
    return counts
  }

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Left: Date List */}
      <div className="w-[200px] border-r overflow-y-auto shrink-0" style={{ borderColor: 'var(--color-border-light)' }}>
        {dates.map(d => (
          <button
            key={d}
            onClick={() => { setSelectedDate(d); setSelectedContent(null) }}
            className="w-full text-left px-4 py-2.5 text-sm transition-colors"
            style={{
              background: d === selectedDate ? 'var(--color-bg-tertiary)' : 'transparent',
              color: d === selectedDate ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontWeight: d === selectedDate ? 600 : 400,
              borderLeft: d === selectedDate ? '3px solid var(--color-primary)' : '3px solid transparent',
            }}
          >
            {d === today ? 'Today' : d}
          </button>
        ))}
      </div>

      {/* Middle: Content grouped by person */}
      <div className="flex-1 overflow-y-auto p-4">
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
          {selectedDate === today ? 'Today' : selectedDate}
        </h2>

        {loading ? (
          <Skeleton lines={6} />
        ) : Object.keys(grouped).length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>No content for this date.</p>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([personName, items]) => {
              const stanceCount = getPersonStanceCount(items)
              return (
                <div key={personName}>
                  {/* Person header */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'var(--color-bg-tertiary)' }}>
                      <User size={14} style={{ color: 'var(--color-text-tertiary)' }} />
                    </div>
                    <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{personName}</span>
                    <span className="text-xs ml-2" style={{ color: 'var(--color-text-tertiary)' }}>
                      {stanceCount.bullish > 0 && <span style={{ color: 'var(--signal-bullish)' }}>{stanceCount.bullish} bullish</span>}
                      {stanceCount.bullish > 0 && stanceCount.bearish > 0 && ' / '}
                      {stanceCount.bearish > 0 && <span style={{ color: 'var(--signal-bearish)' }}>{stanceCount.bearish} bearish</span>}
                      {(stanceCount.bullish > 0 || stanceCount.bearish > 0) && stanceCount.neutral > 0 && ' / '}
                      {stanceCount.neutral > 0 && <span>{stanceCount.neutral} neutral</span>}
                    </span>
                  </div>

                  {/* Content cards */}
                  <div className="space-y-2">
                    {items.map(item => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedContent(item)}
                        className="border rounded-lg p-3.5 cursor-pointer transition-all hover:shadow-sm"
                        style={{
                          borderColor: selectedContent?.id === item.id ? 'var(--color-primary)' : 'var(--color-border)',
                          background: selectedContent?.id === item.id ? 'var(--color-primary-light)' : 'var(--color-bg)',
                        }}
                      >
                        <div className="flex items-start gap-2.5">
                          <SourceIcon type={item.source_type} size={18} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                              {item.title || item.body?.slice(0, 80)}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              {item.stance && <SignalBadge stance={item.stance} score={item.score} />}
                              <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                                {item.published_at ? new Date(item.published_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Right: Detail */}
      <div className="w-[400px] border-l overflow-y-auto p-5 shrink-0" style={{ borderColor: 'var(--color-border-light)' }}>
        {selectedContent ? (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <SourceIcon type={selectedContent.source_type} size={20} />
              <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {selectedContent.person_name || 'Unknown'}
              </span>
              {selectedContent.stance && <SignalBadge stance={selectedContent.stance} score={selectedContent.score} />}
            </div>

            <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              {selectedContent.title}
            </h3>

            {selectedContent.published_at && (
              <p className="text-xs mb-4" style={{ color: 'var(--color-text-tertiary)' }}>
                {new Date(selectedContent.published_at).toLocaleString()}
              </p>
            )}

            {selectedContent.summary && (
              <div className="mb-4 p-3 rounded-lg" style={{ background: 'var(--color-bg-secondary)' }}>
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-tertiary)' }}>AI SUMMARY</p>
                <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{selectedContent.summary}</p>
                {selectedContent.reasoning && (
                  <p className="text-xs mt-2" style={{ color: 'var(--color-text-secondary)' }}>{selectedContent.reasoning}</p>
                )}
              </div>
            )}

            <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--color-text-primary)' }}>
              {selectedContent.body}
            </div>

            {selectedContent.url && (
              <a
                href={selectedContent.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 text-sm font-medium"
                style={{ color: 'var(--color-primary)' }}
              >
                View original
              </a>
            )}
          </div>
        ) : (
          <p className="text-sm mt-8 text-center" style={{ color: 'var(--color-text-tertiary)' }}>
            Select a content item to view details
          </p>
        )}
      </div>
    </div>
  )
}
