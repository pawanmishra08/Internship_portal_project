import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()

  const roleLabel = user?.role ? user.role.replace(/^(.)/, (value) => value.toUpperCase()) : 'Member'

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'student':
        return 'bg-blue-100 text-blue-800'
      case 'company':
        return 'bg-purple-100 text-purple-800'
      case 'admin':
        return 'bg-rose-100 text-rose-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between gap-6 px-6 py-4">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Welcome back</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                {user?.full_name.charAt(0).toUpperCase()}
              </div>
              <span className="font-semibold text-gray-900">{user?.full_name}</span>
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
