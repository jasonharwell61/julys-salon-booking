import Service from '../../models/Service.js'
import { AiProviderError } from './AiProviderError.js'
import { logAiEvent } from './aiLogger.js'
import { keywordRecommend } from './keywordFallback.js'
import { parseRecommendOutput } from './recommendOutput.js'
import { buildUserContent, OUTPUT_SCHEMA, SYSTEM_INSTRUCTION } from './recommendPrompt.js'
import { getProvider } from './providers/index.js'

export const DISCLAIMER = 'Recommendations are informational. Review service details before booking.'

// Only the fields the model needs. Loaded fresh each time so the answer always matches the real menu.
function loadActiveServices() {
  return Service.find({ isActive: true })
    .select('name category description durationMinutes priceCents tags')
    .sort({ name: 1 })
    .lean()
}

// What the browser receives for each service. Facts come from MongoDB, never from the model.
function toPublicService(service) {
  return {
    _id: String(service._id),
    name: service.name,
    category: service.category,
    priceCents: service.priceCents,
    durationMinutes: service.durationMinutes,
  }
}

// message must already be validated (see validators/aiValidators.js).
// `deps` lets tests swap the database and the provider. The real app passes nothing.
// This function never throws because of the AI provider: any provider problem becomes the keyword fallback.
export async function recommendServices(message, deps = {}) {
  const { loadServices = loadActiveServices, getProviderFn = getProvider } = deps
  const started = Date.now()

  const services = await loadServices()
  const byId = new Map(services.map((service) => [String(service._id), service]))

  let source = 'ai'
  let errorCode
  let usage
  let result

  try {
    const provider = getProviderFn()
    const { text, usage: used } = await provider.generateJson({
      systemInstruction: SYSTEM_INSTRUCTION,
      userContent: buildUserContent(message, services),
      schema: OUTPUT_SCHEMA,
    })
    usage = used
    result = parseRecommendOutput(text, services)
  } catch (err) {
    source = 'fallback'
    errorCode = err instanceof AiProviderError ? err.code : 'unexpected'
    result = keywordRecommend(message, services)
  }

  const recommendations = result.recommendations.map((item) => ({
    serviceId: item.serviceId,
    reason: item.reason,
    service: toPublicService(byId.get(item.serviceId)),
  }))

  logAiEvent({
    feature: 'recommend-service',
    source,
    outcome: recommendations.length > 0 ? 'matches' : 'no_match',
    errorCode,
    latencyMs: Date.now() - started,
    resultCount: recommendations.length,
    inputTokens: usage?.inputTokens,
    outputTokens: usage?.outputTokens,
  })

  return { summary: result.summary, recommendations, disclaimer: DISCLAIMER, source }
}
