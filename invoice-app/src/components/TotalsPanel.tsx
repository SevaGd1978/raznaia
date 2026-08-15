import { VAT_RATE, type MoneyBreakdown } from '../types'
import { formatMoney } from '../lib/calc'

interface TotalsPanelProps {
  totals: MoneyBreakdown
}

export function TotalsPanel({ totals }: TotalsPanelProps) {
  const vatPercent = Math.round(VAT_RATE * 100)

  return (
    <aside className="totals-panel" aria-label="Итоги счёта">
      <h2>Итоги</h2>
      <dl>
        <div>
          <dt>Работы без НДС</dt>
          <dd>{formatMoney(totals.laborNet)}</dd>
        </div>
        <div>
          <dt>Запчасти без НДС</dt>
          <dd>{formatMoney(totals.partsNet)}</dd>
        </div>
        <div>
          <dt>Сумма без НДС</dt>
          <dd>{formatMoney(totals.net)}</dd>
        </div>
        <div className="vat-row">
          <dt>НДС {vatPercent}%</dt>
          <dd>{formatMoney(totals.vat)}</dd>
        </div>
        <div className="gross-row">
          <dt>К оплате</dt>
          <dd>{formatMoney(totals.gross)}</dd>
        </div>
      </dl>
    </aside>
  )
}
