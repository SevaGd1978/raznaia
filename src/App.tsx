import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { StoreProvider } from './store'
import { LandingPage } from './pages/LandingPage'
import { DashboardPage } from './pages/DashboardPage'
import { OrdersPage } from './pages/OrdersPage'
import { OrderDetailPage } from './pages/OrderDetailPage'
import { ClientsPage } from './pages/ClientsPage'
import { CarriersPage } from './pages/CarriersPage'
import { DocumentsPage } from './pages/DocumentsPage'
import { ReportsPage } from './pages/ReportsPage'

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter
        basename={
          import.meta.env.BASE_URL === '/'
            ? undefined
            : import.meta.env.BASE_URL.replace(/\/$/, '')
        }
      >
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="carriers" element={<CarriersPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="reports" element={<ReportsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  )
}
