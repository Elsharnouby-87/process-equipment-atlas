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
// CHECKPOINT 12 — BURNER FLOW, CAMERA UNDERVIEW & NORMAL GEOMETRY REFINEMENT
// Runs after assemble-preview, burner-sim and free-explore patches.
// -----------------------------------------------------------------------------

const heaterPath = 'src/Heater3D.tsx';
let source = fs.readFileSync(heaterPath, 'utf8');

// 1) Underfurnace fuel-gas cue: follow the actual representative hero-burner
// fuel header + branch geometry instead of a generic diagonal shortcut.
source = replaceOnce(
  source,
  "    const purgeParticles: THREE.Mesh[] = [];",
  `    const purgeParticles: THREE.Mesh[] = [];\n    const heroFuelPathPoints = [\n      new THREE.Vector3(-5.2, 2.75, -3.0),\n      new THREE.Vector3(-2.6, 2.75, -3.0),\n      new THREE.Vector3(0.0, 2.75, -3.0),\n      new THREE.Vector3(-0.78, 2.95, -2.35),\n      new THREE.Vector3(-0.92, 3.62, -1.57),\n      new THREE.Vector3(-0.92, 4.35, -1.35),\n      new THREE.Vector3(-0.35, 4.35, -1.35),\n      new THREE.Vector3(-0.12, 5.25, -1.35),\n      new THREE.Vector3(0.0, 6.35, -1.35),\n    ];\n    const heroFuelPath = new THREE.CurvePath<THREE.Vector3>();\n    for (let i = 0; i < heroFuelPathPoints.length - 1; i += 1) {\n      heroFuelPath.add(new THREE.LineCurve3(heroFuelPathPoints[i], heroFuelPathPoints[i + 1]));\n    }`,
  'hero fuel path insertion'
);

source = replaceRegex(
  source,
  /    for \(let i = 0; i < 14; i \+= 1\) \{\n      const p = new THREE\.Mesh\(new THREE\.SphereGeometry\(0\.075, 8, 7\), burnerFuelMat\);\n      p\.userData\.t = i \/ 14;\n      p\.userData\.burnerFlow = 'fuel';\n      flowGroup\.add\(p\);\n      burnerFuelParticles\.push\(p\);\n    \}/,
  `    for (let i = 0; i < 20; i += 1) {\n      const p = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 7), burnerFuelMat);\n      p.userData.t = i / 20;\n      p.userData.burnerFlow = 'fuel';\n      flowGroup.add(p);\n      burnerFuelParticles.push(p);\n    }`,
  'fuel particle density refinement'
);

source = replaceOnce(
  source,
  `        if (activeBurnerStudy === 'pilot') {\n          p.position.set(-1.4 + u * 1.4, 5.72 + u * 0.82, -1.35);\n        } else {\n          p.position.set(-2.3 + u * 2.3, 3.45 + u * 3.05, -1.35 + Math.sin(u * Math.PI) * 0.12);\n        }`,
  `        if (activeBurnerStudy === 'external') {\n          p.position.copy(heroFuelPath.getPoint(THREE.MathUtils.clamp(u, 0, 0.9999)));\n        } else if (activeBurnerStudy === 'pilot') {\n          p.position.set(-1.4 + u * 1.4, 5.72 + u * 0.82, -1.35);\n        } else {\n          p.position.set(-2.3 + u * 2.3, 3.45 + u * 3.05, -1.35 + Math.sin(u * Math.PI) * 0.12);\n        }`,
  'underfurnace fuel flow route'
);

// 2) Pilot / ignition micro-view: compact labels placed outside the hardware,
// with leader lines so the geometry remains visible.
source = replaceRegex(
  source,
  /    const pilotLabels = new THREE\.Group\(\);[\s\S]*?    pilotMicro\.add\(pilotLabels\);/,
  `    const pilotLabels = new THREE.Group();\n    const pilotLabelSpecs: { text: string; position: [number, number, number]; target: [number, number, number] }[] = [\n      { text: 'IGNITION ELECTRODE', position: [-2.05, 1.78, 0.02], target: [-0.30, 1.10, -0.02] },\n      { text: 'PILOT PORT', position: [2.0, 0.42, 0.02], target: [0.0, 0.50, 0.0] },\n      { text: 'GROUND REFERENCE', position: [-2.0, 0.40, 0.02], target: [0.46, 1.12, 0.02] },\n      { text: 'FLAME PROVING', position: [2.05, 1.78, 0.22], target: [0.76, 1.27, 0.20] },\n    ];\n    pilotLabelSpecs.forEach(spec => {\n      const label = makeLabel(spec.text);\n      label.scale.set(1.62, 0.36, 1);\n      label.position.set(...spec.position);\n      label.renderOrder = 40;\n      pilotLabels.add(label);\n      const leadStart = new THREE.Vector3(\n        spec.position[0] + (spec.position[0] > 0 ? -0.78 : 0.78),\n        spec.position[1],\n        spec.position[2] + 0.02\n      );\n      const leader = new THREE.Line(\n        new THREE.BufferGeometry().setFromPoints([leadStart, new THREE.Vector3(...spec.target)]),\n        new THREE.LineBasicMaterial({ color: '#70d9f7', transparent: true, opacity: 0.58, depthTest: false })\n      );\n      leader.renderOrder = 39;\n      pilotLabels.add(leader);\n    });\n    pilotMicro.add(pilotLabels);`,
  'pilot label collision cleanup'
);

// Pull the dedicated pilot camera back slightly to leave breathing room for
// the new edge callouts and leader lines.
source = replaceOnce(
  source,
  "      transition({ yaw: -0.66, pitch: 0.015, radius: 8.2, target: [0, 6.55, -1.35] }, 900);",
  "      transition({ yaw: -0.66, pitch: 0.01, radius: 9.6, target: [0, 6.58, -1.35] }, 900);",
  'pilot camera breathing room'
);

// Slightly widen the external burner view so the fuel header + branch remain
// visible as one connected path.
source = replaceOnce(
  source,
  "      transition({ yaw: -0.82, pitch: -0.07, radius: 13.5, target: [0, 4.6, -1.35] }, 900);",
  "      transition({ yaw: -0.84, pitch: -0.10, radius: 14.6, target: [-0.25, 4.55, -1.72] }, 900);",
  'underfurnace camera fuel-path framing'
);

// 3) Free explore underheater access. Keep the Blender-like orbit freedom but
// prevent the camera from disappearing below the ground plane. At steep
// downward orbit angles, visually bias the look target toward the underfurnace
// zone so the user can inspect the burner floor from below without a hard flip.
source = replaceOnce(
  source,
  `    const updateCamera = () => {\n      const o = orbitRef.current;\n      camera.position.set(\n        o.target.x + Math.sin(o.yaw) * Math.cos(o.pitch) * o.radius,\n        o.target.y + Math.sin(o.pitch) * o.radius,\n        o.target.z + Math.cos(o.yaw) * Math.cos(o.pitch) * o.radius\n      );\n      camera.lookAt(o.target);\n    };`,
  `    const updateCamera = () => {\n      const o = orbitRef.current;\n      camera.position.set(\n        o.target.x + Math.sin(o.yaw) * Math.cos(o.pitch) * o.radius,\n        o.target.y + Math.sin(o.pitch) * o.radius,\n        o.target.z + Math.cos(o.yaw) * Math.cos(o.pitch) * o.radius\n      );\n      const lookTarget = o.target.clone();\n      const freeExplore = !selectedRef.current && contextModeRef.current === 'full';\n      if (freeExplore && o.pitch < -0.28) {\n        const assist = THREE.MathUtils.smoothstep(-o.pitch, 0.28, 1.50);\n        lookTarget.y = THREE.MathUtils.lerp(o.target.y, Math.min(o.target.y, 5.6), assist);\n        if (camera.position.y < 0.72) camera.position.y = 0.72;\n      }\n      camera.lookAt(lookTarget);\n    };`,
  'underheater orbit assist'
);

source = replaceOnce(
  source,
  "      panMode = event.button === 2 || event.shiftKey;",
  "      panMode = event.button === 2 || event.button === 1 || event.shiftKey;",
  'middle mouse pan support'
);

source = replaceOnce(
  source,
  "        orbitRef.current.target.x -= dx * 0.018;\n        orbitRef.current.target.y += dy * 0.018;",
  "        orbitRef.current.target.x -= dx * 0.021;\n        orbitRef.current.target.y += dy * 0.024;",
  'more useful free pan response'
);

source = replaceOnce(
  source,
  "        orbitRef.current.pitch = THREE.MathUtils.clamp(orbitRef.current.pitch + dy * 0.0039, -1.48, 1.48);",
  "        orbitRef.current.pitch = THREE.MathUtils.clamp(orbitRef.current.pitch + dy * 0.0039, -1.535, 1.48);",
  'slightly deeper underheater orbit'
);

// 4) Normal geometry: move the wall-mounted radiant tube planes outward a
// modest amount. This preserves the box-heater identity while creating clear
// normal flame-to-tube separation. Abnormal flame-impingement scenarios retain
// their explicit lean/contact logic and therefore remain available as faults.
const radiantXMatches = [...source.matchAll(/\b5\.02\b/g)].length;
if (radiantXMatches < 8) throw new Error(`radiant x widening: expected several 5.02 anchors, found ${radiantXMatches}`);
source = source.replace(/\b5\.02\b/g, '5.28');

const manifoldMatches = [...source.matchAll(/\b5\.18\b/g)].length;
if (manifoldMatches < 2) throw new Error(`radiant manifold widening: expected 5.18 anchors, found ${manifoldMatches}`);
source = source.replace(/\b5\.18\b/g, '5.44');

source = source.replace("hotspot.position.set(5.0, 10.25, -1.4);", "hotspot.position.set(5.26, 10.25, -1.4);");

fs.writeFileSync(heaterPath, source);
