import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()

  const roleLabel = user?.role ? user.role.replace(/^(.)/, (value) => value.toUpperCase()) : 'Member'

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'student':
        return 'bg-[#f0efe9] text-[#1a1a18]'
      case 'company':
        return 'bg-[#ecebe6] text-[#1a1a18]'
      case 'admin':
        return 'bg-[#e8e7e1] text-[#1a1a18]'
      default:
        return 'bg-[#f0efe9] text-[#1a1a18]'
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b shadow-sm" style={{ borderColor: '#d4d4ce' }}>
      <div className="flex items-center justify-between gap-6 px-6 py-4">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-[0.2em]" style={{ color: '#aaa9a2' }}>Welcome back</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-3">
              {user?.full_name && (
                <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold text-sm">
                  {(() => {
                    const parts = user.full_name.trim().split(/\s+/)
                    const first = parts[0]?.charAt(0) ?? ''
                    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : ''
                    return (first + last).toUpperCase()
                  })()}
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-medium" style={{ color: '#1a1a18' }}>{user?.full_name}</span>
                {user?.role === 'student' && (
                  <a href="/profile" className="text-xs mt-0.5" style={{ color: '#888780' }}>Complete your profile →</a>
                )}
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${getRoleBadgeColor(user?.role)}`}>
              {roleLabel}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void logout()}
          className="btn btn-secondary"
        >
          Log out
        </button>
      </div>
    </header>
  )
}
