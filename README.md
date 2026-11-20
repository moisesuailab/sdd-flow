# sdd-flow

A portable development methodology for AI-assisted software work. Organize intent, load relevant
task context and retain traceable execution. Harness orchestration is outside the core's scope.

This checkout targets **2.0.0**. It is a breaking evolution from 1.x; publishing this source is a separate release action.
Requires Node.js 22 or newer.

Portuguese guides: [methodology](docs/methodology.pt-BR.md), [local testing](docs/local-testing.pt-BR.md),
[usage](docs/usage.pt-BR.md) and [GitHub/npm release](docs/releases.pt-BR.md).

## Try this checkout

~~~sh
npm ci
npm link
cd /path/to/your-project
sdd init --harness claude-code
# Alternatively: sdd init --harness opencode
~~~

Complete agents/SETUP.md and the short project map. Configure actual checks, then run sdd doctor.
For projects already using 1.x, read [migration](docs/migration.md) first.

## A change from plan to evidence

~~~sh
sdd new export-csv --mode standard
sdd context 001-export-csv --phase plan
# Author SPEC.md and TASK.md using the canonical formats.
sdd check 001-export-csv
# After the user authorizes this exact scope:
sdd approve 001-export-csv --by "Moisés"
sdd context 001-export-csv --phase implement --task T01
# Implement and verify the task, then set its canonical status to done.
sdd verify 001-export-csv --scope partial
# Consolidate lasting capability contracts before final verification.
sdd verify 001-export-csv
sdd close 001-export-csv --by "Moisés" --note "Local correction; no lasting contract changed" --archive
~~~

The approval command records authorization; it does not prove who typed it or grant runtime permissions.
Agents must use actual authorization already given by the user and must not fabricate it.

## What changes in 2.x

- **Short entry point:** a managed block preserves existing root instructions.
- **Structured metadata:** real YAML parsing, schema versions, stable IDs and explicit references.
- **Bounded context:** select the phase/task, current capabilities, active decisions and relevant skills.
  Overflow fails with file sizes; documents are never silently truncated.
- **One task state:** TASK.md front matter is canonical. STATE.md is an optional short resumption note.
- **Adaptive rigor:** light, standard and rigorous modes; step or batch autonomy.
- **Executable checks:** approvals bind to scope; receipts bind to source files, selected contracts and configuration.
- **Manual evidence:** manual and inspection cases can pass when observed and recorded for current inputs.
- **Consolidation:** close only with current full verification and an explicit current-knowledge update or explanation.
- **Safe maintenance:** dry-run, ownership checks, backups, legacy preservation and active adapter entry points.
- **Portable distribution:** export Agent Skills bundles, a Claude Code plugin directory, or an OpenCode skill layout.

## Commands

| Command | Purpose |
|---|---|
| init | Install missing project files and preserve project-owned configuration |
| docs --types prd,sd,ds,adr,roadmap | Create only selected missing reference drafts; --dry-run previews and existing documents are preserved |
| new NAME | Reserve an ID and create a change in the chosen mode |
| context ID | Compose the bounded packet; --inspect diagnoses size without emitting bodies; headings are selected in the manifest |
| skills list / show NAME | Discover metadata or read a selected body |
| check ID | Validate structure, references, task dependencies and phase gates |
| approve ID --by NAME | Record actual authorization for the current normative scope |
| revise ID --by NAME --reason TEXT | Preserve revision history, reopen impacted work and invalidate the prior scope approval |
| evidence ID | Create a template bound to current inputs for manual/inspection cases |
| handoff ID | Prepare version-bound external limitations and safe user verification instructions |
| verify ID | Run local checks; --handoff records limitations; --run-external opts into authorized external commands |
| close ID --by NAME | Require current full verification and consolidation; optionally --archive |
| reopen / cancel ID | Record explicit lifecycle decisions without deleting historical IDs |
| status / doctor | Inspect active/archive changes or diagnose project setup |
| update --dry-run | Preview installation changes; customized files are preserved unless explicitly replaced |
| migrate ID --dry-run | Preview conservative conversion of legacy artifacts |
| harness NAME | Install active native command/skill wrappers; --remove removes only unmodified owned files |
| export FORMAT --out DIR | Build a new directory for claude-code, opencode or agent-skills distribution |

All commands support --json. Exit codes: 0 completed (passed or limited), 1 invalid/failing, 2 partial verification.
Limited closes implementation with pending external verification; it never claims those tests passed or authorizes deployment.
Required checks block on failure; advisory checks remain visible warnings. QUALITY.md is loaded only for planning/review.
With --json, success and error objects use stdout; runtime/environment diagnostics remain on stderr.
CLI and documentation use English; project code, UI and conversation languages are configured by the project/user.

## Documentation

- [Português](README.pt-BR.md)
- [Quality gates and missing environments (Português)](docs/quality-gates.pt-BR.md)
- [Usage scenarios and project-specific policies (Português)](docs/usage.pt-BR.md)
- [Updating the existing npm package (Português)](docs/releases.pt-BR.md)
- [Formats and a complete example](docs/formats.md)
- [Context and lifecycle design](docs/architecture.md)
- [Upgrading existing projects](docs/migration.md)
- [Adapters and distribution](docs/distribution.md)
- [Quality checks and evaluation](docs/quality.md)
- [Observed implementation validation](docs/validation.md)
- [Contributing](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

## Limits

The CLI validates declared relationships and records actual executions. It cannot prove that a passing test
semantically covers every requirement, authenticate an approval author, or sandbox a configured command.
Review assertions and use your tool's native permissions plus isolated test environments.
Source fingerprints use project files outside agents/ and dependency internals plus explicitly selected
workflow contracts. Configure verification.exclude for generated artifacts; exclusions affect evidence validity.

## License

MIT. Workflow knowledge and runtime integrations are maintained together in this repository.
