# Knowledge Base File Management

## Overview

The Knowledge Base (KB) file management system allows Research Leaders to upload, process, approve, rename, and categorise files in Databricks. Files flow through a pipeline from upload → process → approve before they are available to AI assessments.

---

## File Pipeline

```
Upload (any user)
      ↓
Pending Queue — unprocessed files appear here
      ↓
Process — AI extracts text, generates summary + tags
      ↓
Pending Approval — processed files ready for review
      ↓
Approve (Research Leader) — file becomes available in Enter hex
```

---

## Accessing File Management

Research hex → **Read/Edit/Approve** mode (requires `canApproveResearch` permission — Research Leader or Data Scientist role).

---

## Processing Files

Processing converts non-text files to a searchable plain-text version:

- **PDF** — sent to the vision model for full text extraction. Handles both text-layer and scanned PDFs.
- **DOCX/DOC** — extracted via mammoth
- **XLSX/XLS** — all sheets converted to CSV
- **PPTX/PPT** — slide text extracted via XML parsing
- **Images** (JPG, PNG, GIF, WEBP) — described by the vision model
- **TXT, MD, CSV** — indexed as-is, no conversion needed
- **Findings files** — excluded from the processing queue. They are iteration outputs, not source material.

The processing model is configured in **Model Templates** → "Document Processing Model". It defaults to `databricks-claude-sonnet-4-6` (vision-capable). This is separate from the run model used for assessments.

**Output:** A new `_txt.txt` file is saved alongside the original in the same Databricks Volumes path. Both files get their own `file_id` in `file_metadata`. The original is preserved unchanged.

---

## Approving Files

Clicking **Approve File** in the preview modal:

1. Sets `is_approved = TRUE` in `knowledge_base.cohive.file_metadata`
2. Writes `approver_email`, `approval_date`, and `approval_notes`
3. Re-fetches the pending queue to confirm the file is gone
4. The file immediately becomes available in the Enter hex file selector

**Note:** Approval is permanent in Databricks. Unapproving a file sets `is_approved = FALSE` and clears the approver fields.

---

## Editing Metadata

Research Leaders can edit file metadata in two ways:

### From the approval queue (pending files)
Click **Review & Approve** on any pending file to open the preview modal. All fields are editable before approving:
- **File name** — editable inline at the top of the modal
- **AI Summary** — the auto-generated summary can be corrected or improved
- **Tags** — comma-separated, fully editable
- **Mark as Example** — toggle to designate as a cross-brand reference file (see Example Files below)

### From the approved files list
Each file row in the "Select a File" list has two action buttons (Research Leaders only):
- **✏️ Rename** — inline rename without opening the modal. Press Enter to save or Escape to cancel.
- **📄 Edit Metadata** — opens the same full edit modal used for the approval queue. All fields editable including the Example toggle.

Click **▼** on any file row to expand an inline metadata panel showing type, brand, project type, upload date, source path, and Example status. Research Leaders can edit all fields directly in this panel without opening the modal.

---

## Renaming Files

A renamed file is updated in `file_metadata` immediately. The frontend re-fetches from Databricks after save so the new name appears everywhere (Enter hex selector, approval queue, file list) without a page reload.

---

## Example Files

See [EXAMPLE_FILES.md](./EXAMPLE_FILES.md) for full documentation.

---

## Files Involved

| File | Role |
|---|---|
| `api/databricks/knowledge-base/process.js` | Text extraction + summary/tags generation |
| `api/databricks/knowledge-base/approve.js` | Writes `is_approved = TRUE` to Databricks |
| `api/databricks/knowledge-base/unapprove.js` | Writes `is_approved = FALSE` to Databricks |
| `api/databricks/knowledge-base/update.js` | Updates fileName, summary, tags, fileType |
| `src/components/ResearcherModes.tsx` | All KB management UI |
| `src/utils/databricksAPI.ts` | Client-side API wrappers |

---

## Permissions

| Action | Role required |
|---|---|
| View files | All authenticated users |
| Upload files | All authenticated users |
| Process files | Research Leader, Data Scientist |
| Approve / Unapprove | Research Leader, Data Scientist |
| Edit metadata | Research Leader, Data Scientist |
| Mark as Example | Research Leader, Data Scientist |
| Delete files | Research Leader, Data Scientist |
