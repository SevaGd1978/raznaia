import { describe, expect, it } from 'vitest'
import { calcInvoice, laborAmount, partAmount, roundMoney } from './calc'
import {
  createEmptyInvoice,
  createLaborLine,
  createPartLine,
  VAT_RATE,
} from '../types'

describe('invoice calculations', () => {
  it('counts labor as hours × rate', () => {
    const line = { ...createLaborLine(), hours: 2.5, rate: 2000 }
    expect(laborAmount(line)).toBe(5000)
  })

  it('counts parts as quantity × unit price', () => {
    const line = { ...createPartLine(), quantity: 3, unitPrice: 1500.5 }
    expect(partAmount(line)).toBe(4501.5)
  })

  it('applies 22% VAT to net total', () => {
    const invoice = createEmptyInvoice()
    invoice.labor = [{ ...createLaborLine(), hours: 2, rate: 2500, name: 'Диагностика' }]
    invoice.parts = [
      { ...createPartLine(), quantity: 2, unitPrice: 1000, name: 'Фильтр' },
    ]

    const totals = calcInvoice(invoice)

    expect(VAT_RATE).toBe(0.22)
    expect(totals.laborNet).toBe(5000)
    expect(totals.partsNet).toBe(2000)
    expect(totals.net).toBe(7000)
    expect(totals.vat).toBe(roundMoney(7000 * 0.22))
    expect(totals.gross).toBe(roundMoney(7000 + totals.vat))
    expect(totals.vat).toBe(1540)
    expect(totals.gross).toBe(8540)
  })
})
