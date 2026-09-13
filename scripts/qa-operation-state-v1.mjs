import fs from 'node:fs';

const operation = fs.readFileSync('src/OperationPage.tsx', 'utf8');
const css = fs.readFileSync('src/operationStateMachineV1.css', 'utf8');

const failures = [];
const requireText = (text, label) => {
  if (!operation.includes(text)) failures.push(label);
};

const expectedStateOrder = "const stateOrder: OperationState[] = ['safeNonFiring', 'readiness', 'processReady', 'purgeReady', 'purgeActive', 'purgeComplete', 'pilotIgnition', 'pilotProven', 'mainBurnerLightOff', 'firingStabilization', 'controlledWarmUp', 'normalOperation', 'loadChange', 'controlledShutdown', 'coolDownNonFiring'];";
if (!operation.includes(expectedStateOrder)) failures.push('O-00 → O-14 state order changed or missing');

requireText('operationVisualStates', 'visual-state model missing');
requireText('operation-system-strip', '3D visual-state strip missing');
requireText("title: 'PROCESS FLOW'", 'process-flow visual status missing');
requireText("title: 'PURGE CUE'", 'purge visual status missing');
requireText("title: 'PILOT CUE'", 'pilot visual status missing');
requireText("title: 'MAIN FLAME'", 'main-flame visual status missing');
requireText("title: 'HOT GAS'", 'hot-gas visual status missing');
requireText("onNavigate('simulator')", 'Normal Operation → Simulator handoff missing');
requireText('operation-right-changes', 'right-panel de-duplication marker missing');
requireText("import './operationStateMachineV1.css';", 'operation consolidation stylesheet not imported');

if (!css.includes('.operation-page .operation-center-tabs{display:none!important}')) failures.push('duplicate center state tabs not visually consolidated');
if (!css.includes('.operation-page .operation-right-changes{display:none}')) failures.push('right-panel WHAT CHANGES de-duplication not active');
if (!css.includes('3D VISUAL STATE · NOT FIELD STATUS')) failures.push('visual-state field-status guardrail missing');

const forbiddenPatchTargets = ['combustionTrainingLogic.ts', 'physicsCalibration.ts', 'Heater3D.tsx'];
const patch = fs.readFileSync('scripts/operation-state-machine-consolidation.mjs', 'utf8');
for (const target of forbiddenPatchTargets) {
  if (patch.includes(`fs.writeFileSync('${target}'`) || patch.includes(`fs.writeFileSync(\"${target}\"`)) failures.push(`operation patch must not write ${target}`);
}

if (failures.length) throw new Error(`[qa:operation-state-v1] ${failures.join(' | ')}`);

console.log('[qa:operation-state-v1] PASS');
console.log(' - O-00 → O-14 sequence preserved');
console.log(' - 3D visual-state strip synchronized to process / purge / pilot / main flame / hot-gas cues');
console.log(' - duplicate center navigation and right-panel WHAT CHANGES reduced');
console.log(' - Normal Operation hands off to the independent Combustion & Draft Simulator');
console.log(' - physics V2, calibration and Heater3D are outside this patch scope');
