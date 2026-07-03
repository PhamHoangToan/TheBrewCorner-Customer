import { apiClient } from '../config/api'

export interface PersonalVoucher {
  id: string
  code: string
  name: string
  discountPercent: number
  minOrderAmount?: string | number | null
  expiresAt: string
  status: 'ACTIVE' | 'USED' | 'EXPIRED'
  usedAt?: string | null
}

export const voucherService = {
  my: async (userId: string) => {
    const res = await apiClient.get<{ items: PersonalVoucher[] }>(`/vouchers/my/${encodeURIComponent(userId)}`)
    return res.items
  },
  validate: (data: { code: string; userId: string; totalAmount: number }) =>
    apiClient.post<{ voucher: PersonalVoucher; discountAmount: number; finalAmount: number }>('/vouchers/validate', data),
}
