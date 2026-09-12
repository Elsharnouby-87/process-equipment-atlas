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
  `${clockAnchor}\n      const showDraftTrainingFlow = Boolean(flowEnabledRef.current && (draftStudyRef.current || ['Breeching', 'Stack Damper', 'Stack', 'Draft Instruments', 'Stack Analyzers'].includes(selectedRef.current)));\n      draftTrainingRuntime.update(damperPositionRef.current, t, showDraftTrainingFlow);`,
  'draft runtime animation'
);

fs.writeFileSync(heaterPath, source);

// ---- Patch Atlas app registry + mobile damper interaction ----
const appPath = 'src/App.tsx';
let app = fs.readFileSync(appPath, 'utf8');

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
  "  const detail = details[selected] ?? details['Radiant Tubes'];",
  "  const detail = details[selected] ?? details['Radiant Tubes'];\n  const draftMetrics = getDraftTrainingMetrics(damperPosition);",
  'live draft metrics'
);

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

const mobileActionsAnchor = '          <div className="mobile-panel-actions">';
const mobileControl = [
  "          {selected === 'Stack Damper' && !explode && <div className=\"atlas-damper-live\">",
  "            <div className=\"atlas-damper-live-head\"><span>STACK DAMPER · LIVE TRAINING CONTROL</span><b>{draftMetrics.draftMmH2O > 0 ? '+' : ''}{draftMetrics.draftMmH2O.toFixed(1)} mmH₂O · O₂ {draftMetrics.oxygenPct.toFixed(1)}%</b></div>",
  "            <div className=\"atlas-damper-live-labels\"><span>OPEN</span><span>MORE CLOSED</span></div>",
  "            <input aria-label=\"Live stack damper restriction\" type=\"range\" min=\"0\" max=\"100\" value={damperPosition} onChange={event => setDamperPosition(Number(event.target.value))} />",
  "          </div>}",
  mobileActionsAnchor,
].join('\n');
app = replaceOnce(app, mobileActionsAnchor, mobileControl, 'mobile live damper control');

fs.writeFileSync(appPath, app);

// ---- Dedicated Draft page: focus the new physical instrument groups, not generic stack cameras ----
const draftPath = 'src/DraftStackPage.tsx';
let draft = fs.readFileSync(draftPath, 'utf8');
draft = replaceOnce(draft, "  if (study === 'instruments') return 'draftPressure';", "  if (study === 'instruments') return 'focusComponent';", 'draft-instrument camera action');
draft = replaceOnce(draft, "  if (study === 'analyzers') return 'draftStack';", "  if (study === 'analyzers') return 'focusComponent';", 'stack-analyzer camera action');
fs.writeFileSync(draftPath, draft);

// ---- Mobile-only unobstructed damper control ----
const cssPath = 'src/index.css';
let css = fs.readFileSync(cssPath, 'utf8');
if (!css.includes('/* atlas mobile damper live control */')) {
  css += `\n\n/* atlas mobile damper live control */\n.atlas-damper-live { display: none; }\n@media (max-width: 980px) {\n  .atlas-damper-live { display: block; position: absolute; left: 14px; right: 14px; bottom: 150px; z-index: 16; padding: 10px 12px 9px; border: 1px solid rgba(255, 122, 24, .54); border-radius: 12px; background: rgba(3, 17, 28, .87); backdrop-filter: blur(14px); box-shadow: 0 16px 48px rgba(0, 0, 0, .34); }\n  .atlas-damper-live-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }\n  .atlas-damper-live-head span { color: #ff9a55; font-size: 8px; font-weight: 800; letter-spacing: .13em; }\n  .atlas-damper-live-head b { color: #e9f6fb; font-size: 9px; white-space: nowrap; }\n  .atlas-damper-live-labels { margin: 7px 1px 2px; display: flex; justify-content: space-between; color: #96b7c6; font-size: 7px; font-weight: 800; letter-spacing: .11em; }\n  .atlas-damper-live input[type='range'] { width: 100%; margin: 0; accent-color: #ff7a18; }\n}\n@media (max-width: 520px) {\n  .atlas-damper-live { left: 10px; right: 10px; bottom: 148px; padding: 9px 10px 8px; }\n  .atlas-damper-live-head { align-items: flex-start; flex-direction: column; gap: 3px; }\n  .atlas-damper-live-head b { font-size: 8px; }\n}\n`;
}
fs.writeFileSync(cssPath, css);
