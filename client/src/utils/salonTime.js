// Salon opening rules, mirrored from server/src/config/bookingRules.js.
// The SERVER is the authority and re-checks everything. These copies only let the form
// offer sensible choices. If you change the rules on the server, change them here too.
export const SALON_TIME_ZONE = 'America/Chicago'
export const SALON_RULES = {
  openDays: [1, 2, 3, 4, 5, 6], // 0 = Sunday ... 6 = Saturday
  openMinutes: 9 * 60,
  closeMinutes: 18 * 60,
  slotMinutes: 15,
  minNoticeMinutes: 120,
  maxAdvanceDays: 90,
}

const MINUTE_MS = 60 * 1000
const DAY_MS = 24 * 60 * MINUTE_MS

const clockParts = new Intl.DateTimeFormat('en-US', {
  timeZone: SALON_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

function getParts(date) {
  return Object.fromEntries(clockParts.formatToParts(date).map((p) => [p.type, p.value]))
}

// "2026-11-10" in the SALON's time zone (not the browser's)
export function toDateKey(date) {
  const p = getParts(date)
  return `${p.year}-${p.month}-${p.day}`
}

// "16:00" in the salon's time zone
export function toTimeKey(date) {
  const p = getParts(date)
  return `${p.hour}:${p.minute}`
}

export function getSalonToday() {
  return toDateKey(new Date())
}

// How far the salon clock is ahead of UTC at a given moment (negative for Chicago)
function offsetMs(date) {
  const p = getParts(date)
  const wallAsUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second)
  return wallAsUtc - Math.floor(date.getTime() / 1000) * 1000
}

// Turns "2026-11-10" + "16:00" (salon wall-clock time) into the exact moment it means.
// Two passes make it right even on daylight-saving change days.
export function zonedToDate(dateKey, timeKey) {
  const [y, m, d] = dateKey.split('-').map(Number)
  const [h, min] = timeKey.split(':').map(Number)
  const wall = Date.UTC(y, m - 1, d, h, min)
  let ts = wall - offsetMs(new Date(wall))
  ts = wall - offsetMs(new Date(ts))
  return new Date(ts)
}

export function addDays(dateKey, days) {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

export function isOpenDay(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number)
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return SALON_RULES.openDays.includes(weekday)
}

// "16:00" -> "4:00 PM"
export function formatTimeKey(timeKey) {
  const [h, m] = timeKey.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`
}

const dateLabel = new Intl.DateTimeFormat('en-US', {
  timeZone: SALON_TIME_ZONE,
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

// "Tue, Nov 10, 2026 at 4:00 PM CT"
export function formatSalonDateTime(value) {
  const date = new Date(value)
  return `${dateLabel.format(date)} at ${formatTimeKey(toTimeKey(date))} CT`
}

// The start times a customer may pick on a day, for a service of a given length
export function buildTimeOptions(dateKey, durationMinutes) {
  if (!dateKey || !isOpenDay(dateKey)) return []
  const now = Date.now()
  const earliest = now + SALON_RULES.minNoticeMinutes * MINUTE_MS
  const latest = now + SALON_RULES.maxAdvanceDays * DAY_MS

  const options = []
  for (
    let minutes = SALON_RULES.openMinutes;
    minutes + durationMinutes <= SALON_RULES.closeMinutes;
    minutes += SALON_RULES.slotMinutes
  ) {
    const key = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
    const startsAt = zonedToDate(dateKey, key).getTime()
    if (startsAt >= earliest && startsAt <= latest) {
      options.push({ value: key, label: formatTimeKey(key) })
    }
  }
  return options
}
