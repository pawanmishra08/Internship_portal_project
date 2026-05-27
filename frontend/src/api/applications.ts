type ListResponse<T> = T[]

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api').replace(/\/$/, '')

async function requestJSON<T>(url: string, init: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Request failed: ${res.status}`)
  }

  if (res.status === 204) return undefined as unknown as T
  return (await res.json()) as T
}

export type Application = {
  id: number
  internship_id: number
  user_id: number
  status: string
}

export function getApplications() {
  return requestJSON<ListResponse<Application>>('/applications/')
}

export function submitApplication(payload: Partial<Application>) {
  return requestJSON<Application>('/applications/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
