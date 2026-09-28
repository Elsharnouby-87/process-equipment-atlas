# Code Maintenance Guide

## Source of truth

The production site is built from branch `checkpoint-pre-components-motion-prototype-2026-09-14`.

`src/Heater3D.tsx` is generated during CI. Do not hand-edit it as the source of truth.

Edit the preserved source in:

- `src/_migration/Heater3D.part0.txt` … `part4.txt`
- the ordered refinement scripts in `scripts/`
- supporting runtime files in `src/heater3d/`

Then run:

```bash
npm run verify
```

This assembles the final heater source, runs regression QA and TypeScript checks, then performs the production Vite build.

## Safe change sequence

1. Create a checkpoint branch before a meaningful visual, behavior or structural change.
2. Make the smallest source-level change that satisfies the requirement.
3. Update or add a regression assertion when the change protects an important invariant.
4. Run `npm run verify`.
5. Trigger the Pages workflow from `main` only after source QA passes.

## Project organization

- `src/App.tsx` — Atlas shell and component metadata.
- `src/ComponentsPage.tsx` — component-study hub.
- `src/*Page.tsx` — focused learning/training pages.
- `src/heater3d/` — reusable camera, scene and view configuration.
- `src/_migration/` — preserved Heater3D source segments.
- `scripts/assemble-*.mjs` and refinement scripts — ordered generation stages.
- `scripts/qa-*.mjs` — structural and behavior regression guards.
- `src/*.css` — page/system styles; remove selectors when their UI element is removed.

## Cleanup policy

Prefer behavior-preserving cleanup. Remove dead UI copy, orphaned selectors and obsolete patch anchors when the corresponding feature has been deleted. Avoid combining major code restructuring with new physics, camera behavior or training content in the same change.
