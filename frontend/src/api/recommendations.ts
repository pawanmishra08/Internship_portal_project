import type { RecommendationResponse } from '../types/api'
import { apiGet } from './client'

export function getRecommendations(limit = 3) {
  return apiGet<RecommendationResponse>('/recommendations/', { top: limit })
}
