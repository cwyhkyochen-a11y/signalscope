// Auto-detect deployment sub-path (e.g. /signalscope when deployed under a sub-path)
function getBase(): string {
  const path = window.location.pathname
  if (path.startsWith('/signalscope/')) {
    return '/signalscope/api'
  }
  return '/api'
}

const BASE = getBase()

function getToken(): string | null {
  return localStorage.getItem('token')
}

function getLoginPath(): string {
  const path = window.location.pathname
  if (path.startsWith('/signalscope/')) {
    return '/signalscope/login'
  }
  return '/login'
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  if (res.status === 401) {
    localStorage.removeItem('token')
    window.location.href = getLoginPath()
    throw new Error('Unauthorized')
  }
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

// Auth
export const login = (username: string, password: string) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) })
export const getMe = () => request('/auth/me')

// People
export const getPeople = () => request('/people')
export const createPerson = (data: any) => request('/people', { method: 'POST', body: JSON.stringify(data) })
export const updatePerson = (id: number, data: any) => request(`/people/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deletePerson = (id: number) => request(`/people/${id}`, { method: 'DELETE' })
export const getPersonContents = (id: number, params?: Record<string, string>) => {
  const qs = params ? '?' + new URLSearchParams(params).toString() : ''
  return request(`/people/${id}/contents${qs}`)
}
export const getPersonSignals = (id: number) => request(`/people/${id}/signals`)

// Sources
export const getSources = () => request('/sources')
export const createSource = (data: any) => request('/sources', { method: 'POST', body: JSON.stringify(data) })
export const updateSource = (id: number, data: any) => request(`/sources/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteSource = (id: number) => request(`/sources/${id}`, { method: 'DELETE' })
export const syncSource = (id: number) => request(`/sources/${id}/sync`, { method: 'POST' })

// Tasks
export const getTasks = () => request('/tasks')
export const updateTask = (id: number, data: any) => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const runTask = (id: number) => request(`/tasks/${id}/run`, { method: 'POST' })

// Contents
export const getContents = (params?: Record<string, string>) => {
  const qs = params ? '?' + new URLSearchParams(params).toString() : ''
  return request(`/contents${qs}`)
}
export const getContent = (id: number) => request(`/contents/${id}`)
export const reanalyzeContent = (id: number) => request(`/contents/${id}/reanalyze`, { method: 'POST' })

// Signals
export const getSignals = (params?: Record<string, string>) => {
  const qs = params ? '?' + new URLSearchParams(params).toString() : ''
  return request(`/signals${qs}`)
}
export const getDailySummary = (date: string) => request(`/signals/daily-summary?date=${date}`)

// Upload
export async function uploadPdf(file: File) {
  const token = getToken()
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE}/upload/pdf`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Upload failed')
  return data
}

export const uploadUrl = (url: string, personId?: number) =>
  request('/upload/url', { method: 'POST', body: JSON.stringify({ url, person_id: personId }) })

// Prompts
export const getPrompts = () => request('/prompts')
export const createPrompt = (data: any) => request('/prompts', { method: 'POST', body: JSON.stringify(data) })
export const updatePrompt = (id: number, data: any) => request(`/prompts/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deletePrompt = (id: number) => request(`/prompts/${id}`, { method: 'DELETE' })

// Dashboard
export const getDashboard = () => request('/dashboard')

// Search
export const search = (params: Record<string, string>) => {
  const qs = '?' + new URLSearchParams(params).toString()
  return request(`/search${qs}`)
}
