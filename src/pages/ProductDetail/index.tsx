import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, InputNumber, Rate, Skeleton, Tag, notification } from 'antd'
import { ArrowLeftOutlined, ShoppingCartOutlined, ThunderboltFilled } from '@ant-design/icons'
import dayjs from 'dayjs'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { productService, type CustomerProduct } from '../../services/product.service'
import { reviewService, type ProductReview } from '../../services/review.service'
import { useCartStore } from '../../store/cart.store'
import styles from './productDetail.module.css'

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const addItem = useCartStore((s) => s.addItem)
  const setBuyNow = useCartStore((s) => s.setBuyNow)
  const [api, contextHolder] = notification.useNotification()

  const [product, setProduct] = useState<CustomerProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [qty, setQty] = useState(1)

  useEffect(() => {
    if (!id) return
    let mounted = true
    setLoading(true)
    setNotFound(false)
    setQty(1)
    productService.getById(id)
      .then((p) => { if (mounted) setProduct(p) })
      .catch(() => { if (mounted) setNotFound(true) })
      .finally(() => { if (mounted) setLoading(false) })
    reviewService.byProduct(id)
      .then((items) => { if (mounted) setReviews(items) })
      .catch(() => { if (mounted) setReviews([]) })
    window.scrollTo({ top: 0 })
    return () => { mounted = false }
  }, [id])

  const avgRating = reviews.length
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
    : 0

  const handleAddToCart = () => {
    if (!product) return
    if (product.soldOut) {
      api.warning({ message: `"${product.name}" tạm hết hàng hôm nay`, placement: 'bottomRight', duration: 2 })
      return
    }
    addItem({ id: product.id, name: product.name, price: product.price, category: product.category }, qty)
    api.success({
      message: `Đã thêm "${product.name}" ×${qty}`,
      description: 'Kiểm tra giỏ hàng để tiếp tục đặt hàng',
      placement: 'bottomRight',
      duration: 2,
    })
  }

  const handleBuyNow = () => {
    if (!product || product.soldOut) return
    setBuyNow({ id: product.id, name: product.name, price: product.price, category: product.category }, qty)
    navigate('/checkout')
  }

  return (
    <div className={styles.page}>
      {contextHolder}
      <Navbar />

      <div className={styles.content}>
        <button type="button" className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeftOutlined /> Quay lại
        </button>

        {loading && (
          <div className={styles.layout}>
            <Skeleton.Image active style={{ width: '100%', height: 380 }} />
            <Skeleton active paragraph={{ rows: 6 }} />
          </div>
        )}

        {!loading && notFound && (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🔍</div>
            <p>Không tìm thấy món này</p>
            <Button type="primary" onClick={() => navigate('/menu')}>Về thực đơn</Button>
          </div>
        )}

        {!loading && product && (
          <>
            <div className={styles.layout}>
              <div className={styles.imageBox}>
                {product.imageUrl ? (
                  <img
                    className={styles.image}
                    src={product.imageUrl}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    style={product.soldOut ? { filter: 'grayscale(1)' } : undefined}
                  />
                ) : (
                  <div className={styles.imageEmoji}>{product.emoji}</div>
                )}
              </div>

              <div className={styles.info}>
                <div className={styles.tags}>
                  <Tag color="#662C21">{product.category}</Tag>
                  {product.soldOut && <Tag color="red">Hết hàng hôm nay</Tag>}
                  {product.popular && <Tag color="orange">Phổ biến</Tag>}
                  {product.new && <Tag color="green">Mới</Tag>}
                </div>

                <h1 className={styles.name}>{product.name}</h1>

                {reviews.length > 0 && (
                  <div className={styles.ratingRow}>
                    <Rate disabled allowHalf value={avgRating} />
                    <span className={styles.ratingText}>
                      {avgRating} ({reviews.length} đánh giá)
                    </span>
                  </div>
                )}

                <div className={styles.price}>{product.price.toLocaleString('vi-VN')}đ</div>
                <p className={styles.desc}>{product.description}</p>

                {!product.soldOut && (
                  <div className={styles.qtyRow}>
                    <span className={styles.qtyLabel}>Số lượng</span>
                    <InputNumber min={1} max={20} value={qty} onChange={(v) => setQty(Math.max(1, Math.floor(Number(v ?? 1))))} size="large" />
                  </div>
                )}

                <div className={styles.actions}>
                  <Button
                    size="large"
                    icon={<ShoppingCartOutlined />}
                    disabled={product.soldOut}
                    onClick={handleAddToCart}
                    className={styles.addBtn}
                  >
                    {product.soldOut ? 'Hết hàng' : 'Thêm vào giỏ'}
                  </Button>
                  <Button
                    size="large"
                    type="primary"
                    icon={<ThunderboltFilled />}
                    disabled={product.soldOut}
                    onClick={handleBuyNow}
                    className={styles.buyNowBtn}
                  >
                    Đặt ngay
                  </Button>
                </div>
              </div>
            </div>

            <div className={styles.reviewsSection}>
              <h2 className={styles.reviewsTitle}>Đánh giá từ khách hàng</h2>
              {reviews.length === 0 ? (
                <p className={styles.noReviews}>Chưa có đánh giá nào cho món này.</p>
              ) : (
                <div className={styles.reviewsList}>
                  {reviews.map((r) => (
                    <div key={r.id} className={styles.reviewItem}>
                      <div className={styles.reviewHeader}>
                        <span className={styles.reviewUser}>{r.user?.name ?? 'Khách hàng'}</span>
                        <span className={styles.reviewDate}>{dayjs(r.createdAt).format('DD/MM/YYYY')}</span>
                      </div>
                      <Rate disabled value={r.rating} style={{ fontSize: 14 }} />
                      {r.comment && <p className={styles.reviewComment}>{r.comment}</p>}
                      {r.reply && (
                        <div className={styles.reviewReply}>
                          <strong>Phản hồi từ quán:</strong> {r.reply}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  )
}

export default ProductDetailPage
