import { useCallback, useMemo, useState } from 'react'
import { listAllBookings } from '../api/bookingsApi.js'
import AdminBookingItem from '../components/AdminBookingItem.jsx'
import StatusMessage from '../components/StatusMessage.jsx'
import { useAsyncData } from '../hooks/useAsyncData.js'
import { STATUS_LABELS } from '../utils/bookings.js'

const FILTERS = [{ value: '', label: 'All' }, ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))]

function AdminBookingsPage() {
  const [status, setStatus] = useState('')
  const loadBookings = useCallback((signal) => listAllBookings({ signal }), [])
  const { data, error, loading, retry } = useAsyncData(loadBookings)

  const visible = useMemo(
    () => (data || []).filter((booking) => !status || booking.status === status),
    [data, status]
  )

  let content
  if (loading) {
    content = <StatusMessage kind="loading" title="Loading bookings..." />
  } else if (error) {
    content = (
      <StatusMessage kind="error" title="We couldn't load the bookings" onRetry={retry}>
        {error.message}
      </StatusMessage>
    )
  } else if (visible.length === 0) {
    content = <StatusMessage kind="empty" title="No bookings found" />
  } else {
    content = (
      <div className="booking-list">
        {visible.map((booking) => (
          <AdminBookingItem key={booking._id} booking={booking} onChanged={retry} />
        ))}
      </div>
    )
  }

  return (
    <section className="container page-section">
      <div className="page-header">
        <h1>All bookings</h1>
        <p>Every customer appointment, soonest first. Times are Central Time.</p>
      </div>
      <div className="chips admin-filters" role="group" aria-label="Filter by status">
        {FILTERS.map((filter) => (
          <button
            key={filter.value || 'all'}
            type="button"
            className="chip"
            aria-pressed={status === filter.value}
            onClick={() => setStatus(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>
      {content}
    </section>
  )
}

export default AdminBookingsPage
