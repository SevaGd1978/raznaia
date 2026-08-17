import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Printer } from 'lucide-react'
import { useEffect } from 'react'
import { buildDocumentLines, documentSubtitle } from '../lib/documentContent'
import { docStatusLabels, formatDate } from '../data/seed'
import { useStore } from '../store'

export function DocumentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { documents, orders, clients, carriers, vehicles } = useStore()

  const doc = documents.find((d) => d.id === id)
  const order = doc ? orders.find((o) => o.id === doc.orderId) : undefined

  useEffect(() => {
    if (!doc || !order) return
    if (searchParams.get('print') === '1') {
      const timer = window.setTimeout(() => window.print(), 250)
      return () => window.clearTimeout(timer)
    }
  }, [doc, order, searchParams])

  if (!doc || !order) {
    return (
      <div>
        <p className="text-mist">Документ не найден</p>
        <Link to="/app/documents" className="mt-3 inline-block text-teal hover:underline">
          К списку документов
        </Link>
      </div>
    )
  }

  const client = clients.find((c) => c.id === order.clientId)
  const carrier = carriers.find((c) => c.id === order.carrierId)
  const vehicle = vehicles.find((v) => v.id === order.vehicleId)
  const lines = buildDocumentLines({ doc, order, client, carrier, vehicle })

  return (
    <div>
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate('/app/documents')}
          className="inline-flex items-center gap-2 text-sm text-mist hover:text-ink"
        >
          <ArrowLeft size={16} />
          К документам
        </button>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/app/orders/${order.id}`}
            className="rounded-lg border border-fog bg-white px-4 py-2 text-sm text-ink hover:bg-paper"
          >
            Открыть заказ {order.number}
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-asphalt px-4 py-2.5 text-sm font-medium text-white hover:bg-steel"
          >
            <Printer size={16} />
            Печать / PDF
          </button>
        </div>
      </div>

      <article
        id="printable-document"
        className="mx-auto max-w-3xl rounded-2xl border border-fog/80 bg-white p-6 shadow-sm md:p-10 print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none"
      >
        <header className="border-b border-fog pb-6">
          <p className="font-display text-sm font-semibold tracking-wide text-signal-deep">
            CargoDesk
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-ink md:text-3xl">
            {doc.title}
          </h1>
          <p className="mt-2 text-sm text-mist">
            {documentSubtitle(doc.kind)} · от {formatDate(doc.createdAt)} ·{' '}
            {docStatusLabels[doc.status]}
          </p>
        </header>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <section>
            <h2 className="text-xs uppercase tracking-[0.14em] text-mist">Исполнитель</h2>
            <p className="mt-2 font-medium">ООО «ТрансЛогистика»</p>
            <p className="text-sm text-mist">ИНН 7700000000 · Москва</p>
          </section>
          <section>
            <h2 className="text-xs uppercase tracking-[0.14em] text-mist">Заказчик</h2>
            <p className="mt-2 font-medium">{client?.name ?? '—'}</p>
            <p className="text-sm text-mist">
              ИНН {client?.inn ?? '—'}
              {client?.city ? ` · ${client.city}` : ''}
            </p>
          </section>
        </div>

        <section className="mt-8">
          <h2 className="text-xs uppercase tracking-[0.14em] text-mist">Содержание</h2>
          <ul className="mt-4 space-y-2 text-sm leading-relaxed text-ink">
            {lines.map((line) => (
              <li key={line} className="border-b border-fog/50 pb-2 last:border-0">
                {line}
              </li>
            ))}
          </ul>
        </section>

        <footer className="mt-12 grid gap-8 border-t border-fog pt-8 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-mist">Подпись исполнителя</p>
            <div className="mt-10 border-b border-ink/40" />
            <p className="mt-2 text-xs text-mist">ООО «ТрансЛогистика»</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-mist">Подпись заказчика</p>
            <div className="mt-10 border-b border-ink/40" />
            <p className="mt-2 text-xs text-mist">{client?.name ?? 'Заказчик'}</p>
          </div>
        </footer>

        <p className="mt-8 text-center text-xs text-mist print:mt-10">
          Документ сформирован в CargoDesk · {new Date().toLocaleString('ru-RU')}
        </p>
      </article>
    </div>
  )
}
