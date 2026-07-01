import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../config/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

import { apiClient } from '../config/api'
import { reservationService } from './reservation.service'

const mockGet = apiClient.get as ReturnType<typeof vi.fn>
const mockPost = apiClient.post as ReturnType<typeof vi.fn>

describe('reservationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('gọi POST /reservations với đúng payload', async () => {
      mockPost.mockResolvedValue({ id: 'res-1', status: 'PENDING' })

      const payload = {
        customerId: 'cust-1',
        customerName: 'Nguyễn Văn A',
        customerPhone: '0901234567',
        numberOfGuests: 2,
        reservedTime: '2026-07-10T19:00:00.000Z',
        note: 'Bàn gần cửa sổ',
      }

      const result = await reservationService.create(payload)

      expect(mockPost).toHaveBeenCalledWith('/reservations', payload)
      expect(result).toEqual({ id: 'res-1', status: 'PENDING' })
    })
  })

  describe('listByCustomer', () => {
    it('gọi GET /reservations/my/:customerId đã encode', async () => {
      mockGet.mockResolvedValue({ items: [], total: 0 })

      await reservationService.listByCustomer('cust with space')

      expect(mockGet).toHaveBeenCalledWith('/reservations/my/cust%20with%20space')
    })
  })
})
