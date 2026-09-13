import fs from 'node:fs';

const heaterParts = [
  'src/_migration/Heater3D.part0.txt',
  'src/_migration/Heater3D.part1.txt',
  'src/_migration/Heater3D.part2.txt',
  'src/_migration/Heater3D.part3.txt',
  'src/_migration/Heater3D.part4.txt',
];

const patchStages = [
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
  './typescript-cleanup.mjs',
];

for (const file of heaterParts) {
  if (!fs.existsSync(file)) throw new Error(`Missing Heater3D source part: ${file}`);
}

const assembled = heaterParts.map(file => fs.readFileSync(file, 'utf8')).join('');
fs.writeFileSync('src/Heater3D.tsx', assembled);
console.log(`[assemble] Heater3D base rebuilt from ${heaterParts.length} migration parts.`);

for (const stage of patchStages) {
  console.log(`[assemble] ${stage}`);
  await import(stage);
}

console.log(`[assemble] Complete: ${patchStages.length} ordered refinement stages applied.`);
