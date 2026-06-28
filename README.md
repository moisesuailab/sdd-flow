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
sdd init       # Instala o workflow no projeto atual
sdd harness    # Instala, troca ou remove o harness do agente
sdd update     # Atualiza prompts e regras, preserva dados do projeto
sdd --version
```

> Alias disponível: use `sdd` ou `sdd-cli` — ambos funcionam.

### New or existing project

```bash
cd my-project
sdd init
```

Installs the `agents/` folder with all workflow files. Optionally installs safety hooks and slash commands for your agent (Claude Code or OpenCode).

### Add or switch harness after init

```bash
sdd harness
```

Installs, replaces, or removes the harness and slash commands at any time — no need to reinstall the package.

### Update workflow (preserves your project data)

```bash
sdd update
```

Updates `AGENTS.md`, `RULES.md`, `QUICKSTART.md`, and all prompts. Your `PROJECT.md`, `DECISIONS.md`, `skills/`, `specs/`, and `harness/` are never touched.

---

## After `init`

1. Open a new session with your agent
2. Instruct: *"Read and follow `agents/SETUP.md`"*
3. Provide your PRD or describe the project
4. Review the generated files and delete `agents/SETUP.md`

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
