// Friendly early checks that mirror the server's rules.
// The server still re-checks everything: these only save the user a round trip.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(email) {
  const value = email.trim()
  if (!value) return 'Email is required'
  if (value.length > 254 || !EMAIL_PATTERN.test(value)) return 'Enter a valid email address'
  return ''
}

export function validateName(name) {
  const value = name.trim()
  if (!value) return 'Name is required'
  if (value.length < 2 || value.length > 60) return 'Name must be 2 to 60 characters'
  return ''
}

export function validateNewPassword(password) {
  if (!password) return 'Password is required'
  if (password.length < 8) return 'Password must be at least 8 characters'
  if (new TextEncoder().encode(password).length > 72) return 'Password is too long (72 bytes maximum)'
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Password must include at least one letter and one number'
  }
  return ''
}

// Removes empty messages so the result only holds fields that have a problem
export function compactErrors(errors) {
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message))
}
