import { apiClient } from '../config/api'
import type { CartItem } from '../store/cart.store'

export interface CheckoutPayload {
  values: {
    name: string
    phone: string
    address?: string
    tableNumber?: string
    note?: string
    payment: 'cash' | 'transfer' | 'wallet'
  }
  items: CartItem[]
  total: number
  subtotal?: number
  discountAmount?: number
  promotionCode?: string
  promotionName?: string
  promotionDiscountPercent?: number
  orderType: 'dine-in' | 'takeaway' | 'delivery'
  customerId?: string
  pendingTransferCode?: string
  redeemPoints?: number
  voucherCode?: string
  payWithWallet?: boolean
}

export interface ApiOrder {
  id: string
  code: string
  type: 'DINE_IN' | 'TAKE_AWAY'
  status: string
  note?: string | null
  subtotal: string | number
  totalAmount: string | number
  table?: {
    id: string
    code: string
    name: string
  } | null
  // Nguồn sự thật thanh toán — order.status chỉ là tiến độ pha chế/phục vụ
  invoice?: { status: string } | null
  customerId?: string | null
  items: Array<{
    id: string
    productId?: string
    productName: string
    quantity: number
    unitPrice: string | number
    totalPrice: string | number
  }>
}

const orderTypeToApi = (orderType: CheckoutPayload['orderType']) => {
  if (orderType === 'dine-in') return 'DINE_IN'
  return 'TAKE_AWAY'
}

// Chọn bàn từ danh sách bàn trống thật (mã đầy đủ, VD "BAN-003") gửi thẳng lên BE.
// QR quét tại bàn vẫn lưu số thô (VD "001") — thêm tiền tố "BAN-" như trước để tương thích ngược.
const toTableCode = (tableNumber?: string) => {
  if (!tableNumber) return undefined
  return tableNumber.toUpperCase().startsWith('BAN-') ? tableNumber : `BAN-${tableNumber}`
}

export const readOrderNote = (note?: string | null) => {
  if (!note) return {}
  try {
    return JSON.parse(note) as Record<string, string | undefined>
  } catch {
    return { customerNote: note }
  }
}

export const orderService = {
  create: (payload: CheckoutPayload) =>
    apiClient.post<ApiOrder>('/orders', {
      type: orderTypeToApi(payload.orderType),
      table: toTableCode(payload.values.tableNumber),
      customerId: payload.customerId,
      subtotal: payload.subtotal,
      discountAmount: payload.discountAmount,
      totalAmount: payload.total,
      pendingTransferCode: payload.pendingTransferCode,
      redeemPoints: payload.redeemPoints,
      voucherCode: payload.voucherCode,
      payWithWallet: payload.payWithWallet,
      note: JSON.stringify(Object.fromEntries(
        Object.entries({
          paymentMethod: payload.values.payment,
          customerName: payload.values.name,
          customerPhone: payload.values.phone,
          customerAddress: payload.values.address,
          customerNote: payload.values.note,
          customerOrderType: payload.orderType,
          tableNumber: payload.values.tableNumber,
        }).filter(([, v]) => v != null && v !== ''),
      )),
      items: payload.items.map((item) => ({
        productId: item.id,
        quantity: item.qty,
        unitPrice: item.price,
        productName: item.name,
        category: item.category,
      })),
    }),
  // Khách tự gọi món tại bàn qua QR — thêm vào order đang mở của bàn hoặc tạo order mới, không thanh toán ở bước này
  selfOrder: (tableId: string, items: CartItem[], customerId?: string) =>
    apiClient.post<ApiOrder>(`/orders/table/${encodeURIComponent(tableId)}/self-order`, {
      customerId,
      items: items.map((item) => ({
        productId: item.id,
        quantity: item.qty,
        unitPrice: item.price,
        productName: item.name,
        category: item.category,
      })),
    }),
  get: (id: string) => apiClient.get<ApiOrder>(`/orders/${encodeURIComponent(id)}`),
  listByCustomer: (customerId: string) =>
    apiClient.get<{ items: ApiOrder[]; total: number; page: number; limit: number }>(
      `/orders/customer/${encodeURIComponent(customerId)}`,
    ),
}
