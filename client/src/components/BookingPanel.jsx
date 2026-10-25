import { Link, useLocation, useNavigate } from 'react-router-dom'
import { createBooking } from '../api/bookingsApi.js'
import { useAuth } from '../hooks/useAuth.js'
import { formatSalonDateTime } from '../utils/salonTime.js'
import BookingForm from './BookingForm.jsx'

// The "Book this service" section of the service detail page
function BookingPanel({ service }) {
  const { user, restoring } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (restoring) return null

  if (!user) {
    return (
      <section className="booking-panel" aria-labelledby="book-heading">
        <h2 id="book-heading">Book this service</h2>
        <p className="auth-intro">Log in or create an account to choose a time.</p>
        <div className="form-actions">
          <Link to="/login" state={{ from: location }} className="btn-gold">Log in to book</Link>
          <Link to="/register" state={{ from: location }} className="btn-outline-gold">Create account</Link>
        </div>
      </section>
    )
  }

  async function handleBook({ startTime, customerNote }) {
    const booking = await createBooking({ serviceId: service._id, startTime, customerNote })
    navigate('/bookings', {
      state: { notice: `You're booked! ${service.name} on ${formatSalonDateTime(booking.startTime)}.` },
    })
  }

  return (
    <section className="booking-panel" aria-labelledby="book-heading">
      <h2 id="book-heading">Book this service</h2>
      <BookingForm
        durationMinutes={service.durationMinutes}
        submitLabel="Book appointment"
        onSubmit={handleBook}
      />
    </section>
  )
}

export default BookingPanel
