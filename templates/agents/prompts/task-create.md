# Prompt: Task Create

Use this prompt to create or revise the TASK.md of an existing spec.

---

## Agent instruction

From an already approved SPEC.md, generate or update the TASK.md with a proper task breakdown.

**Expected input:**
- Content or path of the SPEC.md

---

## Task generation rules

- One task = one file created or modified, or one isolated function
- Order must respect dependencies:
  - Schema / config → data access → business logic → routing → UI
- Tasks that are consumed by other tasks must come first
- No task should have a circular dependency on another
- Each task must be independently reviewable and verifiable

## Required format

```
# TASK — [Feature Name]

## Tasks

- [ ] T01 — [Verb + object + target file] (e.g. Add User schema to config module)
- [ ] T02 — ...
```

## Preferred verbs

`Add`, `Create`, `Implement`, `Update`, `Extract`, `Register`, `Remove`, `Move`

---

**After generating TASK.md, stop and wait for approval before implementing.**
