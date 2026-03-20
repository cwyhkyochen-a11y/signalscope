import { useState, useEffect, useCallback } from 'react'
import { getTimelineDates, getContents, getAnalysisRecords, getAnalysisRecord, runAnalysis, deleteAnalysisRecord } from '../api'
import { FlaskConical, Play, Trash2, ChevronDown, ChevronUp, RefreshCw, Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import { useToast } from '../components/Toast'

interface DateInfo {
  date: string
  content_count: number
}

interface ContentItem {
  id: number
  title: string
  source_type: string
  person_name: string | null
  stance: string | null
  score: number | null
  summary: string | null
  created_at: string
}

interface AnalysisRecord {
  id: number
  title: string
  prompt: string
  dates: string[]
  content_ids: number[]
  result: string | null
  status: string
  error_msg: string | null
  created_at: string
}

const DEFAULT_PROMPT = `You are an investment analyst. Analyze the following content items from various KOLs and sources.

Focus on:
1. Key investment themes and trends
2. Consensus vs. divergent views across sources
3. Notable signals: bullish/bearish positions, confidence levels
4. Any specific tickers, sectors, or asset classes mentioned
5. Overall market sentiment summary

Return a structured analysis in markdown format with clear sections.`

const stanceColor: Record<string, string> = {
  bullish: 'var(--color-success)',
  bearish: 'var(--color-error)',
  neutral: 'var(--color-warning)',
}

export default function Analysis() {
  const { toast } = useToast()
  const [tab, setTab] = useState<'run' | 'history'>('run')
  const [dates, setDates] = useState<DateInfo[]>([])
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set())
  const [contents, setContents] = useState<ContentItem[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [loadingContents, setLoadingContents] = useState(false)
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT)
  const [running, setRunning] = useState(false)
  const [records, setRecords] = useState<AnalysisRecord[]>([])
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [loadingRecords, setLoadingRecords] = useState(false)

  // Load dates
  useEffect(() => { getTimelineDates(90).then(d => setDates(d.dates || d)) }, [])

  // Load records
  const loadRecords = useCallback(() => {
    setLoadingRecords(true)
    getAnalysisRecords().then(r => { setRecords(r); setLoadingRecords(false) })
  }, [])
  useEffect(() => { loadRecords() }, [loadRecords])

  // Load contents when dates change
  useEffect(() => {
    if (!selectedDates.size) { setContents([]); return }
    setLoadingContents(true)
    const dateArr = Array.from(selectedDates).sort().reverse()
    Promise.all(dateArr.map(d => getContents({ date: d, limit: '100' })))
      .then(results => {
        const all: ContentItem[] = []
        for (const r of results) all.push(...(r.data || r))
        setContents(all)
        setLoadingContents(false)
      })
      .catch(() => setLoadingContents(false))
  }, [selectedDates])

  const toggleDate = (date: string) => {
    setSelectedDates(prev => {
      const next = new Set(prev)
      if (next.has(date)) next.delete(date); else next.add(date)
      return next
    })
    setSelectedIds(new Set()) // reset selections when dates change
  }

  const toggleItem = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const selectAll = () => setSelectedIds(new Set(contents.map(c => c.id)))
  const deselectAll = () => setSelectedIds(new Set())

  const handleRun = async () => {
    if (!selectedIds.size) return
    setRunning(true)
    try {
      const res = await runAnalysis({
        content_ids: Array.from(selectedIds),
        prompt,
      })
      if (res.error) {
        toast(res.error, 'error')
        setRunning(false)
      } else {
        let attempts = 0
        const poll = setInterval(async () => {
          attempts++
          const record = await getAnalysisRecord(res.id)
          if (record.status === 'completed' || record.status === 'failed' || attempts > 30) {
            clearInterval(poll)
            setRunning(false)
            loadRecords()
            setTab('history')
            if (record.status === 'completed') setExpandedId(res.id)
          }
        }, 2000)
      }
    } catch (e: any) {
      toast(e.message, 'error')
      setRunning(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this analysis?')) return
    await deleteAnalysisRecord(id)
    setRecords(prev => prev.filter(r => r.id !== id))
  }

  const getStatusBadge = (record: AnalysisRecord) => {
    const map: Record<string, [typeof CheckCircle2, string, string]> = {
      running: [Loader2, 'var(--color-primary)', 'Running'],
      completed: [CheckCircle2, 'var(--color-success)', 'Completed'],
      failed: [AlertCircle, 'var(--color-error)', 'Failed'],
    }
    const [Icon, color, label] = map[record.status] || [Clock, 'var(--color-text-tertiary)', record.status]
    return (
      <span className="flex items-center gap-1 text-xs font-medium" style={{ color }}>
        <Icon size={12} className={record.status === 'running' ? 'animate-spin' : ''} /> {label}
      </span>
    )
  }

  return (
    <div>
      <h1 className="text-[28px] font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>Analysis</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-lg w-fit" style={{ background: 'var(--color-bg-secondary)' }}>
        <button
          onClick={() => setTab('run')}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          style={{
            background: tab === 'run' ? 'var(--color-bg)' : 'transparent',
            color: tab === 'run' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            boxShadow: tab === 'run' ? 'var(--shadow-sm)' : 'none',
          }}
        >
          <Play size={16} /> Run Analysis
        </button>
        <button
          onClick={() => { setTab('history'); loadRecords() }}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          style={{
            background: tab === 'history' ? 'var(--color-bg)' : 'transparent',
            color: tab === 'history' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            boxShadow: tab === 'history' ? 'var(--shadow-sm)' : 'none',
          }}
        >
          <FlaskConical size={16} /> History ({records.length})
        </button>
      </div>

      {tab === 'run' ? (
        <div className="space-y-6">
          {/* Step 1: Date selection */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--color-primary)' }}>Step 1 — Select Dates</p>
            <div className="flex flex-wrap gap-2">
              {dates.map(d => (
                <button
                  key={d.date}
                  onClick={() => toggleDate(d.date)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                  style={{
                    background: selectedDates.has(d.date) ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
                    color: selectedDates.has(d.date) ? 'white' : 'var(--color-text-secondary)',
                    border: `1px solid ${selectedDates.has(d.date) ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  }}
                >
                  {d.date} <span style={{ opacity: 0.7 }}>({d.content_count})</span>
                </button>
              ))}
              {!dates.length && <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>No data</p>}
            </div>
          </div>

          {/* Step 2: Content selection */}
          {selectedDates.size > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-primary)' }}>
                  Step 2 — Select Content <span style={{ color: 'var(--color-text-tertiary)', textTransform: 'none' }}>({selectedIds.size}/{contents.length} selected)</span>
                </p>
                <div className="flex gap-2">
                  <button onClick={selectAll} className="text-xs px-2 py-1 rounded" style={{ color: 'var(--color-primary)', background: 'var(--color-bg-secondary)' }}>Select All</button>
                  <button onClick={deselectAll} className="text-xs px-2 py-1 rounded" style={{ color: 'var(--color-text-tertiary)', background: 'var(--color-bg-secondary)' }}>Clear</button>
                </div>
              </div>
              {loadingContents ? (
                <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>
              ) : !contents.length ? (
                <p className="text-sm py-4" style={{ color: 'var(--color-text-tertiary)' }}>No content for selected dates</p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {contents.map(c => (
                    <div
                      key={c.id}
                      onClick={() => toggleItem(c.id)}
                      className="flex items-start gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors"
                      style={{
                        borderColor: selectedIds.has(c.id) ? 'var(--color-primary)' : 'var(--color-border)',
                        background: selectedIds.has(c.id) ? 'rgba(99,102,241,0.04)' : 'var(--color-bg)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(c.id)}
                        onChange={() => {}}
                        className="mt-1 accent-[var(--color-primary)]"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{c.title || '(untitled)'}</span>
                          {c.stance && (
                            <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: stanceColor[c.stance] + '20', color: stanceColor[c.stance] }}>
                              {c.stance} {c.score}/10
                            </span>
                          )}
                        </div>
                        {c.summary && <p className="text-xs truncate" style={{ color: 'var(--color-text-tertiary)' }}>{c.summary}</p>}
                        <div className="flex gap-3 mt-1 text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
                          <span>{c.source_type}</span>
                          {c.person_name && <span>{c.person_name}</span>}
                          <span>{new Date(c.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Prompt */}
          {selectedIds.size > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--color-primary)' }}>Step 3 — Analysis Prompt</p>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                rows={8}
                className="w-full px-3.5 py-3 rounded-md border text-sm outline-none font-mono resize-y"
                style={{ borderColor: 'var(--color-border)', lineHeight: 1.7 }}
              />
            </div>
          )}

          {/* Run button */}
          <button
            onClick={handleRun}
            disabled={running || !selectedIds.size}
            className="flex items-center gap-2 px-5 py-2.5 rounded-md text-white text-sm font-semibold transition-colors"
            style={{ background: (running || !selectedIds.size) ? 'var(--color-text-disabled)' : 'var(--color-primary)' }}
          >
            {running ? <><Loader2 size={16} className="animate-spin" /> Analyzing {selectedIds.size} items...</> : <><Play size={16} /> Analyze ({selectedIds.size} items)</>}
          </button>
        </div>
      ) : (
        /* History */
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>{records.length} records</p>
            <button onClick={loadRecords} className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-md" style={{ color: 'var(--color-text-secondary)', background: 'var(--color-bg-secondary)' }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {loadingRecords ? (
            <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>
          ) : !records.length ? (
            <div className="text-center py-12">
              <FlaskConical size={40} style={{ color: 'var(--color-text-tertiary)' }} className="mx-auto mb-3" />
              <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>No analysis records yet. Run your first analysis!</p>
            </div>
          ) : (
            records.map(record => (
              <div key={record.id} className="rounded-lg border" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex items-center justify-between px-4 py-3 cursor-pointer" onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}>
                  <div className="flex items-center gap-3 min-w-0">
                    {getStatusBadge(record)}
                    <span className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{record.title}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{new Date(record.created_at).toLocaleString()}</span>
                    {expandedId === record.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {expandedId === record.id && (
                  <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
                    <p className="text-xs pt-3" style={{ color: 'var(--color-text-tertiary)' }}>
                      {record.content_ids?.length || 0} items selected
                    </p>

                    <div>
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-tertiary)' }}>PROMPT</p>
                      <p className="text-sm whitespace-pre-wrap p-3 rounded-md" style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{record.prompt}</p>
                    </div>

                    {record.status === 'completed' && record.result && (
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-tertiary)' }}>RESULT</p>
                        <div className="text-sm whitespace-pre-wrap p-3 rounded-md max-h-[500px] overflow-y-auto" style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', lineHeight: 1.7 }}>
                          {record.result}
                        </div>
                      </div>
                    )}

                    {record.status === 'failed' && record.error_msg && (
                      <div className="p-3 rounded-md" style={{ background: 'rgba(239,68,68,0.06)' }}>
                        <p className="text-sm" style={{ color: 'var(--color-error)' }}>{record.error_msg}</p>
                      </div>
                    )}

                    {record.status === 'running' && (
                      <div className="flex items-center gap-2 py-4 justify-center">
                        <Loader2 size={20} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
                        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Analyzing... up to 2 minutes</span>
                      </div>
                    )}

                    <div className="flex justify-end pt-2">
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(record.id) }} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md" style={{ color: 'var(--color-error)', background: 'rgba(239,68,68,0.06)' }}>
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
