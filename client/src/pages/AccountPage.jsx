import { useAuth } from '../hooks/useAuth.js'
import { useLogout } from '../hooks/useLogout.js'

// A small protected page for now. Step 25 turns this area into the booking dashboard.
function AccountPage() {
  const { user } = useAuth()
  const logout = useLogout()

  return (
    <section className="container page-section">
      <div className="auth-card">
        <h1>Your account</h1>
        <dl className="account-details">
          <div>
            <dt>Name</dt>
            <dd>{user.name}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd className="account-role">{user.role}</dd>
          </div>
        </dl>
        <button type="button" className="btn-outline-gold" onClick={logout}>
          Log out
        </button>
      </div>
    </section>
  )
}

export default AccountPage
