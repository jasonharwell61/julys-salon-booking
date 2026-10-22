import { Router } from 'express'
import {
  listServices,
  getService,
  createService,
  updateService,
  deactivateService,
} from '../controllers/serviceController.js'
import { requireAuth } from '../middleware/auth.js'
import { requireRole } from '../middleware/requireRole.js'
import validateObjectId from '../middleware/validateObjectId.js'
import validateBody from '../middleware/validateBody.js'
import { validateCreateService, validateUpdateService } from '../validators/serviceValidators.js'

const router = Router()

// Public
router.get('/', listServices)
router.get('/:id', validateObjectId('id'), getService)

// Admin only: who you are first (requireAuth), then what you may do (requireRole)
router.post(
  '/',
  requireAuth,
  requireRole('admin'),
  validateBody(validateCreateService),
  createService
)
router.patch(
  '/:id',
  requireAuth,
  requireRole('admin'),
  validateObjectId('id'),
  validateBody(validateUpdateService),
  updateService
)
router.delete(
  '/:id',
  requireAuth,
  requireRole('admin'),
  validateObjectId('id'),
  deactivateService
)

export default router