import { useMemo, useState } from 'react';
import { ArrowLeft, Columns3, Focus, Info, Layers3, Rotate3D, Shapes, Wrench, X, ZoomIn, ZoomOut } from 'lucide-react';
import HeaterTypes3D from './HeaterTypes3D';
import GlobalNavigation from './GlobalNavigation';
import type { NavigationTarget } from './GlobalNavigation';
import type { HeaterType, HeaterTypeView } from './modelTypes';

type Props = { onBack: () => void; onNavigate: (target: NavigationTarget) => void };
type CameraAction = 'fit' | 'zoomIn' | 'zoomOut' | 'reset';
type CameraCommand = { id: number; action: CameraAction };

type TypeInfo = {
  name: string;
  eyebrow: string;
  headline: string;
  body: string;
  geometry: string;
  tubes: string;
  burners: string;
  flow: string;
  notes: string[];
};

const typeInfo: Record<HeaterType, TypeInfo> = {
  box: {
    name: 'Box Heater', eyebrow: 'RECTANGULAR BOX CONFIGURATION', headline: 'A tall rectangular firebox with wall-mounted vertical radiant tubes',
    body: 'This Atlas uses a representative up-fired box heater as its master anatomy model. The training configuration places floor burners below a central firing corridor, vertical radiant tubes on the walls and the shield / convection section above the radiant chamber.',
    geometry: 'Tall rectangular radiant chamber with a distinct upper heat-recovery section and stack path.', tubes: 'Vertical wall-mounted radiant passes in this representative model; the upper convection rows are horizontal.', burners: 'Floor-mounted up-fired burner array with the active flame entirely inside the radiant firebox.', flow: 'Hot products rise through the radiant chamber, pass the shield / convection section and discharge through the upper flue-gas system.', notes: ['Box heaters can use other coil arrangements.', 'Burner count and arrangement are service- and design-specific.', 'The displayed proportions are schematic, not plant dimensions.'],
  },
  cabin: {
    name: 'Cabin Heater', eyebrow: 'CABIN-STYLE RECTANGULAR CONFIGURATION', headline: 'A wider radiant chamber represented with horizontal wall-coil passes',
    body: 'The cabin model is intentionally different from the Box model. It uses a broader rectangular firebox, floor burner rows and a representative horizontal serpentine wall-coil arrangement to make the geometry and tube-layout distinction immediately visible.',
    geometry: 'Wide rectangular radiant chamber with a lower, broader silhouette and an upper convection / stack transition.', tubes: 'Horizontal serpentine radiant wall-coil passes in this representative training configuration.', burners: 'Multiple floor-mounted burner rows firing upward into the wider radiant chamber.', flow: 'Combustion products rise across the wider firebox before entering the upper heat-recovery and flue-gas path.', notes: ['Cabin heaters exist in multiple firing and coil-layout variants.', 'Horizontal wall coils shown here are a training configuration, not a universal rule.', 'Actual burner spacing and clearances come from the applicable design basis.'],
  },
  cylindrical: {
    name: 'Vertical Cylindrical Heater', eyebrow: 'CYLINDRICAL RADIANT CONFIGURATION', headline: 'A circular firebox represented with a helical wall coil and floor firing',
    body: 'The cylindrical model replaces the rectangular firebox with a circular radiant shell. The representative training arrangement uses floor burners and a helical process coil around the radiant wall, followed by a compact upper convection and stack section.',
    geometry: 'Circular vertical radiant shell with a compact footprint and a central rising flue-gas path.', tubes: 'Helical wall-coil arrangement in this representative model; vertical-tube cylindrical designs also exist.', burners: 'Floor-mounted burners arranged around the lower circular chamber.', flow: 'Hot combustion products rise through the central cylindrical radiant zone before the upper heat-recovery and stack path.', notes: ['Vertical cylindrical heaters may use vertical or helical coil arrangements.', 'The displayed helix is illustrative rather than an OEM-specific coil design.', 'Actual geometry, duty and firing arrangement vary by service.'],
  },
};

const typeOrder: HeaterType[] = ['box', 'cabin', 'cylindrical'];
const studyViews: { id: HeaterTypeView; title: string; subtitle: string }[] = [
  { id: 'exterior', title: 'Exterior', subtitle: 'Read the overall heater silhouette' },
  { id: 'cutaway', title: 'Cutaway', subtitle: 'See firebox and heat-recovery anatomy' },
  { id: 'tubes', title: 'Tube Layout', subtitle: 'Compare radiant-coil orientation' },
  { id: 'burners', title: 'Burner Layout', subtitle: 'Compare firing arrangement' },
  { id: 'flow', title: 'Flow Path', subtitle: 'Process fluid vs hot flue gas' },
];

const viewCopy: Record<HeaterTypeView, { title: string; body: string }> = {
  exterior: { title: 'Start with the geometry before looking inside', body: 'Exterior view emphasizes footprint, shell shape, relative height and the relationship between the radiant enclosure, convection section and stack.' },
  cutaway: { title: 'Open the heater and read its internal architecture', body: 'Cutaway view removes the front obstruction and keeps the main internal sections visible so the differences are learned spatially rather than as a list.' },
  tubes: { title: 'Tube orientation is one of the fastest visual identifiers', body: 'The Atlas highlights the representative radiant coil arrangement for each model. These are teaching configurations and should not be treated as universal design rules.' },
  burners: { title: 'See how firing geometry relates to the radiant chamber', body: 'Burner view suppresses nonessential geometry and emphasizes the floor-fired arrangement used in these representative models.' },
  flow: { title: 'Separate the process path from the combustion-products path', body: 'Cyan particles represent process-fluid travel through a representative coil; orange particles represent the qualitative hot flue-gas route. Neither animation is a CFD result.' },
};

export default function HeaterTypesPage({ onBack, onNavigate }: Props) {
  const [heaterType, setHeaterType] = useState<HeaterType>('box');
  const [view, setView] = useState<HeaterTypeView>('cutaway');
  const [compare, setCompare] = useState(false);
  const [mobileSheet, setMobileSheet] = useState<'views' | 'details' | null>(null);
  const [cameraCommand, setCameraCommand] = useState<CameraCommand>({ id: 1, action: 'fit' });
  const info = typeInfo[heaterType];
  const viewInfo = viewCopy[view];

  const issueCamera = (action: CameraAction) => setCameraCommand(current => ({ id: current.id + 1, action }));
  const selectType = (type: HeaterType) => { setHeaterType(type); if (compare) setCompare(false); };
  const comparisonRows = useMemo(() => [
    ['Firebox', 'Tall rectangular', 'Wide rectangular', 'Circular vertical'],
    ['Radiant coil shown', 'Vertical wall tubes', 'Horizontal wall coil', 'Helical wall coil'],
    ['Firing shown', 'Floor / up-fired', 'Floor burner rows', 'Circular floor array'],
    ['Upper section', 'Shield + convection', 'Upper convection', 'Compact upper convection'],
  ], []);

  return (
    <main className="app-shell types-page">
      <header className="atlas-topbar radiant-topbar types-topbar">
        <button className="back-atlas" onClick={onBack}><ArrowLeft size={16} /> Atlas</button>
        <div className="brand-lockup"><strong>FIRED HEATER <em>ATLAS</em></strong><span>HEATER TYPES · 3D COMPARISON</span></div>
        <GlobalNavigation active="heaterTypes" onNavigate={onNavigate} className="radiant-nav" />
      </header>
      <section className="radiant-contextbar types-contextbar"><div><span>REPRESENTATIVE CONFIGURATIONS</span><strong>Box · Cabin · Vertical Cylindrical</strong></div><p>Training geometry · Real fired-heater families contain many service- and OEM-specific variants</p></section>
      <section className="radiant-workspace types-workspace">
        <aside className="radiant-left types-left">
          <div className="radiant-title-block types-title-block"><span>HEATER FAMILY SELECTOR</span><h1>Learn the geometry before the terminology</h1><p>Switch between three genuinely different 3D fired-heater configurations, then compare how the firebox, radiant coil and burner arrangement change.</p></div>
          <div className="types-type-tabs">{typeOrder.map((type, index) => <button key={type} className={!compare && heaterType === type ? 'active' : ''} onClick={() => selectType(type)}><b>0{index + 1}</b><span><strong>{typeInfo[type].name}</strong><small>{typeInfo[type].eyebrow}</small></span></button>)}</div>
          <button className={compare ? 'types-compare-toggle active' : 'types-compare-toggle'} onClick={() => setCompare(value => !value)}><Columns3 size={17} /><span><b>COMPARE MODE</b><small>Show all three configurations together</small></span></button>
          <div className="radiant-study-tabs types-study-tabs">{studyViews.map((study, index) => <button key={study.id} className={view === study.id ? 'active' : ''} onClick={() => setView(study.id)}><b>0{index + 1}</b><span><strong>{study.title}</strong><small>{study.subtitle}</small></span></button>)}</div>
          <div className="types-training-note"><Shapes size={17} /><div><b>REPRESENTATIVE, NOT UNIVERSAL</b><p>These models teach recognizable arrangements. They do not imply that every heater in a named family must use the exact coil or firing pattern shown.</p></div></div>
        </aside>
        <div className="radiant-viewer types-viewer hero-viewer">
          <HeaterTypes3D heaterType={heaterType} view={view} compare={compare} cameraCommand={cameraCommand} />
          <div className="viewer-kicker types-kicker"><i /> HEATER TYPES 3D <span>Drag to rotate · Wheel / pinch to zoom</span></div>
          <div className="radiant-view-state types-view-state"><span>{compare ? 'COMPARE MODE' : info.eyebrow}</span><b>{compare ? 'Box · Cabin · Vertical Cylindrical' : info.name}</b></div>
          <div className="types-center-types">{typeOrder.map(type => <button key={type} className={!compare && heaterType === type ? 'active' : ''} onClick={() => selectType(type)}>{typeInfo[type].name}</button>)}<button className={compare ? 'compare active' : 'compare'} onClick={() => setCompare(value => !value)}><Columns3 size={13} /> Compare</button></div>
          <div className="radiant-center-tabs types-center-tabs">{studyViews.map(study => <button key={study.id} className={view === study.id ? 'active' : ''} onClick={() => setView(study.id)}>{study.title}</button>)}</div>
          {view === 'flow' && <div className="radiant-flow-legend types-flow-legend"><span className="process">PROCESS FLUID</span><span className="heat">HOT FLUE GAS</span></div>}
          {compare && <div className="types-compare-badge">3 REPRESENTATIVE CONFIGURATIONS · SAME STUDY VIEW</div>}
          <div className="control-dock radiant-control-dock types-control-dock"><button onClick={() => issueCamera('fit')}><Focus size={17} /> Fit</button><button onClick={() => issueCamera('zoomIn')}><ZoomIn size={17} /> Zoom +</button><button onClick={() => issueCamera('zoomOut')}><ZoomOut size={17} /> Zoom −</button><button className={compare ? 'active' : ''} onClick={() => setCompare(value => !value)}><Columns3 size={17} /> Compare</button><button onClick={() => { setHeaterType('box'); setView('cutaway'); setCompare(false); issueCamera('reset'); }}><Rotate3D size={17} /> Reset</button></div>
          <div className="study-mobile-actions"><button onClick={() => setMobileSheet('views')}><Layers3 size={17} /> Views</button><button onClick={() => setMobileSheet('details')}><Info size={17} /> Details</button></div>
          <div className={`study-mobile-sheet ${mobileSheet ? 'open' : ''}`}><button className="study-mobile-close" onClick={() => setMobileSheet(null)} aria-label="Close mobile heater-types panel"><X size={17} /></button>{mobileSheet === 'views' ? <><span className="sheet-eyebrow">HEATER TYPES</span><div className="sheet-chip-row types-mobile-type-chips">{typeOrder.map(type => <button key={type} className={!compare && heaterType === type ? 'active' : ''} onClick={() => { selectType(type); setMobileSheet(null); }}>{typeInfo[type].name}</button>)}<button className={compare ? 'active' : ''} onClick={() => { setCompare(value => !value); setMobileSheet(null); }}>Compare All</button></div><span className="sheet-subhead">STUDY VIEW</span><div className="sheet-view-grid">{studyViews.map(study => <button key={study.id} className={view === study.id ? 'active' : ''} onClick={() => { setView(study.id); setMobileSheet(null); }}><strong>{study.title}</strong><small>{study.subtitle}</small></button>)}</div></> : <>{compare ? <><span className="sheet-eyebrow">COMPARE MODE</span><h3>Three heater families, one visual question at a time</h3><p>All three representative models use the same active study view so differences in firebox shape, tube orientation and firing layout stay easy to compare.</p></> : <><span className="sheet-eyebrow">{info.eyebrow}</span><h3>{info.headline}</h3><p>{info.body}</p></>}<span className="sheet-subhead">CURRENT STUDY</span><p>{viewInfo.body}</p><p className="sheet-note"><b>Training guardrail:</b> the displayed configurations are representative and schematic. Actual fired-heater geometry must be verified from the applicable design, OEM and plant documentation.</p></>}</div>
          <div className="radiant-mobile-summary types-mobile-summary"><Shapes size={17} /><span>{compare ? 'Compare all three representative configurations' : `${info.name} · ${studyViews.find(item => item.id === view)?.title}`}</span></div>
        </div>
        <aside className="radiant-tech types-tech">
          {compare ? <><div className="radiant-tech-head types-tech-head"><span>COMPARE MODE</span><h2>Different geometry, different visual logic</h2><p>Use the same view across all three models to compare form, tube orientation, firing arrangement and the qualitative route from firebox to stack.</p></div><div className="types-comparison-table">{comparisonRows.map(row => <div key={row[0]}><b>{row[0]}</b><span>{row[1]}</span><span>{row[2]}</span><span>{row[3]}</span></div>)}</div><div className="types-comparison-head"><span>BOX</span><span>CABIN</span><span>CYLINDRICAL</span></div></> : <><div className="radiant-tech-head types-tech-head"><span>{info.eyebrow}</span><h2>{info.headline}</h2><p>{info.body}</p></div><section className="radiant-tech-section"><span>FIREBOX GEOMETRY</span><p>{info.geometry}</p></section><section className="radiant-tech-section"><span>RADIANT TUBE ARRANGEMENT SHOWN</span><p>{info.tubes}</p></section><section className="radiant-tech-section"><span>BURNER ARRANGEMENT SHOWN</span><p>{info.burners}</p></section><section className="radiant-tech-section"><span>QUALITATIVE GAS PATH</span><p>{info.flow}</p></section><section className="radiant-tech-section"><span>VARIATION NOTES</span><ul>{info.notes.map(note => <li key={note}>{note}</li>)}</ul></section></>}
          <section className="radiant-tech-section types-current-study"><span>CURRENT STUDY VIEW</span><h3>{viewInfo.title}</h3><p>{viewInfo.body}</p></section>
          <section className="radiant-warning types-warning"><Wrench size={17} /><p><b>Training model.</b> Heater family names do not define one mandatory geometry. Coil arrangement, burner configuration, convection placement, dimensions and operating limits must come from the actual heater design and approved plant / OEM documentation.</p></section>
          <div className="radiant-path types-path"><span>VISUAL COMPARISON QUESTIONS</span><div><span>Firebox shape<i>›</i></span><span>Tube orientation<i>›</i></span><span>Burner layout<i>›</i></span><span>Heat-recovery location<i>›</i></span><span>Flue-gas path</span></div></div>
        </aside>
      </section>
    </main>
  );
}
