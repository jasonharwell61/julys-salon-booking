import { API_BASE_URL } from './config.js'
import { ApiError } from './ApiError.js'
import { getToken, clearToken } from './tokenStorage.js'

// Step 24 will register a function here that logs the user out in the UI
let onUnauthorized = null
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler
}

function buildUrl(path, query) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  const url = new URL(API_BASE_URL + cleanPath)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value)
      }
    }
  }
  return url.toString()
}

// Reads the response body without ever throwing on empty or non-JSON bodies
async function readBody(response) {
  if (response.status === 204) return null
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export async function request(path, { method = 'GET', body, query, signal, auth = true } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const token = auth ? getToken() : null
  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch (err) {
    // A cancelled request is not an error. Let the caller ignore it.
    if (err.name === 'AbortError') throw err
    throw new ApiError('Cannot reach the server. Check your connection and try again.', {
      isNetworkError: true,
    })
  }

  const data = await readBody(response)

  if (!response.ok) {
    // A 401 while holding a token means it expired or was revoked
    if (response.status === 401 && token) {
      clearToken()
      if (onUnauthorized) onUnauthorized()
    }
    const message =
      data && typeof data.error === 'string' && data.error
        ? data.error
        : `Request failed (HTTP ${response.status}).`
    throw new ApiError(message, {
      status: response.status,
      details: data && Array.isArray(data.details) ? data.details : [],
    })
  }

  return data
}

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
}