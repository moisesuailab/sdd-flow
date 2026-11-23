---
schema_version: 2
kind: procedure
phase: plan
description: Define scoped requirements, acceptance and cohesive tasks.
---

# Plan

Read the actual sources, applicable current capability contracts and code. Run sdd context ID --phase plan when available.
Use the change mode from change.yaml. Resolve only ambiguities that affect behavior or scope; state routine technical assumptions.
For a multi-feature request, follow intake.md and propose cohesive linked deliveries. An oversized context packet alone
does not justify splitting a spec; narrow it by task or section first.

## Contract and readable tasks

New specs use format: markdown. Keep front matter small (schema_version, artifact, id, format, language).
Write requirements, acceptance and tasks in the Markdown body, not in YAML arrays or a second state table.
Preserve the original format of existing schema 2 files unless conversion was requested.
The documented structure below is parsed by the CLI; IDs may be bold or plain.

SPEC.md example (fill real requirements and configured check names):

~~~markdown
---
schema_version: 2
artifact: spec
id: 001-example
format: markdown
language: pt-BR
---

# Exemplo

## Objetivo
Descreva a entrega e seus limites.

## Requisitos

- **REQ01** — Descreva um comportamento observável.

## Critérios de aceitação

- **AC01** — Descreva entradas e resultados esperados, incluindo falhas relevantes.
  - Cobre: REQ01
  - Método: automated
  - Checks: unit
~~~

Use method manual/inspection for observations; external criteria also declare Ambiente: external.
Checks must exist in agents/config.yaml. Do not invent commands or claim semantic coverage from exit codes.
Keep code examples and long rationale outside the structured list sections. Do not duplicate requirements there.

TASK.md uses the same small metadata with artifact: tasks and a list in Tarefas (or Tasks):

~~~markdown
## Tarefas

- [ ] **T01** — Implementar o comportamento e seus testes de regressão.
  - Cobre: REQ01, AC01
  - Depende de: —
  - Verificação: O cenário de aceitação e as regressões pertinentes passam.
~~~

[ ] not completed; [x] done; [-] cancelled. Only [ ] and [x] are native Markdown checkboxes.
An unchecked task may include Situação: em andamento (Status: in progress) or
Situação: verificação externa pendente (Status: pending external verification).
These short notes qualify open tasks; omit them for ordinary pending tasks and remove them when marking [x] or [-].
Keep state in this one TASK.md entry, without a duplicate table. Legacy [/] and [>] remain readable but are not generated.
Cancelled records retain Cancelado por / Motivo do cancelamento. Deferred tasks use Tipo: verification,
Adiado por / Motivo do adiamento and cover external acceptance only.
A task is a cohesive verifiable outcome and may change several files. Light mode may omit TASK.md.
Optional Notas/Notes holds a short current blocker or next action, not requirements or acceptance. Omit empty fields
and redundant sections; do not create parallel progress, summary or STATE files.
New standard/rigorous specs include RESEARCH.md: record actual findings and sources or explain why research
is not needed (not permitted in rigorous). Never invent research merely to fill a template.

Plan tests with implementation; permit TDD and incremental verification.
Use concrete initial-state/action/outcome examples in acceptance, including relevant failure/boundary cases.
Follow config quality.tdd; use quality.md when defining strategy or project-specific gates.
Classify external checks/criteria accurately before approval. Separate implementation from external-only verification tasks.
Missing environment access calls for a safe user handoff, not mandatory production testing or an impossible completion gate.
Allow many-to-many relationships among requirements, acceptance, tasks and tests.
Retain cancelled records with [-] and cancellation actor/reason in readable tasks; preserve the existing YAML representation in legacy tasks.
Do not infer that cancellation requests deleting code.

## Context and authorization

In change.yaml select capabilities, decisions, skills and dependency spec IDs.
Prefer current capability contracts for reusable behavior; depends_on is only for real execution prerequisites.
Use optional related for historical spec IDs and historical: true on source/context objects only for nonessential provenance.
Missing unfinished dependencies warn during planning so the existing spec can be repaired, but must be resolved before execution.
Use context entries as a project-relative path or {path: ..., section: Exact heading}.
Keep sources as paths or explicit path/section references to original requirements, which remain discoverable.
Do not populate every project artifact merely because a template exists.
For meaningful changes, add a short impact/regression note in SPEC's body: affected consumers/shared contracts,
behavior to preserve, relevant regression checks and any migration/cache/integration considerations.
Inspect only applicable areas; a small isolated change may need one sentence. Do not create a duplicate impact document.

Run sdd check ID and fix structural gaps. Explain the outcome, assumptions and material choices.
When the user has authorized this scope, record it with sdd approve ID --by NAME.
Never claim a human authorization that did not occur. Follow the existing conversation's authorization;
do not repeatedly ask for permission already given for the same scope.

When an approved business rule or policy changes, update the contract and affected task definitions while
preserving IDs. Run sdd revise ID --by NAME --reason REASON --dry-run to inspect impact, then record the revision.
Affected completed tasks and their dependents are reopened; policy/prose changes may conservatively reopen all.
Review and authorize the revised scope before continuing. Use a new linked spec for a separate deliverable.
