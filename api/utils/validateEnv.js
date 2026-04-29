/**
 * Environment Variable Validator
 *
 * Call at the top of every API handler to catch missing config early.
 * Each client deployment sets these in their Vercel environment settings.
 *
 * Required env vars per deployment:
 *   DATABRICKS_HOST        — e.g. adb-1234567890.azuredatabricks.net
 *   DATABRICKS_TOKEN       — Personal access token or service principal token
 *   DATABRICKS_WAREHOUSE_ID — SQL warehouse ID for metadata queries
 *   CLIENT_NAME            — Display name e.g. "Nike" (used in logs)
 *   CLIENT_SCHEMA          — Databricks schema name e.g. "cohive" (optional, defaults to 'cohive')
 *
 * Location: api/utils/validateEnv.js
 */

const REQUIRED = [
  'DATABRICKS_HOST',
  'DATABRICKS_TOKEN',
  'DATABRICKS_WAREHOUSE_ID',
  'CLIENT_NAME',
];

/**
 * Validates all required environment variables are set.
 * Throws a clear error message listing any that are missing.
 * Call this at the top of every API handler.
 */
export function validateEnv() {
  const missing = REQUIRED.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
      `Check your Vercel environment configuration for this client deployment.`
    );
  }
}

/**
 * Returns the Databricks connection config from environment variables.
 * Always use this instead of reading process.env directly in API files.
 */
export function getDatabricksConfig() {
  validateEnv();
  return {
    workspaceHost: process.env.DATABRICKS_HOST,
    accessToken: process.env.DATABRICKS_TOKEN,
    warehouseId: process.env.DATABRICKS_WAREHOUSE_ID,
    clientName: process.env.CLIENT_NAME,
    schema: process.env.CLIENT_SCHEMA || 'cohive',
  };
}
