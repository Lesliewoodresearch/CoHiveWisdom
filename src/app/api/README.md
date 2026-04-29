# CoHive API Documentation

## Overview

CoHive's backend API is built on **Vercel Serverless Functions** that proxy requests to Databricks. This architecture provides secure, scalable access to Databricks resources without exposing credentials to the frontend.

## Architecture

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────┐
│   CoHive    │─────▶│ Vercel Serverless│─────▶│ Databricks  │
│  Frontend   │      │   Functions      │      │   Backend   │
│ (React)     │      │  (Node.js API)   │      │ (AI + Data) │
└─────────────┘      └──────────────────┘      └─────────────┘
```

**Key Benefits:**
- ✅ **Secure** - Credentials stored server-side only
- ✅ **Scalable** - Auto-scales with demand
- ✅ **Cost-Effective** - Pay per invocation
- ✅ **Type-Safe** - Server-side validation
- ✅ **Centralized Config** - All credentials via `validateEnv.js`

## Directory Structure

```
/api/
├── README.md                          # This file
├── health.js                          # Health check endpoint
├── databricks-execute.js              # Legacy: Generic execution
├── databricks-list-files.js           # Legacy: List Databricks files
├── databricks-read-file.js            # Legacy: Read file content
├── databricks_files.py                # Legacy Python API (deprecated)
├── fix-duplicate.js                   # Utility: Fix duplicate entries
│
├── databricks/                        # Main API organization
│   ├── auth.js                        # OAuth & authentication
│   ├── user.js                        # User profile operations
│   ├── files.js                       # File operations
│   ├── upload-to-databricks.js        # File upload handler
│   │
│   ├── ai/                            # AI & prompt operations
│   │   ├── agent.js                   # AI agent interactions
│   │   ├── prompt.js                  # Prompt execution
│   │   └── summarize.js               # Content summarization
│   │
│   ├── assessment/                    # Assessment system
│   │   └── run.js                     # Multi-round persona assessments
│   │
│   ├── gems/                          # Gems (saved insights)
│   │   ├── list.js                    # List user's gems
│   │   └── save.js                    # Save new gem
│   │
│   └── knowledge-base/                # Knowledge base operations
│       ├── list.js                    # List KB files
│       ├── read.js                    # Read file content
│       ├── upload.js                  # Upload file to KB
│       ├── approve.js                 # Approve pending file
│       ├── update.js                  # Update file metadata
│       ├── delete.js                  # Delete file
│       ├── classify.js                # AI-based classification
│       └── process.js                 # Process file content
│
├── setup/                             # Initialization
│   └── init.js                        # Database setup
│
└── utils/                             # Shared utilities
    ├── validateEnv.js                 # Environment config (SERVER-SIDE ONLY)
    └── logger.js                      # Logging utility
```

## Core Endpoints

### Health Check

**Endpoint:** `GET /api/health`

```javascript
// Response
{
  "status": "healthy",
  "service": "CoHive API",
  "timestamp": "2026-03-22T12:00:00.000Z",
  "version": "1.0.0"
}
```

### Authentication

**Endpoint:** `POST /api/databricks/auth`

Handles Databricks OAuth authentication flow.

**Request Body:**
```json
{
  "code": "oauth_authorization_code",
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

### User Profile

**Endpoint:** `GET /api/databricks/user`

Get current user information.

**Query Parameters:**
- `accessToken` - Databricks access token
- `workspaceHost` - Workspace hostname

**Response:**
```json
{
  "email": "user@company.com",
  "userName": "user",
  "displayName": "User Name",
  "active": true
}
```

## Knowledge Base API

### List Files

**Endpoint:** `GET /api/databricks/knowledge-base/list`

List all files in the knowledge base with optional filtering.

**Query Parameters:**
- `brand` (optional) - Filter by brand
- `category` (optional) - Filter by project type
- `fileType` (optional) - Filter by type (Synthesis, Wisdom, etc.)
- `approvalStatus` (optional) - Filter by status (approved, pending, rejected)

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
      "citationCount": 15
    }
  ],
  "count": 1
}
```

### Read File

**Endpoint:** `GET /api/databricks/knowledge-base/read`

Read the content of a knowledge base file.

**Query Parameters:**
- `fileId` - File identifier

**Response:**
```json
{
  "fileId": "file_123",
  "fileName": "Market Research.pdf",
  "content": "base64_encoded_content",
  "encoding": "base64",
  "mimeType": "application/pdf"
}
```

### Upload File

**Endpoint:** `POST /api/databricks/knowledge-base/upload`

Upload a new file to the knowledge base.

**Request Body (multipart/form-data):**
```
file: [File object]
scope: "general" | "category" | "brand"
fileType: "Synthesis" | "Wisdom" | "External"
brand: "Nike" (if scope=brand)
projectType: "Creative Messaging" (optional)
tags: ["tag1", "tag2"] (optional)
insightType: "Brand" | "Category" | "General" (optional)
inputMethod: "Text" | "Voice" | "Photo" | "Video" | "File" (optional)
```

**Response:**
```json
{
  "success": true,
  "fileId": "file_456",
  "filePath": "dbfs:/knowledge-base/brand/Nike/synthesis/file.pdf",
  "approvalStatus": "pending"
}
```

### Approve File

**Endpoint:** `POST /api/databricks/knowledge-base/approve`

Approve a pending knowledge base file (requires research-leader role).

**Request Body:**
```json
{
  "fileId": "file_456",
  "approved": true,
  "reviewerEmail": "leader@company.com",
  "reviewNotes": "Approved for general use"
}
```

**Response:**
```json
{
  "success": true,
  "fileId": "file_456",
  "approvalStatus": "approved"
}
```

### Update Metadata

**Endpoint:** `PATCH /api/databricks/knowledge-base/update`

Update file metadata.

**Request Body:**
```json
{
  "fileId": "file_456",
  "updates": {
    "tags": ["updated", "tags"],
    "contentSummary": "New summary"
  }
}
```

### Delete File

**Endpoint:** `DELETE /api/databricks/knowledge-base/delete`

Delete a file from the knowledge base.

**Request Body:**
```json
{
  "fileId": "file_456"
}
```

## Assessment API

### Run Assessment

**Endpoint:** `POST /api/databricks/assessment/run`

Execute a multi-round persona-based assessment.

**Request Body:**
```json
{
  "hexId": "Buyers",
  "hexLabel": "Buyers",
  "brand": "Nike",
  "projectType": "Creative Messaging",
  "assessmentTypes": ["persona-response"],
  "userSolution": "Check the attached campaign creative",
  "ideasFile": {
    "fileName": "campaign.pdf",
    "content": "base64_content",
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
  "rounds": [
    {
      "roundNumber": 1,
      "responses": [
        {
          "personaId": "consumers-b2c-loyal",
          "personaName": "Loyal Consumer",
          "response": "Analysis from persona perspective...",
          "modelUsed": "databricks-claude-sonnet-4-6",
          "tokensUsed": 1234
        }
      ]
    }
  ],
  "factCheck": {
    "claims": [...],
    "verified": [...],
    "questionable": [...]
  },
  "summary": "Overall synthesis of all responses...",
  "citedFiles": [
    {
      "fileId": "file_123",
      "fileName": "Market Research.pdf",
      "citationCount": 3
    }
  ]
}
```

## AI Operations

### Execute Prompt

**Endpoint:** `POST /api/databricks/ai/prompt`

Execute a custom AI prompt.

**Request Body:**
```json
{
  "prompt": "Your prompt here",
  "systemPrompt": "System instructions",
  "modelId": "databricks-claude-sonnet-4-6",
  "maxTokens": 2000,
  "temperature": 0.7,
  "conversationHistory": [
    { "role": "user", "content": "Previous message" },
    { "role": "assistant", "content": "Previous response" }
  ]
}
```

**Response:**
```json
{
  "content": "AI generated response...",
  "modelId": "databricks-claude-sonnet-4-6",
  "usage": {
    "promptTokens": 100,
    "completionTokens": 500,
    "totalTokens": 600
  },
  "finishReason": "stop"
}
```

### Summarize Content

**Endpoint:** `POST /api/databricks/ai/summarize`

Generate a summary of provided content.

**Request Body:**
```json
{
  "content": "Long content to summarize...",
  "maxLength": 200,
  "style": "concise" | "detailed"
}
```

## Gems (Saved Insights)

### List Gems

**Endpoint:** `GET /api/databricks/gems/list`

List user's saved insights.

**Query Parameters:**
- `userEmail` - User email
- `brand` (optional) - Filter by brand
- `hexId` (optional) - Filter by hex

**Response:**
```json
{
  "gems": [
    {
      "id": "gem_123",
      "hexId": "Buyers",
      "brand": "Nike",
      "projectType": "Creative Messaging",
      "insight": "Key finding from assessment",
      "savedAt": "2026-03-20T14:00:00Z",
      "userEmail": "user@company.com"
    }
  ]
}
```

### Save Gem

**Endpoint:** `POST /api/databricks/gems/save`

Save a new insight.

**Request Body:**
```json
{
  "hexId": "Buyers",
  "brand": "Nike",
  "projectType": "Creative Messaging",
  "insight": "This is a key finding...",
  "userEmail": "user@company.com",
  "metadata": {
    "personasUsed": ["consumers-b2c-loyal"],
    "filesReferenced": ["file_123"]
  }
}
```

## Environment Configuration

All API endpoints use centralized configuration via `/api/utils/validateEnv.js`:

```javascript
import { getDatabricksConfig } from '../utils/validateEnv.js';

const { workspaceHost, accessToken, warehouseId, schema } = getDatabricksConfig();
```

**Required Environment Variables:**
```env
DATABRICKS_WORKSPACE_HOST=your-workspace.cloud.databricks.com
DATABRICKS_ACCESS_TOKEN=your-server-token
DATABRICKS_WAREHOUSE_ID=your-warehouse-id  # Optional
DATABRICKS_SCHEMA=your-schema              # Optional
```

**Security:**
- ✅ All credentials server-side only
- ✅ Never sent to client
- ✅ Validated on API startup
- ✅ Consistent across all endpoints

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Descriptive error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional context"
  }
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (authentication failure)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `405` - Method Not Allowed
- `500` - Internal Server Error

## Local Development

Test API endpoints locally:

```bash
# Install Vercel CLI
npm i -g vercel

# Set environment variables
export DATABRICKS_WORKSPACE_HOST=...
export DATABRICKS_ACCESS_TOKEN=...

# Run local development server
vercel dev
```

API will be available at `http://localhost:3000/api/*`

## Deployment

API endpoints deploy automatically to Vercel:

```bash
# Deploy to production
vercel --prod

# Or connect GitHub repo for auto-deployment on push
```

Set environment variables in Vercel project settings.

## Best Practices

1. **Use getDatabricksConfig()** - Never hardcode credentials
2. **Validate inputs** - Check all request parameters server-side
3. **Handle errors gracefully** - Return consistent error responses
4. **Log appropriately** - Use `/api/utils/logger.js` for structured logging
5. **Secure by default** - All sensitive operations server-side only

## Migration Notes

### Legacy Endpoints (Deprecated)

These endpoints are maintained for backward compatibility but should be migrated to new structure:

- `/api/databricks-execute.js` → `/api/databricks/ai/prompt.js`
- `/api/databricks-list-files.js` → `/api/databricks/knowledge-base/list.js`
- `/api/databricks-read-file.js` → `/api/databricks/knowledge-base/read.js`
- `/api/databricks_files.py` → Replaced by Node.js serverless functions

## See Also

- [/docs/API_DOCUMENTATION.md](../docs/API_DOCUMENTATION.md) - Detailed API reference
- [/docs/DATABRICKS_SETUP.md](../docs/DATABRICKS_SETUP.md) - Databricks configuration
- [/docs/Guidelines.md](../docs/Guidelines.md) - Development guidelines
- [/models/README.md](../models/README.md) - Model system architecture

---

**Last Updated:** March 2026  
**Location:** `/api/README.md`
