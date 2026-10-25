import { api } from './apiClient.js'

// Public routes, so no login token is needed
export function listServices({ category, signal } = {}) {
  return api.get('/services', { query: { category }, signal, auth: false })
}

export function getService(id, { signal } = {}) {
  return api.get(`/services/${id}`, { signal, auth: false })
}