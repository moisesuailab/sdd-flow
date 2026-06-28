# Prompt: Plan (RPI — Phase 2)

Use this prompt to generate all planning artifacts for a spec.

---

## Agent instruction

You will plan the implementation of an already-researched feature.

**Before starting, read:**
- `agents/AGENTS.md`
- `agents/PROJECT.md`
- `agents/RULES.md`
- `agents/specs/NNN-name/RESEARCH.md`
- Check which files already exist in `agents/specs/NNN-name/`

**Expected input:**
- Spec number and name (e.g. `001-user-authentication`)

---

## Adaptive behavior

| Situation | Action |
|---|---|
| SPEC.md does not exist | Create all artifacts from scratch |
| SPEC.md exists, TASK.md does not | Generate only TASK.md and PROGRESS.md based on existing SPEC.md |
| All artifacts exist | Review and update only what is incomplete or outdated |

---

## Deliverables

Generate the following files inside `agents/specs/NNN-name/`:

### SPEC.md
```markdown
# SPEC — [Feature Name]

## Goal
What this feature delivers (refined from RESEARCH.md).

## Entities involved
Data structures created or modified, with full field list.

## Business Rules
Numbered list. Only rules that directly affect implementation.

## Expected behaviors
Per behavior: what triggers it, what it does, what the output is.

## UI
Describe components, states, interactions and validations.
Write `N/A` if no UI is involved.

## Out of scope
Explicit list of what this spec does NOT cover.
```

### TASK.md
```markdown
# TASK — [Feature Name]

## Tasks

- [ ] T01 — [Verb + object + target file] (e.g. Create User entity schema in config)
  verify: [observable condition confirming completion — e.g. endpoint returns 201 with `id` field; returns 400 if `email` is missing]
- [ ] T02 — ...
  verify: [specific and testable condition — never "works correctly"]
```

Task rules:
- One task = one file created/modified, or one isolated function
- Order must respect dependencies (schema → data layer → service → route → UI)
- No circular dependencies between tasks
- Preferred verbs: `Add`, `Create`, `Implement`, `Update`, `Extract`, `Register`
- Each task must include a `verify:` line with a specific, observable condition — never "works correctly"

### PROGRESS.md
```markdown
# PROGRESS — [Feature Name]

## Status: 🔴 Not started

## Tasks

| Task | Status | Notes |
|---|---|---|
| T01 | Pending | |
| T02 | Pending | |

## History

(updated during implementation)
```

### TEST.md
```markdown
# TEST — [Feature Name]

## Acceptance Test Cases

### TC01 — [Behavior being tested]
- **Given** [initial state]
- **When** [action performed]
- **Then** [expected outcome]
```

---

## Constraints

- Do not write code in this phase
- Do not implement any task — only plan
- If the RESEARCH.md has unresolved open questions, **stop and ask** before planning
- After delivering all artifacts, **wait for approval** before advancing to Implement
