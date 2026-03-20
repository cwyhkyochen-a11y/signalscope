import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Timeline from './pages/Timeline'
import People from './pages/People'
import PeopleDetail from './pages/PeopleDetail'
import Sources from './pages/Sources'
import Tasks from './pages/Tasks'
import Upload from './pages/Upload'
import Search from './pages/Search'

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const location = useLocation()

  useEffect(() => {
    setToken(localStorage.getItem('token'))
  }, [location.pathname])

  if (!token || location.pathname === '/login') {
    return <Login onLogin={() => setToken(localStorage.getItem('token'))} />
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto" style={{ background: 'var(--color-bg)' }}>
        <div className="max-w-[1200px] mx-auto p-8">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/timeline/:date" element={<Timeline />} />
            <Route path="/people" element={<People />} />
            <Route path="/people/:id" element={<PeopleDetail />} />
            <Route path="/sources" element={<Sources />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/search" element={<Search />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default App
