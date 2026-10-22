import jwt from 'jsonwebtoken'
import { env, requireEnv } from '../config/env.js'

// The token holds only the user's id (as "sub"). Role and name are
// always read fresh from the database, so they can never go stale.
export function signToken(userId) {
  return jwt.sign({}, requireEnv('JWT_SECRET'), {
    subject: String(userId),
    expiresIn: env.jwtExpiresIn,
    algorithm: 'HS256',
  })
}

// Throws if the token is malformed, tampered with, or expired
export function verifyToken(token) {
  return jwt.verify(token, requireEnv('JWT_SECRET'), { algorithms: ['HS256'] })
}