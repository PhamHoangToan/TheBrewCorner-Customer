import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Button, Empty, Spin, Steps, message } from 'antd'
import { CheckCircleFilled, ClockCircleFilled, CopyOutlined, HomeOutlined, ReloadOutlined } from '@ant-design/icons'
import Navbar from '../../components/Navbar'
import { guestOrdersService } from '../../services/guest-orders.service'
import { orderService, readOrderNote, type ApiOrder } from '../../services/order.service'
import { buildVietQRUrl, VIETQR_BANK } from '../../config/vietqr'
import { useOrderSocket } from '../../hooks/useOrderSocket'
import styles from './orderTracking.module.css'

const STEPS_DINE_IN  = ['Đã nhận đơn', 'Đang pha chế', 'Phục vụ tại bàn', 'Hoàn thành']
const STEPS_TAKEAWAY = ['Đã nhận đơn', 'Đang pha chế', 'Sẵn sàng lấy', 'Hoàn thành']
const STEPS_DELIVERY = ['Đã nhận đơn', 'Đang pha chế', 'Đang giao hàng', 'Đã giao']

const statusToStep = (status?: string) => {
  if (status === 'PAID' || status === 'SERVED') return 3
  if (status === 'READY') return 2
  if (status === 'PREPARING') return 1
  return 0
}

const OrderTracking: React.FC = () => {
  const { id } = useParams()
  const { state } = useLocation() as { state?: { order?: ApiOrder } }
  const navigate = useNavigate()
  const [order, setOrder] = useState<ApiOrder | null>(state?.order ?? null)
  const [loading, setLoading] = useState(!state?.order)
  const [error, setError] = useState<string | null>(null)

  const loadOrder = useCallback((silent = false) => {
    if (!id) return
    if (!silent) setLoading(true)
    orderService.get(id)
      .then((data) => {
        setOrder(data)
        guestOrdersService.update(data)
        setError(null)
      })
      .catch((err) => {
        if (!silent) setError(err instanceof Error ? err.message : 'Không tìm thấy đơn hàng')
      })
      .finally(() => { if (!silent) setLoading(false) })
  }, [id])

  useEffect(() => {
    loadOrder(!!state?.order)
    // Polling 30s chỉ làm fallback — cập nhật realtime chính đến từ WebSocket (useOrderSocket bên dưới)
    const timer = window.setInterval(() => loadOrder(true), 30000)
    return () => window.clearInterval(timer)
  }, [loadOrder, state?.order])

  useOrderSocket(id, () => loadOrder(true))

  const note = readOrderNote(order?.note)
  const orderType = note.customerOrderType ?? (order?.type === 'DINE_IN' ? 'dine-in' : 'takeaway')
  const total = Number(order?.totalAmount ?? 0)
  const steps = orderType === 'dine-in' ? STEPS_DINE_IN : orderType === 'delivery' ? STEPS_DELIVERY : STEPS_TAKEAWAY
  const currentStep = useMemo(() => statusToStep(order?.status), [order?.status])

  if (loading) return (
    <div className={styles.page}><Navbar />
      <div className={styles.centerState}><Spin size="large" /></div>
    </div>
  )

  if (!order || error) return (
    <div className={styles.page}><Navbar />
      <div className={styles.centerState}>
        <Empty description={error ?? 'Không tìm thấy đơn hàng'} />
        <Button type="primary" className={styles.homeBtn} onClick={() => navigate('/menu')}>Đặt món mới</Button>
      </div>
    </div>
  )

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.content}>

        {/* Success / Pending-payment header */}
        {note.paymentMethod === 'transfer' && order.status !== 'PAID' ? (
          <div className={`${styles.successBlock} ${styles.pendingBlock}`}>
            <div className={styles.checkWrap}>
              <ClockCircleFilled className={styles.pendingIcon} />
            </div>
            <h1 className={styles.title}>Đơn đã được tạo!</h1>
            <div className={styles.orderId}>
              Mã đơn: <strong>{order.code}</strong>
            </div>
            <div className={`${styles.liveChip} ${styles.pendingChip}`}>
              <span className={`${styles.liveDot} ${styles.pendingDot}`} />
              Chờ xác nhận chuyển khoản
            </div>
            <p className={styles.pendingHint}>
              Quét mã QR bên dưới để thanh toán — quán sẽ xác nhận và bắt đầu pha chế ngay sau đó.
            </p>
          </div>
        ) : (
          <div className={styles.successBlock}>
            <div className={styles.checkWrap}>
              <CheckCircleFilled className={styles.checkIcon} />
            </div>
            <h1 className={styles.title}>Đặt hàng thành công!</h1>
            <div className={styles.orderId}>
              Mã đơn: <strong>{order.code}</strong>
            </div>
            <div className={styles.liveChip}>
              <span className={styles.liveDot} />
              Đang cập nhật trực tiếp
            </div>
          </div>
        )}

        {/* VietQR payment card — chỉ hiện khi chuyển khoản + chưa PAID */}
        {note.paymentMethod === 'transfer' && order.status !== 'PAID' && order.status !== 'CANCELLED' && (
          <div className={styles.qrCard}>
            <div className={styles.qrHeader}>
              <span className={styles.qrBadge}>📱 Chuyển khoản VietQR</span>
              <span className={styles.qrWaiting}>
                <span className={styles.qrDot} />
                Chờ xác nhận
              </span>
            </div>
            <div className={styles.qrBody}>
              <img
                src={buildVietQRUrl(total, order.code)}
                alt="VietQR"
                className={styles.qrImage}
              />
              <div className={styles.qrInfo}>
                <div className={styles.qrBank}>ACB</div>
                <div className={styles.qrField}>
                  <span className={styles.qrLabel}>Số tài khoản</span>
                  <span className={styles.qrValue}>
                    {VIETQR_BANK.accountNo}
                    <button
                      type="button"
                      className={styles.qrCopyBtn}
                      onClick={() => {
                        navigator.clipboard.writeText(VIETQR_BANK.accountNo)
                        message.success('Đã sao chép số tài khoản')
                      }}
                    >
                      <CopyOutlined />
                    </button>
                  </span>
                </div>
                <div className={styles.qrField}>
                  <span className={styles.qrLabel}>Chủ tài khoản</span>
                  <span className={styles.qrValue}>{VIETQR_BANK.accountName}</span>
                </div>
                <div className={styles.qrField}>
                  <span className={styles.qrLabel}>Số tiền</span>
                  <span className={`${styles.qrValue} ${styles.qrAmount}`}>
                    {total.toLocaleString('vi-VN')}đ
                  </span>
                </div>
                <div className={styles.qrField}>
                  <span className={styles.qrLabel}>Nội dung CK</span>
                  <span className={styles.qrValue}>
                    TheBrewCorner {order.code}
                    <button
                      type="button"
                      className={styles.qrCopyBtn}
                      onClick={() => {
                        navigator.clipboard.writeText(`TheBrewCorner ${order.code}`)
                        message.success('Đã sao chép nội dung')
                      }}
                    >
                      <CopyOutlined />
                    </button>
                  </span>
                </div>
                <p className={styles.qrNote}>
                  Quét mã QR hoặc chuyển khoản theo thông tin trên. Quán sẽ xác nhận và bắt đầu chuẩn bị đơn ngay khi nhận được tiền.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tracking stepper */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Trạng thái đơn hàng</h3>
          <Steps
            current={currentStep}
            direction="vertical"
            items={steps.map((step, i) => ({
              title: step,
              status: i < currentStep ? 'finish' : i === currentStep ? 'process' : 'wait',
            }))}
          />
        </div>

        {/* Order detail */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Chi tiết đơn</h3>
          <div className={styles.orderTypeBadge}>
            {orderType === 'dine-in'  && `🍽️ Dùng tại bàn ${note.tableNumber ?? order.table?.name ?? ''}`}
            {orderType === 'takeaway' && '🛍️ Mang về'}
            {orderType === 'delivery' && `🛵 Giao đến: ${note.customerAddress ?? ''}`}
          </div>
          {order.items.map((item) => (
            <div key={item.id} className={styles.orderRow}>
              <span>{item.productName} × {item.quantity}</span>
              <span>{Number(item.totalPrice).toLocaleString('vi-VN')}đ</span>
            </div>
          ))}
          <div className={styles.divider} />
          <div className={styles.totalRow}>
            <span>Tổng cộng</span>
            <span className={styles.totalAmount}>{total.toLocaleString('vi-VN')}đ</span>
          </div>
        </div>

        <div className={styles.actions}>
          <Button type="primary" size="large" icon={<HomeOutlined />} className={styles.homeBtn} onClick={() => navigate('/')}>
            Về trang chủ
          </Button>
          <Button size="large" icon={<ReloadOutlined />} className={styles.menuBtn} onClick={() => navigate('/menu')}>
            Đặt thêm
          </Button>
        </div>
      </div>
    </div>
  )
}

export default OrderTracking
