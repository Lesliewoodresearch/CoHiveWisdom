# CoHive Prompt System Architecture

This document provides a complete layout of how prompts are created, stored, and executed throughout the CoHive application.

---

## 📁 **PROMPT DATA SOURCES**

### **1. Prompt Templates Library**
**Location:** `/data/prompts/`

```
/data/prompts/
├── index.ts                    # Main export point
├── types.ts                    # TypeScript interfaces for prompts
├── core.ts                     # Core prompt building functions
├── base-parts.ts              # Reusable prompt components
├── template-engine.ts         # Template variable substitution
├── prompt-manager.ts          # Prompt selection and management
├── examples.ts                # Example prompts for testing
├── README.md                  # Documentation
├── INTEGRATION_EXAMPLES.md    # How to use prompts
└── templates/                 # Hex-specific prompt templates
    ├── launch.ts              # Launch/Enter hex prompts
    ├── knowledge-base.ts      # Research hex prompts
    ├── external-experts.ts    # Luminaries hex prompts
    ├── panel-homes.ts         # Panelist hex prompts
    ├── buyers.ts              # Consumers hex prompts
    ├── competitors.ts         # Competitors hex prompts
    ├── colleagues.ts          # Colleagues hex prompts
    ├── test-against-segments.ts  # Grade hex prompts
    └── action.ts              # Action hex prompts
```

**Purpose:** Structured, reusable prompt templates for each workflow hex

---

### **2. Step Content Data**
**Location:** `/data/stepContentData.ts`

**Contains:**
- Hex titles and descriptions
- Questions for each hex
- UI text and labels

**Used by:**
- `ProcessWireframe.tsx` - Renders hex content
- `CentralHexView.tsx` - Displays questions
- `AssessmentModal.tsx` - Builds context for AI

**Example:**
```typescript
{
  id: 'Luminaries',
  title: 'External Experts',
  description: 'Hear from industry luminaries...',
  questions: [
    'What category of expertise would you like to consult?',
    'What specific question would you like answered?'
  ]
}
```

---

### **3. System Project Types (Built-in Prompts)**
**Location:** `/data/systemProjectTypes.ts`

**Contains:**
- 20+ predefined project types
- Each with a custom AI prompt
- Read-only (cannot be edited by users)

**Examples:**
- Creative Messaging
- Product Launch
- War Games
- Brand Essence
- Packaging

**Structure:**
```typescript
{
  name: 'Creative Messaging',
  prompt: 'Evaluate this creative messaging campaign...',
  description: 'Assessment criteria for creative campaigns'
}
```

**Used in:**
- `ProcessWireframe.tsx` - Loads system project types
- `AssessmentModal.tsx` - Applies project-specific prompts to AI

---

### **4. User-Defined Project Types (Custom Prompts)**
**Storage:** Databricks `project_type_configs` table + localStorage

**Created via:**
- Knowledge Base → Synthesis Mode → "New Project Type (Data Scientists Only)"

**Managed by:**
- `ResearcherModes.tsx` - UI for creating/editing
- `databricksAPI.ts` - API calls to fetch/save

**Structure:**
```typescript
{
  projectType: 'Custom Analysis',
  promptText: 'Analyze this data focusing on...',
  createdBy: 'user@company.com',
  createdAt: '2026-04-14'
}
```

**Merged with:** System project types for unified dropdown

---

### **5. Template System (User Workflow Configuration)**
**Location:** `/components/TemplateManager.tsx`
**Storage:** localStorage `cohive_templates` + `cohive_current_template`

**Controls:**
- Which hexes are visible for different user roles
- Default responses for each hex
- Databricks instructions
- Conversation settings (multi-round vs incremental)

**Does NOT contain:** AI prompts (only workflow configuration)

---

### **6. Model Template System (AI Model Selection)**
**Location:** `/components/ModelTemplateManager.tsx`
**Storage:** localStorage `cohive_model_templates`

**Controls:**
- Which AI model to use for each hex
- Separate models for assess/recommend/unified
- Per-purpose model configuration

**Example:**
```typescript
{
  hexId: 'Luminaries',
  purposes: {
    assess: 'databricks-meta-llama-3-1-70b-instruct',
    recommend: 'databricks-dbrx-instruct'
  }
}
```

---

## 🔄 **PROMPT EXECUTION FLOW**

### **Flow 1: Hex Assessment (Main Workflow)**

```
┌─────────────────────────────────────────────────────────────┐
│ USER ACTION                                                  │
│ User completes hex → clicks "Assess" or "Recommend"        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ COMPONENT: ProcessWireframe.tsx                             │
│ - Collects user responses from hex                          │
│ - Gathers selected research files                           │
│ - Reads brand, projectType, assessmentType                  │
│ - Opens AssessmentModal with data                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ COMPONENT: AssessmentModal.tsx                              │
│ - Determines requestMode (assess/recommend/unified)         │
│ - Loads project type prompt from:                           │
│   • systemProjectTypes.ts (if system type)                  │
│   • projectTypeConfigs state (if custom type)               │
│ - Builds persona list based on hex + template               │
│ - Constructs prompt with:                                   │
│   • Hex context (from stepContentData.ts)                   │
│   • User responses                                          │
│   • Research file content                                   │
│   • Project type prompt                                     │
│   • Persona instructions                                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ UTILITY: databricksAI.ts                                    │
│ Functions:                                                   │
│ - executeAIPrompt() - One-shot AI call                      │
│ - streamAIResponse() - Streaming response                   │
│ - AIConversation class - Multi-turn conversation            │
│                                                              │
│ Sends to backend API with:                                  │
│ - Full constructed prompt                                   │
│ - Model endpoint (from ModelTemplate)                       │
│ - User context (email, role)                                │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ API: /api/databricks/ai/prompt.js OR stream.js             │
│ - Receives prompt + model endpoint                          │
│ - Calls Databricks Model Serving endpoint                   │
│ - Returns AI response (text or stream)                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ DATABRICKS                                                   │
│ - Model Serving endpoint processes prompt                   │
│ - Returns AI-generated assessment/recommendation            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ RESPONSE HANDLING                                            │
│ AssessmentModal.tsx:                                         │
│ - Receives AI response                                       │
│ - Displays to user with citations                           │
│ - Saves to iterationGems (persistent results)               │
│ - Updates citation counts for referenced files              │
└─────────────────────────────────────────────────────────────┘
```

---

### **Flow 2: Knowledge Base File Processing**

```
┌─────────────────────────────────────────────────────────────┐
│ USER ACTION                                                  │
│ Researcher uploads file to Knowledge Base                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ COMPONENT: ResearcherModes.tsx                              │
│ - Uploads file via uploadToKnowledgeBase()                  │
│ - File marked as "unprocessed"                              │
│ - User selects file and clicks "Process Selected"           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ UTILITY: databricksAPI.ts → processKnowledgeBaseFile()     │
│ - Sends fileId + processing model endpoint                  │
│ - Includes availableBrands and availableProjectTypes        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ API: /api/databricks/knowledge-base/process.js             │
│                                                              │
│ STEP 1: Fetch file from Databricks                         │
│ STEP 2: Extract text/images                                │
│ STEP 3: Build AI prompt:                                    │
│                                                              │
│ PROMPT TEMPLATE (hardcoded in process.js):                 │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Analyse this document and provide:                     │ │
│ │ 1. A concise 2-3 sentence summary                      │ │
│ │ 2. 3-5 relevant tags                                   │ │
│ │ 3. The most likely brand (from: [availableBrands])     │ │
│ │ 4. Top 3 project types (from: [availableProjectTypes]) │ │
│ │ 5. The month (1-12 or Unknown)                         │ │
│ │ 6. The year (YYYY or Unknown)                          │ │
│ │                                                         │ │
│ │ Document: [fileName]                                   │ │
│ │ Content: [first 5000 chars]                            │ │
│ │                                                         │ │
│ │ Respond in format:                                     │ │
│ │ SUMMARY: ...                                           │ │
│ │ TAGS: ...                                              │ │
│ │ BRAND: ...                                             │ │
│ │ PROJECT_TYPES: ...                                     │ │
│ │ MONTH: ...                                             │ │
│ │ YEAR: ...                                              │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ STEP 4: Call Databricks AI model                           │
│ STEP 5: Parse AI response                                  │
│ STEP 6: Update file metadata with extracted info           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ RESULT                                                       │
│ - File marked as "processed"                                │
│ - Metadata populated (brand, project type, month, year)     │
│ - Available for researcher to confirm/edit                  │
└─────────────────────────────────────────────────────────────┘
```

---

### **Flow 3: Wisdom Interview (Conversational)**

```
┌─────────────────────────────────────────────────────────────┐
│ USER ACTION                                                  │
│ User selects "Be Interviewed" in Wisdom hex                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ COMPONENT: InterviewDialog.tsx                              │
│                                                              │
│ SYSTEM PROMPT (hardcoded in component):                     │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ You are a professional interviewer...                  │ │
│ │                                                         │ │
│ │ Interview Purpose:                                     │ │
│ │ - Conduct flexible interviews with employees           │ │
│ │ - Gather insights from marketing, creative, retail, etc│ │
│ │                                                         │ │
│ │ Context:                                               │ │
│ │ - Interviewee Role: [userRole]                         │ │
│ │ - Interviewee: [userEmail]                             │ │
│ │                                                         │ │
│ │ Your Approach:                                         │ │
│ │ 1. Start by asking: "What would you like to share      │ │
│ │    your wisdom on?"                                    │ │
│ │ 2. Explore through thoughtful questions                │ │
│ │ 3. Be adaptive and conversational                      │ │
│ │ 4. Maintain professional tone                          │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ - Creates AIConversation instance with system prompt        │
│ - Each user response triggers new AI question               │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ UTILITY: databricksAI.ts → AIConversation class            │
│ - Maintains conversation history                            │
│ - Each .ask() call includes full context                    │
│ - Sends to streaming endpoint                               │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ API: /api/databricks/ai/stream.js                          │
│ - Receives messages array with system prompt + history     │
│ - Streams AI response back to component                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ SAVE TRANSCRIPT                                              │
│ InterviewDialog.tsx:                                         │
│ - Formats interview with header:                            │
│   • Date: YYYY-MM-DD (Month Year)                          │
│   • Topic, participants, role                              │
│ - Saves to Knowledge Base as Wisdom file                    │
│ - AI processing extracts month/year from header             │
└─────────────────────────────────────────────────────────────┘
```

---

### **Flow 4: Synthesis (Generate New Documents)**

```
┌─────────────────────────────────────────────────────────────┐
│ USER ACTION                                                  │
│ Data Scientist selects files → clicks "Execute - New        │
│ Synthesis"                                                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ COMPONENT: ResearcherModes.tsx                              │
│ - Reads selected file contents                              │
│                                                              │
│ PROMPT TEMPLATE:                                             │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Synthesize for [brand] - [projectType]:               │ │
│ │                                                         │ │
│ │ ## 1. [fileName1]                                      │ │
│ │ [file content]                                         │ │
│ │                                                         │ │
│ │ ---                                                    │ │
│ │                                                         │ │
│ │ ## 2. [fileName2]                                      │ │
│ │ [file content]                                         │ │
│ │                                                         │ │
│ │ [Continue for all selected files...]                  │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ - Calls executeAIPrompt() with synthesis prompt             │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ API: /api/databricks/ai/prompt.js                          │
│ - Executes synthesis prompt                                 │
│ - Returns combined analysis                                 │
│ - Saves result as new file in Knowledge Base                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗂️ **FILE REFERENCE MAP**

### **Core Component Files**

| File | Role | Prompts Used |
|------|------|--------------|
| `ProcessWireframe.tsx` | Main workflow orchestrator | Triggers assessments; passes data to AssessmentModal |
| `AssessmentModal.tsx` | AI assessment executor | Builds prompts from project types + personas + hex context |
| `CentralHexView.tsx` | 3-step workflow view | Uses stepContentData for questions |
| `InterviewDialog.tsx` | Wisdom interview UI | Contains hardcoded system prompt for interviewer |
| `ResearcherModes.tsx` | Knowledge Base management | Synthesis prompts, file processing triggers |

### **Data/Configuration Files**

| File | Contains | Used By |
|------|----------|---------|
| `stepContentData.ts` | Hex titles, descriptions, questions | ProcessWireframe, CentralHexView, AssessmentModal |
| `systemProjectTypes.ts` | Built-in project type prompts | ProcessWireframe, AssessmentModal |
| `TemplateManager.tsx` | Workflow visibility config | ProcessWireframe (which hexes to show) |
| `ModelTemplateManager.tsx` | AI model selection | AssessmentModal (which model to use) |

### **Utility Files**

| File | Purpose | Functions |
|------|---------|-----------|
| `databricksAI.ts` | AI execution layer | `executeAIPrompt()`, `streamAIResponse()`, `AIConversation` |
| `databricksAPI.ts` | Databricks API calls | `uploadToKnowledgeBase()`, `processKnowledgeBaseFile()`, etc. |

### **Backend API Files**

| File | Purpose | Prompt Source |
|------|---------|---------------|
| `/api/databricks/ai/prompt.js` | Execute AI prompts | Receives fully-built prompts from frontend |
| `/api/databricks/ai/stream.js` | Stream AI responses | Receives fully-built prompts from frontend |
| `/api/databricks/knowledge-base/process.js` | File processing with AI | **Contains hardcoded metadata extraction prompt** |

---

## 🔑 **KEY INSIGHTS**

### **Where Prompts Are Defined:**

1. **Assessment Prompts:** Built dynamically in `AssessmentModal.tsx` from:
   - Project type prompts (systemProjectTypes.ts or Databricks configs)
   - Hex context (stepContentData.ts)
   - User responses
   - Research file content

2. **Interview Prompts:** Hardcoded in `InterviewDialog.tsx` component

3. **Processing Prompts:** Hardcoded in `/api/databricks/knowledge-base/process.js`

4. **Synthesis Prompts:** Built inline in `ResearcherModes.tsx`

### **The `/data/prompts/` folder:**

**Status:** Currently contains comprehensive prompt template library but **NOT actively integrated** into the assessment flow yet.

**Potential use:** Future enhancement to replace hardcoded prompts with structured templates.

---

## 📝 **SUMMARY**

**Prompt creation in CoHive is distributed across:**

1. **Component-level** (InterviewDialog, AssessmentModal, ResearcherModes)
2. **Data files** (systemProjectTypes, stepContentData)
3. **Backend APIs** (process.js for metadata extraction)
4. **User configurations** (Databricks project_type_configs table)

**The `/data/prompts/` library exists as a structured foundation but is not yet the primary prompt source for assessments.**

For a complete prompt update, you would need to modify prompts in **multiple locations** depending on the use case.
