import type { CompanyListItem, CompanyProfile } from '../types/api'
import { apiGet } from './client'

export function getCompanies(params?: Record<string, string | number | boolean>) {
  return apiGet<CompanyListItem[]>('/companies/', params)
}

export function getCompany(id: number) {
  return apiGet<CompanyProfile>(`/companies/${id}/`)
}

export function getOwnCompanyProfile() {
  return apiGet<CompanyProfile>('/companies/profile/')
}
