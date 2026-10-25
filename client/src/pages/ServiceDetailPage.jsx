import { useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getService } from '../api/servicesApi.js'
import BookingPanel from '../components/BookingPanel.jsx'
import StatusMessage from '../components/StatusMessage.jsx'
import { useAsyncData } from '../hooks/useAsyncData.js'
import { CATEGORY_LABELS, formatDuration, formatPrice } from '../utils/format.js'

function ServiceDetailPage() {
  const { id } = useParams()
  const loadService = useCallback((signal) => getService(id, { signal }), [id])
  const { data: service, error, loading, retry } = useAsyncData(loadService)

  let content
  if (loading) {
    content = <StatusMessage kind="loading" title="Loading service..." />
  } else if (error && (error.status === 404 || error.status === 400)) {
    // 400 = the ID in the address isn't a valid ID at all; 404 = no such service
    content = (
      <StatusMessage kind="empty" title="Service not found">
        That service doesn&rsquo;t exist or is no longer offered.{' '}
        <Link to="/services">See all services</Link>
      </StatusMessage>
    )
  } else if (error) {
    content = (
      <StatusMessage kind="error" title="We couldn't load this service" onRetry={retry}>
        {error.message}
      </StatusMessage>
    )
  } else {
    content = (
      <article className="detail">
        <p className="service-category">
          {CATEGORY_LABELS[service.category] || service.category}
        </p>
        <h1>{service.name}</h1>
        <p className="service-description">{service.description}</p>

        <dl className="detail-meta">
          <div>
            <dt>Price</dt>
            <dd>{formatPrice(service.priceCents)}</dd>
          </div>
          <div>
            <dt>Time</dt>
            <dd>{formatDuration(service.durationMinutes)}</dd>
          </div>
        </dl>

        {service.tags && service.tags.length > 0 && (
          <ul className="tags">
            {service.tags.map((tag) => (
              <li key={tag} className="tag">{tag}</li>
            ))}
          </ul>
        )}

        <BookingPanel service={service} />
      </article>
    )
  }

  return (
    <section className="container page-section">
      <Link to="/services" className="back-link">&larr; All services</Link>
      {content}
    </section>
  )
}

export default ServiceDetailPage
