export type ViewMode = 'cutaway' | 'normal' | 'xray';
export type ContextMode = 'full' | 'focus' | 'isolate';
export type BurnerStudy = 'external' | 'internal' | 'exploded' | 'pilot';
export type RadiantStudy = 'full' | 'pass' | 'supports' | 'clearance' | 'flow' | 'inspection';
export type RadiantScenario = 'normal' | 'impingement' | 'hotspot' | 'coking';
export type TroubleshootingScenario = 'flameImpingement' | 'tubeHotArea' | 'draftPressure';
export type TroubleshootingPhase = 'normal' | 'deviation' | 'contact' | 'consequence';
export type HeatStudy = 'overview' | 'shield' | 'convection' | 'flue' | 'process' | 'fouling';
export type HeatScenario = 'clean' | 'fouled' | 'plugged';
export type HeaterType = 'box' | 'cabin' | 'cylindrical';
export type HeaterTypeView = 'exterior' | 'cutaway' | 'tubes' | 'burners' | 'flow';
export type DraftStudy = 'overview' | 'breeching' | 'damper' | 'path' | 'stack' | 'pressure';
export type DraftPressureScenario = 'negative' | 'positive';
export type OperationState = 'safeNonFiring' | 'readiness' | 'processReady' | 'purgeReady' | 'purgeActive' | 'purgeComplete' | 'pilotIgnition' | 'pilotProven' | 'mainBurnerLightOff' | 'firingStabilization' | 'controlledWarmUp' | 'normalOperation' | 'loadChange' | 'controlledShutdown' | 'coolDownNonFiring';

export type CameraAction =
  | 'fitHeater'
  | 'fitComponent'
  | 'focusComponent'
  | 'zoomIn'
  | 'zoomOut'
  | 'reset'
  | 'burnerExternal'
  | 'burnerInternal'
  | 'burnerPilot'
  | 'burnerExploded'
  | 'radiantFull'
  | 'radiantPass'
  | 'radiantSupports'
  | 'radiantClearance'
  | 'radiantFlow'
  | 'radiantInspection'
  | 'heatOverview'
  | 'heatShield'
  | 'heatConvection'
  | 'heatFlue'
  | 'heatProcess'
  | 'heatFouling'
  | 'draftOverview'
  | 'draftBreeching'
  | 'draftDamper'
  | 'draftPath'
  | 'draftStack'
  | 'draftPressure'
  | 'troubleDraft'
  | 'troubleDraftDamper'
  | 'troubleBackfire';

export type CameraCommand = {
  id: number;
  action: CameraAction;
  component?: string;
};
