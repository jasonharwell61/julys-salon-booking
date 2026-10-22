import bcrypt from 'bcryptjs'

// Higher = slower and safer. 10 is a good balance for a small app.
const COST = 10

export function hashPassword(password) {
  return bcrypt.hash(password, COST)
}

export function comparePassword(password, hash) {
  return bcrypt.compare(password, hash)
}

// Compared against when no user matches the email, so a login for an
// unknown email takes about as long as one for a real email.
export const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', COST)