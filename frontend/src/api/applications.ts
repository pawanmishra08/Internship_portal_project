import type { ApplicationItem, ApplicantItem } from '../types/api'
import { apiDelete, apiGet, apiPatch, apiPost } from './client'

export function getApplications(params?: Record<string, string>) {
  return apiGet<ApplicationItem[]>('/applications/', params)
}

export async function createApplication(payload: { job: number; cover_letter: string }) {
  return apiPost<ApplicationItem>('/applications/', payload)
}

export function deleteApplication(id: number) {
  return apiDelete<{ message: string }>(`/applications/${id}/`)
}

export function getJobApplicants(jobId: number, params?: Record<string, string>) {
  return apiGet<ApplicantItem[]>(`/applications/job/${jobId}/applicants/`, params)
}

export async function updateApplicationStatus(id: number, status: string) {
  return apiPatch<ApplicantItem>(`/applications/${id}/status/`, { status })
}
