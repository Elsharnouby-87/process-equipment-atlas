# Checkpoint 18 — Burner Fuel Path Mode Consistency

Status: PASS

## What changed

- Burner fuel-path teaching cue is now kept visible across the main Atlas Burner view modes.
- The main Atlas locks the Burner fuel-path cue while Burners are selected, so switching Normal / Cutaway / X-Ray / Exploded does not silently hide the path.
- Dedicated Burner study views keep their relevant fuel cue visible across Underfurnace, Internal Cutaway, Burner Exploded and Pilot & Ignition.
- Exploded mode uses a slower, softer, lower-opacity **reference fuel path** so it does not imply operating flow through a dismantled burner.
- Pilot & Ignition identifies the cue as **Pilot Fuel Path**.
- Underfurnace / Internal Cutaway retain the stronger live **Fuel Gas** teaching cue.

## QA

- Ordered source assembly: PASS
- Structural regression QA: PASS
- TypeScript QA: PASS
- Production build: PASS
- GitHub Pages build: PASS
- GitHub Pages deploy: PASS

No unrelated heater geometry, camera, draft logic or simulator values were changed in this checkpoint.
