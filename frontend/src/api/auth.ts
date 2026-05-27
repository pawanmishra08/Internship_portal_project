import type {
  AuthCredentials,
  AuthSession,
  AuthUser,
  RegisterPayload,
} from '../types/auth'

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api/auth'
).replace(/\/$/, '')

async function parseError(response: Response) {
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    const payload = (await response.json()) as Record<string, unknown>

    if (typeof payload.detail === 'string') {
      return payload.detail
    }

    const messages: string[] = []

    for (const [key, value] of Object.entries(payload)) {
      if (typeof value === 'string') {
        messages.push(value)
      } else if (Array.isArray(value)) {
        for (const item of value) {
          messages.push(`${key}: ${String(item)}`)
        }
      }
    }

    if (messages.length > 0) {
      return messages.join(' ')
    }
  }

  const text = await response.text()

  if (text.trim()) {
    return text
  }

  return `Request failed with status ${response.status}`
}

async function requestJSON<T>(
  endpoint: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })

  if (!response.ok) {
    throw new Error(await parseError(response))
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export function login(payload: AuthCredentials) {
  return requestJSON<AuthSession>('/login/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function register(payload: RegisterPayload) {
  return requestJSON<AuthSession>('/register/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getCurrentUser(accessToken: string) {
  return requestJSON<AuthUser>('/me/', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

export function refreshAccessToken(refreshToken: string) {
  return requestJSON<{ access: string }>('/token/refresh/', {
    method: 'POST',
    body: JSON.stringify({ refresh: refreshToken }),
  })
}

export function logoutSession(accessToken: string, refreshToken: string) {
  return requestJSON<{ message: string }>('/logout/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ refresh: refreshToken }),
  })
}