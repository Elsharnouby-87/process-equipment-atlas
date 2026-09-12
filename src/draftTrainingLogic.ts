export type DraftTrainingState = 'positive' | 'target' | 'excess';

export type DraftTrainingMetrics = {
  damperRestriction: number;
  damperOpening: number;
  draftMmH2O: number;
  oxygenPct: number;
  coPpm: number;
  state: DraftTrainingState;
  stateLabel: string;
  stateNote: string;
  oxygenLabel: string;
  coLabel: string;
  noxLabel: string;
  soxLabel: string;
  bladeAngleDeg: number;
  blueParticleOpacity: number;
  oxygenParticleFraction: number;
  flowSpeedScale: number;
  flowStretchScale: number;
  flowCongestion: number;
  leakIntensity: number;
};

type Anchor = { position: number; draft: number; oxygen: number; co: number };

// position = stack-damper restriction: 0 = most open, 100 = most closed.
// Values are representative training anchors selected to teach direction/coupling only.
const anchors: Anchor[] = [
  { position: 0, draft: -10.5, oxygen: 5.6, co: 18 },
  { position: 25, draft: -6.6, oxygen: 4.8, co: 20 },
  { position: 50, draft: -3.2, oxygen: 3.5, co: 25 },
  { position: 70, draft: -1.2, oxygen: 2.7, co: 45 },
  { position: 85, draft: 1.4, oxygen: 1.9, co: 130 },
  { position: 100, draft: 5.5, oxygen: 1.2, co: 320 },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function interpolate(position: number) {
  const p = clamp(position, 0, 100);
  for (let i = 0; i < anchors.length - 1; i += 1) {
    const a = anchors[i];
    const b = anchors[i + 1];
    if (p <= b.position) {
      const t = (p - a.position) / (b.position - a.position);
      return {
        draft: lerp(a.draft, b.draft, t),
        oxygen: lerp(a.oxygen, b.oxygen, t),
        co: lerp(a.co, b.co, t),
      };
    }
  }
  const last = anchors[anchors.length - 1];
  return { draft: last.draft, oxygen: last.oxygen, co: last.co };
}

export function getDraftTrainingMetrics(damperRestriction: number): DraftTrainingMetrics {
  const restriction = clamp(damperRestriction, 0, 100);
  const opening = 100 - restriction;
  const opening01 = opening / 100;
  const values = interpolate(restriction);
  const draft = Number(values.draft.toFixed(1));
  const oxygen = Number(values.oxygen.toFixed(1));
  const co = Math.round(values.co);

  const state: DraftTrainingState = draft >= 0 ? 'positive' : draft < -5.5 ? 'excess' : 'target';
  const stateLabel = state === 'positive'
    ? 'Positive Pressure Concern'
    : state === 'excess'
      ? 'Excess Negative Draft'
      : 'Near-Target Slight Negative Draft';
  const stateNote = state === 'positive'
    ? 'Representative low-draft / positive-pressure concern: exhaust-path evacuation is restricted and hot-gas containment margin is reduced.'
    : state === 'excess'
      ? 'Representative high-draft condition: stronger stack pull can increase leakage-air influence and efficiency loss.'
      : 'Representative stable natural-draft training zone. Actual target remains heater- and site-specific.';

  const oxygenLabel = oxygen < 3 ? 'LOW TENDENCY' : oxygen <= 4.2 ? 'REPRESENTATIVE TARGET BAND' : 'HIGH TENDENCY';
  const coLabel = co >= 100 ? 'ELEVATED TRAINING CUE' : co >= 50 ? 'RISING TRAINING CUE' : 'LOW TRAINING CUE';
  const noxLabel = state === 'excess'
    ? 'QUALITATIVE · O₂ / flame-temperature dependent'
    : state === 'positive'
      ? 'QUALITATIVE · combustion-state dependent'
      : 'QUALITATIVE · firing / temperature dependent';
  const soxLabel = 'FUEL-SULFUR DEPENDENT · ~steady vs damper';

  // This is the exact geometric mapping used by the 3D damper blade.
  const bladeAngleRad = 1.38 - (restriction / 100) * 1.20;
  const bladeAngleDeg = Number((bladeAngleRad * 180 / Math.PI).toFixed(0));

  // Visual-dynamics helpers. They describe qualitative evacuation tendency, not CFD velocity or mass flow.
  const flowCongestion = clamp((restriction - 48) / 52, 0, 1);
  const leakIntensity = clamp((draft + 0.25) / 5.75, 0, 1);

  return {
    damperRestriction: restriction,
    damperOpening: opening,
    draftMmH2O: draft,
    oxygenPct: oxygen,
    coPpm: co,
    state,
    stateLabel,
    stateNote,
    oxygenLabel,
    coLabel,
    noxLabel,
    soxLabel,
    bladeAngleDeg,
    blueParticleOpacity: clamp(0.28 + (oxygen - 1.2) / 6.0, 0.26, 0.94),
    oxygenParticleFraction: clamp(0.28 + (oxygen - 1.2) / 5.5, 0.25, 1),
    flowSpeedScale: lerp(0.42, 1.42, opening01),
    flowStretchScale: lerp(0.72, 1.38, opening01),
    flowCongestion,
    leakIntensity,
  };
}

export const draftTrainingPresets = {
  excess: { label: 'Excess Negative Draft', damperRestriction: 10 },
  target: { label: 'Near-Target Draft', damperRestriction: 50 },
  positive: { label: 'Positive Pressure Concern', damperRestriction: 90 },
} as const;
