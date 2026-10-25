import { api } from './apiClient.js'

// All of these send the saved login token automatically.
// The server decides WHO the booking belongs to from that token, never from us.
export function createBooking({ serviceId, startTime, customerNote }) {
  const body = { serviceId, startTime }
  if (customerNote) body.customerNote = customerNote
  return api.post('/bookings', body)
}

export function listMyBookings({ signal } = {}) {
  return api.get('/bookings/mine', { signal })
}

// changes can hold startTime and/or customerNote (customers), or status (admins)
export function updateBooking(id, changes) {
  return api.patch(`/bookings/${id}`, changes)
}

// "Deleting" a booking cancels it; the record is kept
export function cancelBooking(id) {
  return api.delete(`/bookings/${id}`)
}

// Admin only
export function listAllBookings({ signal } = {}) {
  return api.get('/admin/bookings', { signal })
}
