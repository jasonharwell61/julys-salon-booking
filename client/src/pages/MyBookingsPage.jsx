import { useCallback, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { listMyBookings } from '../api/bookingsApi.js'
import MyBookingItem from '../components/MyBookingItem.jsx'
import StatusMessage from '../components/StatusMessage.jsx'
import { useAsyncData } from '../hooks/useAsyncData.js'
import { isUpcoming } from '../utils/bookings.js'

function MyBookingsPage() {
  const location = useLocation()
  const notice = location.state?.notice

  const loadBookings = useCallback((signal) => listMyBookings({ signal }), [])
  const { data, error, loading, retry } = useAsyncData(loadBookings)

  // Upcoming: soonest first. Everything else (past, completed, cancelled): newest first.
  const { upcoming, history } = useMemo(() => {
    const list = data || []
    return {
      upcoming: list.filter(isUpcoming),
      history: list.filter((booking) => !isUpcoming(booking)).reverse(),
    }
  }, [data])

  let content
  if (loading) {
    content = <StatusMessage kind="loading" title="Loading your bookings..." />
  } else if (error) {
    content = (
      <StatusMessage kind="error" title="We couldn't load your bookings" onRetry={retry}>
        {error.message}
      </StatusMessage>
    )
  } else if (data.length === 0) {
    content = (
      <StatusMessage kind="empty" title="No bookings yet">
        Pick a service and choose a time to get started.{' '}
        <Link to="/services" className="btn-gold ms-2">Browse services</Link>
      </StatusMessage>
    )
  } else {
    content = (
      <>
        <h2 className="list-heading">Upcoming</h2>
        {upcoming.length === 0 ? (
          <p className="muted">You have no upcoming appointments.</p>
        ) : (
          <div className="booking-list">
            {upcoming.map((booking) => (
              <MyBookingItem key={booking._id} booking={booking} onChanged={retry} />
            ))}
          </div>
        )}

        {history.length > 0 && (
          <>
            <h2 className="list-heading">Past and cancelled</h2>
            <div className="booking-list">
              {history.map((booking) => (
                <MyBookingItem key={booking._id} booking={booking} onChanged={retry} />
              ))}
            </div>
          </>
        )}
      </>
    )
  }

  return (
    <section className="container page-section">
      <div className="page-header">
        <h1>My bookings</h1>
        <p>All times are Central Time.</p>
      </div>
      {notice && (
        <div className="notice-banner" role="status">
          {notice}
        </div>
      )}
      {content}
    </section>
  )
}

export default MyBookingsPage
