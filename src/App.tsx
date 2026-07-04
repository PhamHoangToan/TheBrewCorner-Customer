
import React, { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useSearchParams, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Spin } from 'antd'
import { useCartStore } from './store/cart.store'
import PageTransition from './components/PageTransition'
import CartDrawer from './components/CartDrawer'
import ChatWidget from './components/ChatWidget'

const Home          = lazy(() => import('./pages/Home'))
const MenuPage      = lazy(() => import('./pages/Menu'))
const ProductDetailPage = lazy(() => import('./pages/ProductDetail'))
const CartPage      = lazy(() => import('./pages/Cart'))
const CheckoutPage  = lazy(() => import('./pages/Checkout'))
const OrderTracking = lazy(() => import('./pages/OrderTracking'))
const OrderStatus   = lazy(() => import('./pages/OrderStatus'))
const LoginPage     = lazy(() => import('./pages/Login'))
const RegisterPage  = lazy(() => import('./pages/Register'))
const ProfilePage   = lazy(() => import('./pages/Profile'))
const ReservationPage = lazy(() => import('./pages/Reservation'))
const TableEntryPage = lazy(() => import('./pages/TableEntry'))
const WalletHistoryPage = lazy(() => import('./pages/WalletHistory'))
const PromotionsPage = lazy(() => import('./pages/Promotions'))

const fallback = (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
    <Spin size="large" />
  </div>
)

const QRHandler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [params] = useSearchParams()
  const setTable = useCartStore((s) => s.setTable)
  const setOrderType = useCartStore((s) => s.setOrderType)

  useEffect(() => {
    const table = params.get('table')
    if (table) {
      setTable(table)
      setOrderType('dine-in')
    }
  }, [params, setOrderType, setTable])

  return <>{children}</>
}

const AnimatedRoutes: React.FC = () => {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/menu" element={<PageTransition><MenuPage /></PageTransition>} />
        <Route path="/product/:id" element={<PageTransition><ProductDetailPage /></PageTransition>} />
        <Route path="/cart" element={<PageTransition><CartPage /></PageTransition>} />
        <Route path="/checkout" element={<PageTransition><CheckoutPage /></PageTransition>} />
        <Route path="/track-order" element={<PageTransition><OrderStatus /></PageTransition>} />
        <Route path="/order/:id" element={<PageTransition><OrderTracking /></PageTransition>} />
        <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
        <Route path="/register" element={<PageTransition><RegisterPage /></PageTransition>} />
        <Route path="/profile" element={<PageTransition><ProfilePage /></PageTransition>} />
        <Route path="/reservation" element={<PageTransition><ReservationPage /></PageTransition>} />
        <Route path="/table/:tableId" element={<PageTransition><TableEntryPage /></PageTransition>} />
        <Route path="/wallet/history" element={<PageTransition><WalletHistoryPage /></PageTransition>} />
        <Route path="/promotions" element={<PageTransition><PromotionsPage /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  )
}

const App: React.FC = () => (
  <BrowserRouter>
    <Suspense fallback={fallback}>
      <QRHandler>
        <AnimatedRoutes />
        <CartDrawer />
        <ChatWidget />
      </QRHandler>
    </Suspense>
  </BrowserRouter>
)

export default App
