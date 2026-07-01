import { apiClient } from '../config/api'

export interface PendingTransfer {
  id: string
  code: string
  amount: string | number
  status: 'WAITING' | 'PAID' | 'CONSUMED'
  paidAt?: string | null
}

export const pendingTransferService = {
  create: (amount: number) =>
    apiClient.post<PendingTransfer>('/pending-transfers', { amount }),
  get: (code: string) =>
    apiClient.get<PendingTransfer>(`/pending-transfers/${encodeURIComponent(code)}`),
}
