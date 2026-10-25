// A booking you can still change: confirmed AND the start time hasn't passed
export function isUpcoming(booking) {
  return booking.status === 'confirmed' && new Date(booking.startTime).getTime() > Date.now()
}

export const STATUS_LABELS = {
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
}
