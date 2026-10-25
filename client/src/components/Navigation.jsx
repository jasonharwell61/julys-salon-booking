import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { useLogout } from '../hooks/useLogout.js'

function Navigation() {
  const [open, setOpen] = useState(false)
  const { user, restoring } = useAuth()
  const logout = useLogout()
  const close = () => setOpen(false)

  function handleLogout() {
    close()
    logout()
  }

  return (
    <header className="site-header">
      <nav className="site-nav container" aria-label="Main">
        <Link to="/" className="wordmark" onClick={close}>
          <span className="wordmark-main">July&rsquo;s</span>
          <span className="wordmark-sub">Salon</span>
        </Link>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="nav-links"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="visually-hidden">Menu</span>
          <span aria-hidden="true">{open ? '✕' : '☰'}</span>
        </button>

        <ul id="nav-links" className={`nav-links${open ? ' open' : ''}`}>
          <li>
            <NavLink to="/" end onClick={close}>Home</NavLink>
          </li>
          <li>
            <NavLink to="/services" onClick={close}>Services</NavLink>
          </li>

          {/* While we check a saved login, show neither set of links (avoids a flicker) */}
          {!restoring && user && (
            <>
              <li>
                <NavLink to="/account" onClick={close}>Account</NavLink>
              </li>
              <li>
                <button type="button" className="nav-button" onClick={handleLogout}>
                  Log out
                </button>
              </li>
            </>
          )}
          {!restoring && !user && (
            <>
              <li>
                <NavLink to="/login" onClick={close}>Log in</NavLink>
              </li>
              <li>
                <NavLink to="/register" className="nav-cta" onClick={close}>Sign up</NavLink>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  )
}

export default Navigation
