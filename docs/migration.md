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
- Research is optional except in rigorous mode.
- Task state lives in YAML metadata, with no duplicate PROGRESS table.
- Approval applies to scope, not to six independently mutable files.
- Mandatory project constraints live in POLICIES.md; skills carry conditional procedures.
- Approved-scope snapshots, revisions and each run receipt remain available outside default context.
- Tests may be automated, manual or inspection-based.
- Partial verification is supported and cannot close a change.
- Closing requires fresh full evidence and explicit consolidation.
- Full limited verification may close implementation with a current environment handoff, retaining pending tests explicitly.
- Existing checks remain required/local. Classify external checks deliberately; they no longer run without --run-external.
- QUALITY.md is project-owned. New quality policy fields can invalidate old active approvals; review/reapprove their actual scope.
