export const DEFAULT_VAT_PERCENT = 22

/** Типовые ставки НДС в РФ */
export const VAT_PERCENT_OPTIONS = [0, 5, 7, 10, 20, 22] as const

export type LineKind = 'labor' | 'part'

export interface LaborLine {
  id: string
  kind: 'labor'
  name: string
  hours: number
  rate: number
}

export interface PartLine {
  id: string
  kind: 'part'
  name: string
  sku: string
  quantity: number
  unitPrice: number
}

export type InvoiceLine = LaborLine | PartLine

export interface PartyInfo {
  name: string
  inn: string
  address: string
  phone: string
}

export interface Invoice {
  id: string
  number: string
  date: string
  seller: PartyInfo
  buyer: PartyInfo
  labor: LaborLine[]
  parts: PartLine[]
  notes: string
  /** Начислять НДС в итоге */
  vatEnabled: boolean
  /** Ставка НДС в процентах, например 22 */
  vatPercent: number
}

export interface MoneyBreakdown {
  laborNet: number
  partsNet: number
  net: number
  vat: number
  gross: number
  vatEnabled: boolean
  vatPercent: number
}

export function createId(): string {
  return crypto.randomUUID()
}

export function emptyParty(): PartyInfo {
  return { name: '', inn: '', address: '', phone: '' }
}

export function normalizeInvoice(raw: Partial<Invoice> & { id?: string }): Invoice {
  const base = createEmptyInvoice()
  return {
    ...base,
    ...raw,
    id: raw.id || base.id,
    seller: { ...base.seller, ...(raw.seller ?? {}) },
    buyer: { ...base.buyer, ...(raw.buyer ?? {}) },
    labor: Array.isArray(raw.labor) ? raw.labor : [],
    parts: Array.isArray(raw.parts) ? raw.parts : [],
    notes: raw.notes ?? '',
    vatEnabled: raw.vatEnabled ?? true,
    vatPercent:
      typeof raw.vatPercent === 'number' && Number.isFinite(raw.vatPercent)
        ? raw.vatPercent
        : DEFAULT_VAT_PERCENT,
  }
}

export function createEmptyInvoice(): Invoice {
  const today = new Date()
  const stamp = today.toISOString().slice(0, 10)
  return {
    id: createId(),
    number: `СЧ-${stamp.replaceAll('-', '')}-001`,
    date: stamp,
    seller: {
      name: 'ООО «Сервисный центр»',
      inn: '7700000000',
      address: 'г. Москва',
      phone: '+7 (495) 000-00-00',
    },
    buyer: emptyParty(),
    labor: [],
    parts: [],
    notes: '',
    vatEnabled: true,
    vatPercent: DEFAULT_VAT_PERCENT,
  }
}

export function createLaborLine(): LaborLine {
  return {
    id: createId(),
    kind: 'labor',
    name: '',
    hours: 1,
    rate: 2500,
  }
}

export function createPartLine(): PartLine {
  return {
    id: createId(),
    kind: 'part',
    name: '',
    sku: '',
    quantity: 1,
    unitPrice: 0,
  }
}
