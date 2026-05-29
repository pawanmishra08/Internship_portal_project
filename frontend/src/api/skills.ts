import type { Skill } from '../types/api'
import { apiGet } from './client'

export function getSkills() {
  return apiGet<Skill[]>('/students/skills/')
}
