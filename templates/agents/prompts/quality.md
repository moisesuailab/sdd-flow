---
schema_version: 2
kind: procedure
description: Select meaningful quality evidence without imposing a stack or a production environment.
---

# Quality practices

Load this procedure when defining or reviewing test strategy, quality thresholds or environment limitations.
Project-specific criteria belong in QUALITY.md, mandatory constraints in POLICIES.md and tool settings in their native files.

## Acceptance by examples

Explore concrete examples with the developer: initial state, action and observable result.
Include relevant boundaries, invalid input, permissions and integration failures.
Store the examples in the existing SPEC acceptance descriptions, linked to requirement IDs.
BDD does not require Gherkin files, Cucumber or duplicate specifications. Do not invent business approval.

## Test-first and TDD

Follow config quality.tdd (optional, preferred or required). For a reproducible defect, add a regression test when feasible.
Use small RED–GREEN–REFACTOR cycles: observe the intended failing test, implement the behavior, then improve structure.
A setup/import/syntax error is not automatically evidence of the intended behavioral failure.
Record useful command/run references in task evidence; keep detailed logs outside default context.
Partial verification can record RED and subsequent GREEN runs; expected RED is not a final approved result.
Do not claim TDD merely because the final suite passes. The CLI does not certify the chronological practice.

## Metrics and analysis

Use coverage to find untested behavior, and review assertions, not only percentages.
Complexity identifies code needing examination; do not split functions mechanically to game a score.
Choose tools/thresholds for the project's language, baseline, risk and change. Track legacy findings separately.
Mutation tests, dependency checks, security analysis and load tests are conditional, not universal requirements.
An advisory metric must not be the sole evidence for a required acceptance criterion.

## Missing environments and user handoff

Run available, authorized local checks. Do not demand production/homologation access to complete implementation.
Do not call missing access a passing test, or an actual behavior failure merely a missing environment.
Use external on the actual environment-dependent check or manual/inspection criterion.
Use kind: verification and status: deferred only for genuine external verification tasks, with by and reason.
Implementation tasks cannot be deferred as if their code were complete.

Run sdd handoff ID; fill the returned JSON with reason, responsible role, environment, prerequisites,
short steps, observable expected result, safety constraints and the condition for resuming.
When no safe test exists, use environment: unavailable, explain why and leave steps empty.
For an actionable test, use an isolated/non-production environment or a genuinely read-only production observation.
Do not suggest production writes, deletions, load, permission changes or real-data manipulation just to prove success.
If an operation cannot be shown to be safe, defer it rather than improvise. A JSON field cannot prove safety.

Run sdd verify ID --handoff PATH. External commands are not run by default.
Use --run-external only when execution in the actual target environment is available and authorized;
the flag itself grants no permission. Preserve actual failures, partial results and warnings.

Full limited verification can close the implementation with explicit pending verification and USER_TESTS.md.
It is not a successful external test, a release approval or evidence that production works.
When access/results become available, reopen and verify with actual evidence. Keep the earlier closure in history.
