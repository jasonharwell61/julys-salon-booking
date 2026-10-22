import ApiError from '../utils/ApiError.js'
import { isValidObjectId } from '../utils/validation.js'

// Usage: router.get('/:id', validateObjectId('id'), controller)
export default function validateObjectId(paramName = 'id') {
  return (req, res, next) => {
    if (!isValidObjectId(req.params[paramName])) {
      return next(new ApiError(400, `Invalid ${paramName}`))
    }
    next()
  }
}