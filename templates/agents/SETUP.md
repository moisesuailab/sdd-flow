# Agents Template — Setup Guide

This template implements the **SDD (Spec Driven Development)** workflow using the **RPI (Research → Plan → Implement)** methodology. It is LLM-agnostic and stack-agnostic.

> After completing setup, delete this file from the project.

---

## Directory Structure

```
AGENTS.md               ← Entry point — auto-loaded by any harness (do not modify)
opencode.json           ← Optional: OpenCode harness config (copy from agents/harness/opencode/)
.claude/
  settings.json         ← Optional: Claude Code harness config (copy from agents/harness/claude-code/)
agents/
  AGENTS.md             ← Full workflow definition (do not modify)
  RULES.md              ← Process rules: git, tasks, decisions (do not modify)
  PROJECT.md            ← ⚠️  FILL THIS: stack, architecture, stack-specific rules
  DECISIONS.md          ← Architectural decisions log (append-only)
  SETUP.md              ← This file. Delete after setup is complete
  harness/              ← Optional enforcement configs per harness (copy to project root to activate)
    claude-code/
      settings.json     ← Claude Code: example config — permissions + hooks (customize as needed)
    opencode/
      opencode.json     ← OpenCode: example config — instructions + permissions (customize as needed)
  prompts/
    rpi-research.md     ← Phase 1 prompt (do not modify)
    rpi-plan.md         ← Phase 2 prompt (do not modify)
    rpi-implement.md    ← Phase 3 prompt (do not modify)
    task-create.md      ← Utility prompt (do not modify)
    skill-call.md       ← Utility prompt (do not modify)
    conventional-commit.md  ← Utility prompt (do not modify)
    pr-template.md      ← Utility prompt (do not modify)
  skills/
    _template/
      SKILL.md          ← Template for new skills (do not modify)
    [capability-name]/  ← ⚠️  CREATE: one folder per reusable capability
      SKILL.md
  specs/
    [empty]             ← Auto-populated as features are developed
```

**Files to adjust per project:** `PROJECT.md`, `DECISIONS.md`, `agents/skills/<name>/SKILL.md`
**Never modify:** `AGENTS.md` (root), `agents/AGENTS.md`, `agents/RULES.md`, all `agents/prompts/`

---

## AI-Assisted Setup

Use the prompt below in a new agent session to configure the entire workflow automatically. The agent will read your project and produce all required files.

### Setup Prompt

Copy and use this prompt in your agentic IDE:

```
Read agents/AGENTS.md, agents/RULES.md, and agents/SETUP.md.

Your job is to configure this project's SDD workflow by producing three outputs:
agents/PROJECT.md, agents/DECISIONS.md, and one skill folder per relevant capability
in agents/skills/.

## Input sources (use what is available, in this order of priority)

1. PRD or requirements document — if provided, extract stack, architecture, and rules from it
2. Existing project files — scan the codebase: package.json, pyproject.toml, tsconfig.json,
   README, src/ structure, config files, and any existing documentation
3. Ask me — if neither is available or if critical information is missing, ask before generating

## Output 1 — agents/PROJECT.md

Produce a dense, scannable file. Prefer tables over paragraphs. Include:

- Project name and purpose (1–2 sentences)
- Runtime, framework, and key libraries (actual versions if detectable)
- Persistence layer and access method
- Frontend stack (if any)
- File and module structure (table: path → responsibility)
- Architecture patterns in use (e.g. layered, repository, MVC)
- Stack Rules: rules already enforced in the codebase
  (naming conventions, forbidden patterns, mandatory abstractions, etc.)

## Output 2 — agents/DECISIONS.md

For new projects: leave the header only, no entries yet.
For existing projects: document architectural decisions already present in the codebase.
  Look for: chosen libraries over alternatives, folder organization rationale,
  patterns used consistently, anything that would be a "why did we do it this way" question.
  Format each entry as:
  ### [YYYY-MM-DD] Decision title
  **Context:** why this decision existed
  **Decision:** what was chosen
  **Consequences:** what this implies going forward

## Output 3 — agents/skills/<name>/SKILL.md

Identify which capability domains exist in this project and create one folder per domain,
each containing a single SKILL.md file.
Common domains: ui-components, data-access, auth, validation, api-integration, error-handling.
Only create skills that are actually relevant to this project — do not create generic placeholders.

Each SKILL.md must follow this structure:
# Skill: [Capability Name]

## When to use this skill
[Specific task types that should load this skill]

## Patterns
[Correct approach with concise code examples from this project's stack]

## Anti-patterns
[What NOT to do, with reason]

## Checklist
- [ ] Items the agent must verify before finishing a task using this skill

## Constraints

- Produce only the three outputs above — no other files
- Do not create specs or implement any feature
- Do not run git commands
- If any critical information is missing and cannot be inferred, ask before generating
- After delivering all files, wait for my review and approval
```

---

## Manual Setup (alternative)

If you prefer to fill the files yourself:

### Step 1 — Fill in PROJECT.md

| Placeholder | What to write |
|---|---|
| `[FILL: project name and purpose]` | 1–2 sentences describing what the project does |
| `[FILL: runtime / framework]` | e.g. Node.js + Express, Python + FastAPI |
| `[FILL: persistence layer]` | e.g. PostgreSQL, MongoDB, Google Sheets |
| `[FILL: frontend]` | e.g. React + Tailwind, Vue, plain HTML |
| `[FILL: file/module structure]` | Key files and their responsibilities |
| `[FILL: architecture patterns]` | e.g. layered, repository pattern, MVC |
| `[FILL: stack-specific rules]` | Rules unique to your stack |

> PROJECT.md is read on every session. Keep it dense — every token counts.

### Step 2 — Fill in DECISIONS.md

**New project:** leave empty — decisions are recorded as they happen during implementation.

**Existing project:** document decisions already made before starting specs. This prevents the agent from re-deciding things already settled. For each decision, record: context, what was chosen, and consequences.

### Step 3 — Create Skills

Create one folder per capability inside `agents/skills/`, each containing a `SKILL.md` file.

**New project:** base skills on your planned stack.
**Existing project:** extract patterns from the actual codebase — look at how data access, validation, and UI are already handled, and encode those patterns into skills.

| Skill folder | When to create |
|---|---|
| `agents/skills/ui-components/SKILL.md` | Project has a UI layer |
| `agents/skills/data-access/SKILL.md` | Project touches a database or persistence layer |
| `agents/skills/auth/SKILL.md` | Project has authentication or authorization |
| `agents/skills/validation/SKILL.md` | Project validates user or external input |
| `agents/skills/api-integration/SKILL.md` | Project calls external APIs |
| `agents/skills/error-handling/SKILL.md` | Project has a defined error format or logging strategy |

Use `agents/skills/_template/SKILL.md` as the starting point for each new skill.

> The "When to use this skill" section is critical — it is what the agent reads to decide whether to load the skill for a given task.

### Step 4 — Activate harness configs (optional)
 
If you use Claude Code or OpenCode, copy the relevant config to add an enforcement layer at the tool level:
 
**Claude Code:**
```bash
mkdir -p .claude && cp agents/harness/claude-code/settings.json .claude/settings.json
```
 
**OpenCode:**
```bash
cp agents/harness/opencode/opencode.json opencode.json
```
 
These configs add an enforcement layer at the tool level, complementing the behavioral rules in `RULES.md`. The provided examples block or ask confirmation for certain commands — adjust them to match your team's needs. If you use hooks (Claude Code only), also run:
 
```bash
chmod +x agents/harness/claude-code/.hooks/*.sh
```

### Step 5 — Validate Before First Spec

Before starting the first RPI cycle, confirm:

- [ ] Root `AGENTS.md` is present and unmodified
- [ ] `agents/PROJECT.md` has no `[FILL: ...]` placeholders remaining
- [ ] `agents/DECISIONS.md` reflects existing architectural decisions (existing projects)
- [ ] At least one skill folder exists in `agents/skills/` (e.g. `agents/skills/data-access/SKILL.md`)
- [ ] `agents/AGENTS.md` and `agents/RULES.md` are unmodified
- [ ] `agents/SETUP.md` is deleted

---

## Starting Your First Spec

When setup is complete:

1. Create the folder: `agents/specs/001-feature-name/`
2. Run the Research phase using `agents/prompts/rpi-research.md`
3. Follow the RPI cycle through to implementation

---

## Language Recommendation

| File | Recommended language |
|---|---|
| `AGENTS.md` (root), `agents/AGENTS.md`, `agents/RULES.md`, `agents/prompts/` | **English** — read every session, token-sensitive |
| `agents/PROJECT.md` | **English** — read every session, token-sensitive |
| `agents/skills/` | **English** — read per task, token-sensitive |
| `agents/DECISIONS.md` | Team's language — written rarely, read occasionally |
| `agents/specs/` (RESEARCH, SPEC, TASK, etc.) | Team's language — scoped per feature |