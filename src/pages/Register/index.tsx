import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Form, Input, message } from 'antd'
import Navbar from '../../components/Navbar'
import { authService } from '../../services/auth.service'
import styles from '../Login/auth.module.css'

interface RegisterForm {
  name: string
  email: string
  phone: string
  password: string
  confirmPassword: string
}

const RegisterPage: React.FC = () => {
  const [form] = Form.useForm<RegisterForm>()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (values: RegisterForm) => {
    setLoading(true)
    try {
      await authService.register({
        name: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
      })
      message.success('Đăng ký thành công, vui lòng đăng nhập')
      navigate(`/login?email=${encodeURIComponent(values.email)}`, { replace: true })
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không thể đăng ký')
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
            <h1>Đăng ký tài khoản</h1>
            <p>Tạo tài khoản khách hàng để thông tin được điền sẵn khi đặt món.</p>
          </div>

          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              name="name"
              label="Họ tên"
              rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
            >
              <Input size="large" placeholder="Nguyễn Văn A" />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Vui lòng nhập email' },
                { type: 'email', message: 'Email không hợp lệ' },
              ]}
            >
              <Input size="large" placeholder="email@example.com" />
            </Form.Item>

            <Form.Item
              name="phone"
              label="Số điện thoại"
              rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
            >
              <Input size="large" placeholder="0901234567" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu' },
                { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự' },
              ]}
            >
              <Input.Password size="large" placeholder="Tối thiểu 6 ký tự" />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Nhập lại mật khẩu"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Vui lòng nhập lại mật khẩu' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) return Promise.resolve()
                    return Promise.reject(new Error('Mật khẩu nhập lại không khớp'))
                  },
                }),
              ]}
            >
              <Input.Password size="large" placeholder="Nhập lại mật khẩu" />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
              className={styles.submitBtn}
            >
              Đăng ký
            </Button>
          </Form>

          <div className={styles.footerText}>
            Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
          </div>
        </section>
      </main>
    </div>
  )
}

export default RegisterPage
