import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import type { Counterparty, Order, OrderStatus, Vehicle } from '../types'
import { ALLOWED_TRANSITIONS, ORDER_STATUS_LABELS } from '../types'
import { formatDate, formatMoney, todayIso } from '../utils/format'

const emptyForm = {
  client_id: '',
  carrier_id: '',
  vehicle_id: '',
  origin: '',
  destination: '',
  load_date: todayIso(),
  unload_date: todayIso(),
  cargo_weight_kg: '',
  cargo_volume_m3: '',
  client_rate: '',
  carrier_rate: '',
  notes: '',
}

export function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'

  const [form, setForm] = useState(emptyForm)
  const [order, setOrder] = useState<Order | null>(null)
  const [clients, setClients] = useState<Counterparty[]>([])
  const [carriers, setCarriers] = useState<Counterparty[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [nextStatus, setNextStatus] = useState<OrderStatus | ''>('')

  useEffect(() => {
    Promise.all([api.getClients({ limit: 200 }), api.getCarriers({ limit: 200 })])
      .then(([clientsResponse, carriersResponse]) => {
        setClients(clientsResponse.items)
        setCarriers(carriersResponse.items)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Ошибка загрузки справочников'))
  }, [])

  useEffect(() => {
    if (isNew || !id) return

    setLoading(true)
    api
      .getOrder(id)
      .then((loaded) => {
        setOrder(loaded)
        setForm({
          client_id: loaded.client_id,
          carrier_id: loaded.carrier_id ?? '',
          vehicle_id: loaded.vehicle_id ?? '',
          origin: loaded.origin,
          destination: loaded.destination,
          load_date: loaded.load_date,
          unload_date: loaded.unload_date,
          cargo_weight_kg: loaded.cargo_weight_kg?.toString() ?? '',
          cargo_volume_m3: loaded.cargo_volume_m3?.toString() ?? '',
          client_rate: loaded.client_rate ?? '',
          carrier_rate: loaded.carrier_rate ?? '',
          notes: loaded.notes ?? '',
        })
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Заказ не найден'))
      .finally(() => setLoading(false))
  }, [id, isNew])

  useEffect(() => {
    if (!form.carrier_id) {
      setVehicles([])
      return
    }

    api
      .getVehicles({ carrier_id: form.carrier_id, limit: 100 })
      .then((response) => setVehicles(response.items))
      .catch(() => setVehicles([]))
  }, [form.carrier_id])

  const allowedStatuses = order ? ALLOWED_TRANSITIONS[order.status] : []

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)

    const payload = {
      client_id: form.client_id,
      origin: form.origin,
      destination: form.destination,
      load_date: form.load_date,
      unload_date: form.unload_date,
      cargo_weight_kg: form.cargo_weight_kg ? Number(form.cargo_weight_kg) : undefined,
      cargo_volume_m3: form.cargo_volume_m3 ? Number(form.cargo_volume_m3) : undefined,
      client_rate: form.client_rate || undefined,
      carrier_rate: form.carrier_rate || undefined,
      notes: form.notes || undefined,
    }

    try {
      if (isNew) {
        const created = await api.createOrder(payload)
        navigate(`/orders/${created.id}`)
        return
      }

      if (!id) return

      const updated = await api.updateOrder(id, {
        ...payload,
        carrier_id: form.carrier_id || null,
        vehicle_id: form.vehicle_id || null,
      })
      setOrder(updated)
      setMessage('Заказ сохранён')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось сохранить заказ')
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusChange() {
    if (!id || !nextStatus) return
    setSaving(true)
    setError(null)
    try {
      const updated = await api.changeOrderStatus(id, nextStatus)
      setOrder(updated)
      setNextStatus('')
      setMessage(`Статус изменён: ${ORDER_STATUS_LABELS[updated.status]}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось сменить статус')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <PageHeader
        title={isNew ? 'Новый заказ' : `Заказ ${order?.number ?? ''}`}
        description={isNew ? 'Создание перевозки' : 'Редактирование и управление статусом'}
        action={
          <Link to="/orders" className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-white">
            ← К списку
          </Link>
        }
      />

      {!isNew && order ? (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
          <StatusBadge status={order.status} />
          <span className="text-sm text-slate-600">Маржа: {formatMoney(order.margin)}</span>
          <span className="text-sm text-slate-600">Обновлён: {formatDate(order.updated_at)}</span>
          <a
            href={api.getApplicationUrl(order.id)}
            target="_blank"
            rel="noreferrer"
            className="ml-auto rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
          >
            Скачать заявку
          </a>
        </div>
      ) : null}

      {message ? (
        <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>
      ) : null}
      {error ? (
        <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm sm:col-span-2">
              <span className="font-medium text-slate-700">Клиент</span>
              <select
                required
                value={form.client_id}
                onChange={(event) => setForm({ ...form, client_id: event.target.value })}
                className="rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="">Выберите клиента</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1 text-sm sm:col-span-2">
              <span className="font-medium text-slate-700">Откуда</span>
              <input
                required
                value={form.origin}
                onChange={(event) => setForm({ ...form, origin: event.target.value })}
                className="rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="grid gap-1 text-sm sm:col-span-2">
              <span className="font-medium text-slate-700">Куда</span>
              <input
                required
                value={form.destination}
                onChange={(event) => setForm({ ...form, destination: event.target.value })}
                className="rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="grid gap-1 text-sm">
              <span className="font-medium text-slate-700">Дата погрузки</span>
              <input
                required
                type="date"
                value={form.load_date}
                onChange={(event) => setForm({ ...form, load_date: event.target.value })}
                className="rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="grid gap-1 text-sm">
              <span className="font-medium text-slate-700">Дата выгрузки</span>
              <input
                required
                type="date"
                value={form.unload_date}
                onChange={(event) => setForm({ ...form, unload_date: event.target.value })}
                className="rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="grid gap-1 text-sm">
              <span className="font-medium text-slate-700">Вес, кг</span>
              <input
                type="number"
                min="0"
                value={form.cargo_weight_kg}
                onChange={(event) => setForm({ ...form, cargo_weight_kg: event.target.value })}
                className="rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="grid gap-1 text-sm">
              <span className="font-medium text-slate-700">Объём, м³</span>
              <input
                type="number"
                min="0"
                value={form.cargo_volume_m3}
                onChange={(event) => setForm({ ...form, cargo_volume_m3: event.target.value })}
                className="rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="grid gap-1 text-sm">
              <span className="font-medium text-slate-700">Ставка клиента</span>
              <input
                value={form.client_rate}
                onChange={(event) => setForm({ ...form, client_rate: event.target.value })}
                className="rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="grid gap-1 text-sm">
              <span className="font-medium text-slate-700">Ставка перевозчика</span>
              <input
                value={form.carrier_rate}
                onChange={(event) => setForm({ ...form, carrier_rate: event.target.value })}
                className="rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="grid gap-1 text-sm sm:col-span-2">
              <span className="font-medium text-slate-700">Примечание</span>
              <textarea
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
                className="min-h-24 rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
          </div>

          {!isNew ? (
            <div className="mt-6 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-slate-700">Перевозчик</span>
                <select
                  value={form.carrier_id}
                  onChange={(event) =>
                    setForm({ ...form, carrier_id: event.target.value, vehicle_id: '' })
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="">Не назначен</option>
                  {carriers.map((carrier) => (
                    <option key={carrier.id} value={carrier.id}>
                      {carrier.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-sm">
                <span className="font-medium text-slate-700">Транспорт</span>
                <select
                  value={form.vehicle_id}
                  onChange={(event) => setForm({ ...form, vehicle_id: event.target.value })}
                  className="rounded-lg border border-slate-300 px-3 py-2"
                  disabled={!form.carrier_id}
                >
                  <option value="">Не назначен</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.plate_number} {vehicle.brand ? `· ${vehicle.brand}` : ''}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? 'Сохранение...' : isNew ? 'Создать заказ' : 'Сохранить'}
            </button>
          </div>
        </div>

        {!isNew && order ? (
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
              <h3 className="font-semibold text-slate-900">Смена статуса</h3>
              {allowedStatuses.length > 0 ? (
                <div className="mt-4 space-y-3">
                  <select
                    value={nextStatus}
                    onChange={(event) => setNextStatus(event.target.value as OrderStatus | '')}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="">Выберите статус</option>
                    {allowedStatuses.map((status) => (
                      <option key={status} value={status}>
                        {ORDER_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!nextStatus || saving}
                    onClick={handleStatusChange}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
                  >
                    Применить статус
                  </button>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">Дальнейшие переходы недоступны.</p>
              )}
            </div>

            {order.status_history && order.status_history.length > 0 ? (
              <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
                <h3 className="font-semibold text-slate-900">История статусов</h3>
                <ul className="mt-4 space-y-3">
                  {[...order.status_history].reverse().map((entry) => (
                    <li key={entry.id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
                      <div className="font-medium text-slate-800">
                        {entry.from_status
                          ? `${ORDER_STATUS_LABELS[entry.from_status]} → ${ORDER_STATUS_LABELS[entry.to_status]}`
                          : ORDER_STATUS_LABELS[entry.to_status]}
                      </div>
                      <div className="text-slate-500">{formatDate(entry.changed_at)}</div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </form>
    </div>
  )
}
