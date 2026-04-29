/**
 * Databricks AI Prompt Execution API
 *
 * Executes prompts using the model factory.
 * To add a new model: add it to src/models/registry.ts — nothing here changes.
 *
 * Location: api/databricks/ai/prompt.js
 */

import { getDatabricksConfig } from '../../utils/validateEnv.js';
import { getModel } from '../../models/factory.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { workspaceHost, accessToken, warehouseId, schema } = getDatabricksConfig();

    const {
      prompt,
      systemPrompt,
      modelEndpoint = 'databricks-claude-sonnet-4-6',
      maxTokens = 1000,
      temperature = 0.7,
      topP = 0.9,
      conversationHistory = [],
      includeKnowledgeBase = false,
      knowledgeBaseQuery,
      userEmail,
      userRole,
    } = req.body;

    if (!prompt || !userEmail) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['prompt', 'userEmail'],
      });
    }

    console.log(`[AI Prompt] User: ${userEmail} (${userRole})`);
    console.log(`[AI Prompt] Model: ${modelEndpoint}`);
    console.log(`[AI Prompt] Prompt: ${prompt.substring(0, 100)}...`);

    let contextualPrompt = prompt;

    // Step 1: Optionally retrieve relevant Knowledge Base context
    if (includeKnowledgeBase && knowledgeBaseQuery) {
      console.log(`[AI Prompt] Fetching Knowledge Base context for: ${knowledgeBaseQuery}`);

      const kbSearchSQL = `
        SELECT file_name, content_summary
        FROM knowledge_base.${schema}.file_metadata
        WHERE is_approved = TRUE
          AND (
            file_name LIKE '%${knowledgeBaseQuery.replace(/'/g, "''")}%'
            OR content_summary LIKE '%${knowledgeBaseQuery.replace(/'/g, "''")}%'
            OR ARRAY_CONTAINS(tags, '${knowledgeBaseQuery.replace(/'/g, "''")}')
          )
        ORDER BY citation_count DESC
        LIMIT 5
      `;

      const kbResponse = await fetch(
        `https://${workspaceHost}/api/2.0/sql/statements`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ warehouse_id: warehouseId, statement: kbSearchSQL, wait_timeout: '30s' }),
        }
      );

      if (kbResponse.ok) {
        const kbResult = await kbResponse.json();
        const rows = kbResult.result?.data_array || [];
        if (rows.length > 0) {
          const contextText = rows
            .map(row => `Document: ${row[0]}\nSummary: ${row[1]}`)
            .join('\n\n');
          contextualPrompt = `Context from Knowledge Base:\n${contextText}\n\nUser Query: ${prompt}`;
          console.log(`[AI Prompt] Added context from ${rows.length} Knowledge Base files`);
        }
      }
    }

    // Step 2: Invoke model via factory
    console.log(`[AI Prompt] Calling: ${modelEndpoint}`);

    const model = getModel(modelEndpoint, { workspaceHost, accessToken });
    const result = await model.invoke({
      prompt: contextualPrompt,
      systemPrompt,
      conversationHistory,
      maxTokens,
      temperature,
      topP,
    });

    console.log(`[AI Prompt] SUCCESS — ${result.content.length} chars`);

    return res.status(200).json({
      success: true,
      response: result.content,
      model: result.modelId,
      usage: result.usage,
      metadata: {
        kbContextUsed: includeKnowledgeBase,
        conversationLength: conversationHistory.length,
      },
    });

  } catch (error) {
    console.error('[AI Prompt] Error:', error);
    return res.status(500).json({ error: 'Prompt execution failed', message: error.message });
  }
}
