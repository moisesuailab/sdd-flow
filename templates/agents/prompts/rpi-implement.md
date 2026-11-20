---
schema_version: 2
kind: procedure
phase: implement
description: Execute approved cohesive outcomes with bounded context.
---

# Implement

Run sdd check ID --phase implement. Resolve a missing/stale approval against the actual user authorization.
Select a pending task whose dependencies are done; light changes may execute directly from acceptance.
Load sdd context ID --phase implement --task T01 when a task exists.
Use sdd skills list for metadata discovery and load only relevant bodies.

State the intended outcome. Implement the scoped behavior and tests together.
Inspect existing code and read additional references when needed; record why additional context matters.
Check affected callers/contracts and the planned regression baseline before editing shared behavior.
After the focused change, run the relevant consumer/integration regressions; a passing isolated unit test is insufficient when callers are affected.
Do not adjust expected behavior simply to make tests pass.
Follow quality.tdd and use small regression/TDD cycles when applicable; preserve useful RED/GREEN run references.
Read quality.md for strategy details. Do not claim test-first practice solely from final green tests.

Check the task's verify condition using observable evidence before marking status: done.
Keep status only in TASK.md; an optional STATE.md records blockers and the next action without duplicating the task table.
Do not create an append-only execution diary in always-loaded files.

Follow configured autonomy: step stops after a task; batch continues through authorized tasks.
Ask when behavior, scope or permissions materially change. Continue routine implementation choices inside approved scope.
Use partial verification for early feedback. Consolidate lasting capability contracts before final verification.
If only external verification lacks access, finish available implementation/local checks and prepare sdd handoff ID.
Keep external verification deferred explicitly; do not ask the user to perform risky production actions just to close the spec.
