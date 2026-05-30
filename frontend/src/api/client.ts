const AUTH_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api/auth').replace(/\/$/, '')
const API_BASE = AUTH_BASE.replace(/\/auth$/, '')
const ACCESS_KEY = 'internship-portal.access-token'

function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY)
}

function buildUrl(endpoint: string, params?: Record<string, string | number | boolean>) {
  const url = `${API_BASE}${endpoint}`
  if (!params || Object.keys(params).length === 0) {
    return url
  }
  const query = new URLSearchParams(
    Object.entries(params).reduce<Record<string, string>>((acc, [key, value]) => {
      acc[key] = String(value)
      return acc
    }, {})
  ).toString()
  return `${url}?${query}`
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get('content-type') ?? ''
  if (response.status === 204) {
    return undefined
  }
  if (contentType.includes('application/json')) {
    return response.json()
  }
  return response.text()
}

function normalizeEndpoint(endpoint: string) {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint
  }
  return `${API_BASE}${endpoint}`
}

function parseFilename(contentDisposition: string | null) {
  if (!contentDisposition) return null
  const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(contentDisposition)
  return decodeURIComponent(match?.[1] ?? match?.[2] ?? '') || null
}

export async function apiRequest<T>(endpoint: string, init: RequestInit = {}) {
  const token = getAccessToken()
  const isFormData = init.body instanceof FormData
  const response = await fetch(normalizeEndpoint(endpoint), {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  })

  if (!response.ok) {
    const payload = await parseResponse(response)
    const message = typeof payload === 'string'
      ? payload
      : payload?.detail || JSON.stringify(payload)
    throw new Error(message || `Request failed with status ${response.status}`)
  }

  return (await parseResponse(response)) as T
}

export async function apiDownload(endpoint: string) {
  const token = getAccessToken()
  const response = await fetch(normalizeEndpoint(endpoint), {
    method: 'GET',
    headers: {
      Accept: '*/*',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!response.ok) {
    const payload = await parseResponse(response)
    const message = typeof payload === 'string'
      ? payload
      : payload?.detail || JSON.stringify(payload)
    throw new Error(message || `Request failed with status ${response.status}`)
  }

  return {
    blob: await response.blob(),
    filename: parseFilename(response.headers.get('content-disposition')),
    contentType: response.headers.get('content-type') ?? 'application/octet-stream',
  }
}

export async function apiGet<T>(endpoint: string, params?: Record<string, string | number | boolean>) {
  return apiRequest<T>(buildUrl(endpoint, params), { method: 'GET' })
}

export async function apiDelete<T>(endpoint: string) {
  return apiRequest<T>(endpoint, { method: 'DELETE' })
}

export async function apiPatch<T>(endpoint: string, body: unknown) {
  return apiRequest<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) })
}

export async function apiPost<T>(endpoint: string, body: unknown) {
  return apiRequest<T>(endpoint, { method: 'POST', body: JSON.stringify(body) })
}

export async function apiPut<T>(endpoint: string, body: unknown) {
  return apiRequest<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) })
}
