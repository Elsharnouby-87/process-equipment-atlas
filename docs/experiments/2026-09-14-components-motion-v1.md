# Components Motion Prototype V1 — Experimental Branch

Date: 14 September 2026

## Safety / rollback

- Baseline development branch at experiment start: `floot-migration-dev`
- Baseline commit: `37476e7598a2f9cb3d93d1005fa7d2948741c5da`
- Dedicated rollback branch: `checkpoint-pre-components-motion-prototype-2026-09-14`
- Experimental branch: `experiment-components-motion-v1`
- Production branch and live site were not changed.

## Purpose

Test one small Animos-inspired motion concept on the existing COMPONENTS landing page without changing the current engineering architecture, 3D model, simulator, camera, component-study logic, or production deployment.

## Experiment

A compact spatial preview strip was added above the existing four component-study cards. It presents the same four modules in a restrained perspective arrangement with subtle staggered motion. Each preview remains a functional button that opens the existing module.

The original component grid remains in place and unchanged below the experiment so the concept can be compared directly against the existing design.

## Mobile / accessibility

- Desktop: restrained perspective treatment with subtle motion.
- Mobile/tablet: converts to a static horizontal touch scroller instead of forcing 3D motion.
- `prefers-reduced-motion` disables the animation.

## Files changed on the experimental branch

- `src/ComponentsPage.tsx`
- `src/componentsMotionPrototype.css` (new, isolated stylesheet)
- `.github/workflows/pages-preview.yml` (experimental branch added only so full QA can run)

## QA

GitHub Actions run: `34846961696` — Development Build QA — SUCCESS.

Passed:

- dependency sanity
- ordered project assembly
- structural regression QA
- TypeScript QA
- navigation architecture QA
- Operation state-machine QA
- Physics V2 regression QA
- production build QA

## Deployment status

Not deployed to production. Visual acceptance is required before any merge into `floot-migration-dev`.
