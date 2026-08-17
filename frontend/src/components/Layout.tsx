import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Дашборд', end: true },
  { to: '/orders', label: 'Заказы' },
  { to: '/clients', label: 'Клиенты' },
  { to: '/carriers', label: 'Перевозчики' },
  { to: '/vehicles', label: 'Транспорт' },
]

export function Layout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Raznaia TMS</p>
            <h1 className="text-lg font-bold text-slate-900">Управление перевозками</h1>
          </div>
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 sm:inline-block"
          >
            API Docs
          </a>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row">
        <nav className="flex shrink-0 gap-2 overflow-x-auto lg:w-56 lg:flex-col">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  'rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap',
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
