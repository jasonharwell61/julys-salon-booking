import ApiError from './ApiError.js'

// True if the user is an admin, or the booking belongs to them.
// This only decides who may READ a booking. What an admin may CHANGE
// is limited separately in the booking controller (Step 20).
export function canAccessBooking(user, booking) {
  if (user.role === 'admin') return true

  // booking.user may be a plain id or a populated user document
  const ownerId = booking.user?._id ?? booking.user
  return String(ownerId) === String(user._id)
}

// Throws a 403 if the user may not access the booking
export function assertCanAccessBooking(user, booking) {
  if (!canAccessBooking(user, booking)) {
    throw new ApiError(403, 'You do not have permission to access this booking')
  }
}