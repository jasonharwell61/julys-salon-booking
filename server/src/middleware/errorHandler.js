import ApiError from '../utils/ApiError.js'
import { env } from '../config/env.js'

// Express treats a function with FOUR parameters as an error handler,
// so `next` must stay in the list even though we rarely use it.
export default function errorHandler(err, req, res, next) {
  // If a response has already started, hand over to Express's default handler
  if (res.headersSent) {
    return next(err)
  }

  // Errors we threw on purpose
  if (err instanceof ApiError) {
    const body = { error: err.message }
    if (err.details) body.details = err.details
    return res.status(err.status).json(body)
  }

  // Malformed JSON sent by the client
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' })
  }

  // Body larger than the limit set in app.js
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body too large' })
  }

  // Mongoose schema validation failed
  if (err.name === 'ValidationError' && err.errors) {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }))
    return res.status(400).json({ error: 'Validation failed', details })
  }

  // A value that cannot be converted to the expected type (like a bad ID)
  if (err.name === 'CastError') {
    return res.status(400).json({ error: `Invalid ${err.path}` })
  }

  // Duplicate value in a unique field
  if (err.code === 11000) {
    return res.status(409).json({ error: 'That value is already in use' })
  }

  // Anything else is unexpected. Log details for us, show nothing to the user.
  if (env.nodeEnv === 'production') {
    console.error('Server error:', err.name, err.message)
  } else {
    console.error(err)
  }

  res.status(500).json({ error: 'Something went wrong on the server' })
}