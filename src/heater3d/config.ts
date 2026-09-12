export type CameraPreset = {
  yaw: number;
  pitch: number;
  radius: number;
  target: [number, number, number];
};

export const cameraPresets: Record<string, CameraPreset> = {
  Burners: { yaw: -0.72, pitch: -0.02, radius: 18, target: [0, 6.4, 0] },
  'Radiant Tubes': { yaw: -0.76, pitch: 0.03, radius: 22, target: [0, 11.8, 0] },
  'Shield Tubes': { yaw: -0.84, pitch: 0.08, radius: 18, target: [0, 18.7, 0] },
  'Convection Bank': { yaw: -0.82, pitch: 0.08, radius: 21, target: [0, 22.2, 0] },
  Refractory: { yaw: -0.72, pitch: 0.03, radius: 22, target: [0, 11.8, 0] },
  'Casing & Structure': { yaw: -0.7, pitch: 0.02, radius: 34, target: [0, 13.5, 0] },
  'Platforms & Access': { yaw: -0.82, pitch: -0.03, radius: 32, target: [0, 10.5, 0] },
  Breeching: { yaw: -0.8, pitch: 0.08, radius: 20, target: [0, 27.0, 0] },
  'Stack Damper': { yaw: -0.82, pitch: 0.045, radius: 17.5, target: [0, 30.35, 0] },
  'Draft Instruments': { yaw: -0.54, pitch: 0.015, radius: 12.8, target: [4.55, 16.35, 4.55] },
  'Stack Analyzers': { yaw: -0.52, pitch: 0.025, radius: 13.8, target: [3.55, 33.25, 3.05] },
  Stack: { yaw: -0.72, pitch: 0.06, radius: 20, target: [0, 34.1, 0] },
};

export const relatedComponents: Record<string, string[]> = {
  Burners: ['Radiant Tubes', 'Refractory', 'Casing & Structure'],
  'Radiant Tubes': ['Burners', 'Refractory', 'Shield Tubes'],
  'Shield Tubes': ['Radiant Tubes', 'Convection Bank', 'Refractory'],
  'Convection Bank': ['Shield Tubes', 'Breeching', 'Stack'],
  Refractory: ['Radiant Tubes', 'Burners', 'Casing & Structure'],
  'Casing & Structure': ['Refractory', 'Platforms & Access', 'Burners'],
  'Platforms & Access': ['Casing & Structure', 'Burners', 'Stack'],
  Breeching: ['Convection Bank', 'Stack Damper', 'Draft Instruments', 'Stack'],
  'Stack Damper': ['Breeching', 'Draft Instruments', 'Stack Analyzers', 'Stack'],
  'Draft Instruments': ['Stack Damper', 'Breeching', 'Stack Analyzers'],
  'Stack Analyzers': ['Stack', 'Stack Damper', 'Draft Instruments'],
  Stack: ['Stack Damper', 'Stack Analyzers', 'Breeching', 'Platforms & Access'],
};

export const internalCutawayComponents = new Set([
  'Burners',
  'Radiant Tubes',
  'Shield Tubes',
  'Convection Bank',
  'Refractory',
]);
