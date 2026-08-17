export type OrderStatus =
  | 'new'
  | 'confirmed'
  | 'in_transit'
  | 'delivered'
  | 'closed'
  | 'cancelled'

export type Order = {
  id: string
  number: string
  clientId: string
  carrierId?: string
  vehicleId?: string
  status: OrderStatus
  cargo: string
  weightTons: number
  fromCity: string
  toCity: string
  loadingDate: string
  deliveryDate: string
  clientRate: number
  carrierRate: number
  notes?: string
  createdAt: string
}

export type Counterparty = {
  id: string
  name: string
  inn: string
  phone: string
  email: string
  city: string
  contactPerson: string
  type: 'client' | 'carrier'
  vehiclesCount?: number
}

export type Vehicle = {
  id: string
  plate: string
  brand: string
  type: string
  capacityTons: number
  volumeM3: number
  carrierId: string
  status: 'free' | 'busy' | 'repair'
  location: string
}

export type DocumentItem = {
  id: string
  orderId: string
  title: string
  kind: 'request' | 'invoice' | 'act' | 'contract' | 'waybill'
  createdAt: string
  status: 'draft' | 'sent' | 'signed'
}
