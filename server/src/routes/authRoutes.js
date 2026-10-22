import { Router } from 'express'
import { register, login, me } from '../controllers/authController.js'
import { requireAuth } from '../middleware/auth.js'
import { authLimiter } from '../middleware/rateLimiters.js'
import validateBody from '../middleware/validateBody.js'
import { validateRegister, validateLogin } from '../validators/authValidators.js'

const router = Router()

router.post('/register', authLimiter, validateBody(validateRegister), register)
router.post('/login', authLimiter, validateBody(validateLogin), login)
router.get('/me', requireAuth, me)

export default router