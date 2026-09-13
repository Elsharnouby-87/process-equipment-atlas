import fs from 'node:fs';

function replaceOnce(source, before, after, label) {
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly one anchor, found ${count}`);
  return source.replace(before, after);
}

// CHECKPOINT 21 — expose the physics-based causal kernel without changing
// the established burner-study navigation or 3D interaction architecture.

const burnerPath = 'src/BurnerPage.tsx';
let burner = fs.readFileSync(burnerPath, 'utf8');

burner = replaceOnce(
  burner,
  "import './simulatorV1.css';",
  "import './simulatorV1.css';\nimport './simulatorV2.css';",
  'simulator V2 styles import',
);

burner = replaceOnce(
  burner,
  '<div className="burner-interaction-head"><span>INTEGRATED COMBUSTION + DRAFT SIMULATOR V1</span><Gauge size={17} /></div>',
  '<div className="burner-interaction-head"><span>PHYSICS-BASED COMBUSTION + DRAFT SIMULATOR V2</span><Gauge size={17} /></div>',
  'simulator V2 heading',
);

burner = replaceOnce(
  burner,
  `{controlActive && <div className={\`burner-sim-live \${metrics.state}\`}>\n            <span><small>FUEL</small><b>{fuelGasPosition.toFixed(0)}%</b></span>\n            <span><small>AIR REGISTER</small><b>{airRegisterPosition.toFixed(0)}%</b></span>\n            <span><small>ARCH DRAFT</small><b>{metrics.draftMmH2O > 0 ? '+' : ''}{metrics.draftMmH2O.toFixed(1)} <i>mmH₂O</i></b></span>\n            <span><small>O₂</small><b>{metrics.oxygenPct.toFixed(1)}%</b></span>\n            <span><small>CO*</small><b>{metrics.coPpm} <i>ppm</i></b></span>\n            <em>{metrics.stateLabel}</em>\n          </div>}`,
  `{controlActive && <div className={\`burner-sim-live simulator-v2-live \${metrics.state}\`}>\n            <span><small>HEAT INPUT</small><b>{metrics.heatInputPctRef}<i>% REF</i></b></span>\n            <span><small>ACTUAL AIR</small><b>{metrics.actualAirPctStoich}<i>% STOICH</i></b></span>\n            <span><small>ARCH DRAFT</small><b>{metrics.draftMmH2O > 0 ? '+' : ''}{metrics.draftMmH2O.toFixed(1)} <i>mmH₂O</i></b></span>\n            <span><small>RAD O₂</small><b>{metrics.radiantOxygenPct.toFixed(1)}%</b></span>\n            <span><small>STACK O₂</small><b>{metrics.stackOxygenPct.toFixed(1)}%</b></span>\n            <span><small>CO*</small><b>{metrics.coPpm} <i>ppm</i></b></span>\n            <em>{metrics.stateLabel}</em>\n          </div>}`,
  'desktop V2 live readout',
);

burner = replaceOnce(
  burner,
  `<span className="burner-sim-mobile-readouts" aria-label="Live simulator readings"><b><small>DRAFT</small>{metrics.draftMmH2O > 0 ? '+' : ''}{metrics.draftMmH2O.toFixed(1)}<i>mmH₂O</i></b><b><small>O₂</small>{metrics.oxygenPct.toFixed(1)}<i>%</i></b><b><small>CO</small>{metrics.coPpm}<i>ppm*</i></b></span>`,
  `<span className="burner-sim-mobile-readouts" aria-label="Live simulator readings"><b><small>DRAFT</small>{metrics.draftMmH2O > 0 ? '+' : ''}{metrics.draftMmH2O.toFixed(1)}<i>mmH₂O</i></b><b><small>RAD O₂</small>{metrics.radiantOxygenPct.toFixed(1)}<i>%</i></b><b><small>CO</small>{metrics.coPpm}<i>ppm*</i></b></span>`,
  'mobile radiant O2 readout',
);

burner = replaceOnce(
  burner,
  `<RangeControl label="Stack damper restriction" value={damperPosition} onChange={setDamperPosition} left="OPEN" right="MORE CLOSED" />\n              <div className="burner-sim-preset-row sim-v1">`,
  `<RangeControl label="Stack damper restriction" value={damperPosition} onChange={setDamperPosition} left="OPEN" right="MORE CLOSED" />\n              <div className="burner-v2-mobile-metrics" aria-label="Physics simulator outputs"><span><small>HEAT INPUT</small><b>{metrics.heatInputPctRef}% ref</b></span><span><small>ACTUAL AIR</small><b>{metrics.actualAirPctStoich}% stoich</b></span><span><small>EXCESS AIR</small><b>{metrics.excessAirPct}%</b></span><span><small>STACK O₂</small><b>{metrics.stackOxygenPct.toFixed(1)}%</b></span><span><small>STACK T*</small><b>{metrics.stackTemperatureC}°C</b></span><span><small>LAMBDA</small><b>{metrics.lambda.toFixed(2)}</b></span></div>\n              <div className="burner-sim-preset-row sim-v1">`,
  'mobile V2 engineering metrics',
);

burner = replaceOnce(
  burner,
  `<div className="burner-interaction-metrics"><div><small>DRAFT</small><strong>{metrics.draftMmH2O > 0 ? '+' : ''}{metrics.draftMmH2O.toFixed(1)}</strong><em>mmH₂O</em></div><div><small>O₂</small><strong>{metrics.oxygenPct.toFixed(1)}</strong><em>% · {metrics.oxygenLabel}</em></div><div><small>CO*</small><strong>{metrics.coPpm}</strong><em>ppm · {metrics.coLabel}</em></div><div className="flame-metric"><small>FLAME RESPONSE</small><strong>{metrics.flameLabel}</strong><em>A/F index {metrics.airFuelIndex.toFixed(2)}</em></div></div>`,
  `<div className="burner-interaction-metrics simulator-v2-grid"><div><small>HEAT INPUT</small><strong>{metrics.heatInputPctRef}</strong><em>% of reference</em></div><div><small>ACTUAL AIR</small><strong>{metrics.actualAirPctStoich}</strong><em>% of stoichiometric</em></div><div><small>EXCESS AIR</small><strong>{metrics.excessAirPct}</strong><em>% · λ {metrics.lambda.toFixed(2)}</em></div><div><small>ARCH DRAFT</small><strong>{metrics.draftMmH2O > 0 ? '+' : ''}{metrics.draftMmH2O.toFixed(1)}</strong><em>mmH₂O</em></div><div><small>RADIANT O₂</small><strong>{metrics.radiantOxygenPct.toFixed(1)}</strong><em>% · {metrics.oxygenLabel}</em></div><div><small>STACK O₂</small><strong>{metrics.stackOxygenPct.toFixed(1)}</strong><em>% · tramp-air sensitive</em></div><div><small>CO*</small><strong>{metrics.coPpm}</strong><em>ppm · {metrics.coLabel}</em></div><div><small>STACK T*</small><strong>{metrics.stackTemperatureC}</strong><em>°C · representative</em></div></div><div className="burner-v2-flame-line"><small>FLAME RESPONSE</small><b>{metrics.flameLabel}</b><em>Solver {metrics.converged ? 'converged' : 'bounded'} in {metrics.iterations} iterations · A/F index {metrics.airFuelIndex.toFixed(2)}</em></div>`,
  'desktop V2 engineering metrics',
);

burner = replaceOnce(
  burner,
  `<div className="burner-sheet-metrics"><b>{metrics.draftMmH2O.toFixed(1)} mmH₂O</b><b>O₂ {metrics.oxygenPct.toFixed(1)}%</b><b>CO {metrics.coPpm} ppm*</b></div><p className="sheet-note">Fuel-valve and air-register percentages are relative training commands — not calibrated fuel or air flows.</p>`,
  `<div className="burner-sheet-metrics simulator-v2-sheet"><b>Heat {metrics.heatInputPctRef}% ref</b><b>Air {metrics.actualAirPctStoich}% stoich</b><b>Excess Air {metrics.excessAirPct}%</b><b>Draft {metrics.draftMmH2O > 0 ? '+' : ''}{metrics.draftMmH2O.toFixed(1)} mmH₂O</b><b>Radiant O₂ {metrics.radiantOxygenPct.toFixed(1)}%</b><b>Stack O₂ {metrics.stackOxygenPct.toFixed(1)}%</b><b>CO {metrics.coPpm} ppm*</b><b>Stack T* {metrics.stackTemperatureC}°C</b></div><p className="sheet-note">V2 solves a representative causal loop: draft → burner air → λ → flue-gas flow / temperature → chimney pull + pressure losses → draft. Fuel-valve and register percentages remain commands, not calibrated flows.</p>`,
  'mobile details V2 outputs',
);

burner = replaceOnce(
  burner,
  `<div className="burner-mobile-summary"><Flame size={17} /><span>{controlActive ? \`${'${metrics.stateLabel}'} · O₂ ${'${metrics.oxygenPct.toFixed(1)}'}%\` : copy.title}</span></div>`,
  `<div className="burner-mobile-summary"><Flame size={17} /><span>{controlActive ? \`${'${metrics.stateLabel}'} · Rad O₂ ${'${metrics.radiantOxygenPct.toFixed(1)}'}%\` : copy.title}</span></div>`,
  'mobile V2 summary label',
);

burner = replaceOnce(
  burner,
  `<p className="burner-sim-boundary"><b>Representative training model.</b> Fuel-valve % is not fuel flow; register % is not air flow; damper % is not draft. The model teaches directional coupling between fuel demand, air admission, draft, O₂, CO and flame response only.</p>`,
  `<p className="burner-sim-boundary"><b>Representative physics-based training model.</b> V2 solves the causal natural-draft loop iteratively. Reference stack height, fuel AFR, stack temperature and the balanced point are transparent calibration assumptions — not plant limits, burner guarantees or a heater heat balance.</p>`,
  'V2 model boundary copy',
);

fs.writeFileSync(burnerPath, burner);
