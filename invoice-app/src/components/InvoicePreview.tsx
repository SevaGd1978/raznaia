import type { Invoice } from '../types'
import {
  calcInvoice,
  formatDate,
  formatMoney,
  formatNumber,
  laborAmount,
  partAmount,
  vatLabel,
} from '../lib/calc'

interface InvoicePreviewProps {
  invoice: Invoice
}

export function InvoicePreview({ invoice }: InvoicePreviewProps) {
  const totals = calcInvoice(invoice)

  return (
    <article className="invoice-preview" id="invoice-print">
      <header className="preview-header">
        <div>
          <p className="brand-mark">СчётМастер</p>
          <h1>Счёт на оплату № {invoice.number || '—'}</h1>
          <p className="preview-date">от {formatDate(invoice.date)}</p>
        </div>
        <div className="preview-badge">{vatLabel(invoice)}</div>
      </header>

      <div className="preview-parties">
        <div>
          <h3>Поставщик</h3>
          <p className="party-name">{invoice.seller.name || '—'}</p>
          <p>ИНН {invoice.seller.inn || '—'}</p>
          <p>{invoice.seller.address || '—'}</p>
          <p>{invoice.seller.phone || '—'}</p>
        </div>
        <div>
          <h3>Покупатель</h3>
          <p className="party-name">{invoice.buyer.name || '—'}</p>
          <p>ИНН {invoice.buyer.inn || '—'}</p>
          <p>{invoice.buyer.address || '—'}</p>
          <p>{invoice.buyer.phone || '—'}</p>
        </div>
      </div>

      {invoice.labor.length > 0 && (
        <section>
          <h3>Работы (нормочасы)</h3>
          <table>
            <thead>
              <tr>
                <th>№</th>
                <th>Наименование</th>
                <th>Н/ч</th>
                <th>Ставка</th>
                <th>Сумма</th>
              </tr>
            </thead>
            <tbody>
              {invoice.labor.map((line, index) => (
                <tr key={line.id}>
                  <td>{index + 1}</td>
                  <td>{line.name || '—'}</td>
                  <td>{formatNumber(line.hours, 2)}</td>
                  <td>{formatMoney(line.rate)}</td>
                  <td>{formatMoney(laborAmount(line))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {invoice.parts.length > 0 && (
        <section>
          <h3>Запасные части</h3>
          <table>
            <thead>
              <tr>
                <th>№</th>
                <th>Наименование</th>
                <th>Артикул</th>
                <th>Кол-во</th>
                <th>Цена</th>
                <th>Сумма</th>
              </tr>
            </thead>
            <tbody>
              {invoice.parts.map((line, index) => (
                <tr key={line.id}>
                  <td>{index + 1}</td>
                  <td>{line.name || '—'}</td>
                  <td>{line.sku || '—'}</td>
                  <td>{formatNumber(line.quantity, 0)}</td>
                  <td>{formatMoney(line.unitPrice)}</td>
                  <td>{formatMoney(partAmount(line))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <footer className="preview-totals">
        <div className="preview-notes">
          {invoice.notes ? (
            <>
              <h3>Примечание</h3>
              <p>{invoice.notes}</p>
            </>
          ) : null}
        </div>
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
            <dt>{totals.vatEnabled ? 'Итого без НДС' : 'Итого'}</dt>
            <dd>{formatMoney(totals.net)}</dd>
          </div>
          {totals.vatEnabled ? (
            <div>
              <dt>НДС {totals.vatPercent}%</dt>
              <dd>{formatMoney(totals.vat)}</dd>
            </div>
          ) : (
            <div>
              <dt>НДС</dt>
              <dd>Не облагается</dd>
            </div>
          )}
          <div className="gross">
            <dt>Всего к оплате</dt>
            <dd>{formatMoney(totals.gross)}</dd>
          </div>
        </dl>
      </footer>
    </article>
  )
}
