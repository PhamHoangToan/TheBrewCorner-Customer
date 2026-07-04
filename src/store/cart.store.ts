import { create } from 'zustand'

export interface CartItem {
  id: string
  name: string
  price: number
  qty: number
  category: string
}

interface CartState {
  items: CartItem[]
  tableNumber: string | null
  orderType: 'dine-in' | 'takeaway' | 'delivery'
  isCartOpen: boolean
  // Phiên gọi món tại bàn qua QR (self-order): id bàn thật + tên hiển thị
  tableSessionId: string | null
  tableSessionName: string | null
  // "Đặt ngay" từ trang chi tiết món — đơn tách biệt hoàn toàn khỏi giỏ hàng thật,
  // Checkout ưu tiên dùng item này (nếu có) thay vì `items`, không đụng tới giỏ hàng đang có
  buyNowItem: CartItem | null
  addItem: (item: Omit<CartItem, 'qty'>, qty?: number) => void
  removeItem: (id: string) => void
  changeQty: (id: string, delta: number) => void
  clearCart: () => void
  saveForUser: (userId: string) => void
  restoreForUser: (userId: string) => void
  setTable: (table: string) => void
  setOrderType: (type: CartState['orderType']) => void
  setTableSession: (id: string, name: string) => void
  clearTableSession: () => void
  openCart: () => void
  closeCart: () => void
  setBuyNow: (item: Omit<CartItem, 'qty'>, qty?: number) => void
  clearBuyNow: () => void
}

const cartKey = (userId: string) => `cart_${userId}`

const saveCart = (userId: string, items: CartItem[]) => {
  try { localStorage.setItem(cartKey(userId), JSON.stringify(items)) } catch {}
}

const loadCart = (userId: string): CartItem[] => {
  try {
    const raw = localStorage.getItem(cartKey(userId))
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  tableNumber: null,
  orderType: 'dine-in',
  isCartOpen: false,
  tableSessionId: null,
  tableSessionName: null,
  buyNowItem: null,

  addItem: (item, qty = 1) =>
    set((s) => {
      const existing = s.items.find((c) => c.id === item.id)
      const items = existing
        ? s.items.map((c) => c.id === item.id ? { ...c, qty: c.qty + qty } : c)
        : [...s.items, { ...item, qty }]
      return { items }
    }),

  removeItem: (id) =>
    set((s) => ({ items: s.items.filter((c) => c.id !== id) })),

  changeQty: (id, delta) =>
    set((s) => ({
      items: s.items
        .map((c) => c.id === id ? { ...c, qty: c.qty + delta } : c)
        .filter((c) => c.qty > 0),
    })),

  clearCart: () => set({ items: [] }),

  saveForUser: (userId) => saveCart(userId, get().items),

  restoreForUser: (userId) => set({ items: loadCart(userId) }),

  setTable: (table) => set({ tableNumber: table }),
  setOrderType: (type) => set({ orderType: type }),
  setTableSession: (id, name) => set({ tableSessionId: id, tableSessionName: name, orderType: 'dine-in' }),
  clearTableSession: () => set({ tableSessionId: null, tableSessionName: null }),
  openCart:  () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),

  setBuyNow: (item, qty = 1) => set({ buyNowItem: { ...item, qty } }),
  clearBuyNow: () => set({ buyNowItem: null }),
}))

export const useCartTotal = () =>
  useCartStore((s) => s.items.reduce((sum, c) => sum + c.price * c.qty, 0))

export const useCartCount = () =>
  useCartStore((s) => s.items.reduce((sum, c) => sum + c.qty, 0))
