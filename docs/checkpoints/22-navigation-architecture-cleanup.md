# Checkpoint 22 — Navigation Architecture Cleanup

## Pre-change checkpoint confirmation
Checkpoint 21 already existed before this architecture change: `21-physics-based-combustion-draft-simulator-v2.md`. It preserves the physics-based combustion + draft simulator V2 basis, calibration, causal loop and regression QA.

## Purpose
Separate the product information architecture so each global destination has one clear job:

- **ATLAS** — locate and understand components in the whole heater.
- **COMPONENTS** — enter dedicated deep-dive component study modules.
- **SIMULATOR** — study coupled fuel / combustion-air / natural-draft interaction.
- **HEATER TYPES** — compare heater configurations.
- **OPERATION** — follow the operating-state learning journey.
- **TROUBLESHOOTING** — investigate abnormal conditions and diagnostic cues.

## Changes made

### Global navigation
Added a new **SIMULATOR** tab between COMPONENTS and HEATER TYPES.

### COMPONENTS landing page
COMPONENTS no longer depends on whichever component happened to be selected in the Atlas. It now opens a dedicated landing page with four available deep-dive modules:

1. Burner Assembly
2. Radiant Tubes
3. Shield + Convection
4. Breeching + Stack

### Dedicated Simulator page
Created a separate Combustion + Draft Simulator page using the existing V2 physics kernel and existing Heater3D runtime.

The Simulator exposes the existing three operator inputs:

- Fuel-gas valve relative demand
- Burner air-register position
- Stack-damper restriction

And the existing V2 response set:

- Relative heat input
- Actual air (% stoichiometric)
- Excess air
- Radiant O2
- Stack O2
- CO training cue
- Arch draft
- Representative stack temperature

### Burner component page
The Burner page remains a component study focused on anatomy, fuel path, air register, flame root, exploded assembly, pilot / ignition and inspection. The cross-system combustion + draft simulator controls/readouts are visually removed from this page.

## Non-changes / protection boundary
This checkpoint intentionally does **not** alter:

- `src/combustionTrainingLogic.ts` physics equations or calibration
- `src/physicsCalibration.ts`
- Heater3D geometry
- Heater3D camera behaviour
- Burner geometry
- Draft instrumentation geometry
- Existing V2 physics regression expectations

The dedicated Simulator page calls the existing `getCombustionTrainingMetrics()` kernel rather than duplicating physics logic.

## Regression QA
A dedicated navigation architecture QA gate verifies:

- COMPONENTS opens the landing page.
- SIMULATOR is a separate global route.
- The four component-study cards are present.
- The Burner page is marked as component-focused and its simulator UI is separated.
- The Simulator page reuses the existing V2 physics kernel.
- Navigation order is ATLAS → COMPONENTS → SIMULATOR → HEATER TYPES → OPERATION → TROUBLESHOOTING.

Development QA passed:

- Assembly PASS
- Structural regression QA PASS
- TypeScript QA PASS
- Navigation architecture QA PASS
- Physics V2 regression QA PASS
- Production build PASS

GitHub Pages deployment also completed successfully.

## Deployment
Main deployment workflow run: `34755387401` — build PASS, deploy PASS.
