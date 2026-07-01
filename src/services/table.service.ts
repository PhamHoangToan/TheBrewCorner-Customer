import { apiClient } from '../config/api'

export interface ApiTable {
  id: string
  code: string
  name: string
  status: 'AVAILABLE' | 'SERVING' | 'CHECKOUT_REQUESTED' | 'RESERVED' | 'INACTIVE'
}

export const tableService = {
  listAvailable: () =>
    apiClient.get<{ items: ApiTable[]; total: number }>('/tables', { limit: 200, status: 'AVAILABLE' }),
}
