import asyncHandler from '../utils/asyncHandler.js'
import * as bookingService from '../services/bookingService.js'

// POST /api/bookings
export const createBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.createBooking({
    userId: req.user._id, // from the verified token, never from the body
    ...req.validated, // only serviceId, startTime, customerNote
  })
  res.status(201).json(booking)
})

// GET /api/bookings/mine
export const listMyBookings = asyncHandler(async (req, res) => {
  const bookings = await bookingService.listMyBookings(req.user._id)
  res.status(200).json(bookings)
})

// GET /api/bookings/:id
export const getBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.getBooking(req.user, req.params.id)
  res.status(200).json(booking)
})

// PATCH /api/bookings/:id
export const updateBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.updateBooking(req.user, req.params.id, req.validated)
  res.status(200).json(booking)
})

// DELETE /api/bookings/:id  (cancels)
export const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.cancelBooking(req.user, req.params.id)
  res.status(200).json(booking)
})

// GET /api/admin/bookings  (the admin router adds the admin-only guard)
export const listAllBookings = asyncHandler(async (req, res) => {
  const bookings = await bookingService.listAllBookings()
  res.status(200).json(bookings)
})