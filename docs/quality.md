# Quality and evaluation

## Automated checks

~~~sh
npm ci
npm test
npm run check
npm run test:coverage
npm pack --dry-run
~~~

Tests exercise real temporary projects and child processes:
installation/preservation/conflicts, YAML parsing, references and cycles, context budgets,
approval freshness, automated and manual verification, cancellation, archival/reopen,
timeouts, path restrictions, adapters, conservative migration and npm package installation.

Structural checks verify shipped metadata and exports. Test coverage helps find unexercised paths;
it is not a quality score or proof of semantic correctness.

CI is configured to run supported Node.js versions on Linux and Windows.
The package has one maintained runtime dependency, yaml, locked for reproducible contributor installation.
Review dependency updates and run package smoke tests before release.

## Forward evaluation

Use the same project baseline for:
1. A small reversible automated fix.
2. A capability with manual verification.
3. A partially implemented approved requirement that changes.
4. A fresh-session resume using only the context packet.
5. A change touching an integration whose current contract must remain valid.

Measure omitted constraints, time to resume, relevant/irrelevant documents loaded,
human interventions, rework and defects found. Repeat cases to account for model variation.
Do not grade the workflow only by how little Markdown it generates.

## Release checklist

- Run the suite, package checks and installed-tarball smoke test.
- Review the diff, migration instructions, scope/evidence semantics and security limitations.
- Exercise native adapters interactively when available; otherwise record the unverified compatibility without claiming it passed.
- Record any unverified platform behavior.
- Publish npm/marketplace artifacts only through an explicitly authorized release action.

No comparison in this project claims parity with every other workflow.
Quality claims should identify tested scenarios and remaining limits.

## Project quality and unavailable environments

Project-owned QUALITY.md selects meaningful criteria with links to analyzer configuration.
quality.tdd guides optional/preferred/required practice; acceptance descriptions carry concrete BDD examples.
Checks are required/local by default; advisory issues remain warnings and external commands require --run-external.
Full limited verification may close implementation with a current handoff and pending external verification.
It is not deployment approval or a claim that unavailable tests passed. Failed/partial/stale verification cannot close.
Detailed safe user-test instructions and examples: quality-gates.pt-BR.md.
