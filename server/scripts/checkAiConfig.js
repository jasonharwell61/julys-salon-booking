import { GoogleGenAI } from '@google/genai'
import { env } from '../src/config/env.js'

// Checks the AI settings and makes ONE tiny request to Gemini.
// It prints whether each setting is present, but never the API key itself.
function isPlaceholder(value) {
  return !value || String(value).startsWith('replace-with') || value === 'provider-name' || value === 'model-name'
}

const settings = { AI_PROVIDER: env.aiProvider, AI_MODEL: env.aiModel, AI_API_KEY: env.aiApiKey }
let settingsOk = true
for (const [name, value] of Object.entries(settings)) {
  const ok = !isPlaceholder(value)
  if (!ok) settingsOk = false
  // Provider and model names are not secret, so they are shown. The key never is.
  const shown = name === 'AI_API_KEY' ? '' : ` (${value})`
  console.log(`${name}: ${ok ? 'set' : 'MISSING or still a placeholder'}${ok ? shown : ''}`)
}
console.log(`AI_TIMEOUT_MS: ${env.aiTimeoutMs}`)
console.log(`AI_RATE_LIMIT_MAX: ${env.aiRateLimitMax}`)

if (!settingsOk) {
  console.error('Fix the settings above in server/.env, then run this check again.')
  process.exit(1)
}
if (env.aiProvider !== 'gemini') {
  console.error('This check only knows the "gemini" provider.')
  process.exit(1)
}

const ai = new GoogleGenAI({ apiKey: env.aiApiKey })
const started = Date.now()

try {
  const response = await ai.models.generateContent({
    model: env.aiModel,
    contents: 'Reply with the single word OK.',
    config: {
      maxOutputTokens: 100,
      temperature: 0,
      abortSignal: AbortSignal.timeout(env.aiTimeoutMs),
    },
  })
  const text = String(response.text ?? '').trim().slice(0, 40) || '(no text)'
  console.log(`Gemini answered in ${Date.now() - started} ms: ${text}`)
  console.log('AI configuration check passed')
} catch (err) {
  // Print a safe summary only. Never print the key or the raw provider message.
  let hint = 'Could not reach Gemini. Check your internet connection.'
  if (err.name === 'TimeoutError' || err.name === 'AbortError') {
    hint = `No answer within ${env.aiTimeoutMs} ms.`
  } else if (err.status === 400 || err.status === 401 || err.status === 403) {
    hint = 'Gemini rejected the request. Check that AI_API_KEY is a valid Gemini key.'
  } else if (err.status === 404) {
    hint = 'Model not found. Check the AI_MODEL name.'
  } else if (err.status === 429) {
    hint = 'Rate limit or quota reached. Wait a minute and try again.'
  } else if (err.status >= 500) {
    hint = 'Gemini is having problems. Try again later.'
  }
  const status = typeof err.status === 'number' ? ` (HTTP ${err.status})` : ''
  console.error(`AI configuration check failed: ${err.name}${status}. ${hint}`)
  process.exitCode = 1
}
