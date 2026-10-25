import { formatDuration, formatPrice } from '../utils/format.js'
import { STATUS_LABELS } from '../utils/bookings.js'
import { formatSalonDateTime } from '../utils/salonTime.js'

// Shows one booking. `children` is where the action buttons go.
function BookingCard({ booking, showCustomer = false, children }) {
  const { serviceSnapshot: service } = booking
  const customer = booking.user && typeof booking.user === 'object' ? booking.user : null

  return (
    <article className="booking-card">
      <div className="booking-card-head">
        <h3 className="booking-name">{service.name}</h3>
        <span className={`status-badge status-${booking.status}`}>
          {STATUS_LABELS[booking.status] || booking.status}
        </span>
      </div>

      <p className="booking-time">{formatSalonDateTime(booking.startTime)}</p>
      <p className="booking-meta">
        {formatDuration(service.durationMinutes)} &middot; {formatPrice(service.priceCents)}
      </p>

      {showCustomer && customer && (
        <p className="booking-meta">
          Customer: {customer.name} ({customer.email})
        </p>
      )}
      {booking.customerNote && <p className="booking-note">&ldquo;{booking.customerNote}&rdquo;</p>}

      {children}
    </article>
  )
}

export default BookingCard
