import { rateLimit } from 'express-rate-limit'
import { env } from '../config/env.js'

// Register and login share this limit: 20 attempts per 15 minutes per address
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again in a few minutes.' },
})

// AI features share one limit per logged-in USER (not per address).
// It must run AFTER requireAuth so req.user exists. Every request counts, including rejected ones.
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.aiRateLimitMax,
  keyGenerator: (req) => String(req.user._id),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'You have used the assistant a lot. Please try again in a few minutes.' },
})
