import type { Invoice, LaborLine, MoneyBreakdown, PartLine } from '../types'

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function laborAmount(line: LaborLine): number {
  return roundMoney(line.hours * line.rate)
}

export function partAmount(line: PartLine): number {
  return roundMoney(line.quantity * line.unitPrice)
}

export function resolveVatPercent(invoice: Invoice): number {
  if (!invoice.vatEnabled) return 0
  const percent = Number(invoice.vatPercent)
  if (!Number.isFinite(percent) || percent < 0) return 0
  return percent
}

export function calcInvoice(invoice: Invoice): MoneyBreakdown {
  const laborNet = roundMoney(invoice.labor.reduce((sum, line) => sum + laborAmount(line), 0))
  const partsNet = roundMoney(invoice.parts.reduce((sum, line) => sum + partAmount(line), 0))
  const net = roundMoney(laborNet + partsNet)
  const vatPercent = resolveVatPercent(invoice)
  const vatEnabled = Boolean(invoice.vatEnabled) && vatPercent > 0
  const vat = vatEnabled ? roundMoney(net * (vatPercent / 100)) : 0
  const gross = roundMoney(net + vat)

  return { laborNet, partsNet, net, vat, gross, vatEnabled, vatPercent }
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2,
  }).format(value)
}

export function formatNumber(value: number, digits = 2): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(value)
}

export function formatDate(iso: string): string {
  if (!iso) return '—'
  const date = new Date(`${iso}T00:00:00`)
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function vatLabel(invoice: Invoice): string {
  if (!invoice.vatEnabled) return 'Без НДС'
  return `НДС ${resolveVatPercent(invoice)}%`
}
