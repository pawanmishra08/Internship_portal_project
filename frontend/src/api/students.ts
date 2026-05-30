import type { StudentListItem, StudentProfile, StudentProfilePayload } from '../types/api'
import { apiDelete, apiGet, apiPatch } from './client'

export function getStudentProfile() {
  return apiGet<StudentProfile>('/students/profile/')
}

export function updateStudentProfile(payload: StudentProfilePayload) {
  return apiPatch<StudentProfile>('/students/profile/', payload)
}

export function getStudents(params?: Record<string, string | number | boolean>) {
  return apiGet<StudentListItem[]>('/students/', params)
}

export function getStudent(id: number) {
  return apiGet<StudentProfile>(`/students/${id}/`)
}