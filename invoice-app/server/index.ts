import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import { ensureAdminAccount } from './db.js'
import { authRouter } from './routes/auth.js'
import { invoicesRouter } from './routes/invoices.js'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isPackaged = Boolean(process.env.SCHETMASTER_PACKAGED)
const defaultPort = Number(process.env.PORT || 3000)

export function createApp() {
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

  return app
}

export function startServer(port = defaultPort) {
  const app = createApp()
  const host = process.env.HOST || (isPackaged ? '127.0.0.1' : '0.0.0.0')

  return new Promise((resolve) => {
    const server = app.listen(port, host, () => {
      console.log(`СчётМастер слушает http://${host}:${port}`)
      console.log(`Админ: логин admin / пароль из ADMIN_PASSWORD`)
      console.log(`База: ${process.env.DB_PATH || '(по умолчанию)'}`)
      resolve(server)
    })
  })
}

function isMainModule() {
  const entry = process.argv[1]
  if (!entry) return false
  try {
    return import.meta.url === pathToFileURL(path.resolve(entry)).href
  } catch {
    return false
  }
}

if (isMainModule()) {
  void startServer()
}
