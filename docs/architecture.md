# Context and lifecycle architecture

This is a development methodology with executable checks, not an agent orchestrator.
Phases are logical responsibilities; sessions, compaction and delegation belong to the harness.

## Components

| Module | Responsibility |
|---|---|
| lib/io.js | Project-relative paths, atomic writes, hashing, bounded scans and mutation locks |
| lib/markdown.js / lib/readable.js | Small metadata, canonical Markdown lists, legacy YAML compatibility and heading selection |
| lib/project.js | Config, identities, skill catalog and input fingerprints |
| lib/catalog.js | Stable manifest identities, folder/alias resolution and compact retained closure records |
| lib/management.js | Rename, archive, restore, discard, impact previews and observed-inventory reconciliation |
| lib/check.js | Structural contracts, coverage references, cycles and approval checks |
| lib/privacy.js | Shared-artifact guards, local-output redaction and Git-index inspection |
| lib/adopt-readable.js | Previewable conversion with backups, state preservation and explicit revalidation |
| lib/reports.js | Short human-facing verification summaries |
| lib/context.js | Phase/task context composition with provenance and a byte budget |
| lib/verification.js | Command runs, observed evidence, receipts and closure |
| lib/history.js / lib/revisions.js | Immutable event/scope snapshots and explicit change-impact revisions |
| lib/quality.js / lib/handoff.js | Check policy, environment limitations and version-bound user-test instructions |
| lib/install.js | Ownership-aware updates, diagnostics and conservative migration |
| lib/documents.js | Optional reference-document drafts; preserve existing sources and require no fixed document set |
| lib/adapters.js | Native wrappers and export layouts from shared workflow knowledge |
| bin/cli.js | Arguments, orchestration, output and exit codes |

## Context selection

The initial entry point is a short map. Core constraints, project-specific mandatory policies, project map and the current phase
form the base packet. The active task selects its requirement/acceptance metadata.
The specification body remains available because scope constraints in prose must not be silently lost.
Selected current capability contracts and ADRs are loaded with provenance.
Only explicit skill selections load bodies and metadata into the packet; the complete catalog is discovered on demand
with sdd skills list. Equivalent whole-file references are deduplicated without undoing task-scoped selection;
explicit section references remain available. CLI JSON emits one content body with entry metadata, rather than two copies.
Sources/research are included during research/plan and remain available on demand otherwise.

Large documents can be selected by an exact ATX heading. Heading extraction ignores fenced code;
it ends at the next heading of equal or higher level. The budget measures UTF-8 bytes rather than estimating
model tokens. The default budget is a project setting, not a universal optimum.
`context.budget_mode` (default `warn`, override with `--budget-mode`) controls overflow: `warn` returns the full
untruncated packet with a warning and `fits_budget: false`; `strict` raises CONTEXT_BUDGET_EXCEEDED, a recoverable
selection checkpoint. Full packets depend on available memory and the harness's capacity.
Use --inspect to get sizes/remedies without emitting bodies. Referenced context/source files may reach 64 MiB;
config, manifests and other internal files keep the 2 MiB limit.
The framework cannot intercept arbitrary chat input; intake guidance handles broad requests at the agent level.

No vector database or model API is required. The agent can inspect additional code and sources
when needed, explaining the relevance. Selection completeness still depends on the project map
and declared relationships; scripts cannot infer every domain dependency.

Optional documentation.language selects the project-artifact language (auto when absent).
The context header carries the language and UTF-8 encoding. Distributed procedures remain English;
agents preserve the project's spelling and diacritics while keeping machine keys/IDs stable.
This is guidance plus locale validation, not linguistic certification or full CLI localization.

## Three distinct states

Scope authorization binds the normative specification, task plan, selected references, project policies and verification/execution policy.
Routine task status/evidence updates do not require reapproving an unchanged plan.
Execution state is canonical in TASK.md; optional short Notes holds current blockers/next actions without another file.
Do not create STATE/PROGRESS/SUMMARY files for routine work. Existing STATE.md is preserved and only read when needed
or explicitly selected, not automatically included in context.
Verification binds source bytes, selected workflow contracts, configuration and task states. Observational task Notes
is excluded from scope and verification fingerprints; it cannot substitute for requirements or execution evidence.

Approval is a recorded assertion of actual user authorization, not authenticated identity.
Changing its by field is not a security boundary. Tool permission enforcement belongs to the agent runtime.
Prior scope snapshots are preserved separately. Explicit revisions compare structured requirements,
acceptance and task links, reopen impacted tasks/dependents, and conservatively reopen all for broad policy/prose changes.
This comparison supports impact review; it does not infer all semantic dependencies.

## Evidence freshness

Source scanning includes project files outside agents/, excluding dependency internals and declared output paths.
Referenced workflow contracts and selected skill resources are included explicitly.
Mutation locks serialize SDD operations; they do not stop another editor or process changing source.
Verification compares inputs before and after running checks. Changes during the run fail the receipt.
Closure recomputes the fingerprint and rechecks logs/artifacts. A current full passed or limited receipt is required.
Limited records implementation completion with explicit external deferrals, not external test success or deployment approval.
Only environment-dependent verification can be deferred. Required observed failures remain failures for the same inputs;
omitting evidence or skipping external execution cannot silently erase them. External commands are opt-in.
Required checks gate completion; advisory issues remain visible. Handoff JSON and generated user steps are hash-bound.

Generated outputs must be excluded deliberately when commands create them; an overbroad exclusion
can hide meaningful changes. The CLI does not claim cryptographic attestation against someone
who can edit both source and evidence. It prevents accidental stale reuse in the intended cooperative workflow.

## Consolidation

Update current capability contracts before final verification and record the producing change ID.
Keep historical proposals, alternatives and execution logs in the change folder.
Closed changes can move to archive without changing identity.
Folder names and visual numbers are independent of manifest ID. Management moves preserve normative scope and receipts;
structural reference paths resolve through live identities/known aliases without rewriting historical bytes.
Missing historical sources may warn, while required contracts and unresolved execution prerequisites remain actionable.
Recorded closure summaries can outlive discarded spec content; they are historical facts, not fresh verification.
Reconcile records observed inventory only. It does not manufacture a missing closure, alter scope or infer business correctness.
Reopening preserves history and removes the current verification receipt; new verification is required.

## Decisions

Use a maintained YAML parser rather than a partial parser based on regex or fixed excerpts.
The sole runtime dependency is yaml, pinned through package-lock.json.
Keep the core portable and expose native wrappers separately.
Do not ship regex-based shell hooks as a security boundary.
Conservative migration preserves original bodies and never invents approvals or test success.

## Readable documents and private runtime records (3.0)

New SPEC/TASK documents declare format: markdown. The reader extracts the canonical body lists into the
existing internal schema 2 model; it removes those structured sections from normative prose before fingerprinting.
Execution status changes therefore do not reauthorize the plan. There is no independently edited derived task table.
Existing YAML-array documents are unchanged until explicit migration. Package 3.0 marks the changed generation defaults/layout.

New manifests use storage: private. .sdd/ inside each spec contains receipts, snapshots, handoff/evidence and
optional logs; it travels with manual/CLI folder moves but is ignored in Git. The small shared change manifest
and durable registry preserve identity, scope digests and compact closure history. Clones without runtime records
reverify; revisions without a local approval snapshot reopen conservatively.

Local privacy defaults to warn (including old configs without the field), preserving source documents and allowing
approvals/migrations/evidence processing despite suspected credentials. strict is opt-in. CLI output is sanitized;
emitted context marks credential redaction rather than redefining the contract. Parser diagnostics omit source excerpts.
Necessary confidential working material belongs in agents/.sdd/private/. Declared private sources participate in checks
and verification fingerprints but are omitted from ordinary context; --include-private selects them for authorized work.
Credential files/runtime receipts remain excluded. Exports reject declared private sources and detectable credentials.
Logs default off; opt-in output is redacted after capture,
including secrets split across process chunks. This is heuristic, not a sandbox, encryption or comprehensive DLP.
sdd privacy --staged scans indexed bytes and private filenames even if ignore rules now apply. It never rewrites
Git history, removes tracked data or rotates credentials. Private-area findings do not depend on secret detection.
Owners must review personal/business-sensitive data and the harness/provider's access; Git ignores do not enforce either.
