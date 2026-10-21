import { getDbStatus } from '../config/db.js'

export function getHealth(req, res) {
  const database = getDbStatus()
  const isHealthy = database === 'connected'

  // 503 tells hosting services "this instance can't do its job right now"
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    service: 'julys-salon-api',
    database,
    timestamp: new Date().toISOString(),
  })
}