---
schema_version: 2
kind: utility
description: Revise the canonical task plan without maintaining a parallel format.
---

# Revise tasks

Follow rpi-plan.md and the existing SPEC.md contract.
Preserve task IDs. For format: markdown, use the checkbox/list syntax from rpi-plan.md, with covers, depends_on and verify displayed below each task. Keep metadata small. Existing YAML tasks remain supported; do not create a second state table.
Add cohesive verifiable tasks rather than a task per file. Do not duplicate status in PROGRESS.md.
Changes to the normative task plan invalidate scope approval. Run sdd check, explain the change
and record actual user authorization for the revised scope before implementation when required.
