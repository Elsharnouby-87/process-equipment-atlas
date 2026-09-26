import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Eye, Focus, Gauge, Info, Layers3, Rotate3D, ShieldCheck, Wind, Wrench, X, ZoomIn, ZoomOut } from 'lucide-react';
import Heater3D from './Heater3D';
import GlobalNavigation from './GlobalNavigation';
import type { NavigationTarget } from './GlobalNavigation';
import type { CameraAction, CameraCommand, ContextMode, PurgeStudy, ViewMode } from './modelTypes';
import './purgeAirStudy.css';

type Props = { onBack: () => void; onNavigate: (target: NavigationTarget) => void };
type MobileSheet = 'views' | 'details' | null;

type PurgeStudyCopy = {
  eyebrow: string;
  title: string;
  body: string;
  watch: string[];
  function: string;
};

const studyViews: { id: PurgeStudy; title: string; subtitle: string }[] = [
  { id: 'overview', title: 'Overview', subtitle: 'Read the complete purge-air system in heater context' },
  { id: 'blower', title: 'Blower', subtitle: 'Low-pressure fan, inlet, motor and shaft' },
  { id: 'damper', title: 'Isolation Damper', subtitle: 'Butterfly damper, shaft and actuator concept' },
  { id: 'proof', title: 'Airflow Proof', subtitle: 'Representative flow / pressure proving point' },
  { id: 'riser', title: 'External Riser', subtitle: 'Route purge air up the outside of the casing' },
  { id: 'entries', title: 'Two Entries', subtitle: 'Twin lower-radiant sidewall penetrations' },
  { id: 'flow', title: 'Full Purge Flow', subtitle: 'Fan-to-stack animated purge-air route' },
  { id: 'bms', title: 'BMS / Permissive', subtitle: 'Representative proving concept before ignition eligibility' },
];

const studyCopy: Record<PurgeStudy, PurgeStudyCopy> = {
  overview: {
    eyebrow: 'SYSTEM OVERVIEW',
    title: 'One connected purge-air system — source, proof, entries and discharge path',
    body: 'The V13.6 training arrangement connects a representative low-pressure purge blower to a dedicated discharge duct, butterfly isolation damper, airflow / pressure proof point, external riser, short lower-radiant manifold and two sidewall entries. The enclosure path then continues upward through the heater to the stack.',
    watch: ['Blower package outside the heater casing', 'One continuous duct path toward the heater', 'Damper and proof device located on the main duct', 'Twin entry points near the lower radiant / burner-floor elevation', 'Clear discharge route through the upper heater to the stack'],
    function: 'Provide a physical learning model for a forced-air purge arrangement without treating the shown geometry, duty, timing or permissive logic as universal.',
  },
  blower: {
    eyebrow: 'PURGE AIR SOURCE',
    title: 'Representative low-pressure purge fan / blower package',
    body: 'The blower package is shown as an axial-style low-pressure unit with an inlet bellmouth / guard, motor, shaft and support base. It is the visible air source for this Atlas purge configuration.',
    watch: ['Inlet / guard remains clear', 'Blower casing and support condition', 'Motor and shaft relationship', 'Discharge direction toward the heater', 'Running / stopped cue in the animated purge-flow study'],
    function: 'Supply purge air to the dedicated duct where this purge method is used. Actual fan type, duty, redundancy and hazardous-area requirements remain project / OEM dependent.',
  },
  damper: {
    eyebrow: 'PURGE AIR ISOLATION',
    title: 'Butterfly isolation damper between the blower and heater side',
    body: 'A representative in-line butterfly damper, shaft and compact actuator are shown in the main discharge duct. The Atlas treats its required position / proof as a configuration-dependent permissive concept.',
    watch: ['Damper location directly in the main purge duct', 'Disc, shaft and actuator relationship', 'Position-proof concept', 'No assumption that one universal fail action applies to every heater'],
    function: 'Provide an isolation / position-control point in the purge-air route where required by the approved purge philosophy.',
  },
  proof: {
    eyebrow: 'AIRFLOW / PRESSURE PROOF',
    title: 'Proving purge-air availability is different from merely showing a running fan',
    body: 'The V13.6 source includes a representative FSL/PSL-style proving point on the purge duct. The training purpose is to distinguish blower status from acceptance of the required purge-air condition.',
    watch: ['Proof device mounted on the main purge duct', 'Relationship to blower and isolation damper', 'Proof is a BMS input concept, not a visual judgment', 'Technology and threshold remain project / OEM dependent'],
    function: 'Represent an airflow or pressure proving input used by the combustion-safety system when the approved design requires it.',
  },
  riser: {
    eyebrow: 'EXTERNAL ROUTING',
    title: 'Keep the purge-air riser outside the heater casing until the lower-radiant entry zone',
    body: 'Downstream of the proof section, the duct route turns into an external vertical riser and then a short distribution manifold close to the lower radiant / burner-floor elevation.',
    watch: ['Riser remains outside the hot enclosure', 'Clear connection from main duct to the lower-entry elevation', 'Short distribution manifold near the casing', 'No unnecessary routing across the firing corridor'],
    function: 'Carry purge air from the external blower package to the selected lower-radiant entry elevation.',
  },
  entries: {
    eyebrow: 'LOWER-RADIANT ENTRY',
    title: 'Two symmetric sidewall entries introduce purge air into the lower radiant section',
    body: 'The final V13.6 training arrangement uses two sidewall penetrations rather than a burner-specific purge connection. They are placed near the base of the radiant section / burner floor and below the first radiant-tube elevation in the reference design.',
    watch: ['Two distinct casing penetrations', 'Entries originate from one short side manifold', 'Entry location is separate from the burner fuel path', 'Jets are represented away from direct radiant-coil impingement'],
    function: 'Distribute purge air into the lower heater enclosure so the internal sweep can progress upward toward the discharge path.',
  },
  flow: {
    eyebrow: 'FULL PURGE-AIR ROUTE',
    title: 'Follow the purge medium from blower inlet to stack discharge',
    body: 'This study animates the complete qualitative route: blower → main duct → isolation damper → proof section → external riser → short manifold → two lower-radiant entries → radiant enclosure → shield / convection → breeching → stack.',
    watch: ['Fan rotor running cue', 'Air begins at the physical blower rather than appearing inside the heater', 'Flow divides into two lower-radiant entry streams', 'Both streams join the enclosure sweep', 'No pilot or main flame is implied by the purge animation'],
    function: 'Teach path continuity and separation between purge air, combustion air, fuel and process-fluid flow. Particle speed is illustrative, not CFD or measured mass flow.',
  },
  bms: {
    eyebrow: 'BMS / PERMISSIVE CONCEPT',
    title: 'A purge permissive is a proven system condition — not a timer animation',
    body: 'The Atlas shows a representative learning chain in which the combustion-safety system considers protected fuel admission, purge-fan status, required damper state, airflow / pressure proof, a continuous discharge path and approved purge-completion criteria before ignition can become eligible. Exact logic belongs to the plant BMS / SRS / Cause & Effect.',
    watch: ['Fan running / available status is distinct from airflow proof', 'Damper state can require independent position proof', 'Airflow / pressure proof must be accepted by the real logic where required', 'Purge completion criteria can include flow, enclosure volume changes and time', 'Ignition eligibility is not the same as an ignition command'],
    function: 'Connect the physical purge equipment to the safety-system concept without inventing a universal permissive matrix or startup instruction.',
  },
};

function cameraForStudy(study: PurgeStudy): CameraAction {
  if (study === 'blower') return 'purgeBlower';
  if (study === 'damper') return 'purgeDamper';
  if (study === 'proof') return 'purgeProof';
  if (study === 'riser') return 'purgeRiser';
  if (study === 'entries') return 'purgeEntries';
  if (study === 'flow') return 'purgeFlow';
  if (study === 'bms') return 'purgeBms';
  return 'purgeOverview';
}

export default function PurgeAirPage({ onBack, onNavigate }: Props) {
  const [study, setStudy] = useState<PurgeStudy>('overview');
  const [labels, setLabels] = useState(true);
  const [mobileSheet, setMobileSheet] = useState<MobileSheet>(null);
  const [cameraCommand, setCameraCommand] = useState<CameraCommand>({ id: 1, action: 'purgeOverview', component: 'Purge Air Blower' });
  const noSelect = useCallback(() => {}, []);
  const copy = studyCopy[study];
  const flowLive = study === 'flow';
  const mode: ViewMode = study === 'entries' || study === 'flow' ? 'cutaway' : 'normal';
  const contextMode: ContextMode = study === 'flow' ? 'full' : study === 'overview' || study === 'entries' ? 'focus' : 'isolate';

  const cameraAction = useCallback((action: CameraAction) => {
    setCameraCommand(current => ({ id: current.id + 1, action, component: 'Purge Air Blower' }));
  }, []);

  useEffect(() => {
    cameraAction(cameraForStudy(study));
  }, [study, cameraAction]);

  const resetStudy = () => {
    setStudy('overview');
    setLabels(true);
    setMobileSheet(null);
    cameraAction('purgeOverview');
  };

  return (
    <main className="app-shell radiant-page purge-page">
      <header className="atlas-topbar radiant-topbar purge-topbar">
        <button className="back-atlas" onClick={onBack}><ArrowLeft size={16} /> Components</button>
        <div className="brand-lockup"><strong>FIRED HEATER <em>ATLAS</em></strong><span>COMPONENT STUDY · PURGE / VENTILATION SYSTEM</span></div>
        <GlobalNavigation active="components" onNavigate={onNavigate} className="radiant-nav" />
      </header>

      <section className="radiant-contextbar purge-contextbar">
        <div><span>V13.6 REFERENCE ARRANGEMENT</span><strong>Purge Air Blower · Damper · Proof · Riser · Two Lower-Radiant Entries</strong></div>
        <p>Representative training configuration · Actual purge design and BMS logic are site / OEM / SRS dependent</p>
      </section>

      <section className="radiant-workspace purge-workspace">
        <aside className="radiant-left purge-left">
          <div className="radiant-title-block purge-title-block">
            <span>PURGE AIR SYSTEM</span>
            <h1>Trace the air source all the way to the stack.</h1>
            <p>Study the physical purge equipment first, then switch to the full animated route and finally connect it to the BMS / permissive concept.</p>
          </div>
          <div className="radiant-study-tabs purge-study-tabs">
            {studyViews.map((view, index) => (
              <button key={view.id} className={study === view.id ? 'active' : ''} onClick={() => setStudy(view.id)}>
                <b>{String(index + 1).padStart(2, '0')}</b>
                <span><strong>{view.title}</strong><small>{view.subtitle}</small></span>
              </button>
            ))}
          </div>
          <div className="purge-source-note"><ShieldCheck size={17} /><div><b>TRAINING BOUNDARY</b><p>The displayed route is the Atlas V13.6 reference arrangement. Purge medium, airflow, duration, volume changes, damper logic and permissives must come from the approved plant / OEM documents.</p></div></div>
        </aside>

        <div className="radiant-viewer purge-viewer hero-viewer">
          <Heater3D
            mode={mode}
            selected="Purge Air Blower"
            labels={labels}
            flow={flowLive}
            explode={false}
            contextMode={contextMode}
            damperPosition={18}
            cameraCommand={cameraCommand}
            onSelect={noSelect}
          />
          <div className="viewer-kicker purge-kicker"><i /> PURGE AIR 3D STUDY <span>Drag to rotate · Wheel / pinch to zoom</span></div>
          <div className="radiant-view-state purge-view-state"><span>{copy.eyebrow}</span><b>{studyViews.find(item => item.id === study)?.title}</b></div>

          <div className="radiant-center-tabs purge-center-tabs">
            {studyViews.map(view => <button key={view.id} className={study === view.id ? 'active' : ''} onClick={() => setStudy(view.id)}>{view.title}</button>)}
          </div>

          {flowLive && <div className="purge-live-status" aria-label="Purge training visual status">
            <span className="live"><small>FAN</small><b>RUNNING</b></span>
            <span className="live"><small>DAMPER</small><b>PROVED</b></span>
            <span className="live"><small>AIRFLOW</small><b>PROVED</b></span>
          </div>}

          {study === 'bms' && <div className="purge-bms-badge"><Gauge size={14} /><span>BMS / PERMISSIVE CONCEPT · NOT FIELD STATUS</span></div>}

          <div className="control-dock radiant-control-dock purge-control-dock">
            <button title="Fit current purge study" onClick={() => cameraAction(cameraForStudy(study))}><Focus size={17} /> Fit Study</button>
            <button onClick={() => cameraAction('zoomIn')}><ZoomIn size={17} /> Zoom +</button>
            <button onClick={() => cameraAction('zoomOut')}><ZoomOut size={17} /> Zoom −</button>
            <button className={labels ? 'active' : ''} onClick={() => setLabels(value => !value)}><Eye size={17} /> Labels</button>
            <button className={flowLive ? 'active' : ''} onClick={() => setStudy('flow')}><Wind size={17} /> {flowLive ? 'Flow Live' : 'Show Flow'}</button>
            <button onClick={resetStudy}><Rotate3D size={17} /> Reset</button>
          </div>

          <div className="study-mobile-actions"><button onClick={() => setMobileSheet('views')}><Layers3 size={17} /> Views</button><button onClick={() => setMobileSheet('details')}><Info size={17} /> Details</button></div>
          <div className={`study-mobile-sheet ${mobileSheet ? 'open' : ''}`}>
            <button className="study-mobile-close" onClick={() => setMobileSheet(null)} aria-label="Close purge air study panel"><X size={17} /></button>
            {mobileSheet === 'views' ? (
              <><span className="sheet-eyebrow">PURGE AIR STUDIES</span><div className="sheet-view-grid">{studyViews.map(view => <button key={view.id} className={study === view.id ? 'active' : ''} onClick={() => { setStudy(view.id); setMobileSheet(null); }}><strong>{view.title}</strong><small>{view.subtitle}</small></button>)}</div></>
            ) : (
              <><span className="sheet-eyebrow">{copy.eyebrow}</span><h3>{copy.title}</h3><p>{copy.body}</p><span className="sheet-subhead">WHAT TO OBSERVE</span><ul>{copy.watch.map(item => <li key={item}>{item}</li>)}</ul><p className="sheet-note"><b>Function:</b> {copy.function}</p></>
            )}
          </div>
          <div className="radiant-mobile-summary purge-mobile-summary"><Wind size={17} /><span>{studyViews.find(item => item.id === study)?.title} · {flowLive ? 'Flow animation active' : 'Study view'}</span></div>
        </div>

        <aside className="radiant-tech purge-tech">
          <div className="radiant-tech-head purge-tech-head"><span>{copy.eyebrow}</span><h2>{copy.title}</h2><p>{copy.body}</p></div>
          <section className="radiant-tech-section"><span>WHAT TO OBSERVE</span><ul>{copy.watch.map(item => <li key={item}>{item}</li>)}</ul></section>
          <section className="radiant-tech-section"><span>FUNCTION / LEARNING PURPOSE</span><p>{copy.function}</p></section>

          {study === 'bms' && <section className="radiant-tech-section purge-permissive-panel">
            <span>REPRESENTATIVE PERMISSIVE CONCEPT</span>
            <div className="purge-permissive-grid">
              <div><small>01</small><b>NON-FIRING / FUEL PROTECTED</b><em>Required condition concept</em></div>
              <div><small>02</small><b>FAN STATUS</b><em>Running / available as required</em></div>
              <div><small>03</small><b>DAMPER POSITION PROOF</b><em>Required state accepted</em></div>
              <div><small>04</small><b>AIRFLOW / PRESSURE PROOF</b><em>Independent proving input</em></div>
              <div><small>05</small><b>CONTINUOUS DISCHARGE PATH</b><em>Heater enclosure to stack</em></div>
              <div><small>06</small><b>PURGE COMPLETION CRITERIA</b><em>Approved flow / volume / time logic</em></div>
            </div>
            <p>Only after the real BMS / procedure accepts the applicable conditions can the sequence become ignition-eligible. This panel is not a Cause & Effect matrix.</p>
          </section>}

          {study === 'flow' && <section className="radiant-tech-section purge-flow-chain">
            <span>FULL ROUTE</span>
            <div><b>Blower</b><i>→</i><b>Main duct</b><i>→</i><b>Damper</b><i>→</i><b>Proof</b><i>→</i><b>Riser</b><i>→</i><b>2 entries</b><i>→</i><b>Radiant</b><i>→</i><b>Upper heater</b><i>→</i><b>Stack</b></div>
          </section>}

          <section className="radiant-warning purge-warning"><Wrench size={17} /><p><b>Engineering boundary.</b> The two-entry routing is a generic Atlas training configuration derived from the V13.6 source. Actual entry count / location, fan duty, pressure, purge time, required air changes, damper fail action, proof technology and BMS permissives are project-specific.</p></section>
          <div className="radiant-path purge-path"><span>SYSTEM PATH</span><div><span>Air source<i>›</i></span><span>Isolation<i>›</i></span><span>Proof<i>›</i></span><span>Distribution<i>›</i></span><span>Enclosure sweep<i>›</i></span><span>Stack discharge</span></div></div>
        </aside>
      </section>
    </main>
  );
}
