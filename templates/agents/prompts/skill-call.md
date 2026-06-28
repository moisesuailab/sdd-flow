# Prompt: Execute task using a Skill

Use this prompt when a task requires following a specific skill pattern.

---

## Agent instruction

Read:
- `agents/AGENTS.md`
- `agents/PROJECT.md`
- `agents/RULES.md`
- `agents/specs/<SPEC_NUMBER>/SPEC.md`
- `agents/specs/<SPEC_NUMBER>/TASK.md`
- `agents/specs/<SPEC_NUMBER>/PROGRESS.md`
- `agents/skills/<SKILL_NAME>/SKILL.md`

Now implement ONLY the task: `<TASK_ID>`

Use the skill as the mandatory pattern source for this task.

---

## Rules

- Do not run git commands
- Do not add comments or documentation unless explicitly required by the skill
- Update PROGRESS.md upon completion
- Stop and wait for confirmation before the next task