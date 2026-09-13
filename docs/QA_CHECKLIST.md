# Regression QA Checklist

Use this checklist before simulator or geometry changes are promoted to the live preview.

## Automated gates

- Project assembly completes in the defined patch order.
- Structural regression QA passes.
- TypeScript strict check passes with no errors.
- Production Vite build passes.

## Core Atlas

- Opens in **Free Explore** with no component forced as selected.
- Orbit, zoom and pan remain stable on desktop and mobile.
- Empty-space selection returns to Free Explore.
- Normal, Cutaway, X-Ray and global Exploded remain distinct.
- Component Focus and Isolate preserve useful heater context.

## Burner

- Underfurnace shows external hardware only; no normal flame below the floor.
- Fuel-gas teaching cue follows the representative fuel-line route and stays visible.
- Internal Cutaway connects external hardware to throat / flame-root context.
- Burner Exploded separates the local burner assembly, not the full heater.
- Pilot, ignition electrode and flame-proving / scanner hardware are readable.
- Pilot labels do not obscure the hardware.
- Normal flame clearance from radiant tubes remains visually healthy.

## Radiant / Shield / Convection

- Radiant tubes remain vertical in the main box-heater configuration.
- Shield rows remain bare.
- Main convection rows remain horizontal and finned.
- Flow and study overlays appear only in the intended study states.

## Draft / Stack

- Damper OPEN / MORE CLOSED direction matches the physical blade response.
- Draft reading remains in mmH2O and responds in the intended qualitative direction.
- O2 / CO trends remain consistent with the representative training logic.
- Draft instruments and stack analyzers focus on their actual 3D hardware.
- Orange flue-gas cues dominate pale-cyan oxygen / excess-air cues.
- Mobile damper control does not hide the damper mechanism.

## Operation / Troubleshooting

- Operation remains explicitly training-state based, not a universal operating procedure.
- No site-specific purge times, fuel pressures, damper percentages or warm-up rates are invented.
- Positive firebox pressure remains distinct from premix flashback / backfire.
- Flame impingement remains an abnormal scenario rather than the normal firing state.

## Mobile visual pass

Test at minimum:

- Atlas Free Explore
- Burner Underfurnace
- Burner Internal Cutaway
- Burner Exploded
- Pilot & Ignition
- Stack Damper live control
- Draft Instruments
- Stack Analyzers
- Heater Types comparison
- One Operation state transition
- One Troubleshooting scenario
