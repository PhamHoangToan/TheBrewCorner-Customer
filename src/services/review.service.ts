import { apiClient } from '../config/api'

export interface ProductReview {
  id: string
  productId: string
  orderId: string
  rating: number
  comment?: string | null
  createdAt: string
  user?: { id: string; name: string }
}

export interface ReviewSummary {
  productId: string
  avgRating: number
  count: number
}

export const reviewService = {
  create: (data: { orderId: string; productId: string; userId: string; rating: number; comment?: string }) =>
    apiClient.post<ProductReview>('/reviews', data),
  summary: () => apiClient.get<ReviewSummary[]>('/reviews/summary'),
  byOrder: (orderId: string, userId?: string) =>
    apiClient.get<Array<{ productId: string; rating: number; comment?: string | null }>>(
      `/reviews/order/${encodeURIComponent(orderId)}`,
      userId ? { userId } : undefined,
    ),
  byProduct: (productId: string) =>
    apiClient.get<ProductReview[]>(`/reviews/product/${encodeURIComponent(productId)}`),
}
