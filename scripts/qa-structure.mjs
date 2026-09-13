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
requireText('src/Heater3D.tsx', 'semanticExplodeOffsets', 'Semantic burner explode support');
requireText('src/Heater3D.tsx', "burnerStudyMode === 'exploded'", 'Burner exploded mode');
requireText('src/Heater3D.tsx', 'createDraftInstrumentation3D', 'Draft instrumentation runtime');
requireText('src/Heater3D.tsx', 'heroFuelPath', 'Fuel-path visualization');
requireText('src/BurnerPage.tsx', 'Burner Exploded', 'Burner exploded study tab');
requireText('src/BurnerPage.tsx', 'Pilot & Ignition', 'Pilot study tab');

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
for (const note of notes) console.log(` - maintenance: ${note}`);
