import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import FormField from '../components/FormField.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { compactErrors, validateEmail } from '../utils/validation.js'

function LoginPage() {
  const { user, login } = useAuth()
  const location = useLocation()
  const redirectTo = location.state?.from?.pathname || '/services'

  const [values, setValues] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Already logged in (or just logged in): go on to where they were headed
  if (user) return <Navigate to={redirectTo} replace />

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

    const found = compactErrors({
      email: validateEmail(values.email),
      password: values.password ? '' : 'Password is required',
    })
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    try {
      await login({ email: values.email.trim(), password: values.password })
      // On success the user becomes set and the <Navigate> above takes over
    } catch (error) {
      const fieldErrors = error.fieldErrors || {}
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors)
      } else {
        // e.g. "Invalid email or password", a rate-limit message, or "Cannot reach the server"
        setFormError(error.message)
      }
      setSubmitting(false)
    }
  }

  return (
    <section className="container page-section">
      <div className="auth-card">
        <h1>Welcome back</h1>
        <p className="auth-intro">Log in to book and manage your appointments.</p>

        <form onSubmit={handleSubmit} noValidate>
          {formError && (
            <div className="form-banner" role="alert">
              {formError}
            </div>
          )}

          <FormField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={handleChange}
            error={errors.email}
          />
          <FormField
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={values.password}
            onChange={handleChange}
            error={errors.password}
          />

          <button type="submit" className="btn-gold auth-submit" disabled={submitting}>
            {submitting ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="auth-switch">
          New here? <Link to="/register" state={location.state}>Create an account</Link>
        </p>
      </div>
    </section>
  )
}

export default LoginPage
