import fs from 'node:fs';

function replaceOnce(source, before, after, label) {
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly one anchor, found ${count}`);
  return source.replace(before, after);
}

// ---- Assemble / patch the generated Heater3D source ----
const heaterPath = 'src/Heater3D.tsx';
let source = fs.readFileSync(heaterPath, 'utf8');

source = replaceOnce(
  source,
  "group.traverse(obj => { obj.visible = true; });",
  "group.traverse(obj => { if (obj !== breechingFullShell && obj !== breechingCutShell && obj !== stackFullShell && obj !== stackCutShell && obj !== pilotMicroRef.current) obj.visible = true; });",
  'v42 visibility reset'
);

source = replaceOnce(
  source,
  "0.18 + (damperPosition / 100) * 1.02",
  "1.38 - (damperPosition / 100) * 1.20",
  'damper direct-position mapping'
);

const refPositionBefore = "0.18 + (damperPositionRef.current / 100) * 1.02";
const refCount = source.split(refPositionBefore).length - 1;
if (refCount !== 2) throw new Error(`damper ref mapping: expected 2 anchors, found ${refCount}`);
source = source.split(refPositionBefore).join("1.38 - (damperPositionRef.current / 100) * 1.20");

source = replaceOnce(
  source,
  "const t3DamperTarget = activeTroubleshootingPhase === 'normal' ? 0.22 : activeTroubleshootingPhase === 'deviation' ? 0.62 : activeTroubleshootingPhase === 'contact' ? 1.02 : 1.22;",
  "const t3DamperTarget = activeTroubleshootingPhase === 'normal' ? 1.18 : activeTroubleshootingPhase === 'deviation' ? 0.72 : activeTroubleshootingPhase === 'contact' ? 0.42 : 0.24;",
  'troubleshooting damper sequence'
);

source = replaceOnce(
  source,
  "import * as THREE from 'three';",
  "import * as THREE from 'three';\nimport { createDraftInstrumentation3D } from './draftInstrumentation3D';",
  'draft runtime import'
);

source = replaceOnce(
  source,
  "    addComponent('Stack Damper', damper);\n\n    const draftOverlay = new THREE.Group();",
  "    addComponent('Stack Damper', damper);\n\n    const draftTrainingRuntime = createDraftInstrumentation3D();\n    addComponent('Draft Instruments', draftTrainingRuntime.draftGroup);\n    addComponent('Stack Analyzers', draftTrainingRuntime.analyzerGroup);\n    scene.add(draftTrainingRuntime.flowGroup);\n\n    const draftOverlay = new THREE.Group();",
  'draft instrumentation insertion'
);

// Full explode: split the casing shell outward instead of only moving the front panel.
const casingAnchor = "    frontCasing.userData.atlasTargetZ = explode ? 7.2 : 0;";
const casingInjection = `${casingAnchor}\n    casingShell.children.forEach(child => {\n      if (child === frontCasing) return;\n      const storedBase = child.userData.atlasCasingBasePosition as THREE.Vector3 | undefined;\n      const base = storedBase ? storedBase.clone() : child.position.clone();\n      if (!storedBase) child.userData.atlasCasingBasePosition = base.clone();\n      const target = base.clone();\n      if (explode) {\n        if (base.x <= -5.6) target.x -= 5.4;\n        else if (base.x >= 5.6) target.x += 5.4;\n        if (base.z <= -3.75) target.z -= 5.0;\n        else if (base.z >= 3.75) target.z += 4.8;\n      }\n      child.userData.atlasCasingTargetPosition = target;\n    });`;
source = replaceOnce(source, casingAnchor, casingInjection, 'casing explode target setup');

const casingAnimationAnchor = "      frontCasing.position.z = THREE.MathUtils.lerp(frontCasing.position.z, frontTargetZ, 0.09);";
const casingAnimationInjection = `${casingAnimationAnchor}\n      casingShell.children.forEach(child => {\n        if (child === frontCasing) return;\n        const target = child.userData.atlasCasingTargetPosition as THREE.Vector3 | undefined;\n        if (target) child.position.lerp(target, 0.09);\n      });`;
source = replaceOnce(source, casingAnimationAnchor, casingAnimationInjection, 'casing explode animation');

const clockAnchor = "      const t = clock.getElapsedTime();";
source = replaceOnce(
  source,
  clockAnchor,
  `${clockAnchor}\n      const showDraftTrainingFlow = Boolean(draftStudyRef.current || ['Breeching', 'Stack Damper', 'Stack', 'Draft Instruments', 'Stack Analyzers'].includes(selectedRef.current));\n      draftTrainingRuntime.update(damperPositionRef.current, t, showDraftTrainingFlow);`,
  'draft runtime animation'
);

fs.writeFileSync(heaterPath, source);

// ---- Patch Atlas app registry + live damper interaction ----
const appPath = 'src/App.tsx';
let app = fs.readFileSync(appPath, 'utf8');

app = replaceOnce(
  app,
  "import { useCallback, useMemo, useState } from 'react';",
  "import { useCallback, useEffect, useMemo, useRef, useState } from 'react';",
  'react hooks for live damper teaching'
);

app = replaceOnce(
  app,
  "import type { CameraAction, CameraCommand, ContextMode, ViewMode } from './modelTypes';",
  "import type { CameraAction, CameraCommand, ContextMode, ViewMode } from './modelTypes';\nimport { getDraftTrainingMetrics } from './draftTrainingLogic';",
  'draft training metrics import'
);

app = replaceOnce(
  app,
  "  { label: 'Draft & Flue Gas', components: ['Breeching', 'Stack Damper', 'Stack'] },",
  "  { label: 'Draft & Flue Gas', components: ['Breeching', 'Stack Damper', 'Draft Instruments', 'Stack Analyzers', 'Stack'] },",
  'draft component group'
);

const detailsAnchor = "\nconst smartMode: Record<string, ViewMode> = {";
const detailsInjection = "\ndetails['Draft Instruments'] = {\n  group: 'Draft & Flue Gas',\n  location: 'Pressure tap at the radiant roof / arch reference region with representative PI/PT indication.',\n  summary: 'Draft measurement hardware teaching the key natural-draft pressure reference in mmH2O.',\n  function: 'Sense and indicate representative firebox draft so pressure direction can be read together with stack-damper movement.',\n  why: 'Arch / radiant-roof draft is commonly the highest-pressure / lowest-draft region and is a key reference for hot-gas containment.',\n  observe: ['Arch / radiant-roof pressure tap', 'Impulse / sensing line', 'PI/PT indication', 'Response to stack-damper movement'],\n  issues: ['Plugged or leaking sensing line', 'Indication error', 'Loss of negative pressure margin', 'Mismatch between indicated and actual draft'],\n  inspection: ['Pressure tap and line', 'Instrument condition', 'Reference-point integrity', 'Comparison with approved plant indication'],\n  related: ['Stack Damper', 'Breeching', 'Stack Analyzers'],\n};\ndetails['Stack Analyzers'] = {\n  group: 'Draft & Flue Gas',\n  location: 'Representative stack sample probe and analyzer cabinet on the upper flue-gas path.',\n  summary: 'Training analyzer package for O2, CO, NOx and SOx interpretation alongside draft.',\n  function: 'Show representative combustion / emissions trends without implying certified CEMS performance or universal alarm limits.',\n  why: 'O2 and CO help interpret excess-air and combustion condition; NOx depends on several firing variables and SOx is strongly fuel-sulfur dependent.',\n  observe: ['Sample-probe location', 'O2 trend', 'CO trend', 'Potential leakage-air influence on stack O2'],\n  issues: ['Tramp-air bias', 'Sample-system plugging', 'Analyzer drift', 'Misinterpreting one analyzer signal without draft context'],\n  inspection: ['Sample probe', 'Sample line', 'Analyzer cabinet', 'Calibration / validation status in the real plant'],\n  related: ['Draft Instruments', 'Stack Damper', 'Stack'],\n};\n\nconst smartMode: Record<string, ViewMode> = {";
app = replaceOnce(app, detailsAnchor, detailsInjection, 'draft details insertion');

app = replaceOnce(
  app,
  "  'Stack Damper': 'normal',\n  Stack: 'normal',",
  "  'Stack Damper': 'normal',\n  'Draft Instruments': 'normal',\n  'Stack Analyzers': 'normal',\n  Stack: 'normal',",
  'draft smart-mode registration'
);

app = replaceOnce(
  app,
  "    else if (selected === 'Breeching' || selected === 'Stack Damper' || selected === 'Stack') setActiveModule('draftStack');",
  "    else if (selected === 'Breeching' || selected === 'Stack Damper' || selected === 'Draft Instruments' || selected === 'Stack Analyzers' || selected === 'Stack') setActiveModule('draftStack');",
  'draft module navigation'
);

app = replaceOnce(
  app,
  "const [damperPosition, setDamperPosition] = useState(18);",
  "const [damperPosition, setDamperPosition] = useState(50);",
  'default damper state'
);
app = app.replace("setDamperPosition(18);", "setDamperPosition(50);");

app = replaceOnce(
  app,
  "  const [damperPosition, setDamperPosition] = useState(50);",
  "  const [damperPosition, setDamperPosition] = useState(50);\n  const [damperTeachingActive, setDamperTeachingActive] = useState(false);\n  const damperTeachingTimer = useRef<number | null>(null);",
  'damper teaching state'
);

app = replaceOnce(
  app,
  "  const detail = details[selected] ?? details['Radiant Tubes'];",
  "  const detail = details[selected] ?? details['Radiant Tubes'];\n  const draftMetrics = getDraftTrainingMetrics(damperPosition);\n  const draftFlowLocked = ['Breeching', 'Stack Damper', 'Draft Instruments', 'Stack Analyzers', 'Stack'].includes(selected);",
  'live draft metrics'
);

const cameraActionAnchor = "  const cameraAction = (action: CameraAction, component = selected) => {\n    issueCameraCommand(action, component);\n  };";
const cameraActionInjection = `${cameraActionAnchor}\n\n  const handleDamperInteraction = useCallback((value: number) => {\n    setDamperPosition(value);\n    setDamperTeachingActive(true);\n    if (damperTeachingTimer.current !== null) window.clearTimeout(damperTeachingTimer.current);\n    damperTeachingTimer.current = window.setTimeout(() => setDamperTeachingActive(false), 1500);\n  }, []);\n\n  useEffect(() => () => {\n    if (damperTeachingTimer.current !== null) window.clearTimeout(damperTeachingTimer.current);\n  }, []);`;
app = replaceOnce(app, cameraActionAnchor, cameraActionInjection, 'damper interaction handler');

app = replaceOnce(
  app,
  "    setMobileInspectorOpen(true);",
  "    setMobileInspectorOpen(name !== 'Stack Damper');",
  'mobile inspector behavior'
);

app = replaceOnce(
  app,
  "          {(selected === 'Breeching' || selected === 'Stack Damper' || selected === 'Stack') && <section className=\"special-study-card draft-study-card\">",
  "          {(selected === 'Breeching' || selected === 'Stack Damper' || selected === 'Draft Instruments' || selected === 'Stack Analyzers' || selected === 'Stack') && <section className=\"special-study-card draft-study-card\">",
  'draft study-card registration'
);

app = replaceOnce(
  app,
  "<button className={flow ? 'active' : ''} onClick={() => setFlow(value => !value)}><Wind size={17} /> Flow</button>",
  "<button className={flow || draftFlowLocked ? 'active' : ''} title={draftFlowLocked ? 'Draft-system gas dynamics remain live for this component' : 'Toggle flow overlays'} onClick={() => { if (!draftFlowLocked) setFlow(value => !value); }}><Wind size={17} /> {draftFlowLocked ? 'Flow Live' : 'Flow'}</button>",
  'locked live draft flow button'
);

app = replaceOnce(
  app,
  "<input aria-label=\"Qualitative stack damper position\" type=\"range\" min=\"0\" max=\"100\" value={damperPosition} onChange={event => setDamperPosition(Number(event.target.value))} />",
  "<input aria-label=\"Qualitative stack damper position\" type=\"range\" min=\"0\" max=\"100\" value={damperPosition} onPointerDown={() => handleDamperInteraction(damperPosition)} onChange={event => handleDamperInteraction(Number(event.target.value))} />",
  'inspector damper control interaction'
);

const mobileActionsAnchor = '          <div className="mobile-panel-actions">';
const mobileControl = [
  "          {selected === 'Stack Damper' && !explode && <div className={`atlas-damper-live ${draftMetrics.state}`}>",
  "            <div className=\"atlas-damper-live-head\"><span>STACK DAMPER · LIVE TRAINING CONTROL</span><b>{draftMetrics.stateLabel}</b></div>",
  "            <div className={`atlas-damper-clones ${damperTeachingActive ? 'active' : ''}`} aria-hidden={!damperTeachingActive}>",
  "              <div className=\"atlas-damper-clone pt\"><span>FROM ARCH PT / PI</span><strong>{draftMetrics.draftMmH2O > 0 ? '+' : ''}{draftMetrics.draftMmH2O.toFixed(1)}</strong><small>mmH₂O</small></div>",
  "              <div className=\"atlas-damper-clone o2\"><span>FROM STACK O₂ ANALYZER</span><strong>{draftMetrics.oxygenPct.toFixed(1)}%</strong><small>{draftMetrics.oxygenLabel}</small></div>",
  "            </div>",
  "            <div className=\"atlas-damper-live-values\"><span><small>DRAFT</small><b>{draftMetrics.draftMmH2O > 0 ? '+' : ''}{draftMetrics.draftMmH2O.toFixed(1)} mmH₂O</b></span><span><small>O₂</small><b>{draftMetrics.oxygenPct.toFixed(1)}%</b></span><span><small>CO*</small><b>{draftMetrics.coPpm} ppm</b></span><span><small>BLADE</small><b>{draftMetrics.bladeAngleDeg}°</b></span></div>",
  "            <div className=\"atlas-damper-live-labels\"><span>OPEN</span><span>MORE CLOSED</span></div>",
  "            <input aria-label=\"Live stack damper restriction\" type=\"range\" min=\"0\" max=\"100\" value={damperPosition} onPointerDown={() => handleDamperInteraction(damperPosition)} onChange={event => handleDamperInteraction(Number(event.target.value))} />",
  "          </div>}",
  mobileActionsAnchor,
].join('\n');
app = replaceOnce(app, mobileActionsAnchor, mobileControl, 'live damper control');

fs.writeFileSync(appPath, app);

// ---- Dedicated Draft page: focus the physical instrument groups, not generic stack cameras ----
const draftPath = 'src/DraftStackPage.tsx';
let draft = fs.readFileSync(draftPath, 'utf8');
draft = replaceOnce(draft, "  if (study === 'instruments') return 'draftPressure';", "  if (study === 'instruments') return 'focusComponent';", 'draft-instrument camera action');
draft = replaceOnce(draft, "  if (study === 'analyzers') return 'draftStack';", "  if (study === 'analyzers') return 'focusComponent';", 'stack-analyzer camera action');
fs.writeFileSync(draftPath, draft);

// ---- Live damper control / teaching-clone styling ----
const cssPath = 'src/index.css';
let css = fs.readFileSync(cssPath, 'utf8');
if (!css.includes('/* atlas damper live instrument response v09 */')) {
  css += `\n\n/* atlas damper live instrument response v09 */\n.atlas-damper-live { display:block; position:absolute; left:50%; transform:translateX(-50%); width:min(470px,calc(100% - 28px)); bottom:86px; z-index:16; padding:10px 12px 9px; border:1px solid rgba(255,122,24,.54); border-radius:12px; background:rgba(3,17,28,.88); backdrop-filter:blur(14px); box-shadow:0 16px 48px rgba(0,0,0,.34); }\n.atlas-damper-live.target{border-color:rgba(77,217,176,.46)}\n.atlas-damper-live.excess{border-color:rgba(255,174,72,.52)}\n.atlas-damper-live.positive{border-color:rgba(255,106,74,.62)}\n.atlas-damper-live-head { display:flex; align-items:center; justify-content:space-between; gap:10px; }\n.atlas-damper-live-head span { color:#ff9a55; font-size:8px; font-weight:800; letter-spacing:.13em; }\n.atlas-damper-live-head b { color:#e9f6fb; font-size:9px; text-align:right; }\n.atlas-damper-live-values{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin:8px 0 5px}.atlas-damper-live-values span{min-width:0;padding:5px 6px;border:1px solid rgba(94,184,214,.18);border-radius:7px;background:rgba(6,28,39,.7)}.atlas-damper-live-values small{display:block;color:#69cfe9;font:700 7px/1 'IBM Plex Mono',monospace;letter-spacing:.08em}.atlas-damper-live-values b{display:block;margin-top:3px;color:#effaff;font-size:9px;white-space:nowrap}.atlas-damper-live-labels { margin:7px 1px 2px; display:flex; justify-content:space-between; color:#96b7c6; font-size:7px; font-weight:800; letter-spacing:.11em; }\n.atlas-damper-live input[type='range'] { width:100%; margin:0; accent-color:#ff7a18; }\n.atlas-damper-clones{position:absolute;left:8px;right:8px;bottom:calc(100% + 8px);display:grid;grid-template-columns:1fr 1fr;gap:7px;pointer-events:none}.atlas-damper-clone{position:relative;padding:8px 9px 7px;border-radius:10px;background:linear-gradient(180deg,rgba(5,25,36,.96),rgba(3,16,24,.93));border:1px solid rgba(103,214,246,.42);box-shadow:0 14px 38px rgba(0,0,0,.35),inset 0 0 22px rgba(83,211,244,.04);opacity:0;transition:opacity .3s ease,transform .45s cubic-bezier(.2,.82,.2,1)}.atlas-damper-clone.pt{transform:translate3d(-30px,-34px,0) scale(.92)}.atlas-damper-clone.o2{transform:translate3d(30px,-52px,0) scale(.92)}.atlas-damper-clones.active .atlas-damper-clone{opacity:1;transform:translate3d(0,0,0) scale(1)}.atlas-damper-clone::before{content:'';position:absolute;left:9px;top:8px;bottom:8px;width:2px;border-radius:2px;background:#6fe1ff;box-shadow:0 0 10px rgba(111,225,255,.62)}.atlas-damper-clone span{display:block;margin-left:8px;color:#75dcfa;font:800 7px/1.1 'IBM Plex Mono',monospace;letter-spacing:.1em}.atlas-damper-clone strong{display:block;margin:4px 0 1px 8px;color:#f5fbff;font-size:18px;line-height:1}.atlas-damper-clone small{display:block;margin-left:8px;color:#8db0bd;font-size:7px;line-height:1.25}.atlas-damper-clone.pt::after,.atlas-damper-clone.o2::after{content:'';position:absolute;top:100%;width:1px;height:12px;background:linear-gradient(rgba(111,225,255,.5),rgba(111,225,255,0))}.atlas-damper-clone.pt::after{left:28px}.atlas-damper-clone.o2::after{right:28px}\n@media (max-width:980px) { .atlas-damper-live { left:14px; right:14px; width:auto; transform:none; bottom:150px; } }\n@media (max-width:520px) { .atlas-damper-live { left:10px; right:10px; bottom:148px; padding:9px 10px 8px; } .atlas-damper-live-head { align-items:flex-start; flex-direction:column; gap:3px; } .atlas-damper-live-head b { font-size:8px; text-align:left; } .atlas-damper-live-values{gap:3px}.atlas-damper-live-values span{padding:4px}.atlas-damper-live-values b{font-size:8px}.atlas-damper-clone strong{font-size:16px}.atlas-damper-clone span,.atlas-damper-clone small{font-size:6px} }\n`;
}
fs.writeFileSync(cssPath, css);
