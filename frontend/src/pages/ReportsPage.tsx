import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import { EmptyState } from '../components/EmptyState'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import type { Order } from '../types'
import { formatDate, formatMoney } from '../utils/format'

function monthStartIso() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export function ReportsPage() {
  const [from, setFrom] = useState(monthStartIso())
  const [to, setTo] = useState(todayIso())
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    api
      .getOrdersReport({ from, to })
      .then((response) => setOrders(response.items))
      .catch((err) => setError(err instanceof Error ? err.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false))
  }, [from, to])

  const totals = useMemo(() => {
    const clientTotal = orders.reduce((sum, order) => sum + Number(order.client_rate ?? 0), 0)
    const carrierTotal = orders.reduce((sum, order) => sum + Number(order.carrier_rate ?? 0), 0)
    const marginTotal = orders.reduce((sum, order) => sum + Number(order.margin ?? 0), 0)
    return { clientTotal, carrierTotal, marginTotal }
  }, [orders])

  return (
    <div>
      <PageHeader
        title="Отчёты"
        description="Заказы за выбранный период"
        action={
          <button
            type="button"
            onClick={() =>
              api.downloadOrdersReportCsv(from, to).catch((err) => setError(err.message))
            }
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-white"
          >
            Скачать CSV
          </button>
        }
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-700">С</span>
          <input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-slate-700">По</span>
          <input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Оборот (клиенты)</p>
          <p className="mt-2 text-2xl font-bold">{formatMoney(String(totals.clientTotal))}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Расход (перевозчики)</p>
          <p className="mt-2 text-2xl font-bold">{formatMoney(String(totals.carrierTotal))}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Маржа</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">
            {formatMoney(String(totals.marginTotal))}
          </p>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : null}
      {error ? (
        <div className="rounded-2xl bg-rose-50 p-6 text-rose-700 ring-1 ring-rose-200">{error}</div>
      ) : null}
      {!loading && !error && orders.length === 0 ? (
        <EmptyState title="Нет заказов за период" />
      ) : null}

      {!loading && !error && orders.length > 0 ? (
        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">№</th>
                <th className="px-4 py-3 font-medium">Маршрут</th>
                <th className="px-4 py-3 font-medium">Погрузка</th>
                <th className="px-4 py-3 font-medium">Статус</th>
                <th className="px-4 py-3 font-medium">Клиент</th>
                <th className="px-4 py-3 font-medium">Маржа</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium">{order.number}</td>
                  <td className="px-4 py-3">
                    {order.origin} → {order.destination}
                  </td>
                  <td className="px-4 py-3">{formatDate(order.load_date)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3">{formatMoney(order.client_rate)}</td>
                  <td className="px-4 py-3">{formatMoney(order.margin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}
