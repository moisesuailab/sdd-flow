---
schema_version: 2
kind: policy
description: Authorized local confidential work with separate sharing checks.
---

# Privacy and versioning

Projects may legitimately handle confidential information. Continue authorized local work; distinguish local
access from permission to share. Keep routine SPEC/TASK/RESEARCH/VALIDATION documents minimal, using synthetic
examples, neutral identifiers and source references instead of copying sensitive records.

- Commands reference environment variables or a secret manager; never paste actual tokens/passwords into config,
  prompts, URLs, task evidence or screenshots. The CLI runs with native account permissions, not a sandbox.
- New specs keep local receipts, snapshots and handoff/evidence JSON in .sdd/. Git ignores those records;
  command-output logs are not stored unless privacy.store_logs is true. Opt-in output is heuristically redacted.
- Store necessary confidential generated documents/attachments in agents/.sdd/private/<spec-id>/ with a clear neutral
  name, only when needed. This area is Git-ignored regardless of its contents. Reuse existing authorized sources;
  do not move user documents or duplicate specs automatically. Additional privacy.sensitive_paths classify existing
  private sources; add their Git ignores explicitly. No folder provides encryption or model-provider isolation.
- privacy.local_mode defaults to warn, including when absent in an existing config. Suspected credentials produce
  sanitized warnings rather than stopping local writes, approvals, conversion or evidence processing. Originals remain
  unchanged; do not treat a false positive as a reason to halt development. strict is an optional team preference.
- Context omits confidential documents by default and reports the omission; do not guess their missing requirements.
  When their use is authorized, select only needed sources/sections and use sdd context ID --include-private.
  Existing authorization applies; this flag is output selection, not a permission grant. Credential/runtime files
  such as .env, private keys and receipts remain outside context. Suspected credentials in emitted output are redacted;
  if this obscures a legitimate example, inspect the authorized local original rather than changing its contract.
- Before an authorized commit, inspect git diff --cached and run sdd privacy --staged. It checks staged bytes and
  reports locations/categories without secret values. With no flag it inspects indexed workflow files (or working
  workflow files outside Git). It also flags known sensitive filenames and configured private paths.
- Sharing checks stay restrictive: private files in the index are findings even when harmless; exports refuse declared
  private sources and recognizable credentials. Warnings during local work do not waive sharing review. Do not commit
  a context packet containing private documents. CLI helpers do not install a universal Git hook or intercept other tools.
  Local harness references use pointers instead of duplicating private or credential-like source instructions.
- Detection is heuristic, with false positives and omissions. It cannot recognize every personal datum, business
  secret, encoding or custom credential. Review remains necessary; use native secret scanning where available.
- Git ignores do not untrack files or erase earlier commits. If a credential was exposed, revoke/rotate it first.
  Coordinate cleanup of tracked files/history with the owner; never rewrite shared history automatically.
- Backups and private runtime files remain plaintext local data. Protect the machine and any external backups.
  Never force-add runtime artifacts. Another checkout must reverify if its local receipts are absent.
