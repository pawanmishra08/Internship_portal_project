export type UserRole = 'student' | 'company' | 'admin'

export interface AuthUser {
  id: number
  email: string
  full_name: string
  role: UserRole
  date_joined: string
}

export interface AuthSession {
  access: string
  refresh: string
  user: AuthUser
}

export interface AuthCredentials {
  email: string
  password: string
}

export interface RegisterPayload extends AuthCredentials {
  full_name: string
  role: Exclude<UserRole, 'admin'>
}