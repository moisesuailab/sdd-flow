# Implementation validation

Date: 2026-11-20. Source baseline: d84c62d51d9c566b0f3e8a6279418220e0fc6e8f (1.3.3).
This source prepares 2.0.0; no npm or marketplace release was published.

## Observed automated results

| Environment/check | Result |
|---|---|
| Linux, Node.js 24.22.3 | 88 tests passed |
| Linux, Node.js 22.23.5 | 88 tests passed |
| Package syntax/template/export contracts | Passed |
| Real npm tarball installed in a separate temporary consumer | Passed on both tested Node versions |
| CLI initialization from a path containing spaces | Passed |
| Dependency audit | 0 reported vulnerabilities for the installed runtime dependency set |
| Diff whitespace validation | Passed |
| npm publication dry run (no registry write) | Passed |
| Exact version/channel and public-registry availability preflight | Passed for 2.0.0 with next |

The automated suite exercises actual passing/failing test processes, stale scope/evidence,
partial verification, manual/inspection closure, preservation/conflict handling,
cancelled history, archival/reopen, timeout behavior, YAML errors, restricted paths,
native layouts and conservative migration. Assertions check outcomes rather than only file existence.

Additional scenarios cover context-size diagnostics without exposing document bodies, explicit source
sections, local business-rule revisions and dependent-task reopening, project-policy changes,
preserved approval snapshots and run receipts, release-channel checks and fail-closed registry errors.
The package includes the Portuguese usage/release guides and project-policy/intake templates.
Additional language/reinitialization tests cover optional legacy configuration, locale validation,
UTF-8/Portuguese accents in generated artifacts and context, stable machine IDs, and preservation
of a configured project without requesting a removed setup guide. Portuguese methodology,
local testing and GitHub publication instructions are included in the source/package.

Quality/environment scenarios additionally verify required versus advisory checks, opt-in external
execution, honest limited closure, deferred verification tasks, safe handoff validation, stale/tampered
instructions, preservation of known failures, reopening with actual observations and per-run user-guide history.
Limited implementation completion is explicitly distinct from fully verified acceptance and deployment approval.

New adoption/regression scenarios start from a plain user goal without PRD/ADR, preserve existing
application code/product documents on installation and catch an actual consumer regression while
the edited function's isolated unit test remains green.
The installed-package test now uses a fresh temporary npm cache and a local tarball of the installed
parser, removing its accidental dependency on warmed registry metadata after an environment restart.

Optional document scaffolding is exercised both from source and the installed tarball: the legacy
PRD/roadmap/system-design set, selected design-system/ADR drafts, proposed decision metadata,
Portuguese accents, preservation of existing content, read-only previews and preflight path collisions.

Installation assertions also verify the new step default and preservation of an existing batch choice
across reinitialization and updates. Multi-task authorization is a procedure followed by the agent;
the CLI does not inspect a conversation or certify that the agent actually stopped between tasks.

## Advisory code metrics

Node.js 24 test coverage reported 94.17% lines, 81.16% branches and 94.15% functions in its instrumented
report (CLI, lib, release-check and test-support). This is not application acceptance coverage;
child-process instrumentation and the included helper files limit interpretation of the aggregate.

ESLint 10.15.0 cyclomatic complexity analysis, using a diagnostic warning threshold of 20, identified
maintenance hotspots in validation, revision, context composition and command dispatch.
These findings remain advisory; no universal threshold is imposed on consumer projects or used
to claim that all quality metrics passed. Broad mechanical refactoring was outside this functional change.

## Independent workflow exercises

An independent agent followed the generated workflow skill in isolated projects:

1. A standard JavaScript addition module: 11 success/rejection regression tests,
   one observed manual acceptance case, current capability consolidation, full verification,
   archival, reopening and rejection of immediate reclosure without a new receipt.
2. A light manual-only change with no task file or test framework: actual manual evidence,
   approved-requirement revision, stale authorization/evidence rejection, reauthorization,
   revised verification and archival.
3. Existing team instructions, native settings and unrelated commands survived installation.
   Customized workflow/native files were preserved; explicit replacement created backups.
   All three exported layouts included their license and referenced resources.

The exercises exposed a setup-removal contradiction and evidence-regeneration friction.
Both were corrected and covered by regression tests.
Tests also detected inherited node:test context suppressing nested tests and environment warnings
interfering with JSON error parsing; the runner and machine-output channel were corrected.
The full publication dry run also exposed inherited npm dry-run configuration preventing the
tarball smoke test from creating its temporary artifact; the test explicitly isolates that flag.

## Limits and pending release checks

- Windows execution is configured in CI but was not run in this Linux workspace.
- The npm registry still reports 1.3.3 as latest. No authenticated npm publisher was available locally.
- GitHub integration rejected repository writes with HTTP 403; no remote PR or CI run was created.
- Trusted publishing must be configured by the package owner before the manual release workflow can publish.
- Claude Code and OpenCode applications were not installed. Layouts and metadata were tested;
  interactive tool-version compatibility remains a release check.
- No comparative model benchmark against other frameworks was performed.
- Manual evidence and approvals are recorded assertions, not authenticated attestations.
- Configured commands use the current account permissions. Native permissions and environment
  isolation remain necessary; the CLI is not a sandbox.
- Passing a configured command does not prove semantic coverage of every linked acceptance criterion.

Use docs/quality.md to repeat checks and record future release evidence.
