import { useState } from 'react'
import { cancelBooking, updateBooking } from '../api/bookingsApi.js'
import { isUpcoming } from '../utils/bookings.js'
import BookingCard from './BookingCard.jsx'
import BookingForm from './BookingForm.jsx'

// One of the customer's bookings, with Change and Cancel when those are still allowed
function MyBookingItem({ booking, onChanged }) {
  const [mode, setMode] = useState('view') // 'view' | 'edit' | 'cancel'
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const canChange = isUpcoming(booking)

  async function handleSave({ startTime, customerNote }) {
    // Send only what actually changed. A note-only edit must not re-run the time rules.
    const changes = {}
    if (new Date(startTime).getTime() !== new Date(booking.startTime).getTime()) {
      changes.startTime = startTime
    }
    if (customerNote !== (booking.customerNote || '')) {
      changes.customerNote = customerNote
    }
    if (Object.keys(changes).length === 0) {
      throw new Error('Nothing was changed.')
    }
    await updateBooking(booking._id, changes)
    setMode('view')
    onChanged()
  }

  async function handleCancel() {
    setBusy(true)
    setError('')
    try {
      await cancelBooking(booking._id)
      setMode('view')
      onChanged()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <BookingCard booking={booking}>
      {error && (
        <div className="form-banner" role="alert">
          {error}
        </div>
      )}

      {mode === 'view' && canChange && (
        <div className="form-actions">
          <button type="button" className="btn-outline-gold" onClick={() => setMode('edit')}>
            Change
          </button>
          <button type="button" className="btn-link-danger" onClick={() => setMode('cancel')}>
            Cancel appointment
          </button>
        </div>
      )}

      {mode === 'edit' && (
        <BookingForm
          durationMinutes={booking.serviceSnapshot.durationMinutes}
          initialStartTime={booking.startTime}
          initialNote={booking.customerNote || ''}
          submitLabel="Save changes"
          onSubmit={handleSave}
          onCancel={() => setMode('view')}
        />
      )}

      {mode === 'cancel' && (
        <div className="confirm-box" role="group" aria-label="Confirm cancellation">
          <p>Cancel this appointment? This can&rsquo;t be undone.</p>
          <div className="form-actions">
            <button type="button" className="btn-danger" onClick={handleCancel} disabled={busy}>
              {busy ? 'Cancelling...' : 'Yes, cancel it'}
            </button>
            <button type="button" className="btn-outline-gold" onClick={() => setMode('view')} disabled={busy}>
              Keep it
            </button>
          </div>
        </div>
      )}
    </BookingCard>
  )
}

export default MyBookingItem
