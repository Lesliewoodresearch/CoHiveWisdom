/**
 * models/
 *
 * Re-exports the full public surface of the models layer.
 * Import from here, not from individual files.
 *
 *   import { getModel, MODEL_REGISTRY, DEFAULT_MODEL_ID } from './';
 */

export { getModel, getModelFromEnv } from './factory.js';
export { MODEL_REGISTRY, DEFAULT_MODEL_ID, DEFAULT_ECONOMY_MODEL_ID } from './registry.js';
export { getModelMeta, getModelsByTier, getModelsByProvider, getToolCapableModels, isValidModelId } from './registry.js';
export type { ModelId, ModelMeta, ModelTier } from './registry';
export type { IModel, ModelInvokeParams, ModelInvokeResult, Message, Tool } from './base';