import Booking from '../models/Booking.js'
import Service from '../models/Service.js'
import ApiError from '../utils/ApiError.js'
import { assertCanAccessBooking } from '../utils/ownership.js'
import { BOOKING_RULES } from '../config/bookingRules.js'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MINUTE_MS = 60 * 1000

// Turns an exact moment into the salon's local clock time (handles daylight saving)
const salonClock = new Intl.DateTimeFormat('en-US', {
  timeZone: BOOKING_RULES.timeZone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

function getSalonTime(date) {
  const parts = Object.fromEntries(
    salonClock.formatToParts(date).map((part) => [part.type, part.value])
  )
  return {
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
    weekday: WEEKDAYS.indexOf(parts.weekday),
    minutesIntoDay: Number(parts.hour) * 60 + Number(parts.minute),
  }
}

// 540 -> "9:00 AM"
function formatClock(totalMinutes) {
  const hour = Math.floor(totalMinutes / 60)
  const minute = totalMinutes % 60
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  return `${hour12}:${String(minute).padStart(2, '0')} ${suffix}`
}

function timeError(message) {
  return new ApiError(400, 'Validation failed', [{ field: 'startTime', message }])
}

// Throws a 400 if the appointment breaks a time rule.
// `now` can be passed in so the rules can be tested with a fixed date.
export function validateAppointmentTime(startTime, endTime, now = new Date()) {
  const rules = BOOKING_RULES
  const salonStart = getSalonTime(startTime)
  const salonEnd = getSalonTime(endTime)

  const onGrid =
    startTime.getUTCSeconds() === 0 &&
    startTime.getUTCMilliseconds() === 0 &&
    salonStart.minutesIntoDay % rules.slotMinutes === 0
  if (!onGrid) {
    throw timeError(`Appointments must start on a ${rules.slotMinutes}-minute mark, like 10:00 or 10:15`)
  }

  if (startTime.getTime() < now.getTime() + rules.minNoticeMinutes * MINUTE_MS) {
    throw timeError(`Appointments must be booked at least ${rules.minNoticeMinutes / 60} hours ahead`)
  }

  if (startTime.getTime() > now.getTime() + rules.maxAdvanceDays * 24 * 60 * MINUTE_MS) {
    throw timeError(`Appointments can be booked up to ${rules.maxAdvanceDays} days ahead`)
  }

  if (!rules.openDays.includes(salonStart.weekday)) {
    throw timeError('We are closed on that day')
  }

  // The whole appointment must fit inside one day's opening hours
  const fitsInHours =
    salonStart.minutesIntoDay >= rules.openMinutes &&
    salonEnd.dateKey === salonStart.dateKey &&
    salonEnd.minutesIntoDay <= rules.closeMinutes
  if (!fitsInHours) {
    throw timeError(
      `Appointments must fit between ${formatClock(rules.openMinutes)} and ${formatClock(rules.closeMinutes)} Central time`
    )
  }
}

// "Check that the time is free, then save" is two steps. If two requests run at the same moment,
// both can pass the check before either saves, and the same time gets booked twice.
// This lets only ONE of those check-and-save steps run at a time (the others wait their turn).
// It protects a single server process, which is how this app runs. If it is ever scaled to several
// servers, replace it with a database-level guarantee (for example a transaction or a slot document).
let slotQueue = Promise.resolve()
function withSlotLock(task) {
  const run = slotQueue.then(task)
  slotQueue = run.then(() => {}, () => {}) // a failed task must not block the ones behind it
  return run
}

// Throws a 409 if another active booking overlaps this time window.
// excludeBookingId lets a booking be rescheduled without conflicting with itself.
export async function assertSlotIsFree(startTime, endTime, excludeBookingId) {
  const filter = {
    status: { $ne: 'cancelled' },
    startTime: { $lt: endTime }, // starts before this one ends...
    endTime: { $gt: startTime }, // ...and ends after this one starts
  }
  if (excludeBookingId) {
    filter._id = { $ne: excludeBookingId }
  }

  const conflict = await Booking.exists(filter)
  if (conflict) {
    throw new ApiError(409, 'That time is no longer available. Please choose another time.')
  }
}

// Creates a booking. The user comes from the verified token, never from the request body.
export async function createBooking({ userId, serviceId, startTime, customerNote }) {
  const service = await Service.findOne({ _id: serviceId, isActive: true })
  if (!service) {
    throw new ApiError(404, 'Service not found')
  }

  // Duration always comes from the database, never from the client
  const endTime = new Date(startTime.getTime() + service.durationMinutes * MINUTE_MS)

  validateAppointmentTime(startTime, endTime)

  // Check and save happen together, so two requests cannot both take the same time
  return withSlotLock(async () => {
    await assertSlotIsFree(startTime, endTime)

    return Booking.create({
      user: userId,
      service: service._id,
      serviceSnapshot: {
        name: service.name,
        durationMinutes: service.durationMinutes,
        priceCents: service.priceCents,
      },
      startTime,
      endTime,
      customerNote,
    })
  })
}

// ---------- Reading, updating and cancelling ----------

// Loads a booking and makes sure this user is allowed to see it
async function findBookingFor(user, bookingId) {
  const booking = await Booking.findById(bookingId)
  if (!booking) {
    throw new ApiError(404, 'Booking not found')
  }
  assertCanAccessBooking(user, booking)
  return booking
}

// The logged-in user's own bookings, soonest first
export function listMyBookings(userId) {
  return Booking.find({ user: userId }).sort({ startTime: 1 })
}

// Every booking, soonest first. Population adds the customer's name and email.
export function listAllBookings() {
  return Booking.find().sort({ startTime: 1 }).populate('user', 'name email')
}

export function getBooking(user, bookingId) {
  return findBookingFor(user, bookingId)
}

// Customers may change startTime and customerNote. Admins may only mark a booking completed.
export async function updateBooking(user, bookingId, changes) {
  const booking = await findBookingFor(user, bookingId)

  // ----- Admin: status can only move from confirmed to completed -----
  if (user.role === 'admin') {
    if (changes.status === undefined) {
      throw new ApiError(400, 'Validation failed', [
        { field: 'body', message: 'Provide a status to update' },
      ])
    }
    if (changes.status !== 'completed') {
      throw new ApiError(400, 'Validation failed', [
        { field: 'status', message: 'Status can only be changed to completed' },
      ])
    }
    if (booking.status !== 'confirmed') {
      throw new ApiError(409, 'Only confirmed bookings can be marked completed')
    }

    booking.status = 'completed'
    await booking.save()
    return booking
  }

  // ----- Customer: reschedule and/or edit the note -----
  // Any other field in the request (like status) was never passed to us
  if (changes.startTime === undefined && changes.customerNote === undefined) {
    throw new ApiError(400, 'Validation failed', [
      { field: 'body', message: 'Provide startTime or customerNote to update' },
    ])
  }
  if (booking.status !== 'confirmed') {
    throw new ApiError(409, 'Only confirmed bookings can be changed')
  }
  if (booking.startTime <= new Date()) {
    throw new ApiError(409, 'Past appointments cannot be changed')
  }

  let endTime
  if (changes.startTime !== undefined) {
    // Duration comes from the saved snapshot, not from the request
    endTime = new Date(
      changes.startTime.getTime() + booking.serviceSnapshot.durationMinutes * MINUTE_MS
    )
    validateAppointmentTime(changes.startTime, endTime)
  }

  // Check and save happen together, so a reschedule cannot collide with a simultaneous booking
  return withSlotLock(async () => {
    if (changes.startTime !== undefined) {
      await assertSlotIsFree(changes.startTime, endTime, booking._id) // ignore itself
      booking.startTime = changes.startTime
      booking.endTime = endTime
    }

    if (changes.customerNote !== undefined) {
      // An empty note clears it
      booking.customerNote = changes.customerNote || undefined
    }

    await booking.save()
    return booking
  })
}

// Cancels a booking (the record is kept, with status "cancelled")
export async function cancelBooking(user, bookingId) {
  const booking = await findBookingFor(user, bookingId)

  if (booking.status !== 'confirmed') {
    throw new ApiError(409, `Only confirmed bookings can be cancelled (this one is ${booking.status})`)
  }
  // Customers can cancel until the appointment starts
  if (user.role !== 'admin' && booking.startTime <= new Date()) {
    throw new ApiError(409, 'Past appointments cannot be cancelled')
  }

  booking.status = 'cancelled'
  booking.cancelledAt = new Date()
  await booking.save()
  return booking
}