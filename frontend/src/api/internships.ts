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

export type Internship = {
  id: number
  title: string
  company_name?: string
  location?: string
  description?: string
}

export function getInternships() {
  return requestJSON<ListResponse<Internship>>('/internships/')
}

export function getInternship(id: number) {
  return requestJSON<Internship>(`/internships/${id}/`)
}
