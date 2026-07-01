import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Form, Input, Radio, Select, Space, message } from 'antd'
import { ArrowLeftOutlined, CheckCircleFilled, CopyOutlined, GiftOutlined, TagOutlined } from '@ant-design/icons'
import Navbar from '../../components/Navbar'
import { guestOrdersService } from '../../services/guest-orders.service'
import { orderService } from '../../services/order.service'
import { pendingTransferService } from '../../services/pending-transfer.service'
import { promotionService, type Promotion } from '../../services/promotion.service'
import { tableService, type ApiTable } from '../../services/table.service'
import { useCustomerAuthStore } from '../../store/auth.store'
import { useCartStore, useCartTotal } from '../../store/cart.store'
import { buildVietQRUrl, VIETQR_BANK } from '../../config/vietqr'
import styles from './checkout.module.css'

interface CheckoutForm {
  name: string
  phone: string
  address?: string
  tableNumber?: string
  note?: string
  payment: 'cash' | 'transfer'
}

interface AppliedPromotion {
  code: string
  name: string
  discountPercent: number
  discountAmount: number
  minOrderAmount: number
}

const discountFor = (total: number, percent: number) => Math.round((total * percent) / 100)

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm<CheckoutForm>()
  const { items, orderType, tableNumber, clearCart } = useCartStore()
  const user = useCustomerAuthStore((state) => state.user)
  const [submitting, setSubmitting] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash')
  const [transferCode, setTransferCode] = useState<string | null>(null)
  const [transferStatus, setTransferStatus] = useState<'idle' | 'creating' | 'WAITING' | 'PAID'>('idle')
  const [validPromotions, setValidPromotions] = useState<Promotion[]>([])
  const [promoCode, setPromoCode] = useState('')
  const [appliedPromotion, setAppliedPromotion] = useState<AppliedPromotion | null>(null)
  const [availableTables, setAvailableTables] = useState<ApiTable[]>([])
  const [tablesLoading, setTablesLoading] = useState(false)
  const total = useCartTotal()
  const discountAmount = appliedPromotion?.discountAmount ?? 0
  const payableTotal = Math.max(total - discountAmount, 0)

  useEffect(() => {
    if (items.length === 0) navigate('/menu')
  }, [items.length, navigate])

  useEffect(() => {
    if (!user) return
    form.setFieldsValue({
      name: user.name,
      phone: user.phone ?? undefined,
      address: user.address ?? undefined,
    })
  }, [form, user])

  useEffect(() => {
    let mounted = true
    promotionService
      .listValid(total)
      .then((items) => { if (mounted) setValidPromotions(items) })
      .catch(() => { if (mounted) setValidPromotions([]) })
    return () => { mounted = false }
  }, [total])

  useEffect(() => {
    if (orderType !== 'dine-in') return
    let mounted = true
    setTablesLoading(true)
    tableService.listAvailable()
      .then((res) => { if (mounted) setAvailableTables(res.items ?? []) })
      .catch(() => { if (mounted) setAvailableTables([]) })
      .finally(() => { if (mounted) setTablesLoading(false) })
    return () => { mounted = false }
  }, [orderType])

  // Khách quét mã QR tại bàn: cart lưu sẵn số bàn thô (VD "001") — khớp với mã bàn thật vừa tải
  useEffect(() => {
    if (!tableNumber || availableTables.length === 0) return
    const match = availableTables.find((t) => t.code.replace(/^BAN-/i, '') === tableNumber)
    if (match) form.setFieldValue('tableNumber', match.code)
  }, [availableTables, tableNumber, form])

  useEffect(() => {
    setAppliedPromotion((current) => {
      if (!current) return current
      if (total < current.minOrderAmount) {
        message.warning(`Đơn hàng không còn đủ điều kiện áp dụng mã ${current.code}`)
        return null
      }
      return { ...current, discountAmount: discountFor(total, current.discountPercent) }
    })
  }, [total])

  useEffect(() => {
    if (paymentMethod !== 'transfer' || transferStatus === 'PAID' || payableTotal <= 0) return
    let cancelled = false
    setTransferStatus('creating')
    pendingTransferService
      .create(payableTotal)
      .then((pt) => {
        if (cancelled) return
        setTransferCode(pt.code)
        setTransferStatus('WAITING')
      })
      .catch(() => { if (!cancelled) setTransferStatus('idle') })
    return () => { cancelled = true }
  }, [paymentMethod, payableTotal])

  useEffect(() => {
    if (!transferCode || transferStatus !== 'WAITING') return
    const interval = setInterval(() => {
      pendingTransferService
        .get(transferCode)
        .then((pt) => {
          if (pt.status === 'PAID') {
            setTransferStatus('PAID')
            message.success('Đã nhận được chuyển khoản!')
          }
        })
        .catch(() => {})
    }, 3000)
    return () => clearInterval(interval)
  }, [transferCode, transferStatus])

  const applyPromotion = (promotion: Promotion) => {
    setAppliedPromotion({
      code: promotion.code,
      name: promotion.name,
      discountPercent: Number(promotion.discountPercent),
      discountAmount: discountFor(total, Number(promotion.discountPercent)),
      minOrderAmount: Number(promotion.minOrderAmount ?? 0),
    })
    setPromoCode(promotion.code)
    message.success(`Đã áp dụng mã ${promotion.code}`)
  }

  const handleSelectPromotion = (code: string) => {
    const promotion = validPromotions.find((item) => item.code === code)
    if (promotion) applyPromotion(promotion)
  }

  const handleApplyManualCode = async () => {
    const code = promoCode.trim().toUpperCase()
    if (!code) { message.warning('Vui lòng nhập mã giảm giá'); return }
    try {
      const result = await promotionService.validate(code, total)
      setAppliedPromotion({
        code: result.promotion.code,
        name: result.promotion.name,
        discountPercent: Number(result.promotion.discountPercent),
        discountAmount: Number(result.discountAmount),
        minOrderAmount: Number(result.promotion.minOrderAmount ?? 0),
      })
      setPromoCode(result.promotion.code)
      message.success(`Đã áp dụng mã ${result.promotion.code}`)
    } catch (error) {
      setAppliedPromotion(null)
      message.error(error instanceof Error ? error.message : 'Mã giảm giá không hợp lệ')
    }
  }

  const handleSubmit = async (values: CheckoutForm) => {
    if (values.payment === 'transfer' && transferStatus !== 'PAID') {
      message.warning('Vui lòng chuyển khoản và chờ xác nhận trước khi đặt hàng')
      return
    }
    setSubmitting(true)
    try {
      const order = await orderService.create({
        values, items, subtotal: total, total: payableTotal,
        discountAmount, promotionCode: appliedPromotion?.code,
        promotionName: appliedPromotion?.name,
        promotionDiscountPercent: appliedPromotion?.discountPercent,
        orderType, customerId: user?.id,
        pendingTransferCode: values.payment === 'transfer' ? transferCode ?? undefined : undefined,
      })
      guestOrdersService.save(order, user?.id)
      clearCart()
      navigate(`/order/${order.id}`, { state: { order } })
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không thể tạo đơn hàng')
    } finally {
      setSubmitting(false)
    }
  }

  if (items.length === 0) return null

  return (
    <div className={styles.page}>
      <Navbar />

      <div className={styles.heroStrip}>
        <div className={styles.heroStripInner}>
          <button type="button" className={styles.backBtn} onClick={() => navigate(-1)}>
            <ArrowLeftOutlined /> Quay lại
          </button>
          <h1 className={styles.title}>Đặt hàng</h1>
          <p className={styles.subtitle}>Kiểm tra thông tin và xác nhận đơn</p>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.layout}>
          <div className={styles.left}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                payment: 'cash',
                name: user?.name,
                phone: user?.phone ?? undefined,
                address: user?.address ?? undefined,
              }}
            >
              {/* Thông tin khách hàng */}
              <div className={styles.formSection}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionNum}>1</div>
                  <h3 className={styles.sectionTitle}>Thông tin khách hàng</h3>
                </div>
                <Form.Item name="name" label="Họ tên" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
                  <Input size="large" placeholder="Nguyễn Văn A" />
                </Form.Item>
                <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, message: 'Vui lòng nhập SĐT' }]}>
                  <Input size="large" placeholder="0901234567" />
                </Form.Item>
                {orderType === 'delivery' && (
                  <Form.Item name="address" label="Địa chỉ nhận hàng" rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}>
                    <Input.TextArea rows={3} placeholder="Số nhà, tên đường, phường/xã, quận/huyện" />
                  </Form.Item>
                )}
              </div>

              {/* Hình thức nhận */}
              <div className={styles.formSection}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionNum}>2</div>
                  <h3 className={styles.sectionTitle}>Hình thức nhận</h3>
                </div>
                <div className={styles.orderTypeBadge}>
                  {orderType === 'dine-in'  && '🍽️  Dùng tại quán'}
                  {orderType === 'takeaway' && '🛍️  Mang về'}
                  {orderType === 'delivery' && '🛵  Giao tận nơi'}
                </div>
                {orderType === 'dine-in' && (
                  <Form.Item name="tableNumber" label="Số bàn" rules={[{ required: true, message: 'Vui lòng chọn bàn' }]}>
                    <Select
                      size="large"
                      loading={tablesLoading}
                      placeholder={tablesLoading ? 'Đang tải danh sách bàn...' : 'Chọn bàn'}
                      notFoundContent={tablesLoading ? 'Đang tải...' : 'Hiện không còn bàn trống'}
                      options={availableTables.map((t) => ({ value: t.code, label: t.name }))}
                    />
                  </Form.Item>
                )}
              </div>

              {/* Thanh toán */}
              <div className={styles.formSection}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionNum}>3</div>
                  <h3 className={styles.sectionTitle}>Thanh toán</h3>
                </div>
                <Form.Item name="payment">
                  <Radio.Group onChange={(e) => setPaymentMethod(e.target.value)}>
                    <Space direction="vertical" size={12}>
                      <Radio value="cash" className={styles.radio}>
                        <span>💵 <strong>Tiền mặt</strong> — Thanh toán khi nhận hàng</span>
                      </Radio>
                      <Radio value="transfer" className={styles.radio}>
                        <span>📱 <strong>Chuyển khoản</strong> — QR Code ngân hàng</span>
                      </Radio>
                    </Space>
                  </Radio.Group>
                </Form.Item>

                {paymentMethod === 'transfer' && (() => {
                  const transferContent = transferCode ? `TheBrewCorner ${transferCode}` : 'Đang tạo mã chuyển khoản...'
                  return (
                  <div className={styles.qrBox}>
                    <div className={styles.qrBoxHeader}>
                      <span className={styles.qrBoxTitle}>Quét mã để chuyển khoản</span>
                      <span className={styles.qrBoxWaiting}>
                        <span className={styles.qrBoxDot} />
                        {transferStatus === 'PAID' ? 'Đã nhận được chuyển khoản ✓' : 'Chờ xác nhận chuyển khoản'}
                      </span>
                    </div>
                    <div className={styles.qrBoxBody}>
                      {transferCode ? (
                        <img
                          src={buildVietQRUrl(payableTotal, transferCode)}
                          alt="VietQR"
                          className={styles.qrBoxImage}
                        />
                      ) : null}
                      <div className={styles.qrBoxInfo}>
                        <div className={styles.qrBoxBank}>ACB</div>
                        <div className={styles.qrBoxField}>
                          <span className={styles.qrBoxLabel}>Số tài khoản</span>
                          <span className={styles.qrBoxValue}>
                            {VIETQR_BANK.accountNo}
                            <button
                              type="button"
                              className={styles.qrBoxCopy}
                              onClick={() => {
                                navigator.clipboard.writeText(VIETQR_BANK.accountNo)
                                message.success('Đã sao chép STK')
                              }}
                            >
                              <CopyOutlined />
                            </button>
                          </span>
                        </div>
                        <div className={styles.qrBoxField}>
                          <span className={styles.qrBoxLabel}>Chủ tài khoản</span>
                          <span className={styles.qrBoxValue}>{VIETQR_BANK.accountName}</span>
                        </div>
                        <div className={styles.qrBoxField}>
                          <span className={styles.qrBoxLabel}>Số tiền</span>
                          <span className={`${styles.qrBoxValue} ${styles.qrBoxAmount}`}>
                            {payableTotal.toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                        <div className={styles.qrBoxField}>
                          <span className={styles.qrBoxLabel}>Nội dung CK</span>
                          <span className={styles.qrBoxValue}>
                            {transferContent}
                            <button
                              type="button"
                              className={styles.qrBoxCopy}
                              disabled={!transferCode}
                              onClick={() => {
                                navigator.clipboard.writeText(transferContent)
                                message.success('Đã sao chép')
                              }}
                            >
                              <CopyOutlined />
                            </button>
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className={styles.qrBoxNote}>
                      {transferStatus === 'PAID'
                        ? 'Đã nhận được chuyển khoản — bấm "Đã chuyển khoản — Xác nhận đặt hàng" để hoàn tất đơn.'
                        : 'Chuyển khoản đúng nội dung ở trên — hệ thống sẽ tự động xác nhận, nút đặt hàng sẽ mở khoá ngay khi nhận được tiền.'}
                    </p>
                  </div>
                  )
                })()}
              </div>

              {/* Mã giảm giá */}
              <div className={styles.formSection}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionNum}><TagOutlined /></div>
                  <h3 className={styles.sectionTitle}>Mã giảm giá</h3>
                </div>
                {validPromotions.length > 0 && (
                  <>
                    <Select
                      size="large"
                      allowClear
                      placeholder="Chọn mã giảm giá có sẵn"
                      className={styles.promoSelect}
                      value={appliedPromotion?.code}
                      onChange={(value) => {
                        if (!value) { setAppliedPromotion(null); setPromoCode(''); return }
                        handleSelectPromotion(value)
                      }}
                      options={validPromotions.map((p) => ({
                        value: p.code,
                        label: `${p.code} — ${p.name} (${p.discountPercent}%)`,
                      }))}
                    />
                    <div className={styles.promoList}>
                      {validPromotions.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className={`${styles.promoItem} ${appliedPromotion?.code === p.code ? styles.promoItemActive : ''}`}
                          onClick={() => applyPromotion(p)}
                        >
                          {appliedPromotion?.code === p.code && <CheckCircleFilled className={styles.promoCheck} />}
                          <strong>{p.code}</strong>
                          <span>{p.name}</span>
                          <small>{p.conditionText || `Giảm ${p.discountPercent}%`}</small>
                        </button>
                      ))}
                    </div>
                  </>
                )}
                <div className={styles.promoManual}>
                  <Input
                    size="large"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    onPressEnter={handleApplyManualCode}
                    placeholder="Nhập mã giảm giá"
                    prefix={<GiftOutlined style={{ color: '#662C21' }} />}
                  />
                  <Button size="large" onClick={handleApplyManualCode} className={styles.applyBtn}>
                    Áp dụng
                  </Button>
                </div>
                {appliedPromotion && (
                  <div className={styles.appliedPromo}>
                    <span>✅ Đang áp dụng <strong>{appliedPromotion.code}</strong>: giảm {discountAmount.toLocaleString('vi-VN')}đ</span>
                    <button type="button" onClick={() => { setAppliedPromotion(null); setPromoCode('') }}>Bỏ mã</button>
                  </div>
                )}
              </div>

              {/* Ghi chú */}
              <div className={styles.formSection}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionNum}>4</div>
                  <h3 className={styles.sectionTitle}>Ghi chú (tùy chọn)</h3>
                </div>
                <Form.Item name="note">
                  <Input.TextArea rows={3} placeholder="VD: Ít đường, nhiều đá, không hành..." />
                </Form.Item>
              </div>

              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={submitting}
                disabled={paymentMethod === 'transfer' && transferStatus !== 'PAID'}
                className={styles.submitBtn}
              >
                {submitting
                  ? 'Đang xử lý...'
                  : paymentMethod === 'transfer'
                    ? transferStatus === 'PAID'
                      ? 'Đã chuyển khoản — Xác nhận đặt hàng'
                      : 'Đang chờ xác nhận chuyển khoản...'
                    : `Xác nhận đặt hàng — ${payableTotal.toLocaleString('vi-VN')}đ`}
              </Button>
            </Form>
          </div>

          <div className={styles.right}>
            <div className={styles.orderSummary}>
              <h3 className={styles.summaryTitle}>Đơn hàng của bạn</h3>
              {items.map((item) => (
                <div key={item.id} className={styles.summaryRow}>
                  <span className={styles.summaryName}>{item.name} <span className={styles.summaryQty}>×{item.qty}</span></span>
                  <span>{(item.price * item.qty).toLocaleString('vi-VN')}đ</span>
                </div>
              ))}
              <div className={styles.divider} />
              <div className={styles.summaryRow}>
                <span>Tạm tính</span>
                <span>{total.toLocaleString('vi-VN')}đ</span>
              </div>
              {discountAmount > 0 && (
                <div className={`${styles.summaryRow} ${styles.discountRow}`}>
                  <span>Giảm giá {appliedPromotion?.code ? `(${appliedPromotion.code})` : ''}</span>
                  <span>−{discountAmount.toLocaleString('vi-VN')}đ</span>
                </div>
              )}
              <div className={styles.totalRow}>
                <span>Tổng thanh toán</span>
                <span className={styles.totalAmount}>{payableTotal.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutPage
