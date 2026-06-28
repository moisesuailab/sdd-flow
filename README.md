# sdd-flow

Spec Driven Development workflow for AI-assisted development.

Installs a structured **Research → Plan → Implement → Validate** cycle into any project, powered by markdown artifacts and isolated agent sessions.

Works with Claude Code, OpenCode, Cursor, Codex CLI, and any agentic IDE with filesystem access.

---

## Install

```bash
npm install -g sdd-flow
```

---

## Usage

```bash
sdd init              # Installs the workflow into the current project
sdd new <name>        # Creates a spec folder with auto-numbering
sdd harness           # Installs, switches, or removes the agent harness
sdd update            # Updates prompts and rules, preserves project data
sdd --version
```

> Alias available: use `sdd` or `sdd-cli` — both work.

---

## After `init`

Open a new session with your agent and instruct:

```
"Read and follow agents/SETUP.md"
```

- **New project:** describe the project or provide a PRD — the agent generates PROJECT.md and skills
- **Existing project:** the agent scans the codebase automatically

Review the generated files and delete `agents/SETUP.md`.

---

## Add or switch harness after init

```bash
sdd harness
```

Installs, replaces, or removes the harness and slash commands at any time.

---

## Update workflow (preserves your project data)

```bash
sdd update
```

Updates `AGENTS.md`, `RULES.md`, `QUICKSTART.md`, and all prompts. Your `PROJECT.md`, `DECISIONS.md`, `skills/`, `specs/`, and `harness/` are never touched.

---

## The RPI Cycle

Each feature goes through four isolated phases, each in its own agent session:

| Phase | Slash command | Prompt file |
|---|---|---|
| Research | `/sdd-research 001-feature` | `agents/prompts/rpi-research.md` |
| Plan | `/sdd-plan 001-feature` | `agents/prompts/rpi-plan.md` |
| Implement | `/sdd-implement 001-feature` | `agents/prompts/rpi-implement.md` |
| Validate | `/sdd-validate 001-feature` | `agents/prompts/rpi-validate.md` |

> Slash commands require harness installation (`sdd harness`).

---

## Source

[github.com/moisesuailab/spec-driven-workflow](https://github.com/moisesuailab/spec-driven-workflow)
