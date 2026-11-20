# SDD Flow quick start

1. Complete agents/SETUP.md and run sdd doctor.
2. Create a change: sdd new feature-name --mode standard.
3. Follow agents/prompts/rpi-plan.md; use Research first when uncertainty warrants it.
4. Run sdd check ID. Review the scope and record actual authorization: sdd approve ID --by NAME.
5. Resume with sdd context ID --phase implement --task T01. Keep task state in TASK.md front matter.
6. Run sdd verify ID --scope partial for early feedback.
7. Consolidate affected current contracts, finish tasks and run full verification.
8. Close after review: sdd close ID --by NAME --archive. Add --note when no lasting contract changed.

Manual/inspection acceptance: create a version-bound template with sdd evidence ID.
Execute the scenarios, record results, executor, timestamp and notes, then run
sdd verify ID --evidence agents/specs/ID/EVIDENCE.json.

Use sdd help for commands and sdd update --dry-run before upgrading customized workflows.
