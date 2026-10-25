import { env } from '../../../config/env.js'
import { AiProviderError } from '../AiProviderError.js'
import * as gemini from './gemini.js'

// To add another provider: create providers/<name>.js exporting generateJson, then list it here.
const providers = { gemini }

export function getProvider() {
  const provider = providers[env.aiProvider]
  if (!provider) throw new AiProviderError('not_configured')
  return provider
}
