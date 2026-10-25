// Safe operational logging for AI requests.
// Only the fields on this list are ever written, so a prompt, a customer's message,
// a name, an email or an API key cannot end up in the logs by accident.
const SAFE_FIELDS = ['feature', 'source', 'outcome', 'errorCode', 'latencyMs', 'resultCount', 'inputTokens', 'outputTokens']

export function logAiEvent(fields) {
  const entry = {}
  for (const key of SAFE_FIELDS) {
    if (fields[key] !== undefined) entry[key] = fields[key]
  }
  console.log(JSON.stringify({ event: 'ai_request', time: new Date().toISOString(), ...entry }))
}
