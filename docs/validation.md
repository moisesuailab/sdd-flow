# Implementation validation — 3.0.0

Updated: 2026-11-22. GitHub baseline: d2cee6cd8bd10b541bebc1dc1259358077608d4d.
The registry was observed on 2026-11-21 at 2.2.0 (gitHead 5eba2ab84a92ef3929328ece34336b113343de60).
These are source-validation results. Publication is a separate maintainer action.

## Current observed results

| Check | Result |
|---|---|
| Windows, Node.js 24.12.0 | 167 tests passed |
| GitHub Actions, Linux and Windows, Node.js 22 and 24 | 167 tests passed (CI for the 3.0.3 commit) |
| npm ci from the unchanged lockfile | Passed |
| Package syntax, templates and native adapter/export contracts | Passed |
| Real tarball packed and installed in an isolated consumer | Passed on both tested Node versions |
| CLI from a path containing spaces | Passed |
| npm publication dry run (no registry write) | Passed with tests and package checks in the required hooks |
| Exact version/channel registry preflight | 3.0.0 / next available at inspection; recheck before publication |
| Staged workflow-artifact privacy inspection | Passed, no findings in its declared scope |
| Diff whitespace and documentation file links | Passed |
| Conversion of an existing in-progress spec archive | Preserved all requirements, acceptance, task IDs/states and historical receipt bytes; repeated conversion was a no-op |
| Application commands during the archive conversion exercise | None; this was artifact conversion, not application acceptance testing |

## Scanner and context audit

The tracked source contains only templates/agents/_gitignore, not the obsolete .gitignore. The installer now
ignores a stale .gitignore source left by an overlay update. The installed-tarball test injects that duplicate
and verifies preservation of team rules plus canonical spec exclusions. Package checks require a clean source layout.

The review's scanner performance issue was reproducible: a 100 KiB a- sequence exceeded a bounded 3-second
child process on the prior source. Identifier/scheme restart backtracking and repeated line-prefix counting
were removed. A warm five-run median on Linux/Node 24.22.3 measured approximately 1.8 ms for 100 KiB and
15.8 ms for 1 MiB. A separate bounded-process regression covers repeated hyphens/underscores/dots/assignments
and 10,000 findings with correct line numbers. These are observed samples, not a universal timing guarantee.

Twelve explicit English/Portuguese requirement-prose cases remain unchanged, including the four review examples.
Nine representative synthetic credential formats remain detected/redacted; additional tests cover quoted values,
registry tokens and structured authorization/cookie headers. Strict local approval/context accepts the login prose.
This finite corpus does not establish zero false positives or universal secret detection.

A synthetic task packet with 30 requirements and 60 unselected skills fell from 43,277 to 12,007 UTF-8 bytes
after removing unused skill metadata and keeping discovery on demand. Canonical task-selected documents cannot
be loaded again as whole-file duplicates; explicit extra sections still work. CLI JSON carries each document
body only once. This measures packet size, not model token cost or application-result quality.

Local validation reports are excluded from npm; packaged Markdown links and absence of stale/internal
files are tested. Product docs use neutral version wording. Real-project 2.2 upgrade validation and interactive
harness runs are not covered by the automated suite and remain the maintainer's to confirm.

## Lifecycle and privacy regression coverage

The original schema 2 lifecycle, cancellation, approval, revision, dependency, migration, environment-handoff,
manual-observation and installed-package tests still run. Test fixtures explicitly exercise the existing YAML
representation; new tests additionally exercise the readable default and private runtime layout.

Readable-format tests cover three visible markers with short open-task notes preserving all five logical states,
compatibility with earlier [/] and [>] markers, rejection of contradictory completion/status notes,
truthful limited closure with an unchecked deferred external-verification task, canonical Markdown without duplicate YAML arrays,
manual status edits that preserve approval, normative edits that invalidate it, task-scoped context, research
entry points, readable/legacy coexistence, archive/rename with current receipts, additional field preservation,
ordinary Markdown indentation/case/plain IDs, conservative revisions without local snapshots and rejection
of conflicting or malformed records.

Minimal-resumption tests establish that new specs do not create STATE.md, legacy STATE remains untouched
and outside default context, and an explicit reference can still select it. Short task Notes survives readable
round trips and task-scoped context without invalidating scope approval or existing execution receipts.
Normative edits still invalidate approval/verification; notes cannot complete a pending task, fabricate evidence
or close partial work. Non-text task notes are rejected. The document-creation policy guides agents to reuse
canonical files; it does not intercept arbitrary harness file writes.

Migration tests preflight without writing, preserve originals and completed/deferred task states, clear active
approval, keep old validation historical and demand fresh verification. Failure injection verifies restoration
of documents, moved records and inventory. Original source artifacts are not included in this repository.

Privacy tests cover nonblocking local warnings without source mutation/value leaks, opt-in strict mode,
safe placeholders/environment references, credential/runtime references rejected from context, private Git ignores and restrictive local file permissions,
logs disabled by default, opt-in log redaction across split chunks, separate stdout/stderr filtering, staged-index
inspection despite a clean working copy, already tracked private artifacts, root credential filenames,
configured confidential prefixes (including path aliases/trailing slashes), explicit private-context inclusion/omission,
private-source fingerprint freshness, warning-only local approval/migration/manual evidence, private local-adapter pointers,
restrictive distribution exports,
filtered public handoff guides with private originals and independent valid hashes, ignore merging/idempotence and
CLI diagnostic filtering. Stock preview privacy-policy replacement is backed up; customized policy files are preserved.
The packed template uses _gitignore so npm ships it; the installer maps it to agents/.gitignore.
The installed-tarball test checks actual backup and central private-area exclusions,
and local private writes establish fallback ignore rules before storing sensitive runtime material.
The Node 22 run exposed stderr warnings interleaving split stdout credentials; streams are now filtered
separately before they are combined. All credentials used in these tests are synthetic.

A representative supplied archive conversion preserved completed/deferred states and source content without
executing its application, inventing research or claiming its outstanding acceptance passed. It also exposed
field-order normalization affecting repeated conversion; formatting is deterministic and already-readable
specs are detected by their declared format/storage rather than requiring byte-identical pretty printing.

## Release and practical limits

- Windows is configured in CI but this 3.0 change was not executed on Windows here.
- Interactive Claude Code/OpenCode applications were not exercised; their generated layouts and references were checked.
- Secret detection/redaction is heuristic and can miss encoded/custom credentials, personal data and business secrets.
- The CLI cannot intercept arbitrary native-tool writes or prevent force-adding ignored artifacts. Review remains required.
- Ordinary context omits confidential sources and reports omissions; authorized inclusion is explicit. Private context
  may contain confidential business/personal data despite credential redaction. Git ignores do not restrict model-provider access.
- Local warnings deliberately permit source preservation and continued work; they do not certify a file as safe to share.
- Local records/backups are plaintext; ignore rules do not remove previously tracked files or clean shared history.
- Scope approval records declared authorization, not authenticated identity or cryptographic attestation.
- Passing command links do not prove semantic test coverage. Manual/inspection outcomes remain recorded observations.
- No benchmark proves lower model token cost or superiority over another workflow. Readability and deterministic
  lifecycle/privacy behaviors were checked; model behavior still needs project-level evaluation.
- Historical 2.x CI/coverage/audit results are not presented as current 3.0 measurements.

Repeat with npm test and npm run check, then follow releases.pt-BR.md before publishing.
