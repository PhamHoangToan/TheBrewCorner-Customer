import React from 'react'
import { Link } from 'react-router-dom'
import styles from './footer.module.css'

const Footer: React.FC = () => (
  <footer className={styles.footer}>
    <div className={styles.wave} aria-hidden>
      <svg viewBox="0 0 1440 64" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <path d="M0,32 C240,64 480,0 720,32 C960,64 1200,0 1440,32 L1440,64 L0,64 Z" fill="#2D1A0E"/>
      </svg>
    </div>

    <div className={styles.inner}>
      <div className={styles.brand}>
        <div className={styles.brandLogo}>☕ The Brew Corner</div>
        <p className={styles.brandDesc}>
          Nơi mỗi tách cà phê là một câu chuyện.<br />
          Chúng tôi phục vụ bằng cả tấm lòng.
        </p>
        <div className={styles.socials}>
          <a href="#" className={styles.socialLink} aria-label="Facebook">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
            </svg>
          </a>
          <a href="#" className={styles.socialLink} aria-label="Instagram">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <circle cx="12" cy="12" r="4"/>
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
            </svg>
          </a>
          <a href="#" className={styles.socialLink} aria-label="TikTok">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.81 1.55V6.79a4.85 4.85 0 0 1-1.04-.1z"/>
            </svg>
          </a>
        </div>
      </div>

      <div className={styles.col}>
        <div className={styles.colTitle}>Thực đơn</div>
        <Link to="/menu" className={styles.colLink}>Coffee</Link>
        <Link to="/menu" className={styles.colLink}>Trà</Link>
        <Link to="/menu" className={styles.colLink}>Bánh ngọt</Link>
        <Link to="/menu" className={styles.colLink}>Đồ ăn nhẹ</Link>
      </div>

      <div className={styles.col}>
        <div className={styles.colTitle}>Dịch vụ</div>
        <Link to="/menu" className={styles.colLink}>Đặt hàng online</Link>
        <Link to="/track-order" className={styles.colLink}>Tra cứu đơn</Link>
        <a href="/#locations" className={styles.colLink}>Chi nhánh</a>
        <a href="/#about" className={styles.colLink}>Giới thiệu</a>
      </div>

      <div className={styles.col}>
        <div className={styles.colTitle}>Liên hệ</div>
        <span className={styles.colText}>📍 123 Nguyễn Huệ, Q.1, TP.HCM</span>
        <span className={styles.colText}>📞 1800 1234 (miễn phí)</span>
        <span className={styles.colText}>✉️ hello@brewcorner.vn</span>
        <span className={styles.colText}>🕐 6:00 – 22:00 hàng ngày</span>
      </div>
    </div>

    <div className={styles.bottom}>
      <div className={styles.bottomInner}>
        <span>© 2026 The Brew Corner. All rights reserved.</span>
        <div className={styles.bottomLinks}>
          <a href="#">Chính sách bảo mật</a>
          <span>·</span>
          <a href="#">Điều khoản sử dụng</a>
        </div>
      </div>
    </div>
  </footer>
)

export default Footer
