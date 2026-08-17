import {
  createContext,
  createElement,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from 'react'
import {
  carriers as seedCarriers,
  clients as seedClients,
  documents as seedDocuments,
  orders as seedOrders,
  vehicles as seedVehicles,
} from './data/seed'
import type { Counterparty, DocumentItem, Order, Vehicle } from './types'

const STORAGE_KEY = 'cargodesk-data-v1'

type StoreData = {
  orders: Order[]
  clients: Counterparty[]
  carriers: Counterparty[]
  vehicles: Vehicle[]
  documents: DocumentItem[]
}

type StoreApi = StoreData & {
  addOrder: (order: Omit<Order, 'id' | 'number' | 'createdAt'>) => Order
  updateOrder: (id: string, patch: Partial<Order>) => void
  addClient: (client: Omit<Counterparty, 'id' | 'type'>) => void
  addCarrier: (carrier: Omit<Counterparty, 'id' | 'type'>) => void
  resetDemo: () => void
}

const defaultData: StoreData = {
  orders: seedOrders,
  clients: seedClients,
  carriers: seedCarriers,
  vehicles: seedVehicles,
  documents: seedDocuments,
}

function loadData(): StoreData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return structuredClone(defaultData)
    return { ...structuredClone(defaultData), ...JSON.parse(raw) }
  } catch {
    return structuredClone(defaultData)
  }
}

const StoreContext = createContext<StoreApi | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<StoreData>(() => loadData())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  const api = useMemo<StoreApi>(
    () => ({
      ...data,
      addOrder: (order) => {
        const created: Order = {
          ...order,
          id: `or-${crypto.randomUUID().slice(0, 8)}`,
          number: `З-2026-${String(1400 + data.orders.length + 1).padStart(4, '0')}`,
          createdAt: new Date().toISOString(),
        }
        setData((prev) => ({ ...prev, orders: [created, ...prev.orders] }))
        return created
      },
      updateOrder: (id, patch) => {
        setData((prev) => ({
          ...prev,
          orders: prev.orders.map((o) => (o.id === id ? { ...o, ...patch } : o)),
        }))
      },
      addClient: (client) => {
        const item: Counterparty = {
          ...client,
          id: `cl-${crypto.randomUUID().slice(0, 8)}`,
          type: 'client',
        }
        setData((prev) => ({ ...prev, clients: [item, ...prev.clients] }))
      },
      addCarrier: (carrier) => {
        const item: Counterparty = {
          ...carrier,
          id: `cr-${crypto.randomUUID().slice(0, 8)}`,
          type: 'carrier',
          vehiclesCount: carrier.vehiclesCount ?? 0,
        }
        setData((prev) => ({ ...prev, carriers: [item, ...prev.carriers] }))
      },
      resetDemo: () => setData(structuredClone(defaultData)),
    }),
    [data],
  )

  return createElement(StoreContext.Provider, { value: api }, children)
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
