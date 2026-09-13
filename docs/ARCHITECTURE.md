# Codebase Architecture

## Purpose

This document records the current source-of-truth structure so future patches do not accidentally reintroduce earlier regressions.

## Runtime layers

1. `App.tsx` — main Atlas shell, component navigation and cross-module routing.
2. `Heater3D.tsx` — shared fired-heater Three.js scene and interaction runtime.
3. Component study pages — Burner, Radiant, Shield/Convection and Draft/Stack.
4. Training pages — Heater Types, Operation and Troubleshooting.
5. `heater3d/` helpers — camera presets, scene helpers, semantic explode offsets and view configuration.

## Heater3D assembly

`Heater3D.tsx` originated from the Floot/AppDeploy migration and is intentionally rebuilt from preserved migration parts before CI validation.

Use `scripts/assemble-project.mjs` as the only assembly entrypoint. It:

1. Concatenates `src/_migration/Heater3D.part0.txt` through `part4.txt`.
2. Applies the ordered migration/refinement stages.
3. Produces the final CI/runtime source used by TypeScript and Vite.

The patch order is significant. Do not manually reorder stages without a dedicated regression pass.

## Critical invariants

The following behavior should be treated as regression-sensitive:

- Atlas opens in Free Explore with no component forced as selected.
- Burner study Exploded is a local semantic burner assembly view, not the global heater explode.
- Global heater Exploded remains available separately.
- Normal burner flame stays inside the firebox and does not represent routine flame impingement.
- Fuel-gas teaching cues remain visually tied to the fuel piping path.
- Draft instruments and stack analyzers remain physical 3D components and retain live training relationships.
- Stack damper direction remains physically consistent with the UI OPEN / MORE CLOSED indication.
- Mobile controls must not obscure the principal 3D interaction being taught.

## Refactoring policy

Prefer small, testable extraction over large rewrites. `OperationPage.tsx` and `Heater3D.tsx` are large and should only be split in a dedicated refactor checkpoint after the current behavior is protected by regression checks.

Do not combine a structural refactor with new simulator physics in the same patch. Stabilize first, then add behavior.
