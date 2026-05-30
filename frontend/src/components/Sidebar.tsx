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
    <aside className="w-72 min-h-screen border-r shadow-xl flex flex-col" style={{ background: '#1f1f1c', borderColor: '#353530' }}>
      {/* Logo Section */}
      <div className="p-6 border-b" style={{ borderColor: '#353530' }}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center font-black text-lg text-white shadow-lg" style={{ background: '#f0efe9', color: '#1a1a18', fontFamily: "'DM Serif Display', serif" }}>
            IP
          </div>
          <div>
            <h1 className="text-xl text-white" style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400 }}>Internship</h1>
            <p className="text-xs uppercase tracking-widest mt-1" style={{ color: '#aaa9a2' }}>{title}</p>
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
                  ? 'text-white shadow-lg'
                  : 'text-gray-300 hover:text-white'
              }`
            }
            style={({ isActive }) =>
              isActive
                ? { background: '#2b2b27', boxShadow: '0 10px 25px rgba(0,0,0,0.25)' }
                : { background: 'transparent' }
            }
          >
            <span className="text-lg">
              {(() => {
                switch (item.label) {
                  case 'Dashboard':
                    return (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 20V10M12 20V6M18 20V14" />
                      </svg>
                    )
                  case 'Internships':
                    return (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    )
                  case 'Applications':
                    return (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 16h6M7 7h10v11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V7z" />
                      </svg>
                    )
                  case 'Companies':
                    return (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21V7a2 2 0 0 1 2-2h14v16H3z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21V10h10v11" />
                      </svg>
                    )
                  case 'Profile':
                    return (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 20a6 6 0 0 1 12 0" />
                      </svg>
                    )
                  case 'Students':
                    return (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l8 4-8 4-8-4 8-4z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6" />
                      </svg>
                    )
                  default:
                    return null
                }
              })()}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t mt-auto text-center" style={{ borderColor: '#353530' }}>
        <p className="text-xs uppercase tracking-widest" style={{ color: '#77766f' }}>© 2026</p>
        <p className="text-xs mt-1" style={{ color: '#aaa9a2' }}>Internship Portal</p>
      </div>
    </aside>
  )
}
