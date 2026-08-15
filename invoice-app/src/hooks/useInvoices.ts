import { useEffect, useRef, useState } from 'react'
import {
  createEmptyInvoice,
  createLaborLine,
  createPartLine,
  type Invoice,
  type LaborLine,
  type PartLine,
} from '../types'
import { fetchInvoices, saveInvoices } from '../lib/api'

export function useInvoices(enabled: boolean) {
  const [drafts, setDrafts] = useState<Invoice[]>([])
  const [activeId, setActiveId] = useState('')
  const [ready, setReady] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const skipNextSave = useRef(true)

  useEffect(() => {
    if (!enabled) {
      setDrafts([])
      setActiveId('')
      setReady(false)
      return
    }

    let cancelled = false
    setReady(false)
    skipNextSave.current = true

    fetchInvoices()
      .then((data) => {
        if (cancelled) return
        const invoices = (data.invoices as Invoice[]) ?? []
        if (invoices.length === 0) {
          const empty = createEmptyInvoice()
          setDrafts([empty])
          setActiveId(empty.id)
        } else {
          setDrafts(invoices)
          setActiveId(invoices[0].id)
        }
        setReady(true)
      })
      .catch((err) => {
        if (cancelled) return
        setSyncError(err instanceof Error ? err.message : 'Не удалось загрузить счета')
        const empty = createEmptyInvoice()
        setDrafts([empty])
        setActiveId(empty.id)
        setReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled || !ready) return
    if (skipNextSave.current) {
      skipNextSave.current = false
      return
    }

    const timer = window.setTimeout(() => {
      void saveInvoices(drafts).catch((err) => {
        setSyncError(err instanceof Error ? err.message : 'Ошибка сохранения')
      })
    }, 400)

    return () => window.clearTimeout(timer)
  }, [drafts, enabled, ready])

  const invoice = drafts.find((d) => d.id === activeId) ?? drafts[0] ?? createEmptyInvoice()

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
    ready,
    syncError,
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
