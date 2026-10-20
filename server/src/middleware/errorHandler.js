// Express treats a function with FOUR parameters as an error handler,
// so `next` must stay in the list even though we don't use it.
export default function errorHandler(err, req, res, next) {
  // Malformed JSON sent by the client
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' })
  }

  // Body larger than the limit set in app.js
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body too large' })
  }

  // Log details for us, but never send them to the user
  console.error('Server error:', err.name, err.message)

  res.status(500).json({ error: 'Something went wrong on the server' })
}