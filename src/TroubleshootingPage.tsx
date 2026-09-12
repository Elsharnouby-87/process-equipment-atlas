import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, CircleDot, Eye, Flame, Focus, Info, Layers3, Pause, Play, Rotate3D, ScanLine, ShieldAlert, Thermometer, Wind, Wrench, X, ZoomIn, ZoomOut } from 'lucide-react';
import Heater3D from './Heater3D';
import GlobalNavigation from './GlobalNavigation';
import type { NavigationTarget } from './GlobalNavigation';
import type { CameraAction, CameraCommand, TroubleshootingPhase, TroubleshootingScenario } from './modelTypes';

type Props = { onBack: () => void; onNavigate: (target: NavigationTarget) => void };
type DiagnosticTab = 'observe' | 'causes' | 'inspect' | 'why';
type MobileSheet = 'scenarios' | 'diagnose' | 'layers' | null;
type EvidenceKind = 'primary' | 'secondary' | 'thermal' | 'context' | 'damper' | 'backfire';
type PhaseSpec = { id: TroubleshootingPhase; title: string; short: string; cue: string };
type DiagnosticCopy = Record<DiagnosticTab, { title: string; intro: string; items: string[] }>;
type ScenarioCopy = {
  code: string;
  category: string;
  title: string;
  subtitle: string;
  intro: string;
  tour: string;
  source: string;
  phases: PhaseSpec[];
  diagnostics: DiagnosticCopy;
  learningChain: string[];
};

const scenarioCopy: Record<TroubleshootingScenario, ScenarioCopy> = {
  flameImpingement: {
    code: 'T-01',
    category: 'RADIANT & COMBUSTION',
    title: 'Flame Impingement',
    subtitle: 'Recognition & Diagnostic Context',
    intro: 'Move from a normal baseline to direct flame / tube contact and connect the visible evidence to diagnostic context.',
    tour: 'Play the four phases automatically, then stop anywhere to rotate, zoom and inspect the flame-to-tube relationship.',
    source: 'John Zink Combustion Handbook · Troubleshooting §17.3',
    phases: [
      { id: 'normal', title: 'Normal Clearance', short: 'Baseline', cue: 'Flame remains inside the intended firing corridor with visible clearance to the radiant tube wall.' },
      { id: 'deviation', title: 'Flame Deviation', short: 'Early Cue', cue: 'One representative burner flame begins leaning toward the nearby radiant tube surface.' },
      { id: 'contact', title: 'Tube Contact', short: 'Direct Indication', cue: 'The representative flame envelope reaches the external tube surface — the primary visual indication of impingement.' },
      { id: 'consequence', title: 'Thermal Consequence', short: 'Local Effect', cue: 'A qualitative local hot-area cue appears at the contact region to connect flame contact with localized overheating risk.' },
    ],
    diagnostics: {
      observe: { title: 'What You See', intro: 'Start with direct visual evidence, then connect it to supporting indications rather than relying on one signal alone.', items: ['Flame envelope contacting or repeatedly approaching a radiant tube surface', 'Localized red / orange tube appearance or a visibly hotter local area', 'Tube distortion or bulging may be an advanced visual concern', 'Supporting trends can include process-side pressure-drop change or higher bridgewall / stack temperature'] },
      causes: { title: 'Possible Causes', intro: 'These are diagnostic branches supported by the training source — not a single automatic diagnosis.', items: ['Uneven active-burner pattern or not all intended burners in service', 'Insufficient primary or secondary combustion air at a burner', 'Excessive firing or a flame envelope longer than the available space', 'Fouled / eroded burner tip or firing ports changing flame direction', 'Insufficient draft or internal flue-gas circulation pushing a flame toward the tube'] },
      inspect: { title: 'What to Inspect', intro: 'Use observation and approved inspection methods to understand the condition before any plant-specific response is considered.', items: ['Compare the flame envelope with the nearest tube surface and adjacent burner patterns', 'Inspect tube color pattern, local hot areas, distortion and visible surface condition', 'Review burner-tip / firing-port condition and alignment within the burner throat', 'Look at burner tile / diffuser condition and signs of uneven combustion-air distribution', 'Review draft indications and, where appropriate, use an IR survey to investigate a suspected local hot tube-skin area'] },
      why: { title: 'Why It Matters', intro: 'The learning chain is local flame contact → local heat input → tube-temperature rise → possible process-side and mechanical consequences.', items: ['Localized overheating can create a tube hot spot', 'In coking service, local overheating can accelerate coke formation', 'Coke can insulate the tube wall from process-fluid cooling and reduce heat transfer', 'Persistent overheating can increase damage risk and shorten tube life'] },
    },
    learningChain: ['Flame deviation', 'Tube contact', 'Local heat input', 'Damage concern'],
  },
  tubeHotArea: {
    code: 'T-02',
    category: 'RADIANT TUBES',
    title: 'Tube Hot Area',
    subtitle: 'Thermal Pattern Recognition',
    intro: 'Learn to recognize a localized tube hot area, compare it with adjacent tube surfaces, and separate the visible symptom from its possible causes.',
    tour: 'Follow the tube from a normal appearance into a scan-and-compare view, then reveal a localized hot area and the diagnostic branches behind it.',
    source: 'John Zink Combustion Handbook · Burner/Heater Operations §16.4.4.3',
    phases: [
      { id: 'normal', title: 'Normal Tube Pattern', short: 'Baseline', cue: 'The representative radiant tube has no localized hot-area cue; use the surrounding tube pattern as the visual baseline.' },
      { id: 'deviation', title: 'Thermal Scan', short: 'Compare Pattern', cue: 'A moving scan cue tracks the target tube while a neighboring tube is marked as a reference. No root cause is assigned.' },
      { id: 'contact', title: 'Localized Hot Area', short: 'Confirmed Contrast', cue: 'A confined red / orange hot-area cue appears on one part of the representative tube while the rest of the tube remains comparatively unchanged.' },
      { id: 'consequence', title: 'Diagnostic Context', short: 'Investigate Cause', cue: 'The hot area remains visible while the learning focus shifts from recognition to possible causes. The symptom itself does not prove one root cause.' },
    ],
    diagnostics: {
      observe: { title: 'Recognize the Pattern', intro: 'Treat the local contrast as a symptom that deserves comparison and investigation, not as a numeric temperature reading.', items: ['A localized red, orange or otherwise visibly hotter area on a process tube', 'A local contrast compared with adjacent tube surfaces or the rest of the same tube', 'Tube displacement, bowing or distortion can accompany overheating in more advanced conditions', 'A color / glow cue in this model is qualitative and is not a tube-metal-temperature value'] },
      causes: { title: 'Possible Causes', intro: 'The source describes internal-wall fouling as a common immediate cause and also identifies several contributors that can create or intensify local overheating.', items: ['Fouling deposit on the internal tube wall', 'Flame impingement contributing localized heat input and deposit formation', 'Over-firing', 'Uneven distribution of active burners', 'Concentrated heat input associated with flue-gas circulation currents'] },
      inspect: { title: 'Compare & Inspect', intro: 'Build the diagnosis from several observations and approved measurements rather than from tube color alone.', items: ['Compare the hot area with adjacent tube surfaces and the rest of the same tube', 'Check the nearby flame pattern and whether heat input appears locally concentrated', 'Inspect for tube displacement, bowing and support / guide condition', 'Review approved tube-skin / IR measurements where provided and applicable', 'Review process-side evidence that may support internal fouling or coking concerns'] },
      why: { title: 'Why It Matters', intro: 'A localized hot area can indicate loss of normal tube cooling or concentrated heat input, so persistence matters even when the root cause is not yet known.', items: ['Local metal temperature may rise substantially relative to the surrounding tube', 'Internal fouling can reduce heat transfer and reduce the cooling effect of the process fluid at the wall', 'Continued overheating can contribute to distortion and eventual tube failure', 'Plant metallurgy, design limits and approved procedures — not this visualization — determine actual acceptance and response'] },
    },
    learningChain: ['Tube pattern', 'Local contrast', 'Compare context', 'Investigate cause'],
  },
  draftPressure: {
    code: 'T-03',
    category: 'DRAFT / BREECHING / STACK',
    title: 'Draft Pressure Concern',
    subtitle: 'Pressure Direction & Hot-Gas Containment',
    intro: 'Read the heater as a pressure system: start with the normal inward tendency, then follow what changes when draft becomes insufficient and the arch region approaches a positive-pressure concern.',
    tour: 'Follow pressure direction, then zoom into the internal stack damper as its blade moves to a more restrictive representative position. Continue to the arch pressure reversal, hot-gas leakage, and a burner-specific premix flashback / backfire awareness cue.',
    source: 'John Zink Combustion Handbook · Burner/Heater Operations §16.4.1 and Troubleshooting §17.4 Flashback',
    phases: [
      { id: 'normal', title: 'Negative-Pressure Concept', short: 'Contained', cue: 'Representative openings show an inward pressure tendency while flue gas remains contained and moves toward the upper gas path. The internal stack damper is visible as part of the connected draft system.' },
      { id: 'deviation', title: 'Damper / Draft Restriction', short: 'Early Concern', cue: 'The internal stack-damper blade rotates toward a more restrictive representative position while upper flue-gas evacuation weakens. This is a qualitative mechanism illustration, not a prescribed damper setting.' },
      { id: 'contact', title: 'Positive-Pressure Concern', short: 'Direction Reversal', cue: 'At the arch / upper firebox region, representative arrows reverse outward to show why positive pressure changes hot-gas containment.' },
      { id: 'consequence', title: 'Leakage + Burner Concern', short: 'Consequences', cue: 'Representative hot-gas leakage appears at upper openings. A separate premix-burner flashback / backfire cue can also be explored as a burner-specific combustion-stability concern under disturbed draft / air conditions.' },
    ],
    diagnostics: {
      observe: { title: 'Read Pressure & Damper Direction', intro: 'Use draft indication together with gas / air direction, internal damper orientation and burner behavior. The animation is qualitative and does not represent a plant pressure or damper-position value.', items: ['Normal fired-heater operation generally maintains a negative-pressure tendency in the firebox', 'Draft is commonly monitored near the arch / radiant roof where flue-gas pressure is highest', 'A stack damper can form part of the flue-gas evacuation / draft-control path; a more restrictive position can reduce available evacuation depending on heater design', 'Positive pressure at the arch can drive hot flue gas outward through openings', 'Premix-burner flashback / backfire is a burner-specific phenomenon and is not a universal consequence of positive pressure'] },
      causes: { title: 'Diagnostic Context', intro: 'Do not infer one cause from one pressure observation. Read the connected firebox → convection → breeching → damper → stack path and the actual burner design.', items: ['Insufficient draft condition at the firebox / arch reference region', 'Restriction or reduced evacuation anywhere in the connected flue-gas path can contribute to draft concern', 'Stack-damper position / mechanism or induced-draft equipment may be relevant, depending on heater design', 'Changes in firing, combustion-air demand and flue-gas flow change what the draft system must accommodate', 'For premix burners, flashback relates to flame speed versus fuel / air mixture velocity through the burner — not pressure direction alone'] },
      inspect: { title: 'What to Inspect', intro: 'Build the picture from approved indications and physical observations without turning this training view into an operating instruction.', items: ['Review the plant draft indication at its defined reference location', 'Inspect the actual stack-damper blade / shaft / linkage / actuator arrangement and its indication using approved methods', 'Look for evidence of hot gas moving outward at doors, openings or casing interfaces', 'Compare flame shape / stability and burner-air behavior with the normal pattern', 'If the installed burner is a natural-draft premix design, include burner throat / mixer / venturi evidence when investigating flashback or backfiring concerns', 'Consider convection / flue-gas-path condition when investigating abnormal draft performance'] },
      why: { title: 'Why It Matters', intro: 'Draft affects combustion-air delivery and hot-gas containment. Burner flashback is shown separately because its mechanism is burner-specific rather than a generic result of positive pressure.', items: ['Too-little draft can restrict burner air and contribute to flame instability or flame-envelope problems', 'Positive pressure can push hot gases out through heater openings', 'Escaping hot gas can damage casing and weaken refractory anchors and can create a personnel hazard', 'A premix-burner flashback can propagate the flame into the mixer / venturi when flame speed exceeds mixture velocity', 'Actual response remains governed by plant / OEM / BMS / SIS procedures and the installed burner design'] },
    },
    learningChain: ['Negative tendency', 'Damper / evacuation concern', 'Positive pressure', 'Leakage + burner-specific concern'],
  },
};

const futureScenarios = ['Convection Fouling', 'High Stack Temperature'];

export default function TroubleshootingPage({ onBack, onNavigate }: Props) {
  const [scenario, setScenario] = useState<TroubleshootingScenario>('flameImpingement');
  const [phase, setPhase] = useState<TroubleshootingPhase>('normal');
  const [tab, setTab] = useState<DiagnosticTab>('observe');
  const [labels, setLabels] = useState(true);
  const [flow, setFlow] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [mobileSheet, setMobileSheet] = useState<MobileSheet>(null);
  const [cameraCommand, setCameraCommand] = useState<CameraCommand>({ id: 1, action: 'radiantFull', component: 'Radiant Tubes' });
  const noSelect = useCallback(() => {}, []);
  const currentScenario = scenarioCopy[scenario];
  const phaseIndex = currentScenario.phases.findIndex(item => item.id === phase);
  const currentPhase = currentScenario.phases[phaseIndex] ?? currentScenario.phases[0];
  const currentDiagnostic = currentScenario.diagnostics[tab];

  const cameraAction = useCallback((action: CameraAction) => {
    setCameraCommand(current => ({ id: current.id + 1, action, component: scenario === 'draftPressure' ? 'Breeching' : 'Radiant Tubes' }));
  }, [scenario]);

  const fitAction = useCallback((): CameraAction => {
    if (scenario === 'draftPressure') return phase === 'deviation' ? 'troubleDraftDamper' : 'troubleDraft';
    if (scenario === 'tubeHotArea') return 'radiantInspection';
    return phase === 'normal' ? 'radiantFull' : phase === 'consequence' ? 'radiantInspection' : 'radiantClearance';
  }, [scenario, phase]);

  useEffect(() => {
    cameraAction(fitAction());
  }, [fitAction, cameraAction]);

  useEffect(() => {
    if (!playing) return;
    if (phaseIndex >= currentScenario.phases.length - 1) {
      if (scenario === 'draftPressure') {
        const focusTimer = window.setTimeout(() => cameraAction('troubleBackfire'), 900);
        const stopTimer = window.setTimeout(() => setPlaying(false), 2450);
        return () => { window.clearTimeout(focusTimer); window.clearTimeout(stopTimer); };
      }
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setPhase(currentScenario.phases[phaseIndex + 1].id), 2600);
    return () => window.clearTimeout(timer);
  }, [playing, phaseIndex, currentScenario.phases, scenario, cameraAction]);

  const chooseScenario = (next: TroubleshootingScenario) => {
    setScenario(next);
    setPhase('normal');
    setTab('observe');
    setPlaying(false);
    setFlow(next === 'draftPressure');
    setLabels(true);
    setCameraCommand(current => ({ id: current.id + 1, action: next === 'draftPressure' ? 'troubleDraft' : next === 'tubeHotArea' ? 'radiantInspection' : 'radiantFull', component: next === 'draftPressure' ? 'Breeching' : 'Radiant Tubes' }));
  };

  const choosePhase = (next: TroubleshootingPhase) => {
    setPlaying(false);
    setPhase(next);
  };

  const resetScenario = () => {
    setPlaying(false);
    setPhase('normal');
    setTab('observe');
    setFlow(scenario === 'draftPressure');
    setLabels(true);
    cameraAction(scenario === 'draftPressure' ? 'troubleDraft' : scenario === 'tubeHotArea' ? 'radiantInspection' : 'radiantFull');
  };

  const focusEvidence = (kind: EvidenceKind) => {
    setPlaying(false);
    if (scenario === 'flameImpingement') {
      if (kind === 'primary') {
        if (phase === 'normal') setPhase('deviation');
        setTab('observe');
        cameraAction('radiantClearance');
      } else if (kind === 'secondary') {
        if (phaseIndex < 2) setPhase('contact');
        setTab('inspect');
        cameraAction('radiantClearance');
      } else {
        setPhase('consequence');
        setTab('why');
        cameraAction('radiantInspection');
      }
      return;
    }
    if (scenario === 'draftPressure') {
      if (kind === 'damper') {
        if (phaseIndex < 1) setPhase('deviation');
        setTab('causes');
        cameraAction('troubleDraftDamper');
      } else if (kind === 'primary') {
        if (phase === 'normal') setPhase('deviation');
        setTab('observe');
      } else if (kind === 'secondary') {
        if (phaseIndex < 2) setPhase('contact');
        setTab('inspect');
      } else if (kind === 'thermal') {
        setPhase('consequence');
        setTab('why');
        cameraAction('troubleDraft');
      } else if (kind === 'backfire') {
        setPhase('consequence');
        setTab('why');
        cameraAction('troubleBackfire');
      } else {
        if (phaseIndex < 2) setPhase('contact');
        setTab('causes');
        cameraAction('troubleDraft');
      }
      return;
    }
    if (kind === 'primary') {
      if (phase === 'normal') setPhase('deviation');
      setTab('observe');
    } else if (kind === 'secondary') {
      if (phase === 'normal') setPhase('deviation');
      setTab('inspect');
    } else if (kind === 'thermal') {
      if (phaseIndex < 2) setPhase('contact');
      setTab('why');
    } else {
      setPhase('consequence');
      setTab('causes');
    }
    cameraAction('radiantInspection');
  };

  const renderScenarioButtons = (mobile = false) => <div className={`trouble-scenario-list ${mobile ? 'trouble-mobile-scenario-list' : ''}`.trim()}>
    <button className={scenario === 'flameImpingement' ? 'active' : 'available'} onClick={() => chooseScenario('flameImpingement')}><b>T-01</b><span><strong>Flame Impingement</strong><small>Interactive 3D scenario</small></span><Flame size={17} /></button>
    <button className={scenario === 'tubeHotArea' ? 'active' : 'available'} onClick={() => chooseScenario('tubeHotArea')}><b>T-02</b><span><strong>Tube Hot Area</strong><small>Thermal pattern lab</small></span><Thermometer size={17} /></button>
    <button className={scenario === 'draftPressure' ? 'active' : 'available'} onClick={() => chooseScenario('draftPressure')}><b>T-03</b><span><strong>Draft Pressure Concern</strong><small>Pressure-direction 3D lab</small></span><Wind size={17} /></button>
    {!mobile && futureScenarios.map((item, index) => <button key={item} disabled><b>T-0{index + 4}</b><span><strong>{item}</strong><small>Next scenario</small></span><em>NEXT</em></button>)}
  </div>;

  const renderDiagnostic = () => <>
    <div className="trouble-diagnostic-tabs">
      {(['observe', 'causes', 'inspect', 'why'] as DiagnosticTab[]).map(item => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item === 'observe' ? 'Observe' : item === 'causes' ? 'Causes' : item === 'inspect' ? 'Inspect' : 'Why'}</button>)}
    </div>
    <div className="trouble-diagnostic-card">
      <span>GUIDED DIAGNOSIS</span>
      <h3>{currentDiagnostic.title}</h3>
      <p>{currentDiagnostic.intro}</p>
      <ul>{currentDiagnostic.items.map(item => <li key={item}>{item}</li>)}</ul>
    </div>
  </>;

  const renderEvidenceButtons = (compact = false) => {
    if (scenario === 'flameImpingement') return <>
      <button onClick={() => focusEvidence('primary')}><Flame size={15} /><b>Flame Pattern</b></button>
      <button className={phaseIndex >= 2 ? 'available' : ''} onClick={() => focusEvidence('secondary')}><CircleDot size={15} /><b>Tube Contact</b></button>
      <button className={phaseIndex >= 3 ? 'available danger' : ''} onClick={() => focusEvidence('thermal')}><Thermometer size={15} /><b>Local Hot Area</b></button>
    </>;
    if (scenario === 'draftPressure') return <>
      <button className={phaseIndex >= 1 ? 'available' : ''} onClick={() => focusEvidence('damper')}><Wrench size={15} /><b>{compact ? 'Damper' : 'Stack Damper'}</b></button>
      <button className={phaseIndex >= 1 ? 'available' : ''} onClick={() => focusEvidence('primary')}><Wind size={15} /><b>{compact ? 'Direction' : 'Draft Direction'}</b></button>
      <button className={phaseIndex >= 3 ? 'available danger' : ''} onClick={() => focusEvidence('thermal')}><ShieldAlert size={15} /><b>{compact ? 'Leakage' : 'Hot-Gas Leakage'}</b></button>
      <button className={phaseIndex >= 3 ? 'available danger' : ''} onClick={() => focusEvidence('backfire')}><Flame size={15} /><b>{compact ? 'Backfire' : 'Premix Backfire Risk'}</b></button>
      <button className={phaseIndex >= 2 ? 'available' : ''} onClick={() => focusEvidence('context')}><CircleDot size={15} /><b>{compact ? 'Pressure' : 'Pressure Zones'}</b></button>
    </>;
    return <>
      <button className={phaseIndex >= 1 ? 'available' : ''} onClick={() => focusEvidence('primary')}><ScanLine size={15} /><b>{compact ? 'Scan' : 'Scan Tube'}</b></button>
      <button className={phaseIndex >= 1 ? 'available' : ''} onClick={() => focusEvidence('secondary')}><CircleDot size={15} /><b>{compact ? 'Compare' : 'Compare Neighbor'}</b></button>
      <button className={phaseIndex >= 2 ? 'available danger' : ''} onClick={() => focusEvidence('thermal')}><Thermometer size={15} /><b>Hot Area</b></button>
      <button className={phaseIndex >= 3 ? 'available' : ''} onClick={() => focusEvidence('context')}><Wrench size={15} /><b>{compact ? 'Causes' : 'Cause Context'}</b></button>
    </>;
  };

  return (
    <main className={`app-shell radiant-page trouble-page ${scenario === 'tubeHotArea' ? 'hot-area-mode' : scenario === 'draftPressure' ? 'draft-pressure-mode' : ''}`}> 
      <header className="atlas-topbar radiant-topbar trouble-topbar">
        <button className="back-atlas" onClick={onBack}><ArrowLeft size={16} /> Atlas</button>
        <div className="brand-lockup"><strong>FIRED HEATER <em>ATLAS</em></strong><span>TROUBLESHOOTING · INTERACTIVE 3D LAB</span></div>
        <GlobalNavigation active="troubleshooting" onNavigate={onNavigate} className="radiant-nav" />
      </header>

      <section className="radiant-contextbar trouble-contextbar"><div><span>{currentScenario.code} / {currentScenario.category}</span><strong>{currentScenario.title} — {currentScenario.subtitle}</strong></div><p>Training visualization · Qualitative cues · No plant setpoints or operating instructions</p></section>

      <section className="radiant-workspace trouble-workspace">
        <aside className="radiant-left trouble-left">
          <div className="radiant-title-block trouble-title-block"><span>INTERACTIVE TROUBLESHOOTING</span><h1>Read the symptom in 3D</h1><p>{currentScenario.intro}</p></div>
          {renderScenarioButtons()}
          <div className="trouble-guide-card"><Play size={17} /><div><b>GUIDED TOUR · {currentScenario.code}</b><p>{currentScenario.tour}</p><button onClick={() => { if (phaseIndex >= currentScenario.phases.length - 1) setPhase('normal'); setPlaying(value => !value); }}>{playing ? <><Pause size={14} /> Pause Tour</> : <><Play size={14} /> Play 3D Tour</>}</button></div></div>
        </aside>

        <div className="radiant-viewer hero-viewer trouble-viewer">
          <Heater3D mode="cutaway" selected={scenario === 'draftPressure' ? 'Breeching' : 'Radiant Tubes'} labels={labels} flow={flow} explode={false} contextMode="full" damperPosition={18} draftStudyMode={scenario === 'draftPressure' ? 'pressure' : null} draftPressureScenario={scenario === 'draftPressure' && phaseIndex >= 2 ? 'positive' : 'negative'} troubleshootingScenario={scenario} troubleshootingPhase={phase} cameraCommand={cameraCommand} onSelect={noSelect} />

          <div className="trouble-phase-rail" aria-label={`${currentScenario.title} scenario phases`}>
            {currentScenario.phases.map((item, index) => <button key={item.id} className={`${phase === item.id ? 'active' : ''} phase-${item.id}`} onClick={() => choosePhase(item.id)}><i>{index + 1}</i><span><b>{item.title}</b><small>{item.short}</small></span></button>)}
          </div>

          <div className={`trouble-stage-card stage-${phase}`}><span>{currentScenario.code} · PHASE {phaseIndex + 1} / {currentScenario.phases.length}</span><b>{currentPhase.title}</b><p>{currentPhase.cue}</p></div>

          <div className="trouble-evidence-rail"><span>EXPLORE EVIDENCE</span>{renderEvidenceButtons()}</div>

          <div className="trouble-progress"><div>{currentScenario.phases.map((item, index) => <i key={item.id} className={index <= phaseIndex ? 'filled' : ''} />)}</div><span>{playing ? 'GUIDED TOUR RUNNING' : 'MANUAL EXPLORATION'}</span></div>

          <div className="control-dock trouble-control-dock">
            <button onClick={() => cameraAction(fitAction())}><Focus size={17} /> Fit Scenario</button>
            <button onClick={() => cameraAction('zoomIn')}><ZoomIn size={17} /> Zoom +</button>
            <button onClick={() => cameraAction('zoomOut')}><ZoomOut size={17} /> Zoom −</button>
            <button className={labels ? 'active' : ''} onClick={() => setLabels(value => !value)}><Eye size={17} /> Labels</button>
            <button className={flow ? 'active' : ''} onClick={() => setFlow(value => !value)}><Layers3 size={17} /> {scenario === 'draftPressure' ? 'Flue Path' : 'Process Flow'}</button>
            <button onClick={resetScenario}><Rotate3D size={17} /> Reset</button>
          </div>

          <div className="study-mobile-actions trouble-mobile-actions"><button className={mobileSheet === 'scenarios' ? 'active' : ''} onClick={() => setMobileSheet('scenarios')}><Thermometer size={17} /> Scenarios</button><button className={mobileSheet === 'diagnose' ? 'active' : ''} onClick={() => setMobileSheet('diagnose')}><Info size={17} /> Diagnose</button><button className={mobileSheet === 'layers' ? 'active' : ''} onClick={() => setMobileSheet('layers')}><Layers3 size={17} /> Layers</button></div>
          <div className={`study-mobile-sheet trouble-mobile-sheet ${mobileSheet ? 'open' : ''}`}>
            <button className="study-mobile-close" onClick={() => setMobileSheet(null)} aria-label="Close troubleshooting panel"><X size={17} /></button>
            {mobileSheet === 'scenarios' ? <><span className="sheet-eyebrow">TROUBLESHOOTING SCENARIOS</span><h3>Choose the 3D problem lab</h3>{renderScenarioButtons(true)}</> : mobileSheet === 'diagnose' ? <><span className="sheet-eyebrow">{currentScenario.code} · {currentPhase.title}</span>{renderDiagnostic()}<div className="trouble-mobile-evidence"><span className="sheet-subhead">FOCUS EVIDENCE</span><div className="sheet-chip-row trouble-mobile-evidence-buttons">{renderEvidenceButtons(true)}</div></div></> : <><span className="sheet-eyebrow">3D EXPLORATION · {currentScenario.code}</span><h3>Control the learning view</h3><p>The visual cue stays qualitative while you rotate, zoom and compare the heater geometry.</p><div className="sheet-view-grid"><button className={labels ? 'active' : ''} onClick={() => setLabels(value => !value)}><strong>Labels</strong><small>{labels ? 'Visible' : 'Hidden'}</small></button><button className={flow ? 'active' : ''} onClick={() => setFlow(value => !value)}><strong>{scenario === 'draftPressure' ? 'Flue Path' : 'Process Flow'}</strong><small>{flow ? 'Visible' : 'Hidden'}</small></button><button onClick={() => cameraAction(fitAction())}><strong>Fit Scenario</strong><small>Return camera to evidence</small></button><button onClick={() => { if (phaseIndex >= currentScenario.phases.length - 1) setPhase('normal'); setPlaying(value => !value); }}><strong>{playing ? 'Pause Tour' : 'Play Tour'}</strong><small>Automatic phase progression</small></button><button onClick={resetScenario}><strong>Reset Scenario</strong><small>Return to baseline</small></button></div></>}
          </div>
        </div>

        <aside className="radiant-tech trouble-tech">
          <div className="radiant-tech-head trouble-tech-head"><span>{currentScenario.code} · {currentScenario.title.toUpperCase()}</span><h2>{currentPhase.title}</h2><p>{currentPhase.cue}</p></div>
          {renderDiagnostic()}
          <section className="trouble-source-note"><Info size={16} /><p><b>Technical basis</b><br />{currentScenario.source}. Content is synthesized for visual training rather than reproduced as an operating procedure.</p></section>
          <section className="radiant-warning trouble-guardrail"><ShieldAlert size={17} /><p><b>Training boundary.</b> This lab teaches recognition and diagnostic context. It does not prescribe burner, fuel, air, damper, shutdown or maintenance actions. Approved site / OEM / BMS / SIS procedures and plant-specific engineering limits govern response.</p></section>
          <section className="trouble-learning-chain"><span>LEARNING CHAIN</span><div>{currentScenario.learningChain.map((item, index) => <span key={item}><b>{item}</b>{index < currentScenario.learningChain.length - 1 && <i>→</i>}</span>)}</div></section>
        </aside>
      </section>
    </main>
  );
}
