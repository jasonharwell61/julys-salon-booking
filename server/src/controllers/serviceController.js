import Service from '../models/Service.js'
import ApiError from '../utils/ApiError.js'
import asyncHandler from '../utils/asyncHandler.js'

// The approved category list, read from the model so the two can never drift apart
const CATEGORIES = Service.schema.path('category').enumValues

// ---------- Public ----------

// GET /api/services  (optional: ?category=fill)
export const listServices = asyncHandler(async (req, res) => {
  // The public menu only ever shows active services
  const filter = { isActive: true }

  const { category } = req.query
  if (category !== undefined) {
    // Must be plain text AND on the approved list. An object or array
    // (a possible operator-injection attempt) fails the typeof check.
    if (typeof category !== 'string' || !CATEGORIES.includes(category)) {
      throw new ApiError(400, 'Validation failed', [
        {
          field: 'category',
          message: `Category must be one of: ${CATEGORIES.join(', ')}`,
        },
      ])
    }
    filter.category = category
  }

  const services = await Service.find(filter).sort({ category: 1, name: 1 })
  res.status(200).json(services)
})

// GET /api/services/:id
export const getService = asyncHandler(async (req, res) => {
  // Inactive services look exactly like missing ones to the public
  const service = await Service.findOne({ _id: req.params.id, isActive: true })

  if (!service) {
    throw new ApiError(404, 'Service not found')
  }

  res.status(200).json(service)
})

// ---------- Admin only (the routes add requireAuth + requireRole('admin')) ----------

// GET /api/admin/services  (includes inactive services)
export const listAllServices = asyncHandler(async (req, res) => {
  const services = await Service.find().sort({ category: 1, name: 1 })
  res.status(200).json(services)
})

// POST /api/services
export const createService = asyncHandler(async (req, res) => {
  // req.validated holds ONLY the approved fields
  const service = await Service.create(req.validated)
  res.status(201).json(service)
})

// PATCH /api/services/:id
export const updateService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id)

  if (!service) {
    throw new ApiError(404, 'Service not found')
  }

  service.set(req.validated)
  await service.save() // runs the full schema validation again

  res.status(200).json(service)
})

// DELETE /api/services/:id  (deactivates: bookings still point at this service)
export const deactivateService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id)

  if (!service) {
    throw new ApiError(404, 'Service not found')
  }

  service.isActive = false
  await service.save()

  res.status(200).json(service)
})