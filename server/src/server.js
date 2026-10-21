import { env } from './config/env.js'
import app from './app.js'
import { connectDB, disconnectDB, getSafeErrorMessage } from './config/db.js'

async function startServer() {
  // 1. Connect to the database FIRST
  try {
    await connectDB()
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.name, getSafeErrorMessage(err))
    process.exit(1) // stop startup, nothing is listening
  }

  // 2. Only now start accepting requests
  const server = app.listen(env.port, () => {
    console.log(`July's Salon API listening on port ${env.port}`)
  })

  // 3. Shut down cleanly when told to stop
  async function shutdown(signal) {
    console.log(`${signal} received, shutting down...`)

    // Safety net: force exit if cleanup takes more than 10 seconds
    setTimeout(() => process.exit(1), 10000).unref()

    server.close(async () => {
      try {
        await disconnectDB()
      } finally {
        process.exit(0)
      }
    })
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

startServer()