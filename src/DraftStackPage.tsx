import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Eye, Focus, Gauge, Info, Layers3, Rotate3D, ScanLine, ShieldAlert, Wind, Wrench, X, ZoomIn, ZoomOut } from 'lucide-react';
import Heater3D from './Heater3D';
import GlobalNavigation from './GlobalNavigation';
import type { NavigationTarget } from './GlobalNavigation';
import type { CameraAction, CameraCommand, ContextMode, DraftPressureScenario, DraftStudy } from './modelTypes';
import { draftTrainingPresets, getDraftTrainingMetrics } from './draftTrainingLogic';
import './draftInstrumentation.css';

type Props = { onBack: () => void; onNavigate: (target: NavigationTarget) => void };
type ExtendedDraftStudy = DraftStudy | 'instruments' | 'analyzers';

type StudyCopy = {
  eyebrow: string;
  title: string;
  body: string;
  watch: string[];
};

const studyViews: { id: ExtendedDraftStudy; title: string; subtitle: string }[] = [
  { id: 'overview', title: 'System Overview', subtitle: 'Convection outlet to stack discharge' },
  { id: 'breeching', title: 'Breeching', subtitle: 'Collect and turn the flue-gas path' },
  { id: 'damper', title: 'Stack Damper', subtitle: 'Blade, shaft and actuator relationship' },
  { id: 'path', title: 'Draft Path', subtitle: 'Hot gas + oxygen / excess-air cue' },
  { id: 'stack', title: 'Stack', subtitle: 'Vertical discharge and chimney effect' },
  { id: 'instruments', title: 'Draft Instruments', subtitle: 'Arch draft tap · PI/PT · mmH₂O' },
  { id: 'analyzers', title: 'Stack Analyzers', subtitle: 'O₂ · CO · NOx · SOx' },
  { id: 'pressure', title: 'Pressure Awareness', subtitle: 'Negative draft vs positive-pressure hazard' },
];

const viewCopy: Record<ExtendedDraftStudy, StudyCopy> = {
  overview: {
    eyebrow: 'DRAFT & FLUE-GAS SYSTEM',
    title: 'Read breeching, damper, instruments and stack as one connected pressure path',
    body: 'Flue gas leaving the convection section is collected by the breeching, crosses the internal stack-damper region and then rises through the stack. The arch draft instrument and stack gas analyzers are now part of the same training system so position, pressure and gas-analysis trends can be read together.',
    watch: ['Convection outlet into breeching', 'Internal damper location and shaft', 'Arch / radiant-roof draft reference point', 'Stack sample probe and analyzer cabinet'],
  },
  breeching: {
    eyebrow: 'BREECHING / TRANSITION DUCT',
    title: 'Collect the upper gas flow and guide it toward the stack',
    body: 'The breeching transitions the broad convection outlet into the narrower stack inlet. Its geometry, casing condition, leakage and internal restriction contribute to pressure loss in the upper flue-gas path.',
    watch: ['Duct casing and seams', 'Transition geometry', 'Signs of leakage or distortion', 'Clear passage toward the stack inlet'],
  },
  damper: {
    eyebrow: 'INTERNAL DAMPER ASSEMBLY',
    title: 'Move the blade and watch the training pressure / analyzer response',
    body: 'The stack damper varies exhaust-path resistance and therefore participates in draft control. The slider now drives a simplified training response: opening the damper increases draft pull, while closing it reduces draft pull and can move the firebox toward a positive-pressure concern.',
    watch: ['Blade plane relative to the gas path', 'Blade rotation about the shaft', 'External linkage following the shaft', 'Draft, O₂ and CO response as the restriction changes'],
  },
  path: {
    eyebrow: 'QUALITATIVE FLUE-GAS PATH',
    title: 'Follow hot flue gas and the smaller oxygen / excess-air cue through the upper heater',
    body: 'Orange particles show the main qualitative hot flue-gas route. A much smaller pale-cyan particle population is added as a visual cue for residual oxygen / excess air and possible leakage-air contribution. Particle count is intentionally illustrative and is not a species balance, CFD result or molar composition.',
    watch: ['Orange gas collected above convection', 'Convergence through breeching', 'Passage through the damper region', 'Pale-cyan oxygen / excess-air cue remaining clearly secondary to the orange stream'],
  },
  stack: {
    eyebrow: 'STACK / CHIMNEY',
    title: 'Discharge combustion products and contribute to natural draft',
    body: 'The stack provides the final vertical discharge path. The density difference between the hot internal gas column and outside air contributes to natural draft, while the actual draft depends on the complete heater, gas temperature and flow resistance.',
    watch: ['Stack shell and seams', 'Damper region below', 'Gas-analysis sample-probe location', 'Corrosion, vibration or abnormal temperature pattern'],
  },
  instruments: {
    eyebrow: 'ARCH DRAFT INSTRUMENTATION',
    title: 'Measure draft where the training pressure profile is most informative',
    body: 'The main training draft indication is tied to the radiant-roof / arch region, commonly the highest-pressure / lowest-draft point in a natural-draft heater. A local PI/PT concept is shown with a −20 to +20 mmH₂O display. The value is representative and changes with the damper slider; it is not a universal operating setpoint.',
    watch: ['Pressure tap at the radiant-roof / arch region', 'Sensing line to the local indication', 'Live mmH₂O value', 'Direction of change as the stack damper is opened or closed'],
  },
  analyzers: {
    eyebrow: 'STACK GAS ANALYZERS',
    title: 'Read O₂ and CO with draft — not in isolation',
    body: 'A representative stack sample probe and analyzer cabinet display O₂, CO, NOx and SOx training cues. O₂ and CO respond to the simplified damper / draft model. NOx remains qualitative because it depends strongly on burner design, flame temperature and firing conditions. SOx is shown as fuel-sulfur dependent rather than a direct damper response.',
    watch: ['Stack sample probe and sample line', 'O₂ trend versus draft pull', 'CO rise when available draft / air becomes insufficient', 'NOx and SOx kept qualitative rather than falsely precise'],
  },
  pressure: {
    eyebrow: 'FIREBOX PRESSURE AWARENESS',
    title: 'Read the pressure profile — and drive it with the damper',
    body: 'For the natural-draft process-heater concept shown here, the firebox is normally maintained under negative pressure. The radiant roof / arch is commonly the highest-pressure region, so keeping that region slightly negative helps preserve inward leakage tendency. Closing the stack damper reduces draft pull; excessive closure can move the representative training model toward positive pressure and outward hot-gas leakage.',
    watch: ['Live arch-draft indication', 'Damper restriction versus pressure direction', 'O₂ and CO trends at the same time', 'Signs of hot-gas leakage when the training pressure becomes positive'],
  },
};

const systemPath = ['Convection outlet', 'Breeching', 'Stack damper', 'Stack', 'Discharge'];

function mappedDraftStudy(study: ExtendedDraftStudy): DraftStudy {
  if (study === 'instruments') return 'pressure';
  if (study === 'analyzers') return 'stack';
  return study;
}

function cameraForStudy(study: ExtendedDraftStudy): CameraAction {
  if (study === 'overview') return 'draftOverview';
  if (study === 'breeching') return 'draftBreeching';
  if (study === 'damper') return 'draftDamper';
  if (study === 'path') return 'draftPath';
  if (study === 'stack') return 'draftStack';
  if (study === 'instruments') return 'draftPressure';
  if (study === 'analyzers') return 'draftStack';
  return 'draftPressure';
}

function selectedForStudy(study: ExtendedDraftStudy) {
  if (study === 'damper') return 'Stack Damper';
  if (study === 'stack') return 'Stack';
  if (study === 'instruments') return 'Draft Instruments';
  if (study === 'analyzers') return 'Stack Analyzers';
  return 'Breeching';
}

function shouldShowFlow(_study: ExtendedDraftStudy) {
  return true;
}

export default function DraftStackPage({ onBack, onNavigate }: Props) {
  const [study, setStudy] = useState<ExtendedDraftStudy>('overview');
  const [damperPosition, setDamperPosition] = useState(50);
  const [labels, setLabels] = useState(true);
  const [flow, setFlow] = useState(true);
  const [mobileSheet, setMobileSheet] = useState<'views' | 'details' | null>(null);
  const [damperTeachingActive, setDamperTeachingActive] = useState(false);
  const damperTeachingTimer = useRef<number | null>(null);
  const [cameraCommand, setCameraCommand] = useState<CameraCommand>({ id: 1, action: 'draftOverview', component: 'Breeching' });
  const noSelect = useCallback(() => {}, []);
  const copy = viewCopy[study];
  const selected = selectedForStudy(study);
  const metrics = getDraftTrainingMetrics(damperPosition);
  const pressureScenario: DraftPressureScenario = metrics.draftMmH2O >= 0 ? 'positive' : 'negative';
  const contextMode: ContextMode = study === 'pressure' ? 'full' : ['overview', 'path', 'instruments', 'analyzers'].includes(study) ? 'focus' : 'isolate';

  const cameraAction = useCallback((action: CameraAction, component = selected) => {
    setCameraCommand(current => ({ id: current.id + 1, action, component }));
  }, [selected]);

  const updateDamper = useCallback((value: number) => {
    setDamperPosition(value);
    setDamperTeachingActive(true);
    if (damperTeachingTimer.current !== null) window.clearTimeout(damperTeachingTimer.current);
    damperTeachingTimer.current = window.setTimeout(() => setDamperTeachingActive(false), 1500);
  }, []);

  useEffect(() => () => {
    if (damperTeachingTimer.current !== null) window.clearTimeout(damperTeachingTimer.current);
  }, []);

  useEffect(() => {
    cameraAction(cameraForStudy(study), selected);
    setFlow(shouldShowFlow(study));
  }, [study, selected, cameraAction]);

  const applyPreset = (key: keyof typeof draftTrainingPresets) => {
    updateDamper(draftTrainingPresets[key].damperRestriction);
  };

  const resetStudy = () => {
    setStudy('overview');
    setDamperPosition(50);
    setFlow(true);
    setLabels(true);
    setDamperTeachingActive(false);
    cameraAction('draftOverview', 'Breeching');
  };

  return (
    <main className="app-shell draft-page">
      <header className="atlas-topbar radiant-topbar draft-topbar">
        <button className="back-atlas" onClick={onBack}><ArrowLeft size={16} /> Atlas</button>
        <div className="brand-lockup"><strong>FIRED HEATER <em>ATLAS</em></strong><span>COMPONENT STUDY · DRAFT & INSTRUMENTATION</span></div>
        <GlobalNavigation active="components" onNavigate={onNavigate} className="radiant-nav" />
      </header>

      <section className="radiant-contextbar draft-contextbar">
        <div><span>DRAFT / FLUE-GAS / ANALYZER SYSTEM</span><strong>Breeching · Stack Damper · Arch Draft · Stack Analyzers</strong></div>
        <p>Representative training interaction · Site / OEM / BMS limits and procedures govern actual operation</p>
      </section>

      <section className="radiant-workspace draft-workspace">
        <aside className="radiant-left draft-left">
          <div className="radiant-title-block draft-title-block">
            <span>DRAFT SYSTEM ANATOMY</span>
            <h1>Pressure, gas path and analyzers — one connected training system</h1>
            <p>Move from physical anatomy into the first simplified operating interaction: one damper control now drives a representative arch-draft, O₂ and CO response.</p>
          </div>
          <div className="radiant-study-tabs draft-study-tabs">
            {studyViews.map((view, index) => (
              <button key={view.id} className={study === view.id ? 'active' : ''} onClick={() => setStudy(view.id)}>
                <b>{String(index + 1).padStart(2, '0')}</b>
                <span><strong>{view.title}</strong><small>{view.subtitle}</small></span>
              </button>
            ))}
          </div>
          <div className="draft-principle-note">
            <Gauge size={17} />
            <div><b>CORE OPERATING PRINCIPLE</b><p>The arch / radiant-roof region is a key draft reference in many natural-draft heaters. The numbers here are representative training values, not universal plant targets.</p></div>
          </div>
        </aside>

        <div className="radiant-viewer draft-viewer hero-viewer">
          <Heater3D
            mode={study === 'pressure' || study === 'instruments' || study === 'analyzers' ? 'normal' : 'cutaway'}
            selected={selected}
            labels={labels}
            flow={flow}
            explode={false}
            contextMode={contextMode}
            damperPosition={damperPosition}
            draftStudyMode={mappedDraftStudy(study)}
            draftPressureScenario={pressureScenario}
            cameraCommand={cameraCommand}
            onSelect={noSelect}
          />

          <div className="viewer-kicker draft-kicker"><i /> DRAFT & INSTRUMENTATION 3D <span>Drag to rotate · Wheel / pinch to zoom</span></div>
          <div className="radiant-view-state draft-view-state"><span>{copy.eyebrow}</span><b>{studyViews.find(view => view.id === study)?.title}</b></div>

          <div className="radiant-center-tabs draft-center-tabs draft-center-tabs-expanded">
            {studyViews.map(view => <button key={view.id} className={study === view.id ? 'active' : ''} onClick={() => setStudy(view.id)}>{view.title}</button>)}
          </div>

          {study !== 'pressure' && <div className="draft-system-badge">CONVECTION → BREECHING → DAMPER → STACK</div>}
          <div className="radiant-flow-legend draft-flow-legend draft-flow-legend-dual"><span className="heat">HOT FLUE GAS · LIVE</span><span className="oxygen">EXCESS AIR / O₂ CUE · QUALITATIVE</span></div>
          {study === 'pressure' && <div className={`radiant-scenario-badge draft-pressure-badge ${pressureScenario}`}><ShieldAlert size={14} /><span>{metrics.stateLabel.toUpperCase()}</span></div>}

          <div className={`draft-live-strip ${metrics.state}`}>
            <div><span>DAMPER OPENING</span><strong>{metrics.damperOpening.toFixed(0)}% <small>· blade {metrics.bladeAngleDeg}°</small></strong></div>
            <div><span>ARCH DRAFT</span><strong>{metrics.draftMmH2O > 0 ? '+' : ''}{metrics.draftMmH2O.toFixed(1)} <small>mmH₂O</small></strong></div>
            <div><span>O₂</span><strong>{metrics.oxygenPct.toFixed(1)} <small>%</small></strong></div>
            <div><span>CO*</span><strong>{metrics.coPpm} <small>ppm</small></strong></div>
            <em>{metrics.stateLabel}</em>
          </div>

          <div className={`draft-instrument-flyout ${metrics.state} ${damperTeachingActive ? 'active' : ''}`} aria-hidden={!damperTeachingActive}>
            <div className="draft-instrument-clone pt"><span>ARCH PT / PI</span><strong>{metrics.draftMmH2O > 0 ? '+' : ''}{metrics.draftMmH2O.toFixed(1)}</strong><small>mmH₂O · from radiant-roof reference</small></div>
            <div className="draft-instrument-clone o2"><span>STACK O₂ ANALYZER</span><strong>{metrics.oxygenPct.toFixed(1)}%</strong><small>{metrics.oxygenLabel}</small></div>
          </div>

          <div className="control-dock radiant-control-dock draft-control-dock">
            <button title="Fit draft study" onClick={() => cameraAction(cameraForStudy(study))}><Focus size={17} /> Fit Study</button>
            <button onClick={() => cameraAction('zoomIn')}><ZoomIn size={17} /> Zoom +</button>
            <button onClick={() => cameraAction('zoomOut')}><ZoomOut size={17} /> Zoom −</button>
            <button className={labels ? 'active' : ''} onClick={() => setLabels(value => !value)}><Eye size={17} /> Labels</button>
            <button className="active" title="Flue-gas and O₂ cues remain live in draft studies"><Wind size={17} /> Flow Live</button>
            <button onClick={resetStudy}><Rotate3D size={17} /> Reset</button>
          </div>

          <div className="study-mobile-actions"><button onClick={() => setMobileSheet('views')}><Layers3 size={17} /> Views</button><button onClick={() => setMobileSheet('details')}><Info size={17} /> Details</button></div>
          <div className={`study-mobile-sheet ${mobileSheet ? 'open' : ''}`}>
            <button className="study-mobile-close" onClick={() => setMobileSheet(null)} aria-label="Close mobile study panel"><X size={17} /></button>
            {mobileSheet === 'views' ? (
              <>
                <span className="sheet-eyebrow">DRAFT / INSTRUMENTATION STUDIES</span>
                <div className="sheet-view-grid">{studyViews.map(view => <button key={view.id} className={study === view.id ? 'active' : ''} onClick={() => { setStudy(view.id); setMobileSheet(null); }}><strong>{view.title}</strong><small>{view.subtitle}</small></button>)}</div>
              </>
            ) : (
              <>
                <span className="sheet-eyebrow">{copy.eyebrow}</span><h3>{copy.title}</h3><p>{copy.body}</p>
                <span className="sheet-subhead">LIVE TRAINING RESPONSE</span>
                <div className="draft-mobile-metrics"><b>{metrics.draftMmH2O.toFixed(1)} mmH₂O</b><b>O₂ {metrics.oxygenPct.toFixed(1)}%</b><b>CO {metrics.coPpm} ppm*</b><b>Blade {metrics.bladeAngleDeg}°</b></div>
                <span className="sheet-subhead">DAMPER RESTRICTION</span>
                <div className="draft-damper-control mobile"><div><b>MORE OPEN</b><b>MORE CLOSED</b></div><input aria-label="Qualitative stack damper position" type="range" min="0" max="100" value={damperPosition} onPointerDown={() => updateDamper(damperPosition)} onChange={event => updateDamper(Number(event.target.value))} /></div>
                <p className="sheet-note">Representative training logic only. O₂ / CO are not universal plant targets or alarm values.</p>
              </>
            )}
          </div>
          <div className="radiant-mobile-summary draft-mobile-summary"><Gauge size={17} /><span>{metrics.stateLabel} · {metrics.draftMmH2O.toFixed(1)} mmH₂O</span></div>
        </div>

        <aside className="radiant-tech draft-tech">
          <div className="radiant-tech-head draft-tech-head"><span>{copy.eyebrow}</span><h2>{copy.title}</h2><p>{copy.body}</p></div>

          <section className="radiant-tech-section draft-simulator-panel">
            <span>SIMPLIFIED TRAINING RESPONSE</span>
            <div className={`draft-state-card ${metrics.state}`}><b>{metrics.stateLabel}</b><p>{metrics.stateNote}</p></div>
            <div className="draft-response-grid">
              <div><small>ARCH DRAFT</small><strong>{metrics.draftMmH2O > 0 ? '+' : ''}{metrics.draftMmH2O.toFixed(1)}</strong><em>mmH₂O</em></div>
              <div><small>O₂</small><strong>{metrics.oxygenPct.toFixed(1)}</strong><em>% · {metrics.oxygenLabel}</em></div>
              <div><small>CO*</small><strong>{metrics.coPpm}</strong><em>ppm · {metrics.coLabel}</em></div>
              <div><small>DAMPER</small><strong>{metrics.damperOpening.toFixed(0)}</strong><em>% open · blade {metrics.bladeAngleDeg}°</em></div>
            </div>
            <div className="draft-damper-control"><div><b>MORE OPEN</b><b>MORE CLOSED</b></div><input aria-label="Qualitative stack damper position" type="range" min="0" max="100" value={damperPosition} onPointerDown={() => updateDamper(damperPosition)} onChange={event => updateDamper(Number(event.target.value))} /></div>
            <div className="draft-preset-row"><button onClick={() => applyPreset('excess')}>Excess Draft</button><button className="target" onClick={() => applyPreset('target')}>Near Target</button><button className="danger" onClick={() => applyPreset('positive')}>Positive Concern</button></div>
            <p className="scenario-note">One-variable training experiment: only the stack-damper restriction is being changed. Burner air-register position, firing rate, fuel composition and ambient conditions are intentionally held outside this simplified model.</p>
          </section>

          <section className="radiant-tech-section"><span>WHAT TO OBSERVE</span><ul>{copy.watch.map(item => <li key={item}>{item}</li>)}</ul></section>

          {study === 'instruments' && <section className="radiant-tech-section"><span>DRAFT INSTRUMENTATION BASIS</span><ul><li><b>Primary training reference:</b> radiant roof / arch region.</li><li><b>Display range:</b> −20 to +20 mmH₂O for visualization.</li><li><b>Typical principle:</b> opening the stack damper makes draft more negative; closing it makes draft less negative.</li><li><b>Boundary:</b> the live number is a representative training response, not a universal setpoint or alarm.</li></ul></section>}

          {study === 'analyzers' && <section className="radiant-tech-section analyzer-readout-section"><span>STACK ANALYZER INTERPRETATION</span><div className="analyzer-mini-grid"><div><b>O₂</b><strong>{metrics.oxygenPct.toFixed(1)}%</strong><small>{metrics.oxygenLabel}</small></div><div><b>CO*</b><strong>{metrics.coPpm} ppm</strong><small>{metrics.coLabel}</small></div><div><b>NOx</b><strong>TREND ONLY</strong><small>{metrics.noxLabel}</small></div><div><b>SOx</b><strong>TREND ONLY</strong><small>{metrics.soxLabel}</small></div></div><p className="scenario-note">Stack O₂ can be biased upward by tramp / leakage air depending on where the air enters relative to the sample point. SOx is shown as fuel-sulfur dependent rather than as a direct damper effect.</p></section>}

          {study === 'path' && <section className="radiant-tech-section"><span>PARTICLE LEGEND</span><div className="draft-particle-explainer"><p><i className="orange-dot" /><b>Orange:</b> main hot flue-gas path.</p><p><i className="blue-dot" /><b>Pale cyan:</b> residual O₂ / excess-air / leakage-air awareness cue.</p></div><p className="scenario-note">The cyan population is intentionally about one-sixth of the orange particle population (~16.7% by count). This is a visual teaching ratio only and is not a conversion of 3–4% O₂ into particle count.</p></section>}

          {study === 'pressure' && <section className="radiant-tech-section"><span>PRESSURE-PROFILE LOGIC</span><ul><li><b>Radiant roof / arch:</b> commonly the highest-pressure / lowest-draft region and therefore a key control reference.</li><li><b>Burner elevation:</b> useful for understanding draft available across natural-draft burners.</li><li><b>Convection outlet / below damper:</b> can help interpret pressure loss through the convection section when used with the roof reading.</li></ul></section>}

          <section className="radiant-tech-section"><span>SYSTEM RELATIONSHIP</span><p>Draft comes from the pressure balance of the full heater and stack. The stack provides natural-draft driving force while burners, tube banks, breeching, damper and other restrictions consume part of that pressure difference. Excessive negative draft increases air leakage; insufficient draft can reduce burner-air delivery and, if pressure becomes positive, reverse the leakage direction.</p></section>

          <section className="radiant-warning draft-warning"><Wrench size={17} /><p><b>Training boundary.</b> Gas-particle speed, stretching and crowding visualize evacuation / pressure tendency only; they are not CFD velocity or mass-flow results. Draft, O₂ and CO values are representative signals chosen to teach direction and coupling. Actual acceptable ranges, analyzer alarms, burner-air settings and damper targets come from the heater design, site procedures, OEM guidance and approved operating limits.</p></section>

          <div className="radiant-path draft-path"><span>SYSTEM PATH</span><div>{systemPath.map((item, index) => <span key={item}>{item}{index < systemPath.length - 1 && <i>›</i>}</span>)}</div></div>
          <p className="draft-footnote">* CO number is a representative training cue only. NOx and SOx remain qualitative by design.</p>
        </aside>
      </section>
    </main>
  );
}
