export type PhysicsCalibration = {
  referenceFuelValvePct: number;
  referenceAirRegisterPct: number;
  referenceDamperRestrictionPct: number;
  referenceArchPressureMmH2O: number;
  referenceLambda: number;
  referenceRadiantOxygenPct: number;
  referenceStackTemperatureC: number;
  ambientTemperatureC: number;
  representativeStackHeightM: number;
  representativeStoichAirFuelMassRatio: number;
  referenceTrampAirFractionOfFlue: number;
};

/**
 * Simulator V2 calibration sheet.
 *
 * These values define ONE representative natural-draft training operating point.
 * They are not a plant datasheet, burner guarantee, operating limit or universal target.
 *
 * Reference basis reviewed for the Atlas:
 * - John Zink / Hamworthy combustion references: stack damper primarily manages draft;
 *   burner air registers primarily manage combustion air / excess O2; both are coupled.
 * - Closing burner registers can reduce total gas flow / heater friction loss and make the
 *   arch pressure more negative even while combustion air and O2 fall.
 * - Closing the stack damper increases downstream restriction and moves the firebox pressure
 *   profile toward zero / positive pressure.
 * - Higher firing requires higher combustion-air demand and normally coordinated opening of
 *   air registers and the stack damper to preserve acceptable draft and O2.
 * - Tramp air can raise stack O2 without improving burner-zone combustion.
 *
 * The reference O2 mapping uses a methane-like dry-flue-gas relation solely as a transparent
 * training approximation. Refinery fuel-gas composition changes stoichiometric air demand,
 * heating value and the exact O2/excess-air relationship.
 */
export const physicsCalibration: PhysicsCalibration = {
  referenceFuelValvePct: 55,
  referenceAirRegisterPct: 60,
  referenceDamperRestrictionPct: 50,
  referenceArchPressureMmH2O: -3.2,
  referenceLambda: 1.18,
  referenceRadiantOxygenPct: 3.5,
  referenceStackTemperatureC: 230,
  ambientTemperatureC: 25,
  representativeStackHeightM: 24,
  representativeStoichAirFuelMassRatio: 17.2,
  referenceTrampAirFractionOfFlue: 0.015,
};

export const physicsModelBoundary = {
  label: 'Representative physics-based training model',
  note: 'Relative fuel flow, heat input, air flow, pressure loss, O2, CO and temperature responses are calibrated for causal teaching only. Site/OEM data, burner curves, fuel analysis and heater heat balance govern real operation.',
} as const;
