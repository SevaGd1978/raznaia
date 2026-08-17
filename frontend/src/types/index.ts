export type OrderStatus =
  | 'draft'
  | 'confirmed'
  | 'assigned'
  | 'in_transit'
  | 'completed'
  | 'closed'
  | 'cancelled'

export interface Counterparty {
  id: string
  type: 'client' | 'carrier'
  name: string
  inn?: string | null
  phone?: string | null
  email?: string | null
  is_active: boolean
  created_at: string
}

export interface Vehicle {
  id: string
  carrier_id: string
  plate_number: string
  brand?: string | null
  capacity_kg?: number | null
  volume_m3?: number | null
  is_active: boolean
  created_at: string
}

export interface OrderStatusHistory {
  id: string
  from_status: OrderStatus | null
  to_status: OrderStatus
  changed_at: string
}

export interface Order {
  id: string
  number: string
  client_id: string
  carrier_id?: string | null
  vehicle_id?: string | null
  status: OrderStatus
  origin: string
  destination: string
  load_date: string
  unload_date: string
  cargo_weight_kg?: number | null
  cargo_volume_m3?: number | null
  client_rate?: string | null
  carrier_rate?: string | null
  margin?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
  status_history?: OrderStatusHistory[]
}

export interface Paginated<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

export interface DashboardStats {
  total_orders: number
  by_status: Record<string, number>
  orders_today: number
  total_margin: string
}

export interface CounterpartyInput {
  name: string
  inn?: string
  phone?: string
  email?: string
}

export interface VehicleInput {
  carrier_id: string
  plate_number: string
  brand?: string
  capacity_kg?: number
  volume_m3?: number
}

export interface OrderInput {
  client_id: string
  origin: string
  destination: string
  load_date: string
  unload_date: string
  cargo_weight_kg?: number
  cargo_volume_m3?: number
  client_rate?: string
  carrier_rate?: string
  notes?: string
}

export interface OrderUpdateInput {
  client_id?: string
  carrier_id?: string | null
  vehicle_id?: string | null
  origin?: string
  destination?: string
  load_date?: string
  unload_date?: string
  cargo_weight_kg?: number
  cargo_volume_m3?: number
  client_rate?: string
  carrier_rate?: string
  notes?: string
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  draft: 'Черновик',
  confirmed: 'Подтверждён',
  assigned: 'Назначен',
  in_transit: 'В пути',
  completed: 'Выполнен',
  closed: 'Закрыт',
  cancelled: 'Отменён',
}

export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  draft: ['confirmed', 'cancelled'],
  confirmed: ['assigned', 'cancelled'],
  assigned: ['in_transit', 'cancelled'],
  in_transit: ['completed', 'cancelled'],
  completed: ['closed'],
  closed: [],
  cancelled: [],
}
