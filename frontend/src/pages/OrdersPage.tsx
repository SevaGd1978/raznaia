import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { EmptyState } from '../components/EmptyState'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import type { Counterparty, Order, OrderStatus } from '../types'
import { ORDER_STATUS_LABELS } from '../types'
import { formatDate, formatMoney } from '../utils/format'

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [clients, setClients] = useState<Counterparty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')

  const clientMap = useMemo(
    () => Object.fromEntries(clients.map((client) => [client.id, client.name])),
    [clients],
  )

  useEffect(() => {
    Promise.all([
      api.getOrders(statusFilter ? { status: statusFilter, limit: 100 } : { limit: 100 }),
      api.getClients({ limit: 200 }),
    ])
      .then(([ordersResponse, clientsResponse]) => {
        setOrders(ordersResponse.items)
        setClients(clientsResponse.items)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false))
  }, [statusFilter])

  return (
    <div>
      <PageHeader
        title="Заказы"
        description="Список перевозок с фильтрацией по статусу"
        action={
          <Link
            to="/orders/new"
            className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Новый заказ
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as OrderStatus | '')}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">Все статусы</option>
          {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {loading ? <LoadingSpinner /> : null}
      {error ? (
        <div className="rounded-2xl bg-rose-50 p-6 text-rose-700 ring-1 ring-rose-200">{error}</div>
      ) : null}

      {!loading && !error && orders.length === 0 ? (
        <EmptyState title="Заказов пока нет" description="Создайте первый заказ или загрузите seed-данные." />
      ) : null}

      {!loading && !error && orders.length > 0 ? (
        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">№</th>
                  <th className="px-4 py-3 font-medium">Клиент</th>
                  <th className="px-4 py-3 font-medium">Маршрут</th>
                  <th className="px-4 py-3 font-medium">Погрузка</th>
                  <th className="px-4 py-3 font-medium">Статус</th>
                  <th className="px-4 py-3 font-medium">Маржа</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-900">{order.number}</td>
                    <td className="px-4 py-3">{clientMap[order.client_id] ?? '—'}</td>
                    <td className="px-4 py-3">
                      {order.origin} → {order.destination}
                    </td>
                    <td className="px-4 py-3">{formatDate(order.load_date)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3">{formatMoney(order.margin)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/orders/${order.id}`} className="font-medium text-blue-600 hover:underline">
                        Открыть
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  )
}
