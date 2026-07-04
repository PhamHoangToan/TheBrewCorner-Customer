import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { message } from 'antd'
import { productService } from '../services/product.service'
import { useCartStore } from '../store/cart.store'
import type { ApiOrder } from '../services/order.service'

// Đặt lại đơn cũ: luôn lấy giá + trạng thái bán hiện tại từ productService,
// không tái dùng giá cũ lưu trong đơn (giá có thể đã đổi từ lúc đặt).
export const useReorder = () => {
  const navigate = useNavigate()
  const addItem = useCartStore((s) => s.addItem)
  const [reordering, setReordering] = useState(false)

  const reorder = async (order: ApiOrder) => {
    setReordering(true)
    try {
      const products = await productService.list()
      const skipped: string[] = []
      let addedCount = 0

      for (const item of order.items) {
        const product = item.productId ? products.find((p) => p.id === item.productId) : undefined
        if (!product || product.soldOut) {
          skipped.push(item.productName)
          continue
        }
        for (let i = 0; i < item.quantity; i++) {
          addItem({ id: product.id, name: product.name, price: product.price, category: product.category })
        }
        addedCount++
      }

      if (addedCount === 0) {
        message.error('Không đặt lại được — các món trong đơn này hiện không còn bán')
        return
      }
      if (skipped.length > 0) {
        message.warning(`Đã thêm ${addedCount} món vào giỏ. Món không còn bán nên bị bỏ qua: ${skipped.join(', ')}`)
      } else {
        message.success('Đã thêm lại toàn bộ món vào giỏ hàng')
      }
      navigate('/cart')
    } catch {
      message.error('Không đặt lại được đơn này, thử lại sau')
    } finally {
      setReordering(false)
    }
  }

  return { reorder, reordering }
}
