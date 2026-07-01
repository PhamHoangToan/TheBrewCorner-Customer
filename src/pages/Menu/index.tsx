import React, { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Input, notification, Tag } from 'antd'
import { SearchOutlined, ShoppingCartOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { PRODUCTS } from '../../data/menu'
import { productService, type CustomerProduct } from '../../services/product.service'
import { useCartCount, useCartStore } from '../../store/cart.store'
import styles from './menu.module.css'

const MenuPage: React.FC = () => {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState('Tất cả')
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<CustomerProduct[]>(PRODUCTS)
  const [loading, setLoading] = useState(false)
  const addItem = useCartStore((s) => s.addItem)
  const cartCount = useCartCount()
  const [api, contextHolder] = notification.useNotification()

  useEffect(() => {
    let mounted = true
    setLoading(true)
    productService
      .list()
      .then((items) => { if (mounted && items.length > 0) setProducts(items) })
      .catch(() => { if (mounted) setProducts(PRODUCTS) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const categories = useMemo(
    () => ['Tất cả', ...Array.from(new Set(products.map((p) => p.category)))],
    [products],
  )

  const filtered = products.filter((p) => {
    const matchCat = activeCategory === 'Tất cả' || p.category === activeCategory
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const handleAdd = (p: CustomerProduct) => {
    addItem({ id: p.id, name: p.name, price: p.price, category: p.category })
    api.success({
      message: `Đã thêm "${p.name}"`,
      description: 'Kiểm tra giỏ hàng để tiếp tục đặt hàng',
      placement: 'bottomRight',
      duration: 2,
    })
  }

  return (
    <div className={styles.page}>
      {contextHolder}
      <Navbar />

      <div className={styles.hero}>
        <div className={styles.heroBg} aria-hidden>
          <div className={styles.heroOrb1} />
          <div className={styles.heroOrb2} />
        </div>
        <div className={styles.heroContent}>
          <div className={styles.heroKicker}>☕ The Brew Corner</div>
          <h1 className={styles.heroTitle}>Thực đơn</h1>
          <p className={styles.heroDesc}>Chọn món yêu thích và đặt hàng ngay</p>
          <div className={styles.heroSearch}>
            <Input
              prefix={<SearchOutlined style={{ color: '#662C21', fontSize: 16 }} />}
              placeholder={loading ? 'Đang tải thực đơn...' : 'Tìm tên món...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.heroSearchInput}
              size="large"
              allowClear
            />
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.categories}>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`${styles.catBtn} ${activeCategory === cat ? styles.catBtnActive : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className={styles.grid}>
          {filtered.map((p) => (
            <div key={p.id} className={styles.card}>
              <div className={styles.cardImg}>
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
                <div className={styles.cardOverlay}>
                  <Button className={styles.quickAddBtn} onClick={() => handleAdd(p)}>
                    + Thêm vào giỏ
                  </Button>
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardTags}>
                  {p.popular && <Tag color="#662C21">Phổ biến</Tag>}
                  {p.new && <Tag color="orange">Mới</Tag>}
                </div>
                <div className={styles.cardName}>{p.name}</div>
                <div className={styles.cardDesc}>{p.description}</div>
                <div className={styles.cardFooter}>
                  <span className={styles.cardPrice}>{p.price.toLocaleString('vi-VN')}đ</span>
                  <Button type="primary" className={styles.addBtn} onClick={() => handleAdd(p)}>
                    + Thêm
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && !loading && (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>🔍</div>
              <p>Không tìm thấy món phù hợp</p>
              <Button onClick={() => { setSearch(''); setActiveCategory('Tất cả') }}>Xoá bộ lọc</Button>
            </div>
          )}
        </div>
      </div>

      {cartCount > 0 && (
        <div className={styles.cartFloating}>
          <Button
            type="primary"
            size="large"
            className={styles.cartFloatingBtn}
            icon={<ShoppingCartOutlined />}
            onClick={() => navigate('/cart')}
          >
            <Badge count={cartCount} color="#fff" style={{ color: '#662C21' }}>
              <span className={styles.cartFloatingText}>Xem giỏ hàng</span>
            </Badge>
          </Button>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default MenuPage
