export function formatMoney(value?: string | null) {
  if (!value) return '—'
  const number = Number(value)
  if (Number.isNaN(number)) return value
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(number)
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU').format(new Date(value))
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10)
}
