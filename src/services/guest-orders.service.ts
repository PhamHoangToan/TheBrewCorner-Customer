import type { ApiOrder } from './order.service'

const STORAGE_KEY = 'thebrewcorner_guest_orders'

export interface GuestOrder {
  id: string
  code: string
  status: string
  totalAmount: number
  createdAt: string
  customerId?: string
}

const readAll = (): GuestOrder[] => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const value = JSON.parse(raw)
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

const writeAll = (orders: GuestOrder[]) => {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(orders.slice(0, 10)))
}

export const guestOrdersService = {
  list: () => readAll().filter((order) => !order.customerId),

  listByCustomer: (customerId: string) => readAll().filter((order) => order.customerId === customerId),

  save(order: ApiOrder, customerId?: string) {
    const orders = readAll()
    const next: GuestOrder = {
      id: order.id,
      code: order.code,
      status: order.status,
      totalAmount: Number(order.totalAmount ?? 0),
      createdAt: new Date().toISOString(),
      customerId,
    }
    writeAll([next, ...orders.filter((item) => item.id !== order.id && item.code !== order.code)])
  },

  update(order: ApiOrder) {
    const orders = readAll()
    const existing = orders.find((item) => item.id === order.id || item.code === order.code)
    if (!existing) return
    writeAll(
      orders.map((item) =>
        item.id === order.id || item.code === order.code
          ? { ...item, status: order.status, totalAmount: Number(order.totalAmount ?? item.totalAmount) }
          : item,
      ),
    )
  },
}
