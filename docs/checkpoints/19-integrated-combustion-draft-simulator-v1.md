# Checkpoint 19 — Integrated Combustion & Draft Simulator V1

Status: PASS (development QA)

## Implemented

- Coupled relative controls: Fuel Gas Valve, Burner Air Register, Stack Damper.
- Live training outputs: flame response, draft, O2, CO, fuel/air/hot-product cues.
- Five training states: Balanced, Air-Starved, Fuel-Rich, Excess Air, Draft Concern.
- Reset to Balanced control.
- Physical 3D response: stack-damper blade, hero air-register slats, hero fuel-valve handwheel.
- Fuel-valve wheel motion is a visual teaching cue only; it is not calibrated valve travel or flow characteristic.

## Training boundary

The simulator teaches directional coupling only. Control percentages are relative commands. O2, CO and draft are representative signals, not plant setpoints, emissions guarantees, burner curves, heat-balance results or operating instructions.

## Reference basis

For natural-draft heaters, burner air registers and the stack damper are adjusted together to manage excess oxygen and draft. Reduced air throughput changes gas-flow friction; increasing fuel without adequate air drives oxygen downward and CO upward. Stable operation also requires acceptable flame pattern and flame-to-tube clearance.

## QA

- Dependency sanity: PASS
- Ordered source assembly: PASS
- Structural regression QA: PASS
- TypeScript QA: PASS
- Production build QA: PASS
