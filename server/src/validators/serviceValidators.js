import Service from '../models/Service.js'
import { cleanString } from '../utils/validation.js'

// The approved category list, read from the model
const CATEGORIES = Service.schema.path('category').enumValues

// Checks the service fields in the body and copies ONLY approved fields into `value`.
// partial = true (editing): every field is optional, but at least one must be present.
function validateServiceFields(body, { partial }) {
  const errors = []
  const value = {}

  const isPresent = (field) => body[field] !== undefined
  const isMissingRequired = (field) => !partial && !isPresent(field)

  // name
  if (isPresent('name')) {
    const name = cleanString(body.name)
    if (!name || name.length < 2 || name.length > 80) {
      errors.push({ field: 'name', message: 'Name must be 2 to 80 characters' })
    } else {
      value.name = name
    }
  } else if (isMissingRequired('name')) {
    errors.push({ field: 'name', message: 'Name is required' })
  }

  // category
  if (isPresent('category')) {
    if (typeof body.category !== 'string' || !CATEGORIES.includes(body.category)) {
      errors.push({
        field: 'category',
        message: `Category must be one of: ${CATEGORIES.join(', ')}`,
      })
    } else {
      value.category = body.category
    }
  } else if (isMissingRequired('category')) {
    errors.push({ field: 'category', message: 'Category is required' })
  }

  // description
  if (isPresent('description')) {
    const description = cleanString(body.description)
    if (!description || description.length > 500) {
      errors.push({ field: 'description', message: 'Description must be 1 to 500 characters' })
    } else {
      value.description = description
    }
  } else if (isMissingRequired('description')) {
    errors.push({ field: 'description', message: 'Description is required' })
  }

  // durationMinutes
  if (isPresent('durationMinutes')) {
    const minutes = body.durationMinutes
    if (!Number.isInteger(minutes) || minutes < 15 || minutes > 240) {
      errors.push({
        field: 'durationMinutes',
        message: 'Duration must be a whole number from 15 to 240',
      })
    } else {
      value.durationMinutes = minutes
    }
  } else if (isMissingRequired('durationMinutes')) {
    errors.push({ field: 'durationMinutes', message: 'Duration is required' })
  }

  // priceCents
  if (isPresent('priceCents')) {
    const price = body.priceCents
    if (!Number.isInteger(price) || price < 0) {
      errors.push({
        field: 'priceCents',
        message: 'Price must be a whole number of cents, 0 or more',
      })
    } else {
      value.priceCents = price
    }
  } else if (isMissingRequired('priceCents')) {
    errors.push({ field: 'priceCents', message: 'Price is required' })
  }

  // tags (optional)
  if (isPresent('tags')) {
    const tags = Array.isArray(body.tags) ? body.tags.map(cleanString) : null
    if (!tags || tags.length > 8 || tags.some((tag) => !tag || tag.length > 30)) {
      errors.push({
        field: 'tags',
        message: 'Tags must be a list of up to 8 words, each 1 to 30 characters',
      })
    } else {
      value.tags = tags.map((tag) => tag.toLowerCase())
    }
  }

  // isActive (optional)
  if (isPresent('isActive')) {
    if (typeof body.isActive !== 'boolean') {
      errors.push({ field: 'isActive', message: 'isActive must be true or false' })
    } else {
      value.isActive = body.isActive
    }
  }

  if (partial && errors.length === 0 && Object.keys(value).length === 0) {
    errors.push({ field: 'body', message: 'Provide at least one field to update' })
  }

  return { errors, value }
}

export const validateCreateService = (body) => validateServiceFields(body, { partial: false })
export const validateUpdateService = (body) => validateServiceFields(body, { partial: true })