/**
 * Databricks AI — frontend fetch wrappers
 *
 * Calls the server-side API routes. Does NOT invoke Databricks directly.
 * All model selection, credentials, and inference happen server-side.
 *
 * Model types (Message, Tool, ModelInvokeResult, etc.) live in src/models/base.ts.
 * To add or change available models, edit src/models/registry.ts.
 *
 * Location: src/utils/databricksAI.ts
 */

import { getValidSession } from './databricksAuth';
import type { ModelUsage } from '../models/base';

// ── Request params (CoHive-specific — includes business logic fields) ─────────

export interface AIPromptParams {
  prompt: string;
  systemPrompt?: string;
  modelEndpoint?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  conversationHistory?: Array<{ role: string; content: string }>;
  includeKnowledgeBase?: boolean;
  knowledgeBaseQuery?: string;
  userEmail: string;
  userRole: string;
}

export interface AIAgentParams {
  task: string;
  systemPrompt?: string;
  modelEndpoint?: string;
  maxIterations?: number;
  enableKnowledgeBase?: boolean;
  enableSQLQuery?: boolean;
  enableWebSearch?: boolean;
  brand?: string;
  category?: string;
  userEmail: string;
  userRole: string;
}

// ── Response types (mirror server response shapes) ────────────────────────────

export interface AIPromptResponse {
  success: boolean;
  response: string;
  model: string;
  usage: ModelUsage;
  metadata: {
    kbContextUsed: boolean;
    conversationLength: number;
  };
  error?: string;
}

export interface AIAgentResponse {
  success: boolean;
  response: string;
  iterations: number;
  model: string;
  toolsUsed: number;
  error?: string;
}

// ── Auth helper ───────────────────────────────────────────────────────────────

async function requireAuth(): Promise<void> {
  const session = await getValidSession();
  if (!session) {
    throw new Error('Not authenticated. Please sign in.');
  }
  // accessToken and workspaceHost are intentionally omitted — server reads from env vars.
}

// ── Execute a prompt ──────────────────────────────────────────────────────────

export async function executeAIPrompt(params: AIPromptParams): Promise<AIPromptResponse> {
  try {
    console.log('🤖 Executing AI Prompt:', params.prompt.substring(0, 100) + '...');

    await requireAuth();

    const response = await fetch('/api/databricks/ai/prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as Record<string, string>;
      throw new Error(errorData.error || `AI prompt failed: ${response.statusText}`);
    }

    const result: AIPromptResponse = await response.json();
    console.log('✅ AI Response received:', result.response.substring(0, 100) + '...');
    console.log('📊 Token usage:', result.usage);

    return result;

  } catch (error) {
    console.error('❌ AI Prompt error:', error);
    return {
      success: false,
      response: '',
      model: '',
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      metadata: { kbContextUsed: false, conversationLength: 0 },
      error: error instanceof Error ? error.message : 'AI prompt failed',
    };
  }
}

// ── Run an agent ──────────────────────────────────────────────────────────────

export async function runAIAgent(params: AIAgentParams): Promise<AIAgentResponse> {
  try {
    console.log('🤖 Running AI Agent:', params.task);
    console.log('🛠️ Tools enabled:', {
      kb: params.enableKnowledgeBase,
      sql: params.enableSQLQuery,
      web: params.enableWebSearch,
    });

    await requireAuth();

    const response = await fetch('/api/databricks/ai/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as Record<string, string>;
      throw new Error(errorData.error || `Agent execution failed: ${response.statusText}`);
    }

    const result: AIAgentResponse = await response.json();
    console.log(`✅ Agent completed in ${result.iterations} iterations`);
    console.log(`🛠️ Tools used: ${result.toolsUsed} function calls`);

    return result;

  } catch (error) {
    console.error('❌ AI Agent error:', error);
    return {
      success: false,
      response: '',
      iterations: 0,
      model: '',
      toolsUsed: 0,
      error: error instanceof Error ? error.message : 'Agent execution failed',
    };
  }
}

// ── Convenience helpers ───────────────────────────────────────────────────────

/** Execute a one-shot prompt with no conversation history */
export async function askAI(
  prompt: string,
  userEmail: string,
  userRole = 'user',
  includeKnowledgeBase = false
): Promise<string> {
  const result = await executeAIPrompt({
    prompt,
    userEmail,
    userRole,
    includeKnowledgeBase,
    knowledgeBaseQuery: includeKnowledgeBase ? prompt : undefined,
  });
  return result.success ? result.response : `Error: ${result.error}`;
}

/** Run an agent for a task */
export async function agentTask(
  task: string,
  userEmail: string,
  userRole = 'user',
  options: {
    enableKnowledgeBase?: boolean;
    enableSQLQuery?: boolean;
    brand?: string;
    category?: string;
  } = {}
): Promise<string> {
  const result = await runAIAgent({
    task,
    userEmail,
    userRole,
    enableKnowledgeBase: options.enableKnowledgeBase ?? true,
    enableSQLQuery: options.enableSQLQuery ?? true,
    brand: options.brand,
    category: options.category,
  });
  return result.success ? result.response : `Error: ${result.error}`;
}

// ── Multi-turn conversation class ─────────────────────────────────────────────

export class AIConversation {
  private history: Array<{ role: string; content: string }> = [];
  private userEmail: string;
  private userRole: string;

  constructor(userEmail: string, userRole = 'user', systemPrompt?: string) {
    this.userEmail = userEmail;
    this.userRole = userRole;
    if (systemPrompt) {
      this.history.push({ role: 'system', content: systemPrompt });
    }
  }

  async ask(prompt: string): Promise<string> {
    const result = await executeAIPrompt({
      prompt,
      userEmail: this.userEmail,
      userRole: this.userRole,
      conversationHistory: this.history,
    });

    if (result.success) {
      this.history.push({ role: 'user', content: prompt });
      this.history.push({ role: 'assistant', content: result.response });
      return result.response;
    } else {
      throw new Error(result.error || 'Failed to get response');
    }
  }

  getHistory() { return [...this.history]; }
  clear() { this.history = []; }
}
