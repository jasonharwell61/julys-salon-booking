import { useCallback, useEffect, useMemo, useState } from 'react'
import { setUnauthorizedHandler } from '../api/apiClient.js'
import { getMe, loginUser, registerUser } from '../api/authApi.js'
import { clearToken, getToken, setToken } from '../api/tokenStorage.js'
import { AuthContext } from './AuthContext.js'

export function AuthProvider({ children }) {
  // restoring = we hold a saved token and are still asking the server who it belongs to
  const [state, setState] = useState(() => ({ user: null, restoring: Boolean(getToken()) }))

  // If any request gets a 401 while logged in, the token expired: drop to logged-out
  useEffect(() => {
    setUnauthorizedHandler(() => setState({ user: null, restoring: false }))
    return () => setUnauthorizedHandler(null)
  }, [])

  // On first load, turn a saved token back into a user (so refresh keeps you logged in)
  useEffect(() => {
    if (!getToken()) return undefined
    const controller = new AbortController()

    getMe({ signal: controller.signal })
      .then((user) => setState({ user, restoring: false }))
      .catch((error) => {
        if (error.name === 'AbortError') return
        setState({ user: null, restoring: false })
      })

    return () => controller.abort()
  }, [])

  const login = useCallback(async (credentials) => {
    const { token, user } = await loginUser(credentials)
    setToken(token)
    setState({ user, restoring: false })
    return user
  }, [])

  const register = useCallback(async (details) => {
    const { token, user } = await registerUser(details)
    setToken(token)
    setState({ user, restoring: false })
    return user
  }, [])

  // There is no logout endpoint: logging out means forgetting the token in this browser
  const logout = useCallback(() => {
    clearToken()
    setState({ user: null, restoring: false })
  }, [])

  const value = useMemo(
    () => ({ user: state.user, restoring: state.restoring, login, register, logout }),
    [state, login, register, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
