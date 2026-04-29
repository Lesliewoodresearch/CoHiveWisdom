# KB Approval & Metadata Editing

## Overview

File approval and metadata editing both write directly to Databricks `knowledge_base.cohive.file_metadata`. Changes persist immediately — there is no local-only state for approval status.

---

## Approval

### How it works

`handleToggleApproval` in `ProcessWireframe` is the single source of truth for approval state. It:

1. Applies an **optimistic local update** immediately so the UI responds instantly
2. Calls `approveKnowledgeBaseFile` (→ `approve.js`) or `unapproveKnowledgeBaseFile` (→ `unapprove.js`) in Databricks
3. **Rolls back** the optimistic update if the Databricks write fails, and shows an error
4. Updates `localStorage` only after the Databricks write succeeds

### approve.js

Writes to Databricks:
```sql
UPDATE knowledge_base.cohive.file_metadata
SET is_approved = TRUE,
    approver_email = '...',
    approval_date = CURRENT_TIMESTAMP(),
    approval_notes = '...',
    updated_at = CURRENT_TIMESTAMP()
WHERE file_id = '...'
```

Pre-checks that the file exists before writing. Returns a 404 with the 10 most recent `file_id` values if the file isn't found — useful for diagnosing ID mismatches.

**Important:** The verify-after-write SELECT was removed. Databricks SQL warehouses have a short propagation delay between a committed UPDATE and it being visible to a subsequent SELECT in the same request cycle. `updateResponse.ok = true` is the correct signal that the write committed.

### unapprove.js

Sets `is_approved = FALSE` and clears `approver_email` and `approval_date`.

---

## Metadata Editing

### What can be edited

| Field | Where |
|---|---|
| File name | Inline rename (✏️) or edit modal |
| AI Summary | Edit modal only |
| Tags | Edit modal only |
| File type / Example flag | Edit modal only |

### Inline rename

Click the ✏️ icon on any file row. Type the new name and press Enter or click Save. Escape cancels. Uses `updateKnowledgeBaseMetadata` with `{ fileName }`.

### Edit modal

Click the 📄 icon to open the full edit modal. Available for both pending and approved files. All fields editable. Saves only changed fields — if nothing changed, Save Changes is disabled.

After a successful save:
- `onRefreshFiles()` is called → `loadKnowledgeBaseFiles()` re-fetches from Databricks
- The file list updates immediately with the new values
- No page reload needed

### update.js

Builds a dynamic `SET` clause from whichever fields are present in the request body. Only provided fields are updated — others are untouched. Validates `fileType` against the allowed enum before writing.

```sql
UPDATE knowledge_base.cohive.file_metadata
SET file_name = '...',      -- if provided
    content_summary = '...', -- if provided
    tags = '...',           -- if provided
    file_type = '...',      -- if provided (Example, Synthesis, etc.)
    updated_at = CURRENT_TIMESTAMP()
WHERE file_id = '...'
```

---

## Inline Metadata Panel

Click **▼** on any file row to expand the metadata panel without opening the modal. Shows:
- Type, Brand, Project Type, Upload date, Source path
- Example file callout (if applicable)
- For Research Leaders: all fields are directly editable inline. Save applies changes to Databricks immediately.

---

## Troubleshooting

**Approval saves but file still shows as unapproved on reload**
→ The `file_id` sent to `approve.js` doesn't match any row. Check server logs for `[KB Approve] File "..." NOT FOUND` — the log includes the 10 most recent file IDs from the table. This usually means the frontend is using a local ID from `localStorage` rather than the real Databricks `file_id`.

**Rename saves but old name still shows**
→ `onRefreshFiles` wasn't called, or `loadKnowledgeBaseFiles` failed silently. Check the network tab for a failed GET to `/api/databricks/knowledge-base/list`.

**Update returns 500 "Identifier already declared"**
→ The old `update.js` in your project had a duplicate `fileName` variable declaration. Replace with the new `update.js` which uses `updatedFileName` for the post-fetch variable.
