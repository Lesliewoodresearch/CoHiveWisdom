# Example Files

## Overview

Example files are a special class of Knowledge Base file that serve as **cross-brand quality and format references**. They are brand-agnostic — uploaded once and available to every brand and project. The AI uses them to understand what good looks like in terms of content quality, tone, and document structure — not as factual source material about the current brand.

---

## Use Cases

| Example file name | What it teaches the AI |
|---|---|
| `Example Brand Essence` | The right content, structure, and depth for a brand essence document |
| `Example Summary Style` | The right layout, tone, and format for a strategic summary |
| `Example Creative Brief` | What a well-structured creative brief looks like |
| `Example Competitive Analysis` | How to frame and structure a competitive review |

The **name** is the description. Name example files clearly so the AI understands what kind of standard they represent.

---

## How to Create an Example File

1. Upload any file to the Knowledge Base (Wisdom hex or Research → Synthesis)
2. Go to **Research → Read/Edit/Approve**
3. Find the file in the pending queue or the approved files list
4. Open the edit modal (click **Review & Approve** or the 📄 button)
5. Toggle **Mark as Example File** → ON
6. Rename the file descriptively (e.g. "Example Brand Essence")
7. Click **Save Changes**

The file is now stored with `fileType = 'Example'` and `scope = 'general'` in Databricks. It will appear in the **Example Files** section of the Enter hex for all brands.

---

## How Example Files Appear in the Enter Hex

The "Select Knowledge Files" section in the Enter hex has two groups:

**Research Files** — brand and project specific, unchanged.

**✦ Example Files** — amber-styled section, always visible. If a project type is selected, only example files matching that project type (or with no project type set) are shown.

Users select example files the same way as regular research files — checkbox. Selected example files are sent to the assessment alongside regular KB files.

---

## How the AI Treats Example Files

Example files are injected into the KB context block with a distinct wrapper:

```
--- BEGIN EXAMPLE: Example Brand Essence ---
[NOTE: Cross-brand reference file — quality and format standard only.
This is NOT about the current brand. Do NOT cite as evidence about Nike.
Use to understand expected quality, tone, and structure only.]

...file content...

--- END EXAMPLE: Example Brand Essence ---
```

The `kbModeInstructions` block also includes an explicit rule for all personas:

> *EXAMPLE FILES (cross-brand reference only): Example Brand Essence*
> *These files show quality and format standards from other brands. Do NOT cite them as evidence about the current brand. Use them only to understand the expected level of quality, tone, and structure.*

This applies across all three KB modes (KB Only, KB Preferred, KB + General).

---

## Visual Indicators

- **File list** — Example files show an amber left border and a **✦ Example** badge
- **Expand panel** — shows an amber callout: *"This is an Example file — available to all brands as a cross-brand quality/format reference"*
- **Enter hex** — Example files appear in a separate amber-styled section labelled **✦ Example Files**

---

## Filtering by Project Type

In the Enter hex, Example files are filtered by the selected project type. An example file appears if:
- It has no `project_type` set (universal), OR
- Its `project_type` matches the currently selected project type

This means you can create project-type-specific examples (e.g. an example Brand Strategy document that only appears when Brand Strategy is selected) or universal examples (no project type set) that appear for everything.

---

## Data Model

Example files use the existing `file_metadata` schema:

| Column | Value |
|---|---|
| `file_type` | `'Example'` |
| `scope` | `'general'` (brand-agnostic) |
| `brand` | NULL or empty |
| `is_approved` | `TRUE` |

No schema changes required — `file_type` already accepts string values.

---

## Files Involved

| File | Change |
|---|---|
| `api/databricks/knowledge-base/update.js` | Accepts `fileType` field, validates `'Example'` |
| `src/utils/databricksAPI.ts` | Added `'Example'` to `fileType` union |
| `src/components/ResearcherModes.tsx` | Example toggle in edit modal, Example badge in file list |
| `src/components/ProcessWireframe.tsx` | Separate Example Files section in Enter hex |
| `src/components/AssessmentModal.tsx` | Passes `fileType` in `kbFiles` to run.js |
| `api/databricks/assessment/run.js` | Distinct prompt wrapper for Example files |
