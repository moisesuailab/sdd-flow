# SDD Workflow - Quick Start

## Cycle

Each feature goes through 4 phases in isolated sessions:

```
RESEARCH → PLAN → IMPLEMENT → VALIDATE
```

## Initial setup

After running `sdd init`, open your agent in the project and instruct:

```
"Read and follow agents/SETUP.md"
```

- **New project:** describe the project or provide the PRD — the agent generates PROJECT.md and the skills
- **Existing project:** the agent scans the code automatically

Review the generated files and delete `agents/SETUP.md`.

## Starting a feature

### With slash commands

```
/sdd-research 001-feature-name    → produces RESEARCH.md
/sdd-plan 001-feature-name        → produces SPEC.md + TASK.md + TEST.md
/sdd-implement 001-feature-name   → implements one task at a time
/sdd-validate 001-feature-name    → produces VALIDATION.md
```

### Without slash commands

Instruct your agent in each session:

```
"Read and follow agents/prompts/rpi-research.md. Spec: 001-feature-name"
"Read and follow agents/prompts/rpi-plan.md. Spec: 001-feature-name"
"Read and follow agents/prompts/rpi-implement.md. Spec: 001-feature-name"
"Read and follow agents/prompts/rpi-validate.md. Spec: 001-feature-name"
```

## Creating a new spec

```bash
sdd new feature-name
# ✔ Spec created: agents/specs/001-feature-name/
```

## Spec structure after the full cycle

```
agents/specs/001-feature-name/
  RESEARCH.md     ← phase 1
  SPEC.md         ← phase 2
  TASK.md         ← phase 2
  TEST.md         ← phase 2
  PROGRESS.md     ← updated in phase 3
  DECISIONS.md    ← architectural decisions
  VALIDATION.md   ← phase 4
```

## References

- Process rules → `agents/RULES.md`
- Full workflow definition → `agents/AGENTS.md`
- Documentation → https://github.com/moisesuailab/sdd-flow
