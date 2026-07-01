import React, { useEffect, useState } from 'react'
import { Button, Form, Input, message } from 'antd'
import { EnvironmentOutlined, MailOutlined, PhoneOutlined, SaveOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { userService, type LoyaltyInfo } from '../../services/user.service'
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
    })
    userService.getLoyalty(user.id).then(setLoyalty).catch(() => setLoyalty(null))
  }, [form, navigate, user])

  const handleSubmit = async (values: ProfileForm) => {
    if (!user) return
    setSaving(true)
    try {
      const nextUser = await userService.updateProfile(user.id, {
        name:    values.name.trim(),
        email:   values.email.trim(),
        phone:   values.phone.trim(),
        address: values.address?.trim(),
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

      <Footer />
    </div>
  )
}

export default ProfilePage
