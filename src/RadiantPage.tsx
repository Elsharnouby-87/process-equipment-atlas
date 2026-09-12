import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Eye, Focus, Info, Layers3, Rotate3D, ShieldAlert, Thermometer, Wind, Wrench, X, ZoomIn, ZoomOut } from 'lucide-react';
import Heater3D from './Heater3D';
import GlobalNavigation from './GlobalNavigation';
import type { NavigationTarget } from './GlobalNavigation';
import type { CameraAction, CameraCommand, RadiantScenario, RadiantStudy } from './modelTypes';

type Props = { onBack: () => void; onNavigate: (target: NavigationTarget) => void };

const studyViews: { id: RadiantStudy; title: string; subtitle: string }[] = [
  { id: 'full', title: 'Full Radiant', subtitle: 'Firebox, tubes, flames & refractory' },
  { id: 'pass', title: 'Single Pass', subtitle: 'Follow one vertical U-pass' },
  { id: 'supports', title: 'Supports & Bends', subtitle: 'Guides, clamps & return geometry' },
  { id: 'clearance', title: 'Flame Clearance', subtitle: 'Flame corridor vs tube surfaces' },
  { id: 'flow', title: 'Process Flow', subtitle: 'Process fluid through a radiant pass' },
  { id: 'inspection', title: 'Inspection', subtitle: 'Hot area, coking & mechanical condition' },
];

const anatomyParts = [
  ['01', 'Radiant Tube / Coil', 'Receives heat at the outside surface, conducts it through the tube wall and transfers it to the process fluid.'],
  ['02', 'Return Bend', 'Connects adjacent vertical tube legs to continue the process path.'],
  ['03', 'Tube Support / Guide', 'Supports and locates the coil; loss or damage can contribute to tube displacement or bowing.'],
  ['04', 'Lower Manifold / Connection', 'Represents the lower process connection region in this training model.'],
  ['05', 'Refractory Hot Face', 'Forms the hot enclosure and contributes to the radiant environment seen by the process coils.'],
  ['06', 'Flame Corridor', 'The firing space between burner flame envelopes and the radiant tube surfaces.'],
];

const systemPath = ['Radiant inlet', 'Vertical leg', 'Return bend', 'Vertical leg', 'Outlet / next connection'];
const heatPath = ['Flame + hot enclosure', 'Tube outside surface', 'Tube wall', 'Process fluid'];

const viewCopy: Record<RadiantStudy, { eyebrow: string; title: string; body: string; watch: string[] }> = {
  full: {
    eyebrow: 'RADIANT SECTION OVERVIEW',
    title: 'Follow heat from the firebox to the process fluid',
    body: 'The radiant section combines burner flames, the hot enclosure and vertical process coils. Heat reaches the outside of the process tubes, conducts through the tube wall and is removed by the flowing process fluid. The 3D glow is qualitative — it is not a tube-metal-temperature reading.',
    watch: ['Overall flame-to-tube relationship', 'Tube appearance and local contrast', 'Refractory / hot-face condition', 'Tube support and guide condition'],
  },
  pass: {
    eyebrow: 'SINGLE PASS STUDY',
    title: 'Follow one representative U-pass',
    body: 'One U-shaped radiant pass is emphasized while the remaining coil network is ghosted. This makes the process path, vertical legs and return bend easier to understand without implying plant-specific tube tags or pass numbering.',
    watch: ['Representative inlet and outlet direction', 'Vertical leg alignment', 'Return-bend continuity', 'Relative location to the firing corridor'],
  },
  supports: {
    eyebrow: 'MECHANICAL SUPPORT SYSTEM',
    title: 'Read the coil together with its supports and guides',
    body: 'Tube position is part of the inspection picture. A tube that is out of position or bowed can be associated with overheating or loss of a support / guide, so the coil and its support system should be understood together rather than as separate objects.',
    watch: ['Guide / clamp condition', 'Tube displacement, sagging or bowing', 'Return-bend condition', 'Evidence of damaged or missing support hardware'],
  },
  clearance: {
    eyebrow: 'COMBUSTION / TUBE INTERACTION',
    title: 'Keep the flame envelope clear of the tube surface',
    body: 'Direct visual contact between a burner flame and the external tube surface is the clearest indication of flame impingement. The training scenario deliberately shifts one representative flame toward a tube to show the geometry of the concern — not to prescribe a burner adjustment.',
    watch: ['Flame envelope relative to the nearest tube', 'Direct flame / tube contact', 'Localized bright or hot-looking tube area', 'Difference from the surrounding tube pattern'],
  },
  flow: {
    eyebrow: 'PROCESS-SIDE VISUALIZATION',
    title: 'Track process fluid through a radiant U-pass',
    body: 'The cyan path follows a representative process route through one radiant pass. Flowing process fluid is the heat-removal side of the tube; the animation is qualitative and is not a hydraulic, film-temperature or heat-transfer calculation.',
    watch: ['Direction through both vertical legs', 'Return-bend continuity', 'Relationship to the lower connection', 'No implication of plant-specific flow rate or pass balance'],
  },
  inspection: {
    eyebrow: 'INSPECTION & DAMAGE AWARENESS',
    title: 'Separate the visible symptom from the possible cause',
    body: 'A localized hot-looking area, tube displacement or bowing is an observation — not a root-cause diagnosis. Internal fouling / coking, concentrated heat input and flame impingement are examples of diagnostic context. The model keeps the internal-coke cue schematic and does not predict temperature, deposit thickness or remaining life.',
    watch: ['Localized tube contrast / hot-area cue', 'External distortion, displacement or bowing', 'Support / guide condition', 'Internal coking concept and reduced heat-removal path'],
  },
};

const scenarioMessage: Record<RadiantScenario, string> = {
  normal: 'Baseline geometry and qualitative thermal appearance only.',
  impingement: 'Direct flame / tube contact is shown as a visual training concern; no corrective operating action is prescribed.',
  hotspot: 'A localized hot-area cue is a symptom to investigate, not a numeric TMT value and not proof of one root cause.',
  coking: 'The dark internal deposit is schematic and process-side; it represents the concept that internal deposits can impede heat transfer and tube cooling.',
};

export default function RadiantPage({ onBack, onNavigate }: Props) {
  const [study, setStudy] = useState<RadiantStudy>('full');
  const [scenario, setScenario] = useState<RadiantScenario>('normal');
  const [labels, setLabels] = useState(true);
  const [flow, setFlow] = useState(false);
  const [mobileSheet, setMobileSheet] = useState<'views' | 'details' | null>(null);
  const [cameraCommand, setCameraCommand] = useState<CameraCommand>({ id: 1, action: 'radiantFull', component: 'Radiant Tubes' });
  const noSelect = useCallback(() => {}, []);
  const cameraAction = useCallback((action: CameraAction) => setCameraCommand(current => ({ id: current.id + 1, action, component: 'Radiant Tubes' })), []);
  const copy = viewCopy[study];

  useEffect(() => {
    const actionMap: Record<RadiantStudy, CameraAction> = { full: 'radiantFull', pass: 'radiantPass', supports: 'radiantSupports', clearance: 'radiantClearance', flow: 'radiantFlow', inspection: 'radiantInspection' };
    cameraAction(actionMap[study]);
    if (study === 'flow') setFlow(true);
  }, [study, cameraAction]);

  const chooseScenario = (next: RadiantScenario) => {
    setScenario(next);
    if (next === 'impingement') setStudy('clearance');
    else if (next === 'hotspot' || next === 'coking') setStudy('inspection');
  };

  const currentAction: CameraAction = study === 'full' ? 'radiantFull' : study === 'pass' ? 'radiantPass' : study === 'supports' ? 'radiantSupports' : study === 'clearance' ? 'radiantClearance' : study === 'flow' ? 'radiantFlow' : 'radiantInspection';

  return (
    <main className="app-shell radiant-page">
      <header className="atlas-topbar radiant-topbar">
        <button className="back-atlas" onClick={onBack}><ArrowLeft size={16} /> Atlas</button>
        <div className="brand-lockup"><strong>FIRED HEATER <em>ATLAS</em></strong><span>COMPONENT STUDY · RADIANT SECTION</span></div>
        <GlobalNavigation active="components" onNavigate={onNavigate} className="radiant-nav" />
      </header>

      <section className="radiant-contextbar"><div><span>COMPONENT / RADIANT SECTION</span><strong>Vertical Radiant Coil — Training Configuration</strong></div><p>Qualitative visualization · No plant-specific tube tags, TMT limits, heat flux or CFD prediction</p></section>

      <section className="radiant-workspace">
        <aside className="radiant-left">
          <div className="radiant-title-block"><span>RADIANT ANATOMY</span><h1>From firing environment to process heat</h1><p>Study the whole firebox, one representative process pass, the support system, flame clearance and common inspection concerns.</p></div>
          <div className="radiant-study-tabs">{studyViews.map((view, index) => <button key={view.id} className={study === view.id ? 'active' : ''} onClick={() => setStudy(view.id)}><b>0{index + 1}</b><span><strong>{view.title}</strong><small>{view.subtitle}</small></span></button>)}</div>
          <div className="radiant-parts"><span>MAIN ELEMENTS</span>{anatomyParts.map(([number, name, description]) => <div className="radiant-part" key={number}><b>{number}</b><div><strong>{name}</strong><p>{description}</p></div></div>)}</div>
        </aside>

        <div className="radiant-viewer hero-viewer">
          <Heater3D mode="cutaway" selected="Radiant Tubes" labels={labels} flow={flow} explode={false} contextMode={study === 'full' ? 'focus' : 'isolate'} damperPosition={18} radiantStudyMode={study} radiantScenario={scenario} cameraCommand={cameraCommand} onSelect={noSelect} />
          <div className="viewer-kicker radiant-kicker"><i /> RADIANT 3D STUDY <span>Drag to rotate · Wheel / pinch to zoom</span></div>
          <div className="radiant-view-state"><span>{copy.eyebrow}</span><b>{studyViews.find(view => view.id === study)?.title}</b></div>
          <div className="radiant-center-tabs">{studyViews.map(view => <button key={view.id} className={study === view.id ? 'active' : ''} onClick={() => setStudy(view.id)}>{view.title}</button>)}</div>
          {study === 'pass' && <div className="radiant-pass-badge"><Focus size={14} /><span><b>REPRESENTATIVE PASS</b> · schematic U-pass, not a plant tag</span></div>}
          {flow && <div className="radiant-flow-legend"><span className="process">PROCESS FLUID</span><span className="heat">RADIANT ENVIRONMENT</span></div>}
          {scenario !== 'normal' && <div className={`radiant-scenario-badge ${scenario}`}><ShieldAlert size={14} /><span>TRAINING SCENARIO · <b>{scenario.replace('-', ' ').toUpperCase()}</b></span></div>}
          <div className="control-dock radiant-control-dock"><button title="Fit radiant study" onClick={() => cameraAction(currentAction)}><Focus size={17} /> Fit Radiant</button><button onClick={() => cameraAction('zoomIn')}><ZoomIn size={17} /> Zoom +</button><button onClick={() => cameraAction('zoomOut')}><ZoomOut size={17} /> Zoom −</button><button className={labels ? 'active' : ''} onClick={() => setLabels(value => !value)}><Eye size={17} /> Labels</button><button className={flow ? 'active' : ''} onClick={() => setFlow(value => !value)}><Wind size={17} /> Process Flow</button><button onClick={() => { setScenario('normal'); setStudy('full'); setFlow(false); cameraAction('radiantFull'); }}><Rotate3D size={17} /> Reset</button></div>
          <div className="study-mobile-actions"><button onClick={() => setMobileSheet('views')}><Layers3 size={17} /> Views</button><button onClick={() => setMobileSheet('details')}><Info size={17} /> Details</button></div>
          <div className={`study-mobile-sheet ${mobileSheet ? 'open' : ''}`}>
            <button className="study-mobile-close" onClick={() => setMobileSheet(null)} aria-label="Close mobile study panel"><X size={17} /></button>
            {mobileSheet === 'views' ? <><span className="sheet-eyebrow">RADIANT STUDY VIEWS</span><div className="sheet-view-grid">{studyViews.map(view => <button key={view.id} className={study === view.id ? 'active' : ''} onClick={() => { setStudy(view.id); setMobileSheet(null); }}><strong>{view.title}</strong><small>{view.subtitle}</small></button>)}</div></> : <><span className="sheet-eyebrow">{copy.eyebrow}</span><h3>{copy.title}</h3><p>{copy.body}</p><span className="sheet-subhead">WHAT TO OBSERVE</span><ul>{copy.watch.map(item => <li key={item}>{item}</li>)}</ul><span className="sheet-subhead">TRAINING SCENARIOS</span><div className="sheet-chip-row"><button className={scenario === 'normal' ? 'active' : ''} onClick={() => chooseScenario('normal')}>Normal</button><button className={scenario === 'impingement' ? 'active' : ''} onClick={() => chooseScenario('impingement')}>Impingement</button><button className={scenario === 'hotspot' ? 'active' : ''} onClick={() => chooseScenario('hotspot')}>Hot Area</button><button className={scenario === 'coking' ? 'active' : ''} onClick={() => chooseScenario('coking')}>Internal Coking</button></div><p className="sheet-note">{scenarioMessage[scenario]}</p></>}
          </div>
          <div className="radiant-mobile-summary"><Thermometer size={17} /><span>{copy.title}</span></div>
        </div>

        <aside className="radiant-tech">
          <div className="radiant-tech-head"><span>{copy.eyebrow}</span><h2>{copy.title}</h2><p>{copy.body}</p></div>
          <section className="radiant-tech-section"><span>WHAT TO OBSERVE</span><ul>{copy.watch.map(item => <li key={item}>{item}</li>)}</ul></section>
          <section className="radiant-tech-section"><span>HEAT PATH · CONCEPT</span><div className="radiant-scenario-chips">{heatPath.map(item => <button key={item} disabled>{item}</button>)}</div><p className="scenario-note">Heat reaches the tube outside surface from the firebox environment, conducts through the tube wall, then transfers to the process fluid. No heat-flux or film-temperature calculation is implied.</p></section>
          <section className="radiant-tech-section"><span>TRAINING SCENARIOS</span><div className="radiant-scenario-chips"><button className={scenario === 'normal' ? 'active' : ''} onClick={() => chooseScenario('normal')}>Normal</button><button className={scenario === 'impingement' ? 'active danger' : ''} onClick={() => chooseScenario('impingement')}>Flame Impingement</button><button className={scenario === 'hotspot' ? 'active danger' : ''} onClick={() => chooseScenario('hotspot')}>Local Hot Area</button><button className={scenario === 'coking' ? 'active' : ''} onClick={() => chooseScenario('coking')}>Internal Coking</button></div><p className="scenario-note">{scenarioMessage[scenario]}</p></section>
          <section className="radiant-tech-section"><span>WHY IT MATTERS</span><p>Localized heat input and internal deposits can reduce the normal heat-transfer / cooling relationship at the tube wall. A visible hot area therefore matters, but the visual symptom alone does not establish one root cause.</p></section>
          <section className="radiant-tech-section"><span>INSPECTION FOCUS</span><ul><li>Direct flame-to-tube contact and flame pattern</li><li>Tube surface condition and localized contrast</li><li>Tube displacement, sagging or bowing</li><li>Supports, guides and return bends</li><li>Refractory / hot-face uniformity and condition</li></ul></section>
          <section className="radiant-warning"><Wrench size={17} /><p><b>Training model — not a measurement or diagnosis.</b> Tube glow, hot-area color and coking graphics are qualitative. Actual metallurgy, dimensions, pass arrangement, tube-metal-temperature limits, inspection criteria and operating response come from plant drawings, approved procedures, OEM data and applicable engineering standards.</p></section>
          <div className="radiant-path"><span>REPRESENTATIVE PROCESS PATH</span><div>{systemPath.map((item, index) => <span key={item}>{item}{index < systemPath.length - 1 && <i>›</i>}</span>)}</div></div>
        </aside>
      </section>
    </main>
  );
}
