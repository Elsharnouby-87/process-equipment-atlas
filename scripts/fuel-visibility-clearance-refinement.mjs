import fs from 'node:fs';

function replaceOnce(source, before, after, label) {
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly one anchor, found ${count}`);
  return source.replace(before, after);
}

function replaceRegex(source, pattern, replacement, label) {
  if (!pattern.test(source)) throw new Error(`${label}: anchor not found`);
  pattern.lastIndex = 0;
  return source.replace(pattern, replacement);
}

const heaterPath = 'src/Heater3D.tsx';
let source = fs.readFileSync(heaterPath, 'utf8');

// CHECKPOINT 14 — visible fuel tracer + conservative clearance polish.
// Keep the representative fuel route from checkpoint 12, but make it legible
// beside the pipe rather than visually buried inside it.
source = replaceOnce(
  source,
  "    const burnerFuelParticles: THREE.Mesh[] = [];\n    const burnerHotParticles: THREE.Mesh[] = [];",
  "    const burnerFuelParticles: THREE.Mesh[] = [];\n    const burnerFuelGlowParticles: THREE.Mesh[] = [];\n    const burnerHotParticles: THREE.Mesh[] = [];",
  'fuel glow particle array'
);

source = replaceRegex(
  source,
  /    const burnerFuelMat = new THREE\.MeshBasicMaterial\(\{[^\n]*\}\);/,
  "    const burnerFuelMat = new THREE.MeshBasicMaterial({ color: '#ffd24a', transparent: true, opacity: 1, depthWrite: false, depthTest: false });\n    const burnerFuelGlowMat = new THREE.MeshBasicMaterial({ color: '#fff2a3', transparent: true, opacity: 0.24, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending });",
  'fuel material visibility'
);

source = replaceRegex(
  source,
  /    for \(let i = 0; i < \d+; i \+= 1\) \{\n      const p = new THREE\.Mesh\(new THREE\.SphereGeometry\([^\n]+\), burnerFuelMat\);[\s\S]*?      burnerFuelParticles\.push\(p\);\n    \}/,
  `    for (let i = 0; i < 24; i += 1) {\n      const p = new THREE.Mesh(new THREE.SphereGeometry(0.085, 9, 8), burnerFuelMat);\n      p.userData.t = i / 24;\n      p.userData.burnerFlow = 'fuel';\n      p.renderOrder = 61;\n      flowGroup.add(p);\n      burnerFuelParticles.push(p);\n\n      const glow = new THREE.Mesh(new THREE.SphereGeometry(0.145, 9, 8), burnerFuelGlowMat);\n      glow.userData.t = i / 24;\n      glow.userData.burnerFlow = 'fuel';\n      glow.renderOrder = 60;\n      flowGroup.add(glow);\n      burnerFuelGlowParticles.push(glow);\n    }`,
  'fuel particle core + halo creation'
);

// Preserve the simulator's existing fuel-speed / fuel-demand loop. After it has
// run, override only the external/internal teaching-view position so the tracer
// sits just outside the visible pipe skin while following the same route.
source = replaceOnce(
  source,
  "      }\n      for (const p of burnerHotParticles) {",
  `      }\n      if (activeBurnerStudy === 'external' || activeBurnerStudy === 'internal') {\n        for (const p of burnerFuelParticles) {\n          const fuelSpeed = activeBurnerControl ? combustionTrainingMetrics.fuelParticleSpeed : 1;\n          const u = (p.userData.t + t * 0.075 * fuelSpeed) % 1;\n          const point = heroFuelPath.getPoint(THREE.MathUtils.clamp(u, 0, 0.9999));\n          const offset = activeBurnerStudy === 'internal'\n            ? new THREE.Vector3(0.18, 0.085, 0.17)\n            : new THREE.Vector3(0.16, 0.075, 0.15);\n          p.position.copy(point).add(offset);\n          if (activeBurnerControl) p.visible = fuelGasPositionRef.current > 2;\n          const pulse = 1 + Math.sin(t * 7.2 + (p.userData.t as number) * Math.PI * 2) * 0.16;\n          const commandScale = activeBurnerControl ? combustionTrainingMetrics.fuelParticleScale : 1;\n          p.scale.setScalar(commandScale * pulse);\n        }\n      }\n      for (const p of burnerFuelGlowParticles) {\n        const fuelSpeed = activeBurnerControl ? combustionTrainingMetrics.fuelParticleSpeed : 1;\n        const u = (p.userData.t + t * 0.075 * fuelSpeed) % 1;\n        if (activeBurnerControl) p.visible = fuelGasPositionRef.current > 2;\n        if (activeBurnerStudy === 'external' || activeBurnerStudy === 'internal') {\n          const point = heroFuelPath.getPoint(THREE.MathUtils.clamp(u, 0, 0.9999));\n          const offset = activeBurnerStudy === 'internal'\n            ? new THREE.Vector3(0.18, 0.085, 0.17)\n            : new THREE.Vector3(0.16, 0.075, 0.15);\n          p.position.copy(point).add(offset);\n          const glowPulse = 0.92 + (Math.sin(t * 6.4 + (p.userData.t as number) * Math.PI * 2) + 1) * 0.14;\n          const commandScale = activeBurnerControl ? combustionTrainingMetrics.fuelParticleScale : 1;\n          p.scale.setScalar(commandScale * glowPulse);\n        } else if (activeBurnerStudy === 'pilot') {\n          p.position.set(-1.4 + u * 1.4, 5.72 + u * 0.82, -1.35);\n        } else {\n          p.position.set(-2.3 + u * 2.3, 3.45 + u * 3.05, -1.35 + Math.sin(u * Math.PI) * 0.12);\n        }\n      }\n      for (const p of burnerHotParticles) {`,
  'fuel visibility override and glow loop'
);

// Conservative camera choice: intentionally retain the already-stable camera
// architecture and checkpoint-13 underheater behavior. No arcball change here.

// Give the healthy/normal flame a little more visual breathing room without
// changing the representative firebox envelope. Abnormal impingement scenarios
// keep their explicit lean/contact logic and remain available as faults.
source = replaceOnce(
  source,
  "    const outer = new THREE.Mesh(new THREE.ConeGeometry(0.72, 5.6, 42, 12, true), outerMat);",
  "    const outer = new THREE.Mesh(new THREE.ConeGeometry(0.66, 5.6, 42, 12, true), outerMat);",
  'normal outer flame width refinement'
);

fs.writeFileSync(heaterPath, source);
