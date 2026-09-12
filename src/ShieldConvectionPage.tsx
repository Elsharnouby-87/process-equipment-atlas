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

const viewCopy: Record<HeatStudy, { eyebrow: string; title: string; body: string; watch: string[] }> = {
  overview: { eyebrow: 'UPPER HEATER TRANSITION', title: 'Two sections, two tube constructions, one heat-recovery path', body: 'Hot flue gas leaves the radiant section, crosses the bare shield / shock tubes first, then passes through the finned convection bank before entering the breeching. The 3D model keeps these two constructions visibly different.', watch: ['Bare shield tubes directly above the radiant outlet', 'Finned convection rows above the shield section', 'Open gas passages between rows', 'Breeching above the convection bank'] },
  shield: { eyebrow: 'SHIELD / SHOCK SECTION', title: 'Bare horizontal tubes — deliberately without external fins', body: 'The shield rows are the first tubes exposed to the hottest gas and stronger radiant influence at the convection inlet. In this training configuration they are modeled as smooth bare tubes with no external fins.', watch: ['Smooth bare tube surface', 'No fin rings or extended surface', 'Tube/support alignment', 'Clear transition from radiant outlet'] },
  convection: { eyebrow: 'MAIN CONVECTION BANK', title: 'Finned horizontal tubes for heat recovery', body: 'The downstream convection rows use external extended surface in this training configuration. The fins are modeled explicitly around the tube body so the construction is visually different from the bare shield rows below.', watch: ['External fins around each tube', 'Fin condition and spacing', 'Tube-row alignment', 'Header / return-side condition'] },
  flue: { eyebrow: 'FLUE-GAS PATH', title: 'Follow hot gas from radiant outlet through shield and convection', body: 'Orange particles show the qualitative gas path upward through the bare shield rows, then through the denser finned convection bank and toward the breeching. This is a flow-learning visualization, not CFD.', watch: ['Gas enters shield section first', 'Flow continues between convection rows', 'No solid duct exists between the two banks', 'Breeching collects gas above the bank'] },
  process: { eyebrow: 'PROCESS-SIDE PATH', title: 'Track a representative process route through finned convection tubes', body: 'Cyan particles illustrate a representative tube-side route through the convection section. The exact pass arrangement, service split and inlet/outlet routing are plant-specific and are not implied by this schematic.', watch: ['Fluid remains inside the tubes', 'Gas remains outside the tubes', 'Representative return continuity', 'Fins are external and do not contact the process fluid'] },
  fouling: { eyebrow: 'INSPECTION & FOULING', title: 'See how deposits can reduce open gas passage through the convection bank', body: 'The scenario overlays show qualitative external fouling and partial plugging around finned convection rows. They are visual training indicators only and do not predict pressure drop, duty loss or cleaning intervals.', watch: ['Deposit build-up on finned rows', 'Reduced open space between tubes', 'Fin condition', 'Uneven or localized plugging pattern'] },
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

      <section className="radiant-contextbar heat-contextbar"><div><span>HEAT RECOVERY / UPPER TRANSITION</span><strong>Shield = Bare Tubes · Convection = Finned Tubes</strong></div><p>Training visualization · Qualitative flow and fouling only</p></section>

      <section className="radiant-workspace heat-workspace">
        <aside className="radiant-left heat-left">
          <div className="radiant-title-block heat-title-block"><span>SHIELD + CONVECTION</span><h1>From radiant outlet to recovered heat</h1><p>Study the transition as one continuous thermal story while keeping the shield and convection tube constructions technically distinct.</p></div>
          <div className="radiant-study-tabs heat-study-tabs">{studyViews.map((view, index) => <button key={view.id} className={study === view.id ? 'active' : ''} onClick={() => setStudy(view.id)}><b>0{index + 1}</b><span><strong>{view.title}</strong><small>{view.subtitle}</small></span></button>)}</div>
          <div className="heat-construction-note"><Layers3 size={17} /><div><b>3D CONSTRUCTION RULE</b><p><strong>Shield rows:</strong> smooth bare tubes, no external fins.<br /><strong>Convection rows:</strong> explicit external fins / extended surface.</p></div></div>
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
            {mobileSheet === 'views' ? <><span className="sheet-eyebrow">SHIELD + CONVECTION VIEWS</span><div className="sheet-view-grid">{studyViews.map(view => <button key={view.id} className={study === view.id ? 'active' : ''} onClick={() => { setStudy(view.id); setMobileSheet(null); }}><strong>{view.title}</strong><small>{view.subtitle}</small></button>)}</div></> : <><span className="sheet-eyebrow">{copy.eyebrow}</span><h3>{copy.title}</h3><p>{copy.body}</p><div className="mobile-tube-rule"><b>SHIELD</b><span>Bare tube · no fins</span><b>CONVECTION</b><span>Finned tube · external extended surface</span></div><span className="sheet-subhead">WHAT TO OBSERVE</span><ul>{copy.watch.map(item => <li key={item}>{item}</li>)}</ul>{study === 'fouling' && <><span className="sheet-subhead">FOULING SCENARIO</span><div className="sheet-chip-row"><button className={scenario === 'clean' ? 'active' : ''} onClick={() => setScenario('clean')}>Clean</button><button className={scenario === 'fouled' ? 'active' : ''} onClick={() => setScenario('fouled')}>Fouled</button><button className={scenario === 'plugged' ? 'active' : ''} onClick={() => setScenario('plugged')}>Plugged</button></div></>}</>}
          </div>
          <div className="radiant-mobile-summary heat-mobile-summary"><Layers3 size={17} /><span>{copy.title}</span></div>
        </div>

        <aside className="radiant-tech heat-tech">
          <div className="radiant-tech-head heat-tech-head"><span>{copy.eyebrow}</span><h2>{copy.title}</h2><p>{copy.body}</p></div>
          <section className="heat-tube-compare"><span>TUBE CONSTRUCTION — CLOSE COMPARISON</span><div><article><div className="bare-tube-visual" /><b>Shield Tube — BARE</b><p>Smooth tube surface. <strong>No external fins.</strong></p></article><article><div className="finned-tube-visual" /><b>Convection Tube — FINNED</b><p>External extended surface is shown explicitly in 3D.</p></article></div></section>
          <section className="radiant-tech-section"><span>WHAT TO OBSERVE</span><ul>{copy.watch.map(item => <li key={item}>{item}</li>)}</ul></section>
          {study === 'fouling' && <section className="radiant-tech-section"><span>FOULING SCENARIOS</span><div className="radiant-scenario-chips heat-scenario-chips"><button className={scenario === 'clean' ? 'active' : ''} onClick={() => setScenario('clean')}>Clean</button><button className={scenario === 'fouled' ? 'active danger' : ''} onClick={() => setScenario('fouled')}>Fouled</button><button className={scenario === 'plugged' ? 'active danger' : ''} onClick={() => setScenario('plugged')}>Partially Plugged</button></div><p className="scenario-note">Deposit geometry is illustrative only. No pressure-drop, heat-duty or cleaning-interval prediction is implied.</p></section>}
          <section className="radiant-tech-section"><span>WHY THE CONSTRUCTION CHANGES</span><p>The first shield rows face stronger radiant exposure at the convection inlet, while the downstream convection bank is used for sensible-heat recovery. In this training configuration the shield is therefore shown bare and the downstream convection bank finned.</p></section>
          <section className="radiant-warning heat-warning"><Wrench size={17} /><p><b>Training configuration.</b> Actual tube type, fin geometry, metallurgy, spacing, service allocation and pass arrangement must be taken from the heater drawings, datasheets and applicable project standards.</p></section>
          <div className="radiant-path heat-path"><span>HEAT-RECOVERY PATH</span><div>{heatPath.map((item, index) => <span key={item}>{item}{index < heatPath.length - 1 && <i>›</i>}</span>)}</div></div>
        </aside>
      </section>
    </main>
  );
}
