import { partAmount, formatMoney } from '../lib/calc'
import type { PartLine } from '../types'

interface PartsSectionProps {
  lines: PartLine[]
  onAdd: () => void
  onChange: (id: string, patch: Partial<PartLine>) => void
  onRemove: (id: string) => void
}

export function PartsSection({ lines, onAdd, onChange, onRemove }: PartsSectionProps) {
  return (
    <section className="lines-section" aria-labelledby="parts-title">
      <div className="section-head">
        <div>
          <h2 id="parts-title">Запасные части</h2>
          <p>Артикул, количество и цена без НДС. НДС 22% начисляется в итоге.</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={onAdd}>
          + Запчасть
        </button>
      </div>

      {lines.length === 0 ? (
        <p className="empty-hint">Пока нет запасных частей. Добавьте позицию со склада.</p>
      ) : (
        <div className="table-wrap">
          <table className="lines-table">
            <thead>
              <tr>
                <th>Наименование</th>
                <th>Артикул</th>
                <th>Кол-во</th>
                <th>Цена, ₽</th>
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
                      placeholder="Фильтр масляный"
                    />
                  </td>
                  <td>
                    <input
                      value={line.sku}
                      onChange={(e) => onChange(line.id, { sku: e.target.value })}
                      placeholder="OEM / SKU"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={line.quantity}
                      onChange={(e) => onChange(line.id, { quantity: Number(e.target.value) })}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      step={10}
                      value={line.unitPrice}
                      onChange={(e) => onChange(line.id, { unitPrice: Number(e.target.value) })}
                    />
                  </td>
                  <td className="money-cell">{formatMoney(partAmount(line))}</td>
                  <td>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => onRemove(line.id)}
                      aria-label="Удалить запчасть"
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
