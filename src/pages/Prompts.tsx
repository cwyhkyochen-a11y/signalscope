import { useState, useEffect } from 'react'
import { getPrompts, createPrompt, updatePrompt, deletePrompt } from '../api'
import { Skeleton, EmptyState } from '../components/UI'
import { Plus, X, Pencil, Trash2, Star, MessageSquare } from 'lucide-react'

export default function Prompts() {
  const [prompts, setPrompts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', template: '' })

  const load = () => getPrompts().then(setPrompts).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) await updatePrompt(editing.id, form)
    else await createPrompt(form)
    setShowForm(false)
    setEditing(null)
    setForm({ name: '', template: '' })
    load()
  }

  const handleEdit = (p: any) => {
    setEditing(p)
    setForm({ name: p.name, template: p.template })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this prompt template?')) return
    await deletePrompt(id)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[28px] font-bold" style={{ color: 'var(--color-text-primary)' }}>Prompts</h1>
        <button
          onClick={() => { setEditing(null); setForm({ name: '', template: '' }); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-white font-semibold text-sm"
          style={{ background: 'var(--color-primary)' }}
        >
          <Plus size={16} /> Add Template
        </button>
      </div>

      {loading ? <Skeleton lines={5} /> : prompts.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No prompts yet"
          description="Create prompt templates to customize how AI analyzes signals."
          action={
            <button
              onClick={() => { setEditing(null); setForm({ name: '', description: '', template: '' }); setShowForm(true) }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-white text-xs font-medium"
              style={{ background: 'var(--color-primary)' }}
            >
              <Plus size={14} /> Add Prompt
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {prompts.map(p => (
            <div key={p.id} className="border rounded-xl p-5" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{p.name}</span>
                  {p.is_default ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                      <Star size={12} /> Default
                    </span>
                  ) : null}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(p)} className="p-1.5 rounded hover:bg-[var(--color-bg-tertiary)]">
                    <Pencil size={14} style={{ color: 'var(--color-text-tertiary)' }} />
                  </button>
                  {!p.is_default && (
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded hover:bg-[var(--color-bg-tertiary)]">
                      <Trash2 size={14} style={{ color: 'var(--color-error)' }} />
                    </button>
                  )}
                </div>
              </div>
              {p.description && (
                <p className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>{p.description}</p>
              )}
              <pre className="text-xs p-3 rounded-lg overflow-x-auto whitespace-pre-wrap" style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}>
                {p.template}
              </pre>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-xl w-[640px] p-6 max-h-[90vh] overflow-y-auto" style={{ boxShadow: 'var(--shadow-lg)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">{editing ? 'Edit Template' : 'Add Template'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-[var(--color-bg-tertiary)]">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Name</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                  className="w-full h-10 px-3.5 rounded-md border text-sm outline-none" style={{ borderColor: 'var(--color-border)' }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  Template <span style={{ color: 'var(--color-text-tertiary)' }}>— use {'{source_type}'}, {'{person_name}'}, {'{title}'}, {'{body}'} as placeholders</span>
                </label>
                <textarea value={form.template} onChange={e => setForm({ ...form, template: e.target.value })} required rows={10}
                  className="w-full px-3.5 py-2.5 rounded-md border text-sm outline-none resize-y font-mono" style={{ borderColor: 'var(--color-border)' }} />
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
