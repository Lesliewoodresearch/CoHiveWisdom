/**
 * Client Registry - clients.js
 * Maps email domains to Databricks workspace config.
 * To add a new client, add one entry here and set their
 * env variables in Vercel. No other code changes needed.
 */

const CLIENT_REGISTRY = {
  'cohivesolutions.com': {
    workspaceHost: 'dbc-20f2b541-e6cd.cloud.databricks.com',
    schema: 'cohive',
    clientName: 'CoHive',
  },
  'cohive.com': {
    workspaceHost: 'dbc-20f2b541-e6cd.cloud.databricks.com',
    schema: 'cohive',
    clientName: 'CoHive',
    internalAlias: true,  // alias for cohivesolutions.com — never shown as a separate workspace
  },
  'bostonbeer.com': {
    workspaceHost: null, // add when ready
    schema: 'bostonbeer',
    clientName: 'Boston Beer',
  },
};

export function getClientByDomain(email) {
  if (!email || !email.includes('@')) return null;
  const domain = email.split('@')[1]?.toLowerCase().trim();
  return CLIENT_REGISTRY[domain] || null;
}

export function isAllowedDomain(email) {
  const client = getClientByDomain(email);
  return client !== null;
}

export function getAllWorkspaces() {
  const seen = new Set();
  return Object.entries(CLIENT_REGISTRY)
    .filter(([domain, config]) =>
      config.workspaceHost !== null &&
      !config.internalAlias &&
      !seen.has(config.workspaceHost) &&
      seen.add(config.workspaceHost)
    )
    .map(([domain, config]) => ({
      domain,
      workspaceHost: config.workspaceHost,
      schema: config.schema,
      clientName: config.clientName,
    }));
}