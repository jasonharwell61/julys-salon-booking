import { Router } from 'express'
import { listServices, getService } from '../controllers/serviceController.js'
import validateObjectId from '../middleware/validateObjectId.js'

const router = Router()

router.get('/', listServices)
router.get('/:id', validateObjectId('id'), getService)

export default router