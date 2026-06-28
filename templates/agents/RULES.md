# RULES.md — Mandatory Process Rules

This file defines process rules that apply to every project regardless of stack.
Stack-specific rules belong in `PROJECT.md` under the **Stack Rules** section.

---

## Implementation Rules

### R01 — No implementation without a spec
No meaningful code change may be made without:
- An existing `SPEC.md`
- An existing `TASK.md`

---

### R02 — One task at a time
Always implement exactly ONE isolated task.
Never implement multiple tasks in the same step.

---

### R03 — Update PROGRESS.md on every task completion
When any task is completed:
- Update the task status (Pending → Done)
- Record relevant observations in the History section

---

### R04 — Mark completed tasks in TASK.md
When any task is completed:
- Replace `[ ]` with `[x]` in the corresponding TASK.md
- TASK.md must always reflect the real state of PROGRESS.md

---

### R05 — Record relevant decisions
Architectural changes must be recorded in:
- `agents/DECISIONS.md` — global decisions
- `agents/specs/.../DECISIONS.md` — feature-local decisions

---

## Git Rules

### R06 — Never run git commands automatically
Agents must NEVER:
- Create commits
- Create tags or releases
- Push to any remote
- Create or switch branches

The agent only prepares code changes. The developer runs git manually.

**Reason:** Human control over history and releases is mandatory.

---

## Code Quality Rules

### R07 — Prefer simple and predictable code
Avoid unnecessary abstractions. Optimize for readability and maintainability.

---

### R08 — No new external dependencies without justification
Do not add libraries or packages without:
- A clear justification
- A record in `DECISIONS.md`

---

### R09 — No auto-generated comments or JSDoc
Do not add explanatory comments or documentation blocks unless:
- Explicitly requested in the prompt, or
- Strictly necessary to fix an error or maintain consistency

**Reason:** Avoid code noise and documentation drift.

---

## Roadmap Rules

### R10 — Every feature must have a spec
Every feature on the roadmap must have a corresponding spec folder in `agents/specs/`.

---

## Scope Rules

### R11 — Do not refactor outside the task scope
Do not touch code unrelated to the current task, even if it looks improvable.
Remove imports, variables, or functions that **your changes** made unused.
Do not remove pre-existing dead code unless explicitly requested.

---

### R12 — Do not anticipate future tasks
Only implement what the current task requires.
Do not build ahead for tasks not yet started.

---

### R13 — Follow core coding principles
Every generated code must follow:
- **KISS** — simplest solution that solves the problem. No over-engineering.
- **DRY** — never duplicate logic. Extract to shared helpers or services.
- **Clean Code** — descriptive names, small functions, single responsibility.
- **SOLID** — each module owns one concern. Entry points delegate, never contain logic.

---

### R14 — Surface ambiguities before choosing
If a requirement has multiple valid interpretations, list them explicitly
before choosing one. Never pick silently. If the ambiguity blocks progress,
stop and ask before generating any code.
