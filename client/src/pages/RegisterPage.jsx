import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import FormField from '../components/FormField.jsx'
import { useAuth } from '../hooks/useAuth.js'
import {
  compactErrors,
  validateEmail,
  validateName,
  validateNewPassword,
} from '../utils/validation.js'

function RegisterPage() {
  const { user, register } = useAuth()
  const location = useLocation()
  const redirectTo = location.state?.from?.pathname || '/services'

  const [values, setValues] = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to={redirectTo} replace />

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

    const found = compactErrors({
      name: validateName(values.name),
      email: validateEmail(values.email),
      password: validateNewPassword(values.password),
      confirm: values.password === values.confirm ? '' : 'Passwords do not match',
    })
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    try {
      // Only these three fields are sent. The server decides the role.
      await register({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      })
    } catch (error) {
      const fieldErrors = error.fieldErrors || {}
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors)
      } else {
        // e.g. 409 "An account with that email already exists"
        setFormError(error.message)
      }
      setSubmitting(false)
    }
  }

  return (
    <section className="container page-section">
      <div className="auth-card">
        <h1>Create your account</h1>
        <p className="auth-intro">It only takes a minute, then you can book online.</p>

        <form onSubmit={handleSubmit} noValidate>
          {formError && (
            <div className="form-banner" role="alert">
              {formError}
            </div>
          )}

          <FormField
            label="Name"
            name="name"
            autoComplete="name"
            value={values.name}
            onChange={handleChange}
            error={errors.name}
          />
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
            autoComplete="new-password"
            value={values.password}
            onChange={handleChange}
            error={errors.password}
          />
          <p className="field-hint">At least 8 characters, with a letter and a number.</p>
          <FormField
            label="Confirm password"
            name="confirm"
            type="password"
            autoComplete="new-password"
            value={values.confirm}
            onChange={handleChange}
            error={errors.confirm}
          />

          <button type="submit" className="btn-gold auth-submit" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login" state={location.state}>Log in</Link>
        </p>
      </div>
    </section>
  )
}

export default RegisterPage
