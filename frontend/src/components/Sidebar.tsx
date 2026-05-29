import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const portalTitles: Record<string, string> = {
  student: 'Student Portal',
  company: 'Company Portal',
  admin: 'Admin Portal',
}

const navItems = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard', roles: ['student', 'company', 'admin'] },
  { to: '/internships', icon: '💼', label: 'Internships', roles: ['student', 'company', 'admin'] },
  { to: '/applications', icon: '📋', label: 'Applications', roles: ['student', 'company'] },
  { to: '/companies', icon: '🏢', label: 'Companies', roles: ['student', 'admin', 'company'] },
  { to: '/profile', icon: '👤', label: 'Profile', roles: ['student'] },
  { to: '/students', icon: '🎓', label: 'Students', roles: ['admin'] },
]

export default function Sidebar() {
  const { user } = useAuth()
  const title = user ? portalTitles[user.role] : 'Internship Portal'

  const visibleItems = navItems.filter((item) => !user || item.roles.includes(user.role))

  return (
    <aside className="w-72 min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 border-r border-gray-700 shadow-xl flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-xl flex items-center justify-center font-black text-lg text-white shadow-lg">
            IP
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Internship</h1>
            <p className="text-xs text-indigo-300 uppercase tracking-widest mt-1">{title}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/50'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700 mt-auto text-center">
        <p className="text-xs text-gray-500 uppercase tracking-widest">© 2026</p>
        <p className="text-xs text-gray-400 mt-1">Internship Portal</p>
      </div>
    </aside>
  )
}
