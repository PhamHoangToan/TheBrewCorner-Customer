import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../config/api', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}))

import { apiClient } from '../config/api'
import { userService } from './user.service'

const mockGet = apiClient.get as ReturnType<typeof vi.fn>
const mockPatch = apiClient.patch as ReturnType<typeof vi.fn>

describe('userService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getLoyalty', () => {
    it('gọi GET /users/:id/loyalty đã encode', async () => {
      const loyalty = {
        loyaltyPoints: 12,
        totalSpent: 125000,
        membershipTier: 'BASIC' as const,
        transactions: [],
      }
      mockGet.mockResolvedValue(loyalty)

      const result = await userService.getLoyalty('cust with space')

      expect(mockGet).toHaveBeenCalledWith('/users/cust%20with%20space/loyalty')
      expect(result).toEqual(loyalty)
    })
  })

  describe('updateProfile', () => {
    it('patch /users/:id kèm role/status mặc định và map lại thành CustomerUser', async () => {
      mockPatch.mockResolvedValue({
        id: 'cust-1',
        code: 'KH001',
        name: 'Nguyễn Văn A',
        email: 'a@example.com',
        phone: '0901234567',
        address: '123 Đường ABC',
        role: 'CUSTOMER',
      })

      const result = await userService.updateProfile('cust-1', {
        name: 'Nguyễn Văn A',
        email: 'a@example.com',
        phone: '0901234567',
        address: '123 Đường ABC',
      })

      expect(mockPatch).toHaveBeenCalledWith('/users/cust-1', {
        name: 'Nguyễn Văn A',
        email: 'a@example.com',
        phone: '0901234567',
        address: '123 Đường ABC',
        role: 'customer',
        status: 'active',
      })
      expect(result).toEqual({
        id: 'cust-1',
        code: 'KH001',
        name: 'Nguyễn Văn A',
        email: 'a@example.com',
        phone: '0901234567',
        address: '123 Đường ABC',
        role: 'customer',
      })
    })

    it('fallback về address trong payload nếu BE không trả address', async () => {
      mockPatch.mockResolvedValue({
        id: 'cust-1',
        name: 'Nguyễn Văn A',
        role: 'CUSTOMER',
        address: null,
      })

      const result = await userService.updateProfile('cust-1', {
        name: 'Nguyễn Văn A',
        email: 'a@example.com',
        phone: '0901234567',
        address: '123 Đường ABC',
      })

      expect(result.address).toBe('123 Đường ABC')
    })
  })
})
