import fs from 'node:fs';

function replaceOnce(source, before, after, label) {
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly one anchor, found ${count}`);
  return source.replace(before, after);
}

// CHECKPOINT 19 — integrate the existing fuel / air / draft training controls
// into one simulator layer and make all three physical controls respond in 3D.
// This remains a representative training model, not a plant operating model.

const heaterPath = 'src/Heater3D.tsx';
let heater = fs.readFileSync(heaterPath, 'utf8');

heater = replaceOnce(
  heater,
  "        addValveWheel(burners, new THREE.Vector3(x - 0.78, 3.72, z - 0.28), 0.24, yellow, 'y');",
  `        const fuelValveWheel = new THREE.Group();
        fuelValveWheel.position.set(x - 0.78, 3.72, z - 0.28);
        fuelValveWheel.userData.burnerControl = 'fuelValveWheel';
        fuelValveWheel.userData.fuelValveBaseYaw = 0;
        addValveWheel(fuelValveWheel, new THREE.Vector3(0, 0, 0), 0.24, yellow, 'y');
        burners.add(fuelValveWheel);`,
  'fuel valve wheel control group'
);

heater = replaceOnce(
  heater,
  "      flameMaterials.forEach((material, index) => {",
  `      if (activeBurnerControl && animatedBurners) {
        animatedBurners.children.forEach(child => {
          if (!child.userData.heroBurner || child.userData.burnerControl !== 'fuelValveWheel') return;
          const baseYaw = (child.userData.fuelValveBaseYaw as number | undefined) ?? 0;
          const commandedTurns = (fuelGasPositionRef.current / 100) * Math.PI * 1.55;
          child.rotation.y = THREE.MathUtils.lerp(child.rotation.y, baseYaw + commandedTurns, 0.11);
        });
      }

      flameMaterials.forEach((material, index) => {`,
  'fuel valve wheel animation'
);

fs.writeFileSync(heaterPath, heater);

const burnerPath = 'src/BurnerPage.tsx';
let burner = fs.readFileSync(burnerPath, 'utf8');

burner = replaceOnce(
  burner,
  "import './burnerTraining.css';",
  "import './burnerTraining.css';\nimport './simulatorV1.css';",
  'simulator V1 styles import'
);

burner = replaceOnce(
  burner,
  '<div className="burner-sim-preset-row"><button onClick={() => applyPreset(\'balanced\')}>Balanced</button><button onClick={() => applyPreset(\'airStarved\')}>Air-Starved</button><button onClick={() => applyPreset(\'excessAir\')}>Excess Air</button></div>',
  '<div className="burner-sim-preset-row sim-v1"><button onClick={() => applyPreset(\'balanced\')}>Balanced</button><button onClick={() => applyPreset(\'airStarved\')}>Air-Starved</button><button onClick={() => applyPreset(\'fuelRich\')}>Fuel-Rich</button><button onClick={() => applyPreset(\'excessAir\')}>Excess Air</button><button onClick={() => applyPreset(\'draftConcern\')}>Draft Concern</button></div><button className="burner-sim-reset" onClick={resetInteraction}><Rotate3D size={13} /> Reset to Balanced</button>',
  'mobile simulator presets'
);

burner = replaceOnce(
  burner,
  '<div className="burner-interaction-head"><span>SIMPLIFIED COMBUSTION INTERACTION LAB</span><Gauge size={17} /></div>',
  '<div className="burner-interaction-head"><span>INTEGRATED COMBUSTION + DRAFT SIMULATOR V1</span><Gauge size={17} /></div>',
  'simulator heading'
);

burner = replaceOnce(
  burner,
  '<div><small>FLAME</small><strong>{metrics.airFuelIndex.toFixed(2)}</strong><em>relative air/fuel index</em></div>',
  '<div className="flame-metric"><small>FLAME RESPONSE</small><strong>{metrics.flameLabel}</strong><em>A/F index {metrics.airFuelIndex.toFixed(2)}</em></div>',
  'flame response metric'
);

burner = replaceOnce(
  burner,
  '<div className="burner-sim-preset-row desktop"><button onClick={() => applyPreset(\'balanced\')}>Balanced</button><button onClick={() => applyPreset(\'airStarved\')}>Air-Starved</button><button onClick={() => applyPreset(\'excessAir\')}>Excess Air</button><button onClick={() => applyPreset(\'higherFiring\')}>Higher Firing</button></div>\n            <p className="burner-sim-boundary">Three-variable training experiment. Valve % is not fuel flow; register % is not air flow; damper % is not draft. The model teaches direction and coupling only.</p>',
  '<div className="burner-sim-preset-row desktop sim-v1"><button onClick={() => applyPreset(\'balanced\')}>Balanced</button><button onClick={() => applyPreset(\'airStarved\')}>Air-Starved</button><button onClick={() => applyPreset(\'fuelRich\')}>Fuel-Rich</button><button onClick={() => applyPreset(\'excessAir\')}>Excess Air</button><button onClick={() => applyPreset(\'draftConcern\')}>Draft Concern</button></div>\n            <button className="burner-sim-reset desktop" onClick={resetInteraction}><Rotate3D size={13} /> Reset to Balanced</button>\n            <p className="burner-sim-boundary"><b>Representative training model.</b> Fuel-valve % is not fuel flow; register % is not air flow; damper % is not draft. The model teaches directional coupling between fuel demand, air admission, draft, O₂, CO and flame response only.</p>',
  'desktop simulator presets and boundary'
);

burner = replaceOnce(
  burner,
  '<section className="burner-tech-section burner-reference-note"><span>REFERENCE-BASED COUPLING</span><p>For natural-draft heaters, the burner air register and stack damper are adjusted together to manage excess O₂ and draft. Reducing air at unchanged stack-damper position can reduce total gas flow / friction loss and make draft more negative; increasing fuel without adequate air drives the training model toward low O₂ and higher CO.</p></section>',
  '<section className="burner-tech-section burner-reference-note"><span>REFERENCE-BASED COUPLING</span><p>For natural-draft heaters, the burner air register and stack damper are adjusted together to manage excess O₂ and draft. Reducing air at unchanged stack-damper position can reduce total gas flow / friction loss and make draft more negative; increasing fuel without adequate air drives O₂ downward and CO upward. Stable operation also depends on acceptable flame pattern and flame-to-tube clearance.</p></section>',
  'reference coupling copy'
);

fs.writeFileSync(burnerPath, burner);
