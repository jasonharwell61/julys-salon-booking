import { rateLimit } from 'express-rate-limit'

// Register and login share this limit: 20 attempts per 15 minutes per address
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again in a few minutes.' },
})