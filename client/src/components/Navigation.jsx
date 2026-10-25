import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

function Navigation() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

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
        </ul>
      </nav>
    </header>
  )
}

export default Navigation
