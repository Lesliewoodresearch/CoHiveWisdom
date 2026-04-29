/**
 * Model Factory (JavaScript version for API serverless functions)
 *
 * Central registry and factory for model instances.
 * Call getModel() anywhere you need to run an inference.
 *
 * Server-side usage (API routes):
 *   import { getModel } from './factory.js';
 *   const model = getModel('databricks-claude-sonnet-4-6', config);
 *   const result = await model.invoke({ prompt, systemPrompt });
 *
 * The modelId always comes from MODEL_REGISTRY — if it's in there,
 * it will work. No new adapter files needed for new models.
 *
 * Location: api/models/factory.js
 */

import { DatabricksModel } from './databricks_model.js';
import { isValidModelId, DEFAULT_MODEL_ID } from './registry.js';

/**
 * Returns a ready-to-use model adapter for the given ID.
 *
 * @param {string} modelId  - A valid ModelId from the registry, or any string
 *                            (falls back to DEFAULT_MODEL_ID with a console warning)
 * @param {object} config   - Databricks workspace credentials
 * @param {string} config.workspaceHost - Databricks workspace host
 * @param {string} config.accessToken - Databricks access token
 */
export function getModel(modelId, config) {
  if (!isValidModelId(modelId)) {
    console.warn(
      `[models/factory] Unknown modelId "${modelId}" — falling back to ${DEFAULT_MODEL_ID}. ` +
      `Add it to api/models/registry.js to suppress this warning.`
    );
    return new DatabricksModel(DEFAULT_MODEL_ID, config);
  }

  // All Databricks models use the same adapter.
  // If a non-Databricks backend is ever needed, add a branch here.
  return new DatabricksModel(modelId, config);
}

/**
 * Convenience: build config from environment variables (server-side only).
 * Mirrors the pattern in api/utils/validateEnv.js.
 */
export function getModelFromEnv(modelId) {
  const workspaceHost = process.env.DATABRICKS_HOST;
  const accessToken = process.env.DATABRICKS_TOKEN;

  if (!workspaceHost || !accessToken) {
    throw new Error(
      'Missing DATABRICKS_HOST or DATABRICKS_TOKEN environment variables.'
    );
  }

  return getModel(modelId, { workspaceHost, accessToken });
}
