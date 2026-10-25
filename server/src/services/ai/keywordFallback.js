import { DEFAULT_SUMMARY, MAX_RECOMMENDATIONS, NO_MATCH_SUMMARY } from './recommendOutput.js'

// The non-AI path: used when the provider is unavailable, slow, rate limited or returns something unusable.
// It is plain keyword matching over the same services, so the feature still helps.
const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'want', 'like', 'something', 'look', 'looking', 'need', 'would',
  'please', 'that', 'this', 'have', 'some', 'get', 'can', 'you', 'what', 'about', 'but', 'not', 'are', 'was', 'too',
])

// Everyday words customers use -> words that appear in the service menu
const SYNONYMS = {
  natural: ['classic', 'natural'], subtle: ['classic', 'natural'], everyday: ['classic', 'natural'], simple: ['classic'],
  dramatic: ['volume'], fluffy: ['volume'], bold: ['volume'], thick: ['volume'], glam: ['volume'],
  refill: ['fill'], touchup: ['fill'], maintenance: ['fill'], infill: ['fill'],
  curl: ['lift'], curled: ['lift'], tint: ['lift'], tinted: ['lift'], mascara: ['lift'],
  remove: ['removal'], removing: ['removal'], off: ['removal'],
}

function tokenize(message) {
  const words = message.toLowerCase().match(/[a-z]{3,}/g) || []
  const expanded = []
  for (const word of words) {
    if (STOP_WORDS.has(word)) continue
    expanded.push(word, ...(SYNONYMS[word] || []))
  }
  return [...new Set(expanded)]
}

function score(service, tokens) {
  const name = service.name.toLowerCase()
  const category = service.category.replace('-', ' ')
  const description = (service.description || '').toLowerCase()
  const tags = (service.tags || []).join(' ').toLowerCase()
  let total = 0
  for (const token of tokens) {
    if (name.includes(token)) total += 3
    if (category.includes(token)) total += 2
    if (tags.includes(token)) total += 2
    if (description.includes(token)) total += 1
  }
  return total
}

function firstSentence(text) {
  const match = (text || '').match(/^.*?[.!?](\s|$)/)
  return (match ? match[0] : text || '').trim()
}

export function keywordRecommend(message, services) {
  const tokens = tokenize(message)
  const ranked = services
    .map((service) => ({ service, points: score(service, tokens) }))
    .filter((entry) => entry.points > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, MAX_RECOMMENDATIONS)

  const recommendations = ranked.map(({ service }) => ({
    serviceId: String(service._id),
    reason: firstSentence(service.description),
  }))

  return {
    summary: recommendations.length > 0 ? DEFAULT_SUMMARY : NO_MATCH_SUMMARY,
    recommendations,
  }
}
