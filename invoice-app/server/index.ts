import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import { ensureAdminAccount } from './db.js'
import { authRouter } from './routes/auth.js'
import { invoicesRouter } from './routes/invoices.js'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT || 3000)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AdminRaznaia2026'

ensureAdminAccount(ADMIN_PASSWORD)

const app = express()
app.set('trust proxy', 1)
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
)
app.use(express.json({ limit: '2mb' }))
app.use(cookieParser())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'schetmaster' })
})

app.use('/api/auth', authRouter)
app.use('/api/invoices', invoicesRouter)

const distDir = path.resolve(__dirname, '../dist')
app.use(express.static(distDir))
app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'))
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`СчётМастер слушает http://0.0.0.0:${PORT}`)
  console.log(`Админ: логин admin / пароль из ADMIN_PASSWORD`)
})
