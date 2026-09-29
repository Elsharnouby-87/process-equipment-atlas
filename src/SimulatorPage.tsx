import { useCallback, useState } from 'react';
import { ArrowLeft, Eye, Focus, Gauge, Rotate3D, SlidersHorizontal, Wind, ZoomIn, ZoomOut } from 'lucide-react';
import Heater3D from './Heater3D';
import GlobalNavigation from './GlobalNavigation';
import type { NavigationTarget } from './GlobalNavigation';
import type { BurnerStudy, CameraAction, CameraCommand, ContextMode, DraftStudy, HeatStudy } from './modelTypes';
import { combustionTrainingPresets, getCombustionTrainingMetrics } from './combustionTrainingLogic';

type Props = { onBack: () => void; onNavigate: (target: NavigationTarget) => void };
type PresetKey = keyof typeof combustionTrainingPresets;
type SimulatorViewId = 'combustion' | 'draft' | 'heatRecovery' | 'integrated';
type SimulatorControl = 'fuel' | 'air' | 'damper';

type RangeControlProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  left: string;
  right: string;
};

type MetricCard = {
  label: string;
  value: string | number;
  unit: string;
};

type SimulatorViewConfig = {
  id: SimulatorViewId;
  index: string;
  label: string;
  shortDescription: string;
  contextTitle: string;
  consoleKicker: string;
  heading: string;
  description: string;
  selected: string;
  contextMode: ContextMode;
  camera: CameraAction;
  burnerStudyMode: BurnerStudy | null;
  draftStudyMode: DraftStudy | null;
  heatRecoveryStudyMode: HeatStudy | null;
  controls: SimulatorControl[];
  presets: PresetKey[];
};

const SIMULATOR_VIEWS: SimulatorViewConfig[] = [
  {
    id: 'combustion',
    index: '01',
    label: 'COMBUSTION',
    shortDescription: 'Fuel · air · flame',
    contextTitle: 'Fuel · Burner Air · Flame Response',
    consoleKicker: 'COMBUSTION INPUTS',
    heading: 'Balance fuel demand with combustion-air admission.',
    description: 'Fuel and burner air are active here; stack resistance remains part of the same live physics state.',
    selected: 'Burners',
    contextMode: 'focus',
    camera: 'burnerInternal',
    burnerStudyMode: 'internal',
    draftStudyMode: null,
    heatRecoveryStudyMode: null,
    controls: ['fuel', 'air'],
    presets: ['balanced', 'airStarved', 'fuelRich', 'excessAir', 'higherFiring'],
  },
  {
    id: 'draft',
    index: '02',
    label: 'DRAFT',
    shortDescription: 'Pressure · damper · path',
    contextTitle: 'Arch Pressure · Stack Damper · Flue-Gas Path',
    consoleKicker: 'DRAFT INPUTS',
    heading: 'Read pressure and flue-gas evacuation as one path.',
    description: 'Air demand and stack restriction are read against arch draft, chimney pull and total pressure loss.',
    selected: 'Stack Damper',
    contextMode: 'focus',
    camera: 'draftPath',
    burnerStudyMode: 'internal',
    draftStudyMode: 'path',
    heatRecoveryStudyMode: null,
    controls: ['air', 'damper'],
    presets: ['balanced', 'excessAir', 'draftConcern', 'higherFiring'],
  },
  {
    id: 'heatRecovery',
    index: '03',
    label: 'HEAT RECOVERY',
    shortDescription: 'Convection · stack response',
    contextTitle: 'Convection · Flue-Gas Flow · Stack Temperature',
    consoleKicker: 'HEAT RECOVERY INPUTS',
    heading: 'Follow heat recovery through convection to the stack.',
    description: 'Stack temperature is read with firing, air and gas-flow context rather than assigned to one automatic cause.',
    selected: 'Convection Bank',
    contextMode: 'focus',
    camera: 'heatFlue',
    burnerStudyMode: 'internal',
    draftStudyMode: null,
    heatRecoveryStudyMode: 'flue',
    controls: ['fuel', 'air', 'damper'],
    presets: ['balanced', 'excessAir', 'draftConcern', 'higherFiring'],
  },
  {
    id: 'integrated',
    index: '04',
    label: 'INTEGRATED',
    shortDescription: 'Whole-heater response',
    contextTitle: 'Fuel · Air · Draft · Whole-Heater Response',
    consoleKicker: 'OPERATOR INPUTS',
    heading: 'Change one control. Read the whole heater response.',
    description: 'All three controls stay coupled, and the same live state persists when you move between simulator screens.',
    selected: 'Stack Damper',
    contextMode: 'full',
    camera: 'fitHeater',
    burnerStudyMode: 'internal',
    draftStudyMode: 'path',
    heatRecoveryStudyMode: null,
    controls: ['fuel', 'air', 'damper'],
    presets: ['balanced', 'airStarved', 'fuelRich', 'excessAir', 'draftConcern', 'higherFiring'],
  },
];

const SIMULATOR_VIEW_MAP = Object.fromEntries(
  SIMULATOR_VIEWS.map(view => [view.id, view]),
) as Record<SimulatorViewId, SimulatorViewConfig>;

function RangeControl({ label, value, onChange, left, right }: RangeControlProps) {
  return (
    <label className="sim-range-control">
      <span><b>{label}</b><strong>{value.toFixed(0)}%</strong></span>
      <input type="range" min="0" max="100" value={value} onChange={event => onChange(Number(event.target.value))} aria-label={label} />
      <small><i>{left}</i><i>{right}</i></small>
    </label>
  );
}

function MetricGrid({ metrics }: { metrics: MetricCard[] }) {
  return (
    <div className="simulator-output-grid">
      {metrics.map(metric => (
        <div key={metric.label}>
          <small>{metric.label}</small>
          <strong>{metric.value}</strong>
          <em>{metric.unit}</em>
        </div>
      ))}
    </div>
  );
}

export default function SimulatorPage({ onBack, onNavigate }: Props) {
  const [activeView, setActiveView] = useState<SimulatorViewId>('integrated');
  const [fuelGasPosition, setFuelGasPosition] = useState(55);
  const [airRegisterPosition, setAirRegisterPosition] = useState(60);
  const [damperPosition, setDamperPosition] = useState(50);
  const [labels, setLabels] = useState(true);
  const [cameraCommand, setCameraCommand] = useState<CameraCommand>({ id: 1, action: 'fitHeater', component: 'Stack Damper' });
  const noSelect = useCallback(() => {}, []);
  const metrics = getCombustionTrainingMetrics(fuelGasPosition, airRegisterPosition, damperPosition);
  const view = SIMULATOR_VIEW_MAP[activeView];

  const issueCameraCommand = (action: CameraAction, component = view.selected) => {
    setCameraCommand(current => ({ id: current.id + 1, action, component: component || undefined }));
  };

  const changeView = (nextView: SimulatorViewId) => {
    const next = SIMULATOR_VIEW_MAP[nextView];
    setActiveView(nextView);
    setCameraCommand(current => ({
      id: current.id + 1,
      action: next.camera,
      component: next.selected || undefined,
    }));
  };

  const applyPreset = (key: PresetKey) => {
    const preset = combustionTrainingPresets[key];
    setFuelGasPosition(preset.fuel);
    setAirRegisterPosition(preset.air);
    setDamperPosition(preset.damperRestriction);
  };

  const reset = () => {
    applyPreset('balanced');
    setLabels(true);
    issueCameraCommand(view.camera);
  };

  const signedDraft = `${metrics.draftMmH2O > 0 ? '+' : ''}${metrics.draftMmH2O.toFixed(1)}`;

  const metricCards: MetricCard[] = activeView === 'combustion'
    ? [
        { label: 'HEAT INPUT', value: metrics.heatInputPctRef, unit: '% of reference*' },
        { label: 'ACTUAL AIR', value: metrics.actualAirPctStoich, unit: '% of stoichiometric' },
        { label: 'EXCESS AIR', value: metrics.excessAirPct, unit: '%' },
        { label: 'LAMBDA', value: metrics.lambda.toFixed(2), unit: 'relative air / fuel' },
        { label: 'RADIANT O₂', value: metrics.radiantOxygenPct.toFixed(1), unit: '% dry' },
        { label: 'CO*', value: metrics.coPpm, unit: 'ppm · training tendency' },
      ]
    : activeView === 'draft'
      ? [
          { label: 'ARCH DRAFT', value: signedDraft, unit: 'mmH₂O' },
          { label: 'DAMPER OPEN', value: metrics.damperOpeningPct.toFixed(0), unit: '%' },
          { label: 'CHIMNEY PULL', value: metrics.chimneyPullMmH2O.toFixed(1), unit: 'mmH₂O' },
          { label: 'PRESSURE LOSS', value: metrics.pressureLossMmH2O.toFixed(1), unit: 'mmH₂O' },
          { label: 'FLUE-GAS FLOW', value: metrics.flueGasFlowPctRef, unit: '% of reference*' },
          { label: 'STACK O₂', value: metrics.stackOxygenPct.toFixed(1), unit: '% dry · leakage cue' },
        ]
      : activeView === 'heatRecovery'
        ? [
            { label: 'STACK TEMP*', value: metrics.stackTemperatureC, unit: '°C · representative' },
            { label: 'HEAT INPUT', value: metrics.heatInputPctRef, unit: '% of reference*' },
            { label: 'FLUE-GAS FLOW', value: metrics.flueGasFlowPctRef, unit: '% of reference*' },
            { label: 'EXCESS AIR', value: metrics.excessAirPct, unit: '%' },
            { label: 'RADIANT O₂', value: metrics.radiantOxygenPct.toFixed(1), unit: '% dry' },
            { label: 'STACK O₂', value: metrics.stackOxygenPct.toFixed(1), unit: '% dry' },
          ]
        : [
            { label: 'HEAT INPUT', value: metrics.heatInputPctRef, unit: '% of reference*' },
            { label: 'ACTUAL AIR', value: metrics.actualAirPctStoich, unit: '% of stoichiometric' },
            { label: 'EXCESS AIR', value: metrics.excessAirPct, unit: '%' },
            { label: 'RADIANT O₂', value: metrics.radiantOxygenPct.toFixed(1), unit: '% dry' },
            { label: 'STACK O₂', value: metrics.stackOxygenPct.toFixed(1), unit: '% dry · leakage cue' },
            { label: 'CO*', value: metrics.coPpm, unit: 'ppm · training tendency' },
            { label: 'ARCH DRAFT', value: signedDraft, unit: 'mmH₂O' },
            { label: 'STACK TEMP*', value: metrics.stackTemperatureC, unit: '°C · representative' },
          ];

  return (
    <main className="app-shell architecture-page simulator-page">
      <header className="atlas-topbar architecture-topbar">
        <button className="back-atlas" onClick={onBack}><ArrowLeft size={16} /> Atlas</button>
        <div className="brand-lockup"><strong>FIRED HEATER <em>ATLAS</em></strong><span>SYSTEM RESPONSE SIMULATOR</span></div>
        <GlobalNavigation active="simulator" onNavigate={onNavigate} />
      </header>

      <section className="architecture-contextbar simulator-contextbar">
        <div><span>PHYSICS-BASED TRAINING SIMULATOR</span><strong>{view.contextTitle}</strong></div>
        <nav className="simulator-screen-tabs" aria-label="Simulator screens">
          {SIMULATOR_VIEWS.map(item => (
            <button
              key={item.id}
              className={activeView === item.id ? 'active' : ''}
              onClick={() => changeView(item.id)}
              aria-pressed={activeView === item.id}
            >
              <b>{item.index}</b>
              <span>{item.label}</span>
              <small>{item.shortDescription}</small>
            </button>
          ))}
        </nav>
      </section>

      <section className="simulator-workspace">
        <div className="simulator-viewer hero-viewer">
          <Heater3D
            mode="cutaway"
            selected={view.selected}
            labels={labels}
            flow={true}
            explode={false}
            contextMode={view.contextMode}
            damperPosition={damperPosition}
            airRegisterPosition={airRegisterPosition}
            fuelGasPosition={fuelGasPosition}
            burnerControlActive={true}
            burnerStudyMode={view.burnerStudyMode}
            heatRecoveryStudyMode={view.heatRecoveryStudyMode}
            draftStudyMode={view.draftStudyMode}
            cameraCommand={cameraCommand}
            onSelect={noSelect}
          />
          <div className={`simulator-state-badge ${metrics.state}`}>
            <Gauge size={15} />
            <div><span>LIVE STATE</span><b>{metrics.stateLabel}</b></div>
          </div>
          <div className="simulator-flow-legend"><span className="air">COMBUSTION AIR</span><span className="fuel">FUEL GAS</span><span className="hot">HOT PRODUCTS</span></div>
          <div className="simulator-camera-dock">
            <button onClick={() => issueCameraCommand(view.camera)}><Focus size={16} /> Fit</button>
            <button onClick={() => issueCameraCommand('zoomIn')}><ZoomIn size={16} /> Zoom +</button>
            <button onClick={() => issueCameraCommand('zoomOut')}><ZoomOut size={16} /> Zoom −</button>
            <button className={labels ? 'active' : ''} onClick={() => setLabels(value => !value)}><Eye size={16} /> Labels</button>
            <button className="active" disabled><Wind size={16} /> Flow Live</button>
            <button onClick={reset}><Rotate3D size={16} /> Reset</button>
          </div>
        </div>

        <aside className="simulator-console">
          <div className="simulator-console-head">
            <span><SlidersHorizontal size={14} /> {view.consoleKicker}</span>
            <h1>{view.heading}</h1>
            <p>{view.description}</p>
          </div>

          <div className="simulator-controls">
            {view.controls.includes('fuel') && (
              <RangeControl label="Fuel gas valve · relative demand" value={fuelGasPosition} onChange={setFuelGasPosition} left="LESS" right="MORE" />
            )}
            {view.controls.includes('air') && (
              <RangeControl label="Burner air register" value={airRegisterPosition} onChange={setAirRegisterPosition} left="CLOSED" right="OPEN" />
            )}
            {view.controls.includes('damper') && (
              <RangeControl label="Stack damper restriction" value={damperPosition} onChange={setDamperPosition} left="OPEN" right="MORE CLOSED" />
            )}
          </div>

          <div className="simulator-presets">
            <span>TRAINING SCENARIOS</span>
            <div>
              {view.presets.map(key => (
                <button key={key} onClick={() => applyPreset(key)}>{combustionTrainingPresets[key].label}</button>
              ))}
            </div>
          </div>

          <div className="simulator-output-heading">
            <span>LIVE PHYSICAL RESPONSE</span>
            <b>{metrics.converged ? `CONVERGED · ${metrics.iterations} ITERATIONS` : 'ITERATING'}</b>
          </div>
          <MetricGrid metrics={metricCards} />
        </aside>
      </section>
    </main>
  );
}
