# Process Equipment Atlas

Interactive engineering learning platform for industrial process equipment.

Current equipment domain: **Fired Heater Atlas**  
Tagline: **EXPLORE · LEARN · UNDERSTAND**

## Current product state

The fired-heater module includes the core 3D atlas, detailed burner study, radiant section, shield and convection section, draft / stack system, heater types, operation training states and troubleshooting studies.

The current development branch is `floot-migration-dev`. The live GitHub Pages preview is built from that branch through the Pages workflow on `main`.

## Source organization

- `src/` — application pages, shared types, 3D helpers and training logic.
- `src/heater3d/` — reusable heater-view configuration and scene helpers.
- `src/_migration/Heater3D.part*.txt` — preserved migrated Heater3D source baseline.
- `scripts/` — ordered refinements applied to the migrated baseline.
- `scripts/assemble-project.mjs` — single entrypoint that rebuilds the generated Heater3D source and applies refinements in the required order.
- `scripts/qa-structure.mjs` — structural regression checks for critical project behavior.

## QA sequence

A production candidate must pass, in order:

1. Project assembly
2. Structural regression checks
3. TypeScript strict checking
4. Vite production build
5. GitHub Pages build and deployment
6. Visual review on desktop and mobile for changed 3D interactions

The automated development workflow performs steps 1–4 for every relevant change on `floot-migration-dev`.

## Engineering guardrail

The 3D application is an educational / training representation. Geometry, values and interactive operating relationships are representative unless explicitly stated otherwise. Site procedures, OEM documentation, BMS/SIS cause-and-effect and approved operating limits govern real plant operation.
