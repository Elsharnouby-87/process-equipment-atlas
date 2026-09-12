import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Eye, Flame, Focus, Info, Layers3, Rotate3D, Wind, Wrench, X, ZoomIn, ZoomOut } from 'lucide-react';
import Heater3D from './Heater3D';
import GlobalNavigation from './GlobalNavigation';
import type { NavigationTarget } from './GlobalNavigation';
import type { BurnerStudy, CameraAction, CameraCommand } from './modelTypes';

type Props = { onBack: () => void; onNavigate: (target: NavigationTarget) => void };

const studyViews: { id: BurnerStudy; title: string; subtitle: string }[] = [
  { id: 'external', title: 'Underfurnace', subtitle: 'Operator access & external hardware' },
  { id: 'internal', title: 'Internal Cutaway', subtitle: 'Burner throat, tile and flame root' },
  { id: 'exploded', title: 'Burner Exploded', subtitle: 'Assembly relationship & service parts' },
  { id: 'pilot', title: 'Pilot & Ignition', subtitle: 'Ignition and flame-proving hardware' },
];

const anatomyParts = [
  ['01', 'Air Register', 'Controls combustion-air admission and distribution at the burner.'],
  ['02', 'Burner Body / Neck', 'Supports the assembly and provides the external service interface below the heater floor.'],
  ['03', 'Mounting Flange', 'Connects the burner assembly to the burner-floor opening.'],
  ['04', 'Gas Gun / Fuel Tip', 'Introduces fuel into the burner mixing and flame-root region.'],
  ['05', 'Burner Tile / Throat', 'Refractory geometry that shapes and stabilizes the burner discharge into the firebox.'],
  ['06', 'Pilot Assembly', 'Provides the dedicated ignition flame used before the main burner is established.'],
  ['07', 'Ignition / Flame Detection', 'Ignition electrode and flame-proving hardware; exact arrangement varies by burner design.'],
];

const burnerPath = ['Fuel + Air', 'Air Register', 'Burner / Fuel Tip', 'Tile / Throat', 'Flame Root', 'Radiant Section'];

const viewCopy: Record<BurnerStudy, { eyebrow: string; title: string; body: string; watch: string[] }> = {
  external: { eyebrow: 'OPERATOR PERSPECTIVE', title: 'Underfurnace access — external hardware only', body: 'The heater is elevated so burner external hardware can be inspected from below. Normal burner flame remains above the burner floor, inside the radiant firebox — never exposed in the underfurnace service area.', watch: ['Air-register travel and actuator condition', 'Fuel-line, valve and connection integrity', 'Pilot / ignition access', 'Clear working space around the burner body'] },
  internal: { eyebrow: 'FIREBOX PERSPECTIVE', title: 'Follow the burner through the floor into the firebox', body: 'The internal cutaway follows the burner from its external body through the burner floor, refractory throat and flame root into the radiant section. It connects the accessible hardware below the floor to the actual firing zone inside the heater.', watch: ['Stable flame root', 'Burner-tile condition', 'Clearance from radiant tubes', 'No abnormal flame pull, lift or impingement'] },
  exploded: { eyebrow: 'ASSEMBLY STUDY', title: 'Explode the burner — keep the heater as location context', body: 'This study view separates the burner subassemblies by function while the heater and neighboring burners remain as ghosted location context. It is a training representation of assembly relationships, not an OEM maintenance drawing.', watch: ['Register and body relationship', 'Fuel-gun path toward the flame root', 'Tile / throat position above the floor', 'Pilot and sensing hardware alongside the main burner'] },
  pilot: { eyebrow: 'IGNITION & FLAME PROVING', title: 'Ignition source ≠ pilot flame ≠ flame proving', body: 'These are three different concepts. The ignition source initiates the attempt; the pilot flame is the small combustion result used to ignite the main burner where the design uses a pilot; flame detection / proving is the protective-system function that determines whether the required flame condition is accepted. Exact geometry and logic vary by OEM and BMS design.', watch: ['Ignition-source position and condition', 'Pilot flame location relative to the main burner', 'Flame-proving hardware condition', 'Wiring / connection condition where accessible'] },
};

export default function BurnerPage({ onBack, onNavigate }: Props) {
  const [study, setStudy] = useState<BurnerStudy>('internal');
  const [labels, setLabels] = useState(true);
  const [flow, setFlow] = useState(false);
  const [mobileSheet, setMobileSheet] = useState<'views' | 'details' | null>(null);
  const [cameraCommand, setCameraCommand] = useState<CameraCommand>({ id: 1, action: 'burnerInternal', component: 'Burners' });
  const copy = viewCopy[study];
  const noSelect = useCallback(() => {}, []);
  const cameraAction = useCallback((action: CameraAction) => setCameraCommand(current => ({ id: current.id + 1, action, component: 'Burners' })), []);

  useEffect(() => {
    if (study === 'external') cameraAction('burnerExternal');
    else if (study === 'internal') cameraAction('burnerInternal');
    else if (study === 'pilot') cameraAction('burnerPilot');
    else cameraAction('burnerExploded');
  }, [study, cameraAction]);

  const mode = study === 'external' ? 'normal' : 'cutaway';
  const contextMode = study === 'exploded' || study === 'pilot' ? 'isolate' : 'focus';

  return (
    <main className="app-shell burner-page">
      <header className="atlas-topbar burner-topbar">
        <button className="back-atlas" onClick={onBack}><ArrowLeft size={16} /> Atlas</button>
        <div className="brand-lockup"><strong>FIRED HEATER <em>ATLAS</em></strong><span>COMPONENT STUDY · COMBUSTION SYSTEM</span></div>
        <GlobalNavigation active="components" onNavigate={onNavigate} className="burner-nav" />
      </header>

      <section className="burner-contextbar"><div><span>COMPONENT / COMBUSTION SYSTEM</span><strong>Burner Assembly — Up-fired</strong></div><p>Training visualization · Generic industrial arrangement · Site / OEM / BMS documentation governs actual equipment</p></section>

      <section className="burner-workspace">
        <aside className="burner-left">
          <div className="burner-title-block"><span>BURNER ANATOMY</span><h1>From underfurnace access to flame stability</h1><p>Study the same burner from the operator side, the firebox side, as an assembly, and at the pilot / ignition interface.</p></div>
          <div className="burner-study-tabs">{studyViews.map((view, index) => <button key={view.id} className={study === view.id ? 'active' : ''} onClick={() => setStudy(view.id)}><b>0{index + 1}</b><span><strong>{view.title}</strong><small>{view.subtitle}</small></span></button>)}</div>
          <div className="burner-parts"><span>MAIN PARTS</span>{anatomyParts.map(([number, name, description]) => <div className="burner-part" key={number}><b>{number}</b><div><strong>{name}</strong><p>{description}</p></div></div>)}</div>
        </aside>

        <div className="burner-viewer hero-viewer">
          <Heater3D mode={mode} selected="Burners" labels={labels} flow={flow} explode={false} contextMode={contextMode} damperPosition={18} burnerStudyMode={study} cameraCommand={cameraCommand} onSelect={noSelect} />
          <div className="viewer-kicker burner-kicker"><i /> BURNER 3D STUDY <span>Drag to rotate · Wheel / pinch to zoom</span></div>
          <div className="burner-view-state"><span>{copy.eyebrow}</span><b>{studyViews.find(view => view.id === study)?.title}</b></div>
          <div className="hero-burner-badge"><Flame size={14} /><span><b>HERO BURNER</b> · neighboring burners retained as ghosted location context</span></div>
          {flow && study !== 'exploded' && <div className="burner-flow-legend"><span className="air">Combustion Air</span><span className="fuel">Fuel Gas</span>{study !== 'pilot' && <span className="hot">Hot Products</span>}</div>}
          <div className="burner-center-tabs">{studyViews.map(view => <button key={view.id} className={study === view.id ? 'active' : ''} onClick={() => setStudy(view.id)}>{view.title}</button>)}</div>
          <div className="control-dock burner-control-dock"><button title="Fit burner study" onClick={() => cameraAction(study === 'external' ? 'burnerExternal' : study === 'pilot' ? 'burnerPilot' : study === 'exploded' ? 'burnerExploded' : 'burnerInternal')}><Focus size={17} /> Fit Burner</button><button onClick={() => cameraAction('zoomIn')}><ZoomIn size={17} /> Zoom +</button><button onClick={() => cameraAction('zoomOut')}><ZoomOut size={17} /> Zoom −</button><button className={labels ? 'active' : ''} onClick={() => setLabels(value => !value)}><Eye size={17} /> Labels</button><button className={flow ? 'active' : ''} onClick={() => setFlow(value => !value)}><Wind size={17} /> Flow</button><button onClick={() => cameraAction('reset')}><Rotate3D size={17} /> Reset</button></div>
          <div className="study-mobile-actions"><button onClick={() => setMobileSheet('views')}><Layers3 size={17} /> Views</button><button onClick={() => setMobileSheet('details')}><Info size={17} /> Details</button></div>
          <div className={`study-mobile-sheet ${mobileSheet ? 'open' : ''}`}>
            <button className="study-mobile-close" onClick={() => setMobileSheet(null)} aria-label="Close mobile study panel"><X size={17} /></button>
            {mobileSheet === 'views' ? <><span className="sheet-eyebrow">BURNER STUDY VIEWS</span><div className="sheet-view-grid">{studyViews.map(view => <button key={view.id} className={study === view.id ? 'active' : ''} onClick={() => { setStudy(view.id); setMobileSheet(null); }}><strong>{view.title}</strong><small>{view.subtitle}</small></button>)}</div></> : <><span className="sheet-eyebrow">{copy.eyebrow}</span><h3>{copy.title}</h3><p>{copy.body}</p><span className="sheet-subhead">WHAT TO OBSERVE</span><ul>{copy.watch.map(item => <li key={item}>{item}</li>)}</ul>{study === 'exploded' && <p className="sheet-note">Exploded view separates functional burner subassemblies while preserving ghosted heater context.</p>}{study === 'pilot' && <p className="sheet-note"><b>Ignition source ≠ pilot flame ≠ flame proving.</b> The micro-view is schematic; actual hardware and acceptance logic vary by OEM / BMS design.</p>}</>}
          </div>
          <div className="burner-mobile-summary"><Flame size={17} /><span>{copy.title}</span></div>
        </div>

        <aside className="burner-tech">
          <div className="burner-tech-head"><span>{copy.eyebrow}</span><h2>{copy.title}</h2><p>{copy.body}</p></div>
          <section className="burner-tech-section"><span>WHAT TO OBSERVE</span><ul>{copy.watch.map(item => <li key={item}>{item}</li>)}</ul></section>
          {study === 'exploded' && <section className="burner-tech-section semantic-explode"><span>SEMANTIC EXPLODED ASSEMBLY</span><div><b>Air Register</b><b>Body / Neck</b><b>Mounting Flange</b><b>Gas Gun / Fuel Tip</b><b>Tile / Throat</b><b>Pilot / Ignition</b><b>Flame</b></div><p>Each assembly separates by function while the neighboring burners remain ghosted for location context.</p></section>}
          {study === 'pilot' && <section className="burner-tech-section pilot-micro-copy"><span>DEDICATED PILOT MICRO-VIEW</span><p><b>Ignition source ≠ pilot flame ≠ flame proving.</b> The 3D view isolates a schematic pilot port, ignition electrode, proving element and pilot flame so the three functions are not confused. Exact geometry and proving technology vary by OEM and BMS design.</p></section>}
          <section className="burner-tech-section"><span>FUNCTION</span><p>The burner introduces fuel and combustion air to establish a controlled flame inside the radiant section. Air admission, fuel-tip condition, burner tile geometry and pilot / ignition reliability all influence stable firing.</p></section>
          <section className="burner-tech-section"><span>OPERATOR / INSPECTION FOCUS</span><ul><li>Flame shape, stability and clearance</li><li>Air-register position and condition</li><li>Fuel-gun / tip cleanliness and damage</li><li>Burner-tile cracking or spalling</li><li>Pilot / ignition / flame-proving reliability</li></ul></section>
          <section className="burner-warning"><Wrench size={17} /><p><b>Generic training model.</b> Burner internals, pilot arrangement, ignition method and permissive logic vary by OEM and site. Use actual drawings, procedures and BMS cause-and-effect for field work.</p></section>
          <div className="burner-path"><span>SYSTEM PATH</span><div>{burnerPath.map((item, index) => <span key={item}>{item}{index < burnerPath.length - 1 && <i>›</i>}</span>)}</div></div>
        </aside>
      </section>
    </main>
  );
}
