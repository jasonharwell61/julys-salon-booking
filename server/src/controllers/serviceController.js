import Service from '../models/Service.js'
import ApiError from '../utils/ApiError.js'
import asyncHandler from '../utils/asyncHandler.js'

// The approved category list, read from the model so the two can never drift apart
const CATEGORIES = Service.schema.path('category').enumValues

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