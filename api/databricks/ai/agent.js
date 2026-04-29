/**
 * Databricks AI Agent API
 *
 * Executes AI agents with function calling capabilities.
 * All Databricks credentials read from environment variables.
 *
 * Location: api/databricks/ai/agent.js
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
      task,
      systemPrompt = 'you are an ai agent that responds as a marketing luminary as if you were alive today and aware of modern culture and brands',
      modelEndpoint = 'databricks-claude-sonnet-4-6',
      maxIterations = 5,
      enableKnowledgeBase = true,
      enableSQLQuery = true,
      enableWebSearch = false,
      brand,
      category,
      userEmail,
      userRole,
    } = req.body;

    if (!task || !userEmail) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['task', 'userEmail'],
      });
    }

    console.log(`[AI Agent] User: ${userEmail} (${userRole})`);
    console.log(`[AI Agent] Task: ${task}`);
    console.log(`[AI Agent] Model: ${modelEndpoint}`);
    console.log(`[AI Agent] Tools: Knowledge Base=${enableKnowledgeBase}, SQL=${enableSQLQuery}, Web=${enableWebSearch}`);

    const modelConfig = { workspaceHost, accessToken };

    // Define tools
    const tools = [];

    if (enableKnowledgeBase) {
      tools.push({
        type: 'function',
        function: {
          name: 'search_knowledge_base',
          description: 'Search the Knowledge Base for relevant documents about brands, categories, and consumer insights',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query or keywords' },
              brand: { type: 'string', description: 'Filter by brand name (optional)' },
              category: { type: 'string', description: 'Filter by category (optional)' },
              limit: { type: 'integer', description: 'Maximum number of results (default: 5)' },
            },
            required: ['query'],
          },
        },
      });
    }

    if (enableSQLQuery) {
      tools.push({
        type: 'function',
        function: {
          name: 'execute_sql',
          description: 'Execute a SQL SELECT query against the Knowledge Base metadata table.',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'SQL SELECT query to execute' },
            },
            required: ['query'],
          },
        },
      });
    }

    // Agent loop
    const conversationHistory = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: task },
    ];

    const model = getModel(modelEndpoint, modelConfig);
    let iterations = 0;
    let finalResponse = null;

    while (iterations < maxIterations && !finalResponse) {
      iterations++;
      console.log(`[AI Agent] Iteration ${iterations}/${maxIterations}`);

      // Pull system message out; pass the rest as conversationHistory
      const [systemMsg, ...history] = conversationHistory;
      const result = await model.invoke({
        prompt: history[history.length - 1].content,
        systemPrompt: systemMsg.content,
        conversationHistory: history.slice(0, -1),
        maxTokens: 2000,
        temperature: 0.7,
        tools,
      });

      const assistantMessage = {
        role: 'assistant',
        content: result.content,
        ...(result.toolCalls ? { tool_calls: result.toolCalls.map(tc => ({
          id: tc.id,
          type: 'function',
          function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
        })) } : {}),
      };

      conversationHistory.push(assistantMessage);

      if (result.finishReason === 'tool_calls' && result.toolCalls?.length > 0) {
        console.log(`[AI Agent] ${result.toolCalls.length} function call(s) requested`);

        for (const toolCall of result.toolCalls) {
          console.log(`[AI Agent] Executing: ${toolCall.name}`);

          let functionResult = null;
          if (toolCall.name === 'search_knowledge_base') {
            functionResult = await searchKnowledgeBase(toolCall.arguments, accessToken, workspaceHost, warehouseId, schema);
          } else if (toolCall.name === 'execute_sql') {
            functionResult = await executeSQLQuery(toolCall.arguments, accessToken, workspaceHost, warehouseId);
          }

          conversationHistory.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(functionResult),
          });
        }
      } else {
        finalResponse = result.content;
        console.log(`[AI Agent] Final answer received (${finalResponse.length} chars)`);
      }
    }

    if (!finalResponse) {
      finalResponse = 'Agent reached maximum iterations without completing the task.';
    }

    console.log(`[AI Agent] SUCCESS — ${iterations} iterations`);

    return res.status(200).json({
      success: true,
      response: finalResponse,
      iterations,
      model: modelEndpoint,
      toolsUsed: conversationHistory.filter(m => m.role === 'tool').length,
    });

  } catch (error) {
    console.error('[AI Agent] Error:', error);
    return res.status(500).json({ error: 'Agent execution failed', message: error.message });
  }
}

// ── Helper: Search Knowledge Base ─────────────────────────────────────────────

async function searchKnowledgeBase(args, accessToken, workspaceHost, warehouseId, schema) {
  const { query, brand, category, limit = 5 } = args;

  const conditions = ['is_approved = TRUE'];
  if (brand) conditions.push(`brand = '${brand.replace(/'/g, "''")}'`);
  if (category) conditions.push(`category = '${category.replace(/'/g, "''")}'`);
  conditions.push(`(
    file_name LIKE '%${query.replace(/'/g, "''")}%'
    OR content_summary LIKE '%${query.replace(/'/g, "''")}%'
  )`);

  const response = await fetch(
    `https://${workspaceHost}/api/2.0/sql/statements`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        warehouse_id: warehouseId,
        statement: `SELECT file_id, file_name, content_summary, tags, citation_count, scope, brand, category
                    FROM knowledge_base.${schema}.file_metadata
                    WHERE ${conditions.join(' AND ')}
                    ORDER BY citation_count DESC
                    LIMIT ${limit}`,
        wait_timeout: '30s',
      }),
    }
  );

  if (!response.ok) return { error: 'Knowledge Base search failed' };

  const result = await response.json();
  const rows = result.result?.data_array || [];

  return {
    files: rows.map(row => ({
      fileId: row[0], fileName: row[1], summary: row[2],
      tags: row[3], citationCount: row[4], scope: row[5],
      brand: row[6], category: row[7],
    })),
    count: rows.length,
  };
}

// ── Helper: Execute SQL ────────────────────────────────────────────────────────

async function executeSQLQuery(args, accessToken, workspaceHost, warehouseId) {
  const { query } = args;

  if (!query.trim().toUpperCase().startsWith('SELECT')) {
    return { error: 'Only SELECT queries are allowed' };
  }

  const response = await fetch(
    `https://${workspaceHost}/api/2.0/sql/statements`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ warehouse_id: warehouseId, statement: query, wait_timeout: '30s' }),
    }
  );

  if (!response.ok) return { error: 'SQL execution failed' };

  const result = await response.json();
  const rows = result.result?.data_array || [];

  return {
    rows,
    columns: result.result?.manifest?.schema?.columns || [],
    rowCount: rows.length,
  };
}
