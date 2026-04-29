# Gems Feedback Loop

## Overview

When a user highlights text in the Assessment Modal and saves it as a Gem 💎, that gem is stored in Databricks and fed back into future assessments as directional guidance. There are two distinct feedback loops:

1. **Prior gems** — gems from previous iterations, fetched from Databricks at assessment start
2. **Iteration gems** — gems saved *during the current iteration*, passed in memory from the frontend and included immediately in subsequent runs within the same iteration

Both are injected into every persona prompt and the Moderator opening so the AI knows what "going in the right direction" looks like — both historically and from the work happening right now.

---

## How It Works

### 1. Saving a Gem

The user highlights any text in the assessment output and clicks **Save as Gem**. The gem is saved to `knowledge_base.cohive.gems` via `api/databricks/gems/save.js` with:

- `gem_text` — the highlighted text
- `brand` — the brand from the Enter hex
- `project_type` — the project type from the Enter hex
- `hex_id` / `hex_label` — the hex where it was saved (e.g. Luminaries, Consumers)
- `file_id` / `file_name` — the KB file cited near the selection (if any)
- `created_by` — the user's email

If the gem came from a cited KB source, that file's `gem_inclusion_count` is also incremented.

At the same time, `AssessmentModal` calls `onGemSaved()` to notify `ProcessWireframe`, which appends the gem to the `iterationGems` array in memory. This happens immediately — no DB round-trip needed for the next run to see it.

---

### 2. Iteration Boundary

`iterationGems` is owned by `ProcessWireframe`, not `AssessmentModal`. This means it **persists across multiple modal opens within the same iteration** — if a user runs three assessments on the same hex with different personas, all gems saved across those three runs are included in the fourth.

The array is cleared at exactly two points:

| Event | Where |
|---|---|
| User clicks **Save Iteration** in the Findings hex | `ProcessWireframe` → `setIterationGems([])` |
| User navigates back to the **Enter hex** | `ProcessWireframe` → `setIterationGems([])` |

Both events already signal "this iteration is done" — `iterationGems` resets at the same moments as `iterationSaved`.

---

### 3. Fetching Prior Gems at Assessment Start

When an assessment runs, `run.js` fetches the 5 most recent gems from previous iterations for the same brand + project type + hex:

```js
const priorGems = await fetchPriorGems({
  brand,
  projectType,
  hexId,
  workspaceHost, accessToken, warehouseId,
  schema: 'cohive',
  limit: 5,
});
```

This step is **non-fatal** — if the fetch fails for any reason, the assessment continues without prior gems.

---

### 4. Iteration Context Block

In addition to prior gems, `run.js` builds an `iterationContextBlock` from what the frontend passes in the request body:

**Prior hex results** — the most recent output from every other hex that has already run in this iteration (e.g. if Luminaries has already run, its summary is visible to Consumers). Each result is truncated to 500 characters. The current hex is excluded.

**Iteration gems** — all gems the user has saved during this iteration, grouped by hex. These are passed directly from `ProcessWireframe` via `iterationGems` and don't require a DB fetch.

```
WHAT THIS ITERATION HAS ALREADY ESTABLISHED:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
### Luminaries (unified)
Bill Bernbach argued that the Nike brief needs to lead with human
truth rather than product specs. The VW Beetle analogy — confidence
through understatement — was flagged as a strong directional anchor...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GEMS SAVED THIS ITERATION — OUTPUTS THE USER MARKED AS EXEMPLARY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Luminaries:
  1. "Lead with human truth, not product specs." [from: Brand_Essence.pdf]
Consumers:
  1. "The under-25 cohort responds to understatement..."
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 5. Prior Gems Block

Gems from *previous* iterations are shown separately as directional calibration:

```
PRIOR GEMS — EXAMPLES GOING IN THE RIGHT DIRECTION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The user has saved these outputs from previous sessions as exemplary.
Use them as directional calibration — not as facts to cite.

1. "The Nike brand story should lead with athletic heritage..." [from: Brand_Essence.pdf]
2. "Rather than listing features, the brief should open with a tension..."
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Personas are told these are **directional calibration, not constraints** — they calibrate quality and tone, not content to copy.

---

### 6. Prompt Injection Points

Both blocks are injected via `promptCtx` into all three prompt builders:

| Prompt | Content injected |
|---|---|
| **Moderator Opening** | Prior gems + iteration context — frames the session from the start |
| **Round 1 Persona** | Prior gems + iteration context — each persona calibrates independently |
| **Debate Persona** | Prior gems + iteration context — maintained through debate rounds |

---

### 7. KB File Scoring

Every time a gem is saved from a cited source, that file's `gem_inclusion_count` increments. Over time this surfaces which KB files consistently produce outputs the user finds valuable.

---

## Data Flow Summary

```
User saves Gem in Run 1
        ↓
knowledge_base.cohive.gems (stored to DB)
knowledge_base.cohive.file_metadata.gem_inclusion_count++ (if cited)
onGemSaved() → iterationGems grows in ProcessWireframe (in memory)
        ↓
User closes modal, opens again for Run 2 (same iteration)
        ↓
iterationGems still intact — NOT reset on modal close
        ↓
Run 2 assessment fires
        ↓
run.js receives:
  - hexExecutions  (all prior hex results this iteration, from ProcessWireframe)
  - iterationGems  (all gems saved this iteration, from ProcessWireframe)
        ↓
run.js also fetches:
  - fetchPriorGems() → 5 most recent gems from DB (previous iterations)
        ↓
buildIterationContextBlock() → prior hex results + iteration gems
buildGemsBlock()             → prior session gems (from DB)
        ↓
Both injected into:
  - Moderator Opening prompt
  - Round 1 persona prompts (parallel)
  - Debate round persona prompts
        ↓
User saves iteration OR navigates to Enter
        ↓
iterationGems = [] (cleared — iteration boundary)
```

---

## Files Involved

| File | Role |
|---|---|
| `api/databricks/gems/save.js` | Saves gem to DB, increments file score |
| `api/databricks/gems/list.js` | Lists gems filtered by brand / project type / hex / user |
| `api/databricks/assessment/run.js` | Fetches prior gems, builds context blocks, injects into prompts |
| `src/components/AssessmentModal.tsx` | Text selection UI, calls `onGemSaved` on save — does not own gem state |
| `src/components/ProcessWireframe.tsx` | Owns `iterationGems` state, clears at iteration boundary |

---

## Configuration

- **Prior gems per session:** 5 most recent (controlled by `limit` in `fetchPriorGems`)
- **Filter scope:** `brand` + `projectType` + `hexId` — all three must match
- **Prior hex result truncation:** 500 characters per hex to keep prompt size bounded
- **Failure behaviour:** If prior gem fetch fails, assessment runs normally — no error surfaced to user
- **Iteration boundary:** `iterationGems` cleared on Save Iteration or Enter hex navigation
