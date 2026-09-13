import fs from 'node:fs';

function replaceOnce(source, before, after, label) {
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly one anchor, found ${count}`);
  return source.replace(before, after);
}

// CHECKPOINT 23 — Operation State Machine Consolidation + 3D State Synchronization
// Scope: visual hierarchy + explicit 3D-state readout + Simulator handoff.
// Do not change O-00 → O-14 order, safety gates, physics V2, Heater3D geometry or site-specific guardrails.

const operationPath = 'src/OperationPage.tsx';
let operation = fs.readFileSync(operationPath, 'utf8');

operation = replaceOnce(
  operation,
  "import type { CameraAction, CameraCommand, OperationState } from './modelTypes';",
  "import type { CameraAction, CameraCommand, OperationState } from './modelTypes';\nimport './operationStateMachineV1.css';",
  'operation consolidation stylesheet import',
);

operation = replaceOnce(
  operation,
  "  const hotProductsVisible = firingState && !(shutdownState && shutdownView === 'firingRemoved');\n  const flowVisible = processFlowVisible || purgePathVisible || hotProductsVisible;",
  `  const hotProductsVisible = firingState && !(shutdownState && shutdownView === 'firingRemoved');\n  const flowVisible = processFlowVisible || purgePathVisible || hotProductsVisible;\n  const mainFlameVisible = ['mainBurnerLightOff', 'firingStabilization', 'controlledWarmUp', 'normalOperation', 'loadChange'].includes(state) || (state === 'controlledShutdown' && shutdownView !== 'firingRemoved');\n  const pilotVisualState = state === 'pilotIgnition'\n    ? { label: 'IGNITION CUE', tone: 'caution' }\n    : state === 'pilotProven'\n      ? pilotOutcome === 'normal'\n        ? { label: 'PROVEN CUE', tone: 'live' }\n        : pilotOutcome === 'notEstablished'\n          ? { label: 'NOT ESTABLISHED', tone: 'blocked' }\n          : { label: 'VISIBLE · NOT PROVEN', tone: 'blocked' }\n      : { label: 'NOT SHOWN', tone: 'idle' };\n  const operationVisualStates = [\n    { key: 'process', title: 'PROCESS FLOW', label: processFlowVisible ? 'VISIBLE' : 'NOT SHOWN', tone: processFlowVisible ? 'live' : 'idle' },\n    { key: 'purge', title: 'PURGE CUE', label: state === 'purgeActive' ? 'ACTIVE' : state === 'purgeComplete' ? 'REFERENCE' : 'INACTIVE', tone: state === 'purgeActive' ? 'live' : state === 'purgeComplete' ? 'caution' : 'idle' },\n    { key: 'pilot', title: 'PILOT CUE', label: pilotVisualState.label, tone: pilotVisualState.tone },\n    { key: 'main', title: 'MAIN FLAME', label: mainFlameVisible ? 'VISIBLE' : 'ABSENT IN 3D', tone: mainFlameVisible ? 'live' : 'idle' },\n    { key: 'hotgas', title: 'HOT GAS', label: hotProductsVisible ? 'VISIBLE' : 'NOT SHOWN', tone: hotProductsVisible ? 'live' : 'idle' },\n  ];`,
  'operation visual-state derivation',
);

operation = replaceOnce(
  operation,
  `          <div className="viewer-kicker operation-kicker"><i /> OPERATION 3D <span>Training state visualization · Drag to rotate · Wheel / pinch to zoom</span></div>`,
  `          <div className="viewer-kicker operation-kicker"><i /> OPERATION 3D <span>Training state visualization · Drag to rotate · Wheel / pinch to zoom</span></div>\n          {!abnormalLabOpen && <div className="operation-system-strip" aria-label="3D visual system state">{operationVisualStates.map(item => <span key={item.key} className={item.tone}><small>{item.title}</small><b>{item.label}</b></span>)}</div>}`,
  '3D visual-state strip',
);

operation = replaceOnce(
  operation,
  `          {!abnormalLabOpen && state === 'normalOperation' && <div className="operation-zone-badge firing proven"><b>{normalTopic.title}</b><span>{normalTopic.body}</span></div>}`,
  `          {!abnormalLabOpen && state === 'normalOperation' && <div className="operation-zone-badge firing proven"><b>{normalTopic.title}</b><span>{normalTopic.body}</span></div>}\n          {!abnormalLabOpen && state === 'normalOperation' && <button className="operation-simulator-cta" onClick={() => onNavigate('simulator')}><span><small>NEXT LEARNING TOOL</small> Combustion & Draft Simulator</span><ChevronRight size={15} /></button>}`,
  'normal-operation simulator handoff',
);

operation = replaceOnce(
  operation,
  `          <section className="radiant-tech-section"><span>WHAT CHANGES</span><ul>{copy.changes.map(item => <li key={item}>{item}</li>)}</ul></section>`,
  `          <section className="radiant-tech-section operation-right-changes"><span>WHAT CHANGES</span><ul>{copy.changes.map(item => <li key={item}>{item}</li>)}</ul></section>`,
  'right-panel duplicate WHAT CHANGES marker',
);

fs.writeFileSync(operationPath, operation);
console.log('[operation-state-machine-consolidation] O-00 → O-14 preserved; visual state strip + simulator handoff applied.');
