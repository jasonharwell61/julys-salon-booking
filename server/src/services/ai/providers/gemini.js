import { GoogleGenAI } from '@google/genai'
import { env } from '../../../config/env.js'
import { AiProviderError } from '../AiProviderError.js'

let client

function getClient() {
  if (!client) client = new GoogleGenAI({ apiKey: env.aiApiKey })
  return client
}

// Turns anything the SDK throws into a short, safe code
export function mapProviderError(err) {
  if (err instanceof AiProviderError) return err
  if (err?.name === 'TimeoutError' || err?.name === 'AbortError') return new AiProviderError('timeout')
  if (err?.status === 429) return new AiProviderError('rate_limited')
  if (err?.status === 400 || err?.status === 401 || err?.status === 403) return new AiProviderError('auth')
  return new AiProviderError('unavailable')
}

// THE provider interface: every provider file exports generateJson with this exact shape.
// Input:  { systemInstruction, userContent, schema, maxOutputTokens }
// Output: { text, usage? }  where text is the model's JSON as a string
export async function generateJson({ systemInstruction, userContent, schema, maxOutputTokens = 1024 }) {
  if (!env.aiApiKey || !env.aiModel) throw new AiProviderError('not_configured')

  try {
    const response = await getClient().models.generateContent({
      model: env.aiModel,
      contents: userContent,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseJsonSchema: schema,
        maxOutputTokens,
        temperature: 0.2,
        abortSignal: AbortSignal.timeout(env.aiTimeoutMs),
      },
    })

    // No text means the answer was blocked or cut off
    const text = response.text
    if (!text) throw new AiProviderError('blocked')

    const meta = response.usageMetadata
    const usage = meta
      ? { inputTokens: meta.promptTokenCount, outputTokens: meta.candidatesTokenCount }
      : undefined
    return { text, usage }
  } catch (err) {
    throw mapProviderError(err)
  }
}
