import React, { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Badge, Button } from 'antd'
import { CoffeeOutlined, LogoutOutlined, ShoppingCartOutlined } from '@ant-design/icons'
import { useCartCount, useCartStore } from '../../store/cart.store'
import { useCustomerAuthStore } from '../../store/auth.store'
import styles from './navbar.module.css'

const getInitials = (name: string) =>
  name.split(' ').filter(Boolean).map((w) => w[0]).slice(-2).join('').toUpperCase()

const Navbar: React.FC = () => {
  const count = useCartCount()
  const openCart = useCartStore((s) => s.openCart)
  const user = useCustomerAuthStore((state) => state.user)
  const logout = useCustomerAuthStore((state) => state.logout)
  const navigate = useNavigate()
  const location = useLocation()

  const [scrolled, setScrolled] = useState(false)
  const [cartBump, setCartBump] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const prevCount = useRef(count)

  // Sentinel 1px thay cho window.addEventListener('scroll') — tránh chạy lại mỗi frame scroll
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Phản hồi trực quan khi số món trong giỏ thay đổi (thêm/xoá món)
  useEffect(() => {
    if (count === prevCount.current) return
    prevCount.current = count
    setCartBump(true)
    const timer = window.setTimeout(() => setCartBump(false), 320)
    return () => window.clearTimeout(timer)
  }, [count])

  const isActive = (path: string) => location.pathname === path

  const goToSection = (id: string) => {
    if (location.pathname === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate('/')
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 300)
    }
  }

  return (
    <>
      <div ref={sentinelRef} className={styles.scrollSentinel} aria-hidden="true" />
      <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
        <div className={styles.inner}>
          <Link to="/" className={styles.logo}>
            <span className={styles.logoMark}>
              <CoffeeOutlined />
            </span>
            <div className={styles.logoText}>
              <div className={styles.logoName}>The Brew Corner</div>
              <div className={styles.logoSub}>Specialty Coffee</div>
            </div>
          </Link>

          <nav className={styles.nav}>
            <Link to="/" className={`${styles.navLink} ${isActive('/') ? styles.navLinkActive : ''}`}>
              Trang chủ
            </Link>
            <Link to="/menu" className={`${styles.navLink} ${isActive('/menu') ? styles.navLinkActive : ''}`}>
              Thực đơn
            </Link>
            <Link to="/track-order" className={`${styles.navLink} ${isActive('/track-order') ? styles.navLinkActive : ''}`}>
              Tra cứu đơn
            </Link>
            <Link to="/reservation" className={`${styles.navLink} ${isActive('/reservation') ? styles.navLinkActive : ''}`}>
              Đặt bàn
            </Link>
            <Link to="/promotions" className={`${styles.navLink} ${isActive('/promotions') ? styles.navLinkActive : ''}`}>
              Ưu đãi
            </Link>
            <button type="button" className={styles.navLink} onClick={() => goToSection('about')}>
              Giới thiệu
            </button>
            <button type="button" className={styles.navLink} onClick={() => goToSection('locations')}>
              Chi nhánh
            </button>
          </nav>

          <div className={styles.actions}>
            {user ? (
              <div className={styles.userChip}>
                <span className={styles.userAvatar}>{getInitials(user.name)}</span>
                <button type="button" className={styles.profileBtn} onClick={() => navigate('/profile')}>
                  {user.name}
                </button>
                <button type="button" className={styles.logoutBtn} aria-label="Đăng xuất" onClick={logout}>
                  <LogoutOutlined />
                </button>
              </div>
            ) : (
              <Button className={styles.loginBtn} onClick={() => navigate('/login')}>
                Đăng nhập
              </Button>
            )}
            <Badge count={count} color="#662C21" className={cartBump ? styles.cartBump : ''}>
              <Button
                shape="circle"
                icon={<ShoppingCartOutlined />}
                size="large"
                className={styles.cartBtn}
                onClick={openCart}
                aria-label="Giỏ hàng"
              />
            </Badge>
            <Button type="primary" className={styles.orderBtn} onClick={() => navigate('/menu')}>
              Đặt hàng
            </Button>
          </div>
        </div>
      </header>
    </>
  )
}

export default Navbar
