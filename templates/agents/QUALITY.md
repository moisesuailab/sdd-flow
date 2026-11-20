---
schema_version: 2
kind: quality-policy
description: Project quality criteria and environment limitations, loaded for planning and review.
---

# Project quality

Use config.yaml quality.tdd for the testing strategy and checks for exact commands.
Set thresholds in the actual analyzer/test configuration; do not invent universal percentages.
Required checks gate completion. Advisory checks remain visible without blocking acceptance.
Keep mandatory security/business constraints in POLICIES.md and capability contracts.

Record only project-specific decisions here: relevant failure/boundary cases, analysis scope,
security requirements and justified performance goals. Link tool configuration instead of copying it.

Classify environment-dependent checks or manual criteria as external. Lack of access must not
force production testing or fabricated success. Preserve local evidence, explain limitations
and hand off safe steps when possible. Closing implementation is distinct from verifying deployment.
