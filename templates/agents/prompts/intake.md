---
schema_version: 2
kind: procedure
description: Turn a broad request into manageable, linked outcomes before implementation.
---

# Triage a broad request

1. Identify whether this is a new project, adoption of an existing codebase, a scoped change, or a revision.
2. Preserve original sources. Inspect an index or relevant sections before loading long documents.
3. Find a cohesive observable outcome for the next iteration. Propose separate specs for independent
   deliverables, meaningful domain boundaries or uncertainty that should be resolved separately.
4. Share lasting constraints through current capability contracts and project policies instead of copying
   them into every spec. Record real dependencies in change.yaml.
5. Use sdd context ID --inspect to diagnose the composed packet. This measures bytes of the selected
   context, not project size or a model's exact token window. Nothing is removed automatically.
6. Narrow by task, choose explicit source/reference sections, or use native delegation when available. Split the
   delivery plan only for independent outcomes, not for size alone. Keep shared invariants and blocking assumptions
   visible. The budget is advisory by default (context.budget_mode: warn); strict mode refuses an oversized packet.
7. Ask only about material uncertainty or changed user-visible scope. Continue research and routine choices
   within existing authorization. Explain the proposed next iteration and its acceptance criteria.

The CLI cannot intercept text pasted directly into a chat or force every coding tool to follow this process.
Follow this procedure before implementation when a user gives an oversized or multi-feature request.
