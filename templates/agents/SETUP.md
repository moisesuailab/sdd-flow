# Initial project setup

1. Inspect the actual project and any supplied requirements. Distinguish observed facts, inferred conventions and unknown decisions. Do not invent historical rationale.
2. Fill PROJECT.md with a short map. Record mandatory project constraints in POLICIES.md; keep detailed procedures in conditional skills.
3. Configure mode, autonomy and approval in config.yaml. Keep the new-project step default unless the user chooses batch; preserve an existing project's chosen autonomy. User authorization for several tasks or all tasks may override step for that request without changing the standing preference. Use exact check commands from project configuration. If no automated runner exists, acceptance may use manual or inspection evidence.
   Choose quality.tdd and project criteria in QUALITY.md. Checks default to required/local; classify genuinely unavailable external checks explicitly. Do not require production access to finish implementation. See prompts/quality.md when needed.
   Set documentation.language to the team's language (for example pt-BR or en); auto follows the user's language until resolved. Use UTF-8 and preserve normal spelling and diacritics in project documents. Keep schema keys, IDs and original quotes unchanged.
4. Create current capability documents and ADRs only where useful. Use the examples in current/_template.md and decisions/_template.md; select active documents in each change.
5. Create project skills only for recurring procedures. Copy skills/_template/SKILL.md into a folder matching its name, fill name and description, and link longer references. Validate discovery with sdd skills list.
6. Run sdd doctor, resolve missing setup and review the resulting project settings.
7. Remove this setup guide after configuration.

Do not generate feature code during setup. Do not create generic skills or impose layered architecture on every project.
Keep the working set minimal: reuse the canonical spec documents, resume from TASK.md and avoid duplicate progress/checkpoint
files. Do not create STATE.md for routine work. Record short temporary blockers/next actions in task Notes when needed.
Create reference documents and skills only for an actual need or the user's request; preserve existing user documents.
Use sdd harness claude-code or sdd harness opencode to install native command and skill entry points.
These adapters do not change native runtime permissions or install dependencies.

For an existing project, adopt observed architecture and tests as a baseline. Do not rewrite existing
features, invent historical specs or refactor the application during setup. Record uncertainties explicitly.
Run sdd reconcile --dry-run and reconcile when needed to inventory existing spec locations and observed closures before discarding history.
For a new project, record only choices that were actually authorized; resolve material unknowns before implementation.
For broad requirements, follow prompts/intake.md and choose an observable first delivery.

Start from the user's goal or supplied PRD, ADR/system design, design system, examples and constraints.
Formal documents are optional; do not demand a complete document set before helping.
For a new project identify intended users, observable first outcome and essential constraints;
propose unknown material choices rather than inventing requirements or creating the whole architecture upfront.
For an existing project inspect manifests, entry points, modules, data/contracts, UI conventions and tests.
Explain what is observed, intended or uncertain. Code and docs may disagree; do not silently treat an existing bug as the business rule.
Keep original source references and active/superseded decisions. Use harness readers for PDFs/images;
when needed, reference a reviewed UTF-8 excerpt in CLI sources, with its original document provenance.
Review test commands and their environment before establishing a safe baseline; record unavailable checks honestly.
Ask only about material gaps/conflicts not answerable from the project. Adopt the baseline without changing feature code.

No fixed questionnaire or three-document bundle is required. Resolve the goal, known sources, material constraints
and safe verification options; ask only for missing information that affects a real decision.
Optional sdd docs creates reference drafts; --types prd,sd,ds,adr,roadmap selects relevant presets.
PRD describes product intent, system design the solution structure, ADRs individual decisions and design system the UI contract.
Preserve existing document names/locations; map authoritative sources in PROJECT.md instead of duplicating them.
Generate/fill only requested or useful references. Never invent approved decisions or bulk-load docs/ into every task.

## Privacy and readable artifacts

New specs use Markdown body lists and visible task markers. Keep schema metadata small. Existing specs
are preserved; use sdd migrate ID --readable --dry-run before an explicitly requested conversion.
Set documentation.language to the team's language. Review PRIVACY.md; record private path prefixes in
privacy.sensitive_paths and keep credentials in local environment/secret storage, never in commands or artifacts.
Use agents/.sdd/private/ only for necessary confidential material. Local privacy defaults to warn; strict is opt-in.
Private source references may be checked/verified without appearing in ordinary context; use --include-private
when the agent is authorized to read the required sources. Verify extra private prefixes have Git ignores.
privacy.store_logs defaults to false. Confirm actual Git exclusions and inspect sdd privacy before sharing.
Do not copy real documents, customer records or production payloads into specs/tests as examples.
