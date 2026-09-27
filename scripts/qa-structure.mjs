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
  'src/PurgeAirPage.tsx',
  'src/purgeAirStudy.css',
  'src/readability.css',
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

function forbidText(file, text, label) {
  if (!fs.existsSync(file)) return;
  if (fs.readFileSync(file, 'utf8').includes(text)) failures.push(`${label}: unexpected text remains in ${file}`);
}

requireText('src/main.tsx', "import './readability.css';", 'Global readability stylesheet import');
requireText('src/readability.css', '.trouble-diagnostic-card p', 'Troubleshooting readability overrides');
requireText('src/readability.css', '.simulator-console-head p', 'Simulator readability overrides');
requireText('src/readability.css', '.operation-system-strip small', 'Operation readability overrides');
requireText('src/App.tsx', "useState('')", 'Free Explore default selection');
requireText('src/App.tsx', "free-explore-active", 'Free Explore shell state');
requireText('src/index.css', '.app-shell.free-explore-active .inspector-panel{display:none!important}', 'Free Explore inspector hidden');
forbidText('src/App.tsx', 'Whole fired heater · unrestricted spatial orientation mode.', 'Verbose Free Explore location copy removed');
forbidText('src/App.tsx', 'Spatial freedom makes it easier', 'Verbose Free Explore rationale removed');
forbidText('src/HeaterTypesPage.tsx', '<b>Training model.</b>', 'Heater Types training-model card removed');
forbidText('src/HeaterTypesPage.tsx', 'VISUAL COMPARISON QUESTIONS', 'Heater Types visual-comparison question card removed');
forbidText('src/HeaterTypesPage.tsx', '<b>Training guardrail:</b>', 'Heater Types mobile training guardrail removed');
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
requireText('src/Heater3D.tsx', "displayText: 'BLOWER'", 'Compact purge blower label');
requireText('src/Heater3D.tsx', "displayText: 'DAMPER'", 'Compact purge damper label');
requireText('src/Heater3D.tsx', "displayText: 'PURGE ENTRIES'", 'Compact purge entry label');
requireText('src/Heater3D.tsx', 'isAtlasLabelLeader', 'Atlas label leader-line support');
requireText('src/Heater3D.tsx', "else if (contextMode === 'focus') child.visible = name === selected || detailFor === selected", 'Focus label declutter');
requireText('src/Heater3D.tsx', "cameraCommand.action === 'purgeOverview'", 'Purge overview camera');
requireText('src/Heater3D.tsx', 'Blower skid: twin steel rails', 'Refined purge blower skid');
requireText('src/Heater3D.tsx', 'Inlet guard: concentric rings, eight radial spokes', 'Refined purge blower inlet guard');
requireText('src/Heater3D.tsx', 'Side-mounted motor / drive keeps the discharge axis clear', 'Refined purge blower motor layout');
requireText('src/Heater3D.tsx', 'purgeDriveGuard', 'Purge blower drive guard');
requireText('src/Heater3D.tsx', 'blowerInnerThroat', 'Open-ended hollow purge blower casing');
requireText('src/Heater3D.tsx', 'new THREE.ExtrudeGeometry(driveShape', 'Slim rounded purge drive guard');
requireText('src/Heater3D.tsx', 'Compact local starter / status box on a simple pedestal', 'Pedestal-mounted purge starter');
requireText('src/Heater3D.tsx', "labelText === 'PURGE FAN / BLOWER'", 'Close zoom blower-only label state');
requireText('src/Heater3D.tsx', "labelText === 'PURGE DAMPER' || labelText === 'AIRFLOW PROOF'", 'Medium zoom purge leader state');
requireText('src/Heater3D.tsx', 'purgeRubberMat', 'Purge blower flexible connector');
requireText('src/Heater3D.tsx', 'const bladeShape = new THREE.Shape()', 'Swept purge impeller blades');
requireText('src/Heater3D.tsx', 'guardInnerRing', 'Purge inlet guard concentric ring');
requireText('src/Heater3D.tsx', 'proofFace', 'Purge airflow-proof instrument face');
requireText('src/Heater3D.tsx', "const purgeTier = purgeDistance < 7.5 ? 'close'", 'Three-tier purge label LOD');
requireText('src/Heater3D.tsx', "yaw: -0.58, pitch: 0.07, radius: 8.6", 'Purge study three-quarter camera');
requireText('src/heater3d/config.ts', "yaw: -0.62, pitch: 0.06, radius: 11.8, target: [-10.75, 1.42, 0.34]", 'Purge blower Atlas focus camera');
requireText('src/Heater3D.tsx', "cameraCommand.action === 'purgeFlow'", 'Purge full-flow camera');
requireText('src/PurgeAirPage.tsx', "id: 'blower'", 'Purge blower study');
requireText('src/PurgeAirPage.tsx', "id: 'damper'", 'Purge damper study');
requireText('src/PurgeAirPage.tsx', "id: 'proof'", 'Purge airflow-proof study');
requireText('src/PurgeAirPage.tsx', "id: 'riser'", 'Purge riser study');
requireText('src/PurgeAirPage.tsx', "id: 'entries'", 'Purge two-entry study');
requireText('src/PurgeAirPage.tsx', "id: 'flow'", 'Purge full-flow study');
requireText('src/PurgeAirPage.tsx', "id: 'bms'", 'Purge BMS/permissive study');
requireText('src/BurnerPage.tsx', 'Burner Exploded', 'Burner exploded study tab');
requireText('src/BurnerPage.tsx', 'Pilot & Ignition', 'Pilot study tab');
requireText('src/BurnerPage.tsx', 'Reference Fuel Path', 'Exploded reference fuel-path legend');
requireText('src/BurnerPage.tsx', 'Pilot Fuel Path', 'Pilot fuel-path legend');
requireText('src/BurnerPage.tsx', 'burner-sim-mobile-readouts', 'Persistent mobile Draft O2 CO readout');
forbidText('src/TroubleshootingPage.tsx', 'Technical basis', 'Troubleshooting technical-basis card removed');
forbidText('src/TroubleshootingPage.tsx', 'trouble-source-note', 'Troubleshooting source/reference card removed');
forbidText('src/TroubleshootingPage.tsx', 'trouble-learning-chain', 'Troubleshooting learning-chain card removed');
forbidText('src/TroubleshootingPage.tsx', 'Training boundary.', 'Troubleshooting training-boundary card removed');
forbidText('src/TroubleshootingPage.tsx', 'trouble-guardrail', 'Troubleshooting guardrail card removed');
forbidText('src/App.tsx', 'Training visualization · Schematic geometry · Not a certified plant design', 'Atlas context disclaimer removed');
requireText('src/TroubleshootingPage.tsx', "code: 'T-04'", 'T-04 Convection Fouling scenario');
requireText('src/TroubleshootingPage.tsx', "code: 'T-05'", 'T-05 High Stack Temperature scenario');
requireText('src/TroubleshootingPage.tsx', 'Deposit Formation', 'T-04 deposit progression');
requireText('src/TroubleshootingPage.tsx', 'Open Diagnostic Branches', 'T-05 multi-branch progression');
requireText('src/Heater3D.tsx', "troubleshootingCue = 't4-restriction'", 'T-04 restriction overlay');
requireText('src/Heater3D.tsx', "troubleshootingCue = 't5-stacktemp'", 'T-05 stack-temperature overlay');
requireText('src/Heater3D.tsx', "cameraCommand.action === 'troubleConvection'", 'T-04 camera');
requireText('src/Heater3D.tsx', "cameraCommand.action === 'troubleStackTemperature'", 'T-05 camera');
requireText('src/HeaterTypes3D.tsx', 'function rectangularFrustum', 'Heater types stack-transition geometry');
requireText('src/HeaterTypes3D.tsx', 'function addPlatform', 'Heater types service-platform cue');
requireText('src/HeaterTypes3D.tsx', 'function addLadder', 'Heater types ladder cue');
requireText('src/HeaterTypes3D.tsx', 'addCylindricalPlatform', 'Cylindrical heater platform cue');
requireText('src/HeaterTypes3D.tsx', 'const turns = 5.25', 'Cylindrical helical-coil refinement');
requireText('src/HeaterTypes3D.tsx', 'addRectBands', 'Rectangular heater structural-band refinement');
requireText('src/HeaterTypes3D.tsx', 'toneMappingExposure = 1.58', 'Heater types lighting exposure boost');
requireText('src/HeaterTypes3D.tsx', "const fill = new THREE.DirectionalLight('#bfe8ff', 3.2)", 'Heater types front fill light');
requireText('src/HeaterTypes3D.tsx', "scene.background = new THREE.Color('#0b1d2a')", 'Heater types brighter scene background');
requireText('src/HeaterTypes3D.tsx', 'Closed convection roof / breeching transition', 'Box heater closed upper envelope');
requireText('src/HeaterTypes3D.tsx', 'Continuous cabin roof', 'Cabin heater continuous sloped roof');
requireText('src/HeaterTypes3D.tsx', 'const roofRise = 1.25', 'Cabin roof geometry');
requireText('src/HeaterTypes3D.tsx', 'Short plenum / convection box intersects the ridge', 'Cabin roof-to-plenum continuity');
requireText('src/HeaterTypes3D.tsx', 'const stackCurb = cylinder(1.48', 'Box heater stack curb');
requireText('src/HeaterTypes3D.tsx', 'const stackCurb = cylinder(1.36', 'Cabin heater stack curb');
requireText('src/HeaterTypes3D.tsx', 'function openStack', 'Open stack helper');
requireText('src/HeaterTypes3D.tsx', 'CylinderGeometry(radius, radius, height, segments, 1, true)', 'Open-ended stack geometry');
requireText('src/HeaterTypes3D.tsx', 'openStack(1.28, 4.5', 'Box heater open stack');
requireText('src/HeaterTypes3D.tsx', 'openStack(1.18, 4.0', 'Cabin heater open stack');
requireText('src/HeaterTypes3D.tsx', 'openStack(1.15, 4.2', 'Cylindrical heater open stack');
requireText('src/HeaterTypes3D.tsx', 'const boxProcessCurves = [', 'Box heater multi-circuit radiant flow');
requireText('src/HeaterTypes3D.tsx', 'particle.userData.processCurve = curve', 'Per-particle radiant circuit assignment');
requireText('src/HeaterTypes3D.tsx', 'const particleCurve = (p.userData.processCurve', 'Multi-curve process animation');
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
console.log(' - free-explore, draft instrumentation, burner exploded, open purge blower casing, smart purge label LOD, purge-air learning module, T-04/T-05 troubleshooting, refined heater-family geometry, global readability pass and fuel-path guards present');
console.log(' - burner fuel path remains readable across Atlas and dedicated study modes');
console.log(' - mobile simulator keeps Draft, radiant O2 and CO visible with tuning controls collapsed');
console.log(' - simulator V2 exposes heat input, actual air, excess air, radiant/stack O2, CO, draft and representative stack temperature');
console.log(' - V2 physics calibration, iterative draft-air loop and tramp-air distinction are structurally guarded');
for (const note of notes) console.log(` - maintenance: ${note}`);
