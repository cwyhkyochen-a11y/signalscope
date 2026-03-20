import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Clock, Users, Radio, ListTodo, Upload, Search, LogOut, Activity, MessageSquare, Settings as SettingsIcon, HelpCircle, FlaskConical } from 'lucide-react'

const items = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/timeline', label: 'Timeline', icon: Clock },
  { to: '/people', label: 'People', icon: Users },
  { to: '/sources', label: 'Sources', icon: Radio },
  { to: '/tasks', label: 'Tasks', icon: ListTodo },
  { to: '/upload', label: 'Upload', icon: Upload },
  { to: '/analysis', label: 'Analysis', icon: FlaskConical },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/prompts', label: 'Prompts', icon: MessageSquare },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
  { to: '/help', label: 'Help', icon: HelpCircle },
]

export default function Sidebar() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
    window.location.reload()
  }

  return (
    <aside
      className="w-[260px] h-screen flex flex-col border-r shrink-0"
      style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-light)' }}
    >
      <div className="p-5 flex items-center gap-3">
        <Activity size={24} style={{ color: 'var(--color-primary)' }} />
        <span className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>SignalScope</span>
      </div>

      <nav className="flex-1 px-2 py-2 space-y-1">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? ''
                  : 'hover:bg-[var(--color-bg-tertiary)]'
              }`
            }
            style={({ isActive }) =>
              isActive
                ? { background: 'var(--color-bg-tertiary)', borderLeft: '3px solid var(--color-primary)', color: 'var(--color-primary)' }
                : { color: 'var(--color-text-secondary)', borderLeft: '3px solid transparent' }
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm w-full px-3 py-2 rounded-lg transition-colors hover:bg-[var(--color-bg-tertiary)]"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <LogOut size={16} />
          Log out
        </button>
      </div>
    </aside>
  )
}
