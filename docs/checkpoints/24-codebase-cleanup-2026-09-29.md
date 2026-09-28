# Checkpoint 24 — Codebase cleanup baseline

Date: 2026-09-29

Checkpoint branch: `checkpoint/code-cleanup-baseline-2026-09-29`

## Purpose

Freeze the working Fired Heater Atlas immediately before the repository cleanup and maintenance pass.

## Cleanup completed after this checkpoint

- Removed obsolete UI-note styles left after visual decluttering.
- Added named npm commands for assembly, QA, type checking and full verification.
- Simplified and hardened the Heater3D assembly entrypoint with explicit file validation.
- Updated the GitHub Pages workflow to use the named project commands.
- Added a maintenance guide documenting the current source-of-truth and safe edit workflow.

## Invariants

No intended application behavior, 3D geometry, training content, navigation behavior or simulator physics is changed by this cleanup pass.
