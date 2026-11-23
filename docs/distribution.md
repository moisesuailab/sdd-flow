# Adapters and distribution

## Shared knowledge

Maintain the core procedures once under templates/agents/.
The adapters generate thin native commands and a workflow skill with shared references.
Exported bundles carry the MIT license and explicit prerequisites.

Skills use the public Agent Skills name/description format.
Other workflow front matter is internal metadata; arbitrary schema fields are not automatically
understood by Claude Code or OpenCode.

## Local native entry points

~~~sh
sdd harness claude-code
sdd harness opencode
~~~

Claude Code: .claude/commands/sdd-*.md, .claude/skills/sdd-flow/ and a managed CLAUDE.md block.
OpenCode: .opencode/commands/sdd-*.md and .opencode/skills/sdd-flow/.
Slash commands: /sdd-research, /sdd-plan, /sdd-implement, /sdd-validate, /sdd-close.
Project-specific skills remain canonical in agents/skills/ and are discovered through sdd skills list;
the workflow skill directs the agent to load selected bodies.

Installations preserve unrelated command files and existing settings.
Removal is ownership-aware. These adapters install knowledge entry points, not a sandbox or permissions policy.
Use the tool's native controls to enforce execution permissions.

## Export a directory

~~~sh
sdd export claude-code --out packages/claude-code
sdd export opencode --out packages/opencode
sdd export agent-skills --out packages/portable
~~~

The output directory must not exist. Export paths stay inside the project and cannot traverse symlinks.
Claude Code exports .claude-plugin/plugin.json and skills/sdd-flow/.
OpenCode exports .opencode/skills/sdd-flow/ for copying into a project.
Agent Skills exports skills/sdd-flow/ for clients that support that format.
All bundles require Node.js 22+ and a separately installed sdd-flow 3.x CLI for readable artifacts.
No model, account, API credential or specific application stack is embedded.
Local harness installation follows privacy.local_mode; distribution export is a separate, restrictive sharing operation.
It rejects declared private source files and recognizable credentials before creating the output directory.
Local native references use a pointer to the authorized original instead of copying declared private or credential-like
instructions into another directory. This avoids losing their classification during local adapter generation.

For a local Claude Code smoke test, use the official --plugin-dir support with the exported directory
in an environment where Claude Code is installed. Export does not publish to a marketplace.
OpenCode JavaScript plugins have a separate runtime API; a portable knowledge skill should not
be described as a tested JavaScript plugin.

## Compatibility evidence and release work

Automated tests verify generated layouts, front matter, references and preservation behavior.
A real interactive invocation in each target tool/version is still required before claiming
runtime compatibility for a release. Record versions and outcomes in the release checklist.

Public references consulted on 2026-11-20:
- https://agentskills.io/specification
- https://code.claude.com/docs/en/plugins-reference
- https://code.claude.com/docs/en/skills
- https://opencode.ai/docs/skills/
- https://opencode.ai/docs/commands/

Future marketplace packaging can reuse these exports and add marketplace metadata.
Publish versioned bundles and release notes; avoid maintaining divergent copies of the procedures.
