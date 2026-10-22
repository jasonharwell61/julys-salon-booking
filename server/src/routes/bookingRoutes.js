import { Router } from 'express'
import { createBooking } from '../controllers/bookingController.js'
import { requireAuth } from '../middleware/auth.js'
import validateBody from '../middleware/validateBody.js'
import { validateCreateBooking } from '../validators/bookingValidators.js'

const router = Router()

router.post('/', requireAuth, validateBody(validateCreateBooking), createBooking)

export default router