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
   - **Check TEST.md for impact** — if any test case covers behavior changed by this task:
     - Update the affected test case(s) in TEST.md if the expected behavior changed
     - Record in PROGRESS.md which test cases were affected and why
     - If VALIDATION.md exists and covers those cases, mark the affected rows as `⚠️ Needs re-validation`
5. **Stop and wait for confirmation** before moving to the next task

---

## Emerging scope

If unexpected work is discovered during implementation, apply **R15** before continuing:

1. Describe the emerging work in one sentence
2. Apply the decision table:
   - Modifies files already in this spec's scope → add task to current `TASK.md`
   - Small gap or planning oversight → add task to current `TASK.md`
   - New module, entity, or feature goal not in `SPEC.md` → new spec
   - Explicitly in `SPEC.md` "Out of scope" → new spec
   - Crosses a domain boundary → new spec
3. State the chosen action with justification
4. **Stop and wait for developer confirmation** before proceeding

Never decide silently. Never create a new spec or add a task without surfacing the decision first.

---

## Constraints

- Do not anticipate future tasks
- Do not refactor code outside the current task's scope
- Do not add dependencies without recording them in DECISIONS.md
- Do not run git commands
- If there is ambiguity about scope or approach, **ask before generating code**
