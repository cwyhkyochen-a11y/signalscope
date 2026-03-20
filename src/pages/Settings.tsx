import { useState, useEffect } from 'react'
import { getSettings, updateSettings } from '../api'
import { Skeleton } from '../components/UI'
import { Save, Eye, EyeOff, Check, AlertCircle, Brain, Bird, Play } from 'lucide-react'

interface SettingsGroup {
  [category: string]: { [key: string]: string }
}

const CATEGORIES = [
  {
    id: 'llm',
    label: 'LLM (大模型)',
    icon: Brain,
    fields: [
      { key: 'base_url', label: 'Base URL', type: 'text', placeholder: 'https://api.openai.com/v1' },
      { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'sk-xxxxx' },
      { key: 'model_name', label: 'Model Name', type: 'text', placeholder: 'gpt-4o-mini' },
    ],
  },
  {
    id: 'twitter',
    label: 'Twitter',
    icon: Bird,
    fields: [
      { key: 'bearer_token', label: 'Bearer Token', type: 'password', placeholder: 'AAAAAAAAAAAAAAAA...' },
    ],
  },
  {
    id: 'youtube',
    label: 'YouTube',
    icon: Play,
    fields: [
      { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'AIza...' },
    ],
  },
]

export default function Settings() {
  const [settings, setSettings] = useState<SettingsGroup>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})

  useEffect(() => {
    getSettings()
      .then(data => setSettings(data))
      .catch(() => setError('Failed to load settings'))
      .finally(() => setLoading(false))
  }, [])

  const getValue = (category: string, key: string) => {
    return settings[category]?.[key] || ''
  }

  const setValue = (category: string, key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [category]: { ...(prev[category] || {}), [key]: value },
    }))
    setSaved(false)
    setError('')
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      await updateSettings(settings)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: any) {
      setError(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const toggleShow = (fieldId: string) => {
    setShowPasswords(prev => ({ ...prev, [fieldId]: !prev[fieldId] }))
  }

  if (loading) return <Skeleton lines={8} />

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>Settings</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
          style={{
            background: saved ? 'var(--signal-bullish)' : 'var(--color-primary)',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saved ? <Check size={16} /> : <Save size={16} />}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save All'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--signal-bearish)' }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="space-y-8">
        {CATEGORIES.map(cat => (
          <div key={cat.id} className="border rounded-lg p-6" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}>
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
              <cat.icon size={18} style={{ color: 'var(--color-primary)' }} />
              {cat.label}
            </h2>

            <div className="space-y-4">
              {cat.fields.map(field => {
                const fieldId = `${cat.id}.${field.key}`
                const value = getValue(cat.id, field.key)
                const isPassword = field.type === 'password'
                const showThis = showPasswords[fieldId]

                return (
                  <div key={field.key}>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-tertiary)' }}>
                      {field.label}
                    </label>
                    <div className="relative">
                      <input
                        type={isPassword && !showThis ? 'password' : 'text'}
                        value={value}
                        onChange={e => setValue(cat.id, field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full px-3 py-2 rounded-lg text-sm border outline-none transition-colors"
                        style={{
                          background: 'var(--color-bg-secondary)',
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-text-primary)',
                        }}
                        onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                        onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                      />
                      {isPassword && (
                        <button
                          type="button"
                          onClick={() => toggleShow(fieldId)}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                          style={{ color: 'var(--color-text-tertiary)' }}
                        >
                          {showThis ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs mt-6" style={{ color: 'var(--color-text-tertiary)' }}>
        Changes are saved to the server and take effect immediately for new analysis tasks.
      </p>
    </div>
  )
}
