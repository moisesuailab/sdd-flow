# Initial project setup

1. Inspect the actual project and any supplied requirements. Distinguish observed facts, inferred conventions and unknown decisions. Do not invent historical rationale.
2. Fill PROJECT.md with a short map. Record mandatory project constraints in POLICIES.md; keep detailed procedures in conditional skills.
3. Configure mode, autonomy and approval in config.yaml. Use exact check commands from project configuration. If no automated runner exists, acceptance may use manual or inspection evidence.
   Choose quality.tdd and project criteria in QUALITY.md. Checks default to required/local; classify genuinely unavailable external checks explicitly. Do not require production access to finish implementation. See prompts/quality.md when needed.
   Set documentation.language to the team's language (for example pt-BR or en); auto follows the user's language until resolved. Use UTF-8 and preserve normal spelling and diacritics in project documents. Keep schema keys, IDs and original quotes unchanged.
4. Create current capability documents and ADRs only where useful. Use the examples in current/_template.md and decisions/_template.md; select active documents in each change.
5. Create project skills only for recurring procedures. Copy skills/_template/SKILL.md into a folder matching its name, fill name and description, and link longer references. Validate discovery with sdd skills list.
6. Run sdd doctor, resolve missing setup and review the resulting project settings.
7. Remove this setup guide after configuration.

Do not generate feature code during setup. Do not create generic skills or impose layered architecture on every project.
Use sdd harness claude-code or sdd harness opencode to install native command and skill entry points.
These adapters do not change native runtime permissions or install dependencies.

For an existing project, adopt observed architecture and tests as a baseline. Do not rewrite existing
features, invent historical specs or refactor the application during setup. Record uncertainties explicitly.
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
