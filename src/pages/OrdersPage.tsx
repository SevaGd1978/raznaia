import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Plus, X } from 'lucide-react'
import { PageHeader, StatusBadge } from '../components/ui'
import { formatDate, formatMoney, statusLabels } from '../data/seed'
import { useStore } from '../store'
import type { OrderStatus } from '../types'

const filters: Array<OrderStatus | 'all'> = [
  'all',
  'new',
  'confirmed',
  'in_transit',
  'delivered',
  'closed',
  'cancelled',
]

export function OrdersPage() {
  const { orders, clients, carriers, vehicles, addOrder } = useStore()
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all')
  const [open, setOpen] = useState(false)

  const list = useMemo(
    () =>
      orders
        .filter((o) => filter === 'all' || o.status === filter)
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [orders, filter],
  )

  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? '—'
  const carrierName = (id?: string) =>
    id ? carriers.find((c) => c.id === id)?.name ?? '—' : 'Не назначен'

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    addOrder({
      clientId: String(fd.get('clientId')),
      carrierId: String(fd.get('carrierId') || '') || undefined,
      vehicleId: String(fd.get('vehicleId') || '') || undefined,
      status: 'new',
      cargo: String(fd.get('cargo')),
      weightTons: Number(fd.get('weightTons')),
      fromCity: String(fd.get('fromCity')),
      toCity: String(fd.get('toCity')),
      loadingDate: String(fd.get('loadingDate')),
      deliveryDate: String(fd.get('deliveryDate')),
      clientRate: Number(fd.get('clientRate')),
      carrierRate: Number(fd.get('carrierRate') || 0),
      notes: String(fd.get('notes') || '') || undefined,
    })
    setOpen(false)
  }

  return (
    <div>
      <PageHeader
        title="Заказы"
        description="Учёт перевозок, ставок и статусов исполнения"
        action={
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-asphalt px-4 py-2.5 text-sm font-medium text-white hover:bg-steel"
          >
            <Plus size={16} />
            Новый заказ
          </button>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              filter === f
                ? 'bg-asphalt text-white'
                : 'bg-white text-mist ring-1 ring-fog hover:text-ink'
            }`}
          >
            {f === 'all' ? 'Все' : statusLabels[f]}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-fog/80 bg-white">
        {list.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-mist">Нет заказов в этом статусе</p>
        ) : (
          list.map((order) => (
            <Link
              key={order.id}
              to={`/app/orders/${order.id}`}
              className="grid gap-3 border-b border-fog/60 px-5 py-4 transition last:border-0 hover:bg-paper/70 lg:grid-cols-[1fr_1.3fr_1fr_1fr_0.7fr_0.8fr] lg:items-center"
            >
              <div>
                <p className="font-medium">{order.number}</p>
                <p className="text-xs text-mist">{formatDate(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm">{clientName(order.clientId)}</p>
                <p className="text-sm text-mist">
                  {order.fromCity} → {order.toCity}
                </p>
              </div>
              <div>
                <p className="text-sm">{order.cargo}</p>
                <p className="text-xs text-mist">{order.weightTons} т</p>
              </div>
              <div>
                <p className="text-sm text-mist">{carrierName(order.carrierId)}</p>
                <p className="text-xs text-mist">
                  {formatDate(order.loadingDate)} / {formatDate(order.deliveryDate)}
                </p>
              </div>
              <StatusBadge status={order.status} />
              <p className="text-sm font-medium lg:text-right">{formatMoney(order.clientRate)}</p>
            </Link>
          ))
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-4 sm:items-center">
          <form
            onSubmit={onSubmit}
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl md:p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">Новый заказ</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Закрыть">
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block text-mist">Клиент</span>
                <select name="clientId" required className="w-full rounded-lg border border-fog px-3 py-2">
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-mist">Откуда</span>
                <input name="fromCity" required className="w-full rounded-lg border border-fog px-3 py-2" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-mist">Куда</span>
                <input name="toCity" required className="w-full rounded-lg border border-fog px-3 py-2" />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block text-mist">Груз</span>
                <input name="cargo" required className="w-full rounded-lg border border-fog px-3 py-2" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-mist">Вес, т</span>
                <input
                  name="weightTons"
                  type="number"
                  step="0.1"
                  required
                  className="w-full rounded-lg border border-fog px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-mist">Ставка клиенту, ₽</span>
                <input
                  name="clientRate"
                  type="number"
                  required
                  className="w-full rounded-lg border border-fog px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-mist">Дата погрузки</span>
                <input
                  name="loadingDate"
                  type="date"
                  required
                  className="w-full rounded-lg border border-fog px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-mist">Дата доставки</span>
                <input
                  name="deliveryDate"
                  type="date"
                  required
                  className="w-full rounded-lg border border-fog px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-mist">Исполнитель</span>
                <select name="carrierId" className="w-full rounded-lg border border-fog px-3 py-2">
                  <option value="">Не выбран</option>
                  {carriers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-mist">Транспорт</span>
                <select name="vehicleId" className="w-full rounded-lg border border-fog px-3 py-2">
                  <option value="">Не выбран</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plate} · {v.type}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-mist">Ставка исполнителю, ₽</span>
                <input
                  name="carrierRate"
                  type="number"
                  className="w-full rounded-lg border border-fog px-3 py-2"
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block text-mist">Комментарий</span>
                <textarea name="notes" rows={2} className="w-full rounded-lg border border-fog px-3 py-2" />
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-2 text-sm text-mist hover:bg-paper"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="rounded-lg bg-signal px-4 py-2 text-sm font-semibold text-ink hover:bg-signal-deep"
              >
                Создать
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
