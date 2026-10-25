// One error type for everything that goes wrong when talking to the API.
export class ApiError extends Error {
  constructor(message, { status = 0, details = [], isNetworkError = false } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status // HTTP status, or 0 when the server was never reached
    this.details = details // [{ field, message }] from the server's validation errors
    this.isNetworkError = isNetworkError
  }

  // Turns details into { fieldName: message } so forms can show errors per field
  get fieldErrors() {
    const result = {}
    for (const item of this.details) {
      if (item && item.field && !result[item.field]) {
        result[item.field] = item.message
      }
    }
    return result
  }
}