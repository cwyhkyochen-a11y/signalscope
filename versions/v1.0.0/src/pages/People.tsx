import { useState, useEffect } from 'react'
import { getPeople, createPerson, updatePerson, deletePerson } from '../api'
import { Skeleton } from '../components/UI'
import { Plus, X, Pencil, Trash2, User } from 'lucide-react'

export default function People() {
  const [people, setPeople] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', bio: '', tags: '' })

  const load = () => getPeople().then(r => setPeople(r.data || r)).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      await updatePerson(editing.id, form)
    } else {
      await createPerson(form)
    }
    setShowForm(false)
    setEditing(null)
    setForm({ name: '', bio: '', tags: '' })
    load()
  }

  const handleEdit = (p: any) => {
    setEditing(p)
    setForm({ name: p.name, bio: p.bio || '', tags: p.tags || '' })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this person?')) return
    await deletePerson(id)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[28px] font-bold" style={{ color: 'var(--color-text-primary)' }}>People</h1>
        <button
          onClick={() => { setEditing(null); setForm({ name: '', bio: '', tags: '' }); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-white font-semibold text-sm"
          style={{ background: 'var(--color-primary)' }}
        >
          <Plus size={16} /> Add Person
        </button>
      </div>

      {loading ? <Skeleton lines={5} /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {people.map(p => (
            <div key={p.id} className="border rounded-xl p-5 transition-all hover:shadow-sm" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--color-bg-tertiary)' }}>
                    <User size={20} style={{ color: 'var(--color-text-tertiary)' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{p.name}</p>
                    {p.bio && <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{p.bio}</p>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(p)} className="p-1.5 rounded hover:bg-[var(--color-bg-tertiary)]">
                    <Pencil size={14} style={{ color: 'var(--color-text-tertiary)' }} />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded hover:bg-[var(--color-bg-tertiary)]">
                    <Trash2 size={14} style={{ color: 'var(--color-error)' }} />
                  </button>
                </div>
              </div>
              {p.tags && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {p.tags.split(',').map((t: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 rounded-full text-xs" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
                      {t.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-xl w-[480px] p-6" style={{ boxShadow: 'var(--shadow-lg)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {editing ? 'Edit Person' : 'Add Person'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-[var(--color-bg-tertiary)]">
                <X size={18} style={{ color: 'var(--color-text-tertiary)' }} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Name</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                  className="w-full h-10 px-3.5 rounded-md border text-sm outline-none" style={{ borderColor: 'var(--color-border)' }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Bio</label>
                <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} rows={3}
                  className="w-full px-3.5 py-2.5 rounded-md border text-sm outline-none resize-none" style={{ borderColor: 'var(--color-border)' }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Tags (comma separated)</label>
                <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-md border text-sm outline-none" style={{ borderColor: 'var(--color-border)' }}
                  placeholder="semiconductor, AI, chips" />
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
