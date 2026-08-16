import { useEffect, useState } from 'react'
import { calcInvoice, vatLabel } from './lib/calc'
import { exportInvoiceToExcel } from './lib/excel'
import { useInvoices } from './hooks/useInvoices'
import { useAuth } from './auth/AuthContext'
import { AuthScreen } from './auth/AuthScreen'
import { PartyFields } from './components/PartyFields'
import { LaborSection } from './components/LaborSection'
import { PartsSection } from './components/PartsSection'
import { TotalsPanel } from './components/TotalsPanel'
import { InvoicePreview } from './components/InvoicePreview'
import { AdminPanel } from './components/AdminPanel'
import { VatSettings } from './components/VatSettings'
import './App.css'

function InvoiceWorkspace() {
  const { user, logout } = useAuth()
  const {
    drafts,
    invoice,
    activeId,
    ready,
    syncError,
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
  } = useInvoices(Boolean(user))

  const [showPreview, setShowPreview] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const totals = calcInvoice(invoice)

  useEffect(() => {
    document.title = `Счёт ${invoice.number || ''} · СчётМастер`
  }, [invoice.number])

  if (!ready) {
    return (
      <div className="app-shell">
        <div className="atmosphere" aria-hidden="true" />
        <p className="loading-note">Загрузка счетов…</p>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <div className="atmosphere" aria-hidden="true" />

      <header className="topbar">
        <div className="brand-block">
          <p className="brand">СчётМастер</p>
          <p className="brand-sub">
            {user?.displayName} · {user?.role === 'admin' ? 'администратор' : 'пользователь'} ·{' '}
            {vatLabel(invoice)}
          </p>
        </div>
        <div className="topbar-actions">
          {user?.role === 'admin' && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setShowAdmin((v) => !v)}
            >
              {showAdmin ? 'Счета' : 'Админ'}
            </button>
          )}
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
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => void exportInvoiceToExcel(invoice)}
          >
            Excel
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => void logout()}>
            Выйти
          </button>
        </div>
      </header>

      {syncError && <p className="sync-banner no-print">{syncError}</p>}

      {showAdmin && user?.role === 'admin' ? (
        <AdminPanel onClose={() => setShowAdmin(false)} />
      ) : (
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
                      {draft.vehicleNumber
                        ? `${draft.vehicleNumber} · `
                        : ''}
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
                    Добавляйте работы в нормочасах и запасные части. НДС включается по выбору.
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
                    <label className="meta-vehicle">
                      <span>Номер авто</span>
                      <input
                        value={invoice.vehicleNumber}
                        onChange={(e) =>
                          updateInvoice({ vehicleNumber: e.target.value.toUpperCase() })
                        }
                        placeholder="А123ВС 77"
                        autoComplete="off"
                      />
                    </label>
                  </div>
                </section>

                <VatSettings
                  invoice={invoice}
                  onChange={(patch) => updateInvoice(patch)}
                />

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
      )}
    </div>
  )
}

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="app-shell">
        <div className="atmosphere" aria-hidden="true" />
        <p className="loading-note">Проверка сессии…</p>
      </div>
    )
  }

  if (!user) return <AuthScreen />
  return <InvoiceWorkspace />
}

export default App
