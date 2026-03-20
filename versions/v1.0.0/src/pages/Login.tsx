import { useState } from 'react'
import { Activity } from 'lucide-react'
import { login } from '../api'

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(username, password)
      localStorage.setItem('token', data.token)
      onLogin()
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg-secondary)' }}>
      <div className="w-[380px] bg-white rounded-xl p-8" style={{ boxShadow: 'var(--shadow-lg)' }}>
        <div className="flex items-center justify-center gap-3 mb-8">
          <Activity size={32} style={{ color: 'var(--color-primary)' }} />
          <span className="text-2xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>SignalScope</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full h-10 px-3.5 rounded-md border outline-none text-sm transition-colors"
              style={{ borderColor: error ? 'var(--color-error)' : 'var(--color-border)', color: 'var(--color-text-primary)' }}
              placeholder="Enter username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full h-10 px-3.5 rounded-md border outline-none text-sm transition-colors"
              style={{ borderColor: error ? 'var(--color-error)' : 'var(--color-border)', color: 'var(--color-text-primary)' }}
              placeholder="Enter password"
              required
            />
          </div>

          {error && (
            <p className="text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-md text-white font-semibold text-sm transition-colors"
            style={{ background: loading ? 'var(--color-text-disabled)' : 'var(--color-primary)' }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
