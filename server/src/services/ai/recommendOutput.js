import { AiProviderError } from './AiProviderError.js'

export const MAX_RECOMMENDATIONS = 3
const MAX_REASON = 200
const MAX_SUMMARY = 300

export const DEFAULT_SUMMARY = 'Based on what you described, these services may fit.'
export const NO_MATCH_SUMMARY = "We couldn't find a close match for that. Browse all services to see the full menu."

// Claims we never want shown: prices, guarantees, medical or safety promises, booking confirmations
const UNSUPPORTED_CLAIM =
  /\$\s?\d|\b\d+\s?(usd|dollars?)\b|guarantee|hypoallergenic|\b(safe|safest)\s+for\b|medical|\bcure[sd]?\b|diagnos|treat(s|ed|ment)?\s+(for|of)\b|\bbooked\b|\bconfirmed\b|\bdiscount|\bavailable\b/i

function cut(text, max) {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text
}

// Checks the model's answer. Never trusts it:
// bad JSON or wrong shape -> error (the caller falls back); unknown or repeated IDs -> dropped;
// unsupported claims -> replaced with the service's own description.
export function parseRecommendOutput(rawText, services) {
  let data
  try {
    data = JSON.parse(rawText)
  } catch {
    throw new AiProviderError('invalid_output')
  }
  if (!data || typeof data !== 'object' || typeof data.summary !== 'string' || !Array.isArray(data.recommendations)) {
    throw new AiProviderError('invalid_output')
  }

  const byId = new Map(services.map((service) => [String(service._id), service]))
  const seen = new Set()
  const recommendations = []

  for (const item of data.recommendations) {
    if (recommendations.length >= MAX_RECOMMENDATIONS) break
    if (!item || typeof item !== 'object' || typeof item.serviceId !== 'string') continue
    const service = byId.get(item.serviceId)
    if (!service || seen.has(item.serviceId)) continue // invented or repeated ID
    seen.add(item.serviceId)

    let reason = typeof item.reason === 'string' ? item.reason.trim() : ''
    if (!reason || UNSUPPORTED_CLAIM.test(reason)) reason = service.description
    recommendations.push({ serviceId: item.serviceId, reason: cut(reason, MAX_REASON) })
  }

  let summary = data.summary.trim()
  if (!summary || UNSUPPORTED_CLAIM.test(summary)) {
    summary = recommendations.length > 0 ? DEFAULT_SUMMARY : NO_MATCH_SUMMARY
  } else if (recommendations.length === 0) {
    // The model named nothing valid, so don't let its summary promise matches
    summary = NO_MATCH_SUMMARY
  }

  return { summary: cut(summary, MAX_SUMMARY), recommendations }
}
