export type CompanyListItem = {
  id: number
  company_name: string
  industry?: string
  location?: string
  is_verified: boolean
  logo_url?: string | null
}

export type CompanyProfile = CompanyListItem & {
  tagline?: string
  description?: string
  website?: string
  size?: string
  linkedin_url?: string
  verified_at?: string | null
  created_at: string
  updated_at: string
}

export type Skill = {
  id: number
  name: string
  category?: string
}

export type JobFormPayload = {
  title: string
  description: string
  requirements?: string
  responsibilities?: string
  location?: string
  type?: string
  status?: string
  stipend_min?: number | null
  stipend_max?: number | null
  duration_months?: number | null
  openings?: number
  deadline?: string | null
  skill_ids?: number[]
}

export type StudentProfilePayload = {
  bio?: string
  phone?: string
  location?: string
  university?: string
  degree?: string
  field_of_study?: string
  graduation_year?: number | null
  gpa?: number | null
  linkedin_url?: string
  github_url?: string
  portfolio_url?: string
  available_from?: string | null
  is_available?: boolean
  skill_ids?: number[]
}

export type JobCard = {
  id: number
  title: string
  company_name: string
  company_location?: string
  is_verified: boolean
  location?: string
  type: string
  status: string
  stipend_min?: number | null
  stipend_max?: number | null
  duration_months?: number | null
  deadline?: string | null
  skill_names: string[]
  created_at: string
  application_count?: number
}

export type JobDetail = JobCard & {
  description: string
  requirements?: string
  responsibilities?: string
  openings?: number
  deadline?: string | null
  application_count?: number
}

export type ApplicationItem = {
  id: number
  status: string
  status_display: string
  cover_letter?: string
  applied_at: string
  updated_at: string
  job: JobCard
}

export type ApplicantItem = {
  id: number
  status: string
  status_display: string
  cover_letter?: string
  resume_url?: string | null
  company_notes?: string
  applied_at: string
  updated_at: string
  student: {
    id: number
    full_name: string
    email: string
    university?: string
    degree?: string
    location?: string
    is_available?: boolean
    skill_count?: number
  }
}

export type StudentListItem = {
  id: number
  full_name: string
  email: string
  university?: string
  degree?: string
  location?: string
  is_available: boolean
  skill_count: number
  created_at: string
}

export type StudentProfile = {
  id: number
  email: string
  full_name: string
  bio?: string
  phone?: string
  location?: string
  university?: string
  degree?: string
  field_of_study?: string
  graduation_year?: number | null
  gpa?: number | null
  resume_url?: string | null
  linkedin_url?: string
  github_url?: string
  portfolio_url?: string
  skills: { id: number; name: string }[]
  available_from?: string | null
  is_available: boolean
  created_at: string
  updated_at: string
}

export type RecommendationItem = {
  job: JobCard
  score: number
  matched_skills: string[]
  missing_skills: string[]
  breakdown: {
    skill_match: number
    gpa: number
    availability: number
    location: number
    profile_completeness: number
  }
}

export type RecommendationResponse = {
  count: number
  results: RecommendationItem[]
}
