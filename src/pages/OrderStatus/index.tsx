import React, { useEffect, useMemo, useState } from 'react'
import { Button, Empty, Input, Modal, Rate, Spin, Steps, message } from 'antd'
import { SearchOutlined, StarOutlined } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { guestOrdersService, type GuestOrder } from '../../services/guest-orders.service'
import { orderService, readOrderNote, type ApiOrder } from '../../services/order.service'
import { reviewService } from '../../services/review.service'
import { useCustomerAuthStore } from '../../store/auth.store'
import styles from './orderStatus.module.css'

const STEPS_DINE_IN  = ['Đã nhận đơn', 'Đang pha chế', 'Phục vụ tại bàn', 'Hoàn thành']
const STEPS_TAKEAWAY = ['Đã nhận đơn', 'Đang pha chế', 'Sẵn sàng lấy', 'Hoàn thành']
const STEPS_DELIVERY = ['Đã nhận đơn', 'Đang pha chế', 'Đang giao hàng', 'Đã giao']

const statusToStep = (status?: string) => {
  if (status === 'PAID' || status === 'SERVED') return 3
  if (status === 'READY') return 2
  if (status === 'PREPARING') return 1
  return 0
}

const statusLabel: Record<string, string> = {
  DRAFT:               'Đơn mới',
  SENT:                'Đã gửi đến quán',
  PREPARING:           'Barista đang pha chế',
  READY:               'Món đã sẵn sàng',
  SERVED:              'Đã phục vụ',
  CHECKOUT_REQUESTED:  'Chờ thanh toán',
  PAID:                'Hoàn thành',
  CANCELLED:           'Đã huỷ',
}

const statusColor: Record<string, string> = {
  DRAFT: '#94a3b8', SENT: '#3b82f6', PREPARING: '#f59e0b',
  READY: '#10b981', SERVED: '#10b981', CHECKOUT_REQUESTED: '#f97316',
  PAID: '#22c55e', CANCELLED: '#ef4444',
}

const OrderStatus: React.FC = () => {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const initialCode = params.get('code') ?? ''
  const [code, setCode] = useState(initialCode)
  const [lookupCode, setLookupCode] = useState(initialCode)
  const [order, setOrder] = useState<ApiOrder | null>(null)
  const [guestOrders, setGuestOrders] = useState<GuestOrder[]>(() => guestOrdersService.list())
  const [accountOrders, setAccountOrders] = useState<ApiOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const user = useCustomerAuthStore((state) => state.user)
  const [reviewedProductIds, setReviewedProductIds] = useState<Set<string>>(new Set())
  const [reviewTarget, setReviewTarget] = useState<{ productId: string; productName: string } | null>(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)

  useEffect(() => {
    if (!user) { setAccountOrders([]); setGuestOrders(guestOrdersService.list()); return }
    setGuestOrders(guestOrdersService.listByCustomer(user.id))
    let mounted = true
    const load = () => {
      orderService.listByCustomer(user.id)
        .then((data) => { if (mounted) setAccountOrders(data.items) })
        .catch(() => { if (mounted) setAccountOrders([]) })
    }
    load()
    const timer = window.setInterval(load, 5000)
    return () => { mounted = false; window.clearInterval(timer) }
  }, [user])

  useEffect(() => {
    if (!lookupCode.trim()) return
    let mounted = true
    const loadOrder = (silent = false) => {
      if (!silent) { setLoading(true); setError(null) }
      orderService.get(lookupCode.trim())
        .then((data) => {
          if (!mounted) return
          setOrder(data)
          guestOrdersService.update(data)
          if (!user) setGuestOrders(guestOrdersService.list())
          if (user) {
            setGuestOrders(guestOrdersService.listByCustomer(user.id))
            setAccountOrders((prev) => prev.map((o) => o.id === data.id ? data : o))
          }
          setError(null)
        })
        .catch((err) => {
          if (!mounted) return
          if (!silent) { setOrder(null); setError(err instanceof Error ? err.message : 'Không tìm thấy đơn hàng') }
        })
        .finally(() => { if (mounted && !silent) setLoading(false) })
    }
    loadOrder()
    const timer = window.setInterval(() => loadOrder(true), 5000)
    return () => { mounted = false; window.clearInterval(timer) }
  }, [lookupCode, user])

  const note = readOrderNote(order?.note)
  const orderType = note.customerOrderType ?? (order?.type === 'DINE_IN' ? 'dine-in' : 'takeaway')
  const total = Number(order?.totalAmount ?? 0)
  const steps = orderType === 'dine-in' ? STEPS_DINE_IN : orderType === 'delivery' ? STEPS_DELIVERY : STEPS_TAKEAWAY
  const currentStep = useMemo(() => statusToStep(order?.status), [order?.status])

  // Đã thanh toán = invoice PAID (nguồn sự thật) hoặc order PAID (hoàn tất trọn vẹn / dữ liệu cũ)
  const isPaid = order?.status === 'PAID' || order?.invoice?.status === 'PAID'
  const canReview = isPaid && !!user?.id && order?.customerId === user.id

  // Món nào trong đơn đang xem user đã đánh giá rồi → ẩn nút
  useEffect(() => {
    if (!order?.id || !user?.id || !isPaid) { setReviewedProductIds(new Set()); return }
    let mounted = true
    reviewService.byOrder(order.id, user.id)
      .then((items) => { if (mounted) setReviewedProductIds(new Set(items.map((r) => r.productId))) })
      .catch(() => {})
    return () => { mounted = false }
  }, [order?.id, isPaid, user?.id])

  const submitReview = async () => {
    if (!reviewTarget || !order || !user) return
    setReviewSubmitting(true)
    try {
      await reviewService.create({
        orderId: order.id,
        productId: reviewTarget.productId,
        userId: user.id,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      })
      setReviewedProductIds((prev) => new Set([...prev, reviewTarget.productId]))
      message.success(`Cảm ơn bạn đã đánh giá "${reviewTarget.productName}"!`)
      setReviewTarget(null)
      setReviewRating(5)
      setReviewComment('')
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Gửi đánh giá thất bại')
    } finally {
      setReviewSubmitting(false)
    }
  }

  const sessionOrders = useMemo(
    () => (user ? guestOrders.filter((o) => !accountOrders.some((a) => a.id === o.id)) : guestOrders),
    [accountOrders, guestOrders, user],
  )

  const handleSearch = () => {
    const next = code.trim()
    if (!next) return
    setLookupCode(next)
    setParams({ code: next })
  }

  const handleSelect = (id: string, c: string) => {
    setCode(c); setLookupCode(id); setParams({ code: c })
  }

  return (
    <div className={styles.page}>
      <Navbar />

      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroKicker}>📦 Tra cứu đơn hàng</div>
          <h1 className={styles.heroTitle}>Kiểm tra trạng thái đơn</h1>
          <p className={styles.heroDesc}>Trang tự động cập nhật mỗi 5 giây theo trạng thái barista thay đổi.</p>
          <div className={styles.searchRow}>
            <Input
              size="large"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onPressEnter={handleSearch}
              placeholder="VD: ORD-123456789"
              prefix={<SearchOutlined style={{ color: '#662C21' }} />}
              className={styles.searchInput}
            />
            <Button type="primary" size="large" className={styles.searchBtn} onClick={handleSearch}>
              Tra cứu
            </Button>
          </div>
        </div>
      </div>

      <main className={styles.content}>
        {loading && <div className={styles.stateBox}><Spin size="large" /></div>}

        {!loading && error && (
          <div className={styles.stateBox}>
            <Empty description="Không tìm thấy đơn hàng" />
            <Button type="primary" className={styles.newOrderBtn} onClick={() => navigate('/menu')}>Đặt món mới</Button>
          </div>
        )}

        {/* Account orders */}
        {!loading && !error && user && accountOrders.length > 0 && (
          <div className={styles.orderSection}>
            <h2 className={styles.sectionTitle}>Đơn hàng tài khoản của bạn</h2>
            <div className={styles.orderList}>
              {accountOrders.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className={`${styles.orderItem} ${order?.id === o.id ? styles.orderItemActive : ''}`}
                  onClick={() => handleSelect(o.id, o.code)}
                >
                  <div className={styles.orderItemLeft}>
                    <span className={styles.orderCode}>{o.code}</span>
                    <span className={styles.orderStatus} style={{ color: statusColor[o.status] ?? '#666' }}>
                      {statusLabel[o.status] ?? o.status}
                    </span>
                  </div>
                  <span className={styles.orderAmt}>{Number(o.totalAmount).toLocaleString('vi-VN')}đ</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Guest / session orders */}
        {!loading && !error && sessionOrders.length > 0 && (
          <div className={styles.orderSection}>
            <h2 className={styles.sectionTitle}>{user ? 'Đơn hàng vừa đặt' : 'Đơn trong phiên này'}</h2>
            <div className={styles.orderList}>
              {sessionOrders.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className={`${styles.orderItem} ${order?.id === o.id || order?.code === o.code ? styles.orderItemActive : ''}`}
                  onClick={() => handleSelect(o.id, o.code)}
                >
                  <div className={styles.orderItemLeft}>
                    <span className={styles.orderCode}>{o.code}</span>
                    <span className={styles.orderStatus} style={{ color: statusColor[o.status] ?? '#666' }}>
                      {statusLabel[o.status] ?? o.status}
                    </span>
                  </div>
                  <span className={styles.orderAmt}>{o.totalAmount.toLocaleString('vi-VN')}đ</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Result */}
        {!loading && order && (
          <div className={styles.resultGrid}>
            <div className={styles.card}>
              <div className={styles.cardMeta}>Mã đơn</div>
              <div className={styles.bigCode}>{order.code}</div>
              <div
                className={styles.statusPill}
                style={{ background: `${statusColor[order.status]}18`, color: statusColor[order.status] ?? '#666' }}
              >
                {statusLabel[order.status] ?? order.status}
              </div>
              <div className={styles.liveChip}>
                <span className={styles.liveDot} />
                Đang cập nhật trực tiếp
              </div>
            </div>

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Tiến trình</h2>
              <Steps
                current={currentStep}
                direction="vertical"
                items={steps.map((step, i) => ({
                  title: step,
                  status: i < currentStep ? 'finish' : i === currentStep ? 'process' : 'wait',
                }))}
              />
            </div>

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Chi tiết đơn</h2>
              <div className={styles.orderTypeBadge}>
                {orderType === 'dine-in'  && `🍽️ Dùng tại bàn ${order.table?.name ?? note.tableNumber ?? ''}`}
                {orderType === 'takeaway' && '🛍️ Mang về'}
                {orderType === 'delivery' && `🛵 Giao đến: ${note.customerAddress ?? ''}`}
              </div>
              <div className={styles.customerInfo}>
                {note.customerName  && <span>Khách hàng: <strong>{note.customerName}</strong></span>}
                {note.customerPhone && <span>SĐT: <strong>{note.customerPhone}</strong></span>}
                {note.paymentMethod && <span>Thanh toán: <strong>{note.paymentMethod === 'transfer' ? 'Chuyển khoản' : 'Tiền mặt'}</strong></span>}
                {note.customerNote  && <span>Ghi chú: <strong>{note.customerNote}</strong></span>}
              </div>
              {order.items.map((item) => (
                <div key={item.id} className={styles.orderRow}>
                  <span>
                    {item.productName} × {item.quantity}
                    {canReview && item.productId && (
                      reviewedProductIds.has(item.productId) ? (
                        <span style={{ marginLeft: 8, color: '#faad14', fontSize: 12 }}>★ Đã đánh giá</span>
                      ) : (
                        <Button
                          type="link"
                          size="small"
                          icon={<StarOutlined />}
                          style={{ padding: '0 4px', fontSize: 12 }}
                          onClick={() => setReviewTarget({ productId: item.productId!, productName: item.productName })}
                        >
                          Đánh giá
                        </Button>
                      )
                    )}
                  </span>
                  <span>{Number(item.totalPrice).toLocaleString('vi-VN')}đ</span>
                </div>
              ))}
              <div className={styles.divider} />
              <div className={styles.totalRow}>
                <span>Tổng cộng</span>
                <strong className={styles.totalAmt}>{total.toLocaleString('vi-VN')}đ</strong>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />

      <Modal
        title={`Đánh giá "${reviewTarget?.productName ?? ''}"`}
        open={!!reviewTarget}
        onOk={submitReview}
        onCancel={() => setReviewTarget(null)}
        okText="Gửi đánh giá"
        cancelText="Hủy"
        confirmLoading={reviewSubmitting}
      >
        <div style={{ textAlign: 'center', margin: '16px 0' }}>
          <Rate value={reviewRating} onChange={setReviewRating} style={{ fontSize: 32 }} />
        </div>
        <Input.TextArea
          rows={3}
          value={reviewComment}
          onChange={(e) => setReviewComment(e.target.value)}
          placeholder="Chia sẻ cảm nhận của bạn về món này (không bắt buộc)"
          maxLength={500}
        />
      </Modal>
    </div>
  )
}

export default OrderStatus
