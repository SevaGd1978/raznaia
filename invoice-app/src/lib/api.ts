export type AuthUser = {
  id: string
  login: string
  displayName: string
  role: 'user' | 'admin'
  createdAt: string
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || 'Ошибка запроса')
  }
  return data as T
}

export function fetchMe() {
  return request<{ user: AuthUser }>('/api/auth/me')
}

export function loginRequest(login: string, password: string) {
  return request<{ user: AuthUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ login, password }),
  })
}

export function registerRequest(login: string, password: string, displayName: string) {
  return request<{ user: AuthUser }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ login, password, displayName }),
  })
}

export function logoutRequest() {
  return request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' })
}

export function fetchInvoices() {
  return request<{ invoices: unknown[] }>('/api/invoices')
}

export function saveInvoices(invoices: unknown[]) {
  return request<{ ok: boolean }>('/api/invoices/bulk', {
    method: 'PUT',
    body: JSON.stringify({ invoices }),
  })
}

export function fetchAdminUsers() {
  return request<{
    users: Array<{
      id: string
      login: string
      display_name: string
      role: string
      created_at: string
    }>
  }>('/api/auth/admin/users')
}

export function deleteAdminUser(id: string) {
  return request<{ ok: boolean }>(`/api/auth/admin/users/${id}`, { method: 'DELETE' })
}
