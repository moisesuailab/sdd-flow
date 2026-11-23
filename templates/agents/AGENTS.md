---
schema_version: 2
kind: workflow
description: Navigate change planning, implementation, verification, and consolidation.
---

# Workflow map

| Need | Load |
|---|---|
| Discover unknown requirements or code | prompts/rpi-research.md |
| Define observable scope and acceptance | prompts/rpi-plan.md |
| Execute an approved cohesive task | prompts/rpi-implement.md |
| Verify completed or partial work | prompts/rpi-validate.md |
| Consolidate and close | prompts/rpi-close.md |

Phases are logical responsibilities, not mandatory session boundaries. Continue in one session,
use native delegation, or start a new session according to the harness and the task.
Transfer a small, explicit context packet with sdd context; keep source links available.
After compaction or a handoff, recover current scope, task state and evidence from the canonical files.
This methodology does not create an orchestrator or require multiagent support.

## Sources of truth

- config.yaml: project mode, autonomy, approval policy and exact checks.
- POLICIES.md: mandatory project-specific constraints, preserved by updates.
- QUALITY.md: project quality criteria for planning/review; config.yaml selects TDD and check policies.
- current/: current behavior and invariants by capability.
- decisions/: applicable ADRs with active/superseded status.
- specs/ID/change.yaml: scope references, lifecycle and versioned authorization.
- specs/ID/SPEC.md: readable requirements/acceptance lists; small metadata; existing YAML specs remain supported.
- specs/ID/TASK.md: the only task state, with optional short Notes for blockers/next actions; optional in light mode.
- specs/ID/.sdd/verification.json: execution receipt for a specific input digest.
- specs/ID/.sdd/history/: prior approved scope snapshots and revision/lifecycle events.
- specs/ID/.sdd/runs/: immutable run receipts and command logs.
- archive/: closed change history, consulted when relevant.

## Modes and autonomy

Light: SPEC and change manifest; tasks and research are optional.
Standard: add cohesive Markdown tasks and a RESEARCH.md entry point. Fill actual findings or explain why research is unnecessary.
Rigorous: add evidence-backed RESEARCH.md and explicit scope authorization.
Verification and consolidation apply to every mode. Technical paths above apply to new readable specs;
old root-level runtime records are supported until explicit sdd migrate ID --readable.
Use SPEC.md, TASK.md and VALIDATION.md for routine review; do not load .sdd records into ordinary context.
Readable task markers are [ ] unfinished, [x] done and [-] cancelled. Qualify open tasks with a short
Situação/Status note only when useful (in progress or pending external verification); remove it on completion/cancellation.
Keep required deferral actor/reason and user instructions. Legacy [/] and [>] remain supported for reading.
Only genuine external verification can be deferred. Producing code, documentation or recommendations is still
implementation work when it remains part of the delivery; use partial verification while that work is pending.
See PRIVACY.md for safe versioning. Private local snapshots may be absent in another checkout: reverify;
scope revisions then reopen impacted work conservatively rather than inventing missing evidence.
Necessary confidential documents belong in agents/.sdd/private/; local-mode warnings do not block development.
Context omits those sources by default. Use --include-private for authorized needed references/sections, never
bulk-load the private area. Credential/runtime files remain excluded. Sharing checks and exports stay restrictive.

## Read only what this phase needs

The context packet includes RULES, PROJECT and applicable POLICIES as its core, plus the current phase prompt.
Use --task to select the relevant requirements, acceptance and task rather than loading the entire plan.
Research and plan add research findings and declared source references. QUALITY is selected for plan/validate/close.
Load only selected current contracts, decisions, skills and explicit docs references; never bulk-load docs/ or old specs.
The packet carries only selected skill metadata; discover additional skills on demand with sdd skills list.
Do not save context packets as new documents or repeat entire artifacts in chat; report results and next actions concisely.
Resume from SPEC/TASK, their dependencies and current validation. Replace short task Notes as blockers/next actions change;
they are observations, not requirements, completion or test evidence. Do not create STATE/PROGRESS/SUMMARY/checkpoint files for routine work.
Existing STATE.md is preserved but not automatically loaded; consult it only if needed or explicitly referenced.
Consult VALIDATION and USER_TESTS when reviewing results or performing pending checks. Technical receipts/history are
for targeted verification or investigation, not ordinary reading. The CLI reads config/change metadata for controls;
do not copy those fields into extra human-maintained documents.

Use one visible document per distinct purpose: research findings, scope/acceptance, tasks and current validation.
USER_TESTS is conditional on delegated verification. Reference source documents instead of duplicating them.
Do not create empty extra documents or split a short explanation across files just to follow an invented convention.
If a real need cannot fit the canonical artifacts, explain that purpose and choose a clear location; obey explicit user requests.

New installations default to step: stop after one task for review unless the user has authorized
specific additional tasks or all tasks in the current scope. That authorization permits a bounded
batch without repeatedly asking or changing the standing configuration. Approval of a plan alone
does not imply permission to run every task under step. Configured batch continues through authorized tasks.
Verify and update each task separately even in a batch; respect dependencies. Stop for changed requirements,
a blocking ambiguity, unauthorized actions or configured limits.
Partial verification provides feedback and never closes a change.
Full limited verification can close implementation with pending external checks and a current user handoff.
It does not claim external success or authorize deployment. Read prompts/quality.md for BDD/TDD and handoff details.

For oversized requests use prompts/intake.md and sdd context ID --inspect.
The context budget (context.max_bytes) is advisory by default (budget_mode: warn): it warns but keeps the full packet.
It does not limit file sizes or the model's context window; use budget_mode: strict to refuse oversized packets.
For changed approved requirements, revise the contract/plan and run sdd revise ID --dry-run,
then record the revision, review impacted tasks and obtain authorization for the new scope.

## Spec organization

Manifest ID is stable; folders and visual numbers are mutable. Use rename, archive, restore and remove
with --dry-run when reorganizing/discarding. Remove is recoverable unless --permanent is explicit.
Use status for active specs, --all for archive/trash/retained records, and reconcile to inspect missing/moved content.
Prefer current contracts for reusable knowledge, related for historical spec IDs, and historical: true only for optional
source/context provenance. Missing unfinished prerequisites need investigation/revision; do not restart the consumer or invent success.
