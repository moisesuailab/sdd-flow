---
schema_version: 2
kind: procedure
phase: validate
description: Verify actual behavior and record execution tied to the tested inputs.
---

# Validate

Choose partial feedback or final verification explicitly. Pending tasks do not block partial verification.
Review the requirement-to-acceptance links and actual test assertions, failure cases and relevant integrations.
Compare available baseline results with the changed behavior and affected consumers. Identify pre-existing issues
without silently weakening required acceptance, changing expected results, or expanding scope into unrelated repairs.
Inspect the diff, existing work and untracked files; do not attribute unrelated changes to this spec without evidence.

Run sdd verify ID --scope partial for diagnostic feedback or sdd verify ID for the final check.
The CLI executes only the configured commands. Runtime records stay under .sdd/ in readable specs and are ignored by Git; raw command output is not stored by default. Consult PRIVACY.md before retaining opt-in logs or sharing evidence. It records exit codes, timeouts, logs and an input digest.
A failed required command fails verification. Advisory failures remain visible warnings.
External commands are skipped unless --run-external is explicitly authorized. An unexecuted case remains unverified.

For manual/inspection cases, run sdd evidence ID to create a template for current inputs.
Execute the scenario or inspect the relevant code, then record result, by, at and short synthetic-data notes in the evidence file returned by the command (normally .sdd/EVIDENCE.json).
Reference supporting artifacts when available. Run sdd verify ID --evidence PATH.
A manual case can pass; its method and result are separate fields.
If inputs changed, regenerate evidence and repeat affected checks rather than reusing an old result.
The evidence command preserves existing files and returns a new path when necessary; use that path with --evidence.

During validation, preserve the code and contract under review. Report fixes for implementation and rerun verification after fixes.
Tests may produce expected artifacts in an isolated environment; they are not intrinsically read-only.
Do not run production operations or install dependencies merely to satisfy validation.

Separate attribution, severity and impact on the intended delivery. Keep scope controlled while escalating findings
that compromise the delivery, even when their origin predates this change.
A passing receipt records execution and declared links; it does not prove that every assertion matches the intended behavior.

For unavailable environments follow quality.md and sdd handoff ID. Fill the generated JSON and run
sdd verify ID --handoff PATH. USER_TESTS.md contains the recorded steps and safety constraints.
Do not classify unfinished code, documentation or recommendations as external-only tests to obtain closure. A full limited result permits implementation closure while retaining pending verification; it never means passed external tests.
If no safe test is possible without production side effects, record unavailable and the condition for resuming.
Known failures for the same inputs remain failures when evidence or external execution is omitted later.
