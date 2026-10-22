import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { env } from './config/env.js'
import healthRoutes from './routes/healthRoutes.js'
import authRoutes from './routes/authRoutes.js'
import serviceRoutes from './routes/serviceRoutes.js'
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
app.use('/api/auth', authRoutes)
app.use('/api/services', serviceRoutes)

// These two MUST stay last: unknown routes first, then errors
app.use(notFound)
app.use(errorHandler)

export default app