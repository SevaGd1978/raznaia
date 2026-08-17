import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, FileStack, Shield, Smartphone } from 'lucide-react'

const features = [
  {
    icon: CheckCircle2,
    title: 'Заказы и маршруты',
    text: 'От заявки клиента до закрытия перевозки — в одной карточке заказа.',
  },
  {
    icon: FileStack,
    title: 'Документооборот',
    text: 'Заявки, счета, акты и накладные формируются из данных заказа.',
  },
  {
    icon: Shield,
    title: 'База контрагентов',
    text: 'Клиенты, исполнители и транспорт с актуальными статусами занятости.',
  },
  {
    icon: Smartphone,
    title: 'Работа команды',
    text: 'Логисты и диспетчеры видят одну картину: кто свободен и что в пути.',
  },
]

export function LandingPage() {
  return (
    <div className="bg-ink text-fog">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-8">
          <span className="font-display text-xl font-semibold tracking-tight text-white md:text-2xl">
            Cargo<span className="text-signal">Desk</span>
          </span>
          <nav className="flex items-center gap-3 md:gap-5">
            <a href="#features" className="hidden text-sm text-fog/80 transition hover:text-white sm:inline">
              Возможности
            </a>
            <Link
              to="/app"
              className="rounded-full bg-signal px-4 py-2 text-sm font-semibold text-ink transition hover:bg-signal-deep"
            >
              Открыть демо
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative min-h-[100svh] overflow-hidden">
        <div
          className="absolute inset-0 scale-105 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1601584115197-04ecc1da3480?auto=format&fit=crop&w=2000&q=80')",
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(105deg,rgba(7,11,18,0.92)_18%,rgba(7,11,18,0.72)_48%,rgba(7,11,18,0.45)_100%)]"
          aria-hidden
        />
        <div className="hero-grid absolute inset-0 opacity-40" aria-hidden />

        <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-5 pb-16 pt-28 md:justify-center md:px-8 md:pb-24 md:pt-20">
          <p className="animate-rise font-display text-4xl font-semibold leading-none tracking-tight text-white sm:text-5xl md:text-7xl lg:text-8xl">
            CargoDesk
          </p>
          <h1 className="animate-rise-delay mt-5 max-w-xl font-display text-xl font-medium leading-snug text-white/95 sm:text-2xl md:text-3xl">
            Автоматизация транспортной логистики для экспедиторов и перевозчиков
          </h1>
          <p className="animate-rise-delay-2 mt-4 max-w-lg text-base text-fog/85 md:text-lg">
            Ведите заказы, подбирайте транспорт, контролируйте документы и маржу —
            без таблиц и хаоса в мессенджерах.
          </p>
          <div className="animate-rise-delay-2 mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/app"
              className="inline-flex items-center gap-2 rounded-full bg-signal px-6 py-3 text-sm font-semibold text-ink transition hover:bg-signal-deep"
            >
              Запустить рабочий стол
              <ArrowRight size={16} />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 text-sm font-medium text-white transition hover:border-white/50"
            >
              Смотреть возможности
            </a>
          </div>
          <div className="mt-14 h-1 w-full max-w-md overflow-hidden rounded-full bg-white/10">
            <div className="lane-stripes h-full w-full opacity-90" />
          </div>
        </div>
      </section>

      <section id="features" className="border-t border-white/10 bg-asphalt">
        <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-24">
          <h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Инструмент логиста, а не набор разрозненных файлов
          </h2>
          <p className="mt-4 max-w-2xl text-fog/75">
            CargoDesk закрывает повседневный цикл перевозки: от заявки до оплаты и закрывающих документов.
          </p>

          <div className="mt-14 grid gap-10 sm:grid-cols-2">
            {features.map(({ icon: Icon, title, text }) => (
              <article key={title} className="border-t border-white/15 pt-6">
                <Icon className="text-signal" size={22} />
                <h3 className="mt-4 font-display text-xl font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fog/70">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-white/10">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1800&q=80')",
          }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-ink/80" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-24">
          <h2 className="font-display text-3xl font-semibold text-white md:text-4xl">
            Попробуйте демо прямо сейчас
          </h2>
          <p className="mt-4 max-w-xl text-fog/75">
            В демо уже есть заказы, клиенты, перевозчики и документы. Можно создавать новые записи —
            данные сохраняются в браузере.
          </p>
          <Link
            to="/app"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:bg-fog"
          >
            Перейти в CargoDesk
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-ink">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-sm text-mist md:flex-row md:items-center md:justify-between md:px-8">
          <span className="font-display text-white">
            Cargo<span className="text-signal">Desk</span>
          </span>
          <span>Демо-приложение для автоматизации грузоперевозок</span>
        </div>
      </footer>
    </div>
  )
}
