// True only for a real JSON object (not null, not an array)
export function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

// A MongoDB ID is exactly 24 hex characters.
// (Mongoose's own checker also accepts any 12-character string, which is too loose.)
export function isValidObjectId(value) {
  return typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value)
}

// Returns the trimmed text, or undefined if the value is not a string
export function cleanString(value) {
  return typeof value === 'string' ? value.trim() : undefined
}