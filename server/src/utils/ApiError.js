// An error we throw ON PURPOSE, with an HTTP status the client should see
export default class ApiError extends Error {
  constructor(status, message, details) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details // optional list like [{ field, message }]
  }
}