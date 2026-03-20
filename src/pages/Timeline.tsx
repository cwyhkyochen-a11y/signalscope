import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getContents, getDailySummary, getTimelineDates, deleteContent } from '../api'
import { SignalBadge, SourceIcon, Skeleton, EmptyState } from '../components/UI'
import { User, RefreshCw, Database, Clock as ClockIcon, Calendar, Trash2 } from 'lucide-react'
import { useToast } from '../components/Toast'

interface DateInfo {
  date: string
  content_count: number
}

interface TodayStatus {
  date: string
  active_sources: number
  content_count: number
  last_poll: string | null
}

export default function Timeline() {
  const { toast } = useToast()
  const { date: paramDate } = useParams()
  const today = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState(paramDate || today)
  const [contents, setContents] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [selectedContent, setSelectedContent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dateList, setDateList] = useState<DateInfo[]>([])
  const [todayStatus, setTodayStatus] = useState<TodayStatus | null>(null)
  const [datesLoading, setDatesLoading] = useState(true)

  // Load date list on mount
  useEffect(() => {
    getTimelineDates(60)
      .then(data => {
        setDateList(data.dates || [])
        setTodayStatus(data.today || null)
      })
      .finally(() => setDatesLoading(false))
  }, [])

  // Load content for selected date
  useEffect(() => {
    setLoading(true)
    setSelectedContent(null)
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

  // Build daily summary lookup by person name
  const dailySummaries: Record<string, any> = {}
  if (summary?.person_daily_summaries) {
    summary.person_daily_summaries.forEach((ds: any) => {
      dailySummaries[ds.person_name] = ds
    })
  }

  const getPersonStanceCount = (items: any[]) => {
    const counts = { bullish: 0, bearish: 0, neutral: 0 }
    items.forEach(i => {
      if (i.stance) (counts as any)[i.stance]++
    })
    return counts
  }

  // Delete content handler
  const handleDelete = async (id: number) => {
    if (!confirm('Delete this content? This cannot be undone.')) return
    try {
      await deleteContent(id)
      setContents(prev => prev.filter(c => c.id !== id))
      setSelectedContent(null)
      // Reload date list
      getTimelineDates(60).then(data => {
        setDateList(data.dates || [])
        setTodayStatus(data.today || null)
      })
    } catch (e) {
      toast('Failed to delete content', 'error')
    }
  }

  // Check if a date has data
  const hasData = (date: string) => dateList.some(d => d.date === date)
  const getDateCount = (date: string) => dateList.find(d => d.date === date)?.content_count || 0

  // Build display list: dates with data + today (if not in list)
  const displayDates: DateInfo[] = []
  const todayInList = dateList.find(d => d.date === today)
  if (todayInList) {
    displayDates.push(...dateList)
  } else {
    displayDates.push({ date: today, content_count: 0 })
    displayDates.push(...dateList)
  }

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Left: Date List */}
      <div className="w-[220px] border-r overflow-y-auto shrink-0" style={{ borderColor: 'var(--color-border-light)' }}>
        {datesLoading ? (
          <div className="p-4"><Skeleton lines={10} /></div>
        ) : (
          displayDates.map(({ date, content_count }) => {
            const isToday = date === today
            const isActive = date === selectedDate
            return (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className="w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between"
                style={{
                  background: isActive ? 'var(--color-bg-tertiary)' : 'transparent',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  fontWeight: isActive ? 600 : 400,
                  borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
                }}
              >
                <span>
                  {isToday ? 'Today' : date}
                </span>
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full"
                  style={{
                    background: isToday && content_count === 0 ? 'var(--color-bg-tertiary)' : content_count > 0 ? 'var(--color-primary-light)' : 'var(--color-bg-tertiary)',
                    color: isToday && content_count === 0 ? 'var(--color-text-tertiary)' : content_count > 0 ? 'var(--color-primary)' : 'var(--color-text-tertiary)',
                  }}
                >
                  {content_count}
                </span>
              </button>
            )
          })
        )}
      </div>

      {/* Middle: Content grouped by person OR today status */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Today status card */}
        {selectedDate === today && todayStatus && (
          <div className="border rounded-lg p-4 mb-4" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Today</span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-tertiary)' }}>
                {today}
              </span>
            </div>
            <div className="flex items-center gap-5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              <span className="flex items-center gap-1.5">
                <Database size={14} style={{ color: 'var(--color-text-tertiary)' }} />
                {todayStatus.content_count} signals today
              </span>
              <span className="flex items-center gap-1.5">
                <RefreshCw size={14} style={{ color: 'var(--color-text-tertiary)' }} />
                {todayStatus.active_sources} active sources
              </span>
              {todayStatus.last_poll && (
                <span className="flex items-center gap-1.5">
                  <ClockIcon size={14} style={{ color: 'var(--color-text-tertiary)' }} />
                  Last poll: {new Date(todayStatus.last_poll).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>
        )}

        {selectedDate !== today && (
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            {selectedDate}
          </h2>
        )}

        {loading ? (
          <Skeleton lines={6} />
        ) : Object.keys(grouped).length === 0 ? (
          <EmptyState icon={Calendar} title="No content for this date" description="Select another date or wait for the next collection cycle." />
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([personName, items]) => {
              const stanceCount = getPersonStanceCount(items)
              const daySummary = dailySummaries[personName]
              return (
                <div key={personName}>
                  {/* Person header */}
                  <div className="flex items-center gap-2 mb-1">
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
                    {daySummary && (
                      <SignalBadge stance={daySummary.overall_stance} score={Math.round(daySummary.overall_score)} />
                    )}
                  </div>
                  {/* Daily comprehensive summary */}
                  {daySummary && daySummary.summary && (
                    <p className="text-xs mb-2 ml-9" style={{ color: 'var(--color-text-secondary)' }}>
                      {daySummary.summary}
                    </p>
                  )}

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

            {selectedContent.source_type === 'pdf' && selectedContent.external_id && (
              <a
                href={`/api/upload/file/${encodeURIComponent(selectedContent.external_id)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 ml-3 text-sm font-medium"
                style={{ color: 'var(--color-primary)' }}
              >
                Download PDF
              </a>
            )}

            {/* Delete button */}
            {(selectedContent.source_type === 'pdf' || selectedContent.source_type === 'manual') && (
              <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--color-border-light)' }}>
                <button
                  onClick={() => handleDelete(selectedContent.id)}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
                  style={{ color: 'var(--signal-bearish)', background: 'rgba(239,68,68,0.08)' }}
                >
                  <Trash2 size={13} />
                  Delete this content
                </button>
              </div>
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
