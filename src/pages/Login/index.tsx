import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button, Form, Input, message } from 'antd'
import Navbar from '../../components/Navbar'
import { authService } from '../../services/auth.service'
import { useCustomerAuthStore } from '../../store/auth.store'
import styles from './auth.module.css'

interface LoginForm {
  username: string
  password: string
}

const LoginPage: React.FC = () => {
  const [form] = Form.useForm<LoginForm>()
  const [loading, setLoading] = useState(false)
  const setAuth = useCustomerAuthStore((state) => state.setAuth)
  const navigate = useNavigate()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const redirectTo = params.get('redirect') ?? '/menu'
  const initialEmail = params.get('email') ?? ''

  const handleSubmit = async (values: LoginForm) => {
    setLoading(true)
    try {
      const response = await authService.login(values)
      if (response.user.role !== 'customer') {
        message.error('Tài khoản này không phải tài khoản khách hàng')
        return
      }
      setAuth(response.user, response.token ?? response.access_token ?? '')
      message.success('Đăng nhập thành công')
      navigate(redirectTo, { replace: true })
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không thể đăng nhập')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.content}>
        <section className={styles.panel}>
          <div className={styles.header}>
            <p className={styles.kicker}>The Brew Corner</p>
            <h1>Đăng nhập</h1>
            <p>Đăng nhập để lưu thông tin đặt hàng và tra cứu đơn nhanh hơn.</p>
          </div>

          <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ username: initialEmail }}>
            <Form.Item
              name="username"
              label="Email hoặc số điện thoại"
              rules={[{ required: true, message: 'Vui lòng nhập email hoặc số điện thoại' }]}
            >
              <Input size="large" placeholder="email@example.com" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
            >
              <Input.Password size="large" placeholder="Nhập mật khẩu" />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
              className={styles.submitBtn}
            >
              Đăng nhập
            </Button>
          </Form>

          <div className={styles.footerText}>
            Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
          </div>
        </section>
      </main>
    </div>
  )
}

export default LoginPage
