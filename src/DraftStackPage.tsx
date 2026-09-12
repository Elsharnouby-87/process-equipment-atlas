import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Eye, Focus, Gauge, Info, Layers3, Rotate3D, ShieldAlert, Wind, Wrench, X, ZoomIn, ZoomOut } from 'lucide-react';
import Heater3D from './Heater3D';
import GlobalNavigation from './GlobalNavigation';
import type { NavigationTarget } from './GlobalNavigation';
import type { CameraAction, CameraCommand, DraftPressureScenario, DraftStudy } from './modelTypes';

type Props = { onBack: () => void; onNavigate: (target: NavigationTarget) => void };

const studyViews: { id: DraftStudy; title: string; subtitle: string }[] = [
  { id: 'overview', title: 'System Overview', subtitle: 'Convection outlet to stack discharge' },
  { id: 'breeching', title: 'Breeching', subtitle: 'Collect and turn the flue-gas path' },
  { id: 'damper', title: 'Stack Damper', subtitle: 'Blade, shaft and actuator relationship' },
  { id: 'path', title: 'Draft Path', subtitle: 'Follow gas through the upper heater' },
  { id: 'stack', title: 'Stack', subtitle: 'Vertical discharge and chimney effect' },
  { id: 'pressure', title: 'Pressure Awareness', subtitle: 'Negative draft vs positive-pressure hazard' },
];

const viewCopy: Record<DraftStudy, { eyebrow: string; title: string; body: string; watch: string[] }> = {
  overview: { eyebrow: 'DRAFT & FLUE-GAS SYSTEM', title: 'Read breeching, damper and stack as one connected pressure path', body: 'Flue gas leaving the convection section is collected by the breeching, crosses the internal stack-damper region and then rises through the stack. Draft is created and consumed across this connected path, so the components should be read as one system.', watch: ['Convection outlet into breeching', 'Transition into the stack throat', 'Internal damper location', 'Continuous discharge path through the stack'] },
  breeching: { eyebrow: 'BREECHING / TRANSITION DUCT', title: 'Collect the upper gas flow and guide it toward the stack', body: 'The breeching transitions the broad convection outlet into the narrower stack inlet. Its geometry, casing condition, leakage and internal restriction contribute to pressure loss in the upper flue-gas path.', watch: ['Duct casing and seams', 'Transition geometry', 'Signs of leakage or distortion', 'Clear passage toward the stack inlet'] },
  damper: { eyebrow: 'INTERNAL DAMPER ASSEMBLY', title: 'See the blade, shaft and actuator inside the flue-gas path', body: 'The stack damper varies exhaust-path resistance and therefore participates in draft control. The 3D study exposes the internal blade and shaft while keeping the external lever / actuator relationship visible.', watch: ['Blade plane relative to the gas path', 'Blade rotation about the shaft', 'Shaft continuity through the stack wall', 'External linkage movement following the shaft'] },
  path: { eyebrow: 'QUALITATIVE FLUE-GAS PATH', title: 'Follow gas from convection outlet through breeching, damper and stack', body: 'Orange particles show the qualitative upper flue-gas route. Their motion is a learning visualization only and is not a CFD result, velocity prediction or pressure-drop calculation.', watch: ['Gas collected above convection', 'Convergence through breeching', 'Passage through the damper region', 'Vertical rise through the stack'] },
  stack: { eyebrow: 'STACK / CHIMNEY', title: 'Discharge combustion products and contribute to natural draft', body: 'The stack provides the final vertical discharge path. The density difference between the hot internal gas column and outside air contributes to natural draft, while actual draft still depends on the complete heater and its flow resistance.', watch: ['Stack shell and seams', 'Support / platform condition', 'Damper region below', 'Corrosion, vibration or abnormal temperature pattern'] },
  pressure: { eyebrow: 'FIREBOX PRESSURE AWARENESS', title: 'Read the pressure profile — not just one arrow', body: 'For the natural-draft process-heater concept shown here, the firebox is normally maintained under negative pressure. The radiant roof / arch is commonly the highest-pressure region, so keeping that region slightly negative helps keep the rest of the heater negative as well. Positive pressure reverses the leakage tendency and can drive hot combustion products outward through openings.', watch: ['Draft indication at the designated reference point', 'Arch / radiant-roof pressure trend', 'Burner-elevation draft availability', 'Signs of hot-gas leakage or outward flow'] },
};

const systemPath = ['Convection outlet', 'Breeching', 'Stack damper', 'Stack', 'Discharge'];

export default function DraftStackPage({ onBack, onNavigate }: Props) {
  const [study, setStudy] = useState<DraftStudy>('overview');
  const [pressureScenario, setPressureScenario] = useState<DraftPressureScenario>('negative');
  const [damperPosition, setDamperPosition] = useState(18);
  const [labels, setLabels] = useState(true);
  const [flow, setFlow] = useState(false);
  const [mobileSheet, setMobileSheet] = useState<'views' | 'details' | null>(null);
  const [cameraCommand, setCameraCommand] = useState<CameraCommand>({ id: 1, action: 'draftOverview', component: 'Breeching' });
  const noSelect = useCallback(() => {}, []);
  const copy = viewCopy[study];
  const selected = study === 'damper' ? 'Stack Damper' : study === 'stack' ? 'Stack' : 'Breeching';
  const contextMode = study === 'pressure' ? 'full' : study === 'overview' || study === 'path' ? 'focus' : 'isolate';

  const cameraAction = useCallback((action: CameraAction, component = selected) => {
    setCameraCommand(current => ({ id: current.id + 1, action, component }));
  }, [selected]);

  useEffect(() => {
    const actionMap: Record<DraftStudy, CameraAction> = { overview: 'draftOverview', breeching: 'draftBreeching', damper: 'draftDamper', path: 'draftPath', stack: 'draftStack', pressure: 'draftPressure' };
    cameraAction(actionMap[study], selected);
    setFlow(study === 'path' || study === 'damper' || study === 'stack');
    if (study !== 'pressure') setPressureScenario('negative');
  }, [study, selected, cameraAction]);

  const currentAction: CameraAction = study === 'overview' ? 'draftOverview' : study === 'breeching' ? 'draftBreeching' : study === 'damper' ? 'draftDamper' : study === 'path' ? 'draftPath' : study === 'stack' ? 'draftStack' : 'draftPressure';

  return (
    <main className="app-shell draft-page">
      <header className="atlas-topbar radiant-topbar draft-topbar">
        <button className="back-atlas" onClick={onBack}><ArrowLeft size={16} /> Atlas</button>
        <div className="brand-lockup"><strong>FIRED HEATER <em>ATLAS</em></strong><span>COMPONENT STUDY · DRAFT & FLUE GAS</span></div>
        <GlobalNavigation active="components" onNavigate={onNavigate} className="radiant-nav" />
      </header>

      <section className="radiant-contextbar draft-contextbar"><div><span>DRAFT / FLUE-GAS SYSTEM</span><strong>Breeching · Internal Stack Damper · Stack</strong></div><p>Qualitative pressure and flow visualization · Site draft limits and procedures govern actual operation</p></section>

      <section className="radiant-workspace draft-workspace">
        <aside className="radiant-left draft-left">
          <div className="radiant-title-block draft-title-block"><span>DRAFT SYSTEM ANATOMY</span><h1>From convection outlet to safe flue-gas discharge</h1><p>Study the upper gas path, the internal damper assembly and the pressure relationship that keeps hot combustion products contained inside the heater.</p></div>
          <div className="radiant-study-tabs draft-study-tabs">{studyViews.map((view, index) => <button key={view.id} className={study === view.id ? 'active' : ''} onClick={() => setStudy(view.id)}><b>0{index + 1}</b><span><strong>{view.title}</strong><small>{view.subtitle}</small></span></button>)}</div>
          <div className="draft-principle-note"><Gauge size={17} /><div><b>CORE OPERATING PRINCIPLE</b><p>Natural-draft process heaters are commonly operated with the firebox under negative pressure. The arch / radiant-roof region is a key reference in many designs; exact targets and limits remain site-specific.</p></div></div>
        </aside>

        <div className="radiant-viewer draft-viewer hero-viewer">
          <Heater3D mode={study === 'pressure' ? 'normal' : 'cutaway'} selected={selected} labels={labels} flow={flow} explode={false} contextMode={contextMode} damperPosition={damperPosition} draftStudyMode={study} draftPressureScenario={pressureScenario} cameraCommand={cameraCommand} onSelect={noSelect} />
          <div className="viewer-kicker draft-kicker"><i /> DRAFT & STACK 3D <span>Drag to rotate · Wheel / pinch to zoom</span></div>
          <div className="radiant-view-state draft-view-state"><span>{copy.eyebrow}</span><b>{studyViews.find(view => view.id === study)?.title}</b></div>
          <div className="radiant-center-tabs draft-center-tabs">{studyViews.map(view => <button key={view.id} className={study === view.id ? 'active' : ''} onClick={() => setStudy(view.id)}>{view.title}</button>)}</div>
          {study !== 'pressure' && <div className="draft-system-badge">CONVECTION → BREECHING → DAMPER → STACK</div>}
          {flow && <div className="radiant-flow-legend draft-flow-legend"><span className="heat">FLUE GAS · QUALITATIVE PATH</span></div>}
          {study === 'pressure' && <div className={`radiant-scenario-badge draft-pressure-badge ${pressureScenario}`}><ShieldAlert size={14} /><span>{pressureScenario === 'negative' ? 'NORMAL CONCEPT · NEGATIVE FIREBOX PRESSURE' : 'HAZARD SCENARIO · POSITIVE FIREBOX PRESSURE'}</span></div>}
          <div className="control-dock radiant-control-dock draft-control-dock"><button title="Fit draft study" onClick={() => cameraAction(currentAction)}><Focus size={17} /> Fit Study</button><button onClick={() => cameraAction('zoomIn')}><ZoomIn size={17} /> Zoom +</button><button onClick={() => cameraAction('zoomOut')}><ZoomOut size={17} /> Zoom −</button><button className={labels ? 'active' : ''} onClick={() => setLabels(value => !value)}><Eye size={17} /> Labels</button><button className={flow ? 'active' : ''} onClick={() => setFlow(value => !value)}><Wind size={17} /> Flue Flow</button><button onClick={() => { setStudy('overview'); setPressureScenario('negative'); setDamperPosition(18); setFlow(false); cameraAction('draftOverview', 'Breeching'); }}><Rotate3D size={17} /> Reset</button></div>
          <div className="study-mobile-actions"><button onClick={() => setMobileSheet('views')}><Layers3 size={17} /> Views</button><button onClick={() => setMobileSheet('details')}><Info size={17} /> Details</button></div>
          <div className={`study-mobile-sheet ${mobileSheet ? 'open' : ''}`}>
            <button className="study-mobile-close" onClick={() => setMobileSheet(null)} aria-label="Close mobile study panel"><X size={17} /></button>
            {mobileSheet === 'views' ? <><span className="sheet-eyebrow">DRAFT & STACK STUDY VIEWS</span><div className="sheet-view-grid">{studyViews.map(view => <button key={view.id} className={study === view.id ? 'active' : ''} onClick={() => { setStudy(view.id); setMobileSheet(null); }}><strong>{view.title}</strong><small>{view.subtitle}</small></button>)}</div></> : <><span className="sheet-eyebrow">{copy.eyebrow}</span><h3>{copy.title}</h3><p>{copy.body}</p><span className="sheet-subhead">WHAT TO OBSERVE</span><ul>{copy.watch.map(item => <li key={item}>{item}</li>)}</ul>{study === 'damper' && <div className="draft-damper-control mobile"><span className="sheet-subhead">QUALITATIVE DAMPER POSITION</span><div><b>MORE OPEN</b><b>MORE CLOSED</b></div><input aria-label="Qualitative stack damper position" type="range" min="0" max="100" value={damperPosition} onChange={event => setDamperPosition(Number(event.target.value))} /></div>}{study === 'pressure' && <><span className="sheet-subhead">PRESSURE SCENARIO</span><div className="sheet-chip-row"><button className={pressureScenario === 'negative' ? 'active' : ''} onClick={() => setPressureScenario('negative')}>Negative Draft</button><button className={pressureScenario === 'positive' ? 'active danger' : ''} onClick={() => setPressureScenario('positive')}>Positive Pressure</button></div><p className="sheet-note">Positive firebox pressure is a hot-gas containment hazard. Premix flashback / backfire is a separate burner-stability phenomenon and is not implied by this pressure arrow.</p></> : null}</>}
          </div>
          <div className="radiant-mobile-summary draft-mobile-summary"><Gauge size={17} /><span>{copy.title}</span></div>
        </div>

        <aside className="radiant-tech draft-tech">
          <div className="radiant-tech-head draft-tech-head"><span>{copy.eyebrow}</span><h2>{copy.title}</h2><p>{copy.body}</p></div>
          <section className="radiant-tech-section"><span>WHAT TO OBSERVE</span><ul>{copy.watch.map(item => <li key={item}>{item}</li>)}</ul></section>
          {study === 'damper' && <section className="radiant-tech-section"><span>QUALITATIVE DAMPER POSITION</span><div className="draft-damper-control"><div><b>MORE OPEN</b><b>MORE CLOSED</b></div><input aria-label="Qualitative stack damper position" type="range" min="0" max="100" value={damperPosition} onChange={event => setDamperPosition(Number(event.target.value))} /></div><p className="scenario-note">The blade rotates about the visible shaft and the external lever follows that rotation. Slider travel is visual only: it is not a plant setpoint, calibrated indication or draft-control recommendation.</p></section>}
          {study === 'pressure' && <section className="radiant-tech-section"><span>PRESSURE SCENARIO</span><div className="radiant-scenario-chips draft-pressure-chips"><button className={pressureScenario === 'negative' ? 'active' : ''} onClick={() => setPressureScenario('negative')}>Negative Draft</button><button className={pressureScenario === 'positive' ? 'active danger' : ''} onClick={() => setPressureScenario('positive')}>Positive Pressure</button></div><p className="scenario-note">The arrows illustrate pressure tendency at openings only. No pressure magnitude, alarm limit or trip value is implied.</p></section>}
          {study === 'pressure' && <section className="radiant-tech-section"><span>PRESSURE-PROFILE LOGIC</span><ul><li><b>Radiant roof / arch:</b> commonly the highest-pressure / lowest-draft region in a natural-draft heater and therefore a key reference point.</li><li><b>Burner elevation:</b> useful for understanding the draft available across natural-draft burners.</li><li><b>Convection outlet / below stack damper:</b> can help interpret pressure loss through the convection section when used with the firebox-roof reading.</li></ul></section>}
          {study === 'pressure' && <section className="radiant-tech-section"><span>DO NOT CONFUSE TWO PHENOMENA</span><p><b>Positive firebox pressure</b> can push hot flue gas outward through openings and damage casing / refractory or expose personnel. <b>Premix flashback / backfire</b> is a separate burner-stability phenomenon related to flame propagation versus mixture velocity. They may coexist in disturbed operation, but one is not a universal consequence of the other.</p></section>}
          <section className="radiant-tech-section"><span>SYSTEM RELATIONSHIP</span><p>Draft comes from the pressure balance of the full heater and stack. The stack creates a natural-draft driving effect while burners, tube banks, breeching, damper and other flow restrictions consume part of that pressure difference. Air leakage, gas temperature and firing rate can also shift the pressure profile.</p></section>
          <section className="radiant-tech-section"><span>INSPECTION FOCUS</span><ul><li>Breeching casing, joints and supports</li><li>Damper blade, shaft, bearings and actuator linkage</li><li>Position indication versus physical response</li><li>Stack shell, seams, corrosion and vibration</li><li>Draft measurement integrity and signs of hot-gas leakage</li></ul></section>
          <section className="radiant-warning draft-warning"><Wrench size={17} /><p><b>Training model.</b> Actual draft targets, alarm / trip limits, damper operating range and response actions must come from site procedures, burner / OEM documentation and the applicable BMS / SIS design. No universal numeric draft value is prescribed here.</p></section>
          <div className="radiant-path draft-path"><span>FLUE-GAS SYSTEM PATH</span><div>{systemPath.map((item, index) => <span key={item}>{item}{index < systemPath.length - 1 && <i>›</i>}</span>)}</div></div>
        </aside>
      </section>
    </main>
  );
}
