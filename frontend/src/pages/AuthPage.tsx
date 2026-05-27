import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

type Mode = 'login' | 'register'

type AuthForm = {
  full_name: string
  email: string
  password: string
  role: 'student' | 'company'
}

const emptyForm: AuthForm = {
  full_name: '',
  email: '',
  password: '',
  role: 'student',
}

export default function AuthPage() {
  const navigate = useNavigate()
  const { error, login, register, status, clearError } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [form, setForm] = useState<AuthForm>(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate, status])

  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />
  }

  const isRegister = mode === 'register'

  function updateField<K extends keyof AuthForm>(key: K, value: AuthForm[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    clearError()
    setSubmitting(true)

    try {
      if (isRegister) {
        await register({
          email: form.email,
          password: form.password,
          full_name: form.full_name,
          role: form.role,
        })
      } else {
        await login({
          email: form.email,
          password: form.password,
        })
      }

      navigate('/dashboard', { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-grid">
        <section className="hero-panel">
          <p className="eyebrow">Internship Portal</p>
          <h1>A clean portal for internships and placements.</h1>
          <p className="hero-copy">
            Sign in with JWT, create a student or company account, and keep your session
            synced with the Django backend.
          </p>

          <ul className="feature-list">
            <li>Email/password auth against the Django API</li>
            <li>Automatic access-token refresh on page reload</li>
            <li>Logout calls the backend blacklist endpoint</li>
          </ul>

          <div className="hero-stats">
            <article className="mini-card">
              <span className="mini-label">API</span>
              <div className="mini-value">/api/auth</div>
            </article>
            <article className="mini-card">
              <span className="mini-label">Roles</span>
              <div className="mini-value">Student / Company</div>
            </article>
            <article className="mini-card">
              <span className="mini-label">Tokens</span>
              <div className="mini-value">JWT + Refresh</div>
            </article>
          </div>
        </section>

        <section className="auth-card">
          <div className="auth-tabs">
            <button
              type="button"
              className={`tab-button ${mode === 'login' ? 'active' : ''}`}
              onClick={() => setMode('login')}
            >
              Sign in
            </button>
            <button
              type="button"
              className={`tab-button ${mode === 'register' ? 'active' : ''}`}
              onClick={() => setMode('register')}
            >
              Create account
            </button>
          </div>

          <h1>{isRegister ? 'Create your account' : 'Welcome back'}</h1>
          <p className="helper-text">
            {isRegister
              ? 'Register as a student or company. Admin accounts stay backend-only.'
              : 'Use the email and password from your Django user account.'}
          </p>

          <form className="form-grid" onSubmit={handleSubmit}>
            {isRegister && (
              <div className="field">
                <label htmlFor="full_name">Full name</label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  placeholder="Jane Doe"
                  value={form.full_name}
                  onChange={(event) => updateField('full_name', event.target.value)}
                  required
                />
              </div>
            )}

            <div className="field-grid">
              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="jane@company.com"
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(event) => updateField('password', event.target.value)}
                  minLength={8}
                  required
                />
              </div>
            </div>

            {isRegister && (
              <div className="field">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  name="role"
                  value={form.role}
                  onChange={(event) => updateField('role', event.target.value as 'student' | 'company')}
                  required
                >
                  <option value="student">Student</option>
                  <option value="company">Company</option>
                </select>
              </div>
            )}

            {error ? <div className="alert">{error}</div> : null}

            <div className="form-footer">
              <button type="submit" className="button" disabled={submitting}>
                {submitting ? 'Working...' : isRegister ? 'Create account' : 'Sign in'}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  clearError()
                  setMode((current) => (current === 'login' ? 'register' : 'login'))
                }}
              >
                {isRegister ? 'Have an account?' : 'Need an account?'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}