---
schema_version: 2
kind: project
description: Short project map, technology choices and source locations.
---

# Project map

## Purpose

[FILL: One or two sentences describing the project and intended users.]

## Technology and commands

[FILL: Actual runtime, framework, persistence, package manager and deployment environment.]
Put executable verification commands in agents/config.yaml; derive them from existing project configuration.

## Navigation

[FILL: A short path-to-responsibility table for the main modules, tests and current capability contracts.]
Include authoritative product/design sources (PRD, system design, design system and ADRs) when present; preserve their existing paths.

## Invariants and conventions

[FILL: A short map of the project's conventions and their authoritative configuration files.]
Put mandatory constraints in POLICIES.md; link domain contracts and applicable decisions instead of copying history.

## Authorization

Document project-specific permissions and actions requiring user review.
Code, explanations and UI language follow this project's requirements; no language or architecture is imposed by the workflow.

## Documentation language

The canonical project-document language is documentation.language in config.yaml. Use UTF-8 and correct spelling, including accents. Record any intentional exception here, such as an English API contract. Do not duplicate the setting or translate schema keys and historical evidence.
