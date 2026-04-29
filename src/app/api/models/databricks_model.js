/**
 * Databricks Model Adapter (JavaScript version for API serverless functions)
 *
 * All Databricks-served models share a single invocation pattern:
 *   POST https://{workspace}/serving-endpoints/{modelId}/invocations
 *
 * This one class handles every model in the registry — Claude, GPT, Gemini,
 * Llama, DBRX, Qwen, and any model added in the future.
 *
 * Location: api/models/databricks_model.js
 */

import { isValidModelId } from './registry.js';

export class DatabricksModel {
  constructor(modelId, config) {
    if (!isValidModelId(modelId)) {
      throw new Error(`Unknown model: "${modelId}". Add it to api/models/registry.js first.`);
    }
    this.modelId = modelId;
    this.workspaceHost = config.workspaceHost;
    this.accessToken = config.accessToken;
  }

  async invoke(params) {
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
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    conversationHistory.forEach(m => messages.push(m));
    messages.push({ role: 'user', content: prompt });

    const body = {
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
      const err = await response.json().catch(() => ({}));
      throw new Error(
        `Model invocation failed [${this.modelId}]: ${err.message || response.statusText}`
      );
    }

    const result = await response.json();
    return this._parseResponse(result);
  }

  _parseResponse(result) {
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
          toolCalls: message.tool_calls.map((tc) => ({
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

  _parseUsage(usage) {
    return {
      promptTokens: usage.prompt_tokens ?? 0,
      completionTokens: usage.completion_tokens ?? 0,
      totalTokens: usage.total_tokens ?? 0,
    };
  }
}
