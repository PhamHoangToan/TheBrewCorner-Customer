import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../config/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

import { apiClient } from '../config/api'
import { pendingTransferService } from './pending-transfer.service'

const mockGet = apiClient.get as ReturnType<typeof vi.fn>
const mockPost = apiClient.post as ReturnType<typeof vi.fn>

describe('pendingTransferService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('gọi POST /pending-transfers với amount', async () => {
      mockPost.mockResolvedValue({ id: 'pt-1', code: 'CK-ABC123', amount: 100000, status: 'WAITING' })

      const result = await pendingTransferService.create(100000)

      expect(mockPost).toHaveBeenCalledWith('/pending-transfers', { amount: 100000 })
      expect(result.code).toBe('CK-ABC123')
    })
  })

  describe('get', () => {
    it('gọi GET /pending-transfers/:code đã encode', async () => {
      mockGet.mockResolvedValue({ code: 'CK-ABC 123', status: 'PAID' })

      const result = await pendingTransferService.get('CK-ABC 123')

      expect(mockGet).toHaveBeenCalledWith('/pending-transfers/CK-ABC%20123')
      expect(result.status).toBe('PAID')
    })
  })
})
