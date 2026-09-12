# 07 — Draft Instrumentation & Analyzer Logic

Status: implemented on `floot-migration-dev` and deployed through GitHub Pages.

## Added

- Stronger qualitative upper-heater flue-gas visualization.
- Pale-cyan excess-air / residual-O2 awareness particles at 8 cyan vs 48 orange particles (~16.7% by count), explicitly not a gas-composition calculation.
- Arch / radiant-roof draft tap with visible PI/PT-style indicator, `-20 to +20 mmH2O` display range.
- Stack sample probe, sample line and analyzer cabinet for O2, CO, NOx and SOx training interpretation.
- Live simplified coupling from stack-damper restriction to representative arch draft, O2 and CO response.
- Three presets: Excess Negative Draft, Near-Target Draft, Positive Pressure Concern.
- NOx kept qualitative; SOx kept fuel-sulfur dependent rather than modeled as a direct damper response.
- Draft Instruments and Stack Analyzers exposed in the main Components navigator during the production build.

## Training boundary

The live values are representative training cues only. They are not universal fired-heater setpoints, alarm values, trip limits, CEMS outputs or operating instructions. Actual limits and targets depend on heater design, site procedures, OEM guidance, BMS/SIS logic, fuel, firing rate, burner design, ambient conditions and analyzer/sample-system configuration.

## Reference basis

Implementation logic was checked against the John Zink Hamworthy Combustion Handbook material in the project reference library, especially the sections covering target draft at the arch/radiant roof, stack-damper/draft interaction, excess oxygen, CO formation under insufficient-air conditions, air leakage/tramp-air effects, and combustion emissions.
