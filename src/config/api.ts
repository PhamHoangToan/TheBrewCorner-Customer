export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'
export const API_ORIGIN = new URL(API_URL).origin

type RequestOptions = RequestInit & {
  params?: Record<string, string | number | boolean | undefined>
}

const buildUrl = (path: string, params?: RequestOptions['params']) => {
  const url = new URL(`${API_URL}${path}`)
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined) url.searchParams.set(key, String(value))
  })
  return url.toString()
}

const friendlyMessages: Record<string, string> = {
  'Email already exists': 'Email nay da duoc su dung. Vui long dung email khac.',
  'Phone already exists': 'So dien thoai nay da duoc su dung. Vui long dung so khac.',
  'Invalid credentials': 'Email, so dien thoai hoac mat khau khong dung.',
  'Missing login identifier': 'Vui long nhap email hoac so dien thoai.',
  'Missing password': 'Vui long nhap mat khau.',
  'Password must be at least 6 characters': 'Mat khau phai co it nhat 6 ky tu.',
  'Name is required': 'Vui long nhap ho ten.',
  'Email is required': 'Vui long nhap email.',
  'Phone is required': 'Vui long nhap so dien thoai.',
  'Promotion code is required': 'Vui long nhap ma giam gia.',
  'Promotion code not found': 'Ma giam gia khong ton tai.',
  'Promotion code is not active': 'Ma giam gia da het han hoac chua duoc kich hoat.',
}

const normalizeApiError = (raw: string, status: number) => {
  let message = raw

  try {
    const parsed = JSON.parse(raw) as { message?: string | string[]; error?: string }
    if (Array.isArray(parsed.message)) {
      message = parsed.message.join(', ')
    } else if (parsed.message) {
      message = parsed.message
    } else if (parsed.error) {
      message = parsed.error
    }
  } catch {
    message = raw
  }

  if (message.startsWith('Promotion requires minimum order')) {
    const amount = Number(message.replace('Promotion requires minimum order', '').trim())
    return `Don hang can toi thieu ${amount.toLocaleString('vi-VN')}d de dung ma nay.`
  }

  return friendlyMessages[message] ?? (message || `Yeu cau khong thanh cong (${status})`)
}

// Đọc trực tiếp localStorage (không import store Zustand) để tránh vòng lặp import
// (auth.store cũng có thể cần gọi api trong tương lai).
const readToken = (): string | null => {
  try {
    const raw = localStorage.getItem('thebrewcorner_customer_auth')
    if (!raw) return null
    return (JSON.parse(raw) as { token?: string }).token ?? null
  } catch {
    return null
  }
}

const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const token = readToken()
  const response = await fetch(buildUrl(path, options.params), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const message = normalizeApiError(await response.text(), response.status)
    throw new Error(message)
  }

  return response.json() as Promise<T>
}

export const apiClient = {
  get: <T>(path: string, params?: RequestOptions['params']) => request<T>(path, { method: 'GET', params }),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
}
