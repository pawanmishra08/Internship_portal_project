import type { JobCard, JobDetail, JobFormPayload } from '../types/api'
import { apiGet, apiPost, apiPut } from './client'

export function getJobs(params?: Record<string, string | number | boolean>) {
  return apiGet<JobCard[]>('/companies/jobs/', params)
}

export function getJob(id: number) {
  return apiGet<JobDetail>(`/companies/jobs/${id}/`)
}

export function createJob(payload: JobFormPayload) {
  return apiPost<JobDetail>('/companies/jobs/', payload)
}

export function updateJob(id: number, payload: JobFormPayload) {
  return apiPut<JobDetail>(`/companies/jobs/${id}/`, payload)
}
