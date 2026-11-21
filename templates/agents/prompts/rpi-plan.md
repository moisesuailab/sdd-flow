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

## Contract

SPEC.md front matter is the structured contract. Keep rationale and prose detail in its body.
Preserve IDs when editing. Use local IDs qualified externally by the change ID.

~~~yaml
---
schema_version: 2
artifact: spec
id: 001-example
requirements:
  - id: REQ01
    description: State an observable requirement, including important failure behavior.
acceptance:
  - id: AC01
    covers: [REQ01]
    description: State concrete inputs and expected outcomes.
    method: automated
    checks: [unit]
---
~~~

Automated checks must name real checks configured in agents/config.yaml.
Use method: manual or inspection for cases that require observed evidence rather than a command.
Automated command success is execution evidence; review assertions to establish semantic coverage.

## Tasks

Standard and rigorous modes use TASK.md. Light mode may omit it.
Keep task status only in its front matter. One task is a cohesive verifiable outcome and may change multiple files.

~~~yaml
---
schema_version: 2
artifact: tasks
id: 001-example
tasks:
  - id: T01
    title: Implement the behavior and its regression checks.
    status: pending
    covers: [REQ01, AC01]
    depends_on: []
    verify: The acceptance scenario and relevant regression checks pass.
---
~~~

Plan tests with implementation; permit TDD and incremental verification.
Use concrete initial-state/action/outcome examples in acceptance, including relevant failure/boundary cases.
Follow config quality.tdd; use quality.md when defining strategy or project-specific gates.
Classify external checks/criteria accurately before approval. Separate implementation from external-only verification tasks.
Missing environment access calls for a safe user handoff, not mandatory production testing or an impossible completion gate.
Allow many-to-many relationships among requirements, acceptance, tasks and tests.
Retain cancelled records with status: cancelled and cancellation containing reason and by.
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
