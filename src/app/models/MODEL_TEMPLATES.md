# Model Templates Documentation

## Overview

The Model Templates system allows you to configure which AI model to use for every call made to Databricks. This provides fine-grained control over model selection based on the specific hex (workflow step) and purpose of the call.

## Features

- **Per-Hex Configuration**: Select different models for each hexagon in the workflow
- **Per-Purpose Configuration**: Choose specific models for different call types (assessment, recommendation, synthesis, etc.)
- **Template Management**: Create, edit, and switch between different model configurations
- **Future-Proof**: Designed to support multiple AI models as they become available
- **Quick Actions**: Bulk operations to set all hexes or all purposes to the same model

## Available Models

See [model_names.md](./model_names.md) for the complete list of supported Databricks Foundation Models.

### Recommended Models (March 2026)

**Default:**
- **Claude Sonnet 4.6** (databricks-claude-sonnet-4-6) - Balanced performance and speed

**Premium:**
- **OpenAI GPT-5.2** (databricks-gpt-5-2) - Complex reasoning, structured extraction
- **Google Gemini 3.1 Pro** (databricks-gemini-3-1-pro) - Deep analysis, 1M context
- **Google Gemini 2.5 Pro** (databricks-gemini-2-5-pro) - Enterprise research, "Deep Think Mode"

**Economy:**
- **Claude Haiku 4.5** (databricks-claude-haiku-4-5) - Real-time, low-latency
- **OpenAI GPT-5 mini** (databricks-gpt-5-mini) - Cost-optimized reasoning

## Call Purposes

The system distinguishes calls by the following purposes:

1. **Assessment** - Evaluate and analyze selected files
2. **Recommendation** - Generate recommendations based on analysis
3. **Unified** - Combined assessment + recommendations in one call
4. **Synthesis** - Synthesize multiple research files into cohesive insights
5. **Persona Response** - Persona-based conversations and evaluations
6. **Fact Checking** - Verify claims and facts within content
7. **Summarization** - Generate summaries of content
8. **Initial Query** - First question/query processing
9. **Follow-up Query** - Subsequent questions in a conversation
10. **Wisdom Contribution** - Process wisdom hex inputs

## Hexagons

Model templates can be configured for all workflow hexes:
- Launch
- Knowledge Base (research)
- External Experts (Luminaries)
- Panel Homes (Panelist)
- Buyers (Consumers)
- Competitors
- Colleagues
- Cultural Voices (cultural)
- Social Voices (social)
- Wisdom
- Test Against Segments (Grade)
- Action (Findings)

## How to Use

### Accessing Model Templates

1. Click the **"Model Templates"** button in the left sidebar
2. The Model Template Manager will open

### Selecting a Template

1. In the Model Template Manager, you'll see all available templates
2. Click on a template to activate it
3. The active template is marked with a green "Active" badge
4. Your selection is saved automatically

### Creating a New Template

1. Click **"Create New Template"** button
2. Enter a name and description
3. Configure models for each hex and purpose (see below)
4. Click **"Save Template"**

### Editing a Template

1. Click the **Edit** button (pencil icon) on any template
2. Modify the configuration
3. Click **"Save Template"** to update

### Configuring Models

#### Quick Actions

**Set All Hexes:**
- Use the "Set all hexes to:" buttons to apply one model to all hexes and purposes at once
- Useful for quickly creating a baseline configuration

**Set All Purposes in a Hex:**
- Select a hex tab
- Use the "Set all purposes in [Hex] to:" buttons
- Applies the selected model to all purposes within that specific hex

#### Detailed Configuration

1. **Select a Hex Tab**: Click on the hex you want to configure
2. **Configure Each Purpose**: For each purpose, select the desired model from the dropdown
3. Each dropdown shows:
   - Model name
   - Provider (e.g., Anthropic, OpenAI, Google, Meta, Alibaba)
   - Tier indicator (Premium, Balanced, Economy)

### Default Template

The system comes with a default template:
- **"All Claude Sonnet 4.6"** - Uses Claude Sonnet 4.6 for all hexes and purposes
- Marked with a purple "Default" badge
- Recommended for most use cases

## Integration with Databricks Calls

When your application makes a call to Databricks, the Model Template system:

1. Identifies the current hex (e.g., "Buyers")
2. Identifies the purpose (e.g., "persona-response")
3. Looks up the configured model in the active template
4. Uses that model for the Databricks API call via the Model Factory

### Example Usage in Code

```typescript
import { getModelForExecution } from '../components/ModelTemplateManager';
import { getModel } from '../models/factory';

// Get the model ID for a specific hex and purpose
const modelId = getModelForExecution(
  currentModelTemplate,  // Current active model template
  'Buyers' as HexId,     // The hex making the call
  'persona-response' as PurposeId  // The purpose of the call
);

// Get the model instance from the factory
const model = await getModel(modelId);

// Use this model for your AI call
const response = await model.generate({
  prompt: systemPrompt,
  messages: conversationHistory,
  // ... other parameters
});
```

## Model Factory Integration

The Model Templates system integrates with the Model Factory pattern located in `/models/`:

- **Registry** (`/models/registry.ts`) - Central registry of all available models
- **Factory** (`/models/factory.ts`) - Creates model instances based on ID
- **Base Classes** (`/models/base.ts`) - Abstract interfaces for models
- **Implementations** (`/models/databricks_model.ts`) - Databricks-specific implementations

This architecture allows:
- Easy addition of new models and providers
- Consistent interface across all models
- Centralized configuration management
- Type-safe model selection

## Storage

Model templates are stored in localStorage with the key:
- `cohive_model_templates` - Array of all model templates
- `cohive_current_model_template_id` - ID of the currently active template

## Best Practices

1. **Start with Default**: Begin with the "All Claude Sonnet 4.6" template
2. **Test Before Customizing**: Understand how different models perform before creating complex configurations
3. **Document Your Templates**: Use clear names and descriptions for custom templates
4. **Purpose-Specific Tuning**: Consider different models for different purposes:
   - Fast models (Haiku, GPT-5 nano) for summarization
   - Powerful models (GPT-5.2, Gemini 3.1 Pro) for complex analysis
   - Balanced models (Claude Sonnet, GPT-5.1) for general use
5. **Consider Cost vs Quality**: Higher tier models provide better results but cost more

## Examples

### Use Case 1: Fast Summarization, Deep Analysis

Create a template that uses:
- Claude Haiku 4.5 for summarization (fast, low-cost)
- Google Gemini 2.5 Pro for assessment and unified calls (powerful, deep reasoning)
- Claude Sonnet 4.6 for general recommendations (balanced)

### Use Case 2: Cost Optimization

Configure economy models for:
- Initial queries (GPT-5 mini)
- Fact checking (Claude Haiku 4.5)
- Simple recommendations (GPT-5 mini)

And more powerful models for:
- Complex assessments (GPT-5.2)
- Synthesis (Gemini 3.1 Pro)
- Unified evaluations (Gemini 2.5 Pro)

### Use Case 3: Provider Diversity

Mix models from different providers based on their strengths:
- Anthropic Claude Sonnet 4.6 for reasoning-heavy tasks
- OpenAI GPT-5.1 for creative recommendations
- Google Gemini for multimodal analysis and long-context tasks
- Meta Llama for multilingual dialogue
- Alibaba Qwen for ultra-long context

## Troubleshooting

**Q: My model selection isn't being used**
A: Ensure you've saved the template and it's marked as "Active"

**Q: Can I delete a template?**
A: Currently, templates can only be created and edited. Deletion will be added in a future update.

**Q: What happens if a model becomes unavailable?**
A: The system will fall back to the default model (Claude Sonnet 4.6)

**Q: How do I know which model is best for my use case?**
A: See [model_names.md](./model_names.md) for detailed "Best For" descriptions of each model

## Technical Details

### Type Definitions

```typescript
type ModelId = 
  | 'databricks-claude-sonnet-4-6'
  | 'databricks-gpt-5-2'
  | 'databricks-gemini-3-1-pro'
  // ... see registry.ts for full list

type HexId = 
  | 'Launch'
  | 'research'
  | 'Luminaries'
  | 'Panelist'
  | 'Buyers'
  | 'Competitors'
  | 'Colleagues'
  | 'cultural'
  | 'social'
  | 'Wisdom'
  | 'Grade'
  | 'Action';

type PurposeId = 
  | 'assessment'
  | 'recommendation'
  | 'unified'
  | 'synthesis'
  | 'persona-response'
  | 'fact-checking'
  | 'summarization'
  | 'initial-query'
  | 'follow-up-query'
  | 'wisdom-contribution';

interface ModelConfiguration {
  [hexId: string]: {
    [purposeId: string]: ModelId;
  };
}

interface ModelTemplate {
  id: string;
  name: string;
  description: string;
  configuration: ModelConfiguration;
  isDefault?: boolean;
}
```

### Helper Functions

- `getModelForExecution(template, hexId, purposeId)` - Get the model for a specific execution
- `getDefaultConfiguration()` - Creates a configuration with all models set to Claude Sonnet 4.6

## See Also

- [model_names.md](./model_names.md) - Complete list of available models
- [README.md](./README.md) - Model system architecture
- [/docs/Guidelines.md](../docs/Guidelines.md) - Development standards
- [/components/ModelTemplateManager.tsx](../components/ModelTemplateManager.tsx) - Implementation

---

**Last Updated:** March 2026  
**Location:** `/models/MODEL_TEMPLATES.md`
