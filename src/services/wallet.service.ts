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
}

export const walletService = {
  get: (userId: string) => apiClient.get<WalletSummary>(`/wallets/${encodeURIComponent(userId)}`),
  topupConfirm: (userId: string, code: string) =>
    apiClient.post<WalletSummary>(`/wallets/${encodeURIComponent(userId)}/topup-confirm`, { code }),
}
