import { type FormEvent, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'

export function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('admin@raznaia.local')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/'

  if (!loading && isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await login(email, password)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось войти')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-200">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Raznaia TMS</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Вход в систему</h1>
        <p className="mt-2 text-sm text-slate-600">Управление транспортной логистикой</p>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">Email</span>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">Пароль</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          {error ? (
            <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Демо: admin@raznaia.local / admin123
        </p>
      </div>
    </div>
  )
}
