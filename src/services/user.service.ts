import { apiClient } from '../config/api'
import type { CustomerUser } from '../store/auth.store'

export interface UpdateProfilePayload {
  name: string
  email: string
  phone: string
  address?: string
}

interface ApiUser {
  id: string
  code?: string
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  role: 'CUSTOMER' | 'customer'
}

const toCustomerUser = (user: ApiUser): CustomerUser => ({
  id: user.id,
  code: user.code,
  name: user.name,
  email: user.email,
  phone: user.phone,
  address: user.address,
  role: 'customer',
})

export const userService = {
  updateProfile: async (id: string, payload: UpdateProfilePayload) => {
    const user = await apiClient.patch<ApiUser>(`/users/${encodeURIComponent(id)}`, {
      ...payload,
      role: 'customer',
      status: 'active',
    })
    return {
      ...toCustomerUser(user),
      address: user.address ?? payload.address ?? null,
    }
  },
}
