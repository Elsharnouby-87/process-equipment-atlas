import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Eye, Focus, Info, Layers3, Rotate3D, ShieldAlert, Wind, Wrench, X, ZoomIn, ZoomOut } from 'lucide-react';
import Heater3D from './Heater3D';
import GlobalNavigation from './GlobalNavigation';
import type { NavigationTarget } from './GlobalNavigation';
import type { CameraAction, CameraCommand, HeatScenario, HeatStudy } from './modelTypes';

type Props = { onBack: () => void; onNavigate: (target: NavigationTarget) => void };

const studyViews: { id: HeatStudy; title: string; subtitle: string }[] = [
  { id: 'overview', title: 'Transition Overview', subtitle: 'Radiant outlet to breeching' },
  { id: 'shield', title: 'Shield Tubes', subtitle: 'Bare horizontal tubes — no fins' },
  { id: 'convection', title: 'Convection Bank', subtitle: 'Finned heat-recovery tubes' },
  { id: 'flue', title: 'Flue-Gas Flow', subtitle: 'Hot gas through both sections' },
  { id: 'process', title: 'Process-Fluid Flow', subtitle: 'Representative tube-side path' },
  { id: 'fouling', title: 'Fouling / Plugging', subtitle: 'Qualitative inspection study' },
];

const heatPath = ['Radiant outlet', 'Bare shield tubes', 'Finned convection bank', 'Breeching', 'Stack'];
const transferPath = ['Hot flue gas', 'External tube / fin surface', 'Tube wall', 'Process fluid'];

const viewCopy: Record<HeatStudy, { eyebrow: string; title: string; body: string; watch: string[] }> = {
  overview: {
    eyebrow: 'UPPER HEATER TRANSITION',
    title: 'Two tube constructions — one continuous heat-recovery path',
    body: 'Hot flue gas leaves the radiant section, crosses the bare shield / shock rows, then passes through the finned convection bank before entering the breeching. The 3D model keeps the shield and convection constructions visibly different so their roles are not confused.',
    watch: ['Bare shield tubes immediately above the radiant outlet', 'Finned convection rows downstream of the shield section', 'Open flue-gas passages between rows', 'Breeching above the convection bank'],
  },
  shield: {
    eyebrow: 'SHIELD / SHOCK SECTION',
    title: 'Bare horizontal tubes — no external fins',
    body: 'The shield / shock rows sit at the transition from the radiant section into the convection section. In this training configuration they are intentionally smooth bare tubes. Do not transfer the finned-convection appearance onto these rows.',
    watch: ['Smooth bare tube surface', 'No fin rings or external extended surface', 'Tube and support alignment', 'Condition at the radiant-to-convection transition'],
  },
  convection: {
    eyebrow: 'MAIN CONVECTION BANK',
    title: 'Finned horizontal tubes recover heat from the flue gas',
    body: 'The downstream convection rows use external extended surface in this training configuration. The fins are outside the process tube and increase the gas-side heat-transfer surface; process fluid remains inside the tube.',
    watch: ['External fins around the tube body', 'Fin condition and missing / damaged extended surface', 'Tube-row alignment', 'Open gas passages between finned rows'],
  },
  flue: {
    eyebrow: 'FLUE-GAS PATH',
    title: 'Follow hot gas through shield, convection and breeching',
    body: 'Orange particles show the qualitative gas path upward through the shield rows and then the denser finned convection bank. Real flue gas follows the available flow passages and can redistribute or bypass locally; this animation is a teaching path, not CFD or a velocity profile.',
    watch: ['Gas reaches the shield section before the main convection bank', 'Flow remains outside the process tubes', 'Open passages exist around and between rows', 'Breeching receives gas after the heat-recovery section'],
  },
  process: {
    eyebrow: 'PROCESS-SIDE PATH',
    title: 'Keep the gas side and process side visually separate',
    body: 'Cyan particles illustrate a representative tube-side route through the convection section. The process fluid stays inside the tube while flue gas remains outside around the fins. Exact pass arrangement, services and inlet / outlet routing are plant-specific.',
    watch: ['Process fluid remains inside the tube', 'Flue gas remains outside the tube', 'Representative return continuity', 'External fins never become part of the process-fluid path'],
  },
  fouling: {
    eyebrow: 'INSPECTION & FOULING',
    title: 'Compare clean, externally fouled and partially plugged gas passages',
    body: 'The scenario overlays place deposits on and between finned convection rows to show why external fouling and partial plugging matter to heat recovery and gas passage. The deposit shapes are schematic and are not a pressure-drop, duty-loss or cleaning-interval calculation.',
    watch: ['External deposits on finned rows', 'Material accumulated between fins / rows', 'Reduced visible open gas passage', 'Fin damage or missing extended surface'],
  },
};

const scenarioCopy: Record<HeatScenario, string> = {
  clean: 'Baseline construction with open gas passages. This does not certify a real bank as clean.',
  fouled: 'External deposit cues are shown on finned rows. Fouling is an inspection finding; the visualization does not quantify heat-transfer loss.',
  plugged: 'Partial gas-passage obstruction is shown qualitatively. It does not calculate draft loss, pressure drop or a cleaning threshold.',
};

export default function ShieldConvectionPage({ onBack, onNavigate }: Props) {
  const [study, setStudy] = useState<HeatStudy>('overview');
  const [scenario, setScenario] = useState<HeatScenario>('clean');
  const [labels, setLabels] = useState(true);
  const [flow, setFlow] = useState(false);
  const [mobileSheet, setMobileSheet] = useState<'views' | 'details' | null>(null);
  const [cameraCommand, setCameraCommand] = useState<CameraCommand>({ id: 1, action: 'heatOverview', component: 'Shield Tubes' });
  const noSelect = useCallback(() => {}, []);
  const copy = viewCopy[study];
  const selected = study === 'shield' || study === 'overview' || study === 'flue' ? 'Shield Tubes' : 'Convection Bank';
  const contextMode = study === 'overview' || study === 'flue' ? 'focus' : 'isolate';

  const cameraAction = useCallback((action: CameraAction, component = selected) => {
    setCameraCommand(current => ({ id: current.id + 1, action, component }));
  }, [selected]);

  useEffect(() => {
    const actionMap: Record<HeatStudy, CameraAction> = { overview: 'heatOverview', shield: 'heatShield', convection: 'heatConvection', flue: 'heatFlue', process: 'heatProcess', fouling: 'heatFouling' };
    cameraAction(actionMap[study], selected);
    setFlow(study === 'flue' || study === 'process');
    if (study !== 'fouling') setScenario('clean');
  }, [study, selected, cameraAction]);

  return (
    <main className="app-shell heat-page">
      <header className="atlas-topbar radiant-topbar heat-topbar">
        <button className="back-atlas" onClick={onBack}><ArrowLeft size={16} /> Atlas</button>
        <div className="brand-lockup"><strong>FIRED HEATER <em>ATLAS</em></strong><span>COMPONENT STUDY · SHIELD + CONVECTION</span></div>
        <GlobalNavigation active="components" onNavigate={onNavigate} className="radiant-nav" />
      </header>

      <section className="radiant-contextbar heat-contextbar"><div><span>HEAT RECOVERY / UPPER TRANSITION</span><strong>Shield = Bare Tubes · Convection = Finned Tubes</strong></div><p>Qualitative training · No pressure-drop, duty-loss or cleaning prediction</p></section>

      <section className="radiant-workspace heat-workspace">
        <aside className="radiant-left heat-left">
          <div className="radiant-title-block heat-title-block"><span>SHIELD + CONVECTION</span><h1>From radiant outlet to recovered heat</h1><p>Read one continuous flue-gas path while keeping the bare shield rows and finned convection rows technically distinct.</p></div>
          <div className="radiant-study-tabs heat-study-tabs">{studyViews.map((view, index) => <button key={view.id} className={study === view.id ? 'active' : ''} onClick={() => setStudy(view.id)}><b>0{index + 1}</b><span><strong>{view.title}</strong><small>{view.subtitle}</small></span></button>)}</div>
          <div className="heat-construction-note"><Layers3 size={17} /><div><b>NON-NEGOTIABLE 3D RULE</b><p><strong>Shield rows:</strong> smooth bare tubes, no external fins.<br /><strong>Convection rows:</strong> external fins / extended surface shown explicitly.</p></div></div>
        </aside>

        <div className="radiant-viewer heat-viewer hero-viewer">
          <Heater3D mode="cutaway" selected={selected} labels={labels} flow={flow} explode={false} contextMode={contextMode} damperPosition={18} heatRecoveryStudyMode={study} heatRecoveryScenario={scenario} cameraCommand={cameraCommand} onSelect={noSelect} />
          <div className="viewer-kicker heat-kicker"><i /> HEAT RECOVERY 3D <span>Drag to rotate · Wheel / pinch to zoom</span></div>
          <div className="radiant-view-state heat-view-state"><span>{copy.eyebrow}</span><b>{studyViews.find(view => view.id === study)?.title}</b></div>
          <div className="radiant-center-tabs heat-center-tabs">{studyViews.map(view => <button key={view.id} className={study === view.id ? 'active' : ''} onClick={() => setStudy(view.id)}>{view.title}</button>)}</div>
          <div className="heat-section-badges"><span className="bare">SHIELD · BARE / NO FINS</span><span className="finned">CONVECTION · FINNED</span></div>
          {flow && <div className="radiant-flow-legend heat-flow-legend">{study === 'flue' ? <span className="heat">FLUE GAS · OUTSIDE TUBES</span> : <span className="process">PROCESS FLUID · INSIDE TUBES</span>}</div>}
          {study === 'fouling' && <div className={`radiant-scenario-badge heat-scenario-badge ${scenario}`}><ShieldAlert size={14} /><span>TRAINING SCENARIO · <b>{scenario.toUpperCase()}</b></span></div>}
          <div className="control-dock radiant-control-dock heat-control-dock"><button onClick={() => cameraAction(study === 'overview' ? 'heatOverview' : study === 'shield' ? 'heatShield' : study === 'convection' ? 'heatConvection' : study === 'flue' ? 'heatFlue' : study === 'process' ? 'heatProcess' : 'heatFouling')}><Focus size={17} /> Fit Study</button><button onClick={() => cameraAction('zoomIn')}><ZoomIn size={17} /> Zoom +</button><button onClick={() => cameraAction('zoomOut')}><ZoomOut size={17} /> Zoom −</button><button className={labels ? 'active' : ''} onClick={() => setLabels(value => !value)}><Eye size={17} /> Labels</button><button className={flow ? 'active' : ''} onClick={() => setFlow(value => !value)}><Wind size={17} /> Flow</button><button onClick={() => { setStudy('overview'); setScenario('clean'); setFlow(false); cameraAction('heatOverview', 'Shield Tubes'); }}><Rotate3D size={17} /> Reset</button></div>
          <div className="study-mobile-actions"><button onClick={() => setMobileSheet('views')}><Layers3 size={17} /> Views</button><button onClick={() => setMobileSheet('details')}><Info size={17} /> Details</button></div>
          <div className={`study-mobile-sheet ${mobileSheet ? 'open' : ''}`}>
            <button className="study-mobile-close" onClick={() => setMobileSheet(null)} aria-label="Close mobile study panel"><X size={17} /></button>
            {mobileSheet === 'views' ? <><span className="sheet-eyebrow">SHIELD + CONVECTION VIEWS</span><div className="sheet-view-grid">{studyViews.map(view => <button key={view.id} className={study === view.id ? 'active' : ''} onClick={() => { setStudy(view.id); setMobileSheet(null); }}><strong>{view.title}</strong><small>{view.subtitle}</small></button>)}</div></> : <><span className="sheet-eyebrow">{copy.eyebrow}</span><h3>{copy.title}</h3><p>{copy.body}</p><div className="mobile-tube-rule"><b>SHIELD</b><span>Bare tube · no fins</span><b>CONVECTION</b><span>Finned tube · external extended surface</span></div><span className="sheet-subhead">WHAT TO OBSERVE</span><ul>{copy.watch.map(item => <li key={item}>{item}</li>)}</ul>{study === 'fouling' && <><span className="sheet-subhead">FOULING SCENARIO</span><div className="sheet-chip-row"><button className={scenario === 'clean' ? 'active' : ''} onClick={() => setScenario('clean')}>Clean</button><button className={scenario === 'fouled' ? 'active' : ''} onClick={() => setScenario('fouled')}>Fouled</button><button className={scenario === 'plugged' ? 'active' : ''} onClick={() => setScenario('plugged')}>Plugged</button></div><p className="sheet-note">{scenarioCopy[scenario]}</p></>}</>}
          </div>
          <div className="radiant-mobile-summary heat-mobile-summary"><Layers3 size={17} /><span>{copy.title}</span></div>
        </div>

        <aside className="radiant-tech heat-tech">
          <div className="radiant-tech-head heat-tech-head"><span>{copy.eyebrow}</span><h2>{copy.title}</h2><p>{copy.body}</p></div>
          <section className="heat-tube-compare"><span>TUBE CONSTRUCTION — CLOSE COMPARISON</span><div><article><div className="bare-tube-visual" /><b>Shield Tube — BARE</b><p>Smooth tube surface. <strong>No external fins.</strong></p></article><article><div className="finned-tube-visual" /><b>Convection Tube — FINNED</b><p>External extended surface is shown explicitly in 3D.</p></article></div></section>
          <section className="radiant-tech-section"><span>WHAT TO OBSERVE</span><ul>{copy.watch.map(item => <li key={item}>{item}</li>)}</ul></section>
          <section className="radiant-tech-section"><span>HEAT-TRANSFER PATH · CONCEPT</span><div className="radiant-scenario-chips heat-scenario-chips">{transferPath.map(item => <button key={item} disabled>{item}</button>)}</div><p className="scenario-note">The convection section removes heat from flue gas and transfers it through the tube wall to the process fluid. The animation does not calculate heat duty or local heat-transfer coefficients.</p></section>
          {study === 'fouling' && <section className="radiant-tech-section"><span>FOULING SCENARIOS</span><div className="radiant-scenario-chips heat-scenario-chips"><button className={scenario === 'clean' ? 'active' : ''} onClick={() => setScenario('clean')}>Clean</button><button className={scenario === 'fouled' ? 'active danger' : ''} onClick={() => setScenario('fouled')}>Fouled</button><button className={scenario === 'plugged' ? 'active danger' : ''} onClick={() => setScenario('plugged')}>Partially Plugged</button></div><p className="scenario-note">{scenarioCopy[scenario]}</p></section>}
          <section className="radiant-tech-section"><span>WHY CONDITION MATTERS</span><p>Foreign deposits between fins, external fouling and damaged extended surface can reduce effective convection-section heat recovery. A high stack-temperature trend may be part of that operating picture, but it is not proof of one cause by itself.</p></section>
          <section className="radiant-tech-section"><span>INSPECTION FOCUS</span><ul><li>External deposits on and between fins</li><li>Missing or damaged extended surface</li><li>Open flue-gas passages and localized plugging</li><li>Tube / support alignment</li><li>Evidence of abnormal heating around the convection section</li></ul></section>
          <section className="radiant-warning heat-warning"><Wrench size={17} /><p><b>Training configuration — not a performance calculation.</b> Actual tube type, fin geometry, metallurgy, spacing, service allocation, pass arrangement and acceptable condition come from heater drawings, datasheets, inspection practice and applicable project standards.</p></section>
          <div className="radiant-path heat-path"><span>HEAT-RECOVERY PATH</span><div>{heatPath.map((item, index) => <span key={item}>{item}{index < heatPath.length - 1 && <i>›</i>}</span>)}</div></div>
        </aside>
      </section>
    </main>
  );
}
