import { useEffect, useState } from 'react'
import { calcInvoice } from './lib/calc'
import { useInvoices } from './hooks/useInvoices'
import { PartyFields } from './components/PartyFields'
import { LaborSection } from './components/LaborSection'
import { PartsSection } from './components/PartsSection'
import { TotalsPanel } from './components/TotalsPanel'
import { InvoicePreview } from './components/InvoicePreview'
import './App.css'

function App() {
  const {
    drafts,
    invoice,
    activeId,
    setActiveId,
    createDraft,
    deleteDraft,
    updateInvoice,
    addLabor,
    updateLabor,
    removeLabor,
    addPart,
    updatePart,
    removePart,
  } = useInvoices()

  const [showPreview, setShowPreview] = useState(false)
  const totals = calcInvoice(invoice)

  useEffect(() => {
    document.title = `Счёт ${invoice.number || ''} · СчётМастер`
  }, [invoice.number])

  return (
    <div className="app-shell">
      <div className="atmosphere" aria-hidden="true" />

      <header className="topbar">
        <div className="brand-block">
          <p className="brand">СчётМастер</p>
          <p className="brand-sub">Модуль выставления счетов · НДС 22%</p>
        </div>
        <div className="topbar-actions">
          <button type="button" className="btn btn-ghost" onClick={createDraft}>
            Новый счёт
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowPreview((v) => !v)}
          >
            {showPreview ? 'Редактор' : 'Предпросмотр'}
          </button>
          <button type="button" className="btn btn-primary" onClick={() => window.print()}>
            Печать
          </button>
        </div>
      </header>

      <div className="layout">
        <aside className="drafts-rail no-print">
          <h2>Черновики</h2>
          <ul>
            {drafts.map((draft) => (
              <li key={draft.id}>
                <button
                  type="button"
                  className={draft.id === activeId ? 'draft-item active' : 'draft-item'}
                  onClick={() => setActiveId(draft.id)}
                >
                  <span className="draft-number">{draft.number || 'Без номера'}</span>
                  <span className="draft-meta">
                    {draft.buyer.name || 'Покупатель не указан'} · {draft.date}
                  </span>
                </button>
                <button
                  type="button"
                  className="btn-icon draft-delete"
                  aria-label="Удалить черновик"
                  onClick={() => deleteDraft(draft.id)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <main className="workspace">
          {showPreview ? (
            <InvoicePreview invoice={invoice} />
          ) : (
            <>
              <section className="meta-panel no-print">
                <h1>Счёт на оплату</h1>
                <p className="lead">
                  Добавляйте работы в нормочасах и запасные части — НДС 22% считается автоматически.
                </p>
                <div className="meta-grid">
                  <label>
                    <span>Номер счёта</span>
                    <input
                      value={invoice.number}
                      onChange={(e) => updateInvoice({ number: e.target.value })}
                    />
                  </label>
                  <label>
                    <span>Дата</span>
                    <input
                      type="date"
                      value={invoice.date}
                      onChange={(e) => updateInvoice({ date: e.target.value })}
                    />
                  </label>
                </div>
              </section>

              <div className="parties-row no-print">
                <PartyFields
                  title="Поставщик"
                  value={invoice.seller}
                  onChange={(seller) => updateInvoice({ seller })}
                />
                <PartyFields
                  title="Покупатель"
                  value={invoice.buyer}
                  onChange={(buyer) => updateInvoice({ buyer })}
                />
              </div>

              <LaborSection
                lines={invoice.labor}
                onAdd={addLabor}
                onChange={updateLabor}
                onRemove={removeLabor}
              />

              <PartsSection
                lines={invoice.parts}
                onAdd={addPart}
                onChange={updatePart}
                onRemove={removePart}
              />

              <section className="notes-section no-print">
                <label>
                  <span>Примечание к счёту</span>
                  <textarea
                    rows={3}
                    value={invoice.notes}
                    onChange={(e) => updateInvoice({ notes: e.target.value })}
                    placeholder="Срок оплаты, гарантия, условия доставки…"
                  />
                </label>
              </section>

              <div className="print-only">
                <InvoicePreview invoice={invoice} />
              </div>
            </>
          )}
        </main>

        <div className="no-print sticky-totals">
          <TotalsPanel totals={totals} />
        </div>
      </div>
    </div>
  )
}

export default App
