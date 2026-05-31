import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
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
  const location = useLocation()
  const { error, login, register, status, clearError } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [form, setForm] = useState<AuthForm>(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const nextFromQuery = new URLSearchParams(location.search).get('next')
  const nextFromState = (location.state as { from?: string } | null)?.from
  const redirectTarget = nextFromState || nextFromQuery || '/dashboard'

  useEffect(() => {
    if (status === 'authenticated') {
      navigate(redirectTarget, { replace: true })
    }
  }, [navigate, redirectTarget, status])

  if (status === 'authenticated') {
    return <Navigate to={redirectTarget} replace />
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

      navigate(redirectTarget, { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-root min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-4xl rounded-xl overflow-hidden border border-gray-200 shadow-sm grid md:grid-cols-2">

          {/* Left Panel */}
          <div className="hidden md:flex flex-col justify-between p-12 bg-gray-50 border-r border-gray-200">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div
                className="auth-serif w-9 h-9 rounded-lg flex items-center justify-center text-sm text-white"
                style={{ background: '#1a1a18', letterSpacing: '-0.5px' }}
              >
                IP
              </div>
              <span
                className="text-xs font-medium tracking-widest uppercase"
                style={{ color: '#888780' }}
              >
                Internship Portal
              </span>
            </div>

            {/* Hero */}
            <div className="flex-1 flex flex-col justify-center py-10">
              <h2
                className="auth-serif text-4xl leading-tight mb-4"
                style={{ color: '#1a1a18', fontWeight: 400 }}
              >
                Find your perfect{' '}
                <em style={{ color: '#888780' }}>internship</em>
                {' '}— faster.
              </h2>
              <p className="text-sm leading-relaxed max-w-xs" style={{ color: '#888780', fontWeight: 300 }}>
                AI-matched roles, one-click applications, and real-time tracking — built for students who mean business.
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-6">
              {[
                { num: '500+', label: 'Internships' },
                { num: '200+', label: 'Companies' },
                { num: 'AI', label: 'Matching' },
              ].map(({ num, label }) => (
                <div key={label} className="border-t pt-3" style={{ borderColor: '#d4d4ce' }}>
                  <div className="auth-serif text-2xl" style={{ color: '#1a1a18' }}>{num}</div>
                  <div className="text-xs uppercase tracking-widest mt-0.5 font-medium" style={{ color: '#aaa9a2' }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel - Form */}
          <div className="bg-white px-10 py-12 flex flex-col justify-center">
            {/* Tabs */}
            <div className="flex border-b mb-8" style={{ borderColor: '#e8e8e4' }}>
              <button
                type="button"
                onClick={() => { clearError(); setMode('login') }}
                className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => { clearError(); setMode('register') }}
                className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
              >
                Create account
              </button>
            </div>

            {/* Heading */}
            <h1 className="auth-serif text-3xl mb-1" style={{ color: '#1a1a18', fontWeight: 400 }}>
              {isRegister ? 'Get started' : 'Welcome back'}
            </h1>
            <p className="text-sm mb-7" style={{ color: '#888780', fontWeight: 300 }}>
              {isRegister
                ? 'Join as a student or company.'
                : 'Sign in to continue to your dashboard.'}
            </p>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Full Name */}
              {isRegister && (
                <div>
                  <label className="block text-xs font-medium tracking-widest uppercase mb-1.5" style={{ color: '#888780' }}>
                    Full name
                  </label>
                  <input
                    type="text"
                    placeholder="Jane Doe"
                    value={form.full_name}
                    onChange={(e) => updateField('full_name', e.target.value)}
                    required
                    className="auth-input"
                  />
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-xs font-medium tracking-widest uppercase mb-1.5" style={{ color: '#888780' }}>
                  Email address
                </label>
                <input
                  type="email"
                  placeholder="jane@example.com"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  required
                  className="auth-input"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium tracking-widest uppercase mb-1.5" style={{ color: '#888780' }}>
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  minLength={5}
                  required
                  className="auth-input"
                />
              </div>

              {/* Role Toggle */}
              {isRegister && (
                <div>
                  <label className="block text-xs font-medium tracking-widest uppercase mb-1.5" style={{ color: '#888780' }}>
                    I am a
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['student', 'company'] as const).map((r) => (
                      <div
                        key={r}
                        className={`role-opt ${form.role === r ? 'selected' : ''}`}
                        onClick={() => updateField('role', r)}
                      >
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div
                  className="text-sm rounded-md px-3 py-2.5"
                  style={{
                    color: '#a32d2d',
                    background: '#fcebeb',
                    border: '0.5px solid #f09595',
                  }}
                >
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 text-xs font-medium tracking-widest uppercase rounded-md transition-opacity disabled:opacity-50"
                style={{
                  background: '#1a1a18',
                  color: '#ffffff',
                  fontFamily: "'DM Sans', sans-serif",
                }}
                onMouseOver={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseOut={e => (e.currentTarget.style.opacity = '1')}
              >
                {submitting ? 'Processing…' : isRegister ? 'Create account' : 'Sign in'}
              </button>

              {/* Switch Mode */}
              <button
                type="button"
                onClick={() => { clearError(); setMode(mode === 'login' ? 'register' : 'login') }}
                className="w-full py-2.5 text-xs font-medium rounded-md transition-colors"
                style={{
                  background: 'none',
                  color: '#888780',
                  border: '0.5px solid #d4d4ce',
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: 'pointer',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.borderColor = '#1a1a18'
                  e.currentTarget.style.color = '#1a1a18'
                }}
                onMouseOut={e => {
                  e.currentTarget.style.borderColor = '#d4d4ce'
                  e.currentTarget.style.color = '#888780'
                }}
              >
                {isRegister ? 'Already have an account?' : "Don't have an account?"}
              </button>
            </form>
          </div>

        </div>
    </main>
  )
}