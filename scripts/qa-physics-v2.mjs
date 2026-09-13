import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const outFile = '/tmp/process-equipment-atlas-physics-v2.mjs';
execFileSync('npx', ['esbuild', 'src/combustionTrainingLogic.ts', '--bundle', '--platform=node', '--format=esm', `--outfile=${outFile}`], { stdio: 'inherit' });

const physics = await import(`${pathToFileURL(outFile).href}?v=${Date.now()}`);
const { getCombustionTrainingMetrics, combustionTrainingPresets } = physics;

const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

const balanced = getCombustionTrainingMetrics(55, 60, 50);
const registerClosed = getCombustionTrainingMetrics(55, 45, 50);
const damperClosed = getCombustionTrainingMetrics(55, 60, 90);
const higherFuel = getCombustionTrainingMetrics(72, 60, 50);
const excessAir = getCombustionTrainingMetrics(
  combustionTrainingPresets.excessAir.fuel,
  combustionTrainingPresets.excessAir.air,
  combustionTrainingPresets.excessAir.damperRestriction,
);
const draftConcern = getCombustionTrainingMetrics(
  combustionTrainingPresets.draftConcern.fuel,
  combustionTrainingPresets.draftConcern.air,
  combustionTrainingPresets.draftConcern.damperRestriction,
);

assert(Math.abs(balanced.draftMmH2O + 3.2) <= 0.2, `Balanced draft moved away from calibration: ${balanced.draftMmH2O}`);
assert(Math.abs(balanced.radiantOxygenPct - 3.5) <= 0.3, `Balanced radiant O2 moved away from calibration: ${balanced.radiantOxygenPct}`);
assert(Math.abs(balanced.lambda - 1.18) <= 0.03, `Balanced lambda moved away from calibration: ${balanced.lambda}`);
assert(balanced.converged, 'Balanced physics loop did not converge');

// John Zink causal direction: closing burner register reduces air/O2 and can make arch draft more negative
// because total gas throughput / friction loss falls.
assert(registerClosed.actualAirPctStoich < balanced.actualAirPctStoich, 'Closing air register did not reduce actual combustion air');
assert(registerClosed.radiantOxygenPct < balanced.radiantOxygenPct, 'Closing air register did not reduce radiant O2');
assert(registerClosed.draftMmH2O < balanced.draftMmH2O, 'Closing air register did not make arch pressure more negative at unchanged stack damper');

// Closing the downstream stack damper increases resistance, moves arch pressure toward positive,
// and reduces burner air admission.
assert(damperClosed.draftMmH2O > balanced.draftMmH2O, 'Closing stack damper did not move arch pressure toward positive');
assert(damperClosed.actualAirPctStoich < balanced.actualAirPctStoich, 'Closing stack damper did not reduce actual combustion air');
assert(damperClosed.radiantOxygenPct < balanced.radiantOxygenPct, 'Closing stack damper did not reduce radiant O2');

// Higher fuel at unchanged air hardware increases heat input but consumes air margin.
assert(higherFuel.heatInputPctRef > balanced.heatInputPctRef, 'Higher fuel command did not increase relative heat input');
assert(higherFuel.lambda < balanced.lambda, 'Higher fuel command did not reduce lambda at unchanged air hardware');
assert(higherFuel.radiantOxygenPct < balanced.radiantOxygenPct, 'Higher fuel command did not reduce radiant O2');
assert(higherFuel.coPpm >= balanced.coPpm, 'Higher fuel command unexpectedly reduced CO tendency');

assert(excessAir.radiantOxygenPct > balanced.radiantOxygenPct, 'Excess-air preset does not produce higher radiant O2');
assert(excessAir.excessAirPct > balanced.excessAirPct, 'Excess-air preset does not produce higher excess air');
assert(balanced.stackOxygenPct >= balanced.radiantOxygenPct, 'Tramp-air model should not make balanced stack O2 lower than radiant O2');
assert(draftConcern.draftMmH2O >= 0, `Draft-concern preset no longer reaches zero/positive arch pressure: ${draftConcern.draftMmH2O}`);

if (failures.length) throw new Error(`[qa:physics-v2] ${failures.join(' | ')}`);

console.log('[qa:physics-v2] PASS');
console.log(` - balanced: draft ${balanced.draftMmH2O} mmH2O, radiant O2 ${balanced.radiantOxygenPct}%, lambda ${balanced.lambda}`);
console.log(` - register closure: air ${registerClosed.actualAirPctStoich}% stoich, draft ${registerClosed.draftMmH2O} mmH2O`);
console.log(` - stack-damper closure: draft ${damperClosed.draftMmH2O} mmH2O, radiant O2 ${damperClosed.radiantOxygenPct}%`);
console.log(` - higher fuel: heat ${higherFuel.heatInputPctRef}% ref, lambda ${higherFuel.lambda}, CO ${higherFuel.coPpm} ppm training cue`);
console.log(` - tramp-air distinction: radiant O2 ${balanced.radiantOxygenPct}% vs stack O2 ${balanced.stackOxygenPct}%`);
