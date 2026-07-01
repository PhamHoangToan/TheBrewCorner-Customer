import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Tag } from 'antd'
import { ArrowRightOutlined, EnvironmentOutlined, PhoneOutlined, StarFilled } from '@ant-design/icons'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { FEATURED, PRODUCTS } from '../../data/menu'
import { productService, type CustomerProduct } from '../../services/product.service'
import { useCartStore } from '../../store/cart.store'
import styles from './home.module.css'

function useCountUp(target: number, duration: number, active: boolean) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!active) return
    let raf: number
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - (1 - p) ** 3
      setVal(Math.round(eased * target))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration, active])
  return val
}

const Home: React.FC = () => {
  const navigate = useNavigate()
  const addItem = useCartStore((s) => s.addItem)
  const [products, setProducts] = useState<CustomerProduct[]>(PRODUCTS)
  const [statsActive, setStatsActive] = useState(false)
  const statsRef = useRef<HTMLDivElement>(null)

  const count50 = useCountUp(50, 1600, statsActive)
  const count3 = useCountUp(3, 900, statsActive)

  useEffect(() => {
    const el = statsRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setStatsActive(true); obs.disconnect() }
      },
      { threshold: 0.5 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    let mounted = true
    productService
      .list()
      .then((items) => { if (mounted && items.length > 0) setProducts(items) })
      .catch(() => { if (mounted) setProducts(PRODUCTS) })
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    const sections = document.querySelectorAll('[data-reveal]')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.revealed)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12 },
    )
    sections.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const featuredProducts = useMemo(() => {
    const marked = products.filter((p) => p.popular)
    return marked.length > 0 ? marked : products.slice(0, FEATURED.length)
  }, [products])

  const newProducts = useMemo(() => {
    const marked = products.filter((p) => p.new)
    return marked.length > 0 ? marked : products.slice(-4)
  }, [products])

  return (
    <div className={styles.page}>
      <Navbar />

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroBg} aria-hidden>
          <div className={styles.blob1} />
          <div className={styles.blob2} />
          <div className={styles.blob3} />
          <div className={styles.decoBean1}>🫘</div>
          <div className={styles.decoBean2}>🫘</div>
          <div className={styles.decoBean3}>🫘</div>
        </div>

        <div className={styles.heroInner}>
          <div className={styles.heroLeft}>
            <div className={styles.heroTag}>☕ Specialty Coffee</div>
            <h1 className={styles.heroTitle}>
              Mỗi tách cà phê<br />
              <span className={styles.heroAccent}>là một câu chuyện</span>
            </h1>
            <p className={styles.heroDesc}>
              The Brew Corner — nơi hội tụ của những tách cà phê đặc sản được chọn lọc kỹ càng,
              pha chế bởi những người thực sự yêu nghề.
            </p>
            <div className={styles.heroActions}>
              <Button
                type="primary"
                size="large"
                className={styles.btnOrder}
                onClick={() => navigate('/menu')}
              >
                Đặt hàng ngay <ArrowRightOutlined />
              </Button>
              <Button size="large" className={styles.btnMenu} onClick={() => navigate('/menu')}>
                Xem thực đơn
              </Button>
            </div>
            <div className={styles.heroStats} ref={statsRef}>
              <div className={styles.stat}>
                <strong>{statsActive ? `${count50}+` : '0+'}</strong>
                <span>Món đặc sắc</span>
              </div>
              <div className={styles.statDiv} />
              <div className={styles.stat}>
                <strong>{statsActive ? count3 : 0}</strong>
                <span>Chi nhánh</span>
              </div>
              <div className={styles.statDiv} />
              <div className={styles.stat}>
                <strong>5★</strong>
                <span>Đánh giá</span>
              </div>
            </div>
          </div>

          <div className={styles.heroRight}>
            <div className={styles.visualWrap}>
              <div className={styles.ring1} aria-hidden />
              <div className={styles.ring2} aria-hidden />

              <div className={styles.coffeePod}>
                <div className={styles.steamRow} aria-hidden>
                  <span className={styles.steam1} />
                  <span className={styles.steam2} />
                  <span className={styles.steam3} />
                </div>
                <div className={styles.coffeeIcon}>☕</div>
                <div className={styles.podLabel}>Signature Latte</div>
                <div className={styles.podPrice}>45.000đ</div>
              </div>

              <div className={`${styles.floatBadge} ${styles.badgeRating}`}>
                <StarFilled style={{ color: '#F59E0B', fontSize: 13 }} />
                <span><b>4.9</b> / 5.0</span>
              </div>
              <div className={`${styles.floatBadge} ${styles.badgeHot}`}>
                <span>🔥</span>
                <span>Best Seller</span>
              </div>
              <div className={`${styles.floatBadge} ${styles.badgeFresh}`}>
                <span>✨</span>
                <span>Fresh Daily</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.scrollHint} aria-hidden>
          <div className={styles.scrollMouse}>
            <div className={styles.scrollWheel} />
          </div>
          <span>Cuộn xuống</span>
        </div>
      </section>

      {/* FEATURED */}
      <section className={styles.section} data-reveal>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionTag}>Được yêu thích</div>
            <h2 className={styles.sectionTitle}>Món nổi bật</h2>
            <p className={styles.sectionDesc}>Những lựa chọn được khách hàng order nhiều nhất</p>
          </div>
          <div className={styles.productGrid}>
            {featuredProducts.map((p) => (
              <div key={p.id} className={styles.productCard}>
                <div className={styles.productEmoji}>
                  {p.imageUrl ? (
                    <img
                      className={styles.productImage}
                      src={p.imageUrl}
                      alt={p.name}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    p.emoji
                  )}
                </div>
                <div className={styles.productInfo}>
                  <div className={styles.productName}>{p.name}</div>
                  <div className={styles.productDesc}>{p.description}</div>
                  <div className={styles.productFooter}>
                    <span className={styles.productPrice}>{p.price.toLocaleString('vi-VN')}đ</span>
                    <Button
                      type="primary"
                      size="small"
                      className={styles.addBtn}
                      onClick={() => addItem({ id: p.id, name: p.name, price: p.price, category: p.category })}
                    >
                      + Thêm
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.viewAll}>
            <Button size="large" className={styles.btnViewAll} onClick={() => navigate('/menu')}>
              Xem toàn bộ thực đơn <ArrowRightOutlined />
            </Button>
          </div>
        </div>
      </section>

      {/* NEW ITEMS */}
      <section className={styles.newSection} data-reveal>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionTag} style={{ background: '#FEE1BF', color: '#662C21' }}>Mới ra mắt</div>
            <h2 className={styles.sectionTitle} style={{ color: '#fff' }}>Có gì mới?</h2>
          </div>
          <div className={styles.newGrid}>
            {newProducts.map((p) => (
              <div key={p.id} className={styles.newCard}>
                <Tag color="#662C21" className={styles.newTag}>NEW</Tag>
                <div className={styles.newEmoji}>
                  {p.imageUrl ? (
                    <img
                      className={styles.newImage}
                      src={p.imageUrl}
                      alt={p.name}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    p.emoji
                  )}
                </div>
                <div className={styles.newName}>{p.name}</div>
                <div className={styles.newPrice}>{p.price.toLocaleString('vi-VN')}đ</div>
                <Button
                  block
                  className={styles.newAddBtn}
                  onClick={() => {
                    addItem({ id: p.id, name: p.name, price: p.price, category: p.category })
                    navigate('/cart')
                  }}
                >
                  Thêm vào giỏ
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ORDER TYPES */}
      <section className={styles.section} id="about" data-reveal>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionTag}>Dịch vụ</div>
            <h2 className={styles.sectionTitle}>Đặt hàng theo cách của bạn</h2>
          </div>
          <div className={styles.serviceGrid}>
            <div className={styles.serviceCard}>
              <div className={styles.serviceIcon}>🍽️</div>
              <h3>Dine-in</h3>
              <p>Quét QR tại bàn, gọi món ngay — phục vụ tận nơi không cần chờ đợi</p>
            </div>
            <div className={styles.serviceCard}>
              <div className={styles.serviceIcon}>🛍️</div>
              <h3>Takeaway</h3>
              <p>Đặt trước trên web, đến lấy là xong — tiết kiệm thời gian chờ</p>
            </div>
            <div className={styles.serviceCard}>
              <div className={styles.serviceIcon}>🛵</div>
              <h3>Delivery</h3>
              <p>Giao tận nhà trong vòng 30 phút — thưởng thức ngay tại nơi bạn muốn</p>
            </div>
          </div>
        </div>
      </section>

      {/* LOCATIONS */}
      <section className={styles.locationSection} id="locations" data-reveal>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionTag}>Tìm chúng tôi</div>
            <h2 className={styles.sectionTitle}>Chi nhánh</h2>
          </div>
          <div className={styles.locationGrid}>
            {[
              { name: 'The Brew Corner Q.1', addr: '123 Nguyễn Huệ, Q.1, TP.HCM', hours: '6:00 – 22:00', phone: '028 1234 5678' },
              { name: 'The Brew Corner Q.3', addr: '456 Võ Văn Tần, Q.3, TP.HCM', hours: '6:30 – 21:30', phone: '028 2345 6789' },
              { name: 'The Brew Corner Bình Thạnh', addr: '789 Xô Viết Nghệ Tĩnh, Bình Thạnh', hours: '7:00 – 22:00', phone: '028 3456 7890' },
            ].map((loc) => (
              <div key={loc.name} className={styles.locationCard}>
                <h3 className={styles.locationName}>{loc.name}</h3>
                <p><EnvironmentOutlined /> {loc.addr}</p>
                <p>🕐 {loc.hours}</p>
                <p><PhoneOutlined /> {loc.phone}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Home
