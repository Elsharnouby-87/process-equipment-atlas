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
// CHECKPOINT 13 — FUEL VISIBILITY, CONSERVATIVE CAMERA & CLEARANCE REFINEMENT
// Runs after assemble-preview, burner-sim and free-explore patches.
// -----------------------------------------------------------------------------

const heaterPath = 'src/Heater3D.tsx';
let source = fs.readFileSync(heaterPath, 'utf8');

// -----------------------------------------------------------------------------
// 1 + 2) UNDERFURNACE / INTERNAL CUTAWAY FUEL-GAS VISIBILITY
// -----------------------------------------------------------------------------
// Keep the cue tied to the representative fuel header + branch + gas-gun path,
// but bias the teaching particles just outside the pipe centreline and render
// them as a restrained additive overlay so they do not visually disappear
// inside the tube geometry.
source = replaceOnce(
  source,
  "    const purgeParticles: THREE.Mesh[] = [];",
  `    const purgeParticles: THREE.Mesh[] = [];\n    const heroFuelPathPoints = [\n      new THREE.Vector3(-5.2, 2.75, -3.0),\n      new THREE.Vector3(-2.6, 2.75, -3.0),\n      new THREE.Vector3(0.0, 2.75, -3.0),\n      new THREE.Vector3(-0.78, 2.95, -2.35),\n      new THREE.Vector3(-0.92, 3.62, -1.57),\n      new THREE.Vector3(-0.92, 4.35, -1.35),\n      new THREE.Vector3(-0.35, 4.35, -1.35),\n      new THREE.Vector3(-0.12, 5.25, -1.35),\n      new THREE.Vector3(0.0, 6.52, -1.35),\n    ];\n    const heroFuelPath = new THREE.CurvePath<THREE.Vector3>();\n    for (let i = 0; i < heroFuelPathPoints.length - 1; i += 1) {\n      heroFuelPath.add(new THREE.LineCurve3(heroFuelPathPoints[i], heroFuelPathPoints[i + 1]));\n    }\n    const underfurnaceFuelVisualOffset = new THREE.Vector3(0.0, 0.11, 0.10);\n    const internalFuelVisualOffset = new THREE.Vector3(0.08, 0.09, 0.11);`,
  'hero fuel path insertion'
);

source = replaceOnce(
  source,
  "    const burnerFuelMat = new THREE.MeshBasicMaterial({ color: '#ffd36a', transparent: true, opacity: 0.96 });",
  "    const burnerFuelMat = new THREE.MeshBasicMaterial({ color: '#ffd36a', transparent: true, opacity: 0.98, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending });",
  'fuel material visibility'
);

source = replaceRegex(
  source,
  /    for \(let i = 0; i < 14; i \+= 1\) \{\n      const p = new THREE\.Mesh\(new THREE\.SphereGeometry\(0\.075, 8, 7\), burnerFuelMat\);\n      p\.userData\.t = i \/ 14;\n      p\.userData\.burnerFlow = 'fuel';\n      flowGroup\.add\(p\);\n      burnerFuelParticles\.push\(p\);\n    \}/,
  `    for (let i = 0; i < 22; i += 1) {\n      const p = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 7), burnerFuelMat);\n      p.userData.t = i / 22;\n      p.userData.burnerFlow = 'fuel';\n      p.renderOrder = 46;\n      flowGroup.add(p);\n      burnerFuelParticles.push(p);\n    }`,
  'fuel particle density and visibility refinement'
);

source = replaceOnce(
  source,
  `        if (activeBurnerStudy === 'pilot') {\n          p.position.set(-1.4 + u * 1.4, 5.72 + u * 0.82, -1.35);\n        } else {\n          p.position.set(-2.3 + u * 2.3, 3.45 + u * 3.05, -1.35 + Math.sin(u * Math.PI) * 0.12);\n        }`,
  `        if (activeBurnerStudy === 'external') {\n          p.position.copy(heroFuelPath.getPoint(THREE.MathUtils.clamp(u, 0, 0.9999))).add(underfurnaceFuelVisualOffset);\n          p.scale.multiplyScalar(0.98 + Math.sin(t * 6.0 + p.userData.t * 11.0) * 0.10);\n        } else if (activeBurnerStudy === 'internal') {\n          const pathU = THREE.MathUtils.clamp(0.28 + u * 0.72, 0, 0.9999);\n          p.position.copy(heroFuelPath.getPoint(pathU)).add(internalFuelVisualOffset);\n          p.scale.multiplyScalar(0.98 + Math.sin(t * 6.4 + p.userData.t * 10.0) * 0.09);\n        } else if (activeBurnerStudy === 'pilot') {\n          p.position.set(-1.4 + u * 1.4, 5.72 + u * 0.82, -1.35);\n        } else {\n          p.position.copy(heroFuelPath.getPoint(THREE.MathUtils.clamp(0.35 + u * 0.65, 0, 0.9999))).add(internalFuelVisualOffset);\n        }`,
  'underfurnace and internal fuel flow route'
);

// -----------------------------------------------------------------------------
// PILOT / IGNITION LABEL CLEANUP
// -----------------------------------------------------------------------------
source = replaceRegex(
  source,
  /    const pilotLabels = new THREE\.Group\(\);[\s\S]*?    pilotMicro\.add\(pilotLabels\);/,
  `    const pilotLabels = new THREE.Group();\n    const pilotLabelSpecs: { text: string; position: [number, number, number]; target: [number, number, number] }[] = [\n      { text: 'IGNITION ELECTRODE', position: [-2.05, 1.78, 0.02], target: [-0.30, 1.10, -0.02] },\n      { text: 'PILOT PORT', position: [2.0, 0.42, 0.02], target: [0.0, 0.50, 0.0] },\n      { text: 'GROUND REFERENCE', position: [-2.0, 0.40, 0.02], target: [0.46, 1.12, 0.02] },\n      { text: 'FLAME PROVING', position: [2.05, 1.78, 0.22], target: [0.76, 1.27, 0.20] },\n    ];\n    pilotLabelSpecs.forEach(spec => {\n      const label = makeLabel(spec.text);\n      label.scale.set(1.62, 0.36, 1);\n      label.position.set(...spec.position);\n      label.renderOrder = 40;\n      pilotLabels.add(label);\n      const leadStart = new THREE.Vector3(\n        spec.position[0] + (spec.position[0] > 0 ? -0.78 : 0.78),\n        spec.position[1],\n        spec.position[2] + 0.02\n      );\n      const leader = new THREE.Line(\n        new THREE.BufferGeometry().setFromPoints([leadStart, new THREE.Vector3(...spec.target)]),\n        new THREE.LineBasicMaterial({ color: '#70d9f7', transparent: true, opacity: 0.58, depthTest: false })\n      );\n      leader.renderOrder = 39;\n      pilotLabels.add(leader);\n    });\n    pilotMicro.add(pilotLabels);`,
  'pilot label collision cleanup'
);

source = replaceOnce(
  source,
  "      transition({ yaw: -0.66, pitch: 0.015, radius: 8.2, target: [0, 6.55, -1.35] }, 900);",
  "      transition({ yaw: -0.66, pitch: 0.01, radius: 9.6, target: [0, 6.58, -1.35] }, 900);",
  'pilot camera breathing room'
);

source = replaceOnce(
  source,
  "      transition({ yaw: -0.82, pitch: -0.07, radius: 13.5, target: [0, 4.6, -1.35] }, 900);",
  "      transition({ yaw: -0.84, pitch: -0.10, radius: 14.6, target: [-0.25, 4.55, -1.72] }, 900);",
  'underfurnace camera fuel-path framing'
);

// -----------------------------------------------------------------------------
// 3) CONSERVATIVE BLENDER-LIKE CAMERA IMPROVEMENT
// -----------------------------------------------------------------------------
// Keep the stable yaw/pitch orbit architecture. Improve under-heater access,
// closer inspection and desktop navigation without introducing arcball flips or
// a new camera stack.
source = replaceOnce(
  source,
  `    const updateCamera = () => {\n      const o = orbitRef.current;\n      camera.position.set(\n        o.target.x + Math.sin(o.yaw) * Math.cos(o.pitch) * o.radius,\n        o.target.y + Math.sin(o.pitch) * o.radius,\n        o.target.z + Math.cos(o.yaw) * Math.cos(o.pitch) * o.radius\n      );\n      camera.lookAt(o.target);\n    };`,
  `    const updateCamera = () => {\n      const o = orbitRef.current;\n      camera.position.set(\n        o.target.x + Math.sin(o.yaw) * Math.cos(o.pitch) * o.radius,\n        o.target.y + Math.sin(o.pitch) * o.radius,\n        o.target.z + Math.cos(o.yaw) * Math.cos(o.pitch) * o.radius\n      );\n      const lookTarget = o.target.clone();\n      const freeExplore = !selectedRef.current && contextModeRef.current === 'full';\n      if (freeExplore && o.pitch < -0.22) {\n        const assist = THREE.MathUtils.smoothstep(-o.pitch, 0.22, 1.52);\n        lookTarget.y = THREE.MathUtils.lerp(o.target.y, Math.min(o.target.y, 4.8), assist);\n        if (camera.position.y < 0.68) camera.position.y = 0.68;\n      }\n      camera.lookAt(lookTarget);\n    };`,
  'conservative underheater orbit assist'
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
  "        orbitRef.current.yaw -= dx * 0.005;\n        orbitRef.current.pitch = THREE.MathUtils.clamp(orbitRef.current.pitch + dy * 0.0039, -1.48, 1.48);",
  "        orbitRef.current.yaw -= dx * 0.0047;\n        orbitRef.current.pitch = THREE.MathUtils.clamp(orbitRef.current.pitch + dy * 0.0037, -1.55, 1.48);",
  'smoother conservative orbit sensitivity'
);

source = replaceOnce(
  source,
  "      orbitRef.current.radius = THREE.MathUtils.clamp(orbitRef.current.radius + event.deltaY * 0.04, 8, 96);",
  "      orbitRef.current.radius = THREE.MathUtils.clamp(orbitRef.current.radius + event.deltaY * 0.035, 6.5, 96);",
  'closer smoother wheel inspection'
);

// -----------------------------------------------------------------------------
// 4) NORMAL FLAME-TO-TUBE CLEARANCE
// -----------------------------------------------------------------------------
// Move the tube plane only slightly farther toward the hot face (still inside
// the representative refractory envelope) and modestly tighten the normal
// outer flame envelope. Explicit abnormal impingement logic is strengthened so
// the fault study can still demonstrate approach/contact intentionally.
const radiantXMatches = [...source.matchAll(/\b5\.02\b/g)].length;
if (radiantXMatches < 8) throw new Error(`radiant x widening: expected several 5.02 anchors, found ${radiantXMatches}`);
source = source.replace(/\b5\.02\b/g, '5.30');

const manifoldMatches = [...source.matchAll(/\b5\.18\b/g)].length;
if (manifoldMatches < 2) throw new Error(`radiant manifold widening: expected 5.18 anchors, found ${manifoldMatches}`);
source = source.replace(/\b5\.18\b/g, '5.46');

source = source.replace("hotspot.position.set(5.0, 10.25, -1.4);", "hotspot.position.set(5.28, 10.25, -1.4);");

source = replaceOnce(
  source,
  "        const outer = new THREE.Mesh(new THREE.ConeGeometry(0.72, 5.6, 42, 12, true), outerMat);",
  "        const outer = new THREE.Mesh(new THREE.ConeGeometry(0.66, 5.3, 42, 12, true), outerMat);",
  'normal outer flame envelope'
);

source = replaceOnce(
  source,
  "        outer.userData.halfHeight = 2.8;",
  "        outer.userData.halfHeight = 2.65;",
  'normal outer flame half height'
);

source = replaceOnce(
  source,
  "        outer.position.set(x + Math.sin(flameSeed * 1.4) * 0.06, 6.56 + 2.8 * outerScaleY, z);",
  "        outer.position.set(x + Math.sin(flameSeed * 1.4) * 0.05, 6.56 + 2.65 * outerScaleY, z);",
  'normal outer flame initial position'
);

source = replaceOnce(
  source,
  "        const troubleshootingLengthScale = troubleshootingTarget ? activeTroubleshootingPhase === 'deviation' ? 1.02 : activeTroubleshootingPhase === 'contact' ? 1.08 : activeTroubleshootingPhase === 'consequence' ? 1.1 : 1 : 1;",
  "        const troubleshootingLengthScale = troubleshootingTarget ? activeTroubleshootingPhase === 'deviation' ? 1.08 : activeTroubleshootingPhase === 'contact' ? 1.20 : activeTroubleshootingPhase === 'consequence' ? 1.24 : 1 : 1;",
  'preserve abnormal impingement reach'
);

source = replaceOnce(
  source,
  "        const troubleshootingBias = troubleshootingTarget ? activeTroubleshootingPhase === 'deviation' ? -0.1 : activeTroubleshootingPhase === 'contact' ? -0.18 : activeTroubleshootingPhase === 'consequence' ? -0.2 : 0 : 0;",
  "        const troubleshootingBias = troubleshootingTarget ? activeTroubleshootingPhase === 'deviation' ? -0.12 : activeTroubleshootingPhase === 'contact' ? -0.24 : activeTroubleshootingPhase === 'consequence' ? -0.28 : 0 : 0;",
  'preserve abnormal impingement lean'
);

fs.writeFileSync(heaterPath, source);
