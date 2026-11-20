---
schema_version: 2
kind: procedure
phase: close
description: Consolidate implementation and close with truthful verification status and explicit limitations.
---

# Consolidate and close

Update the selected active capability contracts to describe implemented behavior and distinguish any unverified external behavior.
Add this spec ID to each document's changes list. Link code schemas rather than copying all fields.
Record durable architectural decisions in individual ADRs; mark replaced ADRs superseded.
Keep research alternatives and execution detail in change history.

Perform final verification after consolidation, so its digest includes the updated contracts.
Review the result and actual scope. Close with sdd close ID --by NAME --archive after actual review authorization.
If no capability contract needs updating, provide --note explaining why no lasting contract changed.
Partial, failed, missing or stale receipts must not close a change. A full limited receipt can close implementation
when external limitations have a current handoff. Retain USER_TESTS.md and pending verification in closure/history.
Never describe that result as external success or production/release approval. Lack of a real environment alone must not block progress.

Archiving preserves identity and reserves its number. Use sdd reopen ID --by NAME --reason REASON
for new work on a closed change; a new verification is required.
