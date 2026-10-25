import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import StatusMessage from './StatusMessage.jsx'

// Wrap a page in this to require a login (and optionally a role).
// This only controls what the screen shows. The server enforces the real rules.
function ProtectedRoute({ children, role }) {
  const { user, restoring } = useAuth()
  const location = useLocation()

  if (restoring) {
    return (
      <div className="container page-section">
        <StatusMessage kind="loading" title="Checking your session..." />
      </div>
    )
  }

  if (!user) {
    // Remember where they were headed so login can send them back
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (role && user.role !== role) {
    return (
      <div className="container page-section">
        <StatusMessage kind="error" title="Access denied">
          You don&rsquo;t have permission to view this page.
        </StatusMessage>
      </div>
    )
  }

  return children
}

export default ProtectedRoute
