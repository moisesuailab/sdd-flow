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
- specs/ID/SPEC.md: normative requirements and acceptance in front matter; rationale in the body.
- specs/ID/TASK.md: the only task state; optional in light mode.
- specs/ID/STATE.md: optional bounded resumption note, without a duplicate task table.
- specs/ID/verification.json: execution receipt for a specific input digest.
- specs/ID/history/: prior approved scope snapshots and revision/lifecycle events.
- specs/ID/runs/: immutable run receipts and command logs.
- archive/: closed change history, consulted when relevant.

## Modes and autonomy

Light: SPEC and change manifest; tasks and research are optional.
Standard: add cohesive tasks. Research is optional when uncertainty is low.
Rigorous: add evidence-backed RESEARCH.md and explicit scope authorization.
Verification and consolidation apply to every mode.

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
For changed approved requirements, revise the contract/plan and run sdd revise ID --dry-run,
then record the revision, review impacted tasks and obtain authorization for the new scope.
