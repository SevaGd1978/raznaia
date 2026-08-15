import { laborAmount, formatMoney } from '../lib/calc'
import type { LaborLine } from '../types'

interface LaborSectionProps {
  lines: LaborLine[]
  onAdd: () => void
  onChange: (id: string, patch: Partial<LaborLine>) => void
  onRemove: (id: string) => void
}

export function LaborSection({ lines, onAdd, onChange, onRemove }: LaborSectionProps) {
  return (
    <section className="lines-section" aria-labelledby="labor-title">
      <div className="section-head">
        <div>
          <h2 id="labor-title">Работы · нормочасы</h2>
          <p>Укажите наименование работ, количество нормочасов и ставку.</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={onAdd}>
          + Работа
        </button>
      </div>

      {lines.length === 0 ? (
        <p className="empty-hint">Пока нет позиций работ. Добавьте первую строку.</p>
      ) : (
        <div className="table-wrap">
          <table className="lines-table">
            <thead>
              <tr>
                <th>Наименование работ</th>
                <th>Н/ч</th>
                <th>Ставка, ₽</th>
                <th>Сумма</th>
                <th aria-label="Действия" />
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.id}>
                  <td>
                    <input
                      value={line.name}
                      onChange={(e) => onChange(line.id, { name: e.target.value })}
                      placeholder="Диагностика / ремонт / ТО"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      step={0.1}
                      value={line.hours}
                      onChange={(e) => onChange(line.id, { hours: Number(e.target.value) })}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={line.rate}
                      onChange={(e) => onChange(line.id, { rate: Number(e.target.value) })}
                    />
                  </td>
                  <td className="money-cell">{formatMoney(laborAmount(line))}</td>
                  <td>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => onRemove(line.id)}
                      aria-label="Удалить работу"
                    >
                      ×
                    </button>
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
