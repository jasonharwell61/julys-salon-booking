import { api } from './apiClient.js'

// Asks the assistant to suggest services. Needs a logged-in user (the token is sent automatically).
// The server answers with { summary, recommendations, disclaimer, source }.
export function recommendService(message, { signal } = {}) {
  return api.post('/ai/recommend-service', { message }, { signal })
}
