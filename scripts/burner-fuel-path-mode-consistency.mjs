import fs from 'node:fs';

function replaceOnce(source, before, after, label) {
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly one anchor, found ${count}`);
  return source.replace(before, after);
}

// CHECKPOINT 18 — make the Burner fuel-path teaching cue consistent across
// Atlas modes and dedicated Burner study views. Exploded mode is explicitly a
// reference path, not a claim that gas is flowing through a dismantled burner.

const heaterPath = 'src/Heater3D.tsx';
let source = fs.readFileSync(heaterPath, 'utf8');

source = replaceOnce(
  source,
  "        } else if (burnerFlow) child.visible = contextualBurnerExplode ? burnerFlow === 'fuel' : Boolean(burnerStudyMode) && ((burnerStudyMode === 'external' || burnerStudyMode === 'internal') || burnerFlow === 'fuel');",
  "        } else if (burnerFlow) child.visible = contextualBurnerExplode ? burnerFlow === 'fuel' : (!burnerStudyMode && selectedRef.current === 'Burners') ? burnerFlow === 'fuel' : Boolean(burnerStudyMode) && ((burnerStudyMode === 'external' || burnerStudyMode === 'internal') || burnerFlow === 'fuel');",
  'atlas burner fuel visibility across modes'
);

const oldExplodedBlock = `      if (activeBurnerStudy === 'exploded') {\n        for (const p of burnerFuelParticles) {\n          const fuelSpeed = activeBurnerControl ? combustionTrainingMetrics.fuelParticleSpeed : 1;\n          const u = (p.userData.t + t * 0.062 * fuelSpeed) % 1;\n          const point = heroFuelPath.getPoint(THREE.MathUtils.clamp(u, 0, 0.9999));\n          p.position.copy(point).add(new THREE.Vector3(0.20, 0.10, 0.18));\n          p.visible = true;\n          p.scale.setScalar(0.92 + Math.sin(t * 6.0 + (p.userData.t as number) * Math.PI * 2) * 0.10);\n        }\n        for (const p of burnerFuelGlowParticles) {\n          const u = (p.userData.t + t * 0.062) % 1;\n          const point = heroFuelPath.getPoint(THREE.MathUtils.clamp(u, 0, 0.9999));\n          p.position.copy(point).add(new THREE.Vector3(0.20, 0.10, 0.18));\n          p.visible = true;\n          p.scale.setScalar(0.96 + Math.sin(t * 5.4 + (p.userData.t as number) * Math.PI * 2) * 0.10);\n        }\n      }`;

const newExplodedBlock = `      const atlasBurnerFuelPathActive = !activeBurnerStudy && selectedRef.current === 'Burners';\n      const atlasBurnerReferencePathActive = atlasBurnerFuelPathActive && explode;\n      const referenceFuelPathActive = activeBurnerStudy === 'exploded' || atlasBurnerReferencePathActive;\n      burnerFuelMat.color.set(referenceFuelPathActive ? '#d8b263' : '#ffd24a');\n      burnerFuelMat.opacity = referenceFuelPathActive ? 0.72 : 1;\n      burnerFuelGlowMat.color.set(referenceFuelPathActive ? '#f0d69a' : '#fff2a3');\n      burnerFuelGlowMat.opacity = referenceFuelPathActive ? 0.10 : 0.24;\n\n      if (activeBurnerStudy === 'exploded') {\n        for (const p of burnerFuelParticles) {\n          const u = (p.userData.t + t * 0.030) % 1;\n          const point = heroFuelPath.getPoint(THREE.MathUtils.clamp(u, 0, 0.9999));\n          p.position.copy(point).add(new THREE.Vector3(0.20, 0.10, 0.18));\n          p.visible = true;\n          p.scale.setScalar(0.76 + Math.sin(t * 4.2 + (p.userData.t as number) * Math.PI * 2) * 0.06);\n        }\n        for (const p of burnerFuelGlowParticles) {\n          const u = (p.userData.t + t * 0.030) % 1;\n          const point = heroFuelPath.getPoint(THREE.MathUtils.clamp(u, 0, 0.9999));\n          p.position.copy(point).add(new THREE.Vector3(0.20, 0.10, 0.18));\n          p.visible = true;\n          p.scale.setScalar(0.80 + Math.sin(t * 3.8 + (p.userData.t as number) * Math.PI * 2) * 0.05);\n        }\n      }\n\n      if (atlasBurnerFuelPathActive) {\n        const speed = atlasBurnerReferencePathActive ? 0.030 : 0.075;\n        const coreScale = atlasBurnerReferencePathActive ? 0.76 : 1.00;\n        const glowScale = atlasBurnerReferencePathActive ? 0.80 : 1.00;\n        for (const p of burnerFuelParticles) {\n          const u = (p.userData.t + t * speed) % 1;\n          const point = heroFuelPath.getPoint(THREE.MathUtils.clamp(u, 0, 0.9999));\n          p.position.copy(point).add(new THREE.Vector3(0.18, 0.09, 0.16));\n          p.visible = true;\n          p.scale.setScalar(coreScale * (1 + Math.sin(t * (atlasBurnerReferencePathActive ? 4.2 : 7.0) + (p.userData.t as number) * Math.PI * 2) * (atlasBurnerReferencePathActive ? 0.06 : 0.14)));\n        }\n        for (const p of burnerFuelGlowParticles) {\n          const u = (p.userData.t + t * speed) % 1;\n          const point = heroFuelPath.getPoint(THREE.MathUtils.clamp(u, 0, 0.9999));\n          p.position.copy(point).add(new THREE.Vector3(0.18, 0.09, 0.16));\n          p.visible = true;\n          p.scale.setScalar(glowScale * (1 + Math.sin(t * (atlasBurnerReferencePathActive ? 3.8 : 6.2) + (p.userData.t as number) * Math.PI * 2) * (atlasBurnerReferencePathActive ? 0.05 : 0.12)));\n        }\n      }`;

source = replaceOnce(source, oldExplodedBlock, newExplodedBlock, 'live vs reference fuel path behavior');
fs.writeFileSync(heaterPath, source);

const appPath = 'src/App.tsx';
let app = fs.readFileSync(appPath, 'utf8');

app = replaceOnce(
  app,
  "  const draftFlowLocked = ['Breeching', 'Stack Damper', 'Draft Instruments', 'Stack Analyzers', 'Stack'].includes(selected);",
  "  const draftFlowLocked = ['Breeching', 'Stack Damper', 'Draft Instruments', 'Stack Analyzers', 'Stack'].includes(selected);\n  const burnerFuelPathLocked = selected === 'Burners';",
  'burner fuel-path live lock'
);

app = replaceOnce(
  app,
  '<Heater3D mode={mode} selected={selected} labels={labels} flow={flow} explode={explode} contextMode={contextMode} damperPosition={damperPosition} cameraCommand={cameraCommand} onSelect={chooseComponent} />',
  '<Heater3D mode={mode} selected={selected} labels={labels} flow={flow || draftFlowLocked || burnerFuelPathLocked} explode={explode} contextMode={contextMode} damperPosition={damperPosition} cameraCommand={cameraCommand} onSelect={chooseComponent} />',
  'atlas burner fuel path always supplied to 3D'
);

app = replaceOnce(
  app,
  "<button className={flow || draftFlowLocked ? 'active' : ''} title={draftFlowLocked ? 'Draft-system gas dynamics remain live for this component' : 'Toggle flow overlays'} onClick={() => { if (!draftFlowLocked) setFlow(value => !value); }}><Wind size={17} /> {draftFlowLocked ? 'Flow Live' : 'Flow'}</button>",
  "<button className={flow || draftFlowLocked || burnerFuelPathLocked ? 'active' : ''} title={burnerFuelPathLocked ? 'Burner fuel-path teaching cue remains visible across view modes' : draftFlowLocked ? 'Draft-system gas dynamics remain live for this component' : 'Toggle flow overlays'} onClick={() => { if (!draftFlowLocked && !burnerFuelPathLocked) setFlow(value => !value); }}><Wind size={17} /> {burnerFuelPathLocked ? (explode ? 'Reference Path' : 'Fuel Path Live') : draftFlowLocked ? 'Flow Live' : 'Flow'}</button>",
  'atlas flow button communicates burner fuel path state'
);

fs.writeFileSync(appPath, app);

const burnerPagePath = 'src/BurnerPage.tsx';
let burnerPage = fs.readFileSync(burnerPagePath, 'utf8');

burnerPage = replaceOnce(
  burnerPage,
  "  const [flow, setFlow] = useState(true);",
  "  const [, setFlow] = useState(true);",
  'remove unused burner flow value after path lock'
);

burnerPage = replaceOnce(
  burnerPage,
  '            flow={controlActive ? true : flow}',
  '            flow={true}',
  'dedicated burner study fuel-path continuity'
);

burnerPage = replaceOnce(
  burnerPage,
  "          {(controlActive || flow) && <div className=\"burner-flow-legend\">{(study === 'external' || study === 'internal') && <span className=\"air\">Combustion Air</span>}<span className=\"fuel\">{study === 'exploded' ? 'Fuel Path' : 'Fuel Gas'}</span>{(study === 'external' || study === 'internal') && <span className=\"hot\">Hot Products</span>}</div>}",
  "          <div className=\"burner-flow-legend\">{(study === 'external' || study === 'internal') && <span className=\"air\">Combustion Air</span>}<span className=\"fuel\">{study === 'exploded' ? 'Reference Fuel Path' : study === 'pilot' ? 'Pilot Fuel Path' : 'Fuel Gas'}</span>{(study === 'external' || study === 'internal') && <span className=\"hot\">Hot Products</span>}</div>",
  'dedicated burner legend mode distinction'
);

burnerPage = replaceOnce(
  burnerPage,
  "<button className={controlActive || flow ? 'active' : ''} title={controlActive ? 'Burner flow remains live while the interaction lab is active' : 'Toggle burner flow'} onClick={() => { if (!controlActive) setFlow(value => !value); }}><Wind size={17} /> {controlActive ? 'Flow Live' : 'Flow'}</button>",
  "<button className=\"active\" title={study === 'exploded' ? 'Reference path shows the installed fuel route while the assembly is separated' : study === 'pilot' ? 'Pilot fuel-path teaching cue remains visible in this study' : 'Burner flow remains live in this study'} onClick={() => setFlow(true)}><Wind size={17} /> {study === 'exploded' ? 'Reference Path' : study === 'pilot' ? 'Pilot Fuel Path' : 'Flow Live'}</button>",
  'dedicated burner flow control communicates locked teaching state'
);

fs.writeFileSync(burnerPagePath, burnerPage);
