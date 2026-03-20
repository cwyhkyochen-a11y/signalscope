import { useState, useEffect } from 'react'
import { getSources, createSource, updateSource, deleteSource, syncSource, getPeople } from '../api'
import { Skeleton } from '../components/UI'
import { Plus, X, Pencil, Trash2, RefreshCw } from 'lucide-react'

const SOURCE_TYPES = [
  { value: 'substack_rss', label: 'Substack RSS', fields: [{ key: 'feed_url', label: 'Feed URL', placeholder: 'https://newsletter.xxx.com/feed' }] },
  { value: 'twitter', label: 'Twitter', fields: [{ key: 'username', label: 'Username', placeholder: 'daborm' }] },
  { value: 'reddit_rss', label: 'Reddit RSS', fields: [{ key: 'subreddit', label: 'Subreddit', placeholder: 'SemiAnalysis' }] },
]

const INTERVALS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 240, label: '4 hours' },
]

export default function Sources() {
  const [sources, setSources] = useState<any[]>([])
  const [people, setPeople] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ type: 'substack_rss', person_id: '', config: {} as Record<string, string>, poll_interval_min: 30 })

  const load = () => Promise.all([getSources(), getPeople()]).then(([s, p]) => {
    setSources(s.data || s)
    setPeople(p.data || p)
  }).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const currentType = SOURCE_TYPES.find(t => t.value === form.type)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = { ...form, person_id: Number(form.person_id) }
    if (editing) await updateSource(editing.id, data)
    else await createSource(data)
    setShowForm(false)
    setEditing(null)
    setForm({ type: 'substack_rss', person_id: '', config: {}, poll_interval_min: 30 })
    load()
  }

  const handleEdit = (s: any) => {
    setEditing(s)
    setForm({ type: s.type, person_id: String(s.person_id), config: JSON.parse(s.config || '{}'), poll_interval_min: s.poll_interval_min })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this source?')) return
    await deleteSource(id)
    load()
  }

  const handleSync = async (id: number) => {
    await syncSource(id)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[28px] font-bold" style={{ color: 'var(--color-text-primary)' }}>Sources</h1>
        <button
          onClick={() => { setEditing(null); setForm({ type: 'substack_rss', person_id: '', config: {}, poll_interval_min: 30 }); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-white font-semibold text-sm"
          style={{ background: 'var(--color-primary)' }}
        >
          <Plus size={16} /> Add Source
        </button>
      </div>

      {loading ? <Skeleton lines={5} /> : sources.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>No sources configured yet.</p>
      ) : (
        <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--color-bg-secondary)' }}>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-tertiary)' }}>Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-tertiary)' }}>Config</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-tertiary)' }}>Person</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-tertiary)' }}>Interval</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-tertiary)' }}>Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-tertiary)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sources.map(s => {
                const cfg = JSON.parse(s.config || '{}')
                const person = people.find(p => p.id === s.person_id)
                return (
                  <tr key={s.id} className="border-t" style={{ borderColor: 'var(--color-border-light)' }}>
                    <td className="px-4 py-3 font-medium">{s.type}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>
                      {Object.values(cfg)[0] as string || '-'}
                    </td>
                    <td className="px-4 py-3">{person?.name || '-'}</td>
                    <td className="px-4 py-3">{s.poll_interval_min} min</td>
                    <td className="px-4 py-3">
                      <span className="inline-block w-2 h-2 rounded-full" style={{ background: s.is_active ? 'var(--color-success)' : 'var(--color-text-disabled)' }} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => handleSync(s.id)} className="p-1.5 rounded hover:bg-[var(--color-bg-tertiary)]" title="Sync now">
                          <RefreshCw size={14} style={{ color: 'var(--color-text-tertiary)' }} />
                        </button>
                        <button onClick={() => handleEdit(s)} className="p-1.5 rounded hover:bg-[var(--color-bg-tertiary)]">
                          <Pencil size={14} style={{ color: 'var(--color-text-tertiary)' }} />
                        </button>
                        <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded hover:bg-[var(--color-bg-tertiary)]">
                          <Trash2 size={14} style={{ color: 'var(--color-error)' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-xl w-[480px] p-6" style={{ boxShadow: 'var(--shadow-lg)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">{editing ? 'Edit Source' : 'Add Source'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-[var(--color-bg-tertiary)]">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value, config: {} })}
                  className="w-full h-10 px-3.5 rounded-md border text-sm outline-none" style={{ borderColor: 'var(--color-border)' }}>
                  {SOURCE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              {currentType?.fields.map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>{f.label}</label>
                  <input value={form.config[f.key] || ''} onChange={e => setForm({ ...form, config: { ...form.config, [f.key]: e.target.value } })}
                    className="w-full h-10 px-3.5 rounded-md border text-sm outline-none" style={{ borderColor: 'var(--color-border)' }}
                    placeholder={f.placeholder} required />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Person</label>
                <select value={form.person_id} onChange={e => setForm({ ...form, person_id: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-md border text-sm outline-none" style={{ borderColor: 'var(--color-border)' }} required>
                  <option value="">Select person...</option>
                  {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Poll Interval</label>
                <select value={form.poll_interval_min} onChange={e => setForm({ ...form, poll_interval_min: Number(e.target.value) })}
                  className="w-full h-10 px-3.5 rounded-md border text-sm outline-none" style={{ borderColor: 'var(--color-border)' }}>
                  {INTERVALS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-md text-sm border" style={{ borderColor: 'var(--color-border)' }}>Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-md text-white text-sm font-semibold" style={{ background: 'var(--color-primary)' }}>
                  {editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
