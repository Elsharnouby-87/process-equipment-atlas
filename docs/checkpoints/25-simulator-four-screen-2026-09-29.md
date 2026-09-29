# Checkpoint 25 — Simulator four-screen architecture

Date: 2026-09-29

Pre-change checkpoint branch: `checkpoint/pre-simulator-four-screen-2026-09-29`

## Why this change

The dedicated Simulator had grown into a whole-heater fuel / air / draft model while still opening visually on a burner-centric scene. The physics state already couples fuel demand, burner air, stack restriction, draft, O2, CO, flue-gas flow and representative stack temperature.

The UI is therefore reorganized into four views of the same live simulator rather than four separate simulations.

## Screens

1. **Combustion** — fuel, burner air and combustion response.
2. **Draft** — arch pressure, stack damper and flue-gas evacuation.
3. **Heat Recovery** — convection / flue-gas context and stack-temperature response.
4. **Integrated** — whole-heater response with all three controls.

## Invariants

- One shared physics state persists when switching screens.
- Existing training presets are reused, filtered by screen relevance.
- Existing Heater3D camera and study modes are reused; no duplicate 3D model is introduced.
- The integrated screen is the default entry point.
- The physics kernel is unchanged by this UI architecture change.
