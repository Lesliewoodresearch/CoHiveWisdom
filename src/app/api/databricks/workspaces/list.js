/**
 * Workspaces List API
 * Returns all available Databricks workspaces for CoHiveSolutions.com users
 */

import { getAllWorkspaces } from '../../clients.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Return all workspaces that have a configured workspaceHost
  const workspaces = getAllWorkspaces();

  return res.status(200).json({ workspaces });
}