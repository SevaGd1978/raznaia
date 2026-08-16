import { VAT_PERCENT_OPTIONS, type Invoice } from '../types'

interface VatSettingsProps {
  invoice: Invoice
  onChange: (patch: Pick<Invoice, 'vatEnabled' | 'vatPercent'>) => void
}

export function VatSettings({ invoice, onChange }: VatSettingsProps) {
  const known = VAT_PERCENT_OPTIONS.includes(
    invoice.vatPercent as (typeof VAT_PERCENT_OPTIONS)[number],
  )

  return (
    <section className="vat-settings" aria-labelledby="vat-settings-title">
      <div className="section-head">
        <div>
          <h2 id="vat-settings-title">НДС</h2>
          <p>Режим налогообложения и ставка для этого счёта.</p>
        </div>
      </div>

      <div className="vat-controls">
        <div className="vat-mode-tabs" role="group" aria-label="Режим НДС">
          <button
            type="button"
            className={invoice.vatEnabled ? 'active' : ''}
            aria-pressed={invoice.vatEnabled}
            onClick={() =>
              onChange({
                vatEnabled: true,
                vatPercent: invoice.vatPercent > 0 ? invoice.vatPercent : 22,
              })
            }
          >
            С НДС
          </button>
          <button
            type="button"
            className={!invoice.vatEnabled ? 'active' : ''}
            aria-pressed={!invoice.vatEnabled}
            onClick={() => onChange({ vatEnabled: false, vatPercent: invoice.vatPercent })}
          >
            Без НДС
          </button>
        </div>

        <div className={`vat-percent-row ${invoice.vatEnabled ? '' : 'is-disabled'}`}>
          <label>
            <span>Ставка НДС</span>
            <select
              value={known ? String(invoice.vatPercent) : 'custom'}
              disabled={!invoice.vatEnabled}
              onChange={(e) => {
                const value = e.target.value
                if (value === 'custom') {
                  onChange({ vatEnabled: true, vatPercent: invoice.vatPercent || 22 })
                  return
                }
                onChange({ vatEnabled: true, vatPercent: Number(value) })
              }}
            >
              {VAT_PERCENT_OPTIONS.filter((p) => p > 0).map((percent) => (
                <option key={percent} value={percent}>
                  {percent}%
                </option>
              ))}
              <option value="0">0%</option>
              <option value="custom">Другая ставка…</option>
            </select>
          </label>

          <label>
            <span>Процент</span>
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={invoice.vatPercent}
              disabled={!invoice.vatEnabled}
              onChange={(e) =>
                onChange({
                  vatEnabled: true,
                  vatPercent: Number(e.target.value),
                })
              }
            />
          </label>
        </div>
      </div>
    </section>
  )
}
