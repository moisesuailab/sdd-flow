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
Selected skills are already in the packet. Use sdd skills list only when another recurring procedure is needed;
load only applicable bodies. Do not rediscover or reload the entire catalog for every task.

State the intended outcome. Implement the scoped behavior and tests together.
Inspect existing code and read additional references when needed; record why additional context matters.
Check affected callers/contracts and the planned regression baseline before editing shared behavior.
After the focused change, run the relevant consumer/integration regressions; a passing isolated unit test is insufficient when callers are affected.
Do not adjust expected behavior simply to make tests pass.
Follow quality.tdd and use small regression/TDD cycles when applicable; preserve useful RED/GREEN run references.
Read quality.md for strategy details. Do not claim test-first practice solely from final green tests.

Check the task's verify condition using observable evidence before marking status: done.
Use [ ] for unfinished work, [x] for done and [-] for cancelled in readable TASK.md (or preserve the existing YAML status).
When useful, qualify [ ] with Situação: em andamento / Status: in progress; external deferral uses
Situação: verificação externa pendente / Status: pending external verification and the required actor/reason.
Remove that open-task note when completing/cancelling the task. Do not generate [/] or [>].
Resume from SPEC/TASK, dependency states and current validation. Keep a short Notas/Notes field on the relevant task
only when a blocker or next action is not obvious; replace obsolete notes rather than appending a diary.
Do not create STATE.md or a separate progress/checkpoint file. Preserve existing files; consult a legacy STATE only if needed.
Notes do not change requirements, mark a task complete or prove a test result; update the real contract/status/evidence instead.
Keep evidence notes short with links to local receipts. Do not create an append-only execution diary in always-loaded files. Never put raw logs, credentials or real personal data into task notes.

Follow configured autonomy as the standing default. New projects default to step: implement and verify
one task, then stop for review unless the user already authorized specific additional tasks or all tasks
in this scope. Follow that authorization without stopping between those tasks or asking again; it does
not require changing config.yaml. Plan approval alone does not override step. Batch may also be the
project's standing configuration. In every case, verify/update tasks individually and respect dependencies.
Ask when behavior, scope or permissions materially change. Continue routine implementation choices inside approved scope.
Use partial verification for early feedback. Consolidate lasting capability contracts before final verification.
If only external verification lacks access, finish available implementation/local checks and prepare sdd handoff ID.
Keep external verification deferred explicitly; do not ask the user to perform risky production actions just to close the spec.
