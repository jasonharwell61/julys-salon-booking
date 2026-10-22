import { cleanString } from '../utils/validation.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function checkEmail(rawEmail, errors) {
  const email = cleanString(rawEmail)?.toLowerCase()

  if (!email) {
    errors.push({ field: 'email', message: 'Email is required' })
  } else if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    errors.push({ field: 'email', message: 'Email format is invalid' })
  }

  return email
}

// Only name, email and password are ever copied into `value`,
// so a client can never set role or anything else through registration.
export function validateRegister(body) {
  const errors = []

  const name = cleanString(body.name)
  if (!name) {
    errors.push({ field: 'name', message: 'Name is required' })
  } else if (name.length < 2 || name.length > 60) {
    errors.push({ field: 'name', message: 'Name must be 2 to 60 characters' })
  }

  const email = checkEmail(body.email, errors)

  const password = body.password
  if (typeof password !== 'string' || password.length === 0) {
    errors.push({ field: 'password', message: 'Password is required' })
  } else if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    errors.push({ field: 'password', message: 'Password must be 8 to 72 characters' })
  } else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    errors.push({
      field: 'password',
      message: 'Password must include at least one letter and one number',
    })
  }

  return { errors, value: { name, email, password } }
}

export function validateLogin(body) {
  const errors = []

  const email = checkEmail(body.email, errors)

  const password = body.password
  if (typeof password !== 'string' || password.length === 0) {
    errors.push({ field: 'password', message: 'Password is required' })
  }

  return { errors, value: { email, password } }
}