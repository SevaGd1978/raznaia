import { useEffect, useState } from 'react'
import {
  createEmptyInvoice,
  createLaborLine,
  createPartLine,
  type Invoice,
  type LaborLine,
  type PartLine,
} from '../types'
import { loadActiveId, loadDrafts, saveActiveId, saveDrafts } from '../lib/storage'

export function useInvoices() {
  const [drafts, setDrafts] = useState<Invoice[]>(() => loadDrafts())
  const [activeId, setActiveId] = useState(() => loadActiveId(loadDrafts()))

  useEffect(() => {
    saveDrafts(drafts)
  }, [drafts])

  useEffect(() => {
    if (activeId) saveActiveId(activeId)
  }, [activeId])

  const invoice = drafts.find((d) => d.id === activeId) ?? drafts[0]

  function updateInvoice(patch: Partial<Invoice> | ((current: Invoice) => Invoice)) {
    setDrafts((prev) =>
      prev.map((item) => {
        if (item.id !== invoice.id) return item
        return typeof patch === 'function' ? patch(item) : { ...item, ...patch }
      }),
    )
  }

  function createDraft() {
    const next = createEmptyInvoice()
    setDrafts((prev) => [next, ...prev])
    setActiveId(next.id)
  }

  function deleteDraft(id: string) {
    setDrafts((prev) => {
      const next = prev.filter((d) => d.id !== id)
      if (next.length === 0) {
        const empty = createEmptyInvoice()
        setActiveId(empty.id)
        return [empty]
      }
      if (id === activeId) setActiveId(next[0].id)
      return next
    })
  }

  function addLabor() {
    updateInvoice((current) => ({
      ...current,
      labor: [...current.labor, createLaborLine()],
    }))
  }

  function updateLabor(id: string, patch: Partial<LaborLine>) {
    updateInvoice((current) => ({
      ...current,
      labor: current.labor.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    }))
  }

  function removeLabor(id: string) {
    updateInvoice((current) => ({
      ...current,
      labor: current.labor.filter((line) => line.id !== id),
    }))
  }

  function addPart() {
    updateInvoice((current) => ({
      ...current,
      parts: [...current.parts, createPartLine()],
    }))
  }

  function updatePart(id: string, patch: Partial<PartLine>) {
    updateInvoice((current) => ({
      ...current,
      parts: current.parts.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    }))
  }

  function removePart(id: string) {
    updateInvoice((current) => ({
      ...current,
      parts: current.parts.filter((line) => line.id !== id),
    }))
  }

  return {
    drafts,
    invoice,
    activeId,
    setActiveId,
    createDraft,
    deleteDraft,
    updateInvoice,
    addLabor,
    updateLabor,
    removeLabor,
    addPart,
    updatePart,
    removePart,
  }
}
