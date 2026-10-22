import ApiError from '../utils/ApiError.js'
import { isPlainObject } from '../utils/validation.js'

// A validator is a function: (body) => ({ errors: [...], value: { ...cleanFields } })
// On success, the controller reads req.validated, NOT req.body.
// Only fields the validator copies into `value` can ever reach the database.
export default function validateBody(validator) {
  return (req, res, next) => {
    // Some Express versions leave req.body undefined when nothing was sent
    const body = req.body ?? {}

    if (!isPlainObject(body)) {
      return next(new ApiError(400, 'Request body must be a JSON object'))
    }

    const { errors, value } = validator(body)

    if (errors.length > 0) {
      return next(new ApiError(400, 'Validation failed', errors))
    }

    req.validated = value
    next()
  }
}