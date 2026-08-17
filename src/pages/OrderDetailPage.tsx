import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageHeader, StatusBadge } from '../components/ui'
import { formatDate, formatMoney, statusLabels } from '../data/seed'
import { useStore } from '../store'
import type { OrderStatus } from '../types'

const nextStatuses: OrderStatus[] = [
  'new',
  'confirmed',
  'in_transit',
  'delivered',
  'closed',
  'cancelled',
]

export function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { orders, clients, carriers, vehicles, documents, updateOrder } = useStore()

  const order = orders.find((o) => o.id === id)
  if (!order) {
    return (
      <div>
        <p className="text-mist">Заказ не найден</p>
        <Link to="/app/orders" className="mt-3 inline-block text-teal hover:underline">
          К списку заказов
        </Link>
      </div>
    )
  }

  const client = clients.find((c) => c.id === order.clientId)
  const carrier = carriers.find((c) => c.id === order.carrierId)
  const vehicle = vehicles.find((v) => v.id === order.vehicleId)
  const docs = documents.filter((d) => d.orderId === order.id)
  const margin = order.clientRate - order.carrierRate

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate('/app/orders')}
        className="mb-4 inline-flex items-center gap-2 text-sm text-mist hover:text-ink"
      >
        <ArrowLeft size={16} />
        К заказам
      </button>

      <PageHeader
        title={order.number}
        description={`${order.fromCity} → ${order.toCity}`}
        action={<StatusBadge status={order.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <section className="rounded-2xl border border-fog/80 bg-white p-5 md:p-6">
          <h2 className="font-display text-lg font-semibold">Карточка перевозки</h2>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-[0.12em] text-mist">Клиент</dt>
              <dd className="mt-1 text-sm font-medium">{client?.name ?? '—'}</dd>
              <dd className="text-xs text-mist">{client?.contactPerson}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.12em] text-mist">Исполнитель</dt>
              <dd className="mt-1 text-sm font-medium">{carrier?.name ?? 'Не назначен'}</dd>
              <dd className="text-xs text-mist">{carrier?.phone}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.12em] text-mist">Груз</dt>
              <dd className="mt-1 text-sm">{order.cargo}</dd>
              <dd className="text-xs text-mist">{order.weightTons} т</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.12em] text-mist">Транспорт</dt>
              <dd className="mt-1 text-sm">
                {vehicle ? `${vehicle.plate} · ${vehicle.brand}` : 'Не назначен'}
              </dd>
              <dd className="text-xs text-mist">{vehicle?.type}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.12em] text-mist">Погрузка</dt>
              <dd className="mt-1 text-sm">{formatDate(order.loadingDate)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.12em] text-mist">Доставка</dt>
              <dd className="mt-1 text-sm">{formatDate(order.deliveryDate)}</dd>
            </div>
          </dl>

          {order.notes && (
            <p className="mt-5 rounded-xl bg-paper px-4 py-3 text-sm text-mist">{order.notes}</p>
          )}

          <div className="mt-6">
            <p className="mb-2 text-xs uppercase tracking-[0.12em] text-mist">Сменить статус</p>
            <div className="flex flex-wrap gap-2">
              {nextStatuses.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => updateOrder(order.id, { status })}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    order.status === status
                      ? 'bg-asphalt text-white'
                      : 'bg-paper text-mist hover:text-ink'
                  }`}
                >
                  {statusLabels[status]}
                </button>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-fog/80 bg-white p-5">
            <h3 className="font-display text-base font-semibold">Финансы</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-mist">Клиент</span>
                <span className="font-medium">{formatMoney(order.clientRate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mist">Исполнитель</span>
                <span className="font-medium">{formatMoney(order.carrierRate)}</span>
              </div>
              <div className="flex justify-between border-t border-fog pt-3">
                <span className="text-mist">Маржа</span>
                <span className={`font-semibold ${margin >= 0 ? 'text-ok' : 'text-danger'}`}>
                  {formatMoney(margin)}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-fog/80 bg-white p-5">
            <h3 className="font-display text-base font-semibold">Документы</h3>
            <ul className="mt-4 space-y-3">
              {docs.length === 0 && <li className="text-sm text-mist">Пока нет документов</li>}
              {docs.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between gap-3 text-sm">
                  <Link
                    to={`/app/documents/${doc.id}`}
                    className="font-medium text-ink underline-offset-2 hover:text-teal hover:underline"
                  >
                    {doc.title}
                  </Link>
                  <Link
                    to={`/app/documents/${doc.id}?print=1`}
                    className="shrink-0 text-xs text-teal hover:underline"
                  >
                    Печать
                  </Link>
                </li>
              ))}
            </ul>
            <Link to="/app/documents" className="mt-4 inline-block text-sm text-teal hover:underline">
              Все документы
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
