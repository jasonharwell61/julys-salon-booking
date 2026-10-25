import { startTransition, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './useAuth.js'

// Logs out AND goes Home. Both changes are applied together; otherwise a protected
// page (like /account) notices the missing user first and bounces to /login instead.
export function useLogout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  return useCallback(() => {
    startTransition(() => {
      logout()
      navigate('/')
    })
  }, [logout, navigate])
}
