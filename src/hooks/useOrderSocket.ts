import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { API_ORIGIN } from '../config/api'

export function useOrderSocket(orderId: string | undefined, onUpdate: () => void) {
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate

  useEffect(() => {
    if (!orderId) return

    const socket = io(API_ORIGIN, { transports: ['websocket'] })
    socket.on('connect', () => socket.emit('join:order', { orderId }))
    socket.on('order:updated', () => onUpdateRef.current())

    return () => { socket.disconnect() }
  }, [orderId])
}
