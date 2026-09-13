import { useCallback, useState } from 'react';
import { ArrowLeft, Eye, Focus, Gauge, Rotate3D, SlidersHorizontal, Wind, ZoomIn, ZoomOut } from 'lucide-react';
import Heater3D from './Heater3D';
import GlobalNavigation from './GlobalNavigation';
import type { NavigationTarget } from './GlobalNavigation';
import type { CameraAction, CameraCommand } from './modelTypes';
import { combustionTrainingPresets, getCombustionTrainingMetrics } from './combustionTrainingLogic';
import { physicsModelBoundary } from './physicsCalibration';

type Props = { onBack: () => void; onNavigate: (target: NavigationTarget) => void };

type RangeControlProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  left: string;
  right: string;
};

function RangeControl({ label, value, onChange, left, right }: RangeControlProps) {
  return (
    <label className="sim-range-control">
      <span><b>{label}</b><strong>{value.toFixed(0)}%</strong></span>
      <input type="range" min="0" max="100" value={value} onChange={event => onChange(Number(event.target.value))} aria-label={label} />
      <small><i>{left}</i><i>{right}</i></small>
    </label>
  );
}

export default function SimulatorPage({ onBack, onNavigate }: Props) {
  const [fuelGasPosition, setFuelGasPosition] = useState(55);
  const [airRegisterPosition, setAirRegisterPosition] = useState(60);
  const [damperPosition, setDamperPosition] = useState(50);
  const [labels, setLabels] = useState(true);
  const [cameraCommand, setCameraCommand] = useState<CameraCommand>({ id: 1, action: 'burnerInternal', component: 'Burners' });
  const noSelect = useCallback(() => {}, []);
  const metrics = getCombustionTrainingMetrics(fuelGasPosition, airRegisterPosition, damperPosition);

  const cameraAction = useCallback((action: CameraAction) => {
    setCameraCommand(current => ({ id: current.id + 1, action, component: 'Burners' }));
  }, []);

  const applyPreset = (key: keyof typeof combustionTrainingPresets) => {
    const preset = combustionTrainingPresets[key];
    setFuelGasPosition(preset.fuel);
    setAirRegisterPosition(preset.air);
    setDamperPosition(preset.damperRestriction);
  };

  const reset = () => {
    applyPreset('balanced');
    setLabels(true);
    cameraAction('burnerInternal');
  };

  const signedDraft = `${metrics.draftMmH2O > 0 ? '+' : ''}${metrics.draftMmH2O.toFixed(1)}`;

  return (
    <main className="app-shell architecture-page simulator-page">
      <header className="atlas-topbar architecture-topbar">
        <button className="back-atlas" onClick={onBack}><ArrowLeft size={16} /> Atlas</button>
        <div className="brand-lockup"><strong>FIRED HEATER <em>ATLAS</em></strong><span>COMBUSTION + DRAFT SIMULATOR</span></div>
        <GlobalNavigation active="simulator" onNavigate={onNavigate} />
      </header>

      <section className="architecture-contextbar">
        <div><span>PHYSICS-BASED TRAINING SIMULATOR</span><strong>Fuel · Combustion Air · Stack Damper · Natural Draft</strong></div>
        <p>Representative causal model · Not a plant operating procedure, burner guarantee, CFD model or design calculation</p>
      </section>

      <section className="simulator-workspace">
        <div className="simulator-viewer hero-viewer">
          <Heater3D
            mode="cutaway"
            selected="Burners"
            labels={labels}
            flow={true}
            explode={false}
            contextMode="focus"
            damperPosition={damperPosition}
            airRegisterPosition={airRegisterPosition}
            fuelGasPosition={fuelGasPosition}
            burnerControlActive={true}
            burnerStudyMode="internal"
            cameraCommand={cameraCommand}
            onSelect={noSelect}
          />
          <div className="viewer-kicker simulator-kicker"><i /> SYSTEM INTERACTION <span>Fuel + air + draft are solved as one coupled training state</span></div>
          <div className={`simulator-state-badge ${metrics.state}`}>
            <Gauge size={15} />
            <div><span>LIVE STATE</span><b>{metrics.stateLabel}</b></div>
          </div>
          <div className="simulator-flow-legend"><span className="air">COMBUSTION AIR</span><span className="fuel">FUEL GAS</span><span className="hot">HOT PRODUCTS</span></div>
          <div className="simulator-camera-dock">
            <button onClick={() => cameraAction('burnerInternal')}><Focus size={16} /> Fit</button>
            <button onClick={() => cameraAction('zoomIn')}><ZoomIn size={16} /> Zoom +</button>
            <button onClick={() => cameraAction('zoomOut')}><ZoomOut size={16} /> Zoom −</button>
            <button className={labels ? 'active' : ''} onClick={() => setLabels(value => !value)}><Eye size={16} /> Labels</button>
            <button className="active" disabled><Wind size={16} /> Flow Live</button>
            <button onClick={reset}><Rotate3D size={16} /> Reset</button>
          </div>
        </div>

        <aside className="simulator-console">
          <div className="simulator-console-head">
            <span><SlidersHorizontal size={14} /> OPERATOR INPUTS</span>
            <h1>Change one control. Read the whole heater response.</h1>
            <p>{metrics.stateNote}</p>
          </div>

          <div className="simulator-controls">
            <RangeControl label="Fuel gas valve · relative demand" value={fuelGasPosition} onChange={setFuelGasPosition} left="LESS" right="MORE" />
            <RangeControl label="Burner air register" value={airRegisterPosition} onChange={setAirRegisterPosition} left="CLOSED" right="OPEN" />
            <RangeControl label="Stack damper restriction" value={damperPosition} onChange={setDamperPosition} left="OPEN" right="MORE CLOSED" />
          </div>

          <div className="simulator-presets">
            <span>TRAINING SCENARIOS</span>
            <div>
              <button onClick={() => applyPreset('balanced')}>Balanced</button>
              <button onClick={() => applyPreset('airStarved')}>Air-Starved</button>
              <button onClick={() => applyPreset('fuelRich')}>Fuel-Rich</button>
              <button onClick={() => applyPreset('excessAir')}>Excess Air</button>
              <button onClick={() => applyPreset('draftConcern')}>Draft Concern</button>
              <button onClick={() => applyPreset('higherFiring')}>Higher Firing</button>
            </div>
          </div>

          <div className="simulator-output-heading"><span>LIVE PHYSICAL RESPONSE</span><b>{metrics.converged ? `CONVERGED · ${metrics.iterations} ITERATIONS` : 'ITERATING'}</b></div>
          <div className="simulator-output-grid">
            <div><small>HEAT INPUT</small><strong>{metrics.heatInputPctRef}</strong><em>% of reference*</em></div>
            <div><small>ACTUAL AIR</small><strong>{metrics.actualAirPctStoich}</strong><em>% of stoichiometric</em></div>
            <div><small>EXCESS AIR</small><strong>{metrics.excessAirPct}</strong><em>%</em></div>
            <div><small>RADIANT O₂</small><strong>{metrics.radiantOxygenPct.toFixed(1)}</strong><em>% dry</em></div>
            <div><small>STACK O₂</small><strong>{metrics.stackOxygenPct.toFixed(1)}</strong><em>% dry · leakage cue</em></div>
            <div><small>CO*</small><strong>{metrics.coPpm}</strong><em>ppm · training tendency</em></div>
            <div><small>ARCH DRAFT</small><strong>{signedDraft}</strong><em>mmH₂O</em></div>
            <div><small>STACK TEMP*</small><strong>{metrics.stackTemperatureC}</strong><em>°C · representative</em></div>
          </div>

          <div className="simulator-boundary-note">
            <b>{physicsModelBoundary.label}</b>
            <p>{physicsModelBoundary.note}</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
