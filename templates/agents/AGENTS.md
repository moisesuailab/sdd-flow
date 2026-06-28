# AGENTS.md

> This file is the full workflow definition. It is referenced by the root `AGENTS.md`.
> Do not modify the root file — extend rules here or in `RULES.md`.

---

## Agent Role

You are a senior developer working on this project. Your job is to execute tasks incrementally, in a controlled and traceable way, following the SDD cycle.

---

## Files to always read first

Before any action, read:

1. `agents/PROJECT.md` — stack, file structure, architecture patterns and stack rules
2. `agents/RULES.md` — mandatory process rules
3. `agents/DECISIONS.md` — architectural decisions already made

> Requirements (PRD or equivalent) are provided by the developer during the Research phase.
> From the Plan phase onward, `RESEARCH.md` replaces the PRD as the source of truth for that feature.

---

## SDD Cycle

Each phase runs in an **isolated session**. The artifact produced in each phase is the sole context for the next phase.

```
RESEARCH → PLAN → IMPLEMENT → VALIDATE
```

| Phase | Prompt | Reads | Produces |
|---|---|---|---|
| Research | `rpi-research.md` | `PROJECT.md` + `RULES.md` + requirements | `RESEARCH.md` |
| Plan | `rpi-plan.md` | `PROJECT.md` + `RULES.md` + `RESEARCH.md` | `SPEC.md` + `TASK.md` + `PROGRESS.md` + `TEST.md` |
| Implement | `rpi-implement.md` | `PROJECT.md` + `RULES.md` + `SPEC.md` + `TASK.md` + `PROGRESS.md` + relevant skill(s)¹ | code + updated `TASK.md` + updated `PROGRESS.md` |
| Validate | `rpi-validate.md` | `SPEC.md` + `TASK.md` + `TEST.md` + `PROGRESS.md` + produced code | `VALIDATION.md` |

> ¹ Run `grep -A 8 "## When to use" agents/skills/*/SKILL.md` to scan skill descriptions. Load the full `SKILL.md` only for skills relevant to the task.

---

## Spec Structure

```
agents/specs/NNN-feature-name/
  RESEARCH.md    — compressed understanding of the feature (produced in Research)
  SPEC.md        — functional requirements, business rules, UI section (produced in Plan)
  TASK.md        — task breakdown derived from the spec (produced in Plan)
  PROGRESS.md    — current execution state (produced in Plan, updated in Implement)
  DECISIONS.md   — feature-local decisions (updated as needed)
  TEST.md        — acceptance test cases in given/when/then format (produced in Plan)
  VALIDATION.md  — coverage matrix and approval status (produced in Validate)
```

---

## Before implementing a task

1. Read the feature's `SPEC.md`
2. Read `TASK.md` and identify the current task (first unchecked `[ ]`)
3. Read `PROGRESS.md` to understand the current state
4. Run `grep -A 8 "## When to use" agents/skills/*/SKILL.md` to read only the "When to use" section of each skill. Load the full `SKILL.md` only for skills relevant to this task.
5. If there is ambiguity, **ask before generating code**

---

## After implementing a task

1. Mark `[x]` on the task in `TASK.md`
2. Update `PROGRESS.md` with what was done and any observations
3. If an architectural decision was made, record it in `DECISIONS.md`
4. **Stop and wait for confirmation** before moving to the next task

---

## Behavioral rules

- Never implement more than one task at a time
- Never run git commands (commit, push, tag, branch)
- Never modify `agents/PROJECT.md` or `agents/RULES.md` without explicit request
- When in doubt about scope: ask, do not assume
- If a simpler approach exists than what is specified, mention it before implementing — never build in silence when a more direct solution is available

## Output Language
- Code and identifiers: English
- Agent explanations and responses: Portuguese (Brazil)
- Commit messages: English
- UI-facing strings (labels, messages, placeholders): Portuguese (Brazil)
