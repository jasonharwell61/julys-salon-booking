import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { recommendService } from '../api/aiApi.js'
import { useAuth } from '../hooks/useAuth.js'
import { CATEGORY_LABELS, formatDuration, formatPrice } from '../utils/format.js'

const MIN_LENGTH = 3
const MAX_LENGTH = 300
// A little longer than the server's own 15 second limit, so the server answers (or falls back) first
const CLIENT_TIMEOUT_MS = 25000

// Turns a failed request into a short, friendly sentence. Never shows raw technical text.
function describeError(error, timedOut) {
  if (timedOut) return 'That took too long. Please try again.'
  if (error.isNetworkError) return error.message
  if (error.status === 429) return error.message // the server's message is already friendly
  return 'The assistant is unavailable right now. You can still browse all of our services below.'
}

function Recommendation({ item }) {
  const { service, reason } = item
  return (
    <li className="advisor-result">
      <p className="service-category">{CATEGORY_LABELS[service.category] || service.category}</p>
      <h3 className="advisor-result-name">{service.name}</h3>
      <p className="advisor-reason">{reason}</p>
      <div className="service-meta">
        <span className="price">{formatPrice(service.priceCents)}</span>
        <span className="duration">{formatDuration(service.durationMinutes)}</span>
      </div>
      <Link to={`/services/${service._id}`} className="btn-outline-gold">
        View and book
        <span className="visually-hidden"> {service.name}</span>
      </Link>
    </li>
  )
}

function ServiceAdvisor() {
  const { user, restoring } = useAuth()
  const textareaId = useId()
  const errorId = `${textareaId}-error`
  const hintId = `${textareaId}-hint`

  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [fieldError, setFieldError] = useState('')
  const [requestError, setRequestError] = useState('')
  const controllerRef = useRef(null)

  // Cancel any request still running if the page is left
  useEffect(() => () => controllerRef.current?.abort(), [])

  if (restoring) return null // still checking a saved login; avoids a flash of the wrong card

  if (!user) {
    return (
      <section className="advisor" aria-labelledby={`${textareaId}-title`}>
        <h2 id={`${textareaId}-title`} className="advisor-title">Not sure what to book?</h2>
        <p className="advisor-intro">
          <Link to="/login">Log in</Link> to use the assistant, or{' '}
          <Link to="/register">create a free account</Link>.
        </p>
      </section>
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (loading) return

    const trimmed = message.trim()
    if (trimmed.length < MIN_LENGTH) {
      setFieldError(`Please write at least ${MIN_LENGTH} characters.`)
      return
    }

    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    let timedOut = false
    const timer = setTimeout(() => {
      timedOut = true
      controller.abort()
    }, CLIENT_TIMEOUT_MS)

    setFieldError('')
    setRequestError('')
    setResult(null)
    setLoading(true)

    try {
      const data = await recommendService(trimmed, { signal: controller.signal })
      setResult(data)
    } catch (err) {
      if (err.name === 'AbortError' && !timedOut) return // left the page or started over
      if (err.status === 400 && err.fieldErrors?.message) {
        setFieldError(err.fieldErrors.message)
      } else {
        setRequestError(describeError(err, timedOut))
      }
    } finally {
      clearTimeout(timer)
      if (controllerRef.current === controller) setLoading(false)
    }
  }

  function handleClear() {
    controllerRef.current?.abort()
    setMessage('')
    setResult(null)
    setFieldError('')
    setRequestError('')
    setLoading(false)
  }

  const remaining = MAX_LENGTH - message.length
  const describedBy = [hintId, fieldError ? errorId : null].filter(Boolean).join(' ')

  return (
    <section className="advisor" aria-labelledby={`${textareaId}-title`}>
      <h2 id={`${textareaId}-title`} className="advisor-title">Not sure what to book?</h2>
      <p className="advisor-intro">
        Tell us what you have in mind and we will suggest services from our menu.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor={textareaId} className="field-label">What are you looking for?</label>
        <textarea
          id={textareaId}
          className="field-input field-textarea"
          rows={3}
          maxLength={MAX_LENGTH}
          value={message}
          placeholder="For example: a soft, natural look for everyday wear"
          onChange={(event) => setMessage(event.target.value)}
          aria-invalid={fieldError ? 'true' : 'false'}
          aria-describedby={describedBy}
          disabled={loading}
        />
        <p id={hintId} className="field-hint advisor-hint">
          <span>Please don&rsquo;t include personal details.</span>
          <span aria-label={`${remaining} characters left`}>{remaining} left</span>
        </p>
        {fieldError && (
          <p id={errorId} className="field-error" role="alert">{fieldError}</p>
        )}

        <div className="form-actions">
          <button type="submit" className="btn-gold" disabled={loading}>
            {loading ? 'Finding matches...' : 'Suggest services'}
          </button>
          {(result || requestError || message) && !loading && (
            <button type="button" className="btn-outline-gold" onClick={handleClear}>
              Start over
            </button>
          )}
        </div>
      </form>

      {/* Always present, so screen readers announce whatever appears inside it */}
      <div className="advisor-output" aria-live="polite" aria-busy={loading}>
        {loading && (
          <p className="advisor-note"><span className="spinner spinner-inline" aria-hidden="true" /> Finding matches...</p>
        )}

        {requestError && (
          <div className="form-banner" role="alert">
            {requestError}
            <button type="button" className="btn-outline-gold advisor-retry" onClick={handleSubmit}>
              Try again
            </button>
          </div>
        )}

        {result && (
          <>
            <p className="advisor-summary">{result.summary}</p>
            {result.source === 'fallback' && result.recommendations.length > 0 && (
              <p className="advisor-note">
                Our smart assistant is busy, so these suggestions are simple keyword matches.
              </p>
            )}
            {result.recommendations.length > 0 ? (
              <ul className="advisor-results">
                {result.recommendations.map((item) => (
                  <Recommendation key={item.serviceId} item={item} />
                ))}
              </ul>
            ) : (
              <p className="advisor-note">Browse the full menu below to see everything we offer.</p>
            )}
            <p className="advisor-disclaimer">{result.disclaimer}</p>
          </>
        )}
      </div>
    </section>
  )
}

export default ServiceAdvisor
