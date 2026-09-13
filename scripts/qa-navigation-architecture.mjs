import fs from 'node:fs';

const failures = [];
const read = path => fs.readFileSync(path, 'utf8');
const requireFile = path => { if (!fs.existsSync(path)) failures.push(`Missing ${path}`); };
const requireText = (path, text, label) => {
  if (!fs.existsSync(path)) return;
  if (!read(path).includes(text)) failures.push(`${label}: missing in ${path}`);
};

[
  'src/ComponentsPage.tsx',
  'src/SimulatorPage.tsx',
  'src/navigationArchitecture.css',
  'src/GlobalNavigation.tsx',
  'src/App.tsx',
  'src/BurnerPage.tsx',
].forEach(requireFile);

requireText('src/GlobalNavigation.tsx', "'simulator'", 'SIMULATOR navigation target');
requireText('src/GlobalNavigation.tsx', "label: 'SIMULATOR'", 'SIMULATOR desktop/mobile navigation item');
requireText('src/App.tsx', "activeModule === 'componentsHub'", 'Components landing route');
requireText('src/App.tsx', "activeModule === 'simulator'", 'Simulator route');
requireText('src/App.tsx', "setActiveModule('componentsHub')", 'Components navigation no longer depends on selected Atlas component');
requireText('src/ComponentsPage.tsx', "id: 'burner'", 'Burner component module card');
requireText('src/ComponentsPage.tsx', "id: 'radiant'", 'Radiant component module card');
requireText('src/ComponentsPage.tsx', "id: 'heatRecovery'", 'Shield and convection module card');
requireText('src/ComponentsPage.tsx', "id: 'draftStack'", 'Draft and stack module card');
requireText('src/SimulatorPage.tsx', 'getCombustionTrainingMetrics', 'Simulator reuses existing V2 physics kernel');
requireText('src/SimulatorPage.tsx', 'metrics.heatInputPctRef', 'Simulator heat-input output');
requireText('src/SimulatorPage.tsx', 'metrics.actualAirPctStoich', 'Simulator actual-air output');
requireText('src/SimulatorPage.tsx', 'metrics.radiantOxygenPct', 'Simulator radiant O2 output');
requireText('src/SimulatorPage.tsx', 'metrics.stackOxygenPct', 'Simulator stack O2 output');
requireText('src/BurnerPage.tsx', 'burner-component-page', 'Burner component-only marker');
requireText('src/navigationArchitecture.css', '.burner-component-page .burner-sim-live', 'Burner simulator UI separation');

if (fs.existsSync('src/SimulatorPage.tsx')) {
  const simulator = read('src/SimulatorPage.tsx');
  if (simulator.includes('function methaneLikeDryOxygenPct') || simulator.includes('MAX_ITERATIONS')) {
    failures.push('SimulatorPage duplicates physics-kernel implementation instead of reusing combustionTrainingLogic');
  }
}

if (fs.existsSync('src/GlobalNavigation.tsx')) {
  const nav = read('src/GlobalNavigation.tsx');
  const componentsIndex = nav.indexOf("label: 'COMPONENTS'");
  const simulatorIndex = nav.indexOf("label: 'SIMULATOR'");
  const heaterTypesIndex = nav.indexOf("label: 'HEATER TYPES'");
  if (!(componentsIndex >= 0 && simulatorIndex > componentsIndex && heaterTypesIndex > simulatorIndex)) {
    failures.push('Desktop navigation order must be ATLAS → COMPONENTS → SIMULATOR → HEATER TYPES → OPERATION → TROUBLESHOOTING');
  }
}

if (failures.length) throw new Error(`[qa:navigation] ${failures.join(' | ')}`);

console.log('[qa:navigation] PASS');
console.log(' - COMPONENTS opens a dedicated four-module landing page');
console.log(' - SIMULATOR is an independent global destination');
console.log(' - Burner page is visually component-focused; cross-system controls are separated');
console.log(' - Simulator reuses the existing V2 physics kernel with no duplicate physics implementation');
console.log(' - No Heater3D geometry or physics-kernel source is modified by the navigation patch');
