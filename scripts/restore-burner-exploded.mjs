import fs from 'node:fs';

function replaceOnce(source, before, after, label) {
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly one anchor, found ${count}`);
  return source.replace(before, after);
}

// -----------------------------------------------------------------------------
// CHECKPOINT 15 — RESTORE BURNER EXPLODED ASSEMBLY DETAIL
// Runs after all current Heater3D refinement scripts.
// Keeps full-heater Exploded available for other contexts, but makes
// Burners + Exploded a local semantic assembly study again.
// -----------------------------------------------------------------------------

const heaterPath = 'src/Heater3D.tsx';
let source = fs.readFileSync(heaterPath, 'utf8');

// Contextual burner explode: do not apply the global component stack offsets.
source = replaceOnce(
  source,
  "    components.forEach((group, name) => {\n      const offset = explode ? explodeOffsets[name] ?? new THREE.Vector3() : new THREE.Vector3();",
  "    const contextualBurnerExplode = Boolean(explode && selected === 'Burners');\n    components.forEach((group, name) => {\n      const offset = explode && !contextualBurnerExplode ? explodeOffsets[name] ?? new THREE.Vector3() : new THREE.Vector3();",
  'contextual burner explode mode'
);

// Keep the casing in location context for burner-specific explode.
source = replaceOnce(
  source,
  "    frontCasing.userData.atlasTargetZ = explode ? 7.2 : 0;",
  "    frontCasing.userData.atlasTargetZ = explode && selected !== 'Burners' ? 7.2 : 0;",
  'prevent burner explode from opening global front casing'
);

source = replaceOnce(
  source,
  "      if (explode) {\n        if (base.x <= -5.6) target.x -= 5.4;",
  "      if (explode && selected !== 'Burners') {\n        if (base.x <= -5.6) target.x -= 5.4;",
  'prevent burner explode from opening all casing sides'
);

// Bring the pilot/ignition micro hardware into the burner exploded study.
source = replaceOnce(
  source,
  "      pilotMicro.visible = burnerStudyMode === 'pilot' || operationPilotState;",
  "      pilotMicro.visible = burnerStudyMode === 'pilot' || contextualBurnerExplode || operationPilotState;\n      pilotMicro.position.set(contextualBurnerExplode ? 4.15 : 0, contextualBurnerExplode ? 6.95 : 6.05, contextualBurnerExplode ? -0.30 : -1.35);\n      pilotMicro.scale.setScalar(contextualBurnerExplode ? 0.88 : 1);",
  'pilot micro hardware in contextual exploded study'
);

// Ghost neighboring burners in the local exploded study, matching the detailed burner page.
source = replaceOnce(
  source,
  "    if (burnerStudyMode && burnerGroup) {",
  "    if ((burnerStudyMode || contextualBurnerExplode) && burnerGroup) {",
  'ghost neighboring burner cells during contextual explode'
);

// Restore the semantic burner subassembly offsets for the hero burner.
source = replaceOnce(
  source,
  "      if (burnerStudyMode === 'exploded' && child.userData.heroBurner && role) target.add(semanticExplodeOffsets[role] ?? new THREE.Vector3());",
  "      if ((burnerStudyMode === 'exploded' || contextualBurnerExplode) && child.userData.heroBurner && role) target.add(semanticExplodeOffsets[role] ?? new THREE.Vector3());",
  'semantic hero-burner exploded offsets'
);

// Keep component callouts visible for this local explode; do not move them by
// whole-heater explode offsets. Pilot micro labels already use leader lines.
source = replaceOnce(
  source,
  "      labelRef.current.visible = labels && !explode;",
  "      labelRef.current.visible = labels && (!explode || contextualBurnerExplode);",
  'labels visible in burner contextual explode'
);

source = replaceOnce(
  source,
  "        if (baseY !== undefined) child.position.y = baseY + (explode && name ? (explodeOffsets[name]?.y ?? 0) : 0);",
  "        if (baseY !== undefined) child.position.y = baseY + (explode && !contextualBurnerExplode && name ? (explodeOffsets[name]?.y ?? 0) : 0);",
  'prevent burner labels inheriting full-heater explode shift'
);

// Give the semantic assembly enough framing without invoking the full-heater
// exploded camera preset.
source = replaceOnce(
  source,
  "    const preset = !selected && !explode ? ({ yaw: orbitRef.current.yaw, pitch: orbitRef.current.pitch, radius: Math.max(48, orbitRef.current.radius), target: [0, 19.0, 0] } as CameraPreset) : getAtlasModeCameraPreset(selected, mode, explode);",
  "    const preset = explode && selected === 'Burners'\n      ? ({ yaw: -0.74, pitch: -0.015, radius: 18.8, target: [0.65, 6.15, -0.75] } as CameraPreset)\n      : !selected && !explode\n        ? ({ yaw: orbitRef.current.yaw, pitch: orbitRef.current.pitch, radius: Math.max(48, orbitRef.current.radius), target: [0, 19.0, 0] } as CameraPreset)\n        : getAtlasModeCameraPreset(selected, mode, explode);",
  'burner exploded camera preset'
);

fs.writeFileSync(heaterPath, source);

// Atlas UI: make the global Exploded button contextual when Burners is selected.
const appPath = 'src/App.tsx';
let app = fs.readFileSync(appPath, 'utf8');

app = replaceOnce(
  app,
  "      setExplode(true);\n      cameraAction('fitComponent', 'Burners');",
  "      setExplode(true);\n      setContextMode('focus');\n      cameraAction('burnerExploded', 'Burners');",
  'burner study-view exploded camera action'
);

app = replaceOnce(
  app,
  "<button className={explode ? 'active' : ''} onClick={() => { setMode('cutaway'); setExplode(value => !value); setContextMode('full'); }}><Box size={15} />Exploded</button>",
  "<button className={explode ? 'active' : ''} onClick={() => { const next = !explode; setMode('cutaway'); setExplode(next); if (next && selected === 'Burners') { setContextMode('focus'); issueCameraCommand('burnerExploded', 'Burners'); } else { setContextMode('full'); if (next) issueCameraCommand('fitHeater', selected || 'Radiant Tubes'); } }}><Box size={15} />Exploded</button>",
  'context-aware Atlas exploded button'
);

fs.writeFileSync(appPath, app);

// Detailed burner study copy: make the restored fine hardware explicit.
const burnerPath = 'src/BurnerPage.tsx';
let burner = fs.readFileSync(burnerPath, 'utf8');
burner = replaceOnce(
  burner,
  "<div><b>Air Register</b><b>Body / Neck</b><b>Mounting Flange</b><b>Gas Gun / Fuel Tip</b><b>Tile / Throat</b><b>Pilot / Ignition</b><b>Flame</b></div>",
  "<div><b>Air Register</b><b>Body / Neck</b><b>Mounting Flange</b><b>Gas Gun / Fuel Tip</b><b>Tile / Throat</b><b>Pilot Assembly</b><b>Ignition Electrode</b><b>Flame Proving / Scanner Rod</b><b>Flame</b></div>",
  'expanded exploded burner hardware list'
);
fs.writeFileSync(burnerPath, burner);
