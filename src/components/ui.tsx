import type { ReactNode } from 'react'
import type { OrderStatus } from '../types'
import { statusLabels } from '../data/seed'

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium status-${status}`}
    >
      {statusLabels[status]}
    </span>
  )
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink md:text-3xl">
          {title}
        </h1>
        {description && <p className="mt-1 text-sm text-mist">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="border-b border-fog/80 pb-4 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-6 last:border-0 last:pr-0">
      <p className="text-xs uppercase tracking-[0.14em] text-mist">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-mist">{hint}</p>}
    </div>
  )
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-fog bg-white px-6 py-12 text-center text-sm text-mist">
      {text}
    </div>
  )
}
