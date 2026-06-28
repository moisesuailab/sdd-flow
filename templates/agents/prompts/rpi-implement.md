# Prompt: Implement (RPI — Phase 3)

Use this prompt to implement a single task from an existing spec.

---

## Agent instruction

You will implement **one single task** from an already planned feature.

**Before starting, read:**
- `agents/AGENTS.md`
- `agents/PROJECT.md`
- `agents/RULES.md`
- `agents/specs/NNN-name/SPEC.md`
- `agents/specs/NNN-name/TASK.md` — identify the first unchecked `[ ]`
- `agents/specs/NNN-name/PROGRESS.md`
- Run `grep -A 8 "## When to use" agents/skills/*/SKILL.md` — load the full `SKILL.md` only for skills relevant to this task

**Expected input:**
- Spec number (e.g. `001`)
- Task to implement (e.g. `T03`) — if not provided, use the first unchecked `[ ]`

---

## Expected behavior

1. Declare which task will be implemented before generating any code
2. Implement only what is necessary for that single task
3. State exactly **which file** was created or modified
4. After completing:
   - Confirm the `verify:` condition on the completed task is met before marking it done
   - Mark `[x]` on the task in TASK.md
   - Update PROGRESS.md with what was done and any observations
   - Record relevant architectural decisions in DECISIONS.md
5. **Stop and wait for confirmation** before moving to the next task

---

## Constraints

- Do not anticipate future tasks
- Do not refactor code outside the current task's scope
- Do not add dependencies without recording them in DECISIONS.md
- Do not run git commands
- If there is ambiguity about scope or approach, **ask before generating code**
