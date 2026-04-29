/**
 * Model Registry (JavaScript version for API serverless functions)
 *
 * Single source of truth for all available Databricks-served models.
 * Add new models here — nothing else needs to change.
 *
 * Each entry maps to a Databricks Model Serving endpoint:
 *   https://{workspace}/serving-endpoints/{id}/invocations
 *
 * Location: api/models/registry.js
 */

export const MODEL_REGISTRY = [

  // ── Premium / Flagship ──────────────────────────────────────────────────

  {
    id: 'databricks-claude-sonnet-4-6',
    name: 'Claude Sonnet 4.6',
    provider: 'Anthropic',
    tier: 'premium',
    description: 'Advanced hybrid reasoning — best for persona voice work',
    supportsTools: true,
    recommended: true,
  },
  {
    id: 'databricks-gpt-5-2',
    name: 'GPT-5.2',
    provider: 'OpenAI',
    tier: 'premium',
    description: 'Highest accuracy, structured extraction, multi-step workflows',
    supportsTools: true,
  },
  {
    id: 'databricks-gpt-5-1',
    name: 'GPT-5.1',
    provider: 'OpenAI',
    tier: 'premium',
    description: 'General purpose, auto-adjusts reasoning depth, content creation',
    supportsTools: true,
  },
  {
    id: 'databricks-gpt-5',
    name: 'GPT-5',
    provider: 'OpenAI',
    tier: 'premium',
    description: 'Flagship reasoning, coding, and agentic tasks',
    supportsTools: true,
  },
  {
    id: 'databricks-gemini-3-1-pro',
    name: 'Gemini 3.1 Pro',
    provider: 'Google',
    tier: 'premium',
    description: 'Deep analysis, document intelligence, 1M token context',
    contextWindow: 1_000_000,
    supportsTools: true,
  },
  {
    id: 'databricks-gemini-2-5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    tier: 'premium',
    description: 'Enterprise research, Deep Think Mode, 1M token context',
    contextWindow: 1_000_000,
    supportsTools: true,
  },

  // ── Balanced ─────────────────────────────────────────────────────────────

  {
    id: 'databricks-gpt-5-mini',
    name: 'GPT-5 mini',
    provider: 'OpenAI',
    tier: 'balanced',
    description: 'Cost-optimized reasoning and chat, reliable output',
    supportsTools: true,
  },
  {
    id: 'databricks-gemini-3-flash',
    name: 'Gemini 3 Flash',
    provider: 'Google',
    tier: 'balanced',
    description: 'Fast multimodal, production-scale deployments',
    supportsTools: true,
  },
  {
    id: 'databricks-gemini-2-5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    tier: 'balanced',
    description: 'Real-time apps, hybrid reasoning, 1M token context',
    contextWindow: 1_000_000,
    supportsTools: true,
  },
  {
    id: 'databricks-meta-llama-3-3-70b-instruct',
    name: 'Llama 3.3 70B',
    provider: 'Meta',
    tier: 'balanced',
    description: 'Open model, multilingual dialogue, 128K context',
    contextWindow: 128_000,
    supportsTools: false,
  },
  {
    id: 'databricks-qwen3-next-80b-a3b-instruct',
    name: 'Qwen3-Next 80B',
    provider: 'Alibaba',
    tier: 'balanced',
    description: 'Ultra-long context, high throughput, enterprise',
    supportsTools: false,
  },

  // ── Economy / Fast ───────────────────────────────────────────────────────

  {
    id: 'databricks-claude-haiku-4-5',
    name: 'Claude Haiku 4.5',
    provider: 'Anthropic',
    tier: 'economy',
    description: 'Fastest and most cost-effective, real-time low-latency use',
    supportsTools: true,
  },
  {
    id: 'databricks-gpt-5-nano',
    name: 'GPT-5 nano',
    provider: 'OpenAI',
    tier: 'economy',
    description: 'High-throughput, simple classification, lowest cost',
    supportsTools: false,
  },

];

// ── Lookup helpers ───────────────────────────────────────────────────────────

/** The default model used when no explicit selection is made */
/**export const DEFAULT_MODEL_ID = 'databricks-claude-sonnet-4-6'; */
export const DEFAULT_MODEL_ID = 'databricks-claude-haiku-4-5'; 

/** The default economy model used for lightweight tasks */
export const DEFAULT_ECONOMY_MODEL_ID = 'databricks-claude-haiku-4-5';

/** Returns the metadata for a model ID, or undefined if not in the registry */
export function getModelMeta(id) {
  return MODEL_REGISTRY.find(m => m.id === id);
}

/** Returns all models filtered by tier */
export function getModelsByTier(tier) {
  return MODEL_REGISTRY.filter(m => m.tier === tier);
}

/** Returns all models from a specific provider */
export function getModelsByProvider(provider) {
  return MODEL_REGISTRY.filter(m => m.provider === provider);
}

/** Returns only models that support tool/function calling */
export function getToolCapableModels() {
  return MODEL_REGISTRY.filter(m => m.supportsTools);
}

/** Validates that a model ID exists in the registry */
export function isValidModelId(id) {
  return MODEL_REGISTRY.some(m => m.id === id);
}
