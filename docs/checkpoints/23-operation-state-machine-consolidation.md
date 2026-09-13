# Checkpoint 23 — Operation State Machine Consolidation + 3D State Synchronization

## Purpose
Consolidate the existing O-00 → O-14 Operation training engine without rebuilding it, changing the safety architecture, or mixing the independent Combustion & Draft Simulator back into the Operation page.

## Preserved operation sequence
The existing 15-state sequence remains unchanged:

O-00 Safe Non-Firing → O-01 Readiness → O-02 Process Ready → O-03 Purge Ready → O-04 Purge Active → O-05 Purge Complete → O-06 Pilot Ignition → O-07 Pilot Proven → O-08 Main Burner Light-Off → O-09 Firing Stabilization → O-10 Controlled Warm-Up → O-11 Normal Operation → O-12 Load Change → O-13 Controlled Shutdown → O-14 Cool-Down / Non-Firing.

Existing progression gates, blocked branches and Abnormal Awareness Lab remain intact.

## Changes made

### 1. 3D visual-state strip
Added a persistent visual-state strip to the normal Operation journey showing what the 3D model is currently depicting:

- Process Flow
- Purge Cue
- Pilot Cue
- Main Flame
- Hot Gas

The strip is explicitly labeled **3D VISUAL STATE · NOT FIELD STATUS** so it cannot be read as an actual plant permissive, line-up or operating verification.

Pilot wording remains deliberately conservative outside the pilot-specific states because real pilot retention / shutdown philosophy is OEM and site dependent.

### 2. Clearer information hierarchy
Reduced duplicate presentation so the page behaves more like a training instrument:

- 3D + state strip = what is happening visually
- Left side = journey progression and branch choices
- Right side = why the state exists, what the operator observes, state-specific context and safety guardrails

The duplicated center state-code navigation is hidden because the same navigation already exists in the left progression rail and mobile Study sheet.

The duplicated right-panel **WHAT CHANGES** block is hidden because those changes are now represented by the 3D and state strip; the source copy remains preserved for mobile/detail contexts.

### 3. Normal Operation → Simulator handoff
Added a visible **Combustion & Draft Simulator** handoff during Normal Operation.

This keeps the architecture clean:

- Operation teaches how the heater reaches / moves through operating states.
- Simulator teaches what happens when Fuel / Air Register / Stack Damper are changed in the coupled physics model.

## Protected boundaries
Checkpoint 23 does **not** modify:

- O-00 → O-14 state order
- readiness / purge / pilot / firing / warm-up / load / shutdown progression gates
- Abnormal Awareness Lab logic
- `src/combustionTrainingLogic.ts`
- `src/physicsCalibration.ts`
- Heater3D geometry
- Heater3D camera behavior
- Physics V2 equations or calibration
- purge times, fuel pressures, draft targets, oxygen targets, BMS permissives or other site-specific operating values

## Regression QA
Dedicated Operation QA verifies:

- O-00 → O-14 order is unchanged
- the five visual-state indicators are present
- the Normal Operation → Simulator handoff is present
- duplicate center navigation / right-panel change copy are consolidated
- the Operation patch does not write Physics V2, calibration or Heater3D source

Development QA passed:

- Assembly PASS
- Structural regression QA PASS
- TypeScript QA PASS
- Navigation architecture QA PASS
- Operation state machine QA PASS
- Physics V2 regression QA PASS
- Production build PASS

GitHub Pages deployment also completed successfully.

## Deployment
Main deployment workflow run: `34756744375` — build PASS, deploy PASS.
