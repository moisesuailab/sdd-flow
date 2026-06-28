# Prompt: Research (RPI — Phase 1)

Use this prompt to analyze the scope of a feature and produce RESEARCH.md.

---

## Agent instruction

You will analyze the scope of a feature and produce the `RESEARCH.md` for the spec.
This file is the only artifact of this phase and will be the context for the Plan phase.

**Before starting, read:**
- `agents/AGENTS.md`
- `agents/PROJECT.md`
- `agents/RULES.md`

**Expected input:**
- Requirements source (PRD, textual description, or any document provided)
- Spec name and number (e.g. `001-user-authentication`)

---

## Deliverable: RESEARCH.md

Produce **only** the file `agents/specs/NNN-name/RESEARCH.md` with the structure below.
Be concise — this file will be read in future sessions as compressed context.

```markdown
# RESEARCH — [Feature Name]

## Goal
One clear sentence stating what this feature delivers.

## Entities and data structures
List the entities involved, data structures to be created or modified,
and their expected fields/schema.

## Relevant business rules
Only the rules that directly impact implementation.
Reference by number if the PRD uses numbered rules.

## Dependencies
Features or specs that must be complete before this one.
List `None` if there are none.

## Scope decisions
What is explicitly inside and outside the scope of this spec.
Be explicit about edge cases.

## Risks and attention points
Resolved ambiguities, identified trade-offs, and warnings for the implementation phase.

## Open questions
List only questions that block the Plan phase.
If none, write `None`.
```

---

## Constraints

- Produce only RESEARCH.md — no other file must be created
- Do not create SPEC.md, TASK.md, PROGRESS.md, TEST.md or any code file
- Do not write code in this phase
- Do not anticipate implementation decisions
- If there are open questions, **stop and wait for answers** before delivering RESEARCH.md
- After delivering RESEARCH.md, **wait for approval** before advancing to Plan
