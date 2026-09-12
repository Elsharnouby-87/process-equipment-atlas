import * as THREE from 'three';
import type { ViewMode } from '../modelTypes';
import { cameraPresets, type CameraPreset } from './config';

export type OperationContext = {
  primary: string[];
  support: string[];
};

export const operationContextMap: Record<string, OperationContext> = {
  interior: { primary: ['Refractory', 'Radiant Tubes'], support: ['Casing & Structure'] },
  burners: { primary: ['Burners'], support: ['Refractory'] },
  fuel: { primary: ['Burners'], support: ['Casing & Structure'] },
  draft: { primary: ['Breeching', 'Stack Damper', 'Stack'], support: ['Convection Bank'] },
  protection: { primary: ['Burners'], support: ['Casing & Structure'] },
  nonFiring: { primary: ['Burners'], support: ['Casing & Structure'] },
  fuelProtection: { primary: ['Burners'], support: ['Casing & Structure'] },
  purgePath: { primary: ['Breeching', 'Stack Damper', 'Stack'], support: ['Convection Bank', 'Shield Tubes'] },
  monitoring: { primary: ['Stack Damper', 'Breeching'], support: ['Stack'] },
  controlLogic: { primary: ['Casing & Structure'], support: ['Burners'] },
  pilotIgnition: { primary: ['Burners'], support: ['Refractory'] },
  pilotProven: { primary: ['Burners'], support: ['Refractory'] },
  pilotNotEstablished: { primary: ['Burners'], support: ['Refractory'] },
  pilotNotProven: { primary: ['Burners'], support: ['Refractory'] },
};

export const explodeOffsets: Record<string, THREE.Vector3> = {
  Burners: new THREE.Vector3(0, -3.8, 0),
  'Radiant Tubes': new THREE.Vector3(0, 0, 0),
  'Shield Tubes': new THREE.Vector3(0, 2.6, 0),
  'Convection Bank': new THREE.Vector3(0, 5.7, 0),
  Breeching: new THREE.Vector3(0, 8.6, 0),
  'Stack Damper': new THREE.Vector3(0, 10.8, 0),
  Stack: new THREE.Vector3(0, 13.6, 0),
  Refractory: new THREE.Vector3(-4.3, 0.4, -0.9),
  'Platforms & Access': new THREE.Vector3(0, 0, 0),
  'Casing & Structure': new THREE.Vector3(0, 0, 0),
};

export const semanticExplodeOffsets: Record<string, THREE.Vector3> = {
  'Air Register': new THREE.Vector3(2.7, 0.2, 0),
  'Burner Body / Neck': new THREE.Vector3(0, -2.2, 0),
  'Mounting Flange': new THREE.Vector3(0, -1.05, 0),
  'Gas Gun / Fuel Tip': new THREE.Vector3(-2.8, 0.55, 0),
  'Burner Tile / Throat': new THREE.Vector3(0, 1.8, 0),
  'Pilot / Ignition': new THREE.Vector3(2.4, 1.45, -0.2),
  Flame: new THREE.Vector3(0, 3.35, 0),
};

export const operationLabelMap: Record<string, string[]> = {
  overview: ['BURNERS', 'RADIANT TUBES', 'STACK'],
  interior: ['RADIANT TUBES', 'TUBE SUPPORTS', 'HOT FACE'],
  burners: ['BURNERS', 'AIR REGISTER', 'BURNER TILE', 'PILOT / IGNITION'],
  fuel: ['BURNERS', 'FUEL HEADER'],
  draft: ['BREECHING', 'STACK DAMPER', 'STACK'],
  protection: ['BURNERS'],
  process: ['RADIANT TUBES', 'CONVECTION'],
  nonFiring: ['BURNERS', 'STACK'],
  fuelProtection: ['BURNERS', 'FUEL HEADER'],
  purgePath: ['BREECHING', 'STACK DAMPER', 'STACK'],
  monitoring: ['BREECHING', 'STACK DAMPER'],
  controlLogic: [],
  purgeActive: ['BURNERS', 'BREECHING', 'STACK'],
  purgeComplete: ['BURNERS', 'STACK'],
  pilotIgnition: [],
  pilotProven: [],
  pilotNotEstablished: [],
  pilotNotProven: [],
  mainBurnerLightOff: ['BURNERS', 'RADIANT TUBES'],
  firingStable: ['BURNERS', 'RADIANT TUBES'],
  firingUnstable: ['BURNERS', 'RADIANT TUBES'],
  firingImpingement: ['BURNERS', 'RADIANT TUBES'],
  firingDraftAbnormal: ['BURNERS', 'BREECHING'],
  warmupEarly: ['BURNERS', 'RADIANT TUBES', 'CONVECTION'],
  warmupDeveloping: ['BURNERS', 'RADIANT TUBES', 'CONVECTION'],
  warmupBalanced: ['BURNERS', 'RADIANT TUBES', 'CONVECTION'],
  warmupUneven: ['RADIANT TUBES', 'HOT FACE'],
  normalCombustion: ['BURNERS'],
  normalFuel: ['BURNERS', 'FUEL HEADER'],
  normalDraft: ['BREECHING', 'STACK DAMPER', 'STACK'],
  normalProcess: ['RADIANT TUBES', 'CONVECTION'],
  normalTubeCondition: ['RADIANT TUBES', 'TUBE SUPPORTS'],
  abnormalFlameLoss: ['BURNERS'],
  abnormalHotArea: ['RADIANT TUBES', 'TUBE SUPPORTS'],
  normalStack: ['CONVECTION', 'STACK'],
  loadSteady: ['BURNERS', 'RADIANT TUBES', 'STACK'],
  loadIncrease: ['BURNERS', 'RADIANT TUBES', 'STACK'],
  loadDecrease: ['BURNERS', 'RADIANT TUBES', 'STACK'],
  loadNotStabilized: ['BURNERS', 'RADIANT TUBES', 'BREECHING'],
  shutdownStable: ['BURNERS', 'RADIANT TUBES', 'STACK'],
  shutdownReduced: ['BURNERS', 'RADIANT TUBES', 'STACK'],
  shutdownFiringRemoved: ['BURNERS', 'RADIANT TUBES'],
  shutdownConcern: ['BURNERS', 'RADIANT TUBES', 'BREECHING'],
  cooldownResidual: ['RADIANT TUBES', 'HOT FACE'],
  cooldownProgress: ['RADIANT TUBES', 'HOT FACE'],
  cooldownNonFiring: ['BURNERS', 'RADIANT TUBES'],
  cooldownUneven: ['RADIANT TUBES', 'HOT FACE'],
};

export type AtlasLighting = {
  hemisphere: number;
  frontFill: number;
  topFill: number;
};

export function getAtlasLighting(mode: ViewMode, explode: boolean, atlasPrimaryView: boolean): AtlasLighting {
  if (!atlasPrimaryView) return { hemisphere: 1.38, frontFill: 2.25, topFill: 1.15 };
  if (explode) return { hemisphere: 1.58, frontFill: 2.75, topFill: 1.4 };
  if (mode === 'xray') return { hemisphere: 1.68, frontFill: 3.05, topFill: 1.5 };
  if (mode === 'cutaway') return { hemisphere: 1.48, frontFill: 2.55, topFill: 1.3 };
  return { hemisphere: 1.38, frontFill: 2.25, topFill: 1.15 };
}

export function getAtlasModeCameraPreset(selected: string, mode: ViewMode, explode: boolean): CameraPreset {
  if (explode) return { yaw: -0.72, pitch: 0.07, radius: 74, target: [0, 25.0, 0] };
  if (mode === 'xray' && selected === 'Radiant Tubes') return { yaw: -0.68, pitch: 0.05, radius: 54, target: [0, 19.2, 0] };
  if (mode === 'cutaway' && selected === 'Radiant Tubes') return { yaw: -0.7, pitch: 0.045, radius: 49, target: [0, 18.7, 0] };
  if (selected === 'Stack Damper') return { yaw: -0.82, pitch: 0.045, radius: mode === 'xray' ? 19.5 : 17.5, target: [0, 30.35, 0] };
  const preset = cameraPresets[selected] ?? cameraPresets['Radiant Tubes'];
  return { ...preset, radius: mode === 'xray' ? Math.max(preset.radius * 1.25, 24) : preset.radius };
}
