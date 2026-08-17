import { PageHeader, Stat } from '../components/ui'
import { formatMoney, statusLabels } from '../data/seed'
import { useStore } from '../store'
import type { OrderStatus } from '../types'

export function ReportsPage() {
  const { orders, clients } = useStore()

  const activeOrders = orders.filter((o) => o.status !== 'cancelled')
  const revenue = activeOrders.reduce((s, o) => s + o.clientRate, 0)
  const cost = activeOrders.reduce((s, o) => s + o.carrierRate, 0)
  const margin = revenue - cost

  const byStatus = (Object.keys(statusLabels) as OrderStatus[]).map((status) => ({
    status,
    count: orders.filter((o) => o.status === status).length,
  }))

  const byClient = clients
    .map((client) => {
      const list = activeOrders.filter((o) => o.clientId === client.id)
      const sum = list.reduce((s, o) => s + o.clientRate, 0)
      return { name: client.name, count: list.length, sum }
    })
    .filter((c) => c.count > 0)
    .sort((a, b) => b.sum - a.sum)

  const maxClient = Math.max(...byClient.map((c) => c.sum), 1)
  const maxStatus = Math.max(...byStatus.map((s) => s.count), 1)

  return (
    <div>
      <PageHeader
        title="Отчёты"
        description="Маржинальность, статусы заказов и активность клиентов"
      />

      <div className="grid gap-6 rounded-2xl border border-fog/80 bg-white p-5 sm:grid-cols-3 lg:p-6">
        <Stat label="Выручка" value={formatMoney(revenue)} />
        <Stat label="Затраты на перевозчиков" value={formatMoney(cost)} />
        <Stat label="Маржа" value={formatMoney(margin)} hint={`${((margin / (revenue || 1)) * 100).toFixed(0)}%`} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-fog/80 bg-white p-5 md:p-6">
          <h2 className="font-display text-lg font-semibold">Заказы по статусам</h2>
          <ul className="mt-5 space-y-3">
            {byStatus.map(({ status, count }) => (
              <li key={status}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{statusLabels[status]}</span>
                  <span className="text-mist">{count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-paper">
                  <div
                    className="h-full rounded-full bg-teal"
                    style={{ width: `${(count / maxStatus) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-fog/80 bg-white p-5 md:p-6">
          <h2 className="font-display text-lg font-semibold">Клиенты по обороту</h2>
          <ul className="mt-5 space-y-3">
            {byClient.map((row) => (
              <li key={row.name}>
                <div className="mb-1 flex justify-between gap-3 text-sm">
                  <span className="truncate">{row.name}</span>
                  <span className="shrink-0 text-mist">
                    {formatMoney(row.sum)} · {row.count}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-paper">
                  <div
                    className="h-full rounded-full bg-signal"
                    style={{ width: `${(row.sum / maxClient) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
