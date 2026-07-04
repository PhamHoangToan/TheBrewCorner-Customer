import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { tableService } from '../../services/table.service'
import { useCartStore } from '../../store/cart.store'

// Khách quét QR tại bàn → /table/:tableId → set phiên gọi món tại bàn rồi vào menu
const TableEntry: React.FC = () => {
  const { tableId } = useParams<{ tableId: string }>()
  const navigate = useNavigate()
  const setTableSession = useCartStore((s) => s.setTableSession)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    if (!tableId) { setError('Thiếu mã bàn'); return }
    tableService
      .get(tableId)
      .then((table) => {
        if (!active) return
        setTableSession(table.id, table.name ?? table.code ?? 'Bàn')
        navigate('/menu', { replace: true })
      })
      .catch(() => { if (active) setError('Không tìm thấy bàn. Vui lòng gọi nhân viên hỗ trợ.') })
    return () => { active = false }
  }, [tableId, setTableSession, navigate])

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
      {error ? (
        <div>
          <div style={{ fontSize: 40, marginBottom: 12 }}>😕</div>
          <div style={{ color: '#b91c1c', fontWeight: 600 }}>{error}</div>
        </div>
      ) : (
        <div style={{ color: '#662c21', fontWeight: 600 }}>Đang mở bàn của bạn…</div>
      )}
    </div>
  )
}

export default TableEntry
