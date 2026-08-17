import { useState } from 'react'
import type { FormEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { PageHeader } from '../components/ui'
import { useStore } from '../store'

export function ClientsPage() {
  const { clients, orders, addClient } = useStore()
  const [open, setOpen] = useState(false)

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    addClient({
      name: String(fd.get('name')),
      inn: String(fd.get('inn')),
      phone: String(fd.get('phone')),
      email: String(fd.get('email')),
      city: String(fd.get('city')),
      contactPerson: String(fd.get('contactPerson')),
    })
    setOpen(false)
  }

  return (
    <div>
      <PageHeader
        title="Клиенты"
        description="Заказчики перевозок и контактные лица"
        action={
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-asphalt px-4 py-2.5 text-sm font-medium text-white hover:bg-steel"
          >
            <Plus size={16} />
            Добавить клиента
          </button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        {clients.map((client) => {
          const count = orders.filter((o) => o.clientId === client.id).length
          return (
            <article
              key={client.id}
              className="rounded-2xl border border-fog/80 bg-white p-5 transition hover:border-mist/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-semibold">{client.name}</h2>
                  <p className="mt-1 text-sm text-mist">{client.city}</p>
                </div>
                <span className="rounded-md bg-paper px-2 py-1 text-xs text-mist">
                  {count} зак.
                </span>
              </div>
              <dl className="mt-4 grid gap-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-mist">Контакт</dt>
                  <dd>{client.contactPerson}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-mist">Телефон</dt>
                  <dd>{client.phone}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-mist">Email</dt>
                  <dd className="truncate">{client.email}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-mist">ИНН</dt>
                  <dd>{client.inn}</dd>
                </div>
              </dl>
            </article>
          )
        })}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-4 sm:items-center">
          <form
            onSubmit={onSubmit}
            className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl md:p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">Новый клиент</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Закрыть">
                <X size={18} />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ['name', 'Название', 'text', true],
                  ['inn', 'ИНН', 'text', true],
                  ['contactPerson', 'Контактное лицо', 'text', true],
                  ['city', 'Город', 'text', true],
                  ['phone', 'Телефон', 'tel', true],
                  ['email', 'Email', 'email', true],
                ] as const
              ).map(([name, label, type, required]) => (
                <label key={name} className="block text-sm">
                  <span className="mb-1 block text-mist">{label}</span>
                  <input
                    name={name}
                    type={type}
                    required={required}
                    className="w-full rounded-lg border border-fog px-3 py-2"
                  />
                </label>
              ))}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-4 py-2 text-sm text-mist">
                Отмена
              </button>
              <button type="submit" className="rounded-lg bg-signal px-4 py-2 text-sm font-semibold text-ink">
                Сохранить
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
