import fs from 'node:fs';

function replaceOnce(source, before, after, label) {
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly one anchor, found ${count}`);
  return source.replace(before, after);
}

// CHECKPOINT 20 — keep the key simulator outputs visible on mobile even
// while the tuning controls are collapsed. This is a presentation-only patch;
// it does not change the simulator physics or representative training logic.

const burnerPath = 'src/BurnerPage.tsx';
let burner = fs.readFileSync(burnerPath, 'utf8');

burner = replaceOnce(
  burner,
  `<button className="burner-sim-mobile-toggle" onClick={() => setMobileSimOpen(value => !value)}><SlidersHorizontal size={15} /><span>{mobileSimOpen ? 'Hide tuning controls' : 'Tune Fuel · Air · Draft'}</span><b>{metrics.oxygenPct.toFixed(1)}% O₂</b></button>`,
  `<button className="burner-sim-mobile-toggle" onClick={() => setMobileSimOpen(value => !value)}><SlidersHorizontal size={15} /><span>{mobileSimOpen ? 'Hide tuning controls' : 'Tune Fuel · Air · Draft'}</span><span className="burner-sim-mobile-readouts" aria-label="Live simulator readings"><b><small>DRAFT</small>{metrics.draftMmH2O > 0 ? '+' : ''}{metrics.draftMmH2O.toFixed(1)}<i>mmH₂O</i></b><b><small>O₂</small>{metrics.oxygenPct.toFixed(1)}<i>%</i></b><b><small>CO</small>{metrics.coPpm}<i>ppm*</i></b></span></button>`,
  'mobile live Draft O2 CO readout'
);

fs.writeFileSync(burnerPath, burner);
