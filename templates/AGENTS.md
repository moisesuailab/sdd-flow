# Agent Instructions

This project uses **Spec Driven Development (SDD)** with the **Research → Plan → Implement (RPI)**
methodology. Every feature goes through three isolated phases, each in its own agent session.

---

## On session start — always read these files

| File | Purpose |
|---|---|
| `agents/AGENTS.md` | Role definition, SDD cycle, and session rules |
| `agents/PROJECT.md` | Stack, architecture, and project-specific rules |
| `agents/RULES.md` | Mandatory process rules (git, tasks, decisions) |

> **How to load:** Use your file reading tool to read each file above before taking any action.
> Do not proceed without reading them — they define the rules for this session.

---

## Skills — load on demand

Skills are in `agents/skills/<name>/SKILL.md`. Before implementing any task, scan the skills
directory and read the `## When to use this skill` section of each file. Load only the skills
relevant to the current task.

---

## Active spec

The active spec folder is `agents/specs/<NNN-feature-name>/`. It contains:
`RESEARCH.md`, `SPEC.md`, `TASK.md`, `PROGRESS.md`, `DECISIONS.md`, and `TEST.md`.

When a spec folder is provided, read `SPEC.md` and `TASK.md` before implementing.

---

## RPI prompts

Full prompts for each phase are in `agents/prompts/`. Use them by reading the relevant file:
- Phase 1 — Research: `agents/prompts/rpi-research.md`
- Phase 2 — Plan: `agents/prompts/rpi-plan.md`
- Phase 3 — Implement: `agents/prompts/rpi-implement.md`

---

## First-time setup

If `agents/PROJECT.md` does not exist yet, read `agents/SETUP.md` and follow its instructions.