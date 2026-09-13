# 16 — Code Cleanup & QA Stabilization

## Scope

This checkpoint intentionally adds no new simulator physics or new heater components. It stabilizes the existing codebase before the Integrated Combustion & Draft Simulator V1 work.

## Cleanup completed

- Added one ordered assembly entrypoint: `scripts/assemble-project.mjs`.
- Preserved the migrated Heater3D baseline and made the refinement order explicit.
- Added `scripts/qa-structure.mjs` to protect critical behavioral invariants.
- Added a strict TypeScript cleanup stage for previously hidden type errors.
- Removed an unused DraftStack icon import detected by strict TypeScript QA.
- Corrected Box3Helper material typing without changing runtime behavior.
- Split production vendor bundles into React, Three.js and icon chunks for cleaner caching and a much smaller application chunk.
- Added architecture and regression-QA documentation.
- Updated development and deployment workflows so both use the same assembly and QA sequence.

## QA gates

The development candidate must pass:

1. Dependency sanity
2. Ordered source assembly
3. Structural regression QA
4. TypeScript strict check
5. Production Vite build

## Build observation

Before vendor chunking, the main JavaScript bundle was about 1.08 MB minified. After chunk organization, the application chunk is about 327 KB, with React and Three.js isolated as vendor chunks.

## Deferred refactor debt

- `Heater3D.tsx` remains a large generated/runtime module.
- `OperationPage.tsx` remains a large training-state module.

These should be split only in dedicated refactor checkpoints after additional regression protection is in place. They were deliberately not rewritten during this stabilization pass to avoid functional regressions.
