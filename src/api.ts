const BASE = (() => {
  // Auto-detect subpath prefix when deployed under a subdirectory (e.g. /signalscope/api)
  const path = window.location.pathname
  const match = path.match(/^(\/[^/]+)\//) // e.g. "/signalscope" from "/signalscope/login"
  if (match && match[1] !== '/login') return match[1] + '/api'
  return '/api'
})()

function getToken(): string | null {
  return localStorage.getItem('token')
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
    window.location.href = BASE.replace('/api', '/login')
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
export const getPersonDailySummaries = (id: number, days = 30) => request(`/people/${id}/daily-summaries?days=${days}`)

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
export async function uploadPdf(file: File, personId?: number) {
  const token = getToken()
  const form = new FormData()
  form.append('file', file)
  if (personId) form.append('person_id', String(personId))
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

export const deleteContent = (id: number) =>
  request(`/upload/${id}`, { method: 'DELETE' })

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

// Settings
export const getSettings = () => request('/settings')
export const updateSettings = (settings: Record<string, Record<string, string>>) =>
  request('/settings', { method: 'PUT', body: JSON.stringify({ settings }) })
export const getLlmConfig = () => request('/settings/llm')
export const getPlatformConfigs = () => request('/settings/platforms')

// Timeline dates
export const getTimelineDates = (days = 60) => request(`/signals/dates?days=${days}`)

// Analysis
export const getAnalysisRecords = (limit = 50, offset = 0) => request(`/analysis/records?limit=${limit}&offset=${offset}`)
export const getAnalysisRecord = (id: number) => request(`/analysis/records/${id}`)
export const deleteAnalysisRecord = (id: number) => request(`/analysis/records/${id}`, { method: 'DELETE' })
export const runAnalysis = (data: { content_ids: number[]; prompt: string }) =>
  request('/analysis/run', { method: 'POST', body: JSON.stringify(data) })
