import { API_ORIGIN, apiClient } from '../config/api'

export interface ApiProduct {
  id: string
  code: string
  name: string
  price: string | number
  type: string
  unit: string
  imageUrl?: string | null
  emoji?: string | null
  soldOutUntil?: string | null
  category?: {
    id: string
    name: string
  }
}

export interface CustomerProduct {
  id: string
  name: string
  price: number
  category: string
  description: string
  imageUrl?: string
  emoji: string
  popular?: boolean
  new?: boolean
  soldOut?: boolean
}

const emojiFor = (category: string, fallback?: string | null) => {
  if (fallback && fallback.length <= 4) return fallback
  if (category.toLowerCase().includes('tr') || category.toLowerCase().includes('tea')) return '🍵'
  if (category.toLowerCase().includes('banh') || category.toLowerCase().includes('bánh')) return '🍰'
  return '☕'
}

const normalizeImageUrl = (imageUrl?: string | null) => {
  const value = imageUrl?.trim()
  if (!value) return undefined
  if (/^(https?:|data:|blob:)/i.test(value)) return value
  return value.startsWith('/') ? `${API_ORIGIN}${value}` : `${API_ORIGIN}/${value}`
}

export const mapProduct = (product: ApiProduct): CustomerProduct => {
  const category = product.category?.name ?? product.type ?? 'Khác'

  return {
    id: product.id,
    name: product.name,
    price: Number(product.price),
    category,
    description: `${product.name} - ${product.unit}`,
    imageUrl: normalizeImageUrl(product.imageUrl),
    emoji: emojiFor(category, product.emoji),
    soldOut: !!product.soldOutUntil && new Date(product.soldOutUntil).getTime() > Date.now(),
  }
}

export const productService = {
  list: async () => {
    const response = await apiClient.get<{ items: ApiProduct[] }>('/products', { limit: 100 })
    return response.items.map(mapProduct)
  },
}
