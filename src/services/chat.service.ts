import { apiClient } from '../config/api'

export interface ChatThread {
  id: string
  customerId: string | null
  guestName: string | null
  status: 'OPEN' | 'CLOSED'
  lastMessageAt: string
  createdAt: string
}

export interface ChatMessage {
  id: string
  threadId: string
  senderType: 'CUSTOMER' | 'STAFF'
  senderId: string | null
  content: string
  read: boolean
  createdAt: string
}

export const chatService = {
  createThread: (payload: { customerId?: string; guestName?: string }) =>
    apiClient.post<ChatThread>('/chat/threads', payload),
  listMessages: (threadId: string) => apiClient.get<ChatMessage[]>(`/chat/threads/${encodeURIComponent(threadId)}/messages`),
  sendMessage: (threadId: string, content: string) =>
    apiClient.post<ChatMessage>(`/chat/threads/${encodeURIComponent(threadId)}/messages`, { content }),
}
