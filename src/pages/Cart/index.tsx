import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Empty, Radio, Space, message } from 'antd'
import { ArrowLeftOutlined, DeleteOutlined } from '@ant-design/icons'
import Navbar from '../../components/Navbar'
import { useCartStore, useCartTotal } from '../../store/cart.store'
import { useAuthStore } from '../../store/auth.store'
import { orderService } from '../../services/order.service'
import styles from './cart.module.css'

const CartPage: React.FC = () => {
  const navigate = useNavigate()
  const { items, orderType, changeQty, removeItem, setOrderType } = useCartStore()
  const tableSessionId = useCartStore((s) => s.tableSessionId)
  const tableSessionName = useCartStore((s) => s.tableSessionName)
  const clearCart = useCartStore((s) => s.clearCart)
  const user = useAuthStore((s) => s.user)
  const total = useCartTotal()
  const [placing, setPlacing] = useState(false)

  const handleSelfOrder = async () => {
    if (!tableSessionId || !items.length) return
    setPlacing(true)
    try {
      const order = await orderService.selfOrder(tableSessionId, items, user?.id)
      clearCart()
      message.success('Đã gửi món tới quầy pha chế!')
      navigate(`/order/${order.id}`, { state: { order } })
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Gửi món thất bại')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div className={styles.page}>
      <Navbar />

      <div className={styles.content}>
        <button type="button" className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeftOutlined /> Tiếp tục mua
        </button>

        <h1 className={styles.title}>Giỏ hàng</h1>

        {tableSessionId && (
          <div style={{
            padding: '10px 14px', marginBottom: 16, borderRadius: 10,
            background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', fontWeight: 600,
          }}>
            🍽️ Đang gọi món tại <b>{tableSessionName}</b> — món sẽ được gửi thẳng tới quầy, thanh toán tại quầy.
          </div>
        )}

        {items.length === 0 ? (
          <div className={styles.empty}>
            <Empty description="Giỏ hàng trống" />
            <Button type="primary" className={styles.btnShop} onClick={() => navigate('/menu')}>
              Xem thực đơn
            </Button>
          </div>
        ) : (
          <div className={styles.layout}>
            <div className={styles.left}>
              <div className={styles.cartItems}>
                {items.map((item) => (
                  <div key={item.id} className={styles.cartRow}>
                    <div className={styles.itemEmoji}>
                      {item.category === 'Coffee' ? '☕' : item.category === 'Trà' ? '🍵' : '🍰'}
                    </div>
                    <div className={styles.itemInfo}>
                      <div className={styles.itemName}>{item.name}</div>
                      <div className={styles.itemPrice}>{item.price.toLocaleString('vi-VN')}đ / phần</div>
                    </div>
                    <div className={styles.qtyControl}>
                      <button type="button" className={styles.qtyBtn} onClick={() => changeQty(item.id, -1)}>−</button>
                      <span className={styles.qtyNum}>{item.qty}</span>
                      <button type="button" className={styles.qtyBtn} onClick={() => changeQty(item.id, 1)}>+</button>
                    </div>
                    <div className={styles.rowTotal}>
                      {(item.price * item.qty).toLocaleString('vi-VN')}đ
                    </div>
                    <button type="button" className={styles.removeBtn} onClick={() => removeItem(item.id)}>
                      <DeleteOutlined />
                    </button>
                  </div>
                ))}
              </div>

              {!tableSessionId && (
                <div className={styles.orderTypeSection}>
                  <h3 className={styles.orderTypeTitle}>Hình thức đặt hàng</h3>
                  <Radio.Group value={orderType} onChange={(e) => setOrderType(e.target.value)}>
                    <Space direction="vertical" size={12}>
                      <Radio value="dine-in" className={styles.radio}>
                        <span>🍽️ <strong>Dine-in</strong> — Dùng tại quán</span>
                      </Radio>
                      <Radio value="takeaway" className={styles.radio}>
                        <span>🛍️ <strong>Takeaway</strong> — Mang về</span>
                      </Radio>
                      <Radio value="delivery" className={styles.radio}>
                        <span>🛵 <strong>Delivery</strong> — Giao tận nơi</span>
                      </Radio>
                    </Space>
                  </Radio.Group>
                </div>
              )}
            </div>

            <div className={styles.right}>
              <div className={styles.summary}>
                <h2 className={styles.summaryTitle}>Tóm tắt đơn</h2>

                {items.map((item) => (
                  <div key={item.id} className={styles.summaryRow}>
                    <span>{item.name} × {item.qty}</span>
                    <span>{(item.price * item.qty).toLocaleString('vi-VN')}đ</span>
                  </div>
                ))}

                <div className={styles.divider} />

                <div className={styles.summaryRow}>
                  <span>Tạm tính</span>
                  <span>{total.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Phí dịch vụ</span>
                  <span>0đ</span>
                </div>

                <div className={styles.divider} />

                <div className={styles.totalRow}>
                  <span>Tổng cộng</span>
                  <span className={styles.totalAmount}>{total.toLocaleString('vi-VN')}đ</span>
                </div>

                {tableSessionId ? (
                  <Button
                    type="primary"
                    block
                    size="large"
                    loading={placing}
                    className={styles.checkoutBtn}
                    onClick={handleSelfOrder}
                  >
                    Gọi món tại {tableSessionName}
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    block
                    size="large"
                    className={styles.checkoutBtn}
                    onClick={() => navigate('/checkout')}
                  >
                    Tiến hành đặt hàng
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CartPage
