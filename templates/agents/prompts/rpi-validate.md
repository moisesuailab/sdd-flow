# Prompt: Validate (RPI — Phase 4)

Use this prompt to verify that the implementation satisfies the spec and all acceptance criteria.

---

## Agent instruction

You will validate the implementation of a completed feature against its spec and test cases.

**Before starting, read:**
- `agents/AGENTS.md`
- `agents/PROJECT.md`
- `agents/RULES.md`
- `agents/specs/NNN-name/SPEC.md`
- `agents/specs/NNN-name/TASK.md` — identify which tasks are complete `[x]` and which are pending `[ ]`
- `agents/specs/NNN-name/TEST.md`
- `agents/specs/NNN-name/PROGRESS.md`
- The code files produced during Implement (listed in PROGRESS.md History)

**Expected input:**
- Spec number and name (e.g. `001-user-authentication`)

---

## Validation procedure

### Step 1 — Determine validation scope
Validation may be requested at any time — it does not require all tasks to be complete.

- If all tasks are `[x]`: full validation — cover every task and every test case in TEST.md
- If some tasks are still `[ ]`: partial validation — scope to completed tasks only; explicitly list which tasks and test cases are **out of scope** in VALIDATION.md

Never block validation because tasks are pending. Report the scope clearly instead.

### Step 2 — Verify task-level conditions
For each task in `TASK.md`, read its `verify:` condition and check whether
the produced code satisfies it. Examine the actual files — do not assume.

### Step 3 — Verify acceptance test cases
For each test case in `TEST.md`, assess whether the implementation satisfies
the Given/When/Then scenario. Read the relevant code directly.

### Step 4 — Produce VALIDATION.md
Write `agents/specs/NNN-name/VALIDATION.md` with the structure below.

---

## Deliverable: VALIDATION.md

```markdown
# VALIDATION — [Feature Name]

## Status: [✅ Approved | ⚠️ Partial | ❌ Failed]

## Scope
[Full — all tasks complete] or [Partial — tasks T01..TNN validated; TXX..TYY pending implementation]

---

## Task Verification

| Task | verify: condition | Status |
|---|---|---|
| T01 | [condition from TASK.md] | ✅ Met / ❌ Not met / ⚠️ Partial |
| T02 | ... | ... |

---

## Acceptance Test Coverage

| Test Case | Description | Status | Evidence |
|---|---|---|---|
| TC01 | [behavior being tested] | ✅ Verified / ❌ Not met / ⚠️ Partial | [file and line or behavior observed in code] |
| TC02 | ... | ... | ... |

---

## Gaps Found

List any `verify:` conditions or test cases that are not fully met.
Write `None` if everything is satisfied.

- [ ] [Gap description — what is missing or incorrect]

---

## Recommendation

[Approve — all criteria met]
[Request fixes — list the gaps that must be resolved before approval]
```

---

## Constraints

- Do not write or modify any code in this phase
- Do not mark gaps as acceptable — report them, even if minor
- If a test case cannot be verified from static code analysis alone, flag it explicitly:
  `⚠️ Requires runtime verification — cannot confirm from code alone`
- After delivering VALIDATION.md, **wait for developer review**
- If gaps are found and fixed, a new Validate session must be run — do not reuse this report
