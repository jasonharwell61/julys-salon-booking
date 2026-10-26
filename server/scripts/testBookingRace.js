// Proves two simultaneous requests cannot book the same time.
// The database is replaced by a slow fake (every read and write takes a few milliseconds),
// which is what makes a "check, then save" race show up. No MongoDB needed.
// Run from server/:  npm run test:booking-race
import Booking from '../src/models/Booking.js'
import Service from '../src/models/Service.js'
import { createBooking, updateBooking, validateAppointmentTime } from '../src/services/bookingService.js'

let failures = 0
function check(label, condition) {
  console.log(`${condition ? 'PASS' : 'FAIL'} - ${label}`)
  if (!condition) failures += 1
}
const sleep = (ms) => new Promise((done) => setTimeout(done, ms))

// ---- Slow fake database ----
let saved = []
const service = { _id: 'aaaaaaaaaaaaaaaaaaaaaaa1', name: 'Test Service', durationMinutes: 60, priceCents: 5000 }

Service.findOne = async () => { await sleep(5); return service }
Booking.exists = async (filter) => {
  await sleep(10)
  return saved.some((b) =>
    b.status !== 'cancelled' &&
    b.startTime < filter.startTime.$lt &&
    b.endTime > filter.endTime.$gt &&
    String(b._id) !== String(filter._id?.$ne))
}
let nextId = 1
Booking.create = async (doc) => {
  await sleep(20)
  const booking = { ...doc, _id: `b${nextId++}`, status: 'confirmed' }
  saved.push(booking)
  return booking
}

// ---- Find a start time the real rules accept (a weekday, in hours, on the grid) ----
function validStart(daysAhead, hourUtc) {
  const start = new Date()
  start.setUTCDate(start.getUTCDate() + daysAhead)
  start.setUTCHours(hourUtc, 0, 0, 0)
  return start
}
function firstValidStart() {
  for (let day = 3; day < 30; day += 1) {
    for (let hour = 14; hour <= 20; hour += 1) {
      const start = validStart(day, hour)
      try {
        validateAppointmentTime(start, new Date(start.getTime() + 2 * 3600000))
        return start
      } catch { /* try the next one */ }
    }
  }
  throw new Error('No valid test time found')
}
const base = firstValidStart() // a valid time with room for 2 hours after it
const at = (minutes) => new Date(base.getTime() + minutes * 60000)
const attempt = (userId, start) =>
  createBooking({ userId, serviceId: service._id, startTime: start }).then(
    () => 'ok',
    (err) => err.status
  )

// 1. Two requests for exactly the same time
saved = []
let results = await Promise.all([attempt('u1', at(0)), attempt('u2', at(0))])
check('same time, 2 at once: exactly one succeeds', results.filter((r) => r === 'ok').length === 1)
check('same time, 2 at once: the other gets 409', results.includes(409))
check('same time, 2 at once: only one booking saved', saved.length === 1)

// 2. Partly overlapping times
saved = []
results = await Promise.all([attempt('u1', at(0)), attempt('u2', at(30))])
check('overlapping times, 2 at once: exactly one succeeds', results.filter((r) => r === 'ok').length === 1)

// 3. Ten at once for the same time
saved = []
results = await Promise.all(Array.from({ length: 10 }, (_, i) => attempt(`u${i}`, at(0))))
check('10 at once: exactly one succeeds', results.filter((r) => r === 'ok').length === 1 && saved.length === 1)

// 4. Different, non-overlapping times must still all succeed together
saved = []
results = await Promise.all([attempt('u1', at(0)), attempt('u2', at(60)), attempt('u3', at(120))])
check('back-to-back non-overlapping times all succeed', results.every((r) => r === 'ok') && saved.length === 3)

// 5. A rejected request must not block the next one
saved = []
await attempt('u1', at(0))
await attempt('u2', at(0)) // 409
check('after a conflict, a free time can still be booked', (await attempt('u3', at(120))) === 'ok')

// 6. Rescheduling races with a new booking for the same time
saved = []
await attempt('u1', at(0))
const existing = saved[0]
existing.save = async function save() { await sleep(20); return this }
Booking.findById = async () => existing
const customer = { _id: 'u1', role: 'customer' }
existing.user = 'u1'
existing.serviceSnapshot = { durationMinutes: 60 }
const move = updateBooking(customer, existing._id, { startTime: at(120) }).then(() => 'ok', (e) => e.status)
const create = attempt('u2', at(120))
results = await Promise.all([move, create])
check('reschedule vs new booking for the same time: exactly one wins', results.filter((r) => r === 'ok').length === 1)

console.log(failures === 0 ? 'All booking race checks passed' : `${failures} check(s) failed`)
process.exitCode = failures === 0 ? 1 - 1 : 1
