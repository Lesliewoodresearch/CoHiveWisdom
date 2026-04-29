/**
 * Base Model Interface
 * 
 * The protocol every model invocation must conform to.
 * Since all Databricks-served models share one endpoint pattern,
 * this is a single DatabricksModel class rather than one file per model.
 *
 * Usage:
 *   import { getModel } from './factory';
 *   const model = getModel('databricks-claude-sonnet-4-6');
 *   const result = await model.invoke({ prompt: '...', systemPrompt: '...' });
 */

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface Tool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface ModelInvokeParams {
  prompt: string;
  systemPrompt?: string;
  conversationHistory?: Message[];
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  tools?: Tool[];
}

export interface ModelUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ModelInvokeResult {
  content: string;
  modelId: string;
  usage: ModelUsage;
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  }>;
  finishReason: 'stop' | 'tool_calls' | 'length' | 'error';
}

/** The protocol every model adapter must satisfy */
export interface IModel {
  readonly modelId: string;
  invoke(params: ModelInvokeParams): Promise<ModelInvokeResult>;
}
