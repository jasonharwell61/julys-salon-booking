import { Router } from 'express'
import { recommendService } from '../controllers/aiController.js'
import { requireAuth } from '../middleware/auth.js'
import { aiLimiter } from '../middleware/rateLimiters.js'
import validateBody from '../middleware/validateBody.js'
import { validateRecommendRequest } from '../validators/aiValidators.js'

const router = Router()

// Order matters: who are you? -> have you used too much? -> is the input valid? -> do the work
router.use(requireAuth)
router.use(aiLimiter)

router.post('/recommend-service', validateBody(validateRecommendRequest), recommendService)

export default router
