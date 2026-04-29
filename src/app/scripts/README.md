# Scripts

This folder contains draft API handlers and utility scripts that are not yet integrated into the main codebase.

## Contents

### Draft API Routes

**`kb-approve-api.ts`** - Draft implementation of Knowledge Base file approval endpoint
- Not yet wired up to the application
- Uses REST API to update file_metadata table
- Reference implementation for `/api/databricks/knowledge-base/approve.js`

**`kb-list-api.ts`** - Draft implementation of Knowledge Base file listing endpoint
- Not yet wired up to the application
- Supports filtering by scope, category, brand, fileType, approval status
- Reference implementation for `/api/databricks/knowledge-base/list.js`

**`assessment-run-draft.js`** - Earlier version of the multi-round assessment system
- Draft/reference implementation
- Current production version: `/api/databricks/assessment/run.js`
- Kept for historical reference

## Purpose

These files serve as:
1. **Reference Implementations** - Early drafts of API endpoints
2. **Development History** - Shows evolution of the system
3. **Code Snippets** - Useful patterns that may be referenced

## Status

⚠️ **These files are NOT active in the application**

They are kept for reference only. Do not import or use them directly.

## Production Endpoints

The current production API endpoints are located in:
- `/api/databricks/knowledge-base/` - Knowledge base operations
- `/api/databricks/assessment/` - Assessment system
- `/api/databricks/ai/` - AI operations
- `/api/databricks/gems/` - Saved insights

See `/api/README.md` for complete API documentation.

---

**Location:** `/scripts/`  
**Last Updated:** March 2026
