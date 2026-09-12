import fs from 'node:fs';

function replaceOnce(source, before, after, label) {
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly one anchor, found ${count}`);
  return source.replace(before, after);
}

const heaterPath = 'src/Heater3D.tsx';
let source = fs.readFileSync(heaterPath, 'utf8');

source = replaceOnce(
  source,
  "import { createDraftInstrumentation3D } from './draftInstrumentation3D';",
  "import { createDraftInstrumentation3D } from './draftInstrumentation3D';\nimport { getCombustionTrainingMetrics } from './combustionTrainingLogic';",
  'combustion training import'
);

source = replaceOnce(
  source,
  "  damperPosition: number;\n  burnerStudyMode?: BurnerStudy | null;",
  "  damperPosition: number;\n  airRegisterPosition?: number;\n  fuelGasPosition?: number;\n  burnerControlActive?: boolean;\n  burnerStudyMode?: BurnerStudy | null;",
  'combustion control props'
);

source = replaceOnce(
  source,
  "export default function Heater3D({ mode, selected, labels, flow, explode, contextMode, damperPosition, burnerStudyMode = null,",
  "export default function Heater3D({ mode, selected, labels, flow, explode, contextMode, damperPosition, airRegisterPosition = 60, fuelGasPosition = 55, burnerControlActive = false, burnerStudyMode = null,",
  'combustion control destructuring'
);

source = replaceOnce(
  source,
  "  const damperPositionRef = useRef(damperPosition);\n  const burnerStudyRef = useRef(burnerStudyMode);",
  "  const damperPositionRef = useRef(damperPosition);\n  const airRegisterPositionRef = useRef(airRegisterPosition);\n  const fuelGasPositionRef = useRef(fuelGasPosition);\n  const burnerControlActiveRef = useRef(burnerControlActive);\n  const burnerStudyRef = useRef(burnerStudyMode);",
  'combustion control refs'
);

source = replaceOnce(
  source,
  "  useEffect(() => {\n    damperPositionRef.current = damperPosition;\n    if (damperBladeRef.current) damperBladeRef.current.rotation.x = 1.38 - (damperPosition / 100) * 1.20;\n  }, [damperPosition]);",
  "  useEffect(() => {\n    damperPositionRef.current = damperPosition;\n    if (damperBladeRef.current) damperBladeRef.current.rotation.x = 1.38 - (damperPosition / 100) * 1.20;\n  }, [damperPosition]);\n\n  useEffect(() => {\n    airRegisterPositionRef.current = airRegisterPosition;\n    fuelGasPositionRef.current = fuelGasPosition;\n    burnerControlActiveRef.current = burnerControlActive;\n  }, [airRegisterPosition, fuelGasPosition, burnerControlActive]);",
  'combustion control ref sync'
);

source = replaceOnce(
  source,
  "          slat.rotation.y = -a;\n          burners.add(slat);",
  "          slat.rotation.y = -a;\n          slat.userData.burnerControl = 'airSlat';\n          slat.userData.airSlatBaseYaw = -a;\n          burners.add(slat);",
  'air register slat tagging'
);

source = replaceOnce(
  source,
  "      const activeTroubleshootingPhase = troubleshootingPhaseRef.current;\n\n      flameMaterials.forEach((material, index) => {",
  "      const activeTroubleshootingPhase = troubleshootingPhaseRef.current;\n      const combustionTrainingMetrics = getCombustionTrainingMetrics(\n        fuelGasPositionRef.current,\n        airRegisterPositionRef.current,\n        damperPositionRef.current\n      );\n      const activeBurnerControl = Boolean(\n        burnerControlActiveRef.current &&\n        activeBurnerStudy &&\n        activeBurnerStudy !== 'pilot' &&\n        activeBurnerStudy !== 'exploded' &&\n        !activeOperationState &&\n        !activeTroubleshootingPhase\n      );\n\n      if (activeBurnerControl && animatedBurners) {\n        animatedBurners.children.forEach(child => {\n          if (!child.userData.heroBurner || child.userData.burnerControl !== 'airSlat') return;\n          const baseYaw = (child.userData.airSlatBaseYaw as number | undefined) ?? child.rotation.y;\n          const registerOffset = (airRegisterPositionRef.current / 100 - 0.60) * 0.80;\n          child.rotation.y = THREE.MathUtils.lerp(child.rotation.y, baseYaw + registerOffset, 0.12);\n        });\n      }\n\n      flameMaterials.forEach((material, index) => {",
  'combustion training runtime metrics'
);

source = replaceOnce(
  source,
  "        const troubleshootingTarget = Boolean(activeTroubleshootingScenario === 'flameImpingement' && activeTroubleshootingPhase && flame.userData.burnerCell === '4.15:-1.35' && !isPilotFlame);\n        const troubleshootingLengthScale = troubleshootingTarget ? activeTroubleshootingPhase === 'deviation' ? 1.02 : activeTroubleshootingPhase === 'contact' ? 1.08 : activeTroubleshootingPhase === 'consequence' ? 1.1 : 1 : 1;\n        flame.scale.x = baseX * lightOffScale * warmupScale * loadScale * shutdownScale * (1 + Math.sin(t * 5.2 + phase) * effectiveWidthPulse + Math.sin(t * 9.7 + phase * 1.7) * 0.035);\n        flame.scale.y = baseY * lightOffScale * warmupScale * loadScale * shutdownScale * troubleshootingLengthScale * (1 + Math.sin(t * 4.1 + phase * 0.8) * effectiveLengthPulse + Math.sin(t * 11.3 + phase) * 0.025);\n        flame.scale.z = baseZ * lightOffScale * warmupScale * loadScale * shutdownScale * (1 + Math.cos(t * 5.8 + phase * 1.15) * effectiveWidthPulse * 0.82);",
  "        const troubleshootingTarget = Boolean(activeTroubleshootingScenario === 'flameImpingement' && activeTroubleshootingPhase && flame.userData.burnerCell === '4.15:-1.35' && !isPilotFlame);\n        const troubleshootingLengthScale = troubleshootingTarget ? activeTroubleshootingPhase === 'deviation' ? 1.02 : activeTroubleshootingPhase === 'contact' ? 1.08 : activeTroubleshootingPhase === 'consequence' ? 1.1 : 1 : 1;\n        const combustionHero = activeBurnerControl && Boolean(flame.userData.heroBurner) && !isPilotFlame;\n        const combustionWidthScale = combustionHero ? combustionTrainingMetrics.flameWidthScale : 1;\n        const combustionHeightScale = combustionHero ? combustionTrainingMetrics.flameHeightScale : 1;\n        if (combustionHero) flame.visible = fuelGasPositionRef.current >= 3;\n        flame.scale.x = baseX * lightOffScale * warmupScale * loadScale * shutdownScale * combustionWidthScale * (1 + Math.sin(t * 5.2 + phase) * effectiveWidthPulse + Math.sin(t * 9.7 + phase * 1.7) * 0.035);\n        flame.scale.y = baseY * lightOffScale * warmupScale * loadScale * shutdownScale * troubleshootingLengthScale * combustionHeightScale * (1 + Math.sin(t * 4.1 + phase * 0.8) * effectiveLengthPulse + Math.sin(t * 11.3 + phase) * 0.025);\n        flame.scale.z = baseZ * lightOffScale * warmupScale * loadScale * shutdownScale * combustionWidthScale * (1 + Math.cos(t * 5.8 + phase * 1.15) * effectiveWidthPulse * 0.82);",
  'hero flame combustion scaling'
);

source = replaceOnce(
  source,
  "        const draftBias = draftAbnormalOperation ? Math.sin(t * 2.4 + phase * 0.55) * 0.12 : 0;\n        flame.rotation.z = Math.sin(t * 3.7 + phase) * (outer ? 0.055 : 0.035) + impingementBias + operationImpingementBias + troubleshootingBias + unstableBias + draftBias;",
  "        const draftBias = draftAbnormalOperation ? Math.sin(t * 2.4 + phase * 0.55) * 0.12 : 0;\n        const combustionBias = activeBurnerControl && Boolean(flame.userData.heroBurner) && !isPilotFlame ? Math.sin(t * 2.9 + phase * 0.7) * combustionTrainingMetrics.flameWobbleRad : 0;\n        flame.rotation.z = Math.sin(t * 3.7 + phase) * (outer ? 0.055 : 0.035) + impingementBias + operationImpingementBias + troubleshootingBias + unstableBias + draftBias + combustionBias;",
  'hero flame combustion wobble'
);

source = replaceOnce(
  source,
  "      for (const p of burnerAirParticles) {\n        const u = (p.userData.t + t * 0.085) % 1;",
  "      for (const p of burnerAirParticles) {\n        const airSpeed = activeBurnerControl ? combustionTrainingMetrics.airParticleSpeed : 1;\n        const u = (p.userData.t + t * 0.085 * airSpeed) % 1;",
  'air particle speed'
);

source = replaceOnce(
  source,
  "        p.position.set(Math.sin(angle) * radius, 3.75 + u * 2.7, -1.35 + Math.cos(angle) * radius * 0.58);\n      }\n      for (const p of burnerFuelParticles) {\n        const u = (p.userData.t + t * 0.075) % 1;",
  "        p.visible = !activeBurnerControl || airRegisterPositionRef.current > 2;\n        if (activeBurnerControl) p.scale.setScalar(combustionTrainingMetrics.airParticleScale);\n        p.position.set(Math.sin(angle) * radius, 3.75 + u * 2.7, -1.35 + Math.cos(angle) * radius * 0.58);\n      }\n      for (const p of burnerFuelParticles) {\n        const fuelSpeed = activeBurnerControl ? combustionTrainingMetrics.fuelParticleSpeed : 1;\n        const u = (p.userData.t + t * 0.075 * fuelSpeed) % 1;",
  'air particle visibility and fuel speed'
);

source = replaceOnce(
  source,
  "        if (activeBurnerStudy === 'pilot') {\n          p.position.set(-1.4 + u * 1.4, 5.72 + u * 0.82, -1.35);\n        } else {\n          p.position.set(-2.3 + u * 2.3, 3.45 + u * 3.05, -1.35 + Math.sin(u * Math.PI) * 0.12);\n        }\n      }\n      for (const p of burnerHotParticles) {\n        const u = (p.userData.t + t * 0.07) % 1;",
  "        if (activeBurnerControl) {\n          p.visible = fuelGasPositionRef.current > 2;\n          p.scale.setScalar(combustionTrainingMetrics.fuelParticleScale);\n        }\n        if (activeBurnerStudy === 'pilot') {\n          p.position.set(-1.4 + u * 1.4, 5.72 + u * 0.82, -1.35);\n        } else {\n          p.position.set(-2.3 + u * 2.3, 3.45 + u * 3.05, -1.35 + Math.sin(u * Math.PI) * 0.12);\n        }\n      }\n      for (const p of burnerHotParticles) {\n        const hotSpeed = activeBurnerControl ? combustionTrainingMetrics.hotParticleSpeed : 1;\n        const u = (p.userData.t + t * 0.07 * hotSpeed) % 1;",
  'fuel particle response and hot speed'
);

source = replaceOnce(
  source,
  "        p.position.set(Math.sin((u + p.userData.t) * 8.0) * (0.3 + u * 0.55), 6.62 + u * 6.2, -1.35 + Math.cos((u + p.userData.t) * 7.0) * 0.28);\n      }",
  "        if (activeBurnerControl) {\n          p.visible = fuelGasPositionRef.current > 2 && combustionTrainingMetrics.hotProductStrength > 0.08;\n          p.scale.setScalar(combustionTrainingMetrics.hotParticleScale);\n        }\n        p.position.set(Math.sin((u + p.userData.t) * 8.0) * (0.3 + u * 0.55), 6.62 + u * 6.2 * (activeBurnerControl ? combustionTrainingMetrics.flameHeightScale : 1), -1.35 + Math.cos((u + p.userData.t) * 7.0) * 0.28);\n      }",
  'hot particle response'
);

fs.writeFileSync(heaterPath, source);
