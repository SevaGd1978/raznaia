export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-slate-200">
      <p className="text-lg font-semibold text-slate-900">{title}</p>
      {description ? <p className="mt-2 text-sm text-slate-600">{description}</p> : null}
    </div>
  )
}
