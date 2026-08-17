import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { CarriersPage } from './pages/CarriersPage'
import { ClientsPage } from './pages/ClientsPage'
import { DashboardPage } from './pages/DashboardPage'
import { OrderDetailPage } from './pages/OrderDetailPage'
import { OrdersPage } from './pages/OrdersPage'
import { VehiclesPage } from './pages/VehiclesPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="carriers" element={<CarriersPage />} />
          <Route path="vehicles" element={<VehiclesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
