---
schema_version: 2
kind: procedure
phase: research
description: Resolve uncertainty using requirements sources and the actual code.
---

# Research

Use the active change manifest and project map. Inspect only the modules, source requirements and integrations relevant to this change.
Preserve source paths and distinguish facts, assumptions, alternatives and unresolved questions.
Do not replace the source requirements with an unsupported summary.
For a change to existing behavior, inspect direct consumers, shared contracts and relevant callers/tests,
not only the function being edited. Establish available baseline results; separate pre-existing failures,
introduced regressions and unavailable-environment checks. Keep the impact note short and source-linked.

Create RESEARCH.md only when research adds useful information. It is required in rigorous mode.
Use front matter with schema_version: 2, artifact: research and id matching the change ID.
In the body record the goal, relevant evidence, scope, risks and unresolved blocking questions.
Do not implement code. If a material question blocks planning, ask it while continuing independent investigation.
No separate approval of research/progress/empty decisions files is required; authorization applies to the normative scope bundle.
