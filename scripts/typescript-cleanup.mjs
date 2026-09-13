import fs from 'node:fs';

function replaceOnce(source, before, after, label) {
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected one anchor, found ${count}`);
  return source.replace(before, after);
}

const heaterPath = 'src/Heater3D.tsx';
let heater = fs.readFileSync(heaterPath, 'utf8');
heater = replaceOnce(
  heater,
  "    const highlight = new THREE.Box3Helper(new THREE.Box3(), new THREE.Color('#ff9a3d'));\n    highlight.material.transparent = true;\n    highlight.material.opacity = 0.12;\n    highlight.material.depthTest = false;",
  "    const highlight = new THREE.Box3Helper(new THREE.Box3(), new THREE.Color('#ff9a3d'));\n    const highlightMaterial = highlight.material as THREE.LineBasicMaterial;\n    highlightMaterial.transparent = true;\n    highlightMaterial.opacity = 0.12;\n    highlightMaterial.depthTest = false;",
  'Box3Helper material typing'
);
heater = replaceOnce(
  heater,
  "        highlight.material.opacity = highlight.visible ? 0.32 : 0.12;",
  "        (highlight.material as THREE.LineBasicMaterial).opacity = highlight.visible ? 0.32 : 0.12;",
  'Box3Helper opacity typing'
);
fs.writeFileSync(heaterPath, heater);

const draftPath = 'src/DraftStackPage.tsx';
let draft = fs.readFileSync(draftPath, 'utf8');
draft = replaceOnce(
  draft,
  'Rotate3D, ScanLine, ShieldAlert',
  'Rotate3D, ShieldAlert',
  'unused DraftStack icon import'
);
fs.writeFileSync(draftPath, draft);
