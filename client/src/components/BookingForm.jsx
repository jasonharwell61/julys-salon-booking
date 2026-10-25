import { useId, useMemo, useState } from 'react'
import FormField from './FormField.jsx'
import {
  SALON_RULES,
  addDays,
  buildTimeOptions,
  getSalonToday,
  isOpenDay,
  toDateKey,
  toTimeKey,
  zonedToDate,
} from '../utils/salonTime.js'

const NOTE_MAX = 300

// Date + time + note. Used to book a service and to reschedule a booking.
// onSubmit({ startTime, customerNote }) may throw an ApiError; it is shown here.
function BookingForm({
  durationMinutes,
  initialStartTime,
  initialNote = '',
  submitLabel,
  onSubmit,
  onCancel,
}) {
  const timeId = useId()
  const noteId = useId()

  const [date, setDate] = useState(() => (initialStartTime ? toDateKey(new Date(initialStartTime)) : ''))
  const [time, setTime] = useState(() => (initialStartTime ? toTimeKey(new Date(initialStartTime)) : ''))
  const [note, setNote] = useState(initialNote)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const today = getSalonToday()
  const options = useMemo(() => buildTimeOptions(date, durationMinutes), [date, durationMinutes])
  const closedThatDay = Boolean(date) && !isOpenDay(date)

  function handleDateChange(event) {
    const nextDate = event.target.value
    setDate(nextDate)
    // Keep the chosen time only if it is still offered on the new day
    if (!buildTimeOptions(nextDate, durationMinutes).some((option) => option.value === time)) {
      setTime('')
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

    const found = {}
    if (!date) found.date = 'Choose a date'
    else if (closedThatDay) found.date = 'We are closed that day'
    if (date && !closedThatDay && !time) found.time = 'Choose a time'
    if (note.length > NOTE_MAX) found.customerNote = `Note must be ${NOTE_MAX} characters or fewer`
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    try {
      await onSubmit({
        startTime: zonedToDate(date, time).toISOString(),
        customerNote: note.trim(),
      })
    } catch (error) {
      const fieldErrors = error.fieldErrors || {}
      if (Object.keys(fieldErrors).length > 0) {
        setErrors({
          time: fieldErrors.startTime,
          customerNote: fieldErrors.customerNote,
        })
        if (!fieldErrors.startTime && !fieldErrors.customerNote) setFormError(error.message)
      } else {
        // e.g. 409 "That time is no longer available...", or "Cannot reach the server"
        setFormError(error.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="booking-form">
      {formError && (
        <div className="form-banner" role="alert">
          {formError}
        </div>
      )}

      <FormField
        label="Date"
        name="date"
        type="date"
        min={today}
        max={addDays(today, SALON_RULES.maxAdvanceDays)}
        value={date}
        onChange={handleDateChange}
        error={errors.date}
      />

      <div className="field">
        <label htmlFor={timeId} className="field-label">
          Time (Central Time)
        </label>
        <select
          id={timeId}
          className="field-input"
          value={time}
          disabled={!date || options.length === 0}
          aria-invalid={errors.time ? 'true' : 'false'}
          onChange={(event) => setTime(event.target.value)}
        >
          <option value="">
            {!date ? 'Pick a date first' : options.length === 0 ? 'No times available' : 'Select a time'}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {date && options.length === 0 && (
          <p className="field-hint">
            {closedThatDay
              ? 'We are closed on Sundays. Please choose another day.'
              : 'No times are left that day. Please choose another day.'}
          </p>
        )}
        {errors.time && <p className="field-error">{errors.time}</p>}
      </div>

      <div className="field">
        <label htmlFor={noteId} className="field-label">
          Note (optional)
        </label>
        <textarea
          id={noteId}
          className="field-input field-textarea"
          rows={3}
          value={note}
          maxLength={NOTE_MAX + 50}
          aria-invalid={errors.customerNote ? 'true' : 'false'}
          onChange={(event) => setNote(event.target.value)}
        />
        <p className="field-hint">{note.length}/{NOTE_MAX}</p>
        {errors.customerNote && <p className="field-error">{errors.customerNote}</p>}
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-gold" disabled={submitting}>
          {submitting ? 'Saving...' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn-outline-gold" onClick={onCancel} disabled={submitting}>
            Never mind
          </button>
        )}
      </div>
    </form>
  )
}

export default BookingForm
