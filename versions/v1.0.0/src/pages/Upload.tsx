import { useState } from 'react'
import { uploadPdf, uploadUrl, getPeople } from '../api'
import { Upload as UploadIcon, Link, FileText } from 'lucide-react'

export default function Upload() {
  const [tab, setTab] = useState<'pdf' | 'url'>('pdf')
  const [url, setUrl] = useState('')
  const [personId, setPersonId] = useState('')
  const [people, setPeople] = useState<any[]>([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  useState(() => { getPeople().then(r => setPeople(r.data || r)) })

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setStatus('')
    try {
      await uploadPdf(file)
      setStatus('PDF uploaded and parsed successfully!')
    } catch (err: any) {
      setStatus(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatus('')
    try {
      await uploadUrl(url, personId ? Number(personId) : undefined)
      setStatus('URL content fetched successfully!')
      setUrl('')
    } catch (err: any) {
      setStatus(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-[28px] font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>Upload</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-lg w-fit" style={{ background: 'var(--color-bg-secondary)' }}>
        <button
          onClick={() => setTab('pdf')}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          style={{
            background: tab === 'pdf' ? 'var(--color-bg)' : 'transparent',
            color: tab === 'pdf' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            boxShadow: tab === 'pdf' ? 'var(--shadow-sm)' : 'none',
          }}
        >
          <FileText size={16} /> PDF
        </button>
        <button
          onClick={() => setTab('url')}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          style={{
            background: tab === 'url' ? 'var(--color-bg)' : 'transparent',
            color: tab === 'url' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            boxShadow: tab === 'url' ? 'var(--shadow-sm)' : 'none',
          }}
        >
          <Link size={16} /> URL
        </button>
      </div>

      {tab === 'pdf' ? (
        <div>
          <label
            className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-colors hover:border-[var(--color-primary)]"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <UploadIcon size={32} style={{ color: 'var(--color-text-tertiary)' }} />
            <p className="mt-3 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              Click to upload a PDF file
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>PDF files only</p>
            <input type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} />
          </label>
        </div>
      ) : (
        <form onSubmit={handleUrlSubmit} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>URL</label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com/article"
              className="w-full h-10 px-3.5 rounded-md border text-sm outline-none"
              style={{ borderColor: 'var(--color-border)' }}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Person (optional)</label>
            <select value={personId} onChange={e => setPersonId(e.target.value)}
              className="w-full h-10 px-3.5 rounded-md border text-sm outline-none" style={{ borderColor: 'var(--color-border)' }}>
              <option value="">No person</option>
              {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-md text-white text-sm font-semibold"
            style={{ background: loading ? 'var(--color-text-disabled)' : 'var(--color-primary)' }}
          >
            {loading ? 'Fetching...' : 'Fetch Content'}
          </button>
        </form>
      )}

      {status && (
        <p className="mt-4 text-sm" style={{ color: status.startsWith('Error') ? 'var(--color-error)' : 'var(--color-success)' }}>
          {status}
        </p>
      )}
    </div>
  )
}
