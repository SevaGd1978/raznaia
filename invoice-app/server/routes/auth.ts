import { Router } from 'express'
import {
  createUser,
  deleteUser,
  findUserByLogin,
  listUsers,
  publicUser,
  verifyPassword,
} from '../db.js'
import {
  clearAuthCookie,
  requireAdmin,
  requireAuth,
  setAuthCookie,
  signToken,
  type AuthRequest,
} from '../auth.js'

const loginPattern = /^[a-zA-Z0-9._-]{3,32}$/

export const authRouter = Router()

authRouter.post('/register', (req, res) => {
  const login = String(req.body?.login ?? '').trim()
  const password = String(req.body?.password ?? '')
  const displayName = String(req.body?.displayName ?? login).trim() || login

  if (!loginPattern.test(login)) {
    res.status(400).json({
      error: 'Логин: 3–32 символа, латиница, цифры, точка, _ или -',
    })
    return
  }
  if (login.toLowerCase() === 'admin') {
    res.status(400).json({ error: 'Логин admin зарезервирован' })
    return
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Пароль не короче 6 символов' })
    return
  }
  if (findUserByLogin(login)) {
    res.status(409).json({ error: 'Такой логин уже занят' })
    return
  }

  const user = createUser({
    id: crypto.randomUUID(),
    login,
    password,
    displayName,
    role: 'user',
  })

  const token = signToken(user)
  setAuthCookie(res, token)
  res.status(201).json({ user: publicUser(user) })
})

authRouter.post('/login', (req, res) => {
  const login = String(req.body?.login ?? '').trim()
  const password = String(req.body?.password ?? '')

  const user = findUserByLogin(login)
  if (!user || !verifyPassword(user, password)) {
    res.status(401).json({ error: 'Неверный логин или пароль' })
    return
  }

  const token = signToken(user)
  setAuthCookie(res, token)
  res.json({ user: publicUser(user) })
})

authRouter.post('/logout', (_req, res) => {
  clearAuthCookie(res)
  res.json({ ok: true })
})

authRouter.get('/me', requireAuth, (req: AuthRequest, res) => {
  res.json({ user: req.user })
})

authRouter.get('/admin/users', requireAdmin, (_req, res) => {
  res.json({ users: listUsers() })
})

authRouter.delete('/admin/users/:id', requireAdmin, (req: AuthRequest, res) => {
  const id = req.params.id
  if (id === req.user?.id) {
    res.status(400).json({ error: 'Нельзя удалить собственный аккаунт администратора' })
    return
  }
  const ok = deleteUser(id)
  if (!ok) {
    res.status(404).json({ error: 'Пользователь не найден' })
    return
  }
  res.json({ ok: true })
})
