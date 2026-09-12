# Process Equipment Atlas — Migration Status

This repository is the external source-control mirror for the existing Floot project:

- Floot project: `Fired Heater Atlas v42 Migration`
- Floot project ID: `3310402f-e3dc-4325-931b-085c9e8fd95b`
- Primary product: **PROCESS EQUIPMENT ATLAS**
- Tagline: **EXPLORE · LEARN · UNDERSTAND**
- Current equipment module: **Fired Heater**

## Working branch

Development branch: `floot-migration-dev`

## Current migration status

- Core Atlas 3D parity work completed in Floot.
- Burner detailed study module substantially implemented and visually QA-tested in Floot.
- Next planned module: Radiant.
- Existing AppDeploy v42 remains read-only technical/functional reference.

## Important sync rule

Do **not** rebuild the project from scratch in this repository.
The exact current Floot source must be copied here first, then development continues from that snapshot.

At repository setup time, Floot had reached its daily build-action limit, which temporarily paused Floot source-reading actions. The exact source sync therefore remains pending until Floot access resets. Once available, the current Floot files will be mirrored here before further development.
