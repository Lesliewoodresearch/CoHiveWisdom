# Project Type Prompts

## Overview

CoHive now supports project type-specific AI prompts that can be configured by Data Scientists. Each project type can have a custom prompt that guides AI assessments and recommendations specific to that project type's requirements.

## Features

### Role-Based Access Control

- **Data Scientists Only**: Only users with the `data-scientist` role can create new project types with custom prompts
- **Workspace-Wide Sharing**: Project types and their prompts are shared across the entire Databricks workspace
- **Persistent Storage**: Configurations are stored in both Databricks and localStorage for reliability

### Creating Project Types with Prompts

1. Navigate to the **Knowledge Base** (Research hex)
2. Select **Synthesis** mode
3. Choose **New Project Type (Data Scientists Only)**
4. Fill in:
   - **Project Type Name**: A unique identifier for the project type
   - **Project Type Prompt**: The AI prompt that will be used for assessments
5. Click **Add Project Type**

### Prompt Usage

When users run assessments for a specific project type, the system will:
1. Look up the project type configuration
2. Apply the custom prompt to guide the AI's response
3. Generate contextually relevant assessments based on the prompt

## Data Structure

### ProjectTypeConfig Interface

```typescript
interface ProjectTypeConfig {
  projectType: string;      // Unique project type name
  prompt: string;           // Custom AI prompt for this type
  createdBy: string;        // Email of creator
  createdDate: number;      // Timestamp of creation
  updatedBy?: string;       // Email of last updater
  updatedDate?: number;     // Timestamp of last update
}
```

## API Functions

### `addProjectTypeWithPrompt`
Creates a new project type with an associated prompt.

**Parameters:**
- `projectType` (string): The project type name
- `prompt` (string): The custom AI prompt
- `userEmail` (string): User's email
- `userRole` (string): Must be 'data-scientist'

**Returns:** `Promise<{ success: boolean; error?: string }>`

### `fetchProjectTypeConfigs`
Retrieves all project type configurations from Databricks.

**Returns:** `Promise<{ success: boolean; configs?: ProjectTypeConfig[]; error?: string }>`

### `updateProjectTypePrompt`
Updates the prompt for an existing project type.

**Parameters:**
- `projectType` (string): The project type name
- `prompt` (string): The new prompt
- `userEmail` (string): User's email
- `userRole` (string): Must be 'data-scientist'

**Returns:** `Promise<{ success: boolean; error?: string }>`

### `deleteProjectTypeConfig`
Deletes a project type configuration (use with caution).

**Parameters:**
- `projectType` (string): The project type to delete
- `userEmail` (string): User's email
- `userRole` (string): Must be 'data-scientist'

**Returns:** `Promise<{ success: boolean; error?: string }>`

## Storage

### Databricks
- **Primary Storage**: Project type configurations are stored in Databricks Unity Catalog
- **Table**: `knowledge_base.{schema}.project_type_configs`
- **Endpoint**: `/api/databricks/config/project-type-prompts`
- **Methods**: GET, POST, PATCH, DELETE
- **Schema**:
  ```sql
  config_id STRING NOT NULL,
  project_type STRING NOT NULL,
  prompt STRING NOT NULL,
  created_by STRING NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
  updated_by STRING,
  updated_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
  ```

### LocalStorage
- **Fallback Storage**: `cohive_project_type_configs`
- **Auto-sync**: Configurations sync to localStorage when loaded from Databricks
- **Offline Support**: LocalStorage ensures configurations are available even if Databricks is temporarily unavailable

## Backend API

### Endpoint: `/api/databricks/config/project-type-prompts`

**Location**: `/api/databricks/config/project-type-prompts.js`

#### GET - Fetch all configurations
- **Auth**: Required (Databricks OAuth)
- **Returns**: Array of `ProjectTypeConfig` objects
- **Query**: Selects all active configurations ordered by project type

#### POST - Create new project type with prompt
- **Auth**: Required (Data Scientist only)
- **Body**:
  ```json
  {
    "projectType": "Creative Messaging",
    "prompt": "You are analyzing...",
    "userEmail": "user@company.com",
    "userRole": "data-scientist"
  }
  ```
- **Validation**: 
  - Checks for data-scientist role
  - Prevents duplicate project type names
  - Logs unauthorized attempts
- **Returns**: Success status and message

#### PATCH - Update existing prompt
- **Auth**: Required (Data Scientist only)
- **Body**:
  ```json
  {
    "projectType": "Creative Messaging",
    "prompt": "Updated prompt...",
    "userEmail": "user@company.com",
    "userRole": "data-scientist"
  }
  ```
- **Validation**: Checks project type exists
- **Returns**: Success status and message

#### DELETE - Delete configuration
- **Auth**: Required (Data Scientist only)
- **Body**:
  ```json
  {
    "projectType": "Creative Messaging",
    "userEmail": "user@company.com",
    "userRole": "data-scientist"
  }
  ```
- **Note**: Soft delete (sets `is_active = FALSE`)
- **Returns**: Success status and message

### Activity Logging

All operations are logged to `knowledge_base.{schema}.activity_log`:
- `project_type_prompt_created`
- `project_type_prompt_updated`
- `project_type_prompt_deleted`
- `project_type_prompt_unauthorized` (failed attempts)

## UI Components

### ResearcherModes Component
- **Location**: `/components/ResearcherModes.tsx`
- **Mode**: Synthesis
- **Option**: "New Project Type (Data Scientists Only)"
- **Form Fields**:
  - Project Type Name (required)
  - Project Type Prompt (required, textarea with 4 rows)
- **Access Control**: Displays error message for non-data-scientist users

### ProcessWireframe Component
- **Location**: `/components/ProcessWireframe.tsx`
- **State Management**: 
  - `projectTypeConfigs` state
  - `handleAddProjectTypeWithPrompt` function
- **Props Passing**: Passes configs and handler to ResearcherModes

## Example Prompts

### Creative Messaging
```
You are analyzing creative messaging campaigns. Focus on:
- Message clarity and resonance
- Target audience alignment
- Brand voice consistency
- Emotional impact
- Call-to-action effectiveness
```

### Product Launch
```
You are evaluating product launch strategies. Consider:
- Market readiness and timing
- Competitive positioning
- Launch messaging and channels
- Success metrics and KPIs
- Risk mitigation strategies
```

### War Games
```
You are conducting competitive war games analysis. Analyze:
- Competitor strengths and weaknesses
- Market positioning opportunities
- Strategic advantages and threats
- Response scenarios and tactics
- Resource allocation recommendations
```

### Packaging
```
You are assessing packaging design and strategy. Evaluate:
- Visual appeal and shelf presence
- Functional design and usability
- Brand identity alignment
- Sustainability considerations
- Consumer perception and appeal
```

## Security & Permissions

- **Authentication Required**: Users must be authenticated with Databricks OAuth
- **Role Verification**: Server-side verification ensures only data-scientists can create/modify prompts
- **Audit Trail**: All creations and updates are logged with user email and timestamp
- **Workspace Isolation**: Configurations are scoped to the user's Databricks workspace

## Best Practices

1. **Clear Prompts**: Write specific, actionable prompts that guide AI toward relevant insights
2. **Consistency**: Maintain consistent language and structure across similar project types
3. **Testing**: Test prompts with sample assessments before deploying to production
4. **Documentation**: Include context about what each prompt is designed to achieve
5. **Version Control**: When updating prompts, document what changed and why

## Future Enhancements

- **Prompt Templates**: Pre-built templates for common project types
- **Version History**: Track prompt changes over time
- **A/B Testing**: Compare effectiveness of different prompts
- **Prompt Library**: Shared repository of proven prompts
- **Analytics**: Track which prompts generate the most valuable insights

## Troubleshooting

### "Project type already exists"
- Check if the project type name is already in use
- Project type names are case-sensitive and must be unique

### "Access Denied: Only Data Scientists can create..."
- Verify your user role is set to 'data-scientist'
- Contact your administrator if you should have this access

### Prompt not being applied
- Ensure the project type configuration was successfully saved
- Check browser console for any API errors
- Verify Databricks authentication is active

### Configuration not syncing
- Check network connectivity to Databricks
- Verify Databricks workspace configuration
- Check localStorage for cached configurations

## Related Documentation

- **Guidelines**: `/Guidelines.md`
- **Databricks Integration**: `/docs/DATABRICKS_KNOWLEDGE_BASE_INTEGRATION.md`
- **Knowledge Base Access**: `/docs/KNOWLEDGE_BASE_ACCESS_POLICY.md`
- **Model Templates**: `/docs/MODEL_TEMPLATES.md`

---

**Last Updated**: April 2026
**Version**: 1.0.0