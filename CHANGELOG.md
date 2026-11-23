# Changelog

## 3.0.2 — 2026-11-23

- Agents now confirm a new spec's name and scope before creating it (unless creation is already authorized, including a bounded set the user requested). Creating a spec never approves its implementation scope. Guidance only: the CLI does not enforce it, and `sdd update` delivers it through the managed RULES.md and intake prompt.

## 3.0.1 — 2026-11-23

- Create lean spec/research/task skeletons without filling instructions or marker legends; keep drafting guidance in phase prompts and clean drafts before approval without rewriting existing specs.

## 3.0.0 — 2026-11-22

- Remove quadratic scanner searches/repeated line-prefix counting; distinguish ordinary requirement prose from assigned credentials and test adversarial inputs in a bounded process.
- Keep only selected skill metadata in context, deduplicate task-selected documents and avoid duplicate bodies in CLI JSON.
- Ignore stale .gitignore source templates while preserving canonical ignore merging; exclude local delivery/validation reports from npm documentation.
- Generate readable Markdown requirements, acceptance and visible task markers with small metadata; retain YAML schema 2 reading.
- Use only [ ]/[x]/[-] in new task rendering, with short open-task Status notes; preserve five logical states and read earlier [/] / [>] artifacts.
- Document reading by phase/need so routine review stays centered on the spec instead of all workflow files.
- Resume from SPEC/TASK with optional short observational Notes; preserve existing STATE files without automatically loading them or creating duplicate checkpoints.
- Exclude observational task notes from scope/verification fingerprints while retaining requirements, task-state and evidence controls.
- Create standard/rigorous research entry points without inventing findings; keep light minimal.
- Keep new runtime receipts/snapshots/evidence in ignored local .sdd/ storage; logs default off.
- Separate local privacy warnings from restrictive sharing checks; preserve local source content, with strict mode opt-in.
- Add a central Git-ignored private working area and explicit --include-private context selection without exposing credential/runtime files.
- Keep distribution exports/private-index inspection restrictive, filter CLI/opt-in logs and preserve private handoff originals with a filtered public guide.
- Avoid copying private instructions into local native adapters; refresh only the recognized earlier stock privacy policy and preserve team customizations.
- Ship ignore rules through a packable template name and verify their effect in the installed tarball.
- Add previewable readable migration with backups, preserved task states and honest reauthorization/reverification.
- Shorten/localize validation and deduplicate user-test prerequisites while preserving immutable local run guides.


## 2.2.0 — 2026-11-21

- Context budget is advisory by default: `context.budget_mode: warn|strict` and `sdd context --budget-mode`. Existing projects without the field now receive oversized packets with a warning instead of CONTEXT_BUDGET_EXCEEDED; set `strict` to keep the old behavior.
- Referenced context/source files may exceed 2 MiB (up to 64 MiB); config, manifests and internal files keep the 2 MiB limit.
- Add `sdd skills migrate [--dry-run]`: adds the required front matter to legacy 1.x skills (backup kept, bodies preserved, description derived from "When to use"). Legacy skills now fail with a message pointing to it.
- `sdd migrate` refuses a spec folder without SPEC.md with a clear error instead of leaving a manifest that breaks `sdd context`.
- Intake/plan guidance no longer treats size alone as a reason to split a spec.

## 2.1.0 — 2026-11-21

- Decouple stable spec identity from directory names and visual numbering; preserve existing schema 2 IDs.
- Add previewable rename/archive/restore/remove operations, recoverable trash and explicit permanent discard.
- Retain compact observed closure summaries and resolve moved structured references without rewriting prior evidence.
- Add optional historical links, localized missing-prerequisite diagnostics and inventory reconciliation; keep required acceptance honest.
- List active specs by default with status --all for archive/trash/retained metadata; isolate malformed unrelated manifests.

## 2.0.1 — 2026-11-20

- Default new projects to step; follow explicit multi-task/all-task authorization as a bounded batch without resetting existing project preferences.
- Redesign README and update usage, migration, format and validation documentation accordingly.
- Add default engineering rules: KISS/Clean Code/YAGNI/DRY/SOLID guidance and no redundant comments or docblocks.

## 2.0.0 — 2026-11-20

Breaking: Node.js 22+, schema 2 artifacts, canonical YAML task state and version-bound scope/evidence.

- Replace fixed-line skill scanning with real YAML metadata and a discovery catalog.
- Add light/standard/rigorous modes and configurable step/batch autonomy.
- Add context, check, approve, evidence, verify, close, reopen, cancel, status, doctor and migration commands.
- Preserve existing entry-point content and customized files; add dry-run, ownership tracking and backups.
- Support manual/inspection evidence, partial verification and stale-input detection.
- Consolidate current knowledge before archival; reserve IDs beyond 999 and across archives.
- Install active Claude Code/OpenCode entry points and export versioned knowledge bundles.
- Retire distributed regex/TTY shell hooks; preserve old project settings for explicit migration review.
- Add automated regression tests, package checks and CI.
- Add body-free context inspection, section-scoped requirement sources and broad-request intake guidance.
- Preserve mandatory project policies, approved scope snapshots, revision impact and individual run receipts.
- Prepare manual OIDC npm publishing with next-first distribution, release identity checks and usage/release guides.
- Clarify the methodology's harness-independent scope and optional session boundaries, without adding an orchestrator.
- Carry a configurable project documentation language in context, preserve UTF-8/diacritics and seed Portuguese artifacts.
- Preserve completed setup on reinitialization with accurate maintenance guidance; add PowerShell testing/release instructions.
- Add required/advisory quality gates, opt-in external checks and project-owned quality policy.
- Record version-bound environment handoffs and safe user-test guides; allow implementation closure with explicit limitations.
- Preserve known observed failures, deferred verification tasks and later real verification without erasing history.
- Strengthen optional BDD/TDD guidance while keeping detailed quality procedures outside default implementation context.
- Make PRD/ADR/design inputs optional, strengthen existing-project baseline adoption and scoped consumer-regression analysis.
- Make the offline installed-package smoke test independent of warmed npm registry metadata caches.
- Restore opt-in legacy reference drafts with init --docs and add selected PRD, system design, design system, ADR and roadmap presets.
- Preserve existing reference files, preflight document collisions and distinguish proposed ADR templates from actual active decisions.

## 1.3.3

Previous public baseline, analyzed at commit d84c62d51d9c566b0f3e8a6279418220e0fc6e8f.
