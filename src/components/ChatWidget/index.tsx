import React, { useEffect, useRef, useState } from 'react'
import { MessageOutlined, SendOutlined } from '@ant-design/icons'
import { chatService, type ChatMessage } from '../../services/chat.service'
import { useChatSocket } from '../../hooks/useChatSocket'
import { useCustomerAuthStore } from '../../store/auth.store'
import styles from './chatWidget.module.css'

const STORAGE_KEY = 'thebrewcorner_chat_thread'

interface StoredThread {
  threadId: string
  identity: string // customerId hoặc 'guest'
}

const loadStoredThread = (): StoredThread | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoredThread) : null
  } catch {
    return null
  }
}

const saveStoredThread = (value: StoredThread) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)) } catch {}
}

const ChatWidget: React.FC = () => {
  const user = useCustomerAuthStore((s) => s.user)
  const [open, setOpen] = useState(false)
  const [threadId, setThreadId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  const identity = user?.id ?? 'guest'

  // Đăng nhập/đăng xuất giữa phiên → bỏ thread đang mở, tránh user mới (cùng máy)
  // nhìn thấy hội thoại của user trước. Effect khởi tạo bên dưới sẽ tạo/khôi phục lại.
  const prevIdentity = useRef(identity)
  useEffect(() => {
    if (prevIdentity.current === identity) return
    prevIdentity.current = identity
    setThreadId(null)
    setMessages([])
  }, [identity])

  // Mở panel lần đầu → tạo/khôi phục thread. Nếu identity đổi (đăng nhập/đăng xuất
  // khác tài khoản) so với thread đã lưu, tạo thread mới thay vì dùng nhầm của người khác.
  useEffect(() => {
    if (!open || threadId) return
    const stored = loadStoredThread()
    if (stored && stored.identity === identity) {
      setThreadId(stored.threadId)
      return
    }
    chatService.createThread({ customerId: user?.id })
      .then((thread) => {
        setThreadId(thread.id)
        saveStoredThread({ threadId: thread.id, identity })
      })
      .catch(() => {})
  }, [open, threadId, identity, user?.id])

  const loadMessages = () => {
    if (!threadId) return
    chatService.listMessages(threadId).then(setMessages).catch(() => {})
  }

  useEffect(() => { loadMessages() }, [threadId])

  // Polling nhẹ làm fallback — realtime chính đến từ WebSocket bên dưới
  useEffect(() => {
    if (!threadId || !open) return
    const timer = window.setInterval(loadMessages, 10000)
    return () => window.clearInterval(timer)
  }, [threadId, open])

  useChatSocket(threadId ?? undefined, (message) => {
    setMessages((prev) => prev.some((m) => m.id === message.id) ? prev : [...prev, message])
  })

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || !threadId || sending) return
    setSending(true)
    setInput('')
    try {
      const message = await chatService.sendMessage(threadId, text)
      setMessages((prev) => prev.some((m) => m.id === message.id) ? prev : [...prev, message])
    } catch {
      setInput(text)
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {open && (
        <div className={styles.panel}>
          <div className={styles.header}>
            <span>Hỗ trợ trực tuyến</span>
            <button type="button" className={styles.closeBtn} onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className={styles.messages} ref={listRef}>
            {messages.length === 0 && (
              <div className={styles.emptyHint}>Chào bạn! Hãy để lại tin nhắn, quán sẽ phản hồi sớm nhất có thể.</div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`${styles.bubbleMsg} ${m.senderType === 'CUSTOMER' ? styles.bubbleMsgCustomer : styles.bubbleMsgStaff}`}>
                {m.content}
              </div>
            ))}
          </div>
          <div className={styles.inputRow}>
            <textarea
              className={styles.input}
              rows={1}
              value={input}
              placeholder="Nhập tin nhắn..."
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            />
            <button type="button" className={styles.sendBtn} disabled={!input.trim() || sending} onClick={handleSend}>
              <SendOutlined />
            </button>
          </div>
        </div>
      )}
      <button type="button" className={styles.bubble} onClick={() => setOpen((v) => !v)} aria-label="Hỗ trợ trực tuyến">
        <MessageOutlined />
      </button>
    </>
  )
}

export default ChatWidget
