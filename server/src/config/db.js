import mongoose from 'mongoose'
import { env, requireEnv } from './env.js'

// Connects to MongoDB. Fails with a clear error if MONGODB_URI is missing.
export async function connectDB() {
  const uri = requireEnv('MONGODB_URI')

  // Give up after 10 seconds instead of hanging forever
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 })

  // Logs only the database NAME, never the connection string
  console.log(`MongoDB connected (database: ${mongoose.connection.name})`)
}

export async function disconnectDB() {
  await mongoose.disconnect()
}

// Returns a plain-English connection state for the health route
export function getDbStatus() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  }
  return states[mongoose.connection.readyState] || 'unknown'
}

// Error text with the connection string removed, safe to print
export function getSafeErrorMessage(err) {
  const message = String(err.message)
  return env.mongodbUri ? message.split(env.mongodbUri).join('[hidden]') : message
}