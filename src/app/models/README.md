# CoHive Model System

## Overview

The CoHive model system provides a flexible, extensible architecture for managing AI model selection and invocation across the application. It uses a **Factory Pattern** with a **Central Registry** to decouple model configuration from implementation.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                     │
│  (Components, Hex Logic, Assessment Flows)              │
└────────────┬────────────────────────────────────────────┘
             │
             ├── Model Template Manager ──┐
             │   (User-configured model     │
             │    selection per hex/purpose)│
             │                              │
             ▼                              ▼
      ┌────────────┐                ┌──────────────┐
      │  Factory   │◄───────────────│   Registry   │
      │ factory.ts │                │ registry.ts  │
      └─────┬──────┘                └──────────────┘
            │                       (Single source
            │                        of truth for
            │                        available models)
            ▼
      ┌────────────┐
      │ IModel     │
      │ base.ts    │
      └─────┬──────┘
            │
            ▼
      ┌────────────────────┐
      │ DatabricksModel    │
      │ databricks_model.ts│
      └────────────────────┘
```

## Key Components

### 1. **Registry** (`registry.ts`)

The single source of truth for all available models.

```typescript
export const MODEL_REGISTRY: readonly ModelMeta[] = [
  {
    id: 'databricks-claude-sonnet-4-6',
    name: 'Claude Sonnet 4.6',
    provider: 'Anthropic',
    tier: 'premium',
    description: 'Advanced hybrid reasoning',
    supportsTools: true,
    recommended: true,
  },
  // ... more models
];
```

**To add a new model:** Just add an entry to `MODEL_REGISTRY`. Everything else updates automatically.

### 2. **Factory** (`factory.ts`)

Creates model instances based on model ID.

```typescript
import { getModel } from './factory';

// Get a model instance
const model = await getModel('databricks-claude-sonnet-4-6');

// Use it
const result = await model.invoke({
  prompt: 'Your prompt here',
  systemPrompt: 'System instructions',
  maxTokens: 2000,
  temperature: 0.7
});
```

### 3. **Base Interface** (`base.ts`)

Defines the contract that all models must implement.

```typescript
export interface IModel {
  readonly modelId: string;
  invoke(params: ModelInvokeParams): Promise<ModelInvokeResult>;
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

export interface ModelInvokeResult {
  content: string;
  modelId: string;
  usage: ModelUsage;
  toolCalls?: Array<{ id: string; name: string; arguments: Record<string, unknown>; }>;
  finishReason: 'stop' | 'tool_calls' | 'length' | 'error';
}
```

### 4. **Databricks Implementation** (`databricks_model.ts`)

The concrete implementation for Databricks Foundation Models.

All Databricks models share a single endpoint pattern:
```
https://{workspace}/serving-endpoints/{modelId}/invocations
```

The implementation:
- Handles authentication via environment variables
- Formats requests to Databricks API spec
- Parses responses into standard format
- Manages token usage tracking
- Handles errors consistently

## Integration with Model Templates

The Model Template system (see [MODEL_TEMPLATES.md](./MODEL_TEMPLATES.md)) sits above the factory:

```typescript
import { getModelForExecution } from '../components/ModelTemplateManager';
import { getModel } from '../models/factory';

// 1. Get the configured model ID for this execution
const modelId = getModelForExecution(
  activeTemplate,
  'Buyers',           // hex
  'persona-response'  // purpose
);

// 2. Get the model instance
const model = await getModel(modelId);

// 3. Use it
const response = await model.invoke({ prompt, systemPrompt });
```

This separation allows:
- **Users** to control which model is used via Model Templates UI
- **Developers** to work with a consistent interface
- **Operations** to add new models without code changes

## Usage Examples

### Basic Invocation

```typescript
import { getModel } from './models/factory';

const model = await getModel('databricks-claude-sonnet-4-6');
const result = await model.invoke({
  prompt: 'Analyze this market research data...',
  systemPrompt: 'You are a market research analyst.',
  maxTokens: 1500,
  temperature: 0.7
});

console.log(result.content);
console.log('Tokens used:', result.usage.totalTokens);
```

### With Conversation History

```typescript
const model = await getModel('databricks-gpt-5-1');
const result = await model.invoke({
  prompt: 'What did we discuss earlier about pricing?',
  systemPrompt: 'You are a strategic consultant.',
  conversationHistory: [
    { role: 'user', content: 'Tell me about pricing strategies' },
    { role: 'assistant', content: 'Here are three key strategies...' }
  ],
  maxTokens: 1000
});
```

### With Tool Calling

```typescript
const model = await getModel('databricks-gpt-5-2');
const result = await model.invoke({
  prompt: 'What is the weather in San Francisco?',
  tools: [
    {
      type: 'function',
      function: {
        name: 'get_weather',
        description: 'Get current weather for a location',
        parameters: {
          type: 'object',
          properties: {
            location: { type: 'string' }
          }
        }
      }
    }
  ]
});

if (result.toolCalls) {
  console.log('Tool called:', result.toolCalls[0].name);
  console.log('Arguments:', result.toolCalls[0].arguments);
}
```

## Adding a New Model

1. **Add to Registry** (`registry.ts`):
   ```typescript
   {
     id: 'databricks-new-model',
     name: 'New Model Name',
     provider: 'Provider',
     tier: 'balanced',
     description: 'What this model is good for',
     supportsTools: true,
     recommended: false
   }
   ```

2. **That's it!** The factory, model template UI, and all model selection dropdowns automatically include the new model.

## Available Models

See [model_names.md](./model_names.md) for the complete list of available Databricks Foundation Models (50+ models across 5 providers).

## Configuration

Models are configured via environment variables (managed in `/api/utils/validateEnv.js`):

```env
# Required
DATABRICKS_WORKSPACE_HOST=your-workspace.cloud.databricks.com
DATABRICKS_ACCESS_TOKEN=your-token

# Optional
DATABRICKS_WAREHOUSE_ID=your-warehouse-id
DATABRICKS_SCHEMA=your-schema
```

All credentials are:
- ✅ Server-side only (never sent to client)
- ✅ Read from environment variables
- ✅ Validated on API startup
- ✅ Used via centralized `getDatabricksConfig()` function

## Error Handling

The model system provides consistent error handling:

```typescript
try {
  const model = await getModel('databricks-claude-sonnet-4-6');
  const result = await model.invoke({ prompt: '...' });
  
  if (result.finishReason === 'error') {
    console.error('Model returned error');
  }
} catch (error) {
  if (error instanceof ModelNotFoundError) {
    console.error('Model not in registry');
  } else if (error instanceof ModelInvocationError) {
    console.error('API call failed:', error.message);
  }
}
```

## Testing

To test model invocations locally:

```bash
# Ensure environment variables are set
export DATABRICKS_WORKSPACE_HOST=...
export DATABRICKS_ACCESS_TOKEN=...

# Run the development server
npm run dev

# Or test API endpoints directly
vercel dev
```

## Best Practices

1. **Always use the factory** - Never instantiate model classes directly
2. **Let templates control selection** - Use Model Templates for user-configurable model choice
3. **Handle errors gracefully** - Check `finishReason` and handle API failures
4. **Track token usage** - Monitor `usage` in results for cost management
5. **Use appropriate tiers** - Match model tier to task complexity
6. **Test with defaults first** - Start with Claude Sonnet 4.6 before customizing

## File Locations

```
/models/
├── README.md                  # This file
├── MODEL_TEMPLATES.md         # User guide for model templates
├── model_names.md             # Complete model reference
├── base.ts                    # Interface definitions
├── registry.ts                # Model registry
├── factory.ts                 # Factory implementation
├── databricks_model.ts        # Databricks implementation
└── index.ts                   # Public exports
```

## See Also

- [MODEL_TEMPLATES.md](./MODEL_TEMPLATES.md) - How users configure model selection
- [model_names.md](./model_names.md) - Complete list of available models
- [/components/ModelTemplateManager.tsx](../components/ModelTemplateManager.tsx) - UI implementation
- [/api/databricks/assessment/run.js](../api/databricks/assessment/run.js) - Example usage in API
- [/docs/Guidelines.md](../docs/Guidelines.md) - Development guidelines

---

**Last Updated:** March 2026  
**Location:** `/models/README.md`
