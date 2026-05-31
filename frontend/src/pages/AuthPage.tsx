import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import sitelogo from '../assets/sitelogo.png';

type Mode = 'login' | 'register';

type AuthForm = {
  full_name: string;
  email: string;
  password: string;
  role: 'student' | 'company'
};

const emptyForm: AuthForm = {
  full_name: '',
  email: '',
  password: '',
  role: 'student',
};

export default function AuthPage() {
  const navigate = useNavigate();
  const { error, login, register, status, clearError } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState<AuthForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate, status]);

  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />;
  }

  const isRegister = mode === 'register';

  function updateField<K extends keyof AuthForm>(key: K, value: AuthForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearError();
    setSubmitting(true);

    try {
      if (isRegister) {
        await register({
          email: form.email,
          password: form.password,
          full_name: form.full_name,
          role: form.role,
        });
      } else {
        await login({
          email: form.email,
          password: form.password,
        });
      }
      navigate('/dashboard', { replace: true });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');

        .auth-root {
          font-family: 'Inter', system-ui, sans-serif;
        }
        .auth-title {
          font-family: 'Space Grotesk', sans-serif;
        }
      `}</style>

      <main className="auth-root min-h-screen bg-gradient-to-br from-slate-950 via-zinc-900 to-black flex items-center justify-center p-6 overflow-hidden relative">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(139,92,246,0.12),transparent_50%)]" />

        <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center relative z-10">

          {/* Left Panel - Hero */}
          <div className="hidden md:flex flex-col justify-center p-12 relative">
            <div className="mb-12">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-3xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-3xl shadow-xl">
                  <img src={sitelogo} alt="Internify Logo" className="w-full h-full object-contain " />
                </div>
                <span className="text-2xl font-semibold tracking-tighter text-white">Internify</span>
              </div>
            </div>

            <div className="space-y-6">
              <h1 className="auth-title text-6xl md:text-7xl font-semibold leading-none tracking-tighter text-white">
                Land your<br />
                dream <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">internship</span>
              </h1>
              <p className="text-xl text-slate-400 max-w-md">
                AI-powered matching. Instant applications. Real opportunities.
              </p>
            </div>

            <div className="mt-16 grid grid-cols-3 gap-8">
              {[
                { value: "500+", label: "Live Roles" },
                { value: "180+", label: "Companies" },
                { value: "98%", label: "Match Rate" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-4xl font-semibold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-slate-500 tracking-widest uppercase">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel - Form */}
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl p-10 md:p-14 border border-white/20">
            {/* Tabs */}
            <div className="flex bg-zinc-100 rounded-2xl p-1 mb-10">
              <button
                type="button"
                onClick={() => { clearError(); setMode('login'); }}
                className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all ${
                  mode === 'login' 
                    ? 'bg-white shadow text-zinc-900' 
                    : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { clearError(); setMode('register'); }}
                className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all ${
                  mode === 'register'
                    ? 'bg-white shadow text-zinc-900'
                    : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                Create Account
              </button>
            </div>

            <h2 className="auth-title text-4xl tracking-tighter text-zinc-900 mb-2">
              {isRegister ? "Let's get you started" : "Welcome back"}
            </h2>
            <p className="text-zinc-600 mb-8">
              {isRegister
                ? "Join as student, company"
                : "Sign in to continue your journey"}
            </p>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {isRegister && (
                <div>
                  <label className="text-xs uppercase tracking-widest text-zinc-500 font-medium mb-1.5 block">Full Name</label>
                  <input
                    type="text"
                    placeholder="Alex Rivera"
                    value={form.full_name}
                    onChange={(e) => updateField('full_name', e.target.value)}
                    required
                    className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-base"
                  />
                </div>
              )}

              <div>
                <label className="text-xs uppercase tracking-widest text-zinc-500 font-medium mb-1.5 block">Email Address</label>
                <input
                  type="email"
                  placeholder="you@email.com"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  required
                  className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-base"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest text-zinc-500 font-medium mb-1.5 block">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  minLength={6}
                  required
                  className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-base"
                />
              </div>

              {isRegister && (
                <div>
                  <label className="text-xs uppercase tracking-widest text-zinc-500 font-medium mb-3 block">I am a</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['student', 'company'] as const).map((r) => (
                      <div
                        key={r}
                        onClick={() => updateField('role', r)}
                        className={`px-5 py-4 rounded-2xl border text-center font-medium cursor-pointer transition-all capitalize text-sm
                          ${form.role === r
                            ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                            : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'}`}
                      >
                        {r}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 text-red-600 border border-red-100 px-5 py-3.5 rounded-2xl text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-semibold rounded-2xl transition-all text-base tracking-wider disabled:opacity-70 mt-4 shadow-lg shadow-blue-500/30"
              >
                {submitting ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
              </button>

              <button
                type="button"
                onClick={() => { clearError(); setMode(isRegister ? 'login' : 'register'); }}
                className="w-full py-3 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
              >
                {isRegister ? "Already have an account? Sign in" : "Don't have an account? Create one"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}