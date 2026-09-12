import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Eye, Flame, Focus, Info, Layers3, Rotate3D, ShieldAlert, Thermometer, Wind, Wrench, X, ZoomIn, ZoomOut } from 'lucide-react';
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
  { id: 'inspection', title: 'Inspection', subtitle: 'Hot spot, coking & mechanical condition' },
];

const anatomyParts = [
  ['01', 'Radiant Tube / Coil', 'Receives intense radiant heat and transfers it to the process fluid.'],
  ['02', 'Return Bend', 'Connects adjacent vertical tube legs to continue the process path.'],
  ['03', 'Tube Support / Guide', 'Supports tube weight while allowing controlled thermal movement.'],
  ['04', 'Lower Manifold / Connection', 'Represents the lower process connection region in this training model.'],
  ['05', 'Refractory Hot Face', 'Defines the high-temperature enclosure and reflects radiation toward the process coil.'],
  ['06', 'Flame Corridor', 'Space required between firing envelopes and radiant tube surfaces.'],
];

const systemPath = ['Radiant inlet', 'Vertical leg', 'Return bend', 'Vertical leg', 'Outlet / next connection'];

const viewCopy: Record<RadiantStudy, { eyebrow: string; title: string; body: string; watch: string[] }> = {
  full: { eyebrow: 'RADIANT SECTION OVERVIEW', title: 'See the complete radiant heat-transfer environment', body: 'The radiant section combines burner flames, hot refractory and vertical process coils. The tubes receive heat primarily by radiation while the firing corridor must remain clear of direct flame contact.', watch: ['Overall flame-to-tube relationship', 'Tube color and symmetry', 'Refractory condition', 'Tube support and guide condition'] },
  pass: { eyebrow: 'SINGLE PASS STUDY', title: 'Follow one representative U-pass', body: 'One U-shaped radiant pass is emphasized while the remaining coil network is ghosted. This makes the process path, vertical legs and top return bend easier to understand without implying plant-specific tag numbers.', watch: ['Inlet and outlet direction', 'Vertical leg alignment', 'Return bend geometry', 'Relative location to the flame corridor'] },
  supports: { eyebrow: 'MECHANICAL SUPPORT SYSTEM', title: 'Supports, guides and return bends', body: 'Radiant tubes expand and move as temperature changes. Supports and guides must carry the coil while avoiding unwanted restraint, distortion or loss of alignment.', watch: ['Guide / clamp condition', 'Evidence of sagging or bowing', 'Return-bend condition', 'Clearances around supports'] },
  clearance: { eyebrow: 'COMBUSTION / TUBE INTERACTION', title: 'Flame clearance and impingement awareness', body: 'A stable flame should remain within the intended firing corridor and clear of radiant tube surfaces. The training scenario can deliberately show flame impingement to illustrate why local overheating is a serious concern.', watch: ['Flame direction and length', 'Clearance to nearest tube', 'Localized bright tube area', 'Uneven burner-to-burner pattern'] },
  flow: { eyebrow: 'PROCESS-SIDE VISUALIZATION', title: 'Track process fluid through a radiant U-pass', body: 'The cyan path follows a representative process route through one radiant pass. It is a qualitative learning visualization, not a hydraulic or heat-transfer calculation.', watch: ['Direction through both vertical legs', 'Return-bend continuity', 'Relationship to the lower connection', 'No implication of plant-specific pass numbering'] },
  inspection: { eyebrow: 'INSPECTION & DAMAGE AWARENESS', title: 'Read the tube, support and refractory condition together', body: 'Inspection combines tube appearance, support condition, refractory condition and evidence of localized heat exposure. Hot-spot and coking visuals are schematic indicators rather than predicted temperatures or remaining life.', watch: ['Localized hot area', 'External distortion or bowing', 'Support / guide damage', 'Internal coking concept and restricted flow area'] },
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

      <section className="radiant-contextbar"><div><span>COMPONENT / RADIANT SECTION</span><strong>Vertical Radiant Coil — Training Configuration</strong></div><p>Qualitative visualization · No plant-specific tube tags, TMT limits or CFD prediction</p></section>

      <section className="radiant-workspace">
        <aside className="radiant-left">
          <div className="radiant-title-block"><span>RADIANT ANATOMY</span><h1>From flame radiation to process heat</h1><p>Study the whole firebox, one representative process pass, the support system, flame clearance and common inspection concerns.</p></div>
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
            {mobileSheet === 'views' ? <><span className="sheet-eyebrow">RADIANT STUDY VIEWS</span><div className="sheet-view-grid">{studyViews.map(view => <button key={view.id} className={study === view.id ? 'active' : ''} onClick={() => { setStudy(view.id); setMobileSheet(null); }}><strong>{view.title}</strong><small>{view.subtitle}</small></button>)}</div></> : <><span className="sheet-eyebrow">{copy.eyebrow}</span><h3>{copy.title}</h3><p>{copy.body}</p><span className="sheet-subhead">WHAT TO OBSERVE</span><ul>{copy.watch.map(item => <li key={item}>{item}</li>)}</ul><span className="sheet-subhead">TRAINING SCENARIOS</span><div className="sheet-chip-row"><button className={scenario === 'normal' ? 'active' : ''} onClick={() => chooseScenario('normal')}>Normal</button><button className={scenario === 'impingement' ? 'active' : ''} onClick={() => chooseScenario('impingement')}>Impingement</button><button className={scenario === 'hotspot' ? 'active' : ''} onClick={() => chooseScenario('hotspot')}>Hot Spot</button><button className={scenario === 'coking' ? 'active' : ''} onClick={() => chooseScenario('coking')}>Coking</button></div></>}
          </div>
          <div className="radiant-mobile-summary"><Thermometer size={17} /><span>{copy.title}</span></div>
        </div>

        <aside className="radiant-tech">
          <div className="radiant-tech-head"><span>{copy.eyebrow}</span><h2>{copy.title}</h2><p>{copy.body}</p></div>
          <section className="radiant-tech-section"><span>WHAT TO OBSERVE</span><ul>{copy.watch.map(item => <li key={item}>{item}</li>)}</ul></section>
          <section className="radiant-tech-section"><span>TRAINING SCENARIOS</span><div className="radiant-scenario-chips"><button className={scenario === 'normal' ? 'active' : ''} onClick={() => chooseScenario('normal')}>Normal</button><button className={scenario === 'impingement' ? 'active danger' : ''} onClick={() => chooseScenario('impingement')}>Flame Impingement</button><button className={scenario === 'hotspot' ? 'active danger' : ''} onClick={() => chooseScenario('hotspot')}>Local Hot Spot</button><button className={scenario === 'coking' ? 'active' : ''} onClick={() => chooseScenario('coking')}>Internal Coking</button></div><p className="scenario-note">These are qualitative learning visuals only. They do not predict tube-metal temperature, coke thickness, remaining life or an operating limit.</p></section>
          <section className="radiant-tech-section"><span>FUNCTION</span><p>Radiant tubes absorb heat mainly by radiation from the flame and hot refractory, then transfer that energy through the tube wall to the process fluid.</p></section>
          <section className="radiant-tech-section"><span>INSPECTION FOCUS</span><ul><li>Tube surface condition and local color pattern</li><li>Flame clearance / signs of impingement</li><li>Supports, guides and return bends</li><li>Distortion, sagging or bowing</li><li>Refractory condition behind and around the coil</li></ul></section>
          <section className="radiant-warning"><Wrench size={17} /><p><b>Training model.</b> Actual tube metallurgy, dimensions, pass arrangement, TMT limits, inspection criteria and operating responses must come from plant drawings, procedures, OEM data and the applicable engineering standards.</p></section>
          <div className="radiant-path"><span>REPRESENTATIVE PROCESS PATH</span><div>{systemPath.map((item, index) => <span key={item}>{item}{index < systemPath.length - 1 && <i>›</i>}</span>)}</div></div>
        </aside>
      </section>
    </main>
  );
}
