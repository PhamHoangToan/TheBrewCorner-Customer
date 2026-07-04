import React, { useEffect, useState } from 'react'
import { Button, Empty, Spin, message } from 'antd'
import { CopyOutlined, GiftOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { promotionService, type Promotion } from '../../services/promotion.service'
import styles from './promotions.module.css'

const PromotionsPage: React.FC = () => {
  const [items, setItems] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    promotionService.listActive()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    message.success(`Đã sao chép mã ${code}`)
  }

  return (
    <div className={styles.page}>
      <Navbar />

      <div className={styles.heroStrip}>
        <div className={styles.heroStripInner}>
          <h1 className={styles.title}>Ưu đãi hôm nay</h1>
          <p className={styles.subtitle}>Các chương trình khuyến mãi đang áp dụng tại The Brew Corner</p>
        </div>
      </div>

      <div className={styles.content}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}><Spin size="large" /></div>
        ) : items.length === 0 ? (
          <Empty description="Hiện chưa có chương trình khuyến mãi nào" />
        ) : (
          <div className={styles.grid}>
            {items.map((p) => (
              <div key={p.id} className={styles.card}>
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className={styles.cardImage} referrerPolicy="no-referrer" />
                ) : (
                  <div className={styles.cardImageFallback}><GiftOutlined /></div>
                )}
                <div className={styles.cardBody}>
                  <span className={styles.cardDiscount}>Giảm {p.discountPercent}%</span>
                  <div className={styles.cardName}>{p.name}</div>
                  <div className={styles.cardCondition}>{p.conditionText}</div>
                  <div className={styles.cardFooter}>
                    <span className={styles.cardExpiry}>HSD {dayjs(p.endDate).format('DD/MM/YYYY')}</span>
                    <Button size="small" icon={<CopyOutlined />} className={styles.copyBtn} type="primary" onClick={() => copyCode(p.code)}>
                      {p.code}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}

export default PromotionsPage
