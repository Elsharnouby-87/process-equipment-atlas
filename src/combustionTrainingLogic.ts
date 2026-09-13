import { getDraftTrainingMetrics } from './draftTrainingLogic';

export type CombustionTrainingState = 'balanced' | 'air-starved' | 'fuel-rich' | 'excess-air' | 'draft-concern';

export type CombustionTrainingMetrics = {
  fuelValvePct: number;
  airRegisterPct: number;
  damperRestrictionPct: number;
  damperOpeningPct: number;
  draftMmH2O: number;
  oxygenPct: number;
  coPpm: number;
  airFuelIndex: number;
  state: CombustionTrainingState;
  stateLabel: string;
  stateNote: string;
  oxygenLabel: string;
  coLabel: string;
  flameLabel: string;
  flameHeightScale: number;
  flameWidthScale: number;
  flameWobbleRad: number;
  airParticleSpeed: number;
  fuelParticleSpeed: number;
  hotParticleSpeed: number;
  airParticleScale: number;
  fuelParticleScale: number;
  hotParticleScale: number;
  hotProductStrength: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Integrated combustion + draft training model for the Atlas.
 *
 * IMPORTANT TRAINING BOUNDARY
 * - fuelValvePct is a relative firing-demand command, NOT calibrated fuel mass flow.
 * - airRegisterPct is a relative register opening, NOT measured combustion-air flow.
 * - damperRestrictionPct follows the Atlas convention: 0 = most open, 100 = most closed.
 * - O2, CO and draft are representative response signals selected to teach direction and coupling.
 * - The model is not a burner curve, heat balance, emissions guarantee, control-loop model or plant operating procedure.
 *
 * Directional behavior follows the project reference basis for natural-draft heaters:
 * - the stack damper and burner air register are adjusted together to manage draft and excess oxygen;
 * - closing burner registers reduces air / flue-gas throughput and friction loss, so draft may become more negative at unchanged stack-damper position;
 * - increasing fuel without adequate available air drives oxygen downward and CO upward, eventually giving a fuel-rich tendency;
 * - excessive draft / air admission drives oxygen upward and can increase efficiency loss / leakage-air sensitivity;
 * - satisfactory operation requires stable flame patterns and adequate flame-to-tube clearance.
 */
export function getCombustionTrainingMetrics(
  fuelValvePct: number,
  airRegisterPct: number,
  damperRestrictionPct: number,
): CombustionTrainingMetrics {
  const fuel = clamp(fuelValvePct, 0, 100);
  const air = clamp(airRegisterPct, 0, 100);
  const damperRestriction = clamp(damperRestrictionPct, 0, 100);
  const damperOpening = 100 - damperRestriction;

  const baseDraft = getDraftTrainingMetrics(damperRestriction).draftMmH2O;

  // More fuel / air raises total gas throughput and friction loss. Keep this correction modest:
  // the stack damper remains the dominant draft-control input in the training model.
  const flowLoadCorrection = 0.55 * ((fuel - 55) / 45) + 0.45 * ((air - 60) / 40);
  const draft = clamp(baseDraft + 0.95 * flowLoadCorrection, -15, 8);

  // Natural-draft pull changes how much air a given register opening can admit.
  const draftPullFactor = clamp(0.92 + (-draft - 3.2) * 0.055, 0.35, 1.35);
  const effectiveAir = (air / 60) * (0.76 + 0.24 * draftPullFactor);
  const fuelDemand = Math.max(0.18, fuel / 55);
  const airFuelIndex = effectiveAir / fuelDemand;

  let oxygen = clamp(3.5 + (airFuelIndex - 1) * 5.7, 0.5, 8.5);
  if (draft > 0) oxygen = clamp(oxygen - Math.min(0.8, draft * 0.12), 0.5, 8.5);

  const richPenalty = Math.max(0, 0.99 - airFuelIndex);
  const lowOxygenPenalty = Math.max(0, 2.0 - oxygen);
  const co = Math.round(clamp(22 + richPenalty * richPenalty * 3200 + lowOxygenPenalty * 25, 15, 900));

  let state: CombustionTrainingState;
  if (draft >= 0 || draft < -9.0) state = 'draft-concern';
  else if (airFuelIndex < 0.72 || oxygen < 1.1 || co >= 350) state = 'fuel-rich';
  else if (airFuelIndex < 0.96 || oxygen < 2.2 || co >= 100) state = 'air-starved';
  else if (oxygen > 5.0 || draft < -6.0) state = 'excess-air';
  else state = 'balanced';

  const stateLabel = state === 'draft-concern'
    ? draft >= 0 ? 'Draft Concern · Positive Pressure Tendency' : 'Draft Concern · Excess Negative Draft'
    : state === 'fuel-rich'
      ? 'Fuel-Rich Tendency'
      : state === 'air-starved'
        ? 'Air-Starved Tendency'
        : state === 'excess-air'
          ? 'Excess-Air Tendency'
          : 'Balanced Training Zone';

  const stateNote = state === 'draft-concern'
    ? draft >= 0
      ? 'Representative firebox pressure has reached zero or positive. Hot-gas containment margin is reduced; this is not a normal target condition.'
      : 'Draft pull is deliberately excessive in this training state. O2 / leakage-air tendency rises and useful heat can be carried out with unnecessary flue-gas flow.'
    : state === 'fuel-rich'
      ? 'Fuel demand substantially exceeds the available-air cue. O2 is driven very low, CO rises strongly and the flame becomes longer / less settled. This is a training tendency, not an alarm model.'
      : state === 'air-starved'
        ? 'Available combustion air is becoming low relative to fuel demand. O2 falls, CO begins to rise and the flame becomes progressively lazier.'
        : state === 'excess-air'
          ? 'Available air / draft is high relative to fuel demand. O2 rises and the flame tightens; excess air and leakage-air sensitivity can reduce efficiency.'
          : 'Fuel demand, burner-air admission and stack draft are in a representative balanced relationship for training.';

  const oxygenLabel = oxygen < 2.2 ? 'LOW' : oxygen <= 4.2 ? 'REPRESENTATIVE BAND' : 'HIGH';
  const coLabel = co >= 350 ? 'HIGH TRAINING CUE' : co >= 100 ? 'ELEVATED TRAINING CUE' : co >= 50 ? 'RISING TRAINING CUE' : 'LOW TRAINING CUE';
  const flameLabel = state === 'fuel-rich'
    ? 'Long / luminous / unsettled tendency'
    : state === 'air-starved'
      ? 'Longer / lazier tendency'
      : state === 'excess-air'
        ? 'Tighter / leaner tendency'
        : state === 'draft-concern'
          ? 'Draft-sensitive tendency'
          : 'Stable representative flame';

  const fuelRich = state === 'fuel-rich';
  const airStarved = state === 'air-starved';
  const excessAir = state === 'excess-air';
  const draftConcern = state === 'draft-concern';
  const firing01 = fuel / 100;
  const completeCombustion = clamp(Math.min(fuelDemand, effectiveAir), 0.05, 1.55);

  return {
    fuelValvePct: fuel,
    airRegisterPct: air,
    damperRestrictionPct: damperRestriction,
    damperOpeningPct: damperOpening,
    draftMmH2O: Number(draft.toFixed(1)),
    oxygenPct: Number(oxygen.toFixed(1)),
    coPpm: co,
    airFuelIndex: Number(airFuelIndex.toFixed(2)),
    state,
    stateLabel,
    stateNote,
    oxygenLabel,
    coLabel,
    flameLabel,
    flameHeightScale: clamp((0.62 + firing01 * 0.82) * (fuelRich ? 1.20 : airStarved ? 1.10 : excessAir ? 0.94 : draftConcern ? 1.05 : 1), 0.35, 1.58),
    flameWidthScale: clamp((0.76 + firing01 * 0.34) * (fuelRich ? 1.28 : airStarved ? 1.18 : excessAir ? 0.92 : draftConcern ? 1.10 : 1), 0.45, 1.46),
    flameWobbleRad: fuelRich ? 0.15 : airStarved ? 0.10 : draftConcern ? 0.11 : excessAir ? 0.035 : 0.018,
    airParticleSpeed: lerp(0.45, 1.55, clamp((air / 100) * (0.72 + 0.28 * draftPullFactor), 0, 1)),
    fuelParticleSpeed: lerp(0.28, 1.55, firing01),
    hotParticleSpeed: lerp(0.34, 1.42, clamp(completeCombustion / 1.15, 0, 1)),
    airParticleScale: lerp(0.58, 1.18, air / 100),
    fuelParticleScale: lerp(0.45, 1.22, firing01),
    hotParticleScale: lerp(0.5, 1.18, clamp(completeCombustion / 1.15, 0, 1)),
    hotProductStrength: clamp(completeCombustion / 1.05, 0.12, 1.25),
  };
}

export const combustionTrainingPresets = {
  balanced: { label: 'Balanced', fuel: 55, air: 60, damperRestriction: 50 },
  airStarved: { label: 'Air-Starved', fuel: 58, air: 34, damperRestriction: 50 },
  fuelRich: { label: 'Fuel-Rich', fuel: 88, air: 34, damperRestriction: 56 },
  excessAir: { label: 'Excess Air', fuel: 42, air: 82, damperRestriction: 30 },
  draftConcern: { label: 'Draft Concern', fuel: 55, air: 58, damperRestriction: 88 },
  // Retained as a non-UI compatibility preset for earlier code paths.
  higherFiring: { label: 'Higher Firing', fuel: 78, air: 82, damperRestriction: 46 },
} as const;
