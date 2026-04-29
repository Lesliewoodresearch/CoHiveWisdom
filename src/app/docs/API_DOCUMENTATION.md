# CoHive API Documentation

## Overview

CoHive uses **Vercel Serverless Functions** as the backend API layer to communicate with Databricks. All API endpoints are located in the `/api` directory and are deployed as serverless functions on Vercel.

For detailed implementation notes, see [/api/README.md](../api/README.md).

## Architecture

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────┐
│   CoHive    │─────▶│ Vercel Serverless│─────▶│ Databricks  │
│  Frontend   │      │   Functions      │      │   Backend   │
│  (React)    │      │  (Node.js API)   │      │ (AI + Data) │
└─────────────┘      └──────────────────┘      └─────────────┘
```

**Flow:**
1. Frontend makes request to `/api/*` endpoint
2. Vercel serverless function receives request
3. Function validates request and retrieves credentials from environment
4. Function proxies request to Databricks with OAuth token
5. Databricks processes and returns response
6. Vercel function forwards response to frontend

**Security:**
- ✅ All Databricks credentials stored server-side only (environment variables)
- ✅ Never sent to or accessible from frontend
- ✅ Centralized via `getDatabricksConfig()` in `/api/utils/validateEnv.js`
- ✅ Validated on API startup

## Quick Reference

### Core Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Health check |
| `/api/databricks/auth` | POST | OAuth authentication |
| `/api/databricks/user` | GET | User profile |
| `/api/databricks/knowledge-base/list` | GET | List KB files |
| `/api/databricks/knowledge-base/read` | GET | Read file content |
| `/api/databricks/knowledge-base/upload` | POST | Upload file to KB |
| `/api/databricks/knowledge-base/approve` | POST | Approve pending file |
| `/api/databricks/assessment/run` | POST | Run multi-round assessment |
| `/api/databricks/ai/prompt` | POST | Execute AI prompt |
| `/api/databricks/ai/summarize` | POST | Summarize content |
| `/api/databricks/gems/list` | GET | List saved insights |
| `/api/databricks/gems/save` | POST | Save new insight |

## API Endpoints

### 1. Health Check

**Endpoint:** `GET /api/health`

**Description:** Verifies the API is running

**Response:**
```json
{
  "status": "healthy",
  "service": "CoHive API",
  "timestamp": "2026-03-22T12:00:00.000Z",
  "version": "1.0.0"
}
```

---

### 2. Authentication

#### OAuth Login

**Endpoint:** `POST /api/databricks/auth`

**Description:** Exchange OAuth authorization code for access token

**Request Body:**
```json
{
  "code": "authorization_code_from_databricks",
  "redirectUri": "https://app.cohive.com/oauth/callback"
}
```

**Response:**
```json
{
  "accessToken": "dapi...",
  "refreshToken": "dapi...",
  "expiresIn": 3600,
  "workspaceHost": "workspace.cloud.databricks.com"
}
```

#### Get User Profile

**Endpoint:** `GET /api/databricks/user`

**Description:** Get current authenticated user information

**Query Parameters:**
- `accessToken` (required) - Databricks OAuth access token
- `workspaceHost` (required) - Workspace hostname

**Response:**
```json
{
  "email": "user@company.com",
  "userName": "user",
  "displayName": "User Name",
  "active": true
}
```

---

### 3. Knowledge Base Operations

#### List Files

**Endpoint:** `GET /api/databricks/knowledge-base/list`

**Description:** List all files in the knowledge base with optional filtering

**Query Parameters:**
- `brand` (optional) - Filter by brand name
- `category` (optional) - Filter by project type/category
- `fileType` (optional) - Filter by type: `Synthesis`, `Wisdom`, `External`
- `approvalStatus` (optional) - Filter by status: `approved`, `pending`, `rejected`
- `userEmail` (optional) - Filter files uploaded by specific user

**Response:**
```json
{
  "files": [
    {
      "id": "file_123",
      "fileName": "Market Research Q1 2026.pdf",
      "brand": "Nike",
      "projectType": "Creative Messaging",
      "fileType": "Synthesis",
      "approvalStatus": "approved",
      "uploadedBy": "analyst@company.com",
      "uploadDate": "2026-03-15T10:30:00Z",
      "tags": ["quarterly", "research"],
      "citationCount": 15,
      "contentSummary": "Q1 market analysis for Nike",
      "filePath": "dbfs:/knowledge-base/brand/Nike/synthesis/..."
    }
  ],
  "count": 1
}
```

#### Read File Content

**Endpoint:** `GET /api/databricks/knowledge-base/read`

**Description:** Read the content of a specific knowledge base file

**Query Parameters:**
- `fileId` (required) - File identifier

**Response:**
```json
{
  "fileId": "file_123",
  "fileName": "Market Research.pdf",
  "content": "base64_encoded_content_here",
  "encoding": "base64",
  "mimeType": "application/pdf",
  "metadata": {
    "brand": "Nike",
    "projectType": "Creative Messaging",
    "fileType": "Synthesis",
    "approvalStatus": "approved"
  }
}
```

#### Upload File

**Endpoint:** `POST /api/databricks/knowledge-base/upload`

**Description:** Upload a new file to the knowledge base

**Request Body (multipart/form-data):**
```
file: [File object]
scope: "general" | "category" | "brand"
fileType: "Synthesis" | "Wisdom" | "External"
brand: "Nike"                               (required if scope=brand)
projectType: "Creative Messaging"           (optional)
tags: ["tag1", "tag2"]                      (optional)
contentSummary: "Brief description"         (optional)
insightType: "Brand" | "Category" | "General"  (optional, for Wisdom)
inputMethod: "Text" | "Voice" | "Photo" | "Video" | "File"  (optional, for Wisdom)
userEmail: "user@company.com"               (required)
userRole: "research-analyst" | "research-leader" | "data-scientist"  (required)
```

**Response:**
```json
{
  "success": true,
  "fileId": "file_456",
  "filePath": "dbfs:/knowledge-base/brand/Nike/synthesis/file.pdf",
  "approvalStatus": "pending",
  "message": "File uploaded successfully and pending approval"
}
```

**Notes:**
- Research analysts and data scientists: Files go to "pending" status
- Research leaders: Files auto-approved to "approved" status

#### Approve File

**Endpoint:** `POST /api/databricks/knowledge-base/approve`

**Description:** Approve or reject a pending knowledge base file (requires research-leader role)

**Request Body:**
```json
{
  "fileId": "file_456",
  "approved": true,
  "reviewerEmail": "leader@company.com",
  "reviewNotes": "Approved for general use across organization"
}
```

**Response:**
```json
{
  "success": true,
  "fileId": "file_456",
  "approvalStatus": "approved",
  "reviewedBy": "leader@company.com",
  "reviewedAt": "2026-03-22T15:30:00Z"
}
```

#### Update File Metadata

**Endpoint:** `PATCH /api/databricks/knowledge-base/update`

**Description:** Update metadata for an existing file

**Request Body:**
```json
{
  "fileId": "file_456",
  "updates": {
    "tags": ["updated", "tags"],
    "contentSummary": "New summary text",
    "brand": "Nike",
    "projectType": "Product Launch"
  }
}
```

**Response:**
```json
{
  "success": true,
  "fileId": "file_456",
  "updated": true
}
```

#### Delete File

**Endpoint:** `DELETE /api/databricks/knowledge-base/delete`

**Description:** Delete a file from the knowledge base

**Request Body:**
```json
{
  "fileId": "file_456",
  "userEmail": "user@company.com"
}
```

**Response:**
```json
{
  "success": true,
  "fileId": "file_456",
  "deleted": true
}
```

**Notes:**
- Only the file uploader or a research leader can delete files

---

### 4. Assessment Operations

#### Run Multi-Round Assessment

**Endpoint:** `POST /api/databricks/assessment/run`

**Description:** Execute a multi-round persona-based assessment with optional fact-checking and summarization

**Request Body:**
```json
{
  "hexId": "Buyers",
  "hexLabel": "Buyers",
  "brand": "Nike",
  "projectType": "Creative Messaging",
  "assessmentTypes": ["persona-response", "recommendation"],
  "userSolution": "Please evaluate this campaign creative",
  "ideasFile": {
    "fileName": "campaign.pdf",
    "content": "base64_encoded_content",
    "mimeType": "application/pdf"
  },
  "selectedFileIds": ["file_123", "file_456"],
  "personas": ["consumers-b2c-loyal", "consumers-b2c-research"],
  "modelId": "databricks-claude-sonnet-4-6",
  "conversationType": "multi-round",
  "roundCount": 3,
  "includeSummarizer": true,
  "includeFactChecker": true
}
```

**Response:**
```json
{
  "success": true,
  "executionId": "exec_789",
  "hexId": "Buyers",
  "brand": "Nike",
  "projectType": "Creative Messaging",
  "rounds": [
    {
      "roundNumber": 1,
      "responses": [
        {
          "personaId": "consumers-b2c-loyal",
          "personaName": "Loyal Consumer",
          "response": "Detailed analysis from this persona's perspective...",
          "modelUsed": "databricks-claude-sonnet-4-6",
          "tokensUsed": 1234,
          "timestamp": "2026-03-22T16:00:00Z"
        },
        {
          "personaId": "consumers-b2c-research",
          "personaName": "Research-Driven Consumer",
          "response": "Analysis from research-oriented perspective...",
          "modelUsed": "databricks-claude-sonnet-4-6",
          "tokensUsed": 1156,
          "timestamp": "2026-03-22T16:00:15Z"
        }
      ]
    },
    {
      "roundNumber": 2,
      "responses": [...]
    },
    {
      "roundNumber": 3,
      "responses": [...]
    }
  ],
  "factCheck": {
    "claims": [
      {
        "claim": "Nike is the market leader",
        "status": "verified",
        "source": "file_123",
        "confidence": "high"
      }
    ],
    "summary": "All major claims verified against knowledge base files"
  },
  "summary": "Comprehensive synthesis of all persona responses across 3 rounds...",
  "citedFiles": [
    {
      "fileId": "file_123",
      "fileName": "Market Research.pdf",
      "citationCount": 5
    },
    {
      "fileId": "file_456",
      "fileName": "Consumer Survey.xlsx",
      "citationCount": 3
    }
  ],
  "totalTokensUsed": 8543,
  "executionTime": 45.2
}
```

**Notes:**
- Knowledge base files are fetched server-side (never trusted from frontend)
- System prompts and KB content stay server-side
- Only AI-generated responses sent to frontend
- Persona order is randomized per Python `random.shuffle()` behavior
- Conversation type can be "multi-round" or "incremental"

---

### 5. AI Operations

#### Execute Custom Prompt

**Endpoint:** `POST /api/databricks/ai/prompt`

**Description:** Execute a custom AI prompt with selected model

**Request Body:**
```json
{
  "prompt": "Your prompt text here",
  "systemPrompt": "You are a helpful AI assistant...",
  "modelId": "databricks-claude-sonnet-4-6",
  "maxTokens": 2000,
  "temperature": 0.7,
  "topP": 0.9,
  "conversationHistory": [
    {
      "role": "user",
      "content": "Previous user message"
    },
    {
      "role": "assistant",
      "content": "Previous AI response"
    }
  ]
}
```

**Response:**
```json
{
  "content": "AI generated response based on the prompt...",
  "modelId": "databricks-claude-sonnet-4-6",
  "usage": {
    "promptTokens": 150,
    "completionTokens": 500,
    "totalTokens": 650
  },
  "finishReason": "stop",
  "timestamp": "2026-03-22T16:30:00Z"
}
```

#### Summarize Content

**Endpoint:** `POST /api/databricks/ai/summarize`

**Description:** Generate a summary of provided content

**Request Body:**
```json
{
  "content": "Long content text to summarize...",
  "maxLength": 200,
  "style": "concise",
  "modelId": "databricks-claude-sonnet-4-6"
}
```

**Response:**
```json
{
  "summary": "Concise summary of the content...",
  "originalLength": 5000,
  "summaryLength": 180,
  "modelUsed": "databricks-claude-sonnet-4-6",
  "tokensUsed": 420
}
```

---

### 6. Gems (Saved Insights)

#### List Gems

**Endpoint:** `GET /api/databricks/gems/list`

**Description:** List user's saved insights

**Query Parameters:**
- `userEmail` (required) - User email address
- `brand` (optional) - Filter by brand
- `hexId` (optional) - Filter by workflow hex
- `projectType` (optional) - Filter by project type

**Response:**
```json
{
  "gems": [
    {
      "id": "gem_123",
      "hexId": "Buyers",
      "hexLabel": "Buyers",
      "brand": "Nike",
      "projectType": "Creative Messaging",
      "insight": "Key finding: Loyal consumers respond better to emotional appeals",
      "savedAt": "2026-03-20T14:00:00Z",
      "userEmail": "user@company.com",
      "metadata": {
        "personasUsed": ["consumers-b2c-loyal"],
        "filesReferenced": ["file_123"],
        "assessmentId": "exec_789"
      }
    }
  ],
  "count": 1
}
```

#### Save Gem

**Endpoint:** `POST /api/databricks/gems/save`

**Description:** Save a new insight from an assessment

**Request Body:**
```json
{
  "hexId": "Buyers",
  "hexLabel": "Buyers",
  "brand": "Nike",
  "projectType": "Creative Messaging",
  "insight": "This is a key finding from the assessment...",
  "userEmail": "user@company.com",
  "metadata": {
    "personasUsed": ["consumers-b2c-loyal", "consumers-b2c-research"],
    "filesReferenced": ["file_123", "file_456"],
    "assessmentId": "exec_789",
    "roundNumber": 2
  }
}
```

**Response:**
```json
{
  "success": true,
  "gemId": "gem_456",
  "savedAt": "2026-03-22T17:00:00Z"
}
```

---

## Authentication

All API endpoints (except `/api/health`) use server-side Databricks credentials configured via environment variables:

**Required Environment Variables:**
```env
DATABRICKS_WORKSPACE_HOST=your-workspace.cloud.databricks.com
DATABRICKS_ACCESS_TOKEN=your-server-token
DATABRICKS_WAREHOUSE_ID=your-warehouse-id  # Optional
DATABRICKS_SCHEMA=your-schema              # Optional
```

**Security:**
- ✅ All credentials stored server-side only
- ✅ Never sent to frontend
- ✅ Validated on API startup via `getDatabricksConfig()`
- ✅ Consistent across all endpoints

**User Authentication:**
- Frontend handles Databricks OAuth for user identity
- User access tokens passed to API for user-scoped operations
- Server credentials used for knowledge base and AI operations

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Descriptive error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "value",
    "context": "Additional information"
  }
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (missing or invalid parameters)
- `401` - Unauthorized (authentication failure)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `405` - Method Not Allowed
- `500` - Internal Server Error
- `503` - Service Unavailable (Databricks connection issue)

---

## Local Development

To test API endpoints locally:

```bash
# Install Vercel CLI
npm i -g vercel

# Set environment variables
export DATABRICKS_WORKSPACE_HOST=your-workspace.cloud.databricks.com
export DATABRICKS_ACCESS_TOKEN=your-token

# Run local development server
vercel dev
```

API endpoints available at: `http://localhost:3000/api/*`

---

## Deployment

API endpoints are automatically deployed to Vercel:

```bash
# Deploy to production
vercel --prod
```

**Or use GitHub integration:**
1. Push to GitHub
2. Import project in Vercel dashboard
3. Configure environment variables in Vercel project settings
4. Auto-deploy on every push

**Environment Variables in Vercel:**
Set in Project Settings → Environment Variables:
- `DATABRICKS_WORKSPACE_HOST`
- `DATABRICKS_ACCESS_TOKEN`
- `DATABRICKS_WAREHOUSE_ID` (optional)
- `DATABRICKS_SCHEMA` (optional)

---

## Rate Limiting

Databricks API calls are subject to:
- **Workspace limits:** Depends on Databricks tier
- **Vercel limits:** 100 requests/10 seconds (Hobby), Unlimited (Pro)

Consider implementing:
- Request queuing for high-volume operations
- Caching for frequently accessed files
- Batch operations where possible

---

## Best Practices

1. **Use Environment Config** - Always use `getDatabricksConfig()` from `/api/utils/validateEnv.js`
2. **Validate Inputs** - Check all request parameters server-side
3. **Handle Errors Gracefully** - Return consistent error responses
4. **Log Appropriately** - Use `/api/utils/logger.js` for structured logging
5. **Secure by Default** - Keep all sensitive operations server-side
6. **Version Your APIs** - Consider versioning for breaking changes
7. **Document Changes** - Update this file when adding/modifying endpoints

---

## File Structure Reference

```
/api/
├── databricks/
│   ├── auth.js                    # OAuth & authentication
│   ├── user.js                    # User profile
│   ├── ai/
│   │   ├── agent.js               # AI agent interactions
│   │   ├── prompt.js              # Custom prompts
│   │   └── summarize.js           # Summarization
│   ├── assessment/
│   │   └── run.js                 # Multi-round assessments
│   ├── gems/
│   │   ├── list.js                # List gems
│   │   └── save.js                # Save gems
│   └── knowledge-base/
│       ├── list.js                # List files
│       ├── read.js                # Read content
│       ├── upload.js              # Upload files
│       ├── approve.js             # Approve files
│       ├── update.js              # Update metadata
│       └── delete.js              # Delete files
└── utils/
    ├── validateEnv.js             # Environment config
    └── logger.js                  # Logging utility
```

---

## See Also

- [/api/README.md](../api/README.md) - Implementation details
- [/docs/DATABRICKS_SETUP.md](./DATABRICKS_SETUP.md) - Databricks configuration
- [/docs/KNOWLEDGE_BASE_ACCESS_POLICY.md](./KNOWLEDGE_BASE_ACCESS_POLICY.md) - Access control
- [/models/README.md](../models/README.md) - Model system
- [/docs/Guidelines.md](./Guidelines.md) - Development guidelines

---

**Version:** 2.0.0  
**Last Updated:** March 2026  
**Location:** `/docs/API_DOCUMENTATION.md`
