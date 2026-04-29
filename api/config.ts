/**
 * API Config
 *
 * Single source of truth for server-side environment variables.
 * Replaces api/utils/validateEnv.js — import from here instead.
 *
 * Every API route that needs Databricks credentials should call
 * getDatabricksConfig() at the top of its handler. It validates
 * all required vars and throws a clear error if any are missing.
 *
 * Required env vars per deployment (set in Vercel project settings):
 *   DATABRICKS_HOST          e.g. adb-1234567890.azuredatabricks.net
 *   DATABRICKS_TOKEN         Personal access token or service principal token
 *   DATABRICKS_WAREHOUSE_ID  SQL warehouse ID for metadata queries
 *   CLIENT_NAME              Display name e.g. "Nike" (used in logs)
 *
 * Optional:
 *   CLIENT_SCHEMA            Databricks schema name (defaults to 'cohive')
 *   DATABRICKS_CLIENT_ID     OAuth client ID (required for OAuth flow only)
 *   DATABRICKS_CLIENT_SECRET OAuth client secret (required for OAuth flow only)
 *   DATABRICKS_REDIRECT_URI  OAuth redirect URI (required for OAuth flow only)
 */

export interface DatabricksConfig {
  workspaceHost: string;
  accessToken: string;
  warehouseId: string;
  clientName: string;
  schema: string;
}

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

const REQUIRED_VARS = [
  'DATABRICKS_HOST',
  'DATABRICKS_TOKEN',
  'DATABRICKS_WAREHOUSE_ID',
  'CLIENT_NAME',
] as const;

const REQUIRED_OAUTH_VARS = [
  'DATABRICKS_CLIENT_ID',
  'DATABRICKS_CLIENT_SECRET',
] as const;

/**
 * Validates that all required environment variables are present.
 * Throws a descriptive error listing any that are missing.
 * Called automatically by getDatabricksConfig() — rarely needed directly.
 */
export function validateEnv(): void {
  const missing = REQUIRED_VARS.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
      `Check your Vercel environment configuration for this client deployment.`
    );
  }
}

/**
 * Returns Databricks connection config read from environment variables.
 * Always use this instead of reading process.env directly in API handlers.
 */
export function getDatabricksConfig(): DatabricksConfig {
  validateEnv();
  return {
    workspaceHost: process.env.DATABRICKS_HOST!,
    accessToken:   process.env.DATABRICKS_TOKEN!,
    warehouseId:   process.env.DATABRICKS_WAREHOUSE_ID!,
    clientName:    process.env.CLIENT_NAME!,
    schema:        process.env.CLIENT_SCHEMA ?? 'cohive',
  };
}

/**
 * Returns OAuth credentials for the Databricks token-exchange route.
 * Only needed in api/databricks/auth.js — all other routes use getDatabricksConfig().
 */
export function getOAuthConfig(): OAuthConfig {
  const missing = REQUIRED_OAUTH_VARS.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing OAuth environment variables: ${missing.join(', ')}.`
    );
  }
  return {
    clientId:     process.env.DATABRICKS_CLIENT_ID!,
    clientSecret: process.env.DATABRICKS_CLIENT_SECRET!,
    redirectUri:  process.env.DATABRICKS_REDIRECT_URI ?? '',
  };
}