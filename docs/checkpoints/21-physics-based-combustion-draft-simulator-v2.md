# Checkpoint 21 — Physics-Based Combustion + Draft Simulator V2

## Purpose
Replace the Burner simulator's direct heuristic coupling with a small causal natural-draft physics kernel while preserving the existing 3D burner study, camera, fuel-path and mobile interaction architecture.

## Reference basis
The model direction is grounded in the project's reviewed combustion references, especially John Zink / Hamworthy:

- Stack damper is the primary draft-control element; burner air registers are the primary combustion-air / excess-O2 control elements, but the two are coupled.
- Closing burner registers can lower incoming air and total flue-gas flow, reduce heater friction losses and make arch pressure more negative even while O2 falls.
- Closing the stack damper increases downstream restriction and moves the firebox pressure profile toward zero / positive pressure.
- Increasing firing requires more combustion air and normally coordinated opening of burner registers and stack damper.
- Tramp air can enter through casing leaks, sight ports, penetrations or inactive-burner openings and raise downstream/stack O2 without improving burner-zone combustion.

Public DOE / process-heating references were used only as corroboration for stack thermal head, excess-air efficiency loss and the general O2/excess-air relationship. Exact plant values remain site/OEM specific.

## Calibration sheet
One transparent representative training point is used; it is not a plant target:

- Fuel-valve command: 55%
- Burner air-register command: 60%
- Stack-damper restriction command: 50% (0 = most open, 100 = most closed)
- Arch pressure: approximately -3.2 mmH2O
- Lambda: approximately 1.18
- Radiant-outlet O2: approximately 3.5% dry
- Representative stack temperature: 230 C
- Representative ambient temperature: 25 C
- Representative stack height: 24 m
- Representative natural-gas-like stoichiometric AFR: 17.2 mass/mass
- Small reference downstream tramp-air fraction: 1.5% of reference flue-gas flow

The methane-like dry-flue-gas O2 relationship is used only as a transparent training approximation. Refinery fuel-gas composition changes heating value, stoichiometric-air demand and the exact O2/excess-air relationship.

## Causal kernel
Each user movement now follows this chain rather than mapping directly to O2/draft:

Fuel command -> relative fuel flow -> relative heat input -> stoichiometric air demand

Air-register opening + available burner pressure differential -> actual combustion air

Actual air / stoichiometric demand -> lambda -> excess air -> radiant O2 + nonlinear CO tendency

Fuel + air -> flue-gas mass flow

Heat input / flue-gas throughput -> representative stack temperature -> chimney pull

Flue-gas throughput + heater resistance + stack-damper restriction -> pressure loss

Pressure loss - chimney pull -> arch pressure

Arch pressure feeds back into burner-air admission and the solver iterates to convergence.

A separate downstream tramp-air term produces Stack O2 independently from Radiant O2.

## User-visible V2 outputs
The detailed Burner simulator exposes:

1. Relative Heat Input (% of reference)
2. Actual Air (% of stoichiometric requirement)
3. Excess Air (%)
4. Radiant O2 (%)
5. Stack O2 (%)
6. CO training cue (ppm*)
7. Arch Draft / pressure (mmH2O)
8. Representative Stack Temperature (C*)

Lambda and solver convergence are also visible in the detailed engineering panel.

## Important boundary
This remains a representative training model. It is not CFD, a heater heat balance, a burner performance curve, an emissions guarantee, a BMS/SIS model, an operating procedure or a substitute for plant/OEM data.

## Regression QA added
A dedicated physics regression QA now verifies that:

- Balanced calibration remains around -3.2 mmH2O, 3.5% radiant O2 and lambda 1.18.
- Closing the burner air register reduces actual air and O2 while making arch pressure more negative at fixed stack-damper position.
- Closing the stack damper moves arch pressure toward zero/positive and reduces burner air/O2.
- Increasing fuel at unchanged air hardware raises heat input while reducing lambda/O2 and increasing CO tendency.
- Excess-air preset produces higher excess air and radiant O2 than Balanced.
- Stack O2 remains at or above radiant O2 under negative draft when the representative tramp-air term is active.
- Draft Concern reaches zero/positive arch pressure.

Development QA passed: assembly, structural regression, TypeScript, physics V2 regression and production build.
