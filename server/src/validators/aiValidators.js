export const MESSAGE_MIN = 3
export const MESSAGE_MAX = 300

const EMAIL_LIKE = /[^\s@]+@[^\s@]+\.[^\s@]+/
// 9 or more digits in a row, allowing spaces, dots, dashes and parentheses (phone and card numbers)
const LONG_NUMBER = /\d[\d\s().-]{7,}\d/

// Body for POST /api/ai/recommend-service. Only "message" is ever copied into `value`.
export function validateRecommendRequest(body) {
  const errors = []
  const value = {}

  const raw = body?.message
  if (typeof raw !== 'string') {
    errors.push({ field: 'message', message: 'Tell us what you are looking for' })
    return { errors, value }
  }

  // Control characters removed, line breaks and runs of spaces turned into single spaces
  const message = raw
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (message.length < MESSAGE_MIN) {
    errors.push({ field: 'message', message: `Please write at least ${MESSAGE_MIN} characters` })
  } else if (message.length > MESSAGE_MAX) {
    errors.push({ field: 'message', message: `Please keep it to ${MESSAGE_MAX} characters or fewer` })
  } else if (EMAIL_LIKE.test(message) || LONG_NUMBER.test(message)) {
    errors.push({
      field: 'message',
      message: "Please don't include personal details such as email addresses or phone numbers",
    })
  } else {
    value.message = message
  }

  return { errors, value }
}
