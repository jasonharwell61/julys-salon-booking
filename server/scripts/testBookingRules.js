import { validateAppointmentTime } from '../src/services/bookingService.js'

let failures = 0

function check(label, condition) {
  console.log(`${condition ? 'PASS' : 'FAIL'} - ${label}`)
  if (!condition) failures += 1
}

// A fixed "now" so the results never depend on today's date
const NOW = new Date('2026-10-22T18:00:00.000Z')

// Returns null if the time is allowed, or the error message if it is not
function problemWith(startIso, durationMinutes, now = NOW) {
  const start = new Date(startIso)
  const end = new Date(start.getTime() + durationMinutes * 60000)
  try {
    validateAppointmentTime(start, end, now)
    return null
  } catch (err) {
    return err.details?.[0]?.message ?? err.message
  }
}

// Nov 10, 2026 is a Tuesday, after daylight saving ends, so Central = UTC-6
check('Tuesday 10:00 AM Central is accepted', problemWith('2026-11-10T16:00:00.000Z', 120) === null)
check('Sunday is rejected', problemWith('2026-11-08T16:00:00.000Z', 60) !== null)
check('7:00 AM (before opening) is rejected', problemWith('2026-11-10T13:00:00.000Z', 60) !== null)
check('an appointment ending after closing is rejected', problemWith('2026-11-10T23:30:00.000Z', 120) !== null)
check('a time off the 15-minute grid is rejected', problemWith('2026-11-10T16:10:00.000Z', 60) !== null)
check('less than 2 hours of notice is rejected', problemWith('2026-10-22T19:00:00.000Z', 60) !== null)
check('more than 90 days ahead is rejected', problemWith('2027-06-01T16:00:00.000Z', 60) !== null)
check('ending exactly at closing time is accepted', problemWith('2026-11-10T22:00:00.000Z', 120) === null)

// Oct 28, 2026 is before the clock change (Central = UTC-5): 14:00 UTC is 9:00 AM
check('9:00 AM during daylight time (Oct 28) is accepted', problemWith('2026-10-28T14:00:00.000Z', 60) === null)
// The same UTC time on Nov 10 is 8:00 AM Central, which is before opening
check('the same UTC time after the clock change (8:00 AM) is rejected', problemWith('2026-11-10T14:00:00.000Z', 60) !== null)

console.log(failures === 0 ? 'All booking rule checks passed' : `${failures} check(s) failed`)
process.exitCode = failures === 0 ? 0 : 1