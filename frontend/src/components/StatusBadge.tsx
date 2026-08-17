import type { OrderStatus } from '../types'
import { ORDER_STATUS_LABELS } from '../types'

const STATUS_STYLES: Record<OrderStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  confirmed: 'bg-sky-100 text-sky-800',
  assigned: 'bg-indigo-100 text-indigo-800',
  in_transit: 'bg-amber-100 text-amber-800',
  completed: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-slate-200 text-slate-800',
  cancelled: 'bg-rose-100 text-rose-800',
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}>
      {ORDER_STATUS_LABELS[status]}
    </span>
  )
}
