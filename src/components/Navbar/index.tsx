import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Badge, Button } from 'antd'
import { CloseOutlined, LogoutOutlined, MenuOutlined, ShoppingCartOutlined, UserOutlined } from '@ant-design/icons'
import { useCartCount, useCartStore } from '../../store/cart.store'
import { useCustomerAuthStore } from '../../store/auth.store'
import styles from './navbar.module.css'

const Navbar: React.FC = () => {
  const count = useCartCount()
  const openCart = useCartStore((s) => s.openCart)
  const user = useCustomerAuthStore((state) => state.user)
  const logout = useCustomerAuthStore((state) => state.logout)
  const navigate = useNavigate()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const isActive = (path: string) => location.pathname === path

  const goToSection = (id: string) => {
    setMenuOpen(false)
    if (location.pathname === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate('/')
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 300)
    }
  }

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoIcon}>☕</span>
          <div>
            <div className={styles.logoName}>The Brew Corner</div>
            <div className={styles.logoSub}>Specialty Coffee</div>
          </div>
        </Link>

        <nav className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`}>
          <Link to="/" className={`${styles.navLink} ${isActive('/') ? styles.navLinkActive : ''}`}>
            Trang chủ
          </Link>
          <Link to="/menu" className={`${styles.navLink} ${isActive('/menu') ? styles.navLinkActive : ''}`}>
            Thực đơn
          </Link>
          <Link to="/track-order" className={`${styles.navLink} ${isActive('/track-order') ? styles.navLinkActive : ''}`}>
            Tra cứu đơn
          </Link>
          <button type="button" className={styles.navLink} onClick={() => goToSection('about')}>
            Giới thiệu
          </button>
          <button type="button" className={styles.navLink} onClick={() => goToSection('locations')}>
            Chi nhánh
          </button>

          {/* mobile-only actions, shown inside the dropdown nav */}
          <div className={styles.mobileActions}>
            {user ? (
              <div className={styles.userBox}>
                <UserOutlined />
                <button type="button" className={styles.profileBtn} onClick={() => navigate('/profile')}>
                  {user.name}
                </button>
                <Button shape="circle" icon={<LogoutOutlined />} onClick={logout} />
              </div>
            ) : (
              <Button className={styles.loginBtn} onClick={() => navigate('/login')}>
                Đăng nhập
              </Button>
            )}
            <Button type="primary" className={styles.orderBtn} onClick={() => navigate('/menu')}>
              Đặt hàng
            </Button>
          </div>
        </nav>

        <div className={styles.actions}>
          <div className={styles.desktopOnly}>
            {user ? (
              <div className={styles.userBox}>
                <UserOutlined />
                <button type="button" className={styles.profileBtn} onClick={() => navigate('/profile')}>
                  {user.name}
                </button>
                <Button shape="circle" icon={<LogoutOutlined />} onClick={logout} />
              </div>
            ) : (
              <Button className={styles.loginBtn} onClick={() => navigate('/login')}>
                Đăng nhập
              </Button>
            )}
          </div>
          <Badge count={count} color="#662C21">
            <Button
              shape="circle"
              icon={<ShoppingCartOutlined />}
              size="large"
              className={styles.cartBtn}
              onClick={openCart}
            />
          </Badge>
          <Button type="primary" className={`${styles.orderBtn} ${styles.desktopOnly}`} onClick={() => navigate('/menu')}>
            Đặt hàng
          </Button>
          <button
            type="button"
            className={styles.hamburgerBtn}
            aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <CloseOutlined /> : <MenuOutlined />}
          </button>
        </div>
      </div>
      {menuOpen && <div className={styles.backdrop} onClick={() => setMenuOpen(false)} aria-hidden="true" />}
    </header>
  )
}

export default Navbar
