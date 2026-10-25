// The ONLY file that touches the saved login token.
const TOKEN_KEY = 'julys_salon_token'

// Storage can throw (private browsing, blocked site data), so every call is wrapped.
export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // Ignore: the user simply won't stay logged in after a refresh
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Ignore
  }
}