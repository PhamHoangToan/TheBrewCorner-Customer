import { apiClient } from '../config/api'

export interface WalletTransaction {
  id: string
  amount: number
  type: string
  note: string | null
  createdAt: string
}

export interface WalletSummary {
  balance: number
  transactions: WalletTransaction[]
  total: number
  page: number
  limit: number
}

export const walletService = {
  get: (userId: string, page = 1, limit = 20) =>
    apiClient.get<WalletSummary>(`/wallets/${encodeURIComponent(userId)}`, { page, limit }),
  topupConfirm: (userId: string, code: string) =>
    apiClient.post<WalletSummary>(`/wallets/${encodeURIComponent(userId)}/topup-confirm`, { code }),
}
