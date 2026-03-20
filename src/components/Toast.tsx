import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

const ToastContext = createContext<{ toast: (message: string, type?: Toast['type']) => void }>({ toast: () => {} })

let _toast: (msg: string, type?: Toast['type']) => void = () => {}
export const globalToast = (message: string, type: Toast['type'] = 'info') => _toast(message, type)

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const toast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  _toast = toast

  const dismiss = (id: number) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map(t => (
          <div
            key={t.id}
            className="flex items-start gap-2 px-4 py-3 rounded-lg shadow-lg text-sm animate-[fadeIn_0.2s_ease]"
            style={{
              background: t.type === 'error' ? 'rgba(239,68,68,0.95)' : t.type === 'success' ? 'rgba(34,197,94,0.95)' : 'rgba(59,130,246,0.95)',
              color: 'white',
            }}
          >
            {t.type === 'error' ? <AlertCircle size={16} className="shrink-0 mt-0.5" /> : <CheckCircle2 size={16} className="shrink-0 mt-0.5" />}
            <span className="flex-1">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="shrink-0 opacity-70 hover:opacity-100"><X size={14} /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
