import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Empty, Pagination, Spin } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { walletService, type WalletTransaction } from '../../services/wallet.service'
import { useCustomerAuthStore } from '../../store/auth.store'
import styles from './walletHistory.module.css'

const TYPE_LABEL: Record<string, string> = {
  TOPUP: 'Nạp ví',
  PAYMENT: 'Thanh toán đơn hàng',
  REFUND: 'Hoàn tiền',
}

const PAGE_SIZE = 20

const WalletHistoryPage: React.FC = () => {
  const navigate = useNavigate()
  const user = useCustomerAuthStore((state) => state.user)
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/wallet/history', { replace: true })
      return
    }
    setLoading(true)
    walletService.get(user.id, page, PAGE_SIZE)
      .then((summary) => {
        setBalance(summary.balance)
        setTransactions(summary.transactions)
        setTotal(summary.total)
      })
      .catch(() => { setTransactions([]); setTotal(0) })
      .finally(() => setLoading(false))
  }, [user, navigate, page])

  if (!user) return null

  return (
    <div className={styles.page}>
      <Navbar />

      <div className={styles.heroStrip}>
        <div className={styles.heroStripInner}>
          <button
            type="button"
            style={{
              background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 10, color: '#FEE1BF', fontWeight: 600, fontSize: 13, cursor: 'pointer',
              padding: '7px 16px', display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 20,
            }}
            onClick={() => navigate('/profile')}
          >
            <ArrowLeftOutlined /> Quay lại hồ sơ
          </button>
          <h1 className={styles.title}>Lịch sử ví</h1>
          <p className={styles.subtitle}>Toàn bộ giao dịch nạp/tiêu ví của bạn</p>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.card}>
          <div className={styles.balanceRow}>
            <div>
              <div className={styles.balanceLabel}>Số dư hiện tại</div>
              <div className={styles.balanceValue}>{balance.toLocaleString('vi-VN')}đ</div>
            </div>
            <Button onClick={() => navigate('/profile')}>Nạp thêm</Button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}><Spin size="large" /></div>
          ) : transactions.length === 0 ? (
            <Empty description="Chưa có giao dịch nào" />
          ) : (
            <>
              {transactions.map((t) => (
                <div key={t.id} className={styles.txnRow}>
                  <div className={styles.txnMeta}>
                    <span className={styles.txnNote}>{t.note ?? TYPE_LABEL[t.type] ?? t.type}</span>
                    <span className={styles.txnDate}>{new Date(t.createdAt).toLocaleString('vi-VN')}</span>
                  </div>
                  <span className={t.amount >= 0 ? styles.txnAmountIn : styles.txnAmountOut}>
                    {t.amount >= 0 ? '+' : ''}{t.amount.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              ))}
              {total > PAGE_SIZE && (
                <div className={styles.pagination}>
                  <Pagination current={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} showSizeChanger={false} />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default WalletHistoryPage
