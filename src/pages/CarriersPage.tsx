import { useState } from 'react'
import type { FormEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { PageHeader } from '../components/ui'
import { vehicleStatusLabels } from '../data/seed'
import { useStore } from '../store'

export function CarriersPage() {
  const { carriers, vehicles, addCarrier } = useStore()
  const [open, setOpen] = useState(false)

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    addCarrier({
      name: String(fd.get('name')),
      inn: String(fd.get('inn')),
      phone: String(fd.get('phone')),
      email: String(fd.get('email')),
      city: String(fd.get('city')),
      contactPerson: String(fd.get('contactPerson')),
      vehiclesCount: Number(fd.get('vehiclesCount') || 0),
    })
    setOpen(false)
  }

  return (
    <div>
      <PageHeader
        title="Исполнители"
        description="Перевозчики и их транспортный парк"
        action={
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-asphalt px-4 py-2.5 text-sm font-medium text-white hover:bg-steel"
          >
            <Plus size={16} />
            Добавить исполнителя
          </button>
        }
      />

      <div className="space-y-6">
        {carriers.map((carrier) => {
          const fleet = vehicles.filter((v) => v.carrierId === carrier.id)
          return (
            <section key={carrier.id} className="rounded-2xl border border-fog/80 bg-white p-5 md:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-display text-lg font-semibold">{carrier.name}</h2>
                  <p className="text-sm text-mist">
                    {carrier.city} · {carrier.contactPerson} · {carrier.phone}
                  </p>
                </div>
                <span className="text-xs text-mist">
                  {fleet.length || carrier.vehiclesCount || 0} ед. транспорта
                </span>
              </div>

              {fleet.length > 0 && (
                <div className="mt-5 overflow-hidden rounded-xl border border-fog/70">
                  {fleet.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      className="grid gap-2 border-b border-fog/60 px-4 py-3 text-sm last:border-0 sm:grid-cols-[1fr_1fr_1fr_0.8fr]"
                    >
                      <div>
                        <p className="font-medium">{vehicle.plate}</p>
                        <p className="text-xs text-mist">{vehicle.brand}</p>
                      </div>
                      <p>{vehicle.type}</p>
                      <p className="text-mist">
                        {vehicle.capacityTons} т
                        {vehicle.volumeM3 ? ` / ${vehicle.volumeM3} м³` : ''}
                      </p>
                      <p
                        className={
                          vehicle.status === 'free'
                            ? 'text-ok'
                            : vehicle.status === 'busy'
                              ? 'text-signal-deep'
                              : 'text-danger'
                        }
                      >
                        {vehicleStatusLabels[vehicle.status]} · {vehicle.location}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
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
              <h2 className="font-display text-xl font-semibold">Новый исполнитель</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Закрыть">
                <X size={18} />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ['name', 'Название'],
                  ['inn', 'ИНН'],
                  ['contactPerson', 'Контакт'],
                  ['city', 'Город'],
                  ['phone', 'Телефон'],
                  ['email', 'Email'],
                ] as const
              ).map(([name, label]) => (
                <label key={name} className="block text-sm">
                  <span className="mb-1 block text-mist">{label}</span>
                  <input name={name} required className="w-full rounded-lg border border-fog px-3 py-2" />
                </label>
              ))}
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block text-mist">Кол-во машин</span>
                <input
                  name="vehiclesCount"
                  type="number"
                  min={0}
                  className="w-full rounded-lg border border-fog px-3 py-2"
                />
              </label>
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
