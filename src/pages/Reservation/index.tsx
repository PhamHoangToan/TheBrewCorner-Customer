import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Form, Input, InputNumber, message } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import Navbar from '../../components/Navbar'
import { reservationService, type ApiReservation } from '../../services/reservation.service'
import { useCustomerAuthStore } from '../../store/auth.store'
import styles from './reservation.module.css'

interface ReservationForm {
  name: string
  phone: string
  numberOfGuests: number
  reservedTime: string
  note?: string
}

const STATUS_LABEL: Record<ApiReservation['status'], string> = {
  PENDING: 'Đang chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  CANCELLED: 'Đã huỷ',
  COMPLETED: 'Hoàn thành',
  NO_SHOW: 'Không đến',
}

const STATUS_CLASS: Record<ApiReservation['status'], string> = {
  PENDING: 'statusPending',
  CONFIRMED: 'statusConfirmed',
  CANCELLED: 'statusCancelled',
  COMPLETED: 'statusCompleted',
  NO_SHOW: 'statusNoShow',
}

const minDateTime = () => {
  const now = new Date(Date.now() + 30 * 60 * 1000)
  now.setSeconds(0, 0)
  return now.toISOString().slice(0, 16)
}

const ReservationPage: React.FC = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm<ReservationForm>()
  const user = useCustomerAuthStore((state) => state.user)
  const [submitting, setSubmitting] = useState(false)
  const [history, setHistory] = useState<ApiReservation[]>([])

  useEffect(() => {
    if (!user) return
    form.setFieldsValue({ name: user.name, phone: user.phone ?? undefined })
    reservationService.listByCustomer(user.id)
      .then((res) => setHistory(res.items))
      .catch(() => setHistory([]))
  }, [form, user])

  const handleSubmit = async (values: ReservationForm) => {
    setSubmitting(true)
    try {
      const reservation = await reservationService.create({
        customerId: user?.id,
        customerName: values.name,
        customerPhone: values.phone,
        numberOfGuests: values.numberOfGuests,
        reservedTime: new Date(values.reservedTime).toISOString(),
        note: values.note,
      })
      message.success('Đã gửi yêu cầu đặt bàn — quán sẽ liên hệ xác nhận sớm')
      setHistory((prev) => [reservation, ...prev])
      form.resetFields(['reservedTime', 'numberOfGuests', 'note'])
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không thể gửi yêu cầu đặt bàn')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <Navbar />

      <div className={styles.heroStrip}>
        <div className={styles.heroStripInner}>
          <button
            type="button"
            style={{
              background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 10, color: '#FEE1BF', fontWeight: 600, fontSize: 13, cursor: 'pointer',
              padding: '7px 16px', display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 20,
            }}
            onClick={() => navigate(-1)}
          >
            <ArrowLeftOutlined /> Quay lại
          </button>
          <h1 className={styles.title}>Đặt bàn trước</h1>
          <p className={styles.subtitle}>Giữ chỗ trước để không phải chờ vào giờ cao điểm</p>
        </div>
      </div>

      <div className={styles.content}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ numberOfGuests: 2, name: user?.name, phone: user?.phone ?? undefined }}
        >
          <div className={styles.formSection}>
            <Form.Item name="name" label="Họ tên" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
              <Input size="large" placeholder="Nguyễn Văn A" />
            </Form.Item>
            <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, message: 'Vui lòng nhập SĐT' }]}>
              <Input size="large" placeholder="0901234567" />
            </Form.Item>
            <Form.Item name="numberOfGuests" label="Số khách" rules={[{ required: true, message: 'Vui lòng nhập số khách' }]}>
              <InputNumber size="large" min={1} max={30} style={{ width: '100%' }} />
            </Form.Item>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="reservedTime">Ngày giờ đến</label>
              <Form.Item
                name="reservedTime"
                rules={[{ required: true, message: 'Vui lòng chọn ngày giờ đến' }]}
                noStyle
              >
                <input id="reservedTime" type="datetime-local" min={minDateTime()} className={styles.dateTimeInput} />
              </Form.Item>
            </div>
            <Form.Item name="note" label="Ghi chú (tuỳ chọn)">
              <Input.TextArea rows={3} placeholder="VD: Bàn gần cửa sổ, cần ghế trẻ em..." />
            </Form.Item>
          </div>

          <Button type="primary" htmlType="submit" block size="large" loading={submitting} className={styles.submitBtn}>
            Gửi yêu cầu đặt bàn
          </Button>
        </Form>

        {user && history.length > 0 && (
          <div className={styles.formSection} style={{ marginTop: 24 }}>
            <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, marginBottom: 8 }}>
              Lịch sử đặt bàn của bạn
            </h3>
            {history.map((r) => (
              <div key={r.id} className={styles.historyItem}>
                <div className={styles.historyMeta}>
                  {new Date(r.reservedTime).toLocaleString('vi-VN')} — {r.numberOfGuests} khách
                </div>
                <span className={`${styles.statusBadge} ${styles[STATUS_CLASS[r.status]]}`}>
                  {STATUS_LABEL[r.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ReservationPage
