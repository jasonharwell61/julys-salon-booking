import mongoose from 'mongoose'
import { connectDB, disconnectDB, getSafeErrorMessage } from '../src/config/db.js'
import Booking from '../src/models/Booking.js'

// Only records carrying this note are ever created or deleted by this script
const TEST_NOTE = 'MODEL-TEST-BOOKING'
let failures = 0

function check(label, condition) {
  console.log(`${condition ? 'PASS' : 'FAIL'} - ${label}`)
  if (!condition) failures += 1
}

const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60000)

// Fake IDs: MongoDB does not require the referenced documents to exist
const fakeUser = new mongoose.Types.ObjectId()
const fakeService = new mongoose.Types.ObjectId()
const base = new Date('2030-01-15T16:00:00.000Z')

// A valid booking we can change one field of at a time
const valid = (overrides = {}) => ({
  user: fakeUser,
  service: fakeService,
  serviceSnapshot: { name: 'Fake Service', durationMinutes: 120, priceCents: 12000 },
  startTime: base,
  endTime: addMinutes(base, 120),
  customerNote: TEST_NOTE,
  ...overrides,
})

const errorsOf = (data) => new Booking(data).validateSync()?.errors || {}

// The shape of the overlap query we will use in Step 19 (test records only)
const findOverlaps = (start, end) =>
  Booking.find({
    customerNote: TEST_NOTE,
    status: { $ne: 'cancelled' },
    startTime: { $lt: end },
    endTime: { $gt: start },
  })

try {
  await connectDB()
  // Makes sure the indexes exist before we check for them
  await Booking.init()

  // ---- Validation tests (nothing is saved) ----
  const empty = errorsOf({})
  check(
    'missing required fields are rejected',
    Boolean(empty.user && empty.service && empty.serviceSnapshot && empty.startTime && empty.endTime)
  )
  check(
    'end time before start time is rejected',
    Boolean(errorsOf(valid({ endTime: addMinutes(base, -30) })).endTime)
  )
  check('end time equal to start time is rejected', Boolean(errorsOf(valid({ endTime: base })).endTime))
  check('unknown status is rejected', Boolean(errorsOf(valid({ status: 'pending' })).status))
  check('note over 300 characters is rejected', Boolean(errorsOf(valid({ customerNote: 'x'.repeat(301) })).customerNote))
  check('invalid user id is rejected', Boolean(errorsOf(valid({ user: 'abc' })).user))
  check(
    'service snapshot fields are required',
    Boolean(errorsOf(valid({ serviceSnapshot: {} }))['serviceSnapshot.name'])
  )
  check('status defaults to confirmed', new Booking(valid()).status === 'confirmed')

  // ---- Database tests (fake records, removed at the end) ----
  await Booking.deleteMany({ customerNote: TEST_NOTE }) // clears leftovers from an earlier failed run

  // Create the LATER booking first, to prove sorting works
  const laterBooking = await Booking.create(
    valid({ startTime: addMinutes(base, 24 * 60), endTime: addMinutes(base, 24 * 60 + 120) })
  )
  const firstBooking = await Booking.create(valid())
  check(
    'booking saved with timestamps and default status',
    Boolean(firstBooking.createdAt && firstBooking.updatedAt) && firstBooking.status === 'confirmed'
  )

  const mine = await Booking.find({ user: fakeUser, customerNote: TEST_NOTE }).sort({ startTime: 1 })
  check(
    "a user's bookings come back in time order",
    mine.length === 2 && mine[0].startTime.getTime() === base.getTime() && mine[1].id === laterBooking.id
  )

  // Window from 1 hour in to 3 hours in overlaps the first booking (0 to 2 hours)
  const overlapping = await findOverlaps(addMinutes(base, 60), addMinutes(base, 180))
  check('an overlapping time window is found', overlapping.length === 1)

  // Window starting exactly when the first booking ends is back-to-back, not overlapping
  const touching = await findOverlaps(addMinutes(base, 120), addMinutes(base, 240))
  check('a back-to-back time window is not an overlap', touching.length === 0)

  await Booking.updateOne({ _id: firstBooking._id }, { status: 'cancelled', cancelledAt: new Date() })
  const afterCancel = await findOverlaps(addMinutes(base, 60), addMinutes(base, 180))
  check('a cancelled booking no longer blocks its time', afterCancel.length === 0)

  check('toJSON hides __v', firstBooking.toJSON().__v === undefined)

  const indexes = await Booking.collection.indexes()
  check(
    'indexes on (user, startTime) and (startTime) exist',
    indexes.some((i) => i.key.user === 1 && i.key.startTime === 1) &&
      indexes.some((i) => Object.keys(i.key).length === 1 && i.key.startTime === 1)
  )
} catch (err) {
  console.error('Test script error:', err.name, getSafeErrorMessage(err))
  failures += 1
} finally {
  try {
    await Booking.deleteMany({ customerNote: TEST_NOTE })
  } catch {
    // ignore cleanup errors if the connection failed
  }
  await disconnectDB()
  console.log(failures === 0 ? 'All booking model checks passed' : `${failures} check(s) failed`)
  process.exitCode = failures === 0 ? 0 : 1
}