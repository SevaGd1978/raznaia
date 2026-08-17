import type {
  Counterparty,
  CounterpartyInput,
  DashboardStats,
  Order,
  OrderInput,
  OrderStatus,
  OrderUpdateInput,
  Paginated,
  Vehicle,
  VehicleInput,
} from '../types'
import { authHeaders, clearToken } from '../auth/storage'

const API_BASE = '/api/v1'

export interface LoginResponse {
  access_token: string
  token_type: string
  user: {
    id: string
    email: string
    role: string
  }
}

export interface AuthUser {
  id: string
  email: string
  role: string
}

class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}, auth = true): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }

  if (auth) {
    Object.assign(headers, authHeaders())
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  if (response.status === 401 && auth) {
    clearToken()
  }

  if (!response.ok) {
    let detail = response.statusText
    try {
      const body = await response.json()
      detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail)
    } catch {
      // ignore parse errors
    }
    throw new ApiError(detail, response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export const api = {
  login: (email: string, password: string) =>
    request<LoginResponse>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
      false,
    ),

  me: () => request<AuthUser>('/auth/me'),

  health: () => request<{ status: string }>('/health', {}, false),

  dashboard: () => request<DashboardStats>('/dashboard'),

  getClients: (params?: { search?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams()
    if (params?.search) query.set('search', params.search)
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.offset) query.set('offset', String(params.offset))
    const suffix = query.toString() ? `?${query}` : ''
    return request<Paginated<Counterparty>>(`/clients${suffix}`)
  },
  createClient: (payload: CounterpartyInput) =>
    request<Counterparty>('/clients', { method: 'POST', body: JSON.stringify(payload) }),

  getCarriers: (params?: { search?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams()
    if (params?.search) query.set('search', params.search)
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.offset) query.set('offset', String(params.offset))
    const suffix = query.toString() ? `?${query}` : ''
    return request<Paginated<Counterparty>>(`/carriers${suffix}`)
  },
  createCarrier: (payload: CounterpartyInput) =>
    request<Counterparty>('/carriers', { method: 'POST', body: JSON.stringify(payload) }),

  getVehicles: (params?: { carrier_id?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams()
    if (params?.carrier_id) query.set('carrier_id', params.carrier_id)
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.offset) query.set('offset', String(params.offset))
    const suffix = query.toString() ? `?${query}` : ''
    return request<Paginated<Vehicle>>(`/vehicles${suffix}`)
  },
  createVehicle: (payload: VehicleInput) =>
    request<Vehicle>('/vehicles', { method: 'POST', body: JSON.stringify(payload) }),

  getOrders: (params?: {
    status?: OrderStatus
    client_id?: string
    date_from?: string
    date_to?: string
    limit?: number
    offset?: number
  }) => {
    const query = new URLSearchParams()
    if (params?.status) query.set('status', params.status)
    if (params?.client_id) query.set('client_id', params.client_id)
    if (params?.date_from) query.set('date_from', params.date_from)
    if (params?.date_to) query.set('date_to', params.date_to)
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.offset) query.set('offset', String(params.offset))
    const suffix = query.toString() ? `?${query}` : ''
    return request<Paginated<Order>>(`/orders${suffix}`)
  },
  getOrder: (id: string) => request<Order>(`/orders/${id}`),
  createOrder: (payload: OrderInput) =>
    request<Order>('/orders', { method: 'POST', body: JSON.stringify(payload) }),
  updateOrder: (id: string, payload: OrderUpdateInput) =>
    request<Order>(`/orders/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  changeOrderStatus: (id: string, status: OrderStatus) =>
    request<Order>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  getOrdersReport: (params: { from: string; to: string }) => {
    const query = new URLSearchParams({ from: params.from, to: params.to, format: 'json' })
    return request<Paginated<Order>>(`/reports/orders?${query}`)
  },

  downloadApplication: async (id: string, filename?: string) => {
    const response = await fetch(`${API_BASE}/orders/${id}/application.pdf`, {
      headers: authHeaders(),
    })
    if (!response.ok) {
      throw new ApiError('Не удалось скачать заявку', response.status)
    }
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename ?? `application-${id}.pdf`
    anchor.click()
    URL.revokeObjectURL(url)
  },

  downloadOrdersReportCsv: async (from: string, to: string) => {
    const query = new URLSearchParams({ from, to, format: 'csv' })
    const response = await fetch(`${API_BASE}/reports/orders?${query}`, {
      headers: authHeaders(),
    })
    if (!response.ok) {
      throw new ApiError('Не удалось скачать отчёт', response.status)
    }
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `orders-${from}-${to}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  },
}

export { ApiError }
