import { describe, expect, it } from 'vitest'
import { calcInvoice, laborAmount, partAmount, roundMoney } from './calc'
import {
  createEmptyInvoice,
  createLaborLine,
  createPartLine,
  DEFAULT_VAT_PERCENT,
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

  it('applies selected VAT percent to net total', () => {
    const invoice = createEmptyInvoice()
    invoice.vatEnabled = true
    invoice.vatPercent = 22
    invoice.labor = [{ ...createLaborLine(), hours: 2, rate: 2500, name: 'Диагностика' }]
    invoice.parts = [
      { ...createPartLine(), quantity: 2, unitPrice: 1000, name: 'Фильтр' },
    ]

    const totals = calcInvoice(invoice)

    expect(DEFAULT_VAT_PERCENT).toBe(22)
    expect(totals.laborNet).toBe(5000)
    expect(totals.partsNet).toBe(2000)
    expect(totals.net).toBe(7000)
    expect(totals.vat).toBe(roundMoney(7000 * 0.22))
    expect(totals.gross).toBe(roundMoney(7000 + totals.vat))
    expect(totals.vat).toBe(1540)
    expect(totals.gross).toBe(8540)
  })

  it('skips VAT when disabled', () => {
    const invoice = createEmptyInvoice()
    invoice.vatEnabled = false
    invoice.vatPercent = 22
    invoice.labor = [{ ...createLaborLine(), hours: 1, rate: 1000, name: 'Работа' }]

    const totals = calcInvoice(invoice)
    expect(totals.net).toBe(1000)
    expect(totals.vat).toBe(0)
    expect(totals.gross).toBe(1000)
    expect(totals.vatEnabled).toBe(false)
  })

  it('supports custom VAT percent like 10%', () => {
    const invoice = createEmptyInvoice()
    invoice.vatEnabled = true
    invoice.vatPercent = 10
    invoice.parts = [{ ...createPartLine(), quantity: 1, unitPrice: 2000, name: 'Деталь' }]

    const totals = calcInvoice(invoice)
    expect(totals.net).toBe(2000)
    expect(totals.vat).toBe(200)
    expect(totals.gross).toBe(2200)
    expect(totals.vatPercent).toBe(10)
  })
})
