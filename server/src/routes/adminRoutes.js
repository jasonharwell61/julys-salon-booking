import { Router } from 'express'
import { listAllServices } from '../controllers/serviceController.js'
import { requireAuth } from '../middleware/auth.js'
import { requireRole } from '../middleware/requireRole.js'

const router = Router()

// Deny by default: EVERY route added to this router later is admin-only
router.use(requireAuth, requireRole('admin'))

router.get('/services', listAllServices)

export default router