import React, { useEffect, useState } from 'react'
import { Button, DatePicker, Form, Input, InputNumber, Modal, Tag, message } from 'antd'
import { EnvironmentOutlined, GiftOutlined, MailOutlined, PhoneOutlined, SaveOutlined, WalletOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs, { type Dayjs } from 'dayjs'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { userService, type LoyaltyInfo } from '../../services/user.service'
import { voucherService, type PersonalVoucher } from '../../services/voucher.service'
import { walletService, type WalletSummary } from '../../services/wallet.service'
import { pendingTransferService } from '../../services/pending-transfer.service'
import { buildVietQRUrl, VIETQR_BANK } from '../../config/vietqr'
import { useCustomerAuthStore } from '../../store/auth.store'
import styles from './profile.module.css'

const TIER_LABEL: Record<LoyaltyInfo['membershipTier'], string> = {
  BASIC: 'Thành viên',
  SILVER: 'Bạc',
  GOLD: 'Vàng',
}

const TXN_LABEL: Record<LoyaltyInfo['transactions'][number]['type'], string> = {
  EARN: 'Tích điểm',
  REDEEM: 'Đổi điểm',
  ADJUST: 'Điều chỉnh',
}

interface ProfileForm {
  name: string
  email: string
  phone: string
  address?: string
  birthday?: Dayjs | null
}

const VOUCHER_STATUS_LABEL: Record<PersonalVoucher['status'], { label: string; color: string }> = {
  ACTIVE: { label: 'Còn hạn', color: 'green' },
  USED: { label: 'Đã dùng', color: 'default' },
  EXPIRED: { label: 'Hết hạn', color: 'red' },
}

const getInitials = (name: string) =>
  name.split(' ').map((w) => w[0]).slice(-2).join('').toUpperCase()

const ProfilePage: React.FC = () => {
  const [form] = Form.useForm<ProfileForm>()
  const [saving, setSaving] = useState(false)
  const user = useCustomerAuthStore((state) => state.user)
  const updateUser = useCustomerAuthStore((state) => state.updateUser)
  const navigate = useNavigate()
  const [loyalty, setLoyalty] = useState<LoyaltyInfo | null>(null)
  const [vouchers, setVouchers] = useState<PersonalVoucher[]>([])
  const [wallet, setWallet] = useState<WalletSummary | null>(null)
  const [topupOpen, setTopupOpen] = useState(false)
  const [topupAmount, setTopupAmount] = useState(100000)
  const [topupCode, setTopupCode] = useState<string | null>(null)
  const [topupPaid, setTopupPaid] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/profile', { replace: true })
      return
    }
    form.setFieldsValue({
      name:    user.name,
      email:   user.email ?? '',
      phone:   user.phone ?? '',
      address: user.address ?? '',
      birthday: user.birthday ? dayjs(user.birthday) : null,
    })
    userService.getLoyalty(user.id).then(setLoyalty).catch(() => setLoyalty(null))
    voucherService.my(user.id).then(setVouchers).catch(() => setVouchers([]))
    walletService.get(user.id).then(setWallet).catch(() => setWallet(null))
  }, [form, navigate, user])

  // Poll trạng thái chuyển khoản nạp ví
  useEffect(() => {
    if (!topupCode || topupPaid) return
    const timer = setInterval(async () => {
      try {
        const pt = await pendingTransferService.get(topupCode)
        if (pt.status === 'PAID') { setTopupPaid(true); clearInterval(timer) }
      } catch { /* noop */ }
    }, 3000)
    return () => clearInterval(timer)
  }, [topupCode, topupPaid])

  const startTopup = async () => {
    if (!user || topupAmount < 10000) { message.warning('Số tiền nạp tối thiểu 10.000đ'); return }
    try {
      const pt = await pendingTransferService.create(topupAmount)
      setTopupCode(pt.code)
      setTopupPaid(false)
    } catch {
      message.error('Không tạo được yêu cầu nạp')
    }
  }

  const confirmTopup = async () => {
    if (!user || !topupCode) return
    try {
      const summary = await walletService.topupConfirm(user.id, topupCode)
      setWallet(summary)
      message.success('Nạp ví thành công')
      setTopupOpen(false)
      setTopupCode(null)
      setTopupPaid(false)
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Nạp ví thất bại')
    }
  }

  const handleSubmit = async (values: ProfileForm) => {
    if (!user) return
    setSaving(true)
    try {
      const nextUser = await userService.updateProfile(user.id, {
        name:    values.name.trim(),
        email:   values.email.trim(),
        phone:   values.phone.trim(),
        address: values.address?.trim(),
        birthday: values.birthday ? values.birthday.format('YYYY-MM-DD') : undefined,
      })
      updateUser(nextUser)
      message.success('Cập nhật thông tin thành công!')
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không thể cập nhật thông tin')
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null

  return (
    <div className={styles.page}>
      <Navbar />

      {/* Hero strip */}
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.avatarWrap}>
            <div className={styles.avatar}>
              {getInitials(user.name)}
            </div>
            <div className={styles.avatarRing} />
          </div>
          <div className={styles.heroText}>
            <div className={styles.heroKicker}>Tài khoản thành viên</div>
            <h1 className={styles.heroName}>{user.name}</h1>
            <p className={styles.heroSub}>{user.email || user.phone || 'The Brew Corner member'}</p>
          </div>
        </div>
      </div>

      <main className={styles.content}>
        {loyalty && (
          <div className={styles.loyaltyCard}>
            <div className={styles.loyaltyHeader}>
              <div>
                <div className={styles.loyaltyPointsLabel}>Điểm tích lũy</div>
                <div className={styles.loyaltyPoints}>{loyalty.loyaltyPoints} điểm</div>
              </div>
              <span className={`${styles.tierBadge} ${styles[`tier${loyalty.membershipTier}`]}`}>
                Hạng {TIER_LABEL[loyalty.membershipTier]}
              </span>
            </div>
            {loyalty.transactions.length > 0 && (
              <div className={styles.loyaltyHistory}>
                {loyalty.transactions.slice(0, 5).map((t) => (
                  <div key={t.id} className={styles.loyaltyHistoryRow}>
                    <span>{TXN_LABEL[t.type]} — {t.description ?? ''}</span>
                    <span>{t.points > 0 ? '+' : ''}{t.points} điểm</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className={styles.panel}>
          <h2 className={styles.panelTitle}><WalletOutlined /> Ví của tôi</h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ color: '#888', fontSize: 13 }}>Số dư</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#662c21' }}>{(wallet?.balance ?? 0).toLocaleString('vi-VN')}đ</div>
            </div>
            <Button type="primary" style={{ background: '#662c21', borderColor: '#662c21' }} onClick={() => { setTopupOpen(true); setTopupCode(null); setTopupPaid(false) }}>
              Nạp ví
            </Button>
          </div>
          {wallet && wallet.transactions.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {wallet.transactions.slice(0, 5).map((t) => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#555' }}>
                  <span>{t.note ?? t.type}</span>
                  <span style={{ color: t.amount >= 0 ? '#166534' : '#b91c1c' }}>{t.amount >= 0 ? '+' : ''}{t.amount.toLocaleString('vi-VN')}đ</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {vouchers.length > 0 && (
          <div className={styles.panel}>
            <h2 className={styles.panelTitle}><GiftOutlined /> Voucher của tôi</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {vouchers.map((v) => (
                <div
                  key={v.id}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px', border: '1px dashed #d9b8a6', borderRadius: 10,
                    opacity: v.status === 'ACTIVE' ? 1 : 0.55,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>{v.name}</div>
                    <div style={{ fontSize: 12, color: '#7a5040' }}>
                      Mã <strong>{v.code}</strong> — giảm {v.discountPercent}% · HSD {dayjs(v.expiresAt).format('DD/MM/YYYY')}
                    </div>
                  </div>
                  <Tag color={VOUCHER_STATUS_LABEL[v.status].color}>{VOUCHER_STATUS_LABEL[v.status].label}</Tag>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>Thông tin cá nhân</h2>
          <p className={styles.panelDesc}>Cập nhật thông tin để trải nghiệm đặt hàng tốt hơn.</p>

          <Form form={form} layout="vertical" onFinish={handleSubmit} className={styles.form}>
            <div className={styles.formRow}>
              <Form.Item
                name="name"
                label="Họ tên"
                rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                className={styles.formItem}
              >
                <Input size="large" placeholder="Nguyễn Văn A" className={styles.input} />
              </Form.Item>

              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
                className={styles.formItem}
              >
                <Input size="large" placeholder="0901234567" prefix={<PhoneOutlined />} className={styles.input} />
              </Form.Item>
            </div>

            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Vui lòng nhập email' },
                { type: 'email', message: 'Email không hợp lệ' },
              ]}
            >
              <Input size="large" placeholder="email@example.com" prefix={<MailOutlined />} className={styles.input} />
            </Form.Item>

            <Form.Item
              name="birthday"
              label="Ngày sinh"
              extra="Nhập ngày sinh để nhận voucher giảm giá vào tháng sinh nhật 🎂"
            >
              <DatePicker
                size="large"
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                placeholder="Chọn ngày sinh"
                disabledDate={(d) => d.isAfter(dayjs())}
              />
            </Form.Item>

            <Form.Item name="address" label="Địa chỉ giao hàng">
              <Input.TextArea
                rows={3}
                placeholder="Số nhà, tên đường, phường/xã, quận/huyện"
                className={styles.input}
              />
            </Form.Item>

            <div className={styles.actions}>
              <Button size="large" className={styles.backBtn} onClick={() => navigate('/menu')}>
                Quay lại thực đơn
              </Button>
              <Button
                type="primary"
                size="large"
                htmlType="submit"
                loading={saving}
                icon={<SaveOutlined />}
                className={styles.submitBtn}
              >
                Lưu thay đổi
              </Button>
            </div>
          </Form>
        </div>

        <div className={styles.infoCard}>
          <div className={styles.infoIcon}><EnvironmentOutlined /></div>
          <div>
            <div className={styles.infoTitle}>Địa chỉ mặc định</div>
            <div className={styles.infoVal}>{user.address || 'Chưa cập nhật địa chỉ giao hàng'}</div>
          </div>
        </div>
      </main>

      <Modal title="Nạp ví" open={topupOpen} onCancel={() => setTopupOpen(false)} footer={null}>
        {!topupCode ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '12px 0' }}>
            <div style={{ fontWeight: 600 }}>Số tiền nạp</div>
            <InputNumber
              style={{ width: '100%' }}
              min={10000}
              step={10000}
              value={topupAmount}
              onChange={(v) => setTopupAmount(Number(v ?? 0))}
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(v) => Number((v ?? '').replace(/,/g, ''))}
              addonAfter="đ"
            />
            <Button type="primary" block style={{ background: '#662c21', borderColor: '#662c21' }} onClick={startTopup}>
              Tạo mã chuyển khoản
            </Button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', margin: '12px 0' }}>
            <img src={buildVietQRUrl(topupAmount, topupCode)} alt="QR" style={{ width: 220, height: 220 }} referrerPolicy="no-referrer" />
            <div style={{ fontSize: 13, color: '#555', marginTop: 8 }}>
              Chuyển <b>{topupAmount.toLocaleString('vi-VN')}đ</b> tới {VIETQR_BANK.accountNo} ({VIETQR_BANK.bankId})<br />
              Nội dung: <b>TheBrewCorner {topupCode}</b>
            </div>
            <Button
              type="primary"
              block
              disabled={!topupPaid}
              onClick={confirmTopup}
              style={{ marginTop: 16, background: topupPaid ? '#166534' : undefined, borderColor: topupPaid ? '#166534' : undefined }}
            >
              {topupPaid ? 'Đã nhận tiền — Xác nhận nạp ví' : 'Đang chờ chuyển khoản...'}
            </Button>
          </div>
        )}
      </Modal>

      <Footer />
    </div>
  )
}

export default ProfilePage
