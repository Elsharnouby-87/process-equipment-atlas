# GitHub Pages Deployment Trigger

Preview source branch: `checkpoint-pre-components-motion-prototype-2026-09-14`

Preview addition: **Dynamic Cockpit Motion Lab V3**

This republishes the unchanged production Atlas plus the isolated radical layout/motion sandbox at:

`/process-equipment-atlas/previews/dynamic-cockpit-v3/`

Production update: **isolated heater study view** — removed non-essential industrial background towers/pipes while preserving the heater, true stack, breeching, burners, supports, UI and labels.

Production update: **V13.6 purge fan / blower integration** — adds the source-based purge-air package, two lower-radiant entries, selectable Atlas component, animated fan-to-stack airflow, and O-03/O-04/O-05 operation training integration.

Deployment retry: purge fan integration QA-anchor compatibility fix applied.

Deployment retry: TypeScript cleanup for purge fan integration.

Production update: **Purge Air System detailed learning module** — adds Overview, Blower, Isolation Damper, Airflow Proof, External Riser, Two Entries, Full Purge Flow and BMS/Permissive studies, plus explicit O-04 FAN RUNNING / DAMPER PROVED / AIRFLOW PROVED visual-state cues.

Production update: **Troubleshooting T-04 / T-05 expansion** — activates Convection Fouling (clean → deposits → restricted gas path → ΔP / stack-T consequence) and High Stack Temperature (baseline → rising trend → correlated evidence → multi-branch diagnosis) with new 3D overlays, camera focuses and source-grounded diagnostic content.

Production update: **Global typography readability pass** — enlarges instructional/body copy, diagnostic text, simulator labels, component-study notes, operation status text and mobile learning sheets while preserving headline sizes and large simulator numeric readouts.

Production update: **Troubleshooting content cleanup** — removes Learning Chain and Technical Basis / Sources / References cards from T-01 through T-05, while keeping the diagnostic content and training boundary.

Production update: **Troubleshooting declutter pass** — removes the repeated Training Boundary card from T-01 through T-05 to keep the diagnostic panels concise and reduce non-essential visual noise.

Production update: **Atlas context declutter** — removes the redundant `Training visualization · Schematic geometry · Not a certified plant design` line from the main Atlas context bar.

Production update: **Free Explore declutter** — removes the entire right-side Free Explore inspector, hides its mobile Details action, and expands the 3D workspace until a real component is selected.

Production update: **Heater Types visual refinement** — upgrades Box, Cabin and Vertical Cylindrical models with cleaner proportions, shell panel thickness, stack/breeching transitions, structural bands, support framing, platforms/ladders, clearer burners and coil layouts, plus improved materials, shadows and camera framing.

Production update: **Heater Types lighting boost** — lifts scene exposure, brightens shell/tube materials, adds a soft front fill light, strengthens key/rim lighting, and raises ground/grid visibility while preserving the dark Atlas theme.

Production update: **Heater Types envelope continuity** — closes the Box heater exterior roof, replaces the Cabin floating roof plates with a continuous pitched roof, connects both heaters through coherent plenum/breeching transitions to the stack, and keeps cutaway openings limited to study views.

Production update: **Open stack tops** — changes Box, Cabin and Vertical Cylindrical heater stacks to open-ended shells with visible dark inner throats and top rim detail, removing the unrealistic closed top cap.

Production update: **Box radiant full-flow routing** — animates process fluid through all four representative two-pass radiant tube circuits, following each vertical tube pair and top return bend instead of showing only one loop.

Production update: **Heater Types declutter** — removes the redundant Training Model card, Visual Comparison Questions card, and duplicated mobile training guardrail so the right panel ends on useful comparison/study content only.

Production update: **Smart Atlas label declutter** — compacts component labels, shortens purge callouts, adds subtle leader lines to purge equipment, and limits Focus mode labels to the selected component and its own detail callouts so equipment stays visible.

Production update: **Purge blower visual + camera refinement** — rebuilds the purge blower as a clearer industrial package with skid rails, flanged casing, tapered bellmouth, inlet guard/spokes, side-mounted finned motor and drive guard, and retunes Atlas/Purge-study cameras to center the blower package instead of the heater body.

Production update: **Purge blower realism + label LOD refinement** — adds a more industrial blower package (desaturated materials, flanged/bellmouth inlet, concentric guard, swept impeller blades, motor end bells/fan cover, flexible connector, damper flanges/lever and instrument-style airflow proof) and makes purge labels shrink/fade subtly at close zoom while retuning Atlas and study cameras to a three-quarter view.

Production update: **Open purge casing + smart label tiers** — makes the purge blower casing open-ended with a dark inner throat so the impeller is visible through the guard, replaces the blocky drive guard with a slimmer rounded cover, mounts a smaller local starter on a pedestal, and adds distance-based purge label tiers: close = BLOWER only, medium = BLOWER / DAMPER / AIRFLOW PROOF, far = all purge callouts, with close-range leader lines suppressed to keep the equipment unobstructed.

Production update: **Front-visible purge fan** — moves the impeller forward toward the inlet plane, reduces hub/spinner size, lightens the inlet guard to six thinner spokes and smaller bolts, adds a higher-contrast impeller material, and retunes Atlas/Purge-study cameras to a front-biased angle so the fan blades remain clearly visible from the inlet side.

Production update: **Creator signature** — adds a subtle `Created by Eng. Ahmed Elshrarnouby` signature as a sticky footer at the bottom of the Atlas left sidebar, styled to stay visible without competing with navigation content.

Production update: **Creator signature color** — switches `Created by Eng. Ahmed Elshrarnouby` to the Atlas orange accent with a lighter orange hover state.

Production update: **Atlas/Components declutter** — removes the `Context-first learning` card from the Atlas sidebar and the `Architecture rule` note from the Components hub, keeping only the creator signature and actionable study content.

Production update: **Atlas viewer declutter** — removes the `ATLAS 3D` interaction-hint strip (`Drag / Wheel / Shift-drag / Double tap`) from the viewer because the controls are already discoverable and the strip adds visual clutter.

Retry note: removed the obsolete `free-explore-patch.mjs` anchor that still expected the deleted Atlas interaction hint, then retriggered Pages deployment.

Production update: **Codebase cleanup checkpoint** — preserves the current site behavior while removing orphaned UI styles, organizing npm maintenance/QA commands, hardening Heater3D assembly validation, aligning the Pages workflow with named project scripts, and documenting the source-of-truth / checkpoint workflow. Baseline: `checkpoint/code-cleanup-baseline-2026-09-29`.

Production update: **Atlas viewer badge cleanup** — removes the `FREE EXPLORE / WHOLE HEATER` status badge and the `RADIANT / SHIELD / CONVECTION` zone badges from the main 3D viewport, along with their obsolete styles and Free Explore patch anchor.

Production update: **Simulator declutter** — removes the top `Representative causal model` disclaimer and the bottom `Representative physics-based training model` card from the Simulator, plus their unused copy export and styles.

Production update: **Four-screen Simulator architecture** — reorganizes the existing shared physics model into COMBUSTION, DRAFT, HEAT RECOVERY and INTEGRATED screens. Fuel / air / stack-damper state persists across screens; each screen reuses existing Heater3D cameras/study modes and filters controls, presets and live outputs. Default entry is INTEGRATED. Pre-change checkpoint: `checkpoint/pre-simulator-four-screen-2026-09-29`.


Mobile header refresh — 2026-10-03: show PROCESS EQUIPMENT ATLAS and creator signature above/below the Fired Heater title on portrait mobile.
