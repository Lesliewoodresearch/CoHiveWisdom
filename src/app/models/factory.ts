/**
 * Model Factory
 *
 * Central registry and factory for model instances.
 * Call getModel() anywhere you need to run an inference.
 *
 * Server-side usage (API routes):
 *   import { getModel } from '../src/models/factory';
 *   const model = getModel('databricks-claude-sonnet-4-6', config);
 *   const result = await model.invoke({ prompt, systemPrompt });
 *
 * The modelId always comes from MODEL_REGISTRY — if it's in there,
 * it will work. No new adapter files needed for new models.
 */

import { DatabricksModel, type DatabricksModelConfig } from './databricks_model.js';
import type { IModel } from './base.js';
import { isValidModelId, DEFAULT_MODEL_ID, type ModelId } from './registry.js';

/**
 * Returns a ready-to-use model adapter for the given ID.
 *
 * @param modelId  - A valid ModelId from the registry, or any string
 *                   (falls back to DEFAULT_MODEL_ID with a console warning)
 * @param config   - Databricks workspace credentials
 */
export function getModel(modelId: string, config: DatabricksModelConfig): IModel {
  if (!isValidModelId(modelId)) {
    console.warn(
      `[models/factory] Unknown modelId "${modelId}" — falling back to ${DEFAULT_MODEL_ID}. ` +
      `Add it to src/models/registry.ts to suppress this warning.`
    );
    return new DatabricksModel(DEFAULT_MODEL_ID, config);
  }

  // All Databricks models use the same adapter.
  // If a non-Databricks backend is ever needed, add a branch here.
  return new DatabricksModel(modelId as ModelId, config);
}

/**
 * Convenience: build config from environment variables (server-side only).
 * Mirrors the pattern in api/utils/validateEnv.js.
 */
export function getModelFromEnv(modelId: string): IModel {
  const workspaceHost = process.env.DATABRICKS_HOST;
  const accessToken = process.env.DATABRICKS_TOKEN;

  if (!workspaceHost || !accessToken) {
    throw new Error(
      'Missing DATABRICKS_HOST or DATABRICKS_TOKEN environment variables.'
    );
  }

  return getModel(modelId, { workspaceHost, accessToken });
}

export type { IModel, ModelId };