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
  addItem: (item: Omit<CartItem, 'qty'>) => void
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

  addItem: (item) =>
    set((s) => {
      const existing = s.items.find((c) => c.id === item.id)
      const items = existing
        ? s.items.map((c) => c.id === item.id ? { ...c, qty: c.qty + 1 } : c)
        : [...s.items, { ...item, qty: 1 }]
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
}))

export const useCartTotal = () =>
  useCartStore((s) => s.items.reduce((sum, c) => sum + c.price * c.qty, 0))

export const useCartCount = () =>
  useCartStore((s) => s.items.reduce((sum, c) => sum + c.qty, 0))
