import { physicsCalibration } from './physicsCalibration';

export type CombustionTrainingState = 'balanced' | 'air-starved' | 'fuel-rich' | 'excess-air' | 'draft-concern';

export type CombustionTrainingMetrics = {
  fuelValvePct: number;
  airRegisterPct: number;
  damperRestrictionPct: number;
  damperOpeningPct: number;
  fuelFlowPctRef: number;
  heatInputPctRef: number;
  actualAirPctStoich: number;
  excessAirPct: number;
  lambda: number;
  draftMmH2O: number;
  radiantOxygenPct: number;
  stackOxygenPct: number;
  oxygenPct: number;
  coPpm: number;
  stackTemperatureC: number;
  flueGasFlowPctRef: number;
  chimneyPullMmH2O: number;
  pressureLossMmH2O: number;
  trampAirPctFlue: number;
  converged: boolean;
  iterations: number;
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

const AIR_DENSITY_AT_25C = 1.184;
const FLUE_GAS_DENSITY_FACTOR = 0.98;
const REFERENCE_HEATER_LOSS_SHARE = 0.57;
const REFERENCE_DAMPER_LOSS_SHARE = 0.43;
const MAX_ITERATIONS = 24;
const CONVERGENCE_MM_H2O = 0.015;

function methaneLikeDryOxygenPct(lambda: number) {
  if (lambda <= 1) return 0;
  const denominator = 9.52 * lambda - 1;
  if (denominator <= 0) return 0;
  return clamp((200 * (lambda - 1)) / denominator, 0, 12);
}

function relativeFuelFlow(fuelValvePct: number) {
  const reference = physicsCalibration.referenceFuelValvePct;
  return clamp((Math.max(fuelValvePct, 1) / reference) ** 1.10, 0.04, 1.90);
}

function relativeRegisterArea(airRegisterPct: number) {
  const reference = physicsCalibration.referenceAirRegisterPct;
  const normalized = Math.max(airRegisterPct, 0) / reference;
  return clamp(0.08 + 0.92 * normalized ** 0.85, 0.08, 1.55);
}

function airDensity(ambientTemperatureC: number) {
  const kelvin = ambientTemperatureC + 273.15;
  return AIR_DENSITY_AT_25C * (298.15 / kelvin);
}

function chimneyPullMmH2O(stackTemperatureC: number, ambientTemperatureC: number) {
  const ambientK = ambientTemperatureC + 273.15;
  const stackK = stackTemperatureC + 273.15;
  const rhoAir = airDensity(ambientTemperatureC);
  const rhoFlue = rhoAir * (ambientK / stackK) * FLUE_GAS_DENSITY_FACTOR;
  return Math.max(0, physicsCalibration.representativeStackHeightM * (rhoAir - rhoFlue));
}

const referenceChimneyPull = chimneyPullMmH2O(
  physicsCalibration.referenceStackTemperatureC,
  physicsCalibration.ambientTemperatureC,
);
const referenceTotalLoss = Math.max(
  0.5,
  referenceChimneyPull + physicsCalibration.referenceArchPressureMmH2O,
);
const referenceHeaterLoss = referenceTotalLoss * REFERENCE_HEATER_LOSS_SHARE;
const referenceDamperLoss = referenceTotalLoss * REFERENCE_DAMPER_LOSS_SHARE;

function relativeDamperLoss(restrictionPct: number) {
  const reference = physicsCalibration.referenceDamperRestrictionPct / 100;
  const restriction = clamp(restrictionPct / 100, 0, 1);
  return 0.18 + 0.82 * (restriction / Math.max(reference, 0.05)) ** 2;
}

/**
 * Physics-based causal training kernel for a representative natural-draft heater.
 *
 * Training boundary:
 * - Fuel-valve % is an operator command, not calibrated fuel mass flow.
 * - Air-register % is geometry command, not measured air flow.
 * - Stack-damper % is restriction command: 0 = most open, 100 = most closed.
 * - Absolute stack temperature, stack height, fuel AFR and the reference draft/O2 point are
 *   transparent calibration assumptions, not site design data or operating limits.
 * - The solver teaches causal direction and coupling. It is not CFD, a burner guarantee,
 *   a heater heat balance, an emissions model, a BMS logic solver or an operating procedure.
 *
 * Causal loop solved iteratively:
 * arch pressure -> burner air -> lambda -> flue-gas flow / temperature -> chimney pull +
 * pressure losses -> new arch pressure -> repeat until stable.
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

  const fuelFlowRel = relativeFuelFlow(fuel);
  const heatInputRel = fuelFlowRel;
  const registerAreaRel = relativeRegisterArea(air);
  const afrStoich = physicsCalibration.representativeStoichAirFuelMassRatio;
  const referenceLambda = physicsCalibration.referenceLambda;

  let archPressure = physicsCalibration.referenceArchPressureMmH2O;
  let actualAirRel = referenceLambda;
  let flueGasFlowRel = 1;
  let stackTemperatureC = physicsCalibration.referenceStackTemperatureC;
  let chimneyPull = referenceChimneyPull;
  let pressureLoss = referenceTotalLoss;
  let iterations = 0;
  let converged = false;

  for (let index = 0; index < MAX_ITERATIONS; index += 1) {
    iterations = index + 1;

    // Arch pressure is not identical to burner-floor suction. A representative burner-floor
    // head remains even when the arch approaches zero; the arch draft modifies that head.
    const draftPull = Math.max(0, -archPressure);
    const burnerPressureRatio = clamp(
      0.78 + 0.22 * (draftPull / Math.max(-physicsCalibration.referenceArchPressureMmH2O, 0.2)),
      0.30,
      1.60,
    );

    actualAirRel = referenceLambda * registerAreaRel * Math.sqrt(burnerPressureRatio);

    // Mass-flow relation normalized to the balanced calibration point. Air dominates the mass.
    flueGasFlowRel = clamp(
      (fuelFlowRel + afrStoich * actualAirRel) / (1 + afrStoich * referenceLambda),
      0.08,
      2.4,
    );

    // Representative stack-temperature response: higher heat input raises temperature while
    // higher gas throughput dilutes the temperature rise. Exponent is deliberately mild.
    const temperatureRatio = (heatInputRel / Math.max(flueGasFlowRel, 0.25)) ** 0.22;
    stackTemperatureC = clamp(
      physicsCalibration.ambientTemperatureC
        + (physicsCalibration.referenceStackTemperatureC - physicsCalibration.ambientTemperatureC) * temperatureRatio,
      135,
      380,
    );

    chimneyPull = chimneyPullMmH2O(stackTemperatureC, physicsCalibration.ambientTemperatureC);

    const damperLossFactor = relativeDamperLoss(damperRestriction);
    pressureLoss = (referenceHeaterLoss + referenceDamperLoss * damperLossFactor) * flueGasFlowRel ** 2;

    const newArchPressure = clamp(pressureLoss - chimneyPull, -15, 8);
    if (Math.abs(newArchPressure - archPressure) <= CONVERGENCE_MM_H2O) {
      archPressure = newArchPressure;
      converged = true;
      break;
    }

    // Relaxation prevents the teaching solver from oscillating near strong damper restrictions.
    archPressure = 0.65 * archPressure + 0.35 * newArchPressure;
  }

  const lambda = clamp(actualAirRel / Math.max(fuelFlowRel, 0.05), 0.45, 2.0);
  const excessAirPct = Math.max(0, (lambda - 1) * 100);
  const radiantOxygenPct = methaneLikeDryOxygenPct(lambda);

  // CO is intentionally a tendency curve, not an emissions prediction. It remains low with
  // adequate air and rises steeply as lambda approaches / falls below the practical rich region.
  const richDeficit = Math.max(0, 1.08 - lambda);
  const co = Math.round(clamp(20 + 12000 * richDeficit ** 2, 15, 900));

  // Downstream leakage / tramp air raises stack O2 without improving burner-zone combustion.
  const draftPullRatio = Math.max(0.05, -archPressure) / Math.max(-physicsCalibration.referenceArchPressureMmH2O, 0.2);
  const trampAirFraction = archPressure < 0
    ? physicsCalibration.referenceTrampAirFractionOfFlue * Math.sqrt(draftPullRatio)
    : 0;
  const stackOxygenPct = clamp(
    (radiantOxygenPct * flueGasFlowRel + 20.9 * trampAirFraction) / Math.max(flueGasFlowRel + trampAirFraction, 0.05),
    0,
    12,
  );

  let state: CombustionTrainingState;
  if (archPressure >= 0 || archPressure < -7.5) state = 'draft-concern';
  else if (lambda < 0.90 || co >= 350) state = 'fuel-rich';
  else if (lambda < 1.05 || co >= 100) state = 'air-starved';
  else if (lambda > 1.32 || radiantOxygenPct > 5.0) state = 'excess-air';
  else state = 'balanced';

  const stateLabel = state === 'draft-concern'
    ? archPressure >= 0 ? 'Draft Concern · Positive Pressure Tendency' : 'Draft Concern · Excess Negative Draft'
    : state === 'fuel-rich'
      ? 'Fuel-Rich Tendency'
      : state === 'air-starved'
        ? 'Air-Starved Tendency'
        : state === 'excess-air'
          ? 'Excess-Air Tendency'
          : 'Balanced Physics Zone';

  const stateNote = state === 'draft-concern'
    ? archPressure >= 0
      ? 'The solved arch pressure has reached zero or positive because gas-path resistance is too high for the available chimney pull. Burner air admission and hot-gas containment margin deteriorate.'
      : 'The solved arch pressure is deliberately more negative than the representative training band. Strong suction can increase leakage-air influence and unnecessary gas throughput.'
    : state === 'fuel-rich'
      ? 'Fuel flow exceeds the combustion air supported by the register / draft combination. Lambda collapses, radiant O2 approaches zero and the CO tendency rises sharply.'
      : state === 'air-starved'
        ? 'Combustion air is becoming insufficient relative to fuel demand. Radiant O2 falls and the nonlinear CO tendency begins to rise.'
        : state === 'excess-air'
          ? 'Actual combustion air is high relative to stoichiometric demand. Radiant O2 and flue-gas mass flow rise, increasing sensible heat carried toward the stack.'
          : 'Fuel flow, combustion-air admission, stack resistance and chimney pull have converged around the representative calibration point.';

  const oxygenLabel = radiantOxygenPct < 2.0 ? 'LOW' : radiantOxygenPct <= 4.5 ? 'REPRESENTATIVE BAND' : 'HIGH';
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
  const firing01 = clamp(heatInputRel / 1.9, 0, 1);
  const completeCombustion = clamp(Math.min(fuelFlowRel, actualAirRel), 0.05, 1.55);
  const normalizedAirFlow = clamp(actualAirRel / 1.65, 0, 1);

  return {
    fuelValvePct: fuel,
    airRegisterPct: air,
    damperRestrictionPct: damperRestriction,
    damperOpeningPct: damperOpening,
    fuelFlowPctRef: Number((fuelFlowRel * 100).toFixed(0)),
    heatInputPctRef: Number((heatInputRel * 100).toFixed(0)),
    actualAirPctStoich: Number((lambda * 100).toFixed(0)),
    excessAirPct: Number(excessAirPct.toFixed(0)),
    lambda: Number(lambda.toFixed(2)),
    draftMmH2O: Number(archPressure.toFixed(1)),
    radiantOxygenPct: Number(radiantOxygenPct.toFixed(1)),
    stackOxygenPct: Number(stackOxygenPct.toFixed(1)),
    oxygenPct: Number(radiantOxygenPct.toFixed(1)),
    coPpm: co,
    stackTemperatureC: Number(stackTemperatureC.toFixed(0)),
    flueGasFlowPctRef: Number((flueGasFlowRel * 100).toFixed(0)),
    chimneyPullMmH2O: Number(chimneyPull.toFixed(1)),
    pressureLossMmH2O: Number(pressureLoss.toFixed(1)),
    trampAirPctFlue: Number((trampAirFraction * 100).toFixed(1)),
    converged,
    iterations,
    airFuelIndex: Number((lambda / referenceLambda).toFixed(2)),
    state,
    stateLabel,
    stateNote,
    oxygenLabel,
    coLabel,
    flameLabel,
    flameHeightScale: clamp((0.62 + firing01 * 0.96) * (fuelRich ? 1.20 : airStarved ? 1.10 : excessAir ? 0.94 : draftConcern ? 1.05 : 1), 0.30, 1.62),
    flameWidthScale: clamp((0.76 + firing01 * 0.42) * (fuelRich ? 1.28 : airStarved ? 1.18 : excessAir ? 0.92 : draftConcern ? 1.10 : 1), 0.42, 1.48),
    flameWobbleRad: fuelRich ? 0.15 : airStarved ? 0.10 : draftConcern ? 0.11 : excessAir ? 0.035 : 0.018,
    airParticleSpeed: lerp(0.40, 1.58, normalizedAirFlow),
    fuelParticleSpeed: lerp(0.25, 1.58, firing01),
    hotParticleSpeed: lerp(0.32, 1.45, clamp(flueGasFlowRel / 1.45, 0, 1)),
    airParticleScale: lerp(0.50, 1.22, normalizedAirFlow),
    fuelParticleScale: lerp(0.42, 1.24, firing01),
    hotParticleScale: lerp(0.48, 1.20, clamp(completeCombustion / 1.15, 0, 1)),
    hotProductStrength: clamp(completeCombustion / 1.05, 0.10, 1.25),
  };
}

export const combustionTrainingPresets = {
  balanced: { label: 'Balanced', fuel: 55, air: 60, damperRestriction: 50 },
  airStarved: { label: 'Air-Starved', fuel: 58, air: 45, damperRestriction: 50 },
  fuelRich: { label: 'Fuel-Rich', fuel: 72, air: 45, damperRestriction: 55 },
  excessAir: { label: 'Excess Air', fuel: 45, air: 66, damperRestriction: 35 },
  draftConcern: { label: 'Draft Concern', fuel: 55, air: 60, damperRestriction: 90 },
  // Retained as a non-UI compatibility preset for earlier code paths.
  higherFiring: { label: 'Higher Firing', fuel: 70, air: 90, damperRestriction: 25 },
} as const;
