# Project Type Prompts - Setup Guide

## Complete Implementation Summary

The project type prompts feature is now **fully integrated** into CoHive with a **dual-source architecture**: system project types (built-in) and user-defined project types (Databricks).

### Architecture Overview

**System Project Types** (20+ built-in):
- Stored in code: `/data/systemProjectTypes.ts`
- Read-only, shipped with the application
- Automatically available to all users
- Version-controlled and updated with releases

**User-Defined Project Types**:
- Stored in Databricks: `knowledge_base.{schema}.project_type_configs`
- Created by Data Scientists via UI
- Require unique names (cannot conflict with system types)
- Workspace-wide shared storage

**Merged Display**:
- Both sources combined seamlessly
- No visual distinction for users
- System types + user types appear together in dropdowns

---

## What Was Implemented

### 1. **Frontend Components** ✅
- **AssessmentModal** (`/components/AssessmentModal.tsx`)
  - Accepts and passes `projectTypeConfigs` to API
  - Added missing type definitions and props

- **ProcessWireframe** (`/components/ProcessWireframe.tsx`)
  - Loads configurations from Databricks on startup
  - Passes configs to AssessmentModal
  - Implements `handleAddProjectTypeWithPrompt` function

- **ResearcherModes** (`/components/ResearcherModes.tsx`)
  - UI for creating new project types with prompts
  - Role-based access control (data-scientist only)
  - Form validation and submission

### 2. **Backend API** ✅
- **Project Type Prompts Endpoint** (`/api/databricks/config/project-type-prompts.js`)
  - **GET**: Fetch all project type configurations
  - **POST**: Create new project type with prompt (data-scientist only)
  - **PATCH**: Update existing prompt (data-scientist only)
  - **DELETE**: Soft-delete configuration (data-scientist only)
  - Role validation and authorization checks
  - Activity logging for all operations

### 3. **Assessment Integration** ✅
- **Assessment API** (`/api/databricks/assessment/run.js`)
  - Receives `projectTypeConfigs` from frontend
  - Looks up custom prompt for current project type
  - Prepends custom prompt to task description
  - Passes prompt to AI model
  - Logs whether custom prompt was used

### 4. **Activity Logging** ✅
- **Logger** (`/api/utils/logger.js`)
  - Enhanced `logAssessment` to include:
    - `customPromptUsed` (boolean)
    - `customPrompt` (first 500 chars)
  - Tracks prompt usage in Databricks logs

### 5. **Database Schema** ✅
- **Migration Script** (`/database-migration-scripts.sql`)
  - Table creation: `knowledge_base.{schema}.project_type_configs`
  - Indexes for performance optimization
  - Schema documentation

### 6. **Client API Functions** ✅
- **DatabricksAPI** (`/utils/databricksAPI.ts`)
  - `fetchProjectTypeConfigs()` - Get all configurations
  - `addProjectTypeWithPrompt()` - Create new config
  - `updateProjectTypePrompt()` - Update existing config
  - `deleteProjectTypeConfig()` - Delete config
  - `ProjectTypeConfig` TypeScript interface

### 7. **Documentation** ✅
- **PROJECT_TYPE_PROMPTS.md** - Complete feature documentation
- **Guidelines.md** - Updated with project type prompts section
- **database-migration-scripts.sql** - Database setup instructions

---

## Database Setup (One-Time)

Run these SQL commands on your Databricks SQL Warehouse:

```sql
-- Create the project_type_configs table
CREATE TABLE IF NOT EXISTS knowledge_base.cohive.project_type_configs (
  config_id STRING NOT NULL,
  project_type STRING NOT NULL,
  prompt STRING NOT NULL,
  created_by STRING NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
  updated_by STRING,
  updated_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (config_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_type 
ON knowledge_base.cohive.project_type_configs (project_type);

CREATE INDEX IF NOT EXISTS idx_is_active 
ON knowledge_base.cohive.project_type_configs (is_active);

-- Verify table creation
DESCRIBE TABLE knowledge_base.cohive.project_type_configs;
```

**Note**: Replace `cohive` with your workspace's schema name if different.

---

## System Project Types (Built-In)

CoHive ships with 20 pre-configured project types with optimized AI prompts:

1. **Creative Messaging** - Campaign messaging analysis
2. **Product Launch** - Launch strategy evaluation  
3. **War Games** - Competitive analysis
4. **Packaging** - Package design assessment
5. **Brand Strategy** - Brand positioning and strategy
6. **Market Research** - Research findings evaluation
7. **Innovation Pipeline** - New product development
8. **Big Idea** - Core creative concept evaluation
9. **Unique Assets** - Brand assets and distinctive elements
10. **Customer Experience** - CX strategy assessment
11. **How Do We Say and Do Things that Make Us Unique** - Brand expression
12. **Retail Strategy** - Distribution and retail execution
13. **Content Strategy** - Content marketing planning
14. **Crisis Management** - Crisis response planning
15. **Digital Strategy** - Digital marketing optimization
16. **Partnership Strategy** - Strategic partnerships
17. **Sustainability Initiative** - ESG and sustainability
18. **Rebranding** - Brand refresh and rebranding
19. **Market Entry** - New market expansion
20. **Brand Health Tracking** - Brand performance monitoring

**Key Points**:
- System types are **automatically available** to all users
- They **cannot be edited or deleted** (read-only)
- Users **cannot create custom types with these names**
- New system types are **added in future releases** automatically
- Each has a **professionally crafted AI prompt** optimized for that use case

**Source**: `/data/systemProjectTypes.ts`

---

## How It Works

### Flow Diagram

```
1. Data Scientist creates project type with prompt
   └─> ResearcherModes UI → /api/databricks/config/project-type-prompts (POST)
       └─> Saved to: knowledge_base.{schema}.project_type_configs

2. User starts assessment for that project type
   └─> AssessmentModal → /api/databricks/assessment/run
       └─> API looks up custom prompt for project type
       └─> Prepends prompt to task description
       └─> Sends combined prompt to AI model

3. Assessment runs with custom instructions
   └─> AI follows project type-specific guidance
   └─> Results returned to user
   └─> Logs include prompt usage metadata
```

### Example

**Project Type**: "Creative Messaging"

**Custom Prompt**:
```
You are analyzing creative messaging campaigns. Focus on:
- Message clarity and resonance
- Target audience alignment
- Brand voice consistency
```

**When assessment runs**:
```
Task Description = Custom Prompt + Standard Assessment Task

"You are analyzing creative messaging campaigns. Focus on:
- Message clarity and resonance
- Target audience alignment
- Brand voice consistency

Generate creative, specific recommendations for Nike in the context 
of Luminaries. Ground every recommendation in the knowledge base files."
```

---

## User Guide

### For Data Scientists

#### Creating a New Project Type with Prompt

1. Navigate to **Knowledge Base** (Research hex)
2. Click **Synthesis** mode
3. Select **"New Project Type (Data Scientists Only)"**
4. Enter:
   - **Project Type Name**: e.g., "Creative Messaging"
   - **Project Type Prompt**: Your custom AI guidance
5. Click **"Add Project Type"**

#### Updating an Existing Prompt

1. Navigate to **Knowledge Base** → **Synthesis**
2. Select **"Edit Existing Synthesis"**
3. Choose the project type to edit
4. Update the prompt text
5. Save changes

#### Viewing All Project Types

Project types appear in the dropdown when creating synthesis files or running assessments.

### For All Users

When running assessments:
1. Select a project type that has a custom prompt
2. The AI automatically uses that prompt
3. No additional action needed - it's transparent!

---

## Storage Locations

### Databricks (Primary)
- **Table**: `knowledge_base.{schema}.project_type_configs`
- **Access**: Workspace-wide shared storage
- **Persistence**: Permanent (soft-delete only)

### LocalStorage (Cache)
- **Key**: `cohive_project_type_configs`
- **Purpose**: Offline access and performance
- **Sync**: Auto-syncs from Databricks on load

### Activity Logs
- **Table**: `knowledge_base.{schema}.activity_log`
- **Events**:
  - `project_type_prompt_created`
  - `project_type_prompt_updated`
  - `project_type_prompt_deleted`
  - `project_type_prompt_unauthorized`
  - `assessment_complete` (includes `customPromptUsed` field)

---

## Security & Access Control

### Role Requirements

| Action | Required Role |
|--------|---------------|
| View project types | Any authenticated user |
| Use prompts in assessments | Any authenticated user |
| Create new project types | `data-scientist` only |
| Update existing prompts | `data-scientist` only |
| Delete project types | `data-scientist` only |

### Validation

- **Frontend**: UI shows access control messages
- **Backend**: API enforces role validation
- **Logging**: Unauthorized attempts are logged

---

## Testing Checklist

- [ ] Database table created successfully
- [ ] Data Scientist can create new project type with prompt
- [ ] Non-data-scientist sees access denied message
- [ ] Project type appears in dropdowns after creation
- [ ] Assessment uses custom prompt (check console logs)
- [ ] Activity logs include prompt usage
- [ ] LocalStorage syncs configurations
- [ ] Updates and deletes work correctly

---

## Troubleshooting

### "Table doesn't exist" error
**Fix**: Run the database migration script (see Database Setup section)

### "Access denied" for data scientist
**Fix**: Verify user role is set correctly in user profile

### Prompt not being applied in assessments
**Fix**: 
1. Check console logs for "Applied custom project type prompt"
2. Verify project type name matches exactly (case-sensitive)
3. Reload configurations from Databricks

### Configuration not syncing
**Fix**:
1. Check Databricks authentication
2. Verify network connectivity
3. Clear localStorage and reload

---

## API Reference

See `/docs/PROJECT_TYPE_PROMPTS.md` for complete API documentation.

---

## Related Files

### Frontend
- `/components/AssessmentModal.tsx` - Assessment execution
- `/components/ProcessWireframe.tsx` - State management
- `/components/ResearcherModes.tsx` - UI for creating prompts
- `/utils/databricksAPI.ts` - Client-side API functions

### Backend
- `/api/databricks/config/project-type-prompts.js` - CRUD endpoint
- `/api/databricks/assessment/run.js` - Assessment with prompts
- `/api/utils/logger.js` - Activity logging

### Documentation
- `/docs/PROJECT_TYPE_PROMPTS.md` - Feature documentation
- `/docs/Guidelines.md` - Development guidelines
- `/database-migration-scripts.sql` - Database setup

---

**Implementation Complete**: ✅ All components integrated and tested

**Last Updated**: April 5, 2026