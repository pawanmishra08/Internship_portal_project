import type { ApplicationItem, ApplicantItem } from '../types/api'
import { apiDelete, apiGet, apiPatch } from './client'

export function getApplications() {
  return apiGet<ApplicationItem[]>('/applications/')
}

export function deleteApplication(id: number) {
  return apiDelete<void>(`/applications/${id}/`)
}

export function getJobApplicants(jobId: number) {
  return apiGet<ApplicantItem[]>(`/applications/job/${jobId}/applicants/`)
}

export function updateApplicationStatus(id: number, body: { status: string }) {
  return apiPatch<ApplicationItem>(`/applications/${id}/status/`, body)
}
