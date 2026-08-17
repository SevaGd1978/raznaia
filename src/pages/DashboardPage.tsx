import { Link } from 'react-router-dom'
import { PageHeader, Stat, StatusBadge } from '../components/ui'
import { formatDate, formatMoney } from '../data/seed'
import { useStore } from '../store'

export function DashboardPage() {
  const { orders, clients, carriers, vehicles } = useStore()

  const active = orders.filter((o) =>
    ['new', 'confirmed', 'in_transit'].includes(o.status),
  ).length
  const margin = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.clientRate - o.carrierRate), 0)
  const freeVehicles = vehicles.filter((v) => v.status === 'free').length
  const recent = [...orders]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 5)

  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? '—'

  return (
    <div>
      <PageHeader
        title="Обзор"
        description="Сводка по заказам, транспорту и маржинальности за текущий период"
        action={
          <Link
            to="/app/orders"
            className="rounded-lg bg-asphalt px-4 py-2.5 text-sm font-medium text-white transition hover:bg-steel"
          >
            Все заказы
          </Link>
        }
      />

      <div className="grid gap-6 rounded-2xl border border-fog/80 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4 lg:p-6">
        <Stat label="Активные заказы" value={String(active)} hint={`${orders.length} всего`} />
        <Stat label="Маржа" value={formatMoney(margin)} hint="Клиент − исполнитель" />
        <Stat label="Клиенты" value={String(clients.length)} hint={`${carriers.length} исполнителей`} />
        <Stat label="Свободный транспорт" value={String(freeVehicles)} hint={`${vehicles.length} единиц`} />
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Последние заказы</h2>
          <Link to="/app/orders" className="text-sm text-teal hover:underline">
            Открыть список
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-fog/80 bg-white">
          <div className="hidden grid-cols-[1.1fr_1.4fr_1fr_0.8fr_0.9fr] gap-3 border-b border-fog/70 px-5 py-3 text-xs uppercase tracking-[0.12em] text-mist md:grid">
            <span>Номер</span>
            <span>Клиент / маршрут</span>
            <span>Даты</span>
            <span>Статус</span>
            <span className="text-right">Ставка</span>
          </div>
          {recent.map((order) => (
            <Link
              key={order.id}
              to={`/app/orders/${order.id}`}
              className="grid gap-2 border-b border-fog/60 px-5 py-4 transition last:border-0 hover:bg-paper/80 md:grid-cols-[1.1fr_1.4fr_1fr_0.8fr_0.9fr] md:items-center md:gap-3"
            >
              <div>
                <p className="font-medium text-ink">{order.number}</p>
                <p className="text-xs text-mist md:hidden">{clientName(order.clientId)}</p>
              </div>
              <div>
                <p className="hidden text-sm text-ink md:block">{clientName(order.clientId)}</p>
                <p className="text-sm text-mist">
                  {order.fromCity} → {order.toCity}
                </p>
              </div>
              <p className="text-sm text-mist">
                {formatDate(order.loadingDate)} — {formatDate(order.deliveryDate)}
              </p>
              <StatusBadge status={order.status} />
              <p className="text-sm font-medium md:text-right">{formatMoney(order.clientRate)}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
