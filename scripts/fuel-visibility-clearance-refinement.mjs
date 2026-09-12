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

// -----------------------------------------------------------------------------
// CHECKPOINT 14 — FUEL VISIBILITY + CONSERVATIVE CAMERA + CLEARANCE POLISH
// Runs after checkpoint-12 burner/camera/geometry refinement.
// This is deliberately visual/interaction polish only — no new process model.
// -----------------------------------------------------------------------------

const heaterPath = 'src/Heater3D.tsx';
let source = fs.readFileSync(heaterPath, 'utf8');

// 1) Make the fuel teaching cue unmistakably visible while keeping it tied to
// the representative pipe route. The bright core sits just off the pipe center
// line; the soft additive halo makes the cue readable even against copper/dark
// hardware. This is a visual teaching overlay, not a literal fluid rendering.
source = replaceOnce(
  source,
  "    const burnerFuelParticles: THREE.Mesh[] = [];\n    const burnerHotParticles: THREE.Mesh[] = [];",
  "    const burnerFuelParticles: THREE.Mesh[] = [];\n    const burnerFuelGlowParticles: THREE.Mesh[] = [];\n    const burnerHotParticles: THREE.Mesh[] = [];",
  'fuel glow particle array'
);

source = replaceOnce(
  source,
  "    const burnerFuelMat = new THREE.MeshBasicMaterial({ color: '#ffd36a', transparent: true, opacity: 0.96 });",
  "    const burnerFuelMat = new THREE.MeshBasicMaterial({ color: '#ffd24a', transparent: true, opacity: 1, depthWrite: false, depthTest: false });\n    const burnerFuelGlowMat = new THREE.MeshBasicMaterial({ color: '#fff2a3', transparent: true, opacity: 0.24, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending });",
  'fuel material visibility'
);

source = replaceRegex(
  source,
  /    for \(let i = 0; i < 20; i \+= 1\) \{\n      const p = new THREE\.Mesh\(new THREE\.SphereGeometry\(0\.07, 8, 7\), burnerFuelMat\);\n      p\.userData\.t = i \/ 20;\n      p\.userData\.burnerFlow = 'fuel';\n      flowGroup\.add\(p\);\n      burnerFuelParticles\.push\(p\);\n    \}/,
  `    for (let i = 0; i < 24; i += 1) {\n      const p = new THREE.Mesh(new THREE.SphereGeometry(0.085, 9, 8), burnerFuelMat);\n      p.userData.t = i / 24;\n      p.userData.burnerFlow = 'fuel';\n      p.renderOrder = 61;\n      flowGroup.add(p);\n      burnerFuelParticles.push(p);\n\n      const glow = new THREE.Mesh(new THREE.SphereGeometry(0.145, 9, 8), burnerFuelGlowMat);\n      glow.userData.t = i / 24;\n      glow.userData.burnerFlow = 'fuel';\n      glow.renderOrder = 60;\n      flowGroup.add(glow);\n      burnerFuelGlowParticles.push(glow);\n    }`,
  'fuel particle core + halo creation'
);

source = replaceRegex(
  source,
  /      for \(const p of burnerFuelParticles\) \{\n        const u = \(p\.userData\.t \+ t \* 0\.075\) % 1;\n        if \(activeBurnerStudy === 'external'\) \{\n          p\.position\.copy\(heroFuelPath\.getPoint\(THREE\.MathUtils\.clamp\(u, 0, 0\.9999\)\)\);\n        \} else if \(activeBurnerStudy === 'pilot'\) \{\n          p\.position\.set\(-1\.4 \+ u \* 1\.4, 5\.72 \+ u \* 0\.82, -1\.35\);\n        \} else \{\n          p\.position\.set\(-2\.3 \+ u \* 2\.3, 3\.45 \+ u \* 3\.05, -1\.35 \+ Math\.sin\(u \* Math\.PI\) \* 0\.12\);\n        \}\n      \}/,
  `      for (const p of burnerFuelParticles) {\n        const u = (p.userData.t + t * 0.078) % 1;\n        if (activeBurnerStudy === 'external' || activeBurnerStudy === 'internal') {\n          const point = heroFuelPath.getPoint(THREE.MathUtils.clamp(u, 0, 0.9999));\n          const offset = activeBurnerStudy === 'internal'\n            ? new THREE.Vector3(0.16, 0.07, 0.15)\n            : new THREE.Vector3(0.14, 0.06, 0.13);\n          p.position.copy(point).add(offset);\n          const pulse = 1 + Math.sin(t * 7.2 + (p.userData.t as number) * Math.PI * 2) * 0.16;\n          p.scale.setScalar(pulse);\n        } else if (activeBurnerStudy === 'pilot') {\n          p.position.set(-1.4 + u * 1.4, 5.72 + u * 0.82, -1.35);\n        } else {\n          p.position.set(-2.3 + u * 2.3, 3.45 + u * 3.05, -1.35 + Math.sin(u * Math.PI) * 0.12);\n        }\n      }\n      for (const p of burnerFuelGlowParticles) {\n        const u = (p.userData.t + t * 0.078) % 1;\n        if (activeBurnerStudy === 'external' || activeBurnerStudy === 'internal') {\n          const point = heroFuelPath.getPoint(THREE.MathUtils.clamp(u, 0, 0.9999));\n          const offset = activeBurnerStudy === 'internal'\n            ? new THREE.Vector3(0.16, 0.07, 0.15)\n            : new THREE.Vector3(0.14, 0.06, 0.13);\n          p.position.copy(point).add(offset);\n          const glowPulse = 0.9 + (Math.sin(t * 6.4 + (p.userData.t as number) * Math.PI * 2) + 1) * 0.16;\n          p.scale.setScalar(glowPulse);\n        } else if (activeBurnerStudy === 'pilot') {\n          p.position.set(-1.4 + u * 1.4, 5.72 + u * 0.82, -1.35);\n        } else {\n          p.position.set(-2.3 + u * 2.3, 3.45 + u * 3.05, -1.35 + Math.sin(u * Math.PI) * 0.12);\n        }\n      }`,
  'fuel route visibility in underfurnace + internal cutaway'
);

// 2) Conservative camera polish only: keep the stable yaw/pitch architecture,
// but bias steep underheater inspection a little lower and allow a touch more
// downward travel. No arcball/quaternion control is introduced here.
source = replaceOnce(
  source,
  "        lookTarget.y = THREE.MathUtils.lerp(o.target.y, Math.min(o.target.y, 5.6), assist);\n        if (camera.position.y < 0.72) camera.position.y = 0.72;",
  "        lookTarget.y = THREE.MathUtils.lerp(o.target.y, Math.min(o.target.y, 5.25), assist);\n        if (camera.position.y < 0.62) camera.position.y = 0.62;",
  'conservative underheater look assist'
);

source = replaceOnce(
  source,
  "        orbitRef.current.pitch = THREE.MathUtils.clamp(orbitRef.current.pitch + dy * 0.0039, -1.535, 1.48);",
  "        orbitRef.current.pitch = THREE.MathUtils.clamp(orbitRef.current.pitch + dy * 0.0039, -1.55, 1.48);",
  'conservative lower pitch extension'
);

// 3) Increase normal flame-to-tube visual separation modestly. Keep the tube
// planes inside the representative refractory envelope, and narrow only the
// normal outer flame cone enough to read as healthy firing. Fault/impingement
// logic still deliberately leans/translates the flame into the tube envelope.
const tubePlaneMatches = [...source.matchAll(/\b5\.28\b/g)].length;
if (tubePlaneMatches < 8) throw new Error(`tube plane refinement: expected several 5.28 anchors, found ${tubePlaneMatches}`);
source = source.replace(/\b5\.28\b/g, '5.40');

const manifoldMatches = [...source.matchAll(/\b5\.44\b/g)].length;
if (manifoldMatches < 2) throw new Error(`manifold refinement: expected 5.44 anchors, found ${manifoldMatches}`);
source = source.replace(/\b5\.44\b/g, '5.56');

source = replaceOnce(
  source,
  "    source = source.replace(\"hotspot.position.set(5.0, 10.25, -1.4);\", \"hotspot.position.set(5.26, 10.25, -1.4);\");",
  "    source = source.replace(\"hotspot.position.set(5.0, 10.25, -1.4);\", \"hotspot.position.set(5.26, 10.25, -1.4);\");",
  'noop guard'
);

source = source.replace("hotspot.position.set(5.26, 10.25, -1.4);", "hotspot.position.set(5.38, 10.25, -1.4);");
source = replaceOnce(
  source,
  "    const outer = new THREE.Mesh(new THREE.ConeGeometry(0.72, 5.6, 42, 12, true), outerMat);",
  "    const outer = new THREE.Mesh(new THREE.ConeGeometry(0.68, 5.6, 42, 12, true), outerMat);",
  'normal outer flame width refinement'
);

fs.writeFileSync(heaterPath, source);
