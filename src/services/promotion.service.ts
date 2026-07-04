import { apiClient } from '../config/api'

export interface Promotion {
  id: string
  code: string
  name: string
  conditionText: string
  minOrderAmount?: string | number | null
  discountPercent: number
  imageUrl?: string | null
  startDate: string
  endDate: string
  status: string
}

export interface PromotionValidation {
  promotion: Promotion
  discountAmount: number
  finalAmount: number
}

export const promotionService = {
  listValid: (totalAmount: number) => apiClient.get<Promotion[]>('/promotions/valid', { totalAmount }),
  listActive: () => apiClient.get<Promotion[]>('/promotions/active'),
  validate: (code: string, totalAmount: number) =>
    apiClient.post<PromotionValidation>('/promotions/validate', { code, totalAmount }),
}
