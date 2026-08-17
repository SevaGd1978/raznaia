import { Link } from 'react-router-dom'
import { Printer } from 'lucide-react'
import { PageHeader } from '../components/ui'
import { docKindLabels, docStatusLabels, formatDate } from '../data/seed'
import { useStore } from '../store'

export function DocumentsPage() {
  const { documents, orders } = useStore()

  const orderNumber = (id: string) => orders.find((o) => o.id === id)?.number ?? '—'

  return (
    <div>
      <PageHeader
        title="Документы"
        description="Откройте документ для просмотра и выгрузки в печать"
      />

      <div className="overflow-hidden rounded-2xl border border-fog/80 bg-white">
        <div className="hidden grid-cols-[1.2fr_1fr_0.8fr_0.8fr_0.8fr_auto] gap-3 border-b border-fog/70 px-5 py-3 text-xs uppercase tracking-[0.12em] text-mist md:grid">
          <span>Документ</span>
          <span>Заказ</span>
          <span>Тип</span>
          <span>Дата</span>
          <span>Статус</span>
          <span className="text-right">Действия</span>
        </div>
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="grid gap-2 border-b border-fog/60 px-5 py-4 last:border-0 md:grid-cols-[1.2fr_1fr_0.8fr_0.8fr_0.8fr_auto] md:items-center md:gap-3"
          >
            <Link
              to={`/app/documents/${doc.id}`}
              className="font-medium text-ink underline-offset-2 hover:text-teal hover:underline"
            >
              {doc.title}
            </Link>
            <Link
              to={`/app/orders/${doc.orderId}`}
              className="text-sm text-mist underline-offset-2 hover:text-ink hover:underline"
            >
              {orderNumber(doc.orderId)}
            </Link>
            <p className="text-sm">{docKindLabels[doc.kind]}</p>
            <p className="text-sm text-mist">{formatDate(doc.createdAt)}</p>
            <span
              className={`inline-flex w-fit rounded-md px-2 py-0.5 text-xs font-medium ${
                doc.status === 'signed'
                  ? 'bg-emerald-50 text-ok'
                  : doc.status === 'sent'
                    ? 'bg-amber-50 text-signal-deep'
                    : 'bg-paper text-mist'
              }`}
            >
              {docStatusLabels[doc.status]}
            </span>
            <div className="flex items-center gap-2 md:justify-end">
              <Link
                to={`/app/documents/${doc.id}`}
                className="rounded-lg border border-fog px-3 py-1.5 text-xs font-medium text-ink hover:bg-paper"
              >
                Открыть
              </Link>
              <Link
                to={`/app/documents/${doc.id}?print=1`}
                className="inline-flex items-center gap-1 rounded-lg bg-asphalt px-3 py-1.5 text-xs font-medium text-white hover:bg-steel"
                title="Печать"
              >
                <Printer size={14} />
                Печать
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
