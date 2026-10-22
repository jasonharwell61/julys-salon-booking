import asyncHandler from '../utils/asyncHandler.js'
import { createBooking as createBookingRecord } from '../services/bookingService.js'

// POST /api/bookings
export const createBooking = asyncHandler(async (req, res) => {
  const booking = await createBookingRecord({
    userId: req.user._id, // from the verified token, never from the body
    ...req.validated, // only serviceId, startTime, customerNote
  })

  res.status(201).json(booking)
})