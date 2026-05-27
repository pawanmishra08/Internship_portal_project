import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 20px',
      borderBottom: '1px solid var(--line)',
      background: 'transparent'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <strong style={{ fontSize: 18 }}>Internship Portal</strong>
        <span style={{ color: 'var(--muted)', fontSize: 13 }}>{user?.role ?? ''}</span>
      </div>
      <div>
        <button className="secondary-button" onClick={() => void logout()}>
          Sign out
        </button>
      </div>
    </header>
  )
}
