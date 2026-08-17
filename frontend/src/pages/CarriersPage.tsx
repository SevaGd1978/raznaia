import { type FormEvent, useEffect, useState } from 'react'
import { api, ApiError } from '../api/client'
import { EmptyState } from '../components/EmptyState'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { Modal } from '../components/Modal'
import { PageHeader } from '../components/PageHeader'
import type { Counterparty } from '../types'

export function CarriersPage() {
  const [items, setItems] = useState<Counterparty[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', inn: '', phone: '', email: '' })

  async function loadCarriers(query = search) {
    setLoading(true)
    try {
      const response = await api.getCarriers({ search: query || undefined, limit: 100 })
      setItems(response.items)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCarriers()
  }, [])

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    try {
      await api.createCarrier({
        name: form.name,
        inn: form.inn || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
      })
      setOpen(false)
      setForm({ name: '', inn: '', phone: '', email: '' })
      await loadCarriers()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось создать перевозчика')
    }
  }

  return (
    <div>
      <PageHeader
        title="Перевозчики"
        description="Исполнители и собственный/привлечённый транспорт"
        action={
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Добавить перевозчика
          </button>
        }
      />

      <div className="mb-4 flex gap-3">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Поиск по названию или ИНН"
          className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => loadCarriers(search)}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-white"
        >
          Найти
        </button>
      </div>

      {error ? <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {loading ? <LoadingSpinner /> : null}
      {!loading && items.length === 0 ? <EmptyState title="Перевозчиков пока нет" /> : null}

      {!loading && items.length > 0 ? (
        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Название</th>
                <th className="px-4 py-3 font-medium">ИНН</th>
                <th className="px-4 py-3 font-medium">Телефон</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                  <td className="px-4 py-3">{item.inn || '—'}</td>
                  <td className="px-4 py-3">{item.phone || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <Modal title="Новый перевозчик" open={open} onClose={() => setOpen(false)}>
        <form onSubmit={handleCreate} className="grid gap-4">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Название</span>
            <input
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">ИНН</span>
            <input
              value={form.inn}
              onChange={(event) => setForm({ ...form, inn: event.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Телефон</span>
            <input
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
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
