import Booking from '../models/Booking.js'
import Service from '../models/Service.js'
import ApiError from '../utils/ApiError.js'
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
}