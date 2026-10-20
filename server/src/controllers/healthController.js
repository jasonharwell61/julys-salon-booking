export function getHealth(req, res) {
  res.status(200).json({
    status: 'ok',
    service: 'julys-salon-api',
    timestamp: new Date().toISOString(),
  })
}