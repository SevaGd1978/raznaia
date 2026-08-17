import { useMemo, useState } from 'react'
import {
  Calculator,
  ChevronDown,
  CircleAlert,
  Factory,
  FileDown,
  RotateCcw,
  Ruler,
  ShieldCheck,
} from 'lucide-react'
import {
  calculateSupport,
  initialSupportInputs,
  type SupportInputs,
} from '../lib/slidingSupportCalc'

type NumberFieldProps = {
  label: string
  field: keyof SupportInputs
  value: number
  suffix?: string
  min?: number
  step?: number
  onChange: (field: keyof SupportInputs, value: number) => void
}

function NumberField({
  label,
  field,
  value,
  suffix = 'мм',
  min = 0,
  step = 1,
  onChange,
}: NumberFieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-500">
        {label}
      </span>
      <span className="flex overflow-hidden rounded-lg border border-slate-200 bg-white transition focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100">
        <input
          className="min-w-0 flex-1 px-3 py-2.5 text-sm font-semibold tabular-nums text-slate-900 outline-none"
          type="number"
          min={min}
          step={step}
          value={value}
          onChange={(event) =>
            onChange(field, Math.max(min, Number(event.target.value) || 0))
          }
        />
        <span className="flex min-w-12 items-center justify-center border-l border-slate-100 bg-slate-50 px-2 text-xs text-slate-400">
          {suffix}
        </span>
      </span>
    </label>
  )
}

function SectionTitle({
  number,
  title,
  description,
}: {
  number: string
  title: string
  description: string
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-xs font-bold text-orange-600">
        {number}
      </span>
      <div>
        <h2 className="font-display text-sm font-semibold text-slate-900">
          {title}
        </h2>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
          {description}
        </p>
      </div>
    </div>
  )
}

const formatNumber = (value: number, digits = 1) =>
  new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value)

const formatMoney = (value: number) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value)

export function SlidingSupportCalculatorPage() {
  const [inputs, setInputs] = useState<SupportInputs>(initialSupportInputs)
  const [showSettings, setShowSettings] = useState(false)
  const result = useMemo(() => calculateSupport(inputs), [inputs])

  const update = (field: keyof SupportInputs, value: number) => {
    setInputs((current) => ({ ...current, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-slate-900">
      <header className="no-print border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-[1480px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-orange-500 text-white">
              <Factory size={20} strokeWidth={2.2} />
            </span>
            <div>
              <p className="font-display text-sm font-bold tracking-tight">
                ТЕПЛОТЕХ
              </p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                производственные расчёты
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
            <ShieldCheck size={16} className="text-emerald-600" />
            Расчёт выполняется локально
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1480px] px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">
              <Calculator size={15} />
              Калькулятор производства
            </div>
            <h1 className="max-w-4xl font-display text-2xl font-bold leading-tight tracking-tight sm:text-3xl lg:text-[38px]">
              Расчёт материала для скользящих опор
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-500 sm:text-base">
              Рассчитайте массу листового проката, фторопласта, площадь
              окраски и ориентировочную стоимость партии.
            </p>
          </div>
          <div className="no-print flex gap-2">
            <button
              type="button"
              onClick={() => setInputs(initialSupportInputs)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            >
              <RotateCcw size={16} />
              Сбросить
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              <FileDown size={16} />
              Печать / PDF
            </button>
          </div>
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[430px_minmax(0,1fr)]">
          <aside className="no-print space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
              <SectionTitle
                number="01"
                title="Параметры партии"
                description="Количество изделий и диаметр трубопровода"
              />
              <div className="grid grid-cols-2 gap-3">
                <NumberField
                  label="Количество опор"
                  field="quantity"
                  value={inputs.quantity}
                  suffix="шт."
                  min={1}
                  onChange={update}
                />
                <NumberField
                  label="Наружный диаметр трубы"
                  field="pipeDiameter"
                  value={inputs.pipeDiameter}
                  onChange={update}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
              <SectionTitle
                number="02"
                title="Основание и ложемент"
                description="Габариты заготовок из листовой стали"
              />
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Основание
              </p>
              <div className="grid grid-cols-3 gap-2">
                <NumberField
                  label="Длина"
                  field="baseLength"
                  value={inputs.baseLength}
                  onChange={update}
                />
                <NumberField
                  label="Ширина"
                  field="baseWidth"
                  value={inputs.baseWidth}
                  onChange={update}
                />
                <NumberField
                  label="Толщина"
                  field="baseThickness"
                  value={inputs.baseThickness}
                  onChange={update}
                />
              </div>
              <p className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Ложемент
              </p>
              <div className="grid grid-cols-3 gap-2">
                <NumberField
                  label="Ширина"
                  field="saddleWidth"
                  value={inputs.saddleWidth}
                  onChange={update}
                />
                <NumberField
                  label="Толщина"
                  field="saddleThickness"
                  value={inputs.saddleThickness}
                  onChange={update}
                />
                <NumberField
                  label="Угол охвата"
                  field="wrapAngle"
                  value={inputs.wrapAngle}
                  suffix="°"
                  min={1}
                  onChange={update}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
              <SectionTitle
                number="03"
                title="Рёбра и прокладка"
                description="Дополнительные детали одной опоры"
              />
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Ребро жёсткости
              </p>
              <div className="grid grid-cols-2 gap-2">
                <NumberField
                  label="Катет, длина"
                  field="ribLength"
                  value={inputs.ribLength}
                  onChange={update}
                />
                <NumberField
                  label="Катет, высота"
                  field="ribHeight"
                  value={inputs.ribHeight}
                  onChange={update}
                />
                <NumberField
                  label="Толщина"
                  field="ribThickness"
                  value={inputs.ribThickness}
                  onChange={update}
                />
                <NumberField
                  label="На одну опору"
                  field="ribsPerSupport"
                  value={inputs.ribsPerSupport}
                  suffix="шт."
                  min={0}
                  onChange={update}
                />
              </div>
              <p className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Скользящая прокладка
              </p>
              <div className="grid grid-cols-3 gap-2">
                <NumberField
                  label="Длина"
                  field="gasketLength"
                  value={inputs.gasketLength}
                  onChange={update}
                />
                <NumberField
                  label="Ширина"
                  field="gasketWidth"
                  value={inputs.gasketWidth}
                  onChange={update}
                />
                <NumberField
                  label="Толщина"
                  field="gasketThickness"
                  value={inputs.gasketThickness}
                  onChange={update}
                />
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40">
              <button
                type="button"
                onClick={() => setShowSettings((value) => !value)}
                className="flex w-full items-center justify-between p-5 text-left"
              >
                <div>
                  <p className="font-display text-sm font-semibold">
                    Цены и коэффициенты
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Плотность, отходы и стоимость
                  </p>
                </div>
                <ChevronDown
                  size={18}
                  className={`text-slate-400 transition ${showSettings ? 'rotate-180' : ''}`}
                />
              </button>
              {showSettings && (
                <div className="grid grid-cols-2 gap-3 border-t border-slate-100 p-5">
                  <NumberField
                    label="Плотность стали"
                    field="steelDensity"
                    value={inputs.steelDensity}
                    suffix="кг/м³"
                    onChange={update}
                  />
                  <NumberField
                    label="Плотность прокладки"
                    field="gasketDensity"
                    value={inputs.gasketDensity}
                    suffix="кг/м³"
                    onChange={update}
                  />
                  <NumberField
                    label="Отходы"
                    field="wastePercent"
                    value={inputs.wastePercent}
                    suffix="%"
                    step={0.5}
                    onChange={update}
                  />
                  <NumberField
                    label="Сталь"
                    field="steelPrice"
                    value={inputs.steelPrice}
                    suffix="₽/кг"
                    onChange={update}
                  />
                  <NumberField
                    label="Фторопласт"
                    field="gasketPrice"
                    value={inputs.gasketPrice}
                    suffix="₽/кг"
                    onChange={update}
                  />
                  <NumberField
                    label="Окраска"
                    field="paintPrice"
                    value={inputs.paintPrice}
                    suffix="₽/м²"
                    onChange={update}
                  />
                </div>
              )}
            </section>
          </aside>

          <div className="space-y-6">
            <section className="overflow-hidden rounded-2xl bg-slate-900 text-white shadow-xl shadow-slate-300/40">
              <div className="grid lg:grid-cols-[1fr_300px]">
                <div className="p-6 sm:p-8">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-orange-400">
                    <Ruler size={15} />
                    Результат расчёта
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-slate-400">Масса 1 опоры</p>
                      <p className="mt-1 text-2xl font-bold tabular-nums">
                        {formatNumber(result.massPerSupport)}{' '}
                        <span className="text-sm font-normal text-slate-400">
                          кг
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Чистая масса партии</p>
                      <p className="mt-1 text-2xl font-bold tabular-nums">
                        {formatNumber(result.netMass)}{' '}
                        <span className="text-sm font-normal text-slate-400">
                          кг
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">К закупке</p>
                      <p className="mt-1 text-2xl font-bold tabular-nums text-orange-400">
                        {formatNumber(result.purchaseMass)}{' '}
                        <span className="text-sm font-normal text-orange-300/70">
                          кг
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Площадь окраски</p>
                      <p className="mt-1 text-2xl font-bold tabular-nums">
                        {formatNumber(result.paintArea)}{' '}
                        <span className="text-sm font-normal text-slate-400">
                          м²
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="mt-7 flex flex-col gap-2 border-t border-white/10 pt-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs text-slate-400">
                        Материалы и окраска, без работ
                      </p>
                      <p className="mt-1 text-3xl font-bold tracking-tight">
                        {formatMoney(result.totalCost)}
                      </p>
                    </div>
                    <p className="text-sm text-slate-400">
                      {formatMoney(result.costPerSupport)} / опора
                    </p>
                  </div>
                </div>

                <div className="relative hidden min-h-64 overflow-hidden border-l border-white/10 bg-slate-800 lg:block">
                  <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:24px_24px]" />
                  <svg
                    viewBox="0 0 300 250"
                    className="relative h-full w-full"
                    aria-label="Схема скользящей опоры"
                    role="img"
                  >
                    <path
                      d="M34 182 L155 216 L270 175 L148 143 Z"
                      fill="#f97316"
                      opacity=".9"
                    />
                    <path
                      d="M34 182 L34 194 L155 229 L155 216 Z"
                      fill="#c2410c"
                    />
                    <path
                      d="M155 216 L155 229 L270 187 L270 175 Z"
                      fill="#9a3412"
                    />
                    <path
                      d="M72 171 Q148 213 231 167 L231 145 Q149 189 72 149 Z"
                      fill="#94a3b8"
                    />
                    <path
                      d="M72 149 Q148 191 231 145"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="7"
                    />
                    <ellipse
                      cx="150"
                      cy="105"
                      rx="84"
                      ry="35"
                      fill="#334155"
                      stroke="#cbd5e1"
                      strokeWidth="5"
                    />
                    <path
                      d="M66 105 L66 139 Q149 180 234 137 L234 105 Q150 145 66 105"
                      fill="#475569"
                    />
                    <path d="M86 157 L105 191 L113 174 Z" fill="#cbd5e1" />
                    <path d="M211 157 L194 191 L186 174 Z" fill="#cbd5e1" />
                    <path
                      d="M54 204 L164 235"
                      stroke="#f8fafc"
                      strokeWidth="2"
                      strokeDasharray="4 5"
                      opacity=".5"
                    />
                  </svg>
                  <span className="absolute bottom-4 right-5 text-[10px] uppercase tracking-widest text-slate-500">
                    схема изделия
                  </span>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40">
              <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
                <div>
                  <h2 className="font-display text-base font-semibold">
                    Ведомость материалов
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Партия: {inputs.quantity} шт. · отходы {inputs.wastePercent}%
                  </p>
                </div>
                <p className="text-xs text-slate-400">
                  Масса рассчитана по объёму заготовок
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Деталь</th>
                      <th className="px-4 py-3 font-semibold">Заготовка</th>
                      <th className="px-4 py-3 text-right font-semibold">
                        Кол-во
                      </th>
                      <th className="px-4 py-3 text-right font-semibold">
                        На 1 опору
                      </th>
                      <th className="px-6 py-3 text-right font-semibold">
                        Масса партии
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.rows.map((row) => (
                      <tr key={row.name} className="hover:bg-slate-50/60">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800">
                            {row.name}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-400">
                            {row.material}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-500">
                          {row.dimensions}
                        </td>
                        <td className="px-4 py-4 text-right tabular-nums text-slate-600">
                          {row.batchPieces} шт.
                        </td>
                        <td className="px-4 py-4 text-right tabular-nums text-slate-600">
                          {formatNumber(row.massPerSupport, 2)} кг
                        </td>
                        <td className="px-6 py-4 text-right font-semibold tabular-nums">
                          {formatNumber(row.batchMass)} кг
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="grid border-t border-slate-100 bg-slate-50 sm:grid-cols-3">
                <div className="px-6 py-4">
                  <p className="text-xs text-slate-400">Сталь к закупке</p>
                  <p className="mt-1 font-semibold tabular-nums">
                    {formatNumber(result.purchaseSteelMass)} кг
                  </p>
                </div>
                <div className="border-slate-200 px-6 py-4 sm:border-l">
                  <p className="text-xs text-slate-400">Фторопласт к закупке</p>
                  <p className="mt-1 font-semibold tabular-nums">
                    {formatNumber(result.purchaseGasketMass)} кг
                  </p>
                </div>
                <div className="border-slate-200 px-6 py-4 sm:border-l">
                  <p className="text-xs text-slate-400">Площадь окраски стали</p>
                  <p className="mt-1 font-semibold tabular-nums">
                    {formatNumber(result.paintArea)} м²
                  </p>
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-[1fr_1.5fr]">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="font-display text-sm font-semibold">
                  Структура стоимости
                </h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Листовая сталь</dt>
                    <dd className="font-semibold tabular-nums">
                      {formatMoney(result.steelCost)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Фторопласт</dt>
                    <dd className="font-semibold tabular-nums">
                      {formatMoney(result.gasketCost)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-slate-100 pt-3">
                    <dt className="text-slate-500">Окраска</dt>
                    <dd className="font-semibold tabular-nums">
                      {formatMoney(result.paintCost)}
                    </dd>
                  </div>
                </dl>
              </div>
              <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <CircleAlert
                  className="mt-0.5 shrink-0 text-amber-600"
                  size={19}
                />
                <div>
                  <h2 className="text-sm font-semibold text-amber-950">
                    Проверьте расчёт по конструкторской документации
                  </h2>
                  <p className="mt-1.5 text-xs leading-relaxed text-amber-800/80">
                    Калькулятор считает геометрическую массу прямоугольных и
                    треугольных заготовок. Не учтены сварные швы, крепёж,
                    отверстия, гибочные припуски, защитные слои и стоимость
                    производственных работ.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
