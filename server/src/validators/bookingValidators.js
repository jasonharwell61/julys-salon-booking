import { cleanString, isValidObjectId } from '../utils/validation.js'

// ISO 8601 date-time that MUST include a time zone (Z or +hh:mm)
const ISO_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/

// Returns a Date, or null if the text is not a real date-time
export function parseDateTime(raw) {
  if (typeof raw !== 'string' || !ISO_PATTERN.test(raw)) return null

  // Reject impossible dates like February 31 (some engines quietly roll them over)
  const [year, month, day] = raw.slice(0, 10).split('-').map(Number)
  const check = new Date(Date.UTC(year, month - 1, day))
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null
  }

  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date
}

// Only serviceId, startTime and customerNote are ever copied into `value`
export function validateCreateBooking(body) {
  const errors = []
  const value = {}

  if (!isValidObjectId(body.serviceId)) {
    errors.push({ field: 'serviceId', message: 'A valid serviceId is required' })
  } else {
    value.serviceId = body.serviceId
  }

  const startTime = parseDateTime(body.startTime)
  if (!startTime) {
    errors.push({
      field: 'startTime',
      message: 'startTime must be an ISO 8601 date-time with a time zone, like 2026-11-10T16:00:00.000Z',
    })
  } else {
    value.startTime = startTime
  }

  if (body.customerNote !== undefined) {
    const note = cleanString(body.customerNote)
    if (note === undefined || note.length > 300) {
      errors.push({ field: 'customerNote', message: 'Note must be text of up to 300 characters' })
    } else if (note.length > 0) {
      value.customerNote = note
    }
  }

  return { errors, value }
}

// For PATCH. Only checks that the fields sent are well-formed.
// Which of them a person may actually change is decided by their role in the service.
export function validateUpdateBooking(body) {
  const errors = []
  const value = {}

  if (body.startTime !== undefined) {
    const startTime = parseDateTime(body.startTime)
    if (!startTime) {
      errors.push({
        field: 'startTime',
        message: 'startTime must be an ISO 8601 date-time with a time zone, like 2026-11-10T16:00:00.000Z',
      })
    } else {
      value.startTime = startTime
    }
  }

  if (body.customerNote !== undefined) {
    const note = cleanString(body.customerNote)
    if (note === undefined || note.length > 300) {
      errors.push({ field: 'customerNote', message: 'Note must be text of up to 300 characters' })
    } else {
      value.customerNote = note // an empty string means "clear the note"
    }
  }

  if (body.status !== undefined) {
    if (typeof body.status !== 'string') {
      errors.push({ field: 'status', message: 'Status must be text' })
    } else {
      value.status = body.status
    }
  }

  return { errors, value }
}