import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Truck,
  FileText,
  BarChart3,
  RotateCcw,
  ArrowLeft,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../store'

const nav = [
  { to: '/app', end: true, label: 'Обзор', icon: LayoutDashboard },
  { to: '/app/orders', label: 'Заказы', icon: ClipboardList },
  { to: '/app/clients', label: 'Клиенты', icon: Users },
  { to: '/app/carriers', label: 'Исполнители', icon: Truck },
  { to: '/app/documents', label: 'Документы', icon: FileText },
  { to: '/app/reports', label: 'Отчёты', icon: BarChart3 },
]

export function AppLayout() {
  const { resetDemo } = useStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen bg-paper text-ink lg:grid lg:grid-cols-[240px_1fr]">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[240px] border-r border-fog/70 bg-asphalt text-fog transition-transform lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="font-display text-lg font-semibold tracking-tight text-white"
          >
            Cargo<span className="text-signal">Desk</span>
          </button>
          <button
            type="button"
            className="rounded-md p-1 text-mist lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Закрыть меню"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex flex-col gap-1 px-3 pb-6">
          {nav.map(({ to, end, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                  isActive
                    ? 'bg-steel text-white'
                    : 'text-mist hover:bg-steel/60 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-4">
          <button
            type="button"
            onClick={() => {
              resetDemo()
              setOpen(false)
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-mist transition hover:bg-steel/60 hover:text-white"
          >
            <RotateCcw size={16} />
            Сбросить демо
          </button>
        </div>
      </aside>

      {open && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-ink/40 lg:hidden"
          aria-label="Закрыть"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-fog/80 bg-paper/90 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-md border border-fog bg-white p-2 text-asphalt lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Открыть меню"
            >
              <Menu size={18} />
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="hidden items-center gap-2 text-sm text-mist transition hover:text-ink sm:flex"
            >
              <ArrowLeft size={16} />
              На сайт
            </button>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-ink">Демо-логист</p>
            <p className="text-xs text-mist">ООО «ТрансЛогистика»</p>
          </div>
        </header>

        <main className="px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
