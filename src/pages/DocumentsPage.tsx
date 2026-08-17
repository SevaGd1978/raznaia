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
        description="Заявки, счета, акты и накладные по заказам"
      />

      <div className="overflow-hidden rounded-2xl border border-fog/80 bg-white">
        <div className="hidden grid-cols-[1.2fr_1fr_0.8fr_0.8fr_0.8fr] gap-3 border-b border-fog/70 px-5 py-3 text-xs uppercase tracking-[0.12em] text-mist md:grid">
          <span>Документ</span>
          <span>Заказ</span>
          <span>Тип</span>
          <span>Дата</span>
          <span>Статус</span>
        </div>
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="grid gap-2 border-b border-fog/60 px-5 py-4 last:border-0 md:grid-cols-[1.2fr_1fr_0.8fr_0.8fr_0.8fr] md:items-center md:gap-3"
          >
            <p className="font-medium">{doc.title}</p>
            <p className="text-sm text-mist">{orderNumber(doc.orderId)}</p>
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
          </div>
        ))}
      </div>
    </div>
  )
}
