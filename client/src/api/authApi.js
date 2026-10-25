import { api } from './apiClient.js'

// Register and login need no token, so auth:false keeps a stale token out of the request
export function registerUser({ name, email, password }) {
  return api.post('/auth/register', { name, email, password }, { auth: false })
}

export function loginUser({ email, password }) {
  return api.post('/auth/login', { email, password }, { auth: false })
}

// Asks the server who the saved token belongs to (uses the saved token automatically)
export function getMe({ signal } = {}) {
  return api.get('/auth/me', { signal })
}
