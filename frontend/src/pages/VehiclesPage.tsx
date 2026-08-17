import { type FormEvent, useEffect, useState } from 'react'
import { api, ApiError } from '../api/client'
import { EmptyState } from '../components/EmptyState'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { Modal } from '../components/Modal'
import { PageHeader } from '../components/PageHeader'
import type { Counterparty, Vehicle } from '../types'

export function VehiclesPage() {
  const [items, setItems] = useState<Vehicle[]>([])
  const [carriers, setCarriers] = useState<Counterparty[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    carrier_id: '',
    plate_number: '',
    brand: '',
    capacity_kg: '',
    volume_m3: '',
  })

  const carrierMap = Object.fromEntries(carriers.map((carrier) => [carrier.id, carrier.name]))

  async function loadData() {
    setLoading(true)
    try {
      const [vehiclesResponse, carriersResponse] = await Promise.all([
        api.getVehicles({ limit: 100 }),
        api.getCarriers({ limit: 200 }),
      ])
      setItems(vehiclesResponse.items)
      setCarriers(carriersResponse.items)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    try {
      await api.createVehicle({
        carrier_id: form.carrier_id,
        plate_number: form.plate_number,
        brand: form.brand || undefined,
        capacity_kg: form.capacity_kg ? Number(form.capacity_kg) : undefined,
        volume_m3: form.volume_m3 ? Number(form.volume_m3) : undefined,
      })
      setOpen(false)
      setForm({ carrier_id: '', plate_number: '', brand: '', capacity_kg: '', volume_m3: '' })
      await loadData()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось добавить транспорт')
    }
  }

  return (
    <div>
      <PageHeader
        title="Транспорт"
        description="Транспортные средства перевозчиков"
        action={
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Добавить ТС
          </button>
        }
      />

      {error ? <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {loading ? <LoadingSpinner /> : null}
      {!loading && items.length === 0 ? <EmptyState title="Транспорт пока не добавлен" /> : null}

      {!loading && items.length > 0 ? (
        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Госномер</th>
                <th className="px-4 py-3 font-medium">Марка</th>
                <th className="px-4 py-3 font-medium">Перевозчик</th>
                <th className="px-4 py-3 font-medium">Грузоподъёмность</th>
                <th className="px-4 py-3 font-medium">Объём</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900">{item.plate_number}</td>
                  <td className="px-4 py-3">{item.brand || '—'}</td>
                  <td className="px-4 py-3">{carrierMap[item.carrier_id] || '—'}</td>
                  <td className="px-4 py-3">{item.capacity_kg ? `${item.capacity_kg} кг` : '—'}</td>
                  <td className="px-4 py-3">{item.volume_m3 ? `${item.volume_m3} м³` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <Modal title="Новое ТС" open={open} onClose={() => setOpen(false)}>
        <form onSubmit={handleCreate} className="grid gap-4">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Перевозчик</span>
            <select
              required
              value={form.carrier_id}
              onChange={(event) => setForm({ ...form, carrier_id: event.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">Выберите перевозчика</option>
              {carriers.map((carrier) => (
                <option key={carrier.id} value={carrier.id}>
                  {carrier.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Госномер</span>
            <input
              required
              value={form.plate_number}
              onChange={(event) => setForm({ ...form, plate_number: event.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Марка</span>
            <input
              value={form.brand}
              onChange={(event) => setForm({ ...form, brand: event.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Грузоподъёмность, кг</span>
            <input
              type="number"
              min="0"
              value={form.capacity_kg}
              onChange={(event) => setForm({ ...form, capacity_kg: event.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Объём, м³</span>
            <input
              type="number"
              min="0"
              value={form.volume_m3}
              onChange={(event) => setForm({ ...form, volume_m3: event.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
            Сохранить
          </button>
        </form>
      </Modal>
    </div>
  )
}
