import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { findUserById, publicUser, type DbUser } from './db.js'

const COOKIE_NAME = 'schetmaster_token'

export type AuthRequest = Request & {
  user?: ReturnType<typeof publicUser>
  dbUser?: DbUser
}

function jwtSecret(): string {
  return process.env.JWT_SECRET || 'dev-schetmaster-secret-change-me'
}

export function signToken(user: DbUser): string {
  return jwt.sign(
    { sub: user.id, role: user.role, login: user.login },
    jwtSecret(),
    { expiresIn: '7d' },
  )
}

export function setAuthCookie(res: Response, token: string) {
  const secure = process.env.COOKIE_SECURE === 'true'
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  })
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, { path: '/' })
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME] as string | undefined
  if (!token) {
    res.status(401).json({ error: 'Требуется вход' })
    return
  }

  try {
    const payload = jwt.verify(token, jwtSecret()) as { sub: string }
    const user = findUserById(payload.sub)
    if (!user) {
      clearAuthCookie(res)
      res.status(401).json({ error: 'Сессия недействительна' })
      return
    }
    req.dbUser = user
    req.user = publicUser(user)
    next()
  } catch {
    clearAuthCookie(res)
    res.status(401).json({ error: 'Сессия истекла' })
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Доступ только для администратора' })
      return
    }
    next()
  })
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME] as string | undefined
  if (!token) {
    next()
    return
  }
  try {
    const payload = jwt.verify(token, jwtSecret()) as { sub: string }
    const user = findUserById(payload.sub)
    if (user) {
      req.dbUser = user
      req.user = publicUser(user)
    }
  } catch {
    // ignore invalid token for optional auth
  }
  next()
}
