// Reads the API address from client/.env (public configuration, not a secret).
// Vite only exposes variables that start with VITE_.
const rawBase = import.meta.env.VITE_API_BASE_URL

if (!rawBase) {
  throw new Error(
    'VITE_API_BASE_URL is not set. Copy client/.env.example to client/.env, then restart "npm run dev".'
  )
}

// Remove trailing slashes so we never build URLs like ".../api//services"
export const API_BASE_URL = rawBase.replace(/\/+$/, '')