import { Router } from 'express'
import { db } from '../db.js'
import { requireAuth, type AuthRequest } from '../auth.js'

export const invoicesRouter = Router()

invoicesRouter.use(requireAuth)

invoicesRouter.get('/', (req: AuthRequest, res) => {
  const rows = db
    .prepare(
      `SELECT id, payload, updated_at
       FROM invoices
       WHERE user_id = ?
       ORDER BY updated_at DESC`,
    )
    .all(req.user!.id) as Array<{ id: string; payload: string; updated_at: string }>

  const invoices = rows.map((row) => JSON.parse(row.payload))
  res.json({ invoices })
})

invoicesRouter.put('/bulk', (req: AuthRequest, res) => {
  const invoices = Array.isArray(req.body?.invoices) ? req.body.invoices : null
  if (!invoices) {
    res.status(400).json({ error: 'Ожидается массив invoices' })
    return
  }

  const userId = req.user!.id
  const now = new Date().toISOString()
  const ids = new Set<string>()

  const tx = db.transaction(() => {
    for (const invoice of invoices) {
      if (!invoice?.id) continue
      ids.add(invoice.id)
      db.prepare(
        `INSERT INTO invoices (id, user_id, payload, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           payload = excluded.payload,
           updated_at = excluded.updated_at
         WHERE invoices.user_id = excluded.user_id`,
      ).run(invoice.id, userId, JSON.stringify(invoice), now)
    }

    const existing = db
      .prepare(`SELECT id FROM invoices WHERE user_id = ?`)
      .all(userId) as Array<{ id: string }>

    for (const row of existing) {
      if (!ids.has(row.id)) {
        db.prepare(`DELETE FROM invoices WHERE id = ? AND user_id = ?`).run(row.id, userId)
      }
    }
  })

  tx()
  res.json({ ok: true, count: ids.size })
})

invoicesRouter.delete('/:id', (req: AuthRequest, res) => {
  const result = db
    .prepare(`DELETE FROM invoices WHERE id = ? AND user_id = ?`)
    .run(req.params.id, req.user!.id)

  if (!result.changes) {
    res.status(404).json({ error: 'Счёт не найден' })
    return
  }
  res.json({ ok: true })
})
