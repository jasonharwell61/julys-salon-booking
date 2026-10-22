// The salon's booking rules in one place. Edit these to match the real salon.
export const BOOKING_RULES = {
  timeZone: 'America/Chicago',
  // Days the salon is open: 0 = Sunday, 1 = Monday ... 6 = Saturday
  openDays: [1, 2, 3, 4, 5, 6],
  openMinutes: 9 * 60, // 9:00 AM
  closeMinutes: 18 * 60, // 6:00 PM
  slotMinutes: 15, // start times must land on this grid
  minNoticeMinutes: 120, // book at least 2 hours ahead
  maxAdvanceDays: 90, // no more than 90 days ahead
}