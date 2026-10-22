import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { env } from './config/env.js'
import healthRoutes from './routes/healthRoutes.js'
import devRoutes from './routes/devRoutes.js'
import notFound from './middleware/notFound.js'
import errorHandler from './middleware/errorHandler.js'

const app = express()

// Adds security headers to every response
app.use(helmet())

// Only allow requests from our React app's address
app.use(cors({ origin: env.clientOrigin }))

// Reads JSON request bodies, and refuses anything bigger than 10 KB
app.use(express.json({ limit: '10kb' }))

// Routes
app.use('/api/health', healthRoutes)

// TEMPORARY test routes. Not available in production.
// DELETE this block and routes/devRoutes.js in Step 16.
if (env.nodeEnv !== 'production') {
  app.use('/api/dev', devRoutes)
}

// These two MUST stay last: unknown routes first, then errors
app.use(notFound)
app.use(errorHandler)

export default app