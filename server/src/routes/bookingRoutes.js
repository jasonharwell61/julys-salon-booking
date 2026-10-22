import { Router } from 'express'
import {
  createBooking,
  listMyBookings,
  getBooking,
  updateBooking,
  cancelBooking,
} from '../controllers/bookingController.js'
import { requireAuth } from '../middleware/auth.js'
import validateBody from '../middleware/validateBody.js'
import validateObjectId from '../middleware/validateObjectId.js'
import { validateCreateBooking, validateUpdateBooking } from '../validators/bookingValidators.js'

const router = Router()

// Every booking route needs a logged-in user
router.use(requireAuth)

router.post('/', validateBody(validateCreateBooking), createBooking)

// "/mine" MUST come before "/:id", or "mine" would be treated as an ID
router.get('/mine', listMyBookings)

router.get('/:id', validateObjectId('id'), getBooking)
router.patch('/:id', validateObjectId('id'), validateBody(validateUpdateBooking), updateBooking)
router.delete('/:id', validateObjectId('id'), cancelBooking)

export default router