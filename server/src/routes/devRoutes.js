import { Router } from 'express'
import Service from '../models/Service.js'
import asyncHandler from '../utils/asyncHandler.js'
import validateObjectId from '../middleware/validateObjectId.js'
import validateBody from '../middleware/validateBody.js'
import { cleanString } from '../utils/validation.js'

const router = Router()

// Seeded data check (moved here from app.js)
router.get(
  '/services',
  asyncHandler(async (req, res) => {
    const services = await Service.find().sort({ category: 1, name: 1 })
    res.status(200).json(services)
  })
)

// Tests the ObjectId check
router.get('/ids/:id', validateObjectId('id'), (req, res) => {
  res.status(200).json({ id: req.params.id })
})

// A tiny example validator: only "name" is read, everything else is ignored
function validateDemoBody(body) {
  const errors = []
  const name = cleanString(body.name)

  if (!name) {
    errors.push({ field: 'name', message: 'Name is required' })
  } else if (name.length < 2 || name.length > 60) {
    errors.push({ field: 'name', message: 'Name must be 2 to 60 characters' })
  }

  return { errors, value: { name } }
}

// Tests body validation and allow-listing
router.post('/echo', validateBody(validateDemoBody), (req, res) => {
  res.status(200).json(req.validated)
})

// Tests that an unexpected failure returns a generic 500 and leaks nothing
router.get(
  '/boom',
  asyncHandler(async () => {
    throw new Error('Test failure containing a secret-looking value: abc123')
  })
)

// Tests that Mongoose validation errors become a clean 400 (nothing is saved)
router.post(
  '/bad-service',
  asyncHandler(async (req, res) => {
    await Service.create({ name: 'x' })
    res.status(201).json({ saved: true })
  })
)

export default router