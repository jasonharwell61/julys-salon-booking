import { useCallback, useMemo, useState } from 'react'
import { listServices } from '../api/servicesApi.js'
import ServiceAdvisor from '../components/ServiceAdvisor.jsx'
import ServiceCard from '../components/ServiceCard.jsx'
import StatusMessage from '../components/StatusMessage.jsx'
import { useAsyncData } from '../hooks/useAsyncData.js'
import { CATEGORY_LABELS } from '../utils/format.js'

const FILTERS = [
  { value: '', label: 'All' },
  ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
]

function ServicesPage() {
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')

  // The category filter is applied by the server; the search box filters in the browser
  const loadServices = useCallback(
    (signal) => listServices({ category, signal }),
    [category]
  )
  const { data, error, loading, retry } = useAsyncData(loadServices)

  const visible = useMemo(() => {
    if (!data) return []
    const term = search.trim().toLowerCase()
    if (!term) return data
    return data.filter((service) =>
      `${service.name} ${service.description} ${(service.tags || []).join(' ')}`
        .toLowerCase()
        .includes(term)
    )
  }, [data, search])

  function clearFilters() {
    setCategory('')
    setSearch('')
  }

  let content
  if (loading) {
    content = <StatusMessage kind="loading" title="Loading services..." />
  } else if (error) {
    content = (
      <StatusMessage kind="error" title="We couldn't load the services" onRetry={retry}>
        {error.message}
      </StatusMessage>
    )
  } else if (visible.length === 0) {
    content = (
      <StatusMessage kind="empty" title="No services found">
        Try a different category or search word.{' '}
        <button type="button" className="btn-outline-gold ms-2" onClick={clearFilters}>
          Clear filters
        </button>
      </StatusMessage>
    )
  } else {
    content = (
      <div className="service-grid">
        {visible.map((service) => (
          <ServiceCard key={service._id} service={service} />
        ))}
      </div>
    )
  }

  return (
    <section className="container page-section">
      <div className="page-header">
        <h1>Our services</h1>
        <p>Choose a service to see the details and book your appointment.</p>
      </div>

      <ServiceAdvisor />

      <div className="toolbar">
        <div className="chips" role="group" aria-label="Filter by category">
          {FILTERS.map((filter) => (
            <button
              key={filter.value || 'all'}
              type="button"
              className="chip"
              aria-pressed={category === filter.value}
              onClick={() => setCategory(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div>
          <label htmlFor="service-search" className="visually-hidden">
            Search services
          </label>
          <input
            id="service-search"
            type="search"
            className="search"
            placeholder="Search services"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      {content}
    </section>
  )
}

export default ServicesPage
