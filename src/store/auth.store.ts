import { create } from 'zustand'
import { useCartStore } from './cart.store'

export interface CustomerUser {
  id: string
  code?: string
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  role: 'customer'
}

interface CustomerAuthState {
  user: CustomerUser | null
  token: string | null
  setAuth: (user: CustomerUser, token: string) => void
  updateUser: (user: CustomerUser) => void
  logout: () => void
}

const STORAGE_KEY = 'thebrewcorner_customer_auth'

const loadFromStorage = (): Pick<CustomerAuthState, 'user' | 'token'> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Pick<CustomerAuthState, 'user' | 'token'>
  } catch {}
  return { user: null, token: null }
}

const saveToStorage = (user: CustomerUser | null, token: string | null) => {
  try {
    if (user && token) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token }))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch {}
}

export const useCustomerAuthStore = create<CustomerAuthState>()((set) => ({
  ...loadFromStorage(),
  setAuth: (user, token) => {
    saveToStorage(user, token)
    useCartStore.getState().restoreForUser(user.id)
    set({ user, token })
  },
  updateUser: (user) => {
    set((state) => {
      saveToStorage(user, state.token)
      return { user }
    })
  },
  logout: () => {
    const currentUser = useCustomerAuthStore.getState().user
    if (currentUser) useCartStore.getState().saveForUser(currentUser.id)
    saveToStorage(null, null)
    useCartStore.getState().clearCart()
    set({ user: null, token: null })
  },
}))
