# SDD Workflow — Quick Start

## Ciclo

Cada feature passa por 4 fases em sessões isoladas:

```
RESEARCH → PLAN → IMPLEMENT → VALIDATE
```

## Iniciando uma feature

### Com slash commands

```
/sdd-research 001-nome-da-feature    → produz RESEARCH.md
/sdd-plan 001-nome-da-feature        → produz SPEC.md + TASK.md + TEST.md
/sdd-implement 001-nome-da-feature   → implementa uma task por vez
/sdd-validate 001-nome-da-feature    → produz VALIDATION.md
```

### Sem slash commands

Instrua seu agente em cada sessão:

```
"Leia e siga agents/prompts/rpi-research.md. Spec: 001-nome-da-feature"
"Leia e siga agents/prompts/rpi-plan.md. Spec: 001-nome-da-feature"
"Leia e siga agents/prompts/rpi-implement.md. Spec: 001-nome-da-feature"
"Leia e siga agents/prompts/rpi-validate.md. Spec: 001-nome-da-feature"
```

## Estrutura da spec após o ciclo completo

```
agents/specs/001-nome-da-feature/
  RESEARCH.md     ← fase 1
  SPEC.md         ← fase 2
  TASK.md         ← fase 2
  TEST.md         ← fase 2
  PROGRESS.md     ← atualizado na fase 3
  DECISIONS.md    ← decisões arquiteturais
  VALIDATION.md   ← fase 4
```

## Referências

- Regras do processo → `agents/RULES.md`
- Definição completa do workflow → `agents/AGENTS.md`
- Documentação → https://github.com/moisesuailab/spec-driven-workflow
