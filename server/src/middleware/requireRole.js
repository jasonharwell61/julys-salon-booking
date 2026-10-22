import ApiError from '../utils/ApiError.js'

// Usage: router.post('/', requireAuth, requireRole('admin'), controller)
// Must come AFTER requireAuth, which is what sets req.user.
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    // If this runs without a logged-in user, fail closed
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'))
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to do that'))
    }

    next()
  }
}