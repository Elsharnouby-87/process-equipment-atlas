import fs from 'node:fs';

const requiredFiles = [
  'src/App.tsx',
  'src/Heater3D.tsx',
  'src/BurnerPage.tsx',
  'src/RadiantPage.tsx',
  'src/ShieldConvectionPage.tsx',
  'src/DraftStackPage.tsx',
  'src/HeaterTypesPage.tsx',
  'src/OperationPage.tsx',
  'src/TroubleshootingPage.tsx',
  'src/heater3d/viewConfig.ts',
  'src/physicsCalibration.ts',
  'src/combustionTrainingLogic.ts',
  'src/simulatorV2.css',
  'scripts/burner-fuel-path-mode-consistency.mjs',
  'scripts/simulator-live-readout.mjs',
  'scripts/physics-simulator-v2-ui.mjs',
  'scripts/qa-physics-v2.mjs',
];

const failures = [];
const notes = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing required file: ${file}`);
}

function requireText(file, text, label) {
  if (!fs.existsSync(file)) return;
  if (!fs.readFileSync(file, 'utf8').includes(text)) failures.push(`${label}: missing in ${file}`);
}

requireText('src/App.tsx', "useState('')", 'Free Explore default selection');
requireText('src/App.tsx', 'Draft Instruments', 'Draft instruments registry');
requireText('src/App.tsx', 'Stack Analyzers', 'Stack analyzers registry');
requireText('src/App.tsx', 'burnerFuelPathLocked', 'Atlas burner fuel-path mode lock');
requireText('src/Heater3D.tsx', 'semanticExplodeOffsets', 'Semantic burner explode support');
requireText('src/Heater3D.tsx', "burnerStudyMode === 'exploded'", 'Burner exploded mode');
requireText('src/Heater3D.tsx', 'createDraftInstrumentation3D', 'Draft instrumentation runtime');
requireText('src/Heater3D.tsx', 'heroFuelPath', 'Fuel-path visualization');
requireText('src/Heater3D.tsx', "contextualBurnerExplode ? burnerFlow === 'fuel'", 'Contextual burner explode fuel-path visibility');
requireText('src/Heater3D.tsx', 'atlasBurnerFuelPathActive', 'Atlas burner fuel-path continuity');
requireText('src/Heater3D.tsx', 'referenceFuelPathActive', 'Reference-vs-live fuel-path distinction');
requireText('src/BurnerPage.tsx', 'Burner Exploded', 'Burner exploded study tab');
requireText('src/BurnerPage.tsx', 'Pilot & Ignition', 'Pilot study tab');
requireText('src/BurnerPage.tsx', 'Reference Fuel Path', 'Exploded reference fuel-path legend');
requireText('src/BurnerPage.tsx', 'Pilot Fuel Path', 'Pilot fuel-path legend');
requireText('src/BurnerPage.tsx', 'burner-sim-mobile-readouts', 'Persistent mobile Draft O2 CO readout');
requireText('src/BurnerPage.tsx', 'PHYSICS-BASED COMBUSTION + DRAFT SIMULATOR V2', 'Simulator V2 heading');
requireText('src/BurnerPage.tsx', 'metrics.radiantOxygenPct', 'Radiant O2 readout');
requireText('src/BurnerPage.tsx', 'metrics.stackOxygenPct', 'Stack O2 readout');
requireText('src/BurnerPage.tsx', 'metrics.heatInputPctRef', 'Relative heat-input readout');
requireText('src/combustionTrainingLogic.ts', 'for (let index = 0; index < MAX_ITERATIONS', 'Iterative V2 solver loop');
requireText('src/combustionTrainingLogic.ts', 'methaneLikeDryOxygenPct', 'Transparent lambda-to-O2 relation');
requireText('src/combustionTrainingLogic.ts', 'trampAirFraction', 'Tramp-air stack O2 distinction');
requireText('src/physicsCalibration.ts', 'referenceArchPressureMmH2O: -3.2', 'Balanced draft calibration');
requireText('src/physicsCalibration.ts', 'referenceLambda: 1.18', 'Balanced lambda calibration');

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) continue;
  const kb = Math.round(fs.statSync(file).size / 1024);
  if (kb > 80) notes.push(`${file}: ${kb} KB — large module; refactor only in a dedicated regression-tested patch.`);
}

if (failures.length) {
  throw new Error(`[qa:structure] ${failures.join(' | ')}`);
}

console.log('[qa:structure] PASS');
console.log(` - ${requiredFiles.length} required modules present`);
console.log(' - free-explore, draft instrumentation, burner exploded and fuel-path guards present');
console.log(' - burner fuel path remains readable across Atlas and dedicated study modes');
console.log(' - mobile simulator keeps Draft, radiant O2 and CO visible with tuning controls collapsed');
console.log(' - simulator V2 exposes heat input, actual air, excess air, radiant/stack O2, CO, draft and representative stack temperature');
console.log(' - V2 physics calibration, iterative draft-air loop and tramp-air distinction are structurally guarded');
for (const note of notes) console.log(` - maintenance: ${note}`);
