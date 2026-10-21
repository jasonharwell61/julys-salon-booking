// Loads the .env file and exposes settings in ONE place.
// Importing dotenv/config here means any file that imports this one
// gets the .env values loaded first.
import 'dotenv/config'

// Use this for settings the app cannot run without.
// The error names the variable but never shows its value.
export function requireEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  // Default is for local development only. Step 41 sets the real value in production.
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  aiProvider: process.env.AI_PROVIDER,
  aiModel: process.env.AI_MODEL,
  aiApiKey: process.env.AI_API_KEY,
}