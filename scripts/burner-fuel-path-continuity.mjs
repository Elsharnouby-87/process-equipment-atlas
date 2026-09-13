import fs from 'node:fs';

function replaceOnce(source, before, after, label) {
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly one anchor, found ${count}`);
  return source.replace(before, after);
}

// CHECKPOINT 17 — keep the installed fuel-path teaching cue readable across
// all Burner study views. In the exploded study this is a path reference, not
// an operating-state claim: the assembly is intentionally shown separated.
const heaterPath = 'src/Heater3D.tsx';
let source = fs.readFileSync(heaterPath, 'utf8');

source = replaceOnce(
  source,
  "      flowRef.current.visible = flow && !explode;",
  "      flowRef.current.visible = flow && (!explode || contextualBurnerExplode);",
  'allow fuel-path overlay in contextual burner explode'
);

source = replaceOnce(
  source,
  "        } else if (burnerFlow) child.visible = Boolean(burnerStudyMode) && burnerStudyMode !== 'exploded' && (burnerStudyMode !== 'pilot' || burnerFlow === 'fuel');",
  "        } else if (burnerFlow) child.visible = contextualBurnerExplode ? burnerFlow === 'fuel' : Boolean(burnerStudyMode) && ((burnerStudyMode === 'external' || burnerStudyMode === 'internal') || burnerFlow === 'fuel');",
  'burner fuel visibility across study views'
);

source = replaceOnce(
  source,
  "      for (const p of burnerHotParticles) {\n        const hotSpeed = activeBurnerControl ? combustionTrainingMetrics.hotParticleSpeed : 1;",
  `      if (activeBurnerStudy === 'exploded') {\n        for (const p of burnerFuelParticles) {\n          const fuelSpeed = activeBurnerControl ? combustionTrainingMetrics.fuelParticleSpeed : 1;\n          const u = (p.userData.t + t * 0.062 * fuelSpeed) % 1;\n          const point = heroFuelPath.getPoint(THREE.MathUtils.clamp(u, 0, 0.9999));\n          p.position.copy(point).add(new THREE.Vector3(0.20, 0.10, 0.18));\n          p.visible = true;\n          p.scale.setScalar(0.92 + Math.sin(t * 6.0 + (p.userData.t as number) * Math.PI * 2) * 0.10);\n        }\n        for (const p of burnerFuelGlowParticles) {\n          const u = (p.userData.t + t * 0.062) % 1;\n          const point = heroFuelPath.getPoint(THREE.MathUtils.clamp(u, 0, 0.9999));\n          p.position.copy(point).add(new THREE.Vector3(0.20, 0.10, 0.18));\n          p.visible = true;\n          p.scale.setScalar(0.96 + Math.sin(t * 5.4 + (p.userData.t as number) * Math.PI * 2) * 0.10);\n        }\n      }\n      for (const p of burnerHotParticles) {\n        const hotSpeed = activeBurnerControl ? combustionTrainingMetrics.hotParticleSpeed : 1;`,
  'exploded installed fuel-path tracer'
);

fs.writeFileSync(heaterPath, source);

const burnerPath = 'src/BurnerPage.tsx';
let burnerPage = fs.readFileSync(burnerPath, 'utf8');
burnerPage = replaceOnce(
  burnerPage,
  "          {(controlActive || (flow && study !== 'exploded')) && <div className=\"burner-flow-legend\"><span className=\"air\">Combustion Air</span><span className=\"fuel\">Fuel Gas</span>{study !== 'pilot' && <span className=\"hot\">Hot Products</span>}</div>}",
  "          {(controlActive || flow) && <div className=\"burner-flow-legend\">{(study === 'external' || study === 'internal') && <span className=\"air\">Combustion Air</span>}<span className=\"fuel\">{study === 'exploded' ? 'Fuel Path' : 'Fuel Gas'}</span>{(study === 'external' || study === 'internal') && <span className=\"hot\">Hot Products</span>}</div>}",
  'study-aware burner flow legend'
);
fs.writeFileSync(burnerPath, burnerPage);
