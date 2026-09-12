# Process Equipment Atlas — Migration Status

This repository is the external source-control mirror / continuation workspace for the Fired Heater Atlas migration.

- Floot project: `Fired Heater Atlas v42 Migration`
- Floot project ID: `3310402f-e3dc-4325-931b-085c9e8fd95b`
- Primary product: **PROCESS EQUIPMENT ATLAS**
- Tagline: **EXPLORE · LEARN · UNDERSTAND**
- Current equipment module: **Fired Heater**

## Working branch

Development branch: `floot-migration-dev`

## Source strategy while Floot is rate-limited

We are **not waiting for Floot** to reconstruct the baseline. The branch now uses the two existing AppDeploy applications as read-only sources:

1. **AppDeploy v42 master** — functional / learning baseline
   - app id: `fired-heater-atlas-master-3d-zcsqh4`
   - snapshot: `1789194303900`
   - provides the Atlas shell, detailed learning modules, navigation, Operation, Troubleshooting and procedural Three.js study behavior.

2. **AppDeploy v21 V13.6 viewer** — high-fidelity Blender 3D baseline
   - app id: `fired-heater-atlas-3d-nekrod`
   - snapshot: `1789175113466`
   - provides the V13.6 GLB viewer logic, semantic model metadata, authored cameras and Blender-derived visual setup.

The large V13.6 GLB binary also exists in the user's Drive source package and can be used when the deployment asset path is prepared.

## Current migration status

Already mirrored into this branch from AppDeploy sources:

- Vite / TypeScript / PostCSS / Tailwind project configuration
- App shell / navigation baseline
- model types
- Burner page
- Radiant page
- Shield + Convection page
- Draft + Stack page
- Heater Types page
- Three.js camera / component config
- view / explode / operation config
- Three.js scene helpers
- Blender V12/V13-family scene-profile data used by the V13.6 viewer lineage

Still to mirror / integrate:

- the large master `Heater3D.tsx` engine or its carefully refactored equivalent
- Heater Types 3D engine
- Operation page
- Troubleshooting page
- full styling baseline
- V13.6 viewer integration and large GLB asset hosting
- final build / visual QA on the external preview

## Important sync rule

Do **not** rebuild the project from scratch. AppDeploy remains read-only. GitHub is the temporary continuation/source-control workspace. When Floot resets, only the reviewed GitHub changes should be synchronized back into the existing Floot project, followed by Floot typecheck and visual regression QA.
