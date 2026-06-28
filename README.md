# sdd-flow

> A spec-driven workflow for AI-assisted development — installed in seconds, works with any agent.

```bash
npm install -g sdd-flow
sdd init
```

---

## Why sdd-flow exists

AI agents drift. A session that starts well ends with the agent ignoring the spec, inventing APIs, and refactoring things you didn't ask it to touch. The usual fix — better prompts, more context — doesn't scale.

**sdd-flow takes a different approach: phase isolation.**

Every feature goes through four phases. Each phase runs in its own agent session and receives only the artifact from the previous phase — not the full conversation history. Context stays lean. The agent reads the spec fresh every session and can't drift from what it hasn't accumulated.

This is a workflow for developers who want to stay in control of what gets built and why.

---

## The RPIV Cycle

```
Requirements
     │
     ▼
┌────────────┐  new session  ┌────────────┐  new session  ┌─────────────┐  new session  ┌────────────┐
│  RESEARCH  │ ────────────▶ │    PLAN    │ ────────────▶ │  IMPLEMENT  │ ────────────▶ │  VALIDATE  │
│            │               │            │               │             │               │            │
│ RESEARCH   │               │ SPEC.md    │               │ Code        │               │ Verified   │
│ .md        │               │ TASK.md    │               │ TASK.md ✓   │               │ PROGRESS   │
│            │               │ TEST.md    │               │ (one task,  │               │ .md        │
│            │               │ PROGRESS   │               │ then stop)  │               │            │
└────────────┘               └────────────┘               └─────────────┘               └────────────┘
```

Each arrow is a phase boundary. The agent starts fresh. Only the artifact passes through.

| Phase | Input | Output |
|-------|-------|--------|
| 🔍 **Research** | Your requirements | `RESEARCH.md` |
| 📐 **Plan** | `RESEARCH.md` | `SPEC.md` + `TASK.md` + `TEST.md` |
| 🔨 **Implement** | `SPEC.md` + `TASK.md` | Code + updated `TASK.md` |
| ✅ **Validate** | `TEST.md` + codebase | Verified `PROGRESS.md` |

> The agent stops after each task in the Implement phase and waits for your review. One task, one diff, one decision at a time.

---

## Quick Start

```bash
# Install
npm install -g sdd-flow

# Set up in your project
cd your-project
sdd init

# Create your first feature spec
sdd new user-auth   # creates agents/specs/001-user-auth/
```

Open a new agent session and say:

```
Read and follow agents/SETUP.md
```

The agent scans your project (or reads your PRD) and generates `PROJECT.md`, `DECISIONS.md`, and a `skills/` directory tailored to your stack. Review the files, then delete `agents/SETUP.md`. You're ready.

---

## Running a Feature

### Without harness — any editor

```
# Session 1 — Research
"Read and follow agents/prompts/rpi-research.md"

# Session 2 — Plan
"Read and follow agents/prompts/rpi-plan.md. Spec at agents/specs/001-user-auth/"

# Session 3 — Implement
"Read and follow agents/prompts/rpi-implement.md. Spec at agents/specs/001-user-auth/"

# Session 4 — Validate
"Read and follow agents/prompts/rpi-validate.md. Spec at agents/specs/001-user-auth/"
```

### With harness — Claude Code / OpenCode

```bash
sdd harness   # installs slash commands
```

```
/sdd-research  001-user-auth
/sdd-plan      001-user-auth
/sdd-implement 001-user-auth
/sdd-validate  001-user-auth
```

---

## Commands

```bash
sdd init              # install the workflow into the current project
sdd new <name>        # create a numbered spec folder (001-, 002-, ...)
sdd harness           # install, switch, or remove slash commands
sdd update            # update prompts and rules — never touches your specs or decisions
sdd --version
```

---

## What gets installed

```
agents/
├── AGENTS.md              ← agent role and SDD rules (read every session)
├── RULES.md               ← behavioral constraints (no rogue git, no scope creep)
├── PROJECT.md             ← your stack and conventions (auto-generated on setup)
├── DECISIONS.md           ← append-only architectural decisions log
├── SETUP.md               ← first-run only (delete after setup)
├── prompts/               ← one file per phase + utility prompts
├── skills/                ← capability files auto-generated for your stack
└── specs/
    └── 001-user-auth/
        ├── RESEARCH.md
        ├── SPEC.md
        ├── TASK.md
        ├── PROGRESS.md
        └── TEST.md
```

> `sdd update` only touches `AGENTS.md`, `RULES.md`, and `prompts/`.  
> Your specs, decisions, and skills are never modified.

---

## Works with any stack

sdd-flow operates at the spec level, not the code level. JavaScript, TypeScript, Python, Java, Go, PHP — the agent adapts to your stack during setup. No framework assumptions, no extra API keys, no additional costs beyond what you already use.

---

## Compatible editors

Claude Code · OpenCode · Cursor · Windsurf · Codex CLI · any IDE with filesystem access

---

## Workflow template

The prompts and rules installed by `sdd-flow` are maintained at:  
[github.com/moisesuailab/spec-driven-workflow](https://github.com/moisesuailab/spec-driven-workflow)

---

## License

MIT
