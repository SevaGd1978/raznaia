export function LoadingSpinner({ label = 'Загрузка...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-2xl bg-white p-10 ring-1 ring-slate-200">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      <span className="text-sm text-slate-600">{label}</span>
    </div>
  )
}
