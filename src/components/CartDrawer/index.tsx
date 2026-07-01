import React from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from 'antd'
import { CloseOutlined, DeleteOutlined, ShoppingCartOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { useCartStore, useCartTotal } from '../../store/cart.store'
import styles from './cartDrawer.module.css'

const backdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const drawer = {
  hidden:  { x: '100%' },
  visible: { x: 0, transition: { type: 'spring', damping: 28, stiffness: 280 } },
  exit:    { x: '100%', transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } },
}

const itemVariants = {
  hidden:  { opacity: 0, x: 32 },
  visible: (i: number) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.055, duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  }),
  exit: { opacity: 0, x: 60, transition: { duration: 0.18 } },
}

const CartDrawer: React.FC = () => {
  const { items, isCartOpen, closeCart, changeQty, removeItem } = useCartStore()
  const total = useCartTotal()
  const navigate = useNavigate()

  const handleCheckout = () => {
    closeCart()
    navigate('/checkout')
  }

  const content = (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className={styles.backdrop}
            variants={backdrop}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.25 }}
            onClick={closeCart}
          />

          {/* Drawer panel */}
          <motion.aside
            className={styles.drawer}
            variants={drawer}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div className={styles.header}>
              <div className={styles.headerLeft}>
                <ShoppingCartOutlined className={styles.headerIcon} />
                <h2 className={styles.headerTitle}>Giỏ hàng</h2>
                {items.length > 0 && (
                  <span className={styles.badge}>{items.reduce((s, i) => s + i.qty, 0)}</span>
                )}
              </div>
              <button type="button" className={styles.closeBtn} onClick={closeCart} aria-label="Đóng">
                <CloseOutlined />
              </button>
            </div>

            {/* Items */}
            <div className={styles.body}>
              {items.length === 0 ? (
                <motion.div
                  className={styles.empty}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className={styles.emptyIcon}>🛒</div>
                  <p>Giỏ hàng đang trống</p>
                  <Button
                    className={styles.shopBtn}
                    onClick={() => { closeCart(); navigate('/menu') }}
                  >
                    Xem thực đơn
                  </Button>
                </motion.div>
              ) : (
                <AnimatePresence initial={false}>
                  {items.map((item, i) => (
                    <motion.div
                      key={item.id}
                      className={styles.item}
                      custom={i}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                    >
                      <div className={styles.itemEmoji}>
                        {item.category?.toLowerCase().includes('coffee') || item.category?.toLowerCase().includes('cà phê') ? '☕'
                          : item.category?.toLowerCase().includes('trà') || item.category?.toLowerCase().includes('tea') ? '🍵'
                          : item.category?.toLowerCase().includes('bánh') ? '🍰'
                          : '🥤'}
                      </div>
                      <div className={styles.itemInfo}>
                        <div className={styles.itemName}>{item.name}</div>
                        <div className={styles.itemPrice}>{item.price.toLocaleString('vi-VN')}đ</div>
                      </div>
                      <div className={styles.qtyControl}>
                        <button type="button" className={styles.qtyBtn} onClick={() => changeQty(item.id, -1)}>−</button>
                        <motion.span
                          key={item.qty}
                          className={styles.qtyNum}
                          initial={{ scale: 1.4, color: '#662C21' }}
                          animate={{ scale: 1, color: '#2D1A0E' }}
                          transition={{ duration: 0.2 }}
                        >
                          {item.qty}
                        </motion.span>
                        <button type="button" className={styles.qtyBtn} onClick={() => changeQty(item.id, 1)}>+</button>
                      </div>
                      <div className={styles.itemTotal}>
                        {(item.price * item.qty).toLocaleString('vi-VN')}đ
                      </div>
                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={() => removeItem(item.id)}
                        aria-label="Xoá"
                      >
                        <DeleteOutlined />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <motion.div
                className={styles.footer}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className={styles.subtotal}>
                  <span>Tạm tính</span>
                  <span className={styles.subtotalAmt}>{total.toLocaleString('vi-VN')}đ</span>
                </div>
                <Button
                  type="primary"
                  block
                  size="large"
                  className={styles.checkoutBtn}
                  onClick={handleCheckout}
                >
                  Đặt hàng ngay <ArrowRightOutlined />
                </Button>
                <button type="button" className={styles.continueBtn} onClick={closeCart}>
                  Tiếp tục chọn món
                </button>
              </motion.div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )

  return createPortal(content, document.body)
}

export default CartDrawer
