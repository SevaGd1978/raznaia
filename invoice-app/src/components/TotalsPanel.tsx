import type { MoneyBreakdown } from '../types'
import { formatMoney } from '../lib/calc'

interface TotalsPanelProps {
  totals: MoneyBreakdown
}

export function TotalsPanel({ totals }: TotalsPanelProps) {
  return (
    <aside className="totals-panel" aria-label="Итоги счёта">
      <h2>Итоги</h2>
      <dl>
        <div>
          <dt>Работы</dt>
          <dd>{formatMoney(totals.laborNet)}</dd>
        </div>
        <div>
          <dt>Запчасти</dt>
          <dd>{formatMoney(totals.partsNet)}</dd>
        </div>
        <div>
          <dt>{totals.vatEnabled ? 'Сумма без НДС' : 'Сумма'}</dt>
          <dd>{formatMoney(totals.net)}</dd>
        </div>
        {totals.vatEnabled ? (
          <div className="vat-row">
            <dt>НДС {totals.vatPercent}%</dt>
            <dd>{formatMoney(totals.vat)}</dd>
          </div>
        ) : (
          <div className="vat-row">
            <dt>НДС</dt>
            <dd>Без НДС</dd>
          </div>
        )}
        <div className="gross-row">
          <dt>К оплате</dt>
          <dd>{formatMoney(totals.gross)}</dd>
        </div>
      </dl>
    </aside>
  )
}
