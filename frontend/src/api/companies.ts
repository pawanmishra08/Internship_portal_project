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

export type Company = {
  id: number
  name: string
  website?: string
}

export function getCompanies() {
  return requestJSON<ListResponse<Company>>('/companies/')
}

export function getCompany(id: number) {
  return requestJSON<Company>(`/companies/${id}/`)
}
