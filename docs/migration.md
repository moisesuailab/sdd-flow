# Updating and converting existing projects

## 3.0: readable Markdown and local technical records

CLI context JSON carries the document text once in content; entries now holds path/section/reason/byte metadata.
Consumers of entries[].content should use content or the JavaScript context() API, which retains full entries.
The packet carries selected skill metadata only; use sdd skills list for additional on-demand discovery.

Update the CLI, run sdd update --dry-run, review/apply sdd update and refresh any installed harness adapter.
Existing specs stay in their original format and keep working. Existing configuration is preserved; new specs
use readable Markdown by default unless artifact_format: yaml is explicitly retained.

~~~sh
sdd migrate 001-your-change --readable --dry-run
sdd migrate 001-your-change --readable
~~~

Conversion preserves IDs and task states, backs up originals locally, moves old runtime records to ignored .sdd/
and creates a pending research entry point if absent. It does not invent past research. Active specs return to draft
with approval cleared; closed/cancelled lifecycle is preserved. Old evidence remains historical, not current proof.
Review the converted scope, record actual authorization and verify current inputs again. No application code is changed.

Move operations preflight collisions and restore original documents/inventory on failure; backups remain local.
Files already tracked by Git are not untracked automatically. Review the staged deletion/move and run sdd privacy.
See [readable specs](readable-specs.pt-BR.md) and [privacy](privacy.pt-BR.md).

Normal resumption now uses SPEC/TASK and optional short Notas/Notes on the relevant task. Existing STATE.md
is not deleted or automatically copied into TASK; inspect unique useful information before any manual cleanup.
It is no longer automatically loaded, but remains available through an explicit context reference or targeted read.
Do not create replacement progress/summary/checkpoint files. Notes are observational and do not redefine scope or test results.

Local privacy now defaults to warn even if an existing config omits privacy.local_mode. Keep configured strict only
when the team intends protected local operations to reject suspicious text. Ordinary context omits confidential sources;
use --include-private for authorized selected documents. Credential/runtime files remain excluded; sharing checks stay strict.
Update merges the central private-area Git ignore. The exact uncustomized privacy policy from an earlier stock template
is backed up and refreshed; customized PRIVACY.md remains preserved and must be reviewed for the new distinction.

# Migrating from 1.x

2.x changes the artifact format and requires Node.js 22+. Work in a versioned branch and review the diff.

## Preview and install the new core

~~~sh
sdd update --dry-run
sdd update
~~~

The updater recognizes unchanged templates from the 1.3.3 baseline.
It preserves project-owned PROJECT.md, POLICIES.md, config.yaml and the historical DECISIONS.md.
The root entry point is a managed block; existing custom content outside that block is preserved.
Custom or unowned core files produce a conflict and no planned template writes are applied.
Review them before using sdd update --replace-managed. Replaced contents are backed up under agents/.sdd/backups/.

Do not use replacement as an automatic resolution for project-specific requirements.
Move durable rules to the project map, current contracts or ADRs, then review the new core.

## Migrate legacy skills

1.x skills have no YAML front matter, which 2.x requires (name and description). Until they are migrated,
sdd doctor, sdd skills list and sdd context fail.

~~~sh
sdd skills migrate --dry-run
sdd skills migrate
~~~

The command adds name (the folder name) and description (taken from "When to use", or a placeholder), keeps the body,
and backs up the originals under agents/.sdd/backups/. Review each description: it controls when the skill is selected.
Folders whose names are not valid skill names are reported and skipped; rename them and rerun.

## Migrate each legacy change

~~~sh
sdd migrate 001-feature --dry-run
sdd migrate 001-feature
~~~

Migration adds change.yaml and preserves the original Markdown bodies.
It extracts recognizable task IDs/statuses without inventing requirement links or verify evidence.
Original files are backed up. The new scope remains draft and unapproved.
Legacy context remains readable before migration with an explicit warning.

Review SPEC.md requirements/acceptance and TASK.md covers/verify/dependencies.
Consolidate current behavior from the old specs into current capability documents.
Remove legacy: true only after normalization. Resolve sdd check findings and record actual authorization.
Old PROGRESS.md, TEST.md, decisions and validation reports remain historical; v2 does not treat them
as canonical state or current execution evidence.

## Adapters and old settings

~~~sh
sdd harness claude-code
sdd harness opencode
~~~

2.x installs native commands and a workflow skill, plus a managed CLAUDE.md entry for compatible clients.
No permission settings are changed. Existing 1.x active hooks/settings are not silently deleted.
Review old .claude/settings.json, opencode.json(c) and agents/harness references manually.
Remove obsolete blocks only after confirming which parts belong to the old workflow.

Existing adapter files with local/unowned edits are preserved and reported.
Removal deletes only files whose current content matches the recorded ownership hash.
Update installed wrappers by rerunning the corresponding harness command after a core upgrade.

## Backups and recovery

The current 2.x core discovers manifest IDs independently of directory names. Existing IDs need no conversion.
After updating, run sdd reconcile --dry-run and sdd reconcile while historical specs are still present to inventory observed closures.
Use rename/archive/restore/remove to organize specs; related and historical source references are optional additions.
Status defaults to active specs; --all includes archives, recoverable removals and retained records.
See spec-management.pt-BR.md. Missing old content without a recorded closure remains unknown rather than automatically passed.

Backups retain project-relative names under the reported backup directory.
Compare and restore only the desired files. The CLI never runs Git reset or rewrites repository history.
Do not delete the registry when archiving changes; it reserves IDs even if directories later move.
If a crashed process leaves agents/.sdd/lock, confirm no SDD mutation is active before removing it.

## Behavioral changes

- New projects default to step; explicit user authorization for several/all tasks permits a bounded batch.
- Existing configured autonomy is preserved. Update does not reset a project's batch preference to step.
- New standard/rigorous specs have a pending RESEARCH.md; standard may document why research is not needed, while rigorous requires completed research. Light keeps research optional.
- Task state has one source: the TASK.md entry with [ ]/[x]/[-] and optional open-task Situação/Status notes in the readable format, or YAML metadata in retained legacy specs. Earlier [/] and [>] remain readable. There is no duplicate PROGRESS table.
- Approval applies to scope, not to six independently mutable files.
- Mandatory project constraints live in POLICIES.md; skills carry conditional procedures.
- Approved-scope snapshots, revisions and each run receipt remain available outside default context.
- Tests may be automated, manual or inspection-based.
- Partial verification is supported and cannot close a change.
- Closing requires fresh full evidence and explicit consolidation.
- Full limited verification may close implementation with a current environment handoff, retaining pending tests explicitly.
- Existing checks remain required/local. Classify external checks deliberately; they no longer run without --run-external.
- QUALITY.md is project-owned. New quality policy fields can invalidate old active approvals; review/reapprove their actual scope.
