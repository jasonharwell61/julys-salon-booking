import { canAccessBooking, assertCanAccessBooking } from '../src/utils/ownership.js'

let failures = 0

function check(label, condition) {
  console.log(`${condition ? 'PASS' : 'FAIL'} - ${label}`)
  if (!condition) failures += 1
}

// Plain fake objects: no database needed
const customerA = { _id: '665f1c2b8e4a4b0012a3c4d5', role: 'customer' }
const customerB = { _id: '665f1c2b8e4a4b0012a3c4d6', role: 'customer' }
const admin = { _id: '665f1c2b8e4a4b0012a3c4d7', role: 'admin' }

const bookingOfA = { user: '665f1c2b8e4a4b0012a3c4d5' }
const populatedBookingOfA = { user: { _id: '665f1c2b8e4a4b0012a3c4d5', name: 'A' } }

check('the owner can access their own booking', canAccessBooking(customerA, bookingOfA) === true)
check("another customer cannot access someone else's booking", canAccessBooking(customerB, bookingOfA) === false)
check('an admin can access any booking', canAccessBooking(admin, bookingOfA) === true)
check('ownership works when the booking user is populated', canAccessBooking(customerA, populatedBookingOfA) === true)

let status = null
try {
  assertCanAccessBooking(customerB, bookingOfA)
} catch (err) {
  status = err.status
}
check('assertCanAccessBooking throws a 403 for a non-owner', status === 403)

let threw = false
try {
  assertCanAccessBooking(customerA, bookingOfA)
} catch {
  threw = true
}
check('assertCanAccessBooking does not throw for the owner', threw === false)

console.log(failures === 0 ? 'All ownership checks passed' : `${failures} check(s) failed`)
process.exitCode = failures === 0 ? 0 : 1