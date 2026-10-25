import { useState } from 'react'
import { cancelBooking, updateBooking } from '../api/bookingsApi.js'
import BookingCard from './BookingCard.jsx'

// One booking in the admin list. Admins can mark confirmed bookings completed or cancel them.
function AdminBookingItem({ booking, onChanged }) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function run(action) {
    setBusy(true)
    setError('')
    try {
      await action()
      setConfirming(false)
      onChanged()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <BookingCard booking={booking} showCustomer>
      {error && (
        <div className="form-banner" role="alert">
          {error}
        </div>
      )}

      {booking.status === 'confirmed' && !confirming && (
        <div className="form-actions">
          <button
            type="button"
            className="btn-gold"
            disabled={busy}
            onClick={() => run(() => updateBooking(booking._id, { status: 'completed' }))}
          >
            Mark completed
          </button>
          <button type="button" className="btn-link-danger" onClick={() => setConfirming(true)}>
            Cancel booking
          </button>
        </div>
      )}

      {confirming && (
        <div className="confirm-box" role="group" aria-label="Confirm cancellation">
          <p>Cancel this customer&rsquo;s booking?</p>
          <div className="form-actions">
            <button
              type="button"
              className="btn-danger"
              disabled={busy}
              onClick={() => run(() => cancelBooking(booking._id))}
            >
              {busy ? 'Cancelling...' : 'Yes, cancel it'}
            </button>
            <button type="button" className="btn-outline-gold" onClick={() => setConfirming(false)} disabled={busy}>
              Keep it
            </button>
          </div>
        </div>
      )}
    </BookingCard>
  )
}

export default AdminBookingItem
