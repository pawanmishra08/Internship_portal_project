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
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Panel - Hero */}
          <div className="hidden md:flex flex-col justify-center">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-2xl flex items-center justify-center font-bold text-2xl text-white">
                IP
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Internship</h3>
                <p className="text-sm text-indigo-600 font-semibold">Portal</p>
              </div>
            </div>

            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Land Your Dream Internship
            </h2>

            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Connect with leading companies, apply to internships, and build your career. Student-first platform designed for success.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 text-xl">✓</div>
                <div>
                  <p className="font-semibold text-gray-900">Secure Authentication</p>
                  <p className="text-sm text-gray-600">JWT-based with automatic token refresh</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 text-xl">✓</div>
                <div>
                  <p className="font-semibold text-gray-900">Role-Based Access</p>
                  <p className="text-sm text-gray-600">Tailored experience for students, companies & admins</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 text-xl">✓</div>
                <div>
                  <p className="font-semibold text-gray-900">Smart Matching</p>
                  <p className="text-sm text-gray-600">AI-powered job recommendations</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Form */}
          <div className="card shadow-2xl p-8 lg:p-10">
            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-gray-200">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`pb-3 px-2 font-semibold transition-all border-b-2 ${
                  mode === 'login'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`pb-3 px-2 font-semibold transition-all border-b-2 ${
                  mode === 'register'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Create Account
              </button>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isRegister ? 'Get started' : 'Welcome back'}
            </h1>
            <p className="text-gray-600 mb-8">
              {isRegister
                ? 'Join as a student or company to get started'
                : 'Sign in to your account to continue'}
            </p>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {isRegister && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Full Name</label>
                  <input
                    type="text"
                    placeholder="Jane Doe"
                    value={form.full_name}
                    onChange={(e) => updateField('full_name', e.target.value)}
                    required
                    className="input-field"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Email Address</label>
                <input
                  type="email"
                  placeholder="jane@example.com"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  minLength={5}
                  required
                  className="input-field"
                />
              </div>

              {isRegister && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">I am a...</label>
                  <select
                    value={form.role}
                    onChange={(e) => updateField('role', e.target.value as 'student' | 'company')}
                    className="input-field"
                  >
                    <option value="student">Student</option>
                    <option value="company">Company</option>
                  </select>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary w-full"
              >
                {submitting ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In'}
              </button>

              <button
                type="button"
                onClick={() => {
                  clearError()
                  setMode(mode === 'login' ? 'register' : 'login')
                }}
                className="btn btn-secondary w-full"
              >
                {isRegister ? 'Already have an account?' : "Don't have an account?"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}