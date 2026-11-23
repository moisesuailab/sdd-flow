# Formats and worked example

## Metadata policy

New SPEC/TASK artifacts keep canonical content in readable Markdown lists, with format: markdown and small YAML front matter. Existing YAML-array schema 2 documents remain readable without conversion. Configuration/manifests remain YAML.
Skills follow Agent Skills: name matches the directory, is lowercase kebab-case (1–64 characters),
and description explains the procedure and triggers (1–1024 characters).
Human-only README files do not need front matter.
General document metadata is an sdd-flow convention; clients do not automatically interpret arbitrary fields.

Optional config.yaml documentation.language is auto or a BCP 47 language tag such as pt-BR or en.
Existing configurations without this mapping use auto. It guides project-authored narrative; keys, IDs,
paths and original quotations remain stable. UTF-8 and normal spelling/diacritics are preserved.
Portuguese seed headings are generated for pt/pt-BR; other CLI seed headings use English as fallback.
See methodology.pt-BR.md for scope and localization limits.

The CLI parses YAML 1.2 with the yaml package. Duplicate keys, aliases, unsupported tags,
non-mapping roots and reserved prototype keys are rejected. Front matter must start at the file's
beginning (BOM/CRLF are accepted), close with a delimiter and stay under 64 KiB.

## Project configuration

Optional reference scaffolding: init --docs creates prd.md, roadmap.md and architecture.md.
docs --types prd,sd,ds,adr,roadmap selects presets; --dry-run is read-only and existing files are preserved.
ADR templates are proposed rather than actual active decisions. No fixed reference-document set is required.

~~~yaml
schema_version: 2
mode: standard
artifact_format: markdown
autonomy: step
approval: required
context:
  max_bytes: 48000
  budget_mode: warn   # optional; warn (default) keeps oversized packets, strict refuses them
checks:
  - name: unit
    command: node --test
    timeout_ms: 60000
verification:
  exclude: [coverage, dist]
privacy:
  local_mode: warn
  store_logs: false
  sensitive_paths: []
~~~

Check commands execute through the local shell using the current account.
Names are unique lowercase IDs. Timeouts are positive integers up to 3,600,000 ms.
Optional level is required (default) or advisory; environment is local (default) or external.
External commands are skipped unless --run-external is explicitly requested and authorized.
Optional quality.tdd is optional, preferred (default) or required; it guides the method rather than attesting test chronology.
QUALITY.md is project-owned, preserved by maintenance and read for planning/review.
Configure generated paths explicitly; do not exclude source or dependency manifests.
New installations use step as the standing default. Explicit user authorization for named tasks or
all tasks permits a bounded batch without changing configuration; plan approval alone does not.
Existing configured autonomy is preserved on update. Task checks and dependencies still apply in batches.
A timeout kills the spawned process group on POSIX. On Windows the CLI invokes taskkill.exe
for its spawned process tree, with shell-process termination as fallback. Use a controlled environment
when stronger process isolation is required.

## Change manifest

The CLI sdd context --json response keeps the complete packet in content. entries contains provenance and byte counts,
without a duplicate content field per document. The JavaScript context() API retains full entries for programmatic use.
skills contains selected metadata only; skills_catalog points to on-demand discovery. --inspect emits sizes/provenance only.

Created by sdd new NAME:

~~~yaml
schema_version: 2
id: 001-addition
title: Addition
mode: standard
status: draft
capabilities: []
decisions: []
skills: []
depends_on: []
context:
  - path: src/math.js
sources: []
approval: null
~~~

All paths are project-relative. Absolute paths, traversal and symbolic-link traversal are refused.
context also accepts {path: docs/domain.md, section: Exact heading}.
List relevant capabilities/decisions explicitly; they must have kind: capability/decision and status: active.
Dependencies reference full change IDs. Implementation/verification requires dependencies to be closed.
The manifest ID remains stable when the folder is renamed or renumbered; lookup accepts its current folder name too.
Optional related lists historical spec IDs without requiring their content or loading them into context.
Source/context objects may use historical: true for nonessential provenance; missing historical files warn.
Missing required sources still fail. Missing unfinished dependencies warn in plan and block execution until reviewed;
a retained recorded closure can satisfy a discarded historical dependency, with explicit warnings and fresh consumer checks.
Use management commands and reconcile; see spec-management.pt-BR.md for retention and recovery limits.
The approval command updates approval and ID history; do not fabricate those fields manually.

Lifecycle statuses: draft, implementing, implemented (limited verification), verified, closed, cancelled.
IDs remain reserved after archival through the durable project registry.
Store original requirement paths or {path: ..., section: Exact heading} references in sources. Research/plan context loads those sources/sections;
other phases may consult them on demand.

## Normative specification (readable default)

~~~markdown
---
schema_version: 2
artifact: spec
id: 001-addition
format: markdown
language: en
---

# Addition

## Goal
Add finite numbers without changing unrelated behavior.

## Requirements

- **REQ01** — Add two finite numbers and reject nonnumeric values.

## Acceptance criteria

- **AC01** — Adding 2 and 3 yields 5; a string input raises TypeError.
  - Covers: REQ01
  - Method: automated
  - Checks: unit
~~~

Use REQ/BR/EB requirement IDs and AC/TC acceptance IDs. Each active requirement needs acceptance coverage.
Methods are automated, manual or inspection; external observations add Environment: external.
Automated criteria reference actual configured checks; inspect assertions, not only command exit codes.
Portuguese sections are Requisitos / Critérios de aceitação; fields are Cobre, Método, Checks and Ambiente.
IDs may be bold or plain. Keep descriptions on their record line; long rationale and code examples go in
prose sections outside the structured lists. Never duplicate canonical records in front matter.

## Canonical tasks (readable default)

~~~markdown
---
schema_version: 2
artifact: tasks
id: 001-addition
format: markdown
language: en
---

# Execution plan

## Tasks

- [ ] **T01** — Implement addition and regression checks.
  - Covers: REQ01, AC01
  - Depends on: —
  - Verify: The concrete success and rejection scenarios pass.
~~~

| Marker | State | Meaning |
|---|---|---|
| [ ] | pending, in_progress or deferred | Unfinished; optional Status note distinguishes progress/external verification |
| [x] | done | Completed with available verification |
| [-] | cancelled | Cancelled, with ID retained |

Only [ ] and [x] are standard Markdown checkboxes; [-] is a portable text convention.
Unqualified [ ] means pending. Qualify only open tasks with Status: in progress or Status: pending external verification
(Portuguese: Situação: em andamento / Situação: verificação externa pendente). Logical tokens in_progress/deferred are also accepted.
Remove that note when marking [x] or [-]; conflicting combinations are rejected. State remains in the single TASK.md entry,
without a duplicate PROGRESS table or editable JSON/YAML view. Legacy [/] and [>] remain readable; rendering uses the new form.
Portuguese fields: Cobre, Depende de, Verificação, Notas, Evidência, Tipo, Cancelado por,
Motivo do cancelamento, Adiado por and Motivo do adiamento. English equivalents: Covers, Depends on,
Verify, Notes, Evidence, Kind, Cancelled by, Cancellation reason, Deferred by and Deferral reason.
Notas/Notes is optional short observational text for a current blocker or next action. It is not a requirement,
completion signal or verification evidence. Do not duplicate task state or create a parallel checkpoint diary.

Cancellation needs actor/reason. Deferred tasks need Kind: verification (Tipo: verification), actor/reason
and external acceptance IDs only. Unfinished implementation, documents or recommendations stay pending;
use partial verification while actual deliverables remain. Dependencies must be acyclic and done before
in_progress/done consumers. Requirement/acceptance cancellations use Status: cancelled (Situação: cancelled)
and the corresponding actor/reason fields.

Task status/evidence/notes changes do not invalidate scope approval. Observational task notes are also excluded
from verification fingerprints; status/evidence retain their existing verification semantics. Title, coverage, dependencies, verify and
normative prose changes do. The CLI normalizes the Markdown lists into the same internal schema 2 model;
there is no duplicate authoritative JSON/YAML copy. Existing YAML-array artifacts retain their prior semantics.
Explicit file references still bind raw source bytes, including a TASK.md deliberately selected as a source/context reference.
Light may omit tasks. Standard/rigorous require a task plan; new specs include a research entry point.

Unknown extension fields are preserved in a labeled additional-fields mapping during conversion. Review
such extensions; they are not an excuse to put the entire plan back in structured metadata.

## Manual and inspection evidence

For each manual/inspection criterion, generate a current template:

~~~sh
sdd evidence 001-addition
~~~

The template contains schema_version, change ID, input_digest and cases.
Execute the scenario before setting a case to passed/failed:

~~~json
{
  "id": "AC02",
  "result": "passed",
  "by": "Moisés",
  "at": "2026-11-20T16:00:00Z",
  "notes": "Observed the expected result in the isolated test environment.",
  "artifacts": []
}
~~~

Allowed results: passed, failed, not_run, blocked. Executed results require actor, timestamp and notes.
Artifacts are project-relative regular files and are hashed. Do not record secrets.
Evidence must match the current input digest. Finish source changes and task status updates before generating it.
New readable specs store evidence under the ignored .sdd/ folder inside the spec. Use returned paths; legacy specs keep their old paths until explicit conversion. Never put real credentials or personal payloads in evidence.
If EVIDENCE.json already exists, the default command returns a new revision-specific filename and preserves
the previous observations. Use that returned path with --evidence. An explicit --out never overwrites a file.

~~~sh
sdd verify 001-addition --evidence agents/specs/001-addition/.sdd/EVIDENCE.json
~~~

Full success can close a manually tested project. Partial runs never close changes.
Verification receipts record check-to-criterion mappings, output logs and known limitations.

## Current knowledge and decisions

~~~yaml
---
schema_version: 2
kind: capability
id: arithmetic
description: Arithmetic operations and input validation.
status: active
changes: [001-addition]
---
~~~

Maintain the current behavior and source links in the body. Add the change ID before final verification.
Decisions use kind: decision, status: active or superseded, and superseded_by when replaced.
Select the active ADR paths; do not load an entire global append-only decision log every session.

## Research

Rigorous mode requires RESEARCH.md with schema_version: 2, artifact: research and the matching id.
Document source evidence, decisions, risks and resolved questions in its body.
New standard/rigorous specs include RESEARCH.md with status: pending. Record actual findings and set status: complete, or explain status: not_needed outside rigorous mode. A pending template is not evidence. Light creates research only when useful. Research does not replace authoritative sources.

## Project policies, revision and history

POLICIES.md contains mandatory project-specific constraints and is preserved by updates.
Scope approval binds these policies, check commands and verification exclusions in addition to the plan.
It also binds QUALITY.md and quality settings. Advisory checks cannot be the evidence for required acceptance.
Context budgets are diagnostic settings and do not change scope approval by themselves.

Each approval retains a normative snapshot in .sdd/history/approval-*.json. Editing a rule or policy
does not rewrite that prior snapshot. Use sdd revise ID --by NAME --reason TEXT --dry-run to inspect
affected task states, then record the revision and authorize the new scope.
Requirement/acceptance links determine local impact; policy, prose or reference changes may reopen all tasks.
Dependent tasks are reopened transitively. The agent must still review semantic impact and update tests.

New readable specs retain .sdd/runs/RUN_ID/receipt.json; .sdd/verification.json is the local current view. Output logs are opt-in (privacy.store_logs), heuristically redacted and local-only. Old root-level paths remain supported for unconverted specs.
These historical records are not loaded automatically into context.

## Privacy and clones

Technical records are local plaintext files ignored by Git, not encrypted attestations. The shared registry
retains stable IDs and compact closure summaries. Another checkout can use the Markdown and approval digest,
but must reverify when local receipts are unavailable; missing revision snapshots trigger conservative impact.
See privacy.pt-BR.md. No regex or ignore rule guarantees detection/removal of all confidential data.
