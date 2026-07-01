import { apiClient } from '../config/api'

export interface ReservationPayload {
  customerId?: string
  customerName: string
  customerPhone: string
  numberOfGuests: number
  reservedTime: string
  note?: string
}

export interface ApiReservation {
  id: string
  customerName: string
  customerPhone: string
  numberOfGuests: number
  reservedTime: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'
  note?: string | null
  createdAt: string
}

export const reservationService = {
  create: (payload: ReservationPayload) =>
    apiClient.post<ApiReservation>('/reservations', payload),
  listByCustomer: (customerId: string) =>
    apiClient.get<{ items: ApiReservation[]; total: number }>(
      `/reservations/my/${encodeURIComponent(customerId)}`,
    ),
}
