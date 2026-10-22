import User from '../models/User.js'
import ApiError from '../utils/ApiError.js'
import asyncHandler from '../utils/asyncHandler.js'
import { verifyToken } from '../utils/token.js'
import { isValidObjectId } from '../utils/validation.js'

// Protects a route. On success, req.user is the logged-in user.
export const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')

  if (scheme !== 'Bearer' || !token) {
    throw new ApiError(401, 'Authentication required')
  }

  let payload
  try {
    payload = verifyToken(token)
  } catch {
    // Malformed, tampered or expired: the client does not need to know which
    throw new ApiError(401, 'Invalid or expired token')
  }

  if (!isValidObjectId(payload.sub)) {
    throw new ApiError(401, 'Invalid or expired token')
  }

  // Reads the user fresh, so deleted users and role changes take effect immediately
  const user = await User.findById(payload.sub)
  if (!user) {
    throw new ApiError(401, 'Invalid or expired token')
  }

  req.user = user
  next()
})