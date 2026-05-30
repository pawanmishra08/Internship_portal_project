import type { Skill } from '../types/api'
import { apiGet, apiPost, apiPatch, apiDelete } from './client'

type SkillPayload = { name: string; category?: string }

function normalizeSkillPayload(payload: SkillPayload) {
  const name = payload.name.trim()
  const category = payload.category?.trim()

  if (!name) {
    throw new Error('Skill name is required')
  }

  return {
    name,
    ...(category ? { category } : {}),
  }
}

export function getSkills() {
  return apiGet<Skill[]>('/students/skills/')
}

export function getAdminSkills(params?: Record<string, string | number | boolean>) {
  return apiGet<Skill[]>('/students/skills/admin/', params)
}

export function createSkill(payload: SkillPayload) {
  return apiPost<Skill>('/students/skills/admin/', normalizeSkillPayload(payload))
}

export function updateSkill(id: number, payload: { name?: string; category?: string }) {
  const normalized = {
    ...(payload.name !== undefined ? { name: payload.name.trim() } : {}),
    ...(payload.category !== undefined ? { category: payload.category.trim() } : {}),
  }

  if ('name' in normalized && !normalized.name) {
    throw new Error('Skill name is required')
  }

  return apiPatch<Skill>(`/students/skills/admin/${id}/`, normalized)
}

export function deleteSkill(id: number) {
  return apiDelete<void>(`/students/skills/admin/${id}/`)
}
