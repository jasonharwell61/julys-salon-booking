// The ONLY error type the AI provider code throws.
// It carries a short code, never the provider's raw message (which could contain details we must not expose).
// Codes: not_configured, timeout, rate_limited, auth, unavailable, blocked, invalid_output
export class AiProviderError extends Error {
  constructor(code) {
    super(`AI provider error: ${code}`)
    this.name = 'AiProviderError'
    this.code = code
  }
}
