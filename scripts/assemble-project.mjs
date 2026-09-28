import fs from 'node:fs';

const HEATER_PARTS = [
  'src/_migration/Heater3D.part0.txt',
  'src/_migration/Heater3D.part1.txt',
  'src/_migration/Heater3D.part2.txt',
  'src/_migration/Heater3D.part3.txt',
  'src/_migration/Heater3D.part4.txt',
];

const PATCH_STAGES = [
  './assemble-preview.mjs',
  './assemble-burner-sim.mjs',
  './free-explore-patch.mjs',
  './burner-camera-geometry-refinement.mjs',
  './fuel-visibility-clearance-refinement.mjs',
  './restore-burner-exploded.mjs',
  './burner-fuel-path-continuity.mjs',
  './burner-fuel-path-mode-consistency.mjs',
  './integrated-combustion-draft-simulator-v1.mjs',
  './simulator-live-readout.mjs',
  './physics-simulator-v2-ui.mjs',
  './navigation-architecture-cleanup.mjs',
  './typescript-cleanup.mjs',
];

const OUTPUT_FILE = 'src/Heater3D.tsx';

function assertFilesExist(paths, label) {
  const missing = paths.filter(path => !fs.existsSync(path));
  if (missing.length) {
    throw new Error(`${label}: missing ${missing.join(', ')}`);
  }
}

assertFilesExist(HEATER_PARTS, 'Heater3D source');
assertFilesExist(PATCH_STAGES.map(stage => `scripts/${stage.replace('./', '')}`), 'Assembly patch stage');

const assembled = HEATER_PARTS.map(file => fs.readFileSync(file, 'utf8')).join('');
fs.writeFileSync(OUTPUT_FILE, assembled);
console.log(`[assemble] ${OUTPUT_FILE} rebuilt from ${HEATER_PARTS.length} migration parts.`);

for (const stage of PATCH_STAGES) {
  console.log(`[assemble] ${stage}`);
  await import(stage);
}

console.log(`[assemble] Complete: ${PATCH_STAGES.length} ordered refinement stages applied.`);
