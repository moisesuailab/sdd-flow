# Prompt: Conventional Commit Suggestion

Based on the changes made in this task/feature, suggest commit messages following the Conventional Commits specification.

---

## Rules

- Do not run git commands
- Generate 2 suggestions:
  1. In the team's primary language
  2. In English
- Use a scope when it makes sense (e.g. auth, api, ui, db, config, setup)
- Include a short body with bullet points if the change warrants it

## Output format

**[Primary language]:**
`<message>`

**EN:**
`<message>`

---

## Commit Types

| Type | When to use | SemVer impact |
|---|---|---|
| `feat` | New feature or capability | minor |
| `fix` | Bug fix | patch |
| `refactor` | Code change with no behavior change | none |
| `perf` | Performance improvement | none |
| `docs` | Documentation only | none |
| `style` | Formatting, whitespace (no logic change) | none |
| `test` | Adding or fixing tests | none |
| `build` | Build system or external dependency changes | none |
| `ci` | CI/CD configuration changes | none |
| `chore` | Maintenance tasks (no src or test changes) | none |
| `revert` | Reverts a previous commit | depends |

Use `!` suffix (e.g. `feat!:`) to indicate a breaking change (major in SemVer).

## Examples

```
feat(auth): add Google OAuth login
fix(api): correct JSON parsing error in response handler
refactor(db): replace raw queries with repository pattern
feat!: change authentication token format (breaking change)
```
