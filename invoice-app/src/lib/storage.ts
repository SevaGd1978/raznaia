import { createEmptyInvoice, type Invoice } from '../types'

const STORAGE_KEY = 'invoice-module:drafts'
const ACTIVE_KEY = 'invoice-module:active-id'

export function loadDrafts(): Invoice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return [createEmptyInvoice()]
    const parsed = JSON.parse(raw) as Invoice[]
    return parsed.length > 0 ? parsed : [createEmptyInvoice()]
  } catch {
    return [createEmptyInvoice()]
  }
}

export function saveDrafts(drafts: Invoice[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts))
}

export function loadActiveId(drafts: Invoice[]): string {
  const saved = localStorage.getItem(ACTIVE_KEY)
  if (saved && drafts.some((d) => d.id === saved)) return saved
  return drafts[0]?.id ?? ''
}

export function saveActiveId(id: string): void {
  localStorage.setItem(ACTIVE_KEY, id)
}
