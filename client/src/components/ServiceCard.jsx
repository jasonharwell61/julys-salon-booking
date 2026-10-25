import { Link } from 'react-router-dom'
import { CATEGORY_LABELS, formatDuration, formatPrice } from '../utils/format.js'

function ServiceCard({ service }) {
  return (
    <article className="service-card">
      <p className="service-category">
        {CATEGORY_LABELS[service.category] || service.category}
      </p>
      <h3 className="service-name">{service.name}</h3>
      <p className="service-description">{service.description}</p>
      <div className="service-meta">
        <span className="price">{formatPrice(service.priceCents)}</span>
        <span className="duration">{formatDuration(service.durationMinutes)}</span>
      </div>
      <Link to={`/services/${service._id}`} className="btn-outline-gold">
        View details
        <span className="visually-hidden"> for {service.name}</span>
      </Link>
    </article>
  )
}

export default ServiceCard
