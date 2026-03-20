import { useState, useEffect } from 'react'
import { uploadPdf, uploadUrl, getPeople } from '../api'
import { Upload as UploadIcon, Link, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

type UploadState = 'idle' | 'uploading' | 'extracting' | 'cleaning' | 'analyzing' | 'done' | 'error'

const STEPS: { state: UploadState; label: string }[] = [
  { state: 'uploading', label: 'Uploading file...' },
  { state: 'extracting', label: 'Extracting text...' },
  { state: 'cleaning', label: 'AI cleaning text...' },
  { state: 'analyzing', label: 'Analyzing signal...' },
  { state: 'done', label: 'Complete!' },
]

export default function Upload() {
  const [tab, setTab] = useState<'pdf' | 'url'>('pdf')
  const [url, setUrl] = useState('')
  const [personId, setPersonId] = useState('')
  const [people, setPeople] = useState<any[]>([])
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [fileName, setFileName] = useState('')

  useEffect(() => { getPeople().then(r => setPeople(r.data || r)) }, [])

  const getCurrentStepIndex = () => STEPS.findIndex(s => s.state === uploadState)

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!personId) { setUploadState('error'); setErrorMsg('Please select a person before uploading.'); return }
    setFileName(file.name)
    setUploadState('uploading')
    setErrorMsg('')

    try {
      // Simulate progress stages since backend is synchronous
      setUploadState('extracting')
      await new Promise(r => setTimeout(r, 300))

      setUploadState('cleaning')
      await uploadPdf(file, Number(personId))

      setUploadState('analyzing')
      await new Promise(r => setTimeout(r, 500))

      setUploadState('done')
    } catch (err: any) {
      setUploadState('error')
      setErrorMsg(err.message || 'Upload failed')
    }
    // Reset file input
    e.target.value = ''
  }

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!personId) { setUploadState('error'); setErrorMsg('Please select a person.'); return }
    setFileName(url)
    setUploadState('uploading')
    setErrorMsg('')

    try {
      setUploadState('extracting')
      await new Promise(r => setTimeout(r, 200))

      setUploadState('cleaning')
      await uploadUrl(url, Number(personId))

      setUploadState('analyzing')
      await new Promise(r => setTimeout(r, 500))

      setUploadState('done')
      setUrl('')
    } catch (err: any) {
      setUploadState('error')
      setErrorMsg(err.message || 'Failed to fetch URL')
    }
  }

  const isLoading = ['uploading', 'extracting', 'cleaning', 'analyzing'].includes(uploadState)
  const currentStep = getCurrentStepIndex()

  return (
    <div>
      <h1 className="text-[28px] font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>Upload</h1>

      {/* Example */}
      <div className="mb-6 rounded-lg border px-4 py-3.5" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-secondary)' }}>
        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--color-primary)' }}>Example</p>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          You subscribed to SemiAnalysis and found a deep dive by Dylan Patel. <strong style={{ color: 'var(--color-text-primary)' }}>PDF tab</strong> — download the article PDF and upload it here. <strong style={{ color: 'var(--color-text-primary)' }}>URL tab</strong> — paste the article link. Both ways: pick the person, system extracts text and analyzes his stance.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-lg w-fit" style={{ background: 'var(--color-bg-secondary)' }}>
        <button
          onClick={() => { setTab('pdf'); setUploadState('idle'); setErrorMsg('') }}
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
          onClick={() => { setTab('url'); setUploadState('idle'); setErrorMsg('') }}
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
        <div className="max-w-lg space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Person <span style={{ color: 'var(--color-error)' }}>*</span></label>
            <select value={personId} onChange={e => setPersonId(e.target.value)}
              className="w-full h-10 px-3.5 rounded-md border text-sm outline-none" style={{ borderColor: 'var(--color-border)' }} required>
              <option value="">Select person...</option>
              {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <label
            className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl transition-colors ${isLoading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-[var(--color-primary)]'}`}
            style={{ borderColor: 'var(--color-border)' }}
          >
            <UploadIcon size={32} style={{ color: 'var(--color-text-tertiary)' }} />
            <p className="mt-3 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              {isLoading ? 'Processing...' : 'Click to upload a PDF file'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>PDF files only</p>
            <input type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} disabled={isLoading} />
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
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Person <span style={{ color: 'var(--color-error)' }}>*</span></label>
            <select value={personId} onChange={e => setPersonId(e.target.value)}
              className="w-full h-10 px-3.5 rounded-md border text-sm outline-none" style={{ borderColor: 'var(--color-border)' }} required disabled={isLoading}>
              <option value="">Select person...</option>
              {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 rounded-md text-white text-sm font-semibold transition-colors"
            style={{ background: isLoading ? 'var(--color-text-disabled)' : 'var(--color-primary)' }}
          >
            {isLoading ? 'Processing...' : 'Fetch Content'}
          </button>
        </form>
      )}

      {/* Progress bar */}
      {isLoading && (
        <div className="mt-6 max-w-lg rounded-lg border px-4 py-4" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-secondary)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Loader2 size={16} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {STEPS.find(s => s.state === uploadState)?.label}
            </p>
          </div>
          {fileName && (
            <p className="text-xs mb-3 truncate" style={{ color: 'var(--color-text-tertiary)' }}>{fileName}</p>
          )}
          <div className="flex gap-1.5">
            {STEPS.slice(0, -1).map((step, i) => (
              <div key={step.state} className="flex-1">
                <div className="h-1.5 rounded-full transition-all duration-500" style={{
                  background: i <= currentStep ? 'var(--color-primary)' : 'var(--color-border)',
                }} />
                <p className="text-[10px] mt-1" style={{
                  color: i <= currentStep ? 'var(--color-primary)' : 'var(--color-text-tertiary)',
                }}>{step.label.replace('...', '')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success */}
      {uploadState === 'done' && (
        <div className="mt-4 flex items-center gap-2 text-sm max-w-lg rounded-lg border px-4 py-3" style={{ borderColor: 'var(--color-success)', background: 'rgba(34,197,94,0.06)' }}>
          <CheckCircle2 size={16} style={{ color: 'var(--color-success)' }} />
          <span style={{ color: 'var(--color-success)' }}>Upload complete! Content saved and signal analyzed.</span>
        </div>
      )}

      {/* Error */}
      {uploadState === 'error' && (
        <div className="mt-4 flex items-center gap-2 text-sm max-w-lg rounded-lg border px-4 py-3" style={{ borderColor: 'var(--color-error)', background: 'rgba(239,68,68,0.06)' }}>
          <AlertCircle size={16} style={{ color: 'var(--color-error)' }} />
          <span style={{ color: 'var(--color-error)' }}>{errorMsg}</span>
        </div>
      )}
    </div>
  )
}
