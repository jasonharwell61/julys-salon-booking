// Runs only when no route matched the request
export default function notFound(req, res) {
  res.status(404).json({ error: 'Route not found' })
}