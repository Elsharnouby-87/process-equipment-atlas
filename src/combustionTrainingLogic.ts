import { getDraftTrainingMetrics } from './draftTrainingLogic';

export type CombustionTrainingState = 'balanced' | 'air-starved' | 'excess-air' | 'low-firing' | 'pressure-concern';

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
 * Simplified natural-draft burner interaction used for training visualization only.
 *
 * Controls are intentionally treated as relative commands, not calibrated flows:
 * - fuelValvePct is a relative fuel / firing-demand proxy, NOT fuel mass flow.
 * - airRegisterPct is a relative register opening, NOT combustion-air flow.
 * - damperRestrictionPct follows the Atlas convention: 0 = most open, 100 = most closed.
 *
 * Directional coupling follows the project reference basis:
 * - stack damper changes global draft pull;
 * - burner air-register position changes local air admission and total gas-flow resistance;
 * - increased fuel requires additional combustion air and increases flue-gas loading;
 * - insufficient available air drives O2 down and CO upward;
 * - closing burner registers at unchanged stack-damper position can make draft more negative because total gas flow / friction loss falls.
 *
 * The numbers are representative signals selected to teach coupling. They are not plant setpoints,
 * burner curves, valve characteristics, emissions guarantees or a combustion calculation.
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

  // More air / fuel means more total gas through the heater and therefore more friction loss.
  // The correction is deliberately modest so the stack damper remains the dominant draft control.
  const flowLoadCorrection = 0.55 * ((fuel - 55) / 45) + 0.45 * ((air - 60) / 40);
  const draft = clamp(baseDraft + 0.95 * flowLoadCorrection, -15, 8);

  // Natural-draft pull modifies how much air a given register opening can actually admit.
  const draftPullFactor = clamp(0.92 + (-draft - 3.2) * 0.055, 0.35, 1.35);
  const effectiveAir = (air / 60) * (0.76 + 0.24 * draftPullFactor);
  const fuelDemand = Math.max(0.18, fuel / 55);
  const airFuelIndex = effectiveAir / fuelDemand;

  let oxygen = clamp(3.5 + (airFuelIndex - 1) * 5.7, 0.5, 8.5);
  if (draft > 0) oxygen = clamp(oxygen - Math.min(0.8, draft * 0.12), 0.5, 8.5);

  const richPenalty = Math.max(0, 0.98 - airFuelIndex);
  const lowOxygenPenalty = Math.max(0, 2.0 - oxygen);
  const co = Math.round(clamp(22 + richPenalty * richPenalty * 3200 + lowOxygenPenalty * 25, 15, 900));

  let state: CombustionTrainingState;
  if (draft >= 0) state = 'pressure-concern';
  else if (fuel < 22) state = 'low-firing';
  else if (co >= 100 || oxygen < 2.2) state = 'air-starved';
  else if (oxygen > 5.0 || draft < -6.0) state = 'excess-air';
  else state = 'balanced';

  const stateLabel = state === 'pressure-concern'
    ? 'Draft / Pressure Concern'
    : state === 'air-starved'
      ? 'Fuel-Rich / Air-Starved Tendency'
      : state === 'excess-air'
        ? 'Excess-Air / High-Draft Tendency'
        : state === 'low-firing'
          ? 'Low Firing Training State'
          : 'Balanced Training Zone';

  const stateNote = state === 'pressure-concern'
    ? 'The representative firebox pressure has reached zero or positive. Hot-gas containment margin is reduced; this is not a normal target condition.'
    : state === 'air-starved'
      ? 'Fuel demand is high relative to available combustion air. The training model drives O₂ down, CO upward and the flame becomes longer / less settled.'
      : state === 'excess-air'
        ? 'Available air / draft is high relative to fuel demand. O₂ rises and the flame tightens; excess air and air ingress can reduce efficiency.'
        : state === 'low-firing'
          ? 'Fuel demand is intentionally low. Flame size and hot-product flow are reduced; this is a relative training state, not a turndown guarantee.'
          : 'Fuel demand, burner-air admission and stack draft are in a representative balanced relationship for training.';

  const oxygenLabel = oxygen < 2.2 ? 'LOW' : oxygen <= 4.2 ? 'REPRESENTATIVE BAND' : 'HIGH';
  const coLabel = co >= 100 ? 'ELEVATED TRAINING CUE' : co >= 50 ? 'RISING TRAINING CUE' : 'LOW TRAINING CUE';
  const flameLabel = state === 'air-starved'
    ? 'Longer / lazier tendency'
    : state === 'excess-air'
      ? 'Tighter / leaner tendency'
      : state === 'pressure-concern'
        ? 'Draft-sensitive / unstable tendency'
        : state === 'low-firing'
          ? 'Reduced heat-release cue'
          : 'Stable representative flame';

  const airStarved = state === 'air-starved';
  const excessAir = state === 'excess-air';
  const pressureConcern = state === 'pressure-concern';
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
    flameHeightScale: clamp((0.62 + firing01 * 0.82) * (airStarved ? 1.12 : excessAir ? 0.94 : pressureConcern ? 1.05 : 1), 0.35, 1.58),
    flameWidthScale: clamp((0.76 + firing01 * 0.34) * (airStarved ? 1.24 : excessAir ? 0.92 : pressureConcern ? 1.12 : 1), 0.45, 1.46),
    flameWobbleRad: airStarved ? 0.12 : pressureConcern ? 0.10 : excessAir ? 0.035 : 0.018,
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
  airStarved: { label: 'Air-Starved', fuel: 78, air: 38, damperRestriction: 58 },
  excessAir: { label: 'Excess Air', fuel: 42, air: 82, damperRestriction: 30 },
  higherFiring: { label: 'Higher Firing', fuel: 78, air: 82, damperRestriction: 46 },
} as const;
