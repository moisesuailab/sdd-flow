# Formats and worked example

## Metadata policy

Use YAML front matter for machine-consumed Markdown, and YAML for configuration/manifests.
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
autonomy: batch
approval: required
context:
  max_bytes: 48000
checks:
  - name: unit
    command: node --test
    timeout_ms: 60000
verification:
  exclude: [coverage, dist]
~~~

Check commands execute through the local shell using the current account.
Names are unique lowercase IDs. Timeouts are positive integers up to 3,600,000 ms.
Optional level is required (default) or advisory; environment is local (default) or external.
External commands are skipped unless --run-external is explicitly requested and authorized.
Optional quality.tdd is optional, preferred (default) or required; it guides the method rather than attesting test chronology.
QUALITY.md is project-owned, preserved by maintenance and read for planning/review.
Configure generated paths explicitly; do not exclude source or dependency manifests.
A timeout kills the spawned process group on POSIX. On Windows the CLI invokes taskkill.exe
for its spawned process tree, with shell-process termination as fallback. Use a controlled environment
when stronger process isolation is required.

## Change manifest

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
The approval command updates approval and ID history; do not fabricate those fields manually.

Lifecycle statuses: draft, implementing, implemented (limited verification), verified, closed, cancelled.
IDs remain reserved after archival through the durable project registry.
Store original requirement paths or {path: ..., section: Exact heading} references in sources. Research/plan context loads those sources/sections;
other phases may consult them on demand.

## Normative specification

~~~yaml
---
schema_version: 2
artifact: spec
id: 001-addition
requirements:
  - id: REQ01
    description: Add two finite numbers and reject nonnumeric values.
acceptance:
  - id: AC01
    covers: [REQ01]
    description: Adding 2 and 3 yields 5; a string input raises TypeError.
    method: automated
    checks: [unit]
---
~~~

Use REQ, BR or EB for requirement IDs, AC or TC for acceptance IDs.
Every active requirement needs acceptance coverage. Methods: automated, manual or inspection.
Automated criteria reference configured check names. A single check can cover several criteria;
the reviewer must inspect whether assertions actually establish the declared behavior.
Keep details and rationale in the Markdown body; do not duplicate task execution status there.

## Canonical tasks

~~~yaml
---
schema_version: 2
artifact: tasks
id: 001-addition
tasks:
  - id: T01
    title: Implement addition and regression checks.
    status: pending
    covers: [REQ01, AC01]
    depends_on: []
    verify: The concrete success and rejection scenarios pass with the unit check.
---
~~~

Statuses: pending, in_progress, done, cancelled. Dependencies must be acyclic.
A started/done task requires completed dependencies. Task state changes do not invalidate scope approval;
changes to title, covers, depends_on, verify or normative body do.
Execution evidence may use the task evidence field without changing normative scope.
An external-only verification task may use kind: verification, status: deferred and deferral: {by: Name, reason: Explanation}.
It must cover external acceptance IDs, not replace unfinished implementation. Actual verification requires updating it to done.
Deferral execution metadata does not change the approved plan, but does bind the verification fingerprint.
Light changes may omit TASK.md. Standard/rigorous changes require at least one task.

To cancel an item, retain its ID and add status: cancelled and cancellation: {by: Name, reason: Explanation}.
Reassign or cancel dependent references consistently. No automatic code deletion is inferred.
IDs previously recorded by scope approval cannot disappear from a later revision.

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
Store evidence under the spec folder so filling it does not itself change the application source fingerprint.
If EVIDENCE.json already exists, the default command returns a new revision-specific filename and preserves
the previous observations. Use that returned path with --evidence. An explicit --out never overwrites a file.

~~~sh
sdd verify 001-addition --evidence agents/specs/001-addition/EVIDENCE.json
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
Research is optional for other modes. It does not replace the authoritative sources.

## Project policies, revision and history

POLICIES.md contains mandatory project-specific constraints and is preserved by updates.
Scope approval binds these policies, check commands and verification exclusions in addition to the plan.
It also binds QUALITY.md and quality settings. Advisory checks cannot be the evidence for required acceptance.
Context budgets are diagnostic settings and do not change scope approval by themselves.

Each approval retains a normative snapshot in history/approval-*.json. Editing a rule or policy
does not rewrite that prior snapshot. Use sdd revise ID --by NAME --reason TEXT --dry-run to inspect
affected task states, then record the revision and authorize the new scope.
Requirement/acceptance links determine local impact; policy, prose or reference changes may reopen all tasks.
Dependent tasks are reopened transitively. The agent must still review semantic impact and update tests.

Each verification run retains runs/RUN_ID/receipt.json alongside its logs; verification.json is the current view.
These historical records are not loaded automatically into context.
