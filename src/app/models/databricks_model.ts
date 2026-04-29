/**
 * Databricks Model Adapter
 *
 * All Databricks-served models share a single invocation pattern:
 *   POST https://{workspace}/serving-endpoints/{modelId}/invocations
 *
 * This one class handles every model in the registry — Claude, GPT, Gemini,
 * Llama, DBRX, Qwen, and any model added in the future.
 *
 * The server-side API routes use this directly. The frontend never calls
 * Databricks directly — all invocations go through /api/databricks/ai/*.
 */

import type { IModel, ModelInvokeParams, ModelInvokeResult, Message } from './base.js';
import { isValidModelId } from './registry.js';

export interface DatabricksModelConfig {
  workspaceHost: string;
  accessToken: string;
}

export class DatabricksModel implements IModel {
  readonly modelId: string;
  private readonly workspaceHost: string;
  private readonly accessToken: string;

  constructor(modelId: string, config: DatabricksModelConfig) {
    if (!isValidModelId(modelId)) {
      throw new Error(`Unknown model: "${modelId}". Add it to src/models/registry.ts first.`);
    }
    this.modelId = modelId;
    this.workspaceHost = config.workspaceHost;
    this.accessToken = config.accessToken;
  }

  async invoke(params: ModelInvokeParams): Promise<ModelInvokeResult> {
    const {
      prompt,
      systemPrompt,
      conversationHistory = [],
      maxTokens = 1000,
      temperature = 0.7,
      topP = 0.9,
      tools,
    } = params;

    // Build message array
    const messages: Message[] = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    conversationHistory.forEach(m => messages.push(m));
    messages.push({ role: 'user', content: prompt });

    const body: Record<string, unknown> = {
      model: this.modelId,
      messages,
      max_tokens: maxTokens,
      temperature,
    };

    if (tools && tools.length > 0) {
      body.tools = tools;
      body.tool_choice = 'auto';
    }

    const endpoint = `https://${this.workspaceHost}/serving-endpoints/${this.modelId}/invocations`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({})) as Record<string, unknown>;
      throw new Error(
        `Model invocation failed [${this.modelId}]: ${(err as any).message || response.statusText}`
      );
    }

    const result = await response.json() as Record<string, any>;
    return this._parseResponse(result);
  }

  private _parseResponse(result: Record<string, any>): ModelInvokeResult {
    const usage = result.usage ?? {};

    // Standard OpenAI-compatible choices response
    if (result.choices?.length > 0) {
      const choice = result.choices[0];
      const message = choice.message ?? {};

      // Tool call response
      if (message.tool_calls?.length > 0) {
        return {
          content: message.content ?? '',
          modelId: this.modelId,
          usage: this._parseUsage(usage),
          toolCalls: message.tool_calls.map((tc: any) => ({
            id: tc.id,
            name: tc.function.name,
            arguments: JSON.parse(tc.function.arguments ?? '{}'),
          })),
          finishReason: 'tool_calls',
        };
      }

      return {
        content: message.content ?? choice.text ?? '',
        modelId: this.modelId,
        usage: this._parseUsage(usage),
        finishReason: choice.finish_reason === 'length' ? 'length' : 'stop',
      };
    }

    // Databricks-native predictions format (some older endpoints)
    if (result.predictions?.length > 0) {
      return {
        content: String(result.predictions[0]),
        modelId: this.modelId,
        usage: this._parseUsage(usage),
        finishReason: 'stop',
      };
    }

    throw new Error(`Unexpected response format from model "${this.modelId}"`);
  }

  private _parseUsage(usage: Record<string, number>): ModelInvokeResult['usage'] {
    return {
      promptTokens: usage.prompt_tokens ?? 0,
      completionTokens: usage.completion_tokens ?? 0,
      totalTokens: usage.total_tokens ?? 0,
    };
  }
}