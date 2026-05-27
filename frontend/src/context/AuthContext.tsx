import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  getCurrentUser,
  login,
  logoutSession,
  refreshAccessToken,
  register,
} from '../api/auth'
import type { AuthCredentials, AuthSession, AuthUser, RegisterPayload } from '../types/auth'

type AuthStatus = 'loading' | 'anonymous' | 'authenticated'

interface AuthContextValue {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  status: AuthStatus
  error: string | null
  login: (payload: AuthCredentials) => Promise<AuthUser>
  register: (payload: RegisterPayload) => Promise<AuthUser>
  logout: () => Promise<void>
  clearError: () => void
}

const ACCESS_KEY = 'internship-portal.access-token'
const REFRESH_KEY = 'internship-portal.refresh-token'
const USER_KEY = 'internship-portal.user'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong while communicating with the authentication server.'
}

function persistSession(session: AuthSession) {
  localStorage.setItem(ACCESS_KEY, session.access)
  localStorage.setItem(REFRESH_KEY, session.refresh)
  localStorage.setItem(USER_KEY, JSON.stringify(session.user))
}

function clearStoredSession() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(USER_KEY)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function restoreSession() {
      const storedAccess = localStorage.getItem(ACCESS_KEY)
      const storedRefresh = localStorage.getItem(REFRESH_KEY)
      const storedUser = localStorage.getItem(USER_KEY)

      if (!storedAccess || !storedRefresh) {
        if (active) {
          setStatus('anonymous')
        }

        return
      }

      const fallbackUser = storedUser ? (JSON.parse(storedUser) as AuthUser) : null

      try {
        const currentUser = await getCurrentUser(storedAccess)

        if (!active) {
          return
        }

        setUser(currentUser)
        setAccessToken(storedAccess)
        setRefreshToken(storedRefresh)
        setStatus('authenticated')
      } catch {
        try {
          const refreshed = await refreshAccessToken(storedRefresh)
          const currentUser = await getCurrentUser(refreshed.access)

          if (!active) {
            return
          }

          persistSession({
            access: refreshed.access,
            refresh: storedRefresh,
            user: currentUser,
          })
          setUser(currentUser)
          setAccessToken(refreshed.access)
          setRefreshToken(storedRefresh)
          setStatus('authenticated')
        } catch {
          if (!active) {
            return
          }

          clearStoredSession()
          setUser(fallbackUser)
          setAccessToken(null)
          setRefreshToken(null)
          setStatus('anonymous')
        }
      }
    }

    void restoreSession()

    return () => {
      active = false
    }
  }, [])

  const commitSession = (session: AuthSession) => {
    persistSession(session)
    setUser(session.user)
    setAccessToken(session.access)
    setRefreshToken(session.refresh)
    setStatus('authenticated')
    setError(null)
    return session.user
  }

  const handleLogin = async (payload: AuthCredentials) => {
    try {
      return commitSession(await login(payload))
    } catch (error) {
      const message = normalizeError(error)
      setError(message)
      throw new Error(message)
    }
  }

  const handleRegister = async (payload: RegisterPayload) => {
    try {
      return commitSession(await register(payload))
    } catch (error) {
      const message = normalizeError(error)
      setError(message)
      throw new Error(message)
    }
  }

  const handleLogout = async () => {
    const storedAccess = accessToken ?? localStorage.getItem(ACCESS_KEY)
    const storedRefresh = refreshToken ?? localStorage.getItem(REFRESH_KEY)

    try {
      if (storedAccess && storedRefresh) {
        await logoutSession(storedAccess, storedRefresh)
      }
    } catch {
      // Always clear the local session; the backend may reject stale tokens.
    } finally {
      clearStoredSession()
      setUser(null)
      setAccessToken(null)
      setRefreshToken(null)
      setStatus('anonymous')
      setError(null)
    }
  }

  const value: AuthContextValue = {
    user,
    accessToken,
    refreshToken,
    status,
    error,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    clearError: () => setError(null),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}