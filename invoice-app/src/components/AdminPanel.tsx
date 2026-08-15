import { useEffect, useState } from 'react'
import { deleteAdminUser, fetchAdminUsers } from '../lib/api'

type AdminUser = {
  id: string
  login: string
  display_name: string
  role: string
  created_at: string
}

export function AdminPanel({ onClose }: { onClose: () => void }) {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAdminUsers()
      setUsers(data.users)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function onDelete(id: string) {
    if (!confirm('Удалить пользователя и его счета?')) return
    try {
      await deleteAdminUser(id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления')
    }
  }

  return (
    <section className="admin-panel no-print" aria-labelledby="admin-title">
      <div className="section-head">
        <div>
          <h2 id="admin-title">Админ-панель</h2>
          <p>Список пользователей. Вход администратора — логин admin и пароль администратора.</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Закрыть
        </button>
      </div>

      {loading && <p className="empty-hint">Загрузка…</p>}
      {error && <p className="auth-error">{error}</p>}

      {!loading && !error && (
        <div className="table-wrap">
          <table className="lines-table admin-table">
            <thead>
              <tr>
                <th>Логин</th>
                <th>Имя</th>
                <th>Роль</th>
                <th>Создан</th>
                <th aria-label="Действия" />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.login}</td>
                  <td>{user.display_name}</td>
                  <td>{user.role === 'admin' ? 'админ' : 'пользователь'}</td>
                  <td>{new Date(user.created_at).toLocaleString('ru-RU')}</td>
                  <td>
                    {user.role !== 'admin' && (
                      <button
                        type="button"
                        className="btn-icon"
                        aria-label={`Удалить ${user.login}`}
                        onClick={() => void onDelete(user.id)}
                      >
                        ×
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
