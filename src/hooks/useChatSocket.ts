import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { API_ORIGIN } from '../config/api'
import type { ChatMessage } from '../services/chat.service'

export function useChatSocket(threadId: string | undefined, onMessage: (message: ChatMessage) => void) {
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  useEffect(() => {
    if (!threadId) return

    const socket = io(API_ORIGIN, { transports: ['websocket'] })
    socket.on('connect', () => socket.emit('join:chat', { threadId }))
    socket.on('chat:message', (message: ChatMessage) => onMessageRef.current(message))

    return () => { socket.disconnect() }
  }, [threadId])
}
