import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function formatDate(dateValue: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(dateValue))
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { accessToken, logout, refreshToken, status, user } = useAuth()

  useEffect(() => {
    if (status === 'anonymous') {
      navigate('/auth', { replace: true })
    }
  }, [navigate, status])

  if (!user) {
    return (
      <main className="dashboard-page">
        <div className="loading-stack">
          <p>Loading dashboard...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="dashboard-page">
      <div className="dashboard-grid">
        <header className="topbar dashboard-panel">
          <div className="brand-block">
            <p className="eyebrow">Signed in</p>
            <h1>{user.full_name}</h1>
            <p className="dashboard-subtitle">{user.email}</p>
          </div>

          <button type="button" className="logout-button" onClick={() => void logout()}>
            Log out
          </button>
        </header>

        <section className="metric-grid">
          <article className="metric-card">
            <p className="metric-label">Role</p>
            <div className="metric-value">
              <span className="role-pill">{user.role}</span>
            </div>
          </article>
          <article className="metric-card">
            <p className="metric-label">Joined</p>
            <div className="metric-value">{formatDate(user.date_joined)}</div>
          </article>
          <article className="metric-card">
            <p className="metric-label">Session</p>
            <div className="metric-value">JWT active</div>
          </article>
        </section>

        <section className="dashboard-panels">
          <article className="dashboard-panel">
            <div className="card-header">
              <div>
                <p className="section-label">Auth state</p>
                <h2>Protected session</h2>
              </div>
              <span className="status-pill">Online</span>
            </div>
          </article>

          <article className="dashboard-panel">
            <div className="card-header">
              <div>
                <p className="section-label">Backend link</p>
                <h2>Django API connection</h2>
              </div>
            </div>
            <div className="mini-grid" style={{ marginTop: '18px' }}>
              <article className="mini-card">
                <span className="mini-label">Access token</span>
                <div className="mini-value">{accessToken ? 'Loaded' : 'Missing'}</div>
              </article>
              <article className="mini-card">
                <span className="mini-label">Refresh token</span>
                <div className="mini-value">{refreshToken ? 'Loaded' : 'Missing'}</div>
              </article>
            </div>
          </article>
        </section>
      </div>
    </main>
  )
}