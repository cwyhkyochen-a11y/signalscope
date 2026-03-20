import { useState, useEffect } from 'react'
import { getTasks, updateTask, runTask } from '../api'
import { Skeleton } from '../components/UI'
import { Play, Pause, PlayCircle } from 'lucide-react'

export default function Tasks() {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => getTasks().then(r => setTasks(r.data || r)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const toggleStatus = async (t: any) => {
    await updateTask(t.id, { status: t.status === 'active' ? 'paused' : 'active' })
    load()
  }

  const run = async (id: number) => {
    await runTask(id)
    load()
  }

  const statusColor = (s: string) => {
    if (s === 'active') return 'var(--color-success)'
    if (s === 'paused') return 'var(--color-warning)'
    return 'var(--color-error)'
  }

  return (
    <div>
      <h1 className="text-[28px] font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>Tasks</h1>

      {loading ? <Skeleton lines={5} /> : tasks.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>No tasks yet. Create a source to auto-generate tasks.</p>
      ) : (
        <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--color-bg-secondary)' }}>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-tertiary)' }}>ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-tertiary)' }}>Source</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-tertiary)' }}>Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-tertiary)' }}>Last Run</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-tertiary)' }}>Errors</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-tertiary)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t.id} className="border-t" style={{ borderColor: 'var(--color-border-light)' }}>
                  <td className="px-4 py-3">#{t.id}</td>
                  <td className="px-4 py-3">{t.source_type || t.source_id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full" style={{ background: statusColor(t.status) }} />
                      <span className="capitalize">{t.status}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>
                    {t.last_run_at ? new Date(t.last_run_at).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-4 py-3">
                    {t.error_count > 0 ? (
                      <span style={{ color: 'var(--color-error)' }}>{t.error_count}</span>
                    ) : (
                      <span style={{ color: 'var(--color-text-tertiary)' }}>0</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => run(t.id)} className="p-1.5 rounded hover:bg-[var(--color-bg-tertiary)]" title="Run now">
                        <PlayCircle size={14} style={{ color: 'var(--color-text-tertiary)' }} />
                      </button>
                      <button onClick={() => toggleStatus(t)} className="p-1.5 rounded hover:bg-[var(--color-bg-tertiary)]" title={t.status === 'active' ? 'Pause' : 'Resume'}>
                        {t.status === 'active' ? <Pause size={14} style={{ color: 'var(--color-warning)' }} /> : <Play size={14} style={{ color: 'var(--color-success)' }} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
