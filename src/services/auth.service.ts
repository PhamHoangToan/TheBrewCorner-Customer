import { apiClient } from '../config/api'
import type { CustomerUser } from '../store/auth.store'

export interface AuthResponse {
  token: string
  access_token?: string
  user: CustomerUser
}

export interface LoginPayload {
  username: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  phone: string
  password: string
}

export const authService = {
  login: (payload: LoginPayload) => apiClient.post<AuthResponse>('/auth/login', payload),
  register: (payload: RegisterPayload) => apiClient.post<AuthResponse>('/auth/register', payload),
}
