import React, { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Badge, Button } from 'antd'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { CloseOutlined, CoffeeOutlined, LogoutOutlined, MenuOutlined, ShoppingCartOutlined } from '@ant-design/icons'
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
  const reduceMotion = useReducedMotion()

  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
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

  const UserChip = ({ compact }: { compact?: boolean }) => (
    <div className={styles.userChip}>
      <span className={styles.userAvatar}>{getInitials(user!.name)}</span>
      <button
        type="button"
        className={styles.profileBtn}
        onClick={() => navigate('/profile')}
      >
        {compact ? user!.name.split(' ').slice(-1)[0] : user!.name}
      </button>
      <button
        type="button"
        className={styles.logoutBtn}
        aria-label="Đăng xuất"
        onClick={logout}
      >
        <LogoutOutlined />
      </button>
    </div>
  )

  return (
    <>
      <div ref={sentinelRef} className={styles.scrollSentinel} aria-hidden="true" />
      <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
        <div className={styles.inner}>
          <Link to="/" className={styles.logo}>
            <span className={styles.logoMark}>
              <CoffeeOutlined />
            </span>
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
            <Link to="/reservation" className={`${styles.navLink} ${isActive('/reservation') ? styles.navLinkActive : ''}`}>
              Đặt bàn
            </Link>
            <button type="button" className={styles.navLink} onClick={() => goToSection('about')}>
              Giới thiệu
            </button>
            <button type="button" className={styles.navLink} onClick={() => goToSection('locations')}>
              Chi nhánh
            </button>

            {/* chỉ hiện trong menu mobile */}
            <div className={styles.mobileActions}>
              {user ? <UserChip /> : (
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
              {user ? <UserChip compact /> : (
                <Button className={styles.loginBtn} onClick={() => navigate('/login')}>
                  Đăng nhập
                </Button>
              )}
            </div>
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

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              className={styles.backdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.2 }}
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>
      </header>
    </>
  )
}

export default Navbar
