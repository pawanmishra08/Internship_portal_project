import type { CompanyListItem, CompanyProfile, JobCard } from '../types/api'
import { apiGet, apiPatch } from './client'

export function getCompanies(params?: Record<string, string | number | boolean>) {
  return apiGet<CompanyListItem[]>('/companies/', params)
}

export function getCompany(id: number) {
  return apiGet<CompanyProfile>(`/companies/${id}/`)
}

export function getOwnCompanyProfile() {
  return apiGet<CompanyProfile>('/companies/profile/')
}

export function updateCompanyProfile(payload: Partial<{
  company_name: string
  tagline: string
  description: string
  industry: string
  size: string
  website: string
  location: string
  linkedin_url: string
}>) {
  return apiPatch<CompanyProfile>('/companies/profile/', payload)
}

export function updateCompanyVerification(
  companyId: number,
  payload: Partial<{
    is_verified: boolean
  }>
) {
  return apiPatch<CompanyProfile>(`/companies/admin/${companyId}/`, payload)
}

export function getCompanyJobs(companyId: number) {
  return apiGet<JobCard[]>(`/companies/${companyId}/jobs/`)
}
