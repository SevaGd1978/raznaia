import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let _db: Database.Database | null = null

function resolveDbPath(): string {
  if (process.env.DB_PATH) return process.env.DB_PATH
  if (process.env.DATA_DIR) return path.join(process.env.DATA_DIR, 'schetmaster.db')
  if (process.platform === 'win32') {
    const base = process.env.APPDATA || path.join(process.env.USERPROFILE || '.', 'AppData', 'Roaming')
    return path.join(base, 'SchetMaster', 'schetmaster.db')
  }
  return path.join(path.resolve(__dirname, '../data'), 'schetmaster.db')
}

export function getDb(): Database.Database {
  if (_db) return _db

  const dbPath = resolveDbPath()
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  process.env.DB_PATH = dbPath

  _db = new Database(dbPath)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')
  _db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      login TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'admin')),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_invoices_user ON invoices(user_id);
  `)

  return _db
}

export type DbUser = {
  id: string
  login: string
  password_hash: string
  display_name: string
  role: 'user' | 'admin'
  created_at: string
}

export function findUserByLogin(login: string): DbUser | undefined {
  return getDb()
    .prepare('SELECT * FROM users WHERE login = ? COLLATE NOCASE')
    .get(login.trim()) as DbUser | undefined
}

export function findUserById(id: string): DbUser | undefined {
  return getDb().prepare('SELECT * FROM users WHERE id = ?').get(id) as DbUser | undefined
}

export function createUser(input: {
  id: string
  login: string
  password: string
  displayName: string
  role: 'user' | 'admin'
}): DbUser {
  const password_hash = bcrypt.hashSync(input.password, 10)
  const created_at = new Date().toISOString()
  getDb()
    .prepare(
      `INSERT INTO users (id, login, password_hash, display_name, role, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(input.id, input.login.trim(), password_hash, input.displayName.trim(), input.role, created_at)

  return findUserById(input.id)!
}

export function verifyPassword(user: DbUser, password: string): boolean {
  return bcrypt.compareSync(password, user.password_hash)
}

export function listUsers(): Omit<DbUser, 'password_hash'>[] {
  return getDb()
    .prepare(
      `SELECT id, login, display_name, role, created_at
       FROM users
       ORDER BY created_at DESC`,
    )
    .all() as Omit<DbUser, 'password_hash'>[]
}

export function deleteUser(id: string): boolean {
  const result = getDb().prepare('DELETE FROM users WHERE id = ?').run(id)
  return result.changes > 0
}

export function ensureAdminAccount(adminPassword: string) {
  const db = getDb()
  const existing = findUserByLogin('admin')
  if (existing) {
    if (existing.role !== 'admin') {
      db.prepare(`UPDATE users SET role = 'admin' WHERE id = ?`).run(existing.id)
    }
    const password_hash = bcrypt.hashSync(adminPassword, 10)
    db.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).run(password_hash, existing.id)
    return
  }

  createUser({
    id: crypto.randomUUID(),
    login: 'admin',
    password: adminPassword,
    displayName: 'Администратор',
    role: 'admin',
  })
}

export function publicUser(user: DbUser) {
  return {
    id: user.id,
    login: user.login,
    displayName: user.display_name,
    role: user.role,
    createdAt: user.created_at,
  }
}

/** @deprecated use getDb() */
export const db = new Proxy({} as Database.Database, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver)
  },
})
