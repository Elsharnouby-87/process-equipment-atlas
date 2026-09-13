# 17 — Burner Fuel Path Continuity Across Study Views

## Goal
Keep the burner fuel-path teaching cue visible and understandable across the detailed Burner study views without changing the established visual identity or combustion-training logic.

## Changes
- Underfurnace and Internal Cutaway retain the established installed fuel-line tracer.
- Pilot & Ignition keeps a fuel-only cue to avoid implying unrelated hot-product flow in the micro study.
- Burner Exploded now shows the installed fuel-path reference instead of hiding the tracer entirely.
- The Exploded legend says **Fuel Path** rather than **Fuel Gas** to avoid implying that a disassembled burner is operating.
- Atlas contextual Burner Exploded mode allows the fuel-path overlay while preserving the global-heater explode behavior elsewhere.

## QA
- Ordered source assembly: PASS
- Structural regression guards: PASS
- TypeScript strict check: PASS
- Production Vite build: PASS

No operating setpoints or new process-model claims were introduced by this patch.
