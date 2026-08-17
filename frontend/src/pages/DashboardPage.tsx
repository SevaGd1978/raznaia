import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { PageHeader } from '../components/PageHeader'
import type { DashboardStats } from '../types'
import { ORDER_STATUS_LABELS, type OrderStatus } from '../types'
import { formatMoney } from '../utils/format'

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .dashboard()
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : 'Ошибка загрузки'))
  }, [])

  if (error) {
    return (
      <div className="rounded-2xl bg-rose-50 p-6 text-rose-700 ring-1 ring-rose-200">
        Не удалось загрузить дашборд: {error}
      </div>
    )
  }

  if (!stats) return <LoadingSpinner />

  const cards = [
    { label: 'Всего заказов', value: stats.total_orders },
    { label: 'На сегодня', value: stats.orders_today },
    { label: 'Суммарная маржа', value: formatMoney(stats.total_margin) },
  ]

  return (
    <div>
      <PageHeader
        title="Дашборд"
        description="Обзор текущей работы транспортного отдела"
        action={
          <Link
            to="/orders/new"
            className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Новый заказ
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl bg-white p-6 ring-1 ring-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">Заказы по статусам</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(stats.by_status).map(([status, count]) => (
            <div key={status} className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-sm text-slate-500">
                {ORDER_STATUS_LABELS[status as OrderStatus] ?? status}
              </p>
              <p className="text-xl font-bold text-slate-900">{count}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
