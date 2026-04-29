import { getClientByDomain, isAllowedDomain } from '../clients.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  if (!isAllowedDomain(email)) {
    return res.status(403).json({ 
      error: 'Your email domain is not authorized to use CoHive. Please contact support.' 
    });
  }

  const client = getClientByDomain(email);

  if (!client.workspaceHost) {
    return res.status(503).json({ 
      error: `${client.clientName} workspace is not yet configured. Please contact CoHive support.` 
    });
  }

  return res.status(200).json({ 
    workspaceHost: client.workspaceHost,
    clientName: client.clientName,
    schema: client.schema,
  });
}
