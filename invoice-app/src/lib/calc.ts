import { VAT_RATE, type Invoice, type LaborLine, type MoneyBreakdown, type PartLine } from '../types'

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function laborAmount(line: LaborLine): number {
  return roundMoney(line.hours * line.rate)
}

export function partAmount(line: PartLine): number {
  return roundMoney(line.quantity * line.unitPrice)
}

export function calcInvoice(invoice: Invoice): MoneyBreakdown {
  const laborNet = roundMoney(invoice.labor.reduce((sum, line) => sum + laborAmount(line), 0))
  const partsNet = roundMoney(invoice.parts.reduce((sum, line) => sum + partAmount(line), 0))
  const net = roundMoney(laborNet + partsNet)
  const vat = roundMoney(net * VAT_RATE)
  const gross = roundMoney(net + vat)

  return { laborNet, partsNet, net, vat, gross }
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
