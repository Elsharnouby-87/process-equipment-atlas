import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, CircleDashed, Flame, Focus, Info, Layers3, ShieldAlert, ShieldCheck, Wind, X } from 'lucide-react';
import Heater3D from './Heater3D';
import GlobalNavigation from './GlobalNavigation';
import type { NavigationTarget } from './GlobalNavigation';
import type { CameraAction, CameraCommand, OperationState } from './modelTypes';

type Props = { onBack: () => void; onNavigate: (target: NavigationTarget) => void };
type MobileSheet = 'states' | 'abnormal' | 'details' | null;
type ReadinessZoneId = 'interior' | 'burners' | 'fuel' | 'draft' | 'protection';
type PurgeTopicId = 'nonFiring' | 'fuelProtection' | 'purgePath' | 'monitoring' | 'controlLogic';
type PilotOutcome = 'normal' | 'notEstablished' | 'notProven';
type FiringOutcome = 'stable' | 'unstable' | 'impingement' | 'draftAbnormal';
type WarmupView = 'early' | 'developing' | 'balanced' | 'uneven';
type NormalTopicId = 'combustion' | 'fuel' | 'draft' | 'process' | 'tubeCondition' | 'stack';
type LoadChangeView = 'steady' | 'increase' | 'decrease' | 'notStabilized';
type ShutdownView = 'stableEntry' | 'reducedHeatInput' | 'firingRemoved' | 'responseConcern';
type CooldownView = 'residualHeat' | 'coolingProgress' | 'nonFiringState' | 'unevenCooling';
type AbnormalScenarioId = 'ignition' | 'flameLoss' | 'draft' | 'hotArea';
type AbnormalPhase = 'normal' | 'abnormal' | 'outcome';
type AbnormalScenario = { id: AbnormalScenarioId; title: string; reference: string; component: string; summary: string; normal: string; abnormal: string; outcome: string; outcomeLabel: string; guardrail: string };

type StateCopy = {
  code: string;
  title: string;
  subtitle: string;
  purpose: string;
  changes: string[];
  observe: string[];
  why: string;
  gate: string;
  siteSpecific: string[];
};

const stateOrder: OperationState[] = ['safeNonFiring', 'readiness', 'processReady', 'purgeReady', 'purgeActive', 'purgeComplete', 'pilotIgnition', 'pilotProven', 'mainBurnerLightOff', 'firingStabilization', 'controlledWarmUp', 'normalOperation', 'loadChange', 'controlledShutdown', 'coolDownNonFiring'];

const stateCopy: Record<OperationState, StateCopy> = {
  safeNonFiring: {
    code: 'O-00',
    title: 'Safe Non-Firing State',
    subtitle: 'Baseline equipment state before readiness review',
    purpose: 'Establish the visual baseline: the heater exists as equipment, but no firing state or startup readiness is being assumed.',
    changes: ['Main flames absent', 'Pilot flame absent', 'Fuel-flow visualization absent', 'No hot flue-gas visualization', 'Heater shown without firing heat glow'],
    observe: ['Physical heater configuration', 'Burner hardware remains present even when not firing', 'Process and flue paths exist but are not assumed ready', 'Non-firing does not mean the equipment is cool or released for work'],
    why: 'The first training distinction is between equipment being physically present and the heater being proven ready for a startup sequence.',
    gate: 'Begin the training readiness walkdown. Progressing here means only that the learning review is starting; it does not authorize startup.',
    siteSpecific: ['Isolation and line-up status', 'Maintenance release / permit status', 'Exact BMS reset and readiness criteria', 'Applicable startup procedure and operating limits'],
  },
  readiness: {
    code: 'O-01',
    title: 'Pre-Start Readiness',
    subtitle: 'Training walkdown across five readiness zones',
    purpose: 'Review the heater, burners, fuel-system concept, draft path and protective-system concept before any purge or ignition training is introduced.',
    changes: ['No flame or fuel-flow visualization is introduced', 'The selected readiness zone receives 3D focus', 'Each zone is marked VIEWED, not verified safe', 'Ignition states remain outside this build'],
    observe: ['Condition and cleanliness of the heater interior', 'Burner / air-register hardware condition', 'Fuel-system readiness as a system responsibility', 'Clear draft / flue path and damper operability concept', 'Protective-system, permissive, interlock and flame-detection readiness concept'],
    why: 'A combustion startup sequence should not be treated as a single ignition action. Readiness is a collection of physical, process and protective-system conditions.',
    gate: 'View all five training zones before the Process-Side Ready concept unlocks. This is a learning gate, not a plant startup permissive.',
    siteSpecific: ['Fuel-train valve and blind positions', 'Leak-test / pressure-test requirements', 'BMS permissive and interlock matrix', 'Instrument proof-test requirements', 'Exact damper / register startup positions'],
  },
  processReady: {
    code: 'O-02',
    title: 'Process-Side Ready',
    subtitle: 'Representative process-flow readiness concept',
    purpose: 'Show that process-side circulation / flow readiness is established conceptually before heat is added to the coil.',
    changes: ['Representative process-fluid path becomes visible in cyan', 'Main and pilot flames remain absent', 'Fuel and hot flue-gas visualization remain absent', 'The full heater stays visible so process flow is understood in equipment context'],
    observe: ['Flow through the process-tube system as a concept', 'Pass-flow indication and stability where applicable', 'Process instrumentation availability', 'No assumption that a displayed animation equals a verified plant flow'],
    why: 'Process-side readiness is treated as its own state before moving into purge-related training.',
    gate: 'Continue only to the Purge Readiness learning state. No purge is started by this control and no plant permissive is being asserted.',
    siteSpecific: ['Minimum / required process flow', 'Pass-by-pass filling or circulation method', 'Controller modes and valve positions', 'Process pressure / temperature limits', 'Actions for unstable or lost process flow'],
  },
  purgeReady: {
    code: 'O-03',
    title: 'Purge Ready',
    subtitle: 'Review the conditions that make purge meaningful',
    purpose: 'Separate process-side readiness from purge eligibility by reviewing the non-firing state, fuel-admission protection concept, purge path, monitoring and BMS / procedure authority.',
    changes: ['Process-fluid path remains visible in cyan', 'No purge-medium animation is active yet', 'Main and pilot flames remain absent', 'Five purge-readiness topics become available for training review'],
    observe: ['No active firing state', 'Fuel admission is treated as a protected system responsibility', 'A continuous route exists through firebox, upper heater, breeching and stack', 'Draft / airflow monitoring concept is available', 'Actual BMS and approved procedure determine whether purge is permitted'],
    why: 'Purge is not simply an animation or timer. It is meaningful only when the actual system has the required preconditions and a valid path for the approved purge medium.',
    gate: 'View all five purge-readiness topics to unlock the Purge Active learning state. This training gate does not verify a real purge permissive.',
    siteSpecific: ['Approved purge medium and route', 'Safety-shutoff valve / line-up requirements', 'Fan, steam or other purge-system conditions', 'Actual BMS purge permissives', 'Required airflow, volume changes, duration and damper / register positions'],
  },
  purgeActive: {
    code: 'O-04',
    title: 'Purge Active',
    subtitle: 'Representative enclosure sweep with no firing',
    purpose: 'Visualize a purge-active state in which the approved purge medium sweeps through the heater enclosure toward discharge while firing remains absent.',
    changes: ['Light-blue purge-medium particles move through the heater to the stack', 'Cyan process-fluid path remains separate', 'Main and pilot flames remain absent', 'Fuel and hot-products visualizations remain absent', 'No timer or completion percentage is shown'],
    observe: ['Continuous qualitative path through the firebox and upper heater', 'Clear distinction between process fluid and purge medium', 'No flame during the purge-active training state', 'Draft / airflow indication as a monitoring concept', 'Completion is not inferred from visual animation duration'],
    why: 'The training objective is to understand that purge removes or dilutes a potential combustible atmosphere before an ignition sequence can become eligible.',
    gate: 'The next button only opens the Purge Completion learning concept. Actual purge completion must come from the approved BMS / procedure criteria, not from this animation or elapsed time.',
    siteSpecific: ['Purge medium and supply arrangement', 'Minimum purge airflow or flow proof', 'Required air changes / enclosure volumes', 'Purge duration', 'Damper / register positions', 'BMS completion logic and trip response'],
  },
  purgeComplete: {
    code: 'O-05',
    title: 'Purge Complete / Ignition Eligible',
    subtitle: 'Completion concept only — ignition has not started',
    purpose: 'Represent the conceptual state that exists only after the real system has accepted purge completion and any required pre-ignition conditions. No ignition action is performed here.',
    changes: ['Purge route remains as a dim static reference instead of an active sweep', 'Process-fluid path remains visible', 'Pilot and main flames remain absent', 'No ignition source is activated', 'Pilot ignition becomes the next training concept only'],
    observe: ['Purge completion is a verified system / procedure status, not a visual judgement', 'Ignition eligibility is not the same as ignition start', 'Pilot remains off in this state', 'Any additional pre-ignition checks are design and BMS specific'],
    why: 'Keeping purge completion separate from pilot ignition prevents the training sequence from implying that finishing purge automatically causes fuel admission or ignition.',
    gate: 'Continue only to the Pilot Ignition learning state. This control does not command an igniter, open a valve or authorize a field action.',
    siteSpecific: ['Exact purge-complete logic', 'Post-purge transition requirements', 'Pilot / igniter permissives', 'Trial-for-ignition timing', 'Retry / lockout philosophy', 'Flame-proving method and timing'],
  },
  pilotIgnition: {
    code: 'O-06',
    title: 'Pilot Ignition',
    subtitle: 'Representative pilot-lighting concept — main burner remains off',
    purpose: 'Separate the ignition source, the small pilot flame and flame-detection function so the user understands that these are different parts of the combustion-safety sequence.',
    changes: ['Camera moves to a generic pilot / ignition micro-view', 'Representative ignition-source spark becomes visible', 'A small pilot flame is shown', 'Main burner flames remain absent', 'Purge timer, valve timing, retry count and fuel-pressure values remain intentionally absent'],
    observe: ['Ignition source is not the same thing as a proven flame', 'Pilot flame is intentionally much smaller than a main burner flame', 'Flame-detection hardware is shown as a separate function', 'Main burner light-off remains outside this build'],
    why: 'An ignition attempt and a successfully established pilot are not equivalent to flame proving. The training model therefore keeps the pilot event separate from the accepted-proving state.',
    gate: 'Open the Pilot Proven learning state only as the next concept. Actual trial-for-ignition timing, retries, isolation actions and permissives are defined by the approved BMS / OEM / site procedure.',
    siteSpecific: ['Pilot fuel arrangement and pressure', 'Igniter type and energization logic', 'Trial-for-ignition time', 'Retry / lockout philosophy', 'Pilot flame-detector technology and positioning'],
  },
  pilotProven: {
    code: 'O-07',
    title: 'Pilot Proven',
    subtitle: 'Flame-proving concept accepted — main burner remains locked until the next learning state',
    purpose: 'Teach the distinction between seeing a pilot flame and the combustion-safety system accepting the required flame-proving condition.',
    changes: ['Pilot remains visible in the normal training branch', 'Flame-proving indicator becomes a separate accepted-state cue', 'Main burner flames remain absent', 'Failure branches demonstrate that the sequence does not progress'],
    observe: ['Flame present does not automatically mean flame proven', 'A not-established pilot has no stable pilot flame', 'A not-proven branch can show flame present without an accepted proving state', 'Only the normal proven training branch can continue to the Main Burner Light-Off concept'],
    why: 'Keeping flame proving as its own state prevents the training model from implying that visual flame appearance alone authorizes progression to main firing.',
    gate: 'Continue only from the normal Pilot Proven training branch. Failure branches are blocked learning branches and the sequence does not progress. Actual main-burner permissives and light-off logic are governed by the approved BMS / OEM / site procedure.',
    siteSpecific: ['Flame-detector technology and coverage', 'Proving threshold and timing', 'Scanner voting / logic where applicable', 'Loss-of-flame response', 'Reset, retry and lockout philosophy'],
  },
  mainBurnerLightOff: {
    code: 'O-08',
    title: 'Main Burner Light-Off',
    subtitle: 'Representative main-flame establishment concept',
    purpose: 'Show the conceptual transition from a proven pilot state to an established main burner flame without prescribing valve actions, firing order or timing.',
    changes: ['One representative main burner flame becomes established inside the firebox', 'Other main burners remain visually off in this learning state so no universal firing order is implied', 'Cyan process-fluid tube / pass flow remains visible', 'Representative hot combustion products begin moving upward through the heater', 'No valve sequence, fuel pressure or light-off timer is provided'],
    observe: ['Main flame remains inside the firebox', 'Main flame is clearly larger than the earlier pilot flame', 'Process flow remains established while heat input begins', 'Flame appearance and flame-scanner acceptance are monitoring concepts rather than authorization by visual judgement alone'],
    why: 'The source material treats successful pilot ignition and stable burner flame monitoring as separate operating concerns. This state therefore visualizes main-flame establishment without turning the training model into a startup instruction.',
    gate: 'Continue only to the Firing Stabilization learning state. The displayed transition does not prescribe which burner is lit first, a burner-by-burner sequence, valve actions or timing.',
    siteSpecific: ['Main-burner permissives and BMS sequence', 'Burner-by-burner light-off order where applicable', 'Fuel / air admission and valve timing', 'Fuel pressure and firing-rate limits', 'Main flame proving / scanner criteria'],
  },
  firingStabilization: {
    code: 'O-09',
    title: 'Firing Stabilization',
    subtitle: 'Observe flame stability, draft and tube-clearance concepts before warm-up',
    purpose: 'Teach the monitoring concepts emphasized after burner light-off: stable burner flames, flame-scanner response, acceptable flame shape, draft awareness and keeping flames clear of heater tubes.',
    changes: ['Representative main burner flames are visible across the firing floor in the normal branch', 'Process-fluid path remains visible in cyan', 'Hot combustion products remain qualitatively visible', 'Training branches demonstrate unstable flame, impingement concern and abnormal draft awareness', 'No warm-up rate or firing-rate setpoint is introduced'],
    observe: ['Flame stability and shape', 'Flame-scanner stability as a protective-system concept', 'Flames remain inside the firebox and clear of heater tubes', 'Draft / airflow condition remains part of firing stability', 'Actual acceptable flame appearance depends on burner, fuel and OEM design'],
    why: 'The source calls for monitoring burner flame stability, scanner indication and operating indicators after light-off, and separately warns against flame impingement and abnormal draft conditions.',
    gate: 'Only the Stable Firing training branch can continue to Controlled Warm-Up. Abnormal branches are BLOCKED · DO NOT PROGRESS and do not provide corrective operating instructions.',
    siteSpecific: ['Acceptable flame pattern / color for the installed burner and fuel', 'Scanner thresholds and voting logic', 'Draft / oxygen operating targets', 'Fuel / air adjustment method', 'Firing-rate ramp and warm-up requirements'],
  },
  controlledWarmUp: {
    code: 'O-10',
    title: 'Controlled Warm-Up',
    subtitle: 'Qualitative thermal progression with no generic temperature or time target',
    purpose: 'Teach the principle that heat input and heater thermal response are developed gradually while firing stability, process circulation and equipment condition continue to be monitored.',
    changes: ['Stable main firing remains visible inside the firebox', 'Cyan process-fluid flow remains visible through the tube passes', 'Orange hot-products flow remains visible through the heater', 'Qualitative thermal glow can be viewed as Early, Developing or Balanced response', 'Uneven Heating Concern demonstrates a non-accepted thermal pattern without prescribing corrective action'],
    observe: ['Stable flame pattern continues during warm-up', 'Process flow remains an essential cooling and heat-removal path', 'Refractory and tube thermal response develops progressively as a concept', 'Furnace / process temperatures and other operating indicators require monitoring', 'Uneven or unexpected thermal response requires the real procedure and operating team to determine the response'],
    why: 'The source emphasizes gradual heating to reduce thermal-shock risk and gradual firing increase with temperature monitoring. This training state preserves those principles without converting the source example into a universal warm-up rate.',
    gate: 'Only the Balanced Warm-Up learning view can continue to Normal Operation. Early / Developing views are not completion criteria, and Uneven Heating Concern remains a blocked awareness branch.',
    siteSpecific: ['Approved warm-up curve / firing ramp', 'Temperature targets, hold points and allowable rates', 'Tube-metal and refractory limits', 'Required process flow during warm-up', 'Fuel / air, draft and oxygen targets', 'Criteria for completing warm-up and entering normal operation'],
  },
  normalOperation: {
    code: 'O-11',
    title: 'Normal Operation',
    subtitle: 'Monitor the heater as an integrated combustion, process and heat-transfer system',
    purpose: 'Teach the continuous monitoring picture during normal heater service: burner flames, fuel / firing input, combustion air and draft, process response, tube condition and flue / stack indications must be considered together.',
    changes: ['Stable firing and balanced qualitative thermal response remain visible', 'Cyan process-fluid flow and orange hot-products flow remain active', 'Six monitoring topics can be reviewed individually in the 3D model', 'No displayed indication is presented as a universal operating target'],
    observe: ['Burner flame / scanner stability', 'Fuel flow as a heat-input indicator linked to process requirements', 'Combustion-air and draft condition', 'Process outlet temperature and process-flow response', 'Tube skin / hot-area condition as an integrity-awareness concept', 'Flue-gas / stack temperature and emissions-related indications'],
    why: 'The source describes normal operation as close monitoring of burner flames, furnace temperature, air pressure and fuel flow, and separately lists process outlet, tube-skin, draft and flue / stack indications as important operating readings.',
    gate: 'Review all six monitoring topics before the Load Change learning state unlocks. VIEWED means the monitoring relationship was studied; it does not mean the real heater is within its approved operating envelope.',
    siteSpecific: ['Normal operating ranges and alarm / trip limits', 'Fuel pressure and flow targets', 'Combustion-air, oxygen and draft targets', 'Process outlet temperature / pass-flow requirements', 'Tube-metal temperature limits and inspection criteria', 'Stack / emissions limits and monitoring requirements'],
  },
  loadChange: {
    code: 'O-12',
    title: 'Load Change',
    subtitle: 'Qualitative coordinated response to changing process heat demand',
    purpose: 'Show that a change in process heat demand requires a coordinated operating response while flame stability, process response, draft / air condition, tube condition and flue indications continue to be monitored.',
    changes: ['Stable Baseline, Higher Heat Demand and Lower Heat Demand are qualitative training views', 'Flame size, firebox glow and hot-products activity change only as visual concepts', 'Process flow remains visible as a required monitored heat-removal path', 'Response Not Stabilized demonstrates a blocked learning state without providing a corrective control action'],
    observe: ['Process demand and heater heat input are related', 'Fuel / firing input and combustion-air response are coordinated by the actual control / operating strategy', 'Flame pattern must remain acceptable through the transition', 'Process outlet and tube / furnace thermal response must be monitored', 'Draft, flue and stack indications remain part of the operating picture', 'A response that does not stabilize requires site procedure and operating judgement'],
    why: 'The source states that fuel-gas flow is directly related to heater heat release and is adjusted according to process requirements, while normal operation continues to monitor flame, temperature, air and fuel-flow conditions.',
    gate: 'Return to the Stable Baseline learning view before entering Controlled Shutdown. A response that is not stabilized remains blocked from progression; the training model does not prescribe how to stabilize it.',
    siteSpecific: ['Control-loop architecture and controller modes', 'Permitted load-change rate / ramp limits', 'Fuel / air coordination and burner-staging logic', 'Process-flow and outlet-temperature constraints', 'Draft / oxygen response requirements', 'Tube-metal, bridgewall, stack and emissions limits'],
  },
  controlledShutdown: {
    code: 'O-13',
    title: 'Controlled Shutdown',
    subtitle: 'Qualitative reduction of heat input before transition to non-firing',
    purpose: 'Teach the controlled-shutdown principle: reduce heat input progressively while continuing to monitor combustion, process response, draft / air condition and heater thermal response, then recognize a separate non-firing transition.',
    changes: ['Stable Entry, Reduced Heat Input and Firing Removed are qualitative learning views', 'Main-flame size and firebox heat cues reduce without displaying a firing-rate value or ramp', 'Cyan process-fluid flow remains visible as a monitored process-side concept during the firing-reduction views and is removed from the Firing Removed view', 'Response Concern demonstrates a blocked concern view without providing corrective control actions', 'Firing Removed is a training state only and does not prescribe burner order, valve actions or isolation sequence'],
    observe: ['Flame stability remains important while firing is being reduced', 'Process response and heat-removal path remain part of the operating picture', 'Draft / air and flue indications continue to require monitoring', 'Tube / refractory thermal response should change without an assumed universal cool-down rate', 'Actual burner shutdown, fuel isolation and ventilation sequence belong to the approved site / OEM procedure'],
    why: 'The supplied source describes gradual firing reduction to allow slower cooling and reduce sudden refractory thermal stress, then separately describes burner shutdown, fuel isolation and later ventilation shutdown. The training model keeps those as principles rather than a universal operating sequence.',
    gate: 'Only the Firing Removed Concept can continue to O-14 Cool-Down / Non-Firing. No displayed view confirms a real safe temperature, fuel isolation, purge status or shutdown completion.',
    siteSpecific: ['Shutdown permissives and controller modes', 'Permitted firing-reduction rate', 'Burner shutdown / fuel-isolation sequence', 'Process circulation and product-disposition requirements', 'Draft / air / ventilation requirements during shutdown', 'Temperature criteria and conditions for entering the cool-down phase'],
  },
  coolDownNonFiring: {
    code: 'O-14',
    title: 'Cool-Down / Non-Firing',
    subtitle: 'Residual-heat awareness after combustion has been removed',
    purpose: 'Show that a non-firing heater can still contain substantial residual heat and must continue to be treated according to the approved cool-down, ventilation, process and maintenance-release requirements.',
    changes: ['Main and pilot flames remain absent', 'Orange hot-combustion-product animation is absent', 'Residual thermal glow decreases qualitatively across the cooling views', 'No active process-flow animation is used so the training model does not imply a universal post-shutdown circulation requirement', 'Uneven Cooling Concern shows asymmetric residual heat as a procedure-review awareness state'],
    observe: ['Non-firing does not mean cold', 'Residual heat can remain in tubes, refractory and heater structure', 'Ventilation / draft and process-side status remain design- and procedure-specific', 'A visually cooler heater is not automatically maintenance-released', 'Post-shutdown draining, isolation, inspection and maintenance belong to separate approved procedures'],
    why: 'The supplied source places later actions such as ventilation shutdown and post-shutdown maintenance after sufficient cooling. This state therefore emphasizes residual heat and status awareness without inventing a universal time, temperature threshold or isolation sequence.',
    gate: 'The normal O-00 → O-14 journey ends here. The Non-Firing Equipment State is not a maintenance-release state and does not authorize entry, isolation removal or work. Abnormal-condition awareness is studied separately in the Abnormal Awareness Lab.',
    siteSpecific: ['Cool-down curve and minimum hold times', 'Process circulation / draining / depressurization requirements', 'Ventilation / draft shutdown criteria', 'Fuel isolation and blind requirements', 'Entry / maintenance release and permit criteria', 'Post-shutdown inspection and maintenance scope'],
  },
};

const readinessZones: { id: ReadinessZoneId; title: string; component: string; body: string }[] = [
  { id: 'interior', title: 'Heater Interior', component: 'Refractory', body: 'Review firebox condition, tubes, refractory, supports, openings and the concept of checking for debris or obstruction.' },
  { id: 'burners', title: 'Burner System', component: 'Burners', body: 'Review burner installation, tip / throat condition, air-register movement and pilot / ignition hardware as equipment-readiness concepts.' },
  { id: 'fuel', title: 'Fuel System', component: 'Burners', body: 'Review fuel-system readiness as a protected system responsibility. No valve opening, pressure value or line-up instruction is provided here.' },
  { id: 'draft', title: 'Draft / Flue Path', component: 'Breeching', body: 'Review the continuous path through radiant outlet, upper heat-recovery section, breeching, damper region and stack.' },
  { id: 'protection', title: 'Protective System', component: 'Burners', body: 'Review the role of permissives, interlocks, trips and flame detection. Exact BMS logic is intentionally not simulated.' },
];

const purgeTopics: { id: PurgeTopicId; title: string; component: string; body: string }[] = [
  { id: 'nonFiring', title: 'Non-Firing Condition', component: 'Burners', body: 'Confirm the training model remains non-firing: no pilot, no main flame and no fuel-flow visualization. This is a visual state, not field verification.' },
  { id: 'fuelProtection', title: 'Fuel Admission Protection', component: 'Burners', body: 'Study the principle that unintended fuel admission must be prevented during purge. Exact safety-shutoff valve arrangement and proof logic are site / BMS specific.' },
  { id: 'purgePath', title: 'Continuous Purge Path', component: 'Breeching', body: 'Review the enclosure route from the lower heater through radiant, shield, convection, breeching and stack. The approved purge medium and actual route may differ by design.' },
  { id: 'monitoring', title: 'Draft / Airflow Monitoring', component: 'Stack Damper', body: 'Study the need for valid airflow / draft information where the design requires it. No target, alarm value or damper position is supplied.' },
  { id: 'controlLogic', title: 'BMS / Procedure Authority', component: 'Casing & Structure', body: 'The real BMS and approved site procedure determine whether purge conditions are satisfied and when a purge sequence may proceed.' },
];

const normalTopics: { id: NormalTopicId; title: string; component: string; body: string }[] = [
  { id: 'combustion', title: 'Burner Flame / Scanner', component: 'Burners', body: 'Monitor flame stability and appearance together with the flame-scanner indication. The installed burner, fuel and OEM documentation define acceptable characteristics.' },
  { id: 'fuel', title: 'Fuel / Firing Input', component: 'Burners', body: 'Fuel supply and fuel-flow indications relate to combustion and heater heat release. Actual targets and adjustments are determined by the process demand and approved control strategy.' },
  { id: 'draft', title: 'Combustion Air / Draft', component: 'Breeching', body: 'Monitor air and draft as part of stable combustion and flue-gas movement. No generic oxygen, pressure or damper target is provided.' },
  { id: 'process', title: 'Process Response', component: 'Radiant Tubes', body: 'Monitor process flow and outlet-temperature response as the heater transfers heat to the process. Actual required values and pass balance are service-specific.' },
  { id: 'tubeCondition', title: 'Tube / Hot-Area Condition', component: 'Radiant Tubes', body: 'Tube-skin and visible hot-area condition are integrity-awareness indicators. Limits, measurement practice and response criteria are plant-specific.' },
  { id: 'stack', title: 'Flue / Stack Indications', component: 'Stack', body: 'Flue-gas and stack indications help reveal heat-transfer and combustion performance, while emissions monitoring requirements depend on the site and jurisdiction.' },
];

const abnormalScenarios: AbnormalScenario[] = [
  { id: 'ignition', title: 'Ignition Not Established', reference: 'Linked learning view · O-06', component: 'Burners', summary: 'Compare an established pilot view with a pilot-not-established visual cue.', normal: 'Representative pilot flame is visible with the ignition-source cue.', abnormal: 'The ignition-source cue remains visible while the representative pilot flame is absent.', outcome: 'The training sequence is shown as blocked and the model returns to a non-firing awareness view.', outcomeLabel: 'SEQUENCE BLOCKED', guardrail: 'Status awareness only. Exact protective logic is site / OEM / BMS specific.' },
  { id: 'flameLoss', title: 'Flame Loss', reference: 'Linked learning view · O-11', component: 'Burners', summary: 'See a representative firing view change when one visible burner flame is no longer present.', normal: 'Stable representative firing is visible.', abnormal: 'The representative hero-burner flame disappears while the rest of the heater remains visible.', outcome: 'Firing is absent in the protected / non-firing awareness view.', outcomeLabel: 'PROTECTED / NON-FIRING STATE', guardrail: 'Visual recognition only. Exact protective-system logic is not simulated.' },
  { id: 'draft', title: 'Draft Pressure Concern', reference: 'Linked learning view · O-09 / O-11', component: 'Breeching', summary: 'Compare the normal inward pressure tendency with an outward positive-pressure hazard cue.', normal: 'Blue arrows show the qualitative inward pressure tendency.', abnormal: 'Orange arrows show an outward hot-gas tendency as a positive-pressure concern.', outcome: 'The outward pressure cue remains visible as an unacceptable-condition awareness view.', outcomeLabel: 'UNACCEPTABLE CONDITION', guardrail: 'No numeric draft target or control setting is shown.' },
  { id: 'hotArea', title: 'Local Hot-Area Concern', reference: 'Linked learning view · O-11', component: 'Radiant Tubes', summary: 'Compare a normal tube-condition view with a visible local hot-area marker.', normal: 'Radiant tubes are shown without a local abnormal marker.', abnormal: 'A bright local marker appears on a representative radiant tube.', outcome: 'The local concern remains highlighted as a condition requiring investigation under approved site practice.', outcomeLabel: 'INVESTIGATION REQUIRED', guardrail: 'No temperature limit, severity rating or corrective action is provided.' },
];

export default function OperationPage({ onBack, onNavigate }: Props) {
  const [state, setState] = useState<OperationState>('safeNonFiring');
  const [unlockedIndex, setUnlockedIndex] = useState(0);
  const [activeZone, setActiveZone] = useState<ReadinessZoneId>('interior');
  const [reviewedZones, setReviewedZones] = useState<ReadinessZoneId[]>([]);
  const [activePurgeTopic, setActivePurgeTopic] = useState<PurgeTopicId>('nonFiring');
  const [reviewedPurgeTopics, setReviewedPurgeTopics] = useState<PurgeTopicId[]>([]);
  const [pilotOutcome, setPilotOutcome] = useState<PilotOutcome>('normal');
  const [firingOutcome, setFiringOutcome] = useState<FiringOutcome>('stable');
  const [warmupView, setWarmupView] = useState<WarmupView>('early');
  const [activeNormalTopic, setActiveNormalTopic] = useState<NormalTopicId>('combustion');
  const [reviewedNormalTopics, setReviewedNormalTopics] = useState<NormalTopicId[]>([]);
  const [loadChangeView, setLoadChangeView] = useState<LoadChangeView>('steady');
  const [shutdownView, setShutdownView] = useState<ShutdownView>('stableEntry');
  const [cooldownView, setCooldownView] = useState<CooldownView>('residualHeat');
  const [abnormalLabOpen, setAbnormalLabOpen] = useState(false);
  const [abnormalScenarioId, setAbnormalScenarioId] = useState<AbnormalScenarioId>('ignition');
  const [abnormalPhase, setAbnormalPhase] = useState<AbnormalPhase>('normal');
  const [mobileSheet, setMobileSheet] = useState<MobileSheet>(null);
  const mobileStateStripRef = useRef<HTMLDivElement>(null);
  const [cameraCommand, setCameraCommand] = useState<CameraCommand>({ id: 1, action: 'fitHeater', component: 'Casing & Structure' });
  const noSelect = useCallback(() => {}, []);
  const currentIndex = stateOrder.indexOf(state);
  const copy = stateCopy[state];
  const zone = readinessZones.find(item => item.id === activeZone) ?? readinessZones[0];
  const purgeTopic = purgeTopics.find(item => item.id === activePurgeTopic) ?? purgeTopics[0];
  const normalTopic = normalTopics.find(item => item.id === activeNormalTopic) ?? normalTopics[0];
  const allZonesViewed = reviewedZones.length === readinessZones.length;
  const allPurgeTopicsViewed = reviewedPurgeTopics.length === purgeTopics.length;
  const allNormalTopicsViewed = reviewedNormalTopics.length === normalTopics.length;
  const pilotState = state === 'pilotIgnition' || state === 'pilotProven';
  const warmupState = state === 'controlledWarmUp';
  const normalState = state === 'normalOperation';
  const loadState = state === 'loadChange';
  const shutdownState = state === 'controlledShutdown';
  const cooldownState = state === 'coolDownNonFiring';
  const firingState = state === 'mainBurnerLightOff' || state === 'firingStabilization' || warmupState || normalState || loadState || shutdownState;
  const selected = state === 'readiness' ? zone.component : state === 'purgeReady' ? purgeTopic.component : normalState ? normalTopic.component : state === 'processReady' || warmupState || cooldownState ? 'Radiant Tubes' : pilotState || firingState ? 'Burners' : 'Casing & Structure';
  const contextMode = state === 'readiness' || state === 'purgeReady' || pilotState ? 'focus' : 'full';
  const processFlowVisible = ['processReady', 'purgeReady', 'purgeActive', 'purgeComplete', 'mainBurnerLightOff', 'firingStabilization', 'controlledWarmUp', 'normalOperation', 'loadChange'].includes(state) || (state === 'controlledShutdown' && shutdownView !== 'firingRemoved');
  const purgePathVisible = state === 'purgeActive' || state === 'purgeComplete';
  const hotProductsVisible = firingState && !(shutdownState && shutdownView === 'firingRemoved');
  const flowVisible = processFlowVisible || purgePathVisible || hotProductsVisible;
  const operationFocus = state === 'readiness' ? activeZone : state === 'purgeReady' ? activePurgeTopic : state === 'processReady' ? 'process' : state === 'purgeActive' ? 'purgeActive' : state === 'purgeComplete' ? 'purgeComplete' : state === 'pilotIgnition' ? 'pilotIgnition' : state === 'pilotProven' ? (pilotOutcome === 'notEstablished' ? 'pilotNotEstablished' : pilotOutcome === 'notProven' ? 'pilotNotProven' : 'pilotProven') : state === 'mainBurnerLightOff' ? 'mainBurnerLightOff' : state === 'firingStabilization' ? (firingOutcome === 'unstable' ? 'firingUnstable' : firingOutcome === 'impingement' ? 'firingImpingement' : firingOutcome === 'draftAbnormal' ? 'firingDraftAbnormal' : 'firingStable') : state === 'controlledWarmUp' ? (warmupView === 'early' ? 'warmupEarly' : warmupView === 'developing' ? 'warmupDeveloping' : warmupView === 'uneven' ? 'warmupUneven' : 'warmupBalanced') : state === 'normalOperation' ? `normal${activeNormalTopic.charAt(0).toUpperCase()}${activeNormalTopic.slice(1)}` : state === 'loadChange' ? (loadChangeView === 'increase' ? 'loadIncrease' : loadChangeView === 'decrease' ? 'loadDecrease' : loadChangeView === 'notStabilized' ? 'loadNotStabilized' : 'loadSteady') : state === 'controlledShutdown' ? (shutdownView === 'reducedHeatInput' ? 'shutdownReduced' : shutdownView === 'firingRemoved' ? 'shutdownFiringRemoved' : shutdownView === 'responseConcern' ? 'shutdownConcern' : 'shutdownStable') : state === 'coolDownNonFiring' ? (cooldownView === 'coolingProgress' ? 'cooldownProgress' : cooldownView === 'nonFiringState' ? 'cooldownNonFiring' : cooldownView === 'unevenCooling' ? 'cooldownUneven' : 'cooldownResidual') : 'overview';
  const abnormalScenario = abnormalScenarios.find(item => item.id === abnormalScenarioId) ?? abnormalScenarios[0];
  const abnormalMessage = abnormalScenario[abnormalPhase];
  const abnormalPhaseLabel = abnormalPhase === 'normal' ? 'NORMAL' : abnormalPhase === 'abnormal' ? 'ABNORMAL' : abnormalScenario.outcomeLabel;
  const effectiveOperationState: OperationState = !abnormalLabOpen ? state : abnormalScenarioId === 'ignition' ? (abnormalPhase === 'outcome' ? 'safeNonFiring' : 'pilotIgnition') : abnormalScenarioId === 'flameLoss' ? (abnormalPhase === 'outcome' ? 'controlledShutdown' : 'normalOperation') : abnormalScenarioId === 'draft' ? (abnormalPhase === 'normal' ? 'normalOperation' : 'firingStabilization') : 'normalOperation';
  const effectiveOperationFocus = !abnormalLabOpen ? operationFocus : abnormalScenarioId === 'ignition' ? (abnormalPhase === 'normal' ? 'pilotIgnition' : abnormalPhase === 'abnormal' ? 'pilotNotEstablished' : 'overview') : abnormalScenarioId === 'flameLoss' ? (abnormalPhase === 'normal' ? 'normalCombustion' : abnormalPhase === 'abnormal' ? 'abnormalFlameLoss' : 'shutdownFiringRemoved') : abnormalScenarioId === 'draft' ? (abnormalPhase === 'normal' ? 'normalDraft' : 'firingDraftAbnormal') : abnormalPhase === 'normal' ? 'normalTubeCondition' : 'abnormalHotArea';
  const effectiveSelected = abnormalLabOpen ? abnormalScenario.component : selected;
  const effectiveContextMode = abnormalLabOpen && abnormalScenarioId === 'ignition' ? 'focus' : contextMode;
  const effectiveFlowVisible = abnormalLabOpen ? abnormalScenarioId !== 'ignition' && !(abnormalScenarioId === 'flameLoss' && abnormalPhase === 'outcome') : flowVisible;
  const effectiveBurnerStudyMode = abnormalLabOpen && abnormalScenarioId === 'ignition' && abnormalPhase !== 'outcome' ? 'pilot' : pilotState ? 'pilot' : null;
  const abnormalRadiantStudyMode = abnormalLabOpen && abnormalScenarioId === 'hotArea' && abnormalPhase !== 'normal' ? 'inspection' : null;
  const abnormalRadiantScenario = abnormalLabOpen && abnormalScenarioId === 'hotArea' && abnormalPhase !== 'normal' ? 'hotspot' : 'normal';
  const abnormalDraftStudyMode = abnormalLabOpen && abnormalScenarioId === 'draft' ? 'pressure' : null;
  const abnormalDraftPressureScenario = abnormalLabOpen && abnormalScenarioId === 'draft' && abnormalPhase !== 'normal' ? 'positive' : 'negative';

  const issueCamera = useCallback((action: CameraAction, component: string) => {
    setCameraCommand(current => ({ id: current.id + 1, action, component }));
  }, []);

  useEffect(() => {
    if (abnormalLabOpen) {
      if (abnormalScenarioId === 'ignition') issueCamera('burnerPilot', 'Burners');
      else if (abnormalScenarioId === 'flameLoss') issueCamera('focusComponent', 'Burners');
      else if (abnormalScenarioId === 'draft') issueCamera('fitHeater', 'Breeching');
      else issueCamera('focusComponent', 'Radiant Tubes');
      return;
    }
    if (state === 'safeNonFiring') issueCamera('fitHeater', 'Casing & Structure');
    else if (state === 'readiness') issueCamera('focusComponent', zone.component);
    else if (state === 'purgeReady') issueCamera('focusComponent', purgeTopic.component);
    else if (state === 'pilotIgnition' || state === 'pilotProven') issueCamera('burnerPilot', 'Burners');
    else if (state === 'mainBurnerLightOff') issueCamera('focusComponent', 'Burners');
    else if (state === 'firingStabilization') issueCamera('fitHeater', 'Burners');
    else if (state === 'controlledWarmUp') issueCamera('fitHeater', 'Radiant Tubes');
    else if (state === 'normalOperation') issueCamera('focusComponent', normalTopic.component);
    else if (state === 'loadChange' || state === 'controlledShutdown') issueCamera('fitHeater', 'Burners');
    else if (state === 'coolDownNonFiring') issueCamera('fitHeater', 'Radiant Tubes');
    else issueCamera('fitHeater', selected);
  }, [state, zone.component, purgeTopic.component, normalTopic.component, selected, abnormalLabOpen, abnormalScenarioId, abnormalPhase, issueCamera]);

  const selectZone = (id: ReadinessZoneId) => {
    const nextZone = readinessZones.find(item => item.id === id) ?? readinessZones[0];
    setActiveZone(id);
    setReviewedZones(current => current.includes(id) ? current : [...current, id]);
    issueCamera('focusComponent', nextZone.component);
  };

  const selectPurgeTopic = (id: PurgeTopicId) => {
    const nextTopic = purgeTopics.find(item => item.id === id) ?? purgeTopics[0];
    setActivePurgeTopic(id);
    setReviewedPurgeTopics(current => current.includes(id) ? current : [...current, id]);
    issueCamera('focusComponent', nextTopic.component);
  };

  const selectNormalTopic = (id: NormalTopicId) => {
    const nextTopic = normalTopics.find(item => item.id === id) ?? normalTopics[0];
    setActiveNormalTopic(id);
    setReviewedNormalTopics(current => current.includes(id) ? current : [...current, id]);
    issueCamera('focusComponent', nextTopic.component);
  };

  const selectAbnormalScenario = (id: AbnormalScenarioId) => {
    setAbnormalScenarioId(id);
    setAbnormalPhase('normal');
  };

  const goToState = (target: OperationState) => {
    const targetIndex = stateOrder.indexOf(target);
    if (targetIndex > unlockedIndex) return;
    setState(target);
    setMobileSheet(null);
  };

  const advance = () => {
    if (state === 'safeNonFiring') {
      setUnlockedIndex(current => Math.max(current, 1));
      setState('readiness');
      return;
    }
    if (state === 'readiness' && allZonesViewed) {
      setUnlockedIndex(current => Math.max(current, 2));
      setState('processReady');
      return;
    }
    if (state === 'processReady') {
      setUnlockedIndex(current => Math.max(current, 3));
      setState('purgeReady');
      return;
    }
    if (state === 'purgeReady' && allPurgeTopicsViewed) {
      setUnlockedIndex(current => Math.max(current, 4));
      setState('purgeActive');
      return;
    }
    if (state === 'purgeActive') {
      setUnlockedIndex(current => Math.max(current, 5));
      setState('purgeComplete');
      return;
    }
    if (state === 'purgeComplete') {
      setUnlockedIndex(current => Math.max(current, 6));
      setPilotOutcome('normal');
      setState('pilotIgnition');
      return;
    }
    if (state === 'pilotIgnition') {
      setUnlockedIndex(current => Math.max(current, 7));
      setPilotOutcome('normal');
      setState('pilotProven');
      return;
    }
    if (state === 'pilotProven' && pilotOutcome === 'normal') {
      setUnlockedIndex(current => Math.max(current, 8));
      setState('mainBurnerLightOff');
      return;
    }
    if (state === 'mainBurnerLightOff') {
      setUnlockedIndex(current => Math.max(current, 9));
      setFiringOutcome('stable');
      setState('firingStabilization');
      return;
    }
    if (state === 'firingStabilization' && firingOutcome === 'stable') {
      setUnlockedIndex(current => Math.max(current, 10));
      setWarmupView('early');
      setState('controlledWarmUp');
      return;
    }
    if (state === 'controlledWarmUp' && warmupView === 'balanced') {
      setUnlockedIndex(current => Math.max(current, 11));
      setActiveNormalTopic('combustion');
      setReviewedNormalTopics([]);
      setState('normalOperation');
      return;
    }
    if (state === 'normalOperation' && allNormalTopicsViewed) {
      setUnlockedIndex(current => Math.max(current, 12));
      setLoadChangeView('steady');
      setState('loadChange');
      return;
    }
    if (state === 'loadChange' && loadChangeView === 'steady') {
      setUnlockedIndex(current => Math.max(current, 13));
      setShutdownView('stableEntry');
      setState('controlledShutdown');
      return;
    }
    if (state === 'controlledShutdown' && shutdownView === 'firingRemoved') {
      setUnlockedIndex(current => Math.max(current, 14));
      setCooldownView('residualHeat');
      setState('coolDownNonFiring');
    }
  };

  const previous = () => {
    if (currentIndex > 0) setState(stateOrder[currentIndex - 1]);
  };

  const advanceDisabled = (state === 'readiness' && !allZonesViewed) || (state === 'purgeReady' && !allPurgeTopicsViewed) || (state === 'pilotProven' && pilotOutcome !== 'normal') || (state === 'firingStabilization' && firingOutcome !== 'stable') || (state === 'controlledWarmUp' && warmupView !== 'balanced') || (state === 'normalOperation' && !allNormalTopicsViewed) || (state === 'loadChange' && loadChangeView !== 'steady') || (state === 'controlledShutdown' && shutdownView !== 'firingRemoved');
  const advanceLabels: Partial<Record<OperationState, string>> = {
    safeNonFiring: 'Begin Readiness Review',
    readiness: 'Continue to Process-Side Concept',
    processReady: 'Continue to Purge Readiness',
    purgeReady: 'Study Purge-Active State',
    purgeActive: 'View Purge Completion Concept',
    purgeComplete: 'Study Pilot Ignition',
    pilotIgnition: 'Study Pilot-Proven State',
    pilotProven: 'Study Main Burner Light-Off',
    mainBurnerLightOff: 'Study Firing Stabilization',
    firingStabilization: 'Study Controlled Warm-Up',
    controlledWarmUp: 'Enter Normal Operation Monitoring',
    normalOperation: 'Study Load Change',
    loadChange: 'Study Controlled Shutdown',
    controlledShutdown: 'Study Cool-Down / Non-Firing',
  };
  const advanceLabel = advanceLabels[state] ?? 'Continue';
  const badgeText: Record<OperationState, string> = {
    safeNonFiring: 'NON-FIRING · NO FLAME / FUEL-FLOW VISUAL',
    readiness: `READINESS WALKDOWN · ${reviewedZones.length}/${readinessZones.length} ZONES VIEWED`,
    processReady: 'PROCESS-SIDE CONCEPT · REPRESENTATIVE CYAN FLOW',
    purgeReady: `PURGE READINESS · ${reviewedPurgeTopics.length}/${purgeTopics.length} TOPICS VIEWED`,
    purgeActive: 'PURGE ACTIVE CONCEPT · NO TIMER / NO FIRING',
    purgeComplete: 'PURGE COMPLETION CONCEPT · IGNITION NOT STARTED',
    pilotIgnition: 'PILOT IGNITION CONCEPT · MAIN BURNER OFF',
    pilotProven: pilotOutcome === 'normal' ? 'PILOT PROVEN CONCEPT · MAIN BURNER ELIGIBLE FOR NEXT LEARNING STATE' : pilotOutcome === 'notEstablished' ? 'PILOT NOT ESTABLISHED · SEQUENCE DOES NOT PROGRESS' : 'PILOT NOT PROVEN · SEQUENCE DOES NOT PROGRESS',
    mainBurnerLightOff: 'MAIN BURNER LIGHT-OFF CONCEPT · REPRESENTATIVE MAIN FLAME',
    firingStabilization: firingOutcome === 'stable' ? 'FIRING STABILIZED · TRAINING ACCEPTED' : firingOutcome === 'unstable' ? 'UNSTABLE FLAME · BLOCKED · DO NOT PROGRESS' : firingOutcome === 'impingement' ? 'IMPINGEMENT CONCERN · BLOCKED · DO NOT PROGRESS' : 'DRAFT ABNORMAL · BLOCKED · DO NOT PROGRESS',
    controlledWarmUp: warmupView === 'uneven' ? 'THERMAL RESPONSE CONCERN · BLOCKED · DO NOT PROGRESS' : warmupView === 'early' ? 'CONTROLLED WARM-UP · EARLY THERMAL RESPONSE · QUALITATIVE' : warmupView === 'developing' ? 'CONTROLLED WARM-UP · DEVELOPING THERMAL RESPONSE · QUALITATIVE' : 'CONTROLLED WARM-UP · BALANCED THERMAL RESPONSE · QUALITATIVE',
    normalOperation: `NORMAL OPERATION · ${reviewedNormalTopics.length}/${normalTopics.length} MONITORING TOPICS VIEWED`,
    loadChange: loadChangeView === 'notStabilized' ? 'LOAD RESPONSE NOT STABILIZED · BLOCKED' : loadChangeView === 'increase' ? 'HIGHER HEAT DEMAND · QUALITATIVE RESPONSE' : loadChangeView === 'decrease' ? 'LOWER HEAT DEMAND · QUALITATIVE RESPONSE' : 'LOAD CHANGE · STABLE BASELINE',
    controlledShutdown: shutdownView === 'responseConcern' ? 'SHUTDOWN RESPONSE CONCERN · BLOCKED' : shutdownView === 'firingRemoved' ? 'FIRING REMOVED CONCEPT · NON-FIRING TRANSITION ELIGIBLE' : shutdownView === 'reducedHeatInput' ? 'CONTROLLED SHUTDOWN · REDUCED HEAT INPUT · QUALITATIVE' : 'CONTROLLED SHUTDOWN · STABLE ENTRY',
    coolDownNonFiring: cooldownView === 'unevenCooling' ? 'UNEQUAL RESIDUAL-HEAT CONCERN · PROCEDURE REVIEW' : cooldownView === 'nonFiringState' ? 'NON-FIRING EQUIPMENT STATE · NOT MAINTENANCE RELEASE' : cooldownView === 'coolingProgress' ? 'COOL-DOWN · QUALITATIVE THERMAL RESPONSE' : 'COOL-DOWN · RESIDUAL HEAT PRESENT',
  };
  const badgeIcon = state === 'mainBurnerLightOff' || state === 'firingStabilization' || state === 'controlledWarmUp' || state === 'loadChange' || state === 'controlledShutdown' ? <Flame size={14} /> : state === 'readiness' || state === 'pilotIgnition' ? <Focus size={14} /> : state === 'processReady' ? <Layers3 size={14} /> : state === 'purgeActive' || state === 'purgeComplete' ? <Wind size={14} /> : state === 'pilotProven' && pilotOutcome === 'normal' ? <CheckCircle2 size={14} /> : <ShieldCheck size={14} />;

  useEffect(() => {
    if (mobileSheet !== 'states') return;
    const frame = window.requestAnimationFrame(() => {
      mobileStateStripRef.current?.querySelector<HTMLButtonElement>('button.active')?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [mobileSheet, state]);

  const renderMobileChecklist = (items: { id: string; title: string; body: string }[], activeId: string, reviewed: string[], onSelect: (id: string) => void, label: string) => {
    const activeIndex = Math.max(0, items.findIndex(item => item.id === activeId));
    const activeItem = items[activeIndex] ?? items[0];
    return <>
      <div className="operation-mobile-progress-head"><span>{label}</span><b>{reviewed.length} / {items.length} REVIEWED</b></div>
      <div className="operation-mobile-progress-track"><i style={{ width: `${items.length ? reviewed.length / items.length * 100 : 0}%` }} /></div>
      <div className="operation-mobile-topic-list">{items.map(item => { const viewed = reviewed.includes(item.id); return <button key={item.id} className={activeId === item.id ? 'active' : ''} onClick={() => onSelect(item.id)}><i>{viewed ? <CheckCircle2 size={16} /> : <CircleDashed size={16} />}</i><span><b>{item.title}</b><small>{viewed ? 'VIEWED · training review only' : 'Tap to study and mark viewed'}</small></span></button>; })}</div>
      <div className="operation-mobile-topic-preview"><span>CURRENT TOPIC</span><b>{activeItem.title}</b><p>{activeItem.body}</p></div>
      <div className="operation-mobile-topic-nav"><button disabled={activeIndex === 0} onClick={() => onSelect(items[activeIndex - 1].id)}><ChevronLeft size={16} /> Previous Topic</button><button disabled={activeIndex >= items.length - 1} onClick={() => onSelect(items[activeIndex + 1].id)}>Next Topic <ChevronRight size={16} /></button></div>
    </>;
  };

  const renderMobileStateControls = () => {
    if (state === 'readiness') return renderMobileChecklist(readinessZones, activeZone, reviewedZones, id => selectZone(id as ReadinessZoneId), 'READINESS ZONES');
    if (state === 'purgeReady') return renderMobileChecklist(purgeTopics, activePurgeTopic, reviewedPurgeTopics, id => selectPurgeTopic(id as PurgeTopicId), 'PURGE READINESS TOPICS');
    if (state === 'normalOperation') return renderMobileChecklist(normalTopics, activeNormalTopic, reviewedNormalTopics, id => selectNormalTopic(id as NormalTopicId), 'NORMAL OPERATION · MONITORING');
    if (state === 'pilotProven') return <><span className="sheet-subhead">PILOT OUTCOME · TRAINING BRANCH</span><div className="sheet-chip-row"><button className={pilotOutcome === 'normal' ? 'active' : ''} onClick={() => setPilotOutcome('normal')}>Proven Concept</button><button className={pilotOutcome === 'notEstablished' ? 'active danger' : ''} onClick={() => setPilotOutcome('notEstablished')}>Pilot Not Established</button><button className={pilotOutcome === 'notProven' ? 'active danger' : ''} onClick={() => setPilotOutcome('notProven')}>Pilot Not Proven</button></div></>;
    if (state === 'firingStabilization') return <><span className="sheet-subhead">FIRING CONDITION · TRAINING BRANCH</span><div className="sheet-chip-row"><button className={firingOutcome === 'stable' ? 'active' : ''} onClick={() => setFiringOutcome('stable')}>Stable Firing</button><button className={firingOutcome === 'unstable' ? 'active danger' : ''} onClick={() => setFiringOutcome('unstable')}>Unstable Flame</button><button className={firingOutcome === 'impingement' ? 'active danger' : ''} onClick={() => setFiringOutcome('impingement')}>Impingement Concern</button><button className={firingOutcome === 'draftAbnormal' ? 'active danger' : ''} onClick={() => setFiringOutcome('draftAbnormal')}>Draft Abnormal</button></div></>;
    if (state === 'controlledWarmUp') return <><span className="sheet-subhead">WARM-UP VIEW · QUALITATIVE</span><div className="sheet-chip-row"><button className={warmupView === 'early' ? 'active' : ''} onClick={() => setWarmupView('early')}>Early Response</button><button className={warmupView === 'developing' ? 'active' : ''} onClick={() => setWarmupView('developing')}>Developing</button><button className={warmupView === 'balanced' ? 'active' : ''} onClick={() => setWarmupView('balanced')}>Balanced · Required to Continue</button><button className={warmupView === 'uneven' ? 'active danger' : ''} onClick={() => setWarmupView('uneven')}>Uneven Heating Concern</button></div></>;
    if (state === 'loadChange') return <><span className="sheet-subhead">LOAD CHANGE · QUALITATIVE</span><div className="sheet-chip-row"><button className={loadChangeView === 'steady' ? 'active' : ''} onClick={() => setLoadChangeView('steady')}>Stable Baseline · Required to Continue</button><button className={loadChangeView === 'increase' ? 'active' : ''} onClick={() => setLoadChangeView('increase')}>Higher Heat Demand</button><button className={loadChangeView === 'decrease' ? 'active' : ''} onClick={() => setLoadChangeView('decrease')}>Lower Heat Demand</button><button className={loadChangeView === 'notStabilized' ? 'active danger' : ''} onClick={() => setLoadChangeView('notStabilized')}>Response Not Stabilized</button></div></>;
    if (state === 'controlledShutdown') return <><span className="sheet-subhead">CONTROLLED SHUTDOWN · QUALITATIVE</span><div className="sheet-chip-row"><button className={shutdownView === 'stableEntry' ? 'active' : ''} onClick={() => setShutdownView('stableEntry')}>Stable Entry</button><button className={shutdownView === 'reducedHeatInput' ? 'active' : ''} onClick={() => setShutdownView('reducedHeatInput')}>Reduced Heat Input</button><button className={shutdownView === 'firingRemoved' ? 'active' : ''} onClick={() => setShutdownView('firingRemoved')}>Firing Removed · Required to Continue</button><button className={shutdownView === 'responseConcern' ? 'active danger' : ''} onClick={() => setShutdownView('responseConcern')}>Response Concern</button></div></>;
    if (state === 'coolDownNonFiring') return <><span className="sheet-subhead">COOL-DOWN / NON-FIRING</span><div className="sheet-chip-row"><button className={cooldownView === 'residualHeat' ? 'active' : ''} onClick={() => setCooldownView('residualHeat')}>Residual Heat Present</button><button className={cooldownView === 'coolingProgress' ? 'active' : ''} onClick={() => setCooldownView('coolingProgress')}>Cooling Progression</button><button className={cooldownView === 'nonFiringState' ? 'active' : ''} onClick={() => setCooldownView('nonFiringState')}>Non-Firing Equipment State</button><button className={cooldownView === 'unevenCooling' ? 'active danger' : ''} onClick={() => setCooldownView('unevenCooling')}>Uneven Cooling Concern</button></div></>;
    return <div className="operation-mobile-state-note"><span>CURRENT STATE</span><p>{copy.purpose}</p></div>;
  };

  const renderAbnormalPanel = () => <>
    <div className="abnormal-panel-head"><span>ABNORMAL AWARENESS LAB</span><b>{abnormalScenario.title}</b><small>{abnormalScenario.reference}</small></div>
    <div className="abnormal-scenario-list">{abnormalScenarios.map(item => <button key={item.id} className={abnormalScenarioId === item.id ? 'active' : ''} onClick={() => selectAbnormalScenario(item.id)}><ShieldAlert size={15} /><span><b>{item.title}</b><small>{item.reference}</small></span></button>)}</div>
    <div className="abnormal-phase-strip"><button className={abnormalPhase === 'normal' ? 'active normal' : ''} onClick={() => setAbnormalPhase('normal')}>1 · NORMAL</button><button className={abnormalPhase === 'abnormal' ? 'active danger' : ''} onClick={() => setAbnormalPhase('abnormal')}>2 · ABNORMAL</button><button className={abnormalPhase === 'outcome' ? 'active outcome' : ''} onClick={() => setAbnormalPhase('outcome')}>3 · OUTCOME</button></div>
    <div className={`abnormal-current-view ${abnormalPhase}`}><span>{abnormalPhaseLabel}</span><b>{abnormalScenario.title}</b><p>{abnormalMessage}</p></div>
    <p className="abnormal-summary">{abnormalScenario.summary}</p>
    <p className="abnormal-guardrail"><ShieldCheck size={14} /> {abnormalScenario.guardrail}</p>
  </>;

  const renderAbnormalDetails = () => <>
    <div className="radiant-tech-head operation-tech-head abnormal-tech-head"><span>VISUAL ABNORMAL AWARENESS LAB</span><h2>{abnormalScenario.title}</h2><p>{abnormalScenario.summary}</p></div>
    <section className={`radiant-tech-section operation-zone-detail firing ${abnormalPhase === 'normal' ? 'proven' : 'blocked'}`}><span>CURRENT PHASE</span><h3>{abnormalPhaseLabel}</h3><p>{abnormalMessage}</p><small>{abnormalScenario.reference}</small></section>
    <section className="radiant-tech-section operation-gate"><span>TRAINING BOUNDARY</span><p>{abnormalScenario.guardrail}</p></section>
    <section className="radiant-warning operation-warning"><ShieldAlert size={17} /><p><b>Visual training awareness only.</b> The three views explain state recognition. Actual protective logic and operating response remain site-specific.</p></section>
  </>;

  const renderMobileStudyPanel = () => <>
    <div className="operation-mobile-study-head"><span className="sheet-eyebrow">GUIDED OPERATION STUDY</span><strong>{copy.code} · {copy.title}</strong><small>{copy.subtitle}</small></div>
    <div ref={mobileStateStripRef} className="operation-mobile-state-strip">{stateOrder.map((item, index) => <button key={item} disabled={index > unlockedIndex} className={state === item ? 'active' : ''} onClick={() => { if (index <= unlockedIndex) setState(item); }}><b>{stateCopy[item].code}</b></button>)}</div>
    <div className="operation-mobile-study-body">{renderMobileStateControls()}</div>
    <div className="operation-mobile-continue">{state !== 'coolDownNonFiring' ? <button className="primary" disabled={advanceDisabled} onClick={advance}>{advanceDisabled ? 'Complete Current Learning Gate' : advanceLabel} <ChevronRight size={16} /></button> : <div className="operation-mobile-end"><ShieldCheck size={16} /><span>O-14 · NORMAL JOURNEY COMPLETE · NON-FIRING IS NOT MAINTENANCE RELEASE</span></div>}</div>
  </>;

  const renderStateDetails = () => (
    <>
      <span className="sheet-eyebrow">{copy.code} · OPERATION TRAINING STATE</span>
      <h3>{copy.title}</h3>
      <p>{copy.purpose}</p>
      <span className="sheet-subhead">WHAT CHANGES</span>
      <ul>{copy.changes.map(item => <li key={item}>{item}</li>)}</ul>
      <span className="sheet-subhead">OPERATOR OBSERVES</span>
      <ul>{copy.observe.map(item => <li key={item}>{item}</li>)}</ul>
      <span className="sheet-subhead">WHY THIS STATE EXISTS</span>
      <p>{copy.why}</p>
      <span className="sheet-subhead">PROGRESSION GATE</span>
      <p>{copy.gate}</p>
      <span className="sheet-subhead">SITE / OEM / BMS SPECIFIC</span>
      <ul>{copy.siteSpecific.map(item => <li key={item}>{item}</li>)}</ul>
      <p className="sheet-note"><b>Training guardrail:</b> this module explains operating concepts and state relationships. It is not a startup procedure, operating instruction or substitute for site SOP, OEM documentation or BMS/SIS logic.</p>
    </>
  );

  return (
    <main className="app-shell operation-page">
      <header className="atlas-topbar radiant-topbar operation-topbar">
        <button className="back-atlas" onClick={onBack}><ArrowLeft size={16} /> Atlas</button>
        <div className="brand-lockup"><strong>FIRED HEATER <em>ATLAS</em></strong><span>OPERATION · TRAINING STATE ENGINE</span></div>
        <GlobalNavigation active="operation" onNavigate={onNavigate} className="radiant-nav" />
      </header>

      <section className="radiant-contextbar operation-contextbar">
        <div><span>INTERACTIVE OPERATING CONCEPTS</span><strong>Readiness → Process → Purge → Pilot → Main Light-Off → Stabilization → Warm-Up → Normal Operation → Load Change → Controlled Shutdown → Cool-Down / Non-Firing</strong></div>
        <p>Training sequence only · Site SOP + OEM + BMS/SIS documentation governs actual operation</p>
      </section>

      <section className="radiant-workspace operation-workspace">
        <aside className="radiant-left operation-left">
          <div className="radiant-title-block operation-title-block">
            <span>{abnormalLabOpen ? 'ABNORMAL AWARENESS LAB' : 'OPERATION TRAINING · O-00 → O-14'}</span>
            <h1>{abnormalLabOpen ? 'Compare the normal condition with an abnormal visual cue and the scenario-specific outcome' : 'Follow the heater from non-firing readiness through firing, operation and cool-down'}</h1>
            <p>{abnormalLabOpen ? 'Four visual scenarios are separated from the normal O-00 → O-14 journey. They teach recognition only.' : 'A state-based training journey showing what changes, what to observe and where approved site / OEM / BMS procedures govern. It is not an operating procedure.'}</p>
          </div>
          <button className={`operation-abnormal-launch ${abnormalLabOpen ? 'active' : ''}`} onClick={() => { setAbnormalLabOpen(current => !current); setAbnormalPhase('normal'); }}><ShieldAlert size={17} /><span><b>{abnormalLabOpen ? 'RETURN TO NORMAL JOURNEY' : 'OPEN ABNORMAL AWARENESS LAB'}</b><small>{abnormalLabOpen ? 'O-00 → O-14 remains unchanged' : 'Visual scenario lab'}</small></span></button>

          {!abnormalLabOpen ? <><div className="radiant-study-tabs operation-state-tabs">
            {stateOrder.map((item, index) => {
              const itemCopy = stateCopy[item];
              const locked = index > unlockedIndex;
              return <button key={item} className={`${state === item ? 'active' : ''} ${locked ? 'locked' : ''}`.trim()} disabled={locked} onClick={() => goToState(item)}><b>{itemCopy.code}</b><span><strong>{itemCopy.title}</strong><small>{locked ? 'Complete the previous training gate first' : itemCopy.subtitle}</small></span></button>;
            })}
          </div>

          {state === 'readiness' && <div className="operation-readiness-panel">
            <span>TRAINING READINESS WALKDOWN</span>
            <div className="operation-zone-list">
              {readinessZones.map(item => {
                const viewed = reviewedZones.includes(item.id);
                return <button key={item.id} className={activeZone === item.id ? 'active' : ''} onClick={() => selectZone(item.id)}><i>{viewed ? <CheckCircle2 size={15} /> : <CircleDashed size={15} />}</i><span><b>{item.title}</b><small>{viewed ? 'VIEWED · training review only' : 'Select to study this zone'}</small></span></button>;
              })}
            </div>
            <p className="operation-review-count">{reviewedZones.length} / {readinessZones.length} zones viewed · This does not represent a plant permissive.</p>
          </div>}

          {state === 'purgeReady' && <div className="operation-readiness-panel operation-purge-panel">
            <span>PURGE READINESS · TRAINING TOPICS</span>
            <div className="operation-zone-list">
              {purgeTopics.map(item => {
                const viewed = reviewedPurgeTopics.includes(item.id);
                return <button key={item.id} className={activePurgeTopic === item.id ? 'active' : ''} onClick={() => selectPurgeTopic(item.id)}><i>{viewed ? <CheckCircle2 size={15} /> : <CircleDashed size={15} />}</i><span><b>{item.title}</b><small>{viewed ? 'VIEWED · not a field verification' : 'Select to study this topic'}</small></span></button>;
              })}
            </div>
            <p className="operation-review-count">{reviewedPurgeTopics.length} / {purgeTopics.length} topics viewed · This does not establish purge permissive status.</p>
          </div>}

          {state === 'pilotProven' && <div className="operation-readiness-panel operation-pilot-panel"><span>PILOT OUTCOME · TRAINING BRANCH</span><div className="operation-pilot-options"><button className={pilotOutcome === 'normal' ? 'active proven' : ''} onClick={() => setPilotOutcome('normal')}><CheckCircle2 size={15} /><span><b>Proven Concept</b><small>Accepted-state visualization only</small></span></button><button className={pilotOutcome === 'notEstablished' ? 'active blocked' : ''} onClick={() => setPilotOutcome('notEstablished')}><CircleDashed size={15} /><span><b>Pilot Not Established</b><small>No stable pilot flame</small></span></button><button className={pilotOutcome === 'notProven' ? 'active blocked' : ''} onClick={() => setPilotOutcome('notProven')}><ShieldAlert size={15} /><span><b>Pilot Not Proven</b><small>Flame presence ≠ accepted proving</small></span></button></div><p className="operation-review-count">Failure branches are explanatory only. They do not prescribe reset, retry or relight actions.</p></div>}

          {state === 'firingStabilization' && <div className="operation-readiness-panel operation-firing-panel"><span>FIRING CONDITION · TRAINING BRANCH</span><div className="operation-pilot-options operation-firing-options"><button className={firingOutcome === 'stable' ? 'active proven' : ''} onClick={() => setFiringOutcome('stable')}><CheckCircle2 size={15} /><span><b>Stable Firing</b><small>Accepted training branch</small></span></button><button className={firingOutcome === 'unstable' ? 'active blocked' : ''} onClick={() => setFiringOutcome('unstable')}><CircleDashed size={15} /><span><b>Unstable Flame</b><small>Flame stability not accepted</small></span></button><button className={firingOutcome === 'impingement' ? 'active blocked' : ''} onClick={() => setFiringOutcome('impingement')}><ShieldAlert size={15} /><span><b>Impingement Concern</b><small>Flame approaches a tube zone</small></span></button><button className={firingOutcome === 'draftAbnormal' ? 'active blocked' : ''} onClick={() => setFiringOutcome('draftAbnormal')}><Wind size={15} /><span><b>Draft Abnormal</b><small>Draft condition not accepted</small></span></button></div><p className="operation-review-count">Abnormal branches are awareness states only. They do not prescribe burner, fuel, air or damper adjustments.</p></div>}

          {state === 'controlledWarmUp' && <div className="operation-readiness-panel operation-firing-panel"><span>WARM-UP VIEW · QUALITATIVE ONLY</span><div className="operation-pilot-options operation-firing-options"><button className={warmupView === 'early' ? 'active proven' : ''} onClick={() => setWarmupView('early')}><CircleDashed size={15} /><span><b>Early Thermal Response</b><small>Low qualitative heat glow</small></span></button><button className={warmupView === 'developing' ? 'active proven' : ''} onClick={() => setWarmupView('developing')}><Flame size={15} /><span><b>Developing Response</b><small>Increasing qualitative thermal response</small></span></button><button className={warmupView === 'balanced' ? 'active proven' : ''} onClick={() => setWarmupView('balanced')}><CheckCircle2 size={15} /><span><b>Balanced Warm-Up</b><small>Required learning view before Normal Operation</small></span></button><button className={warmupView === 'uneven' ? 'active blocked' : ''} onClick={() => setWarmupView('uneven')}><ShieldAlert size={15} /><span><b>Uneven Heating Concern</b><small>Awareness branch · not accepted</small></span></button></div><p className="operation-review-count">These are visual snapshots, not timed stages and not temperature targets. Actual warm-up follows the approved heater procedure.</p></div>}

          {state === 'normalOperation' && <div className="operation-readiness-panel"><span>NORMAL OPERATION · MONITORING MATRIX</span><div className="operation-zone-list">{normalTopics.map(item => { const viewed = reviewedNormalTopics.includes(item.id); return <button key={item.id} className={activeNormalTopic === item.id ? 'active' : ''} onClick={() => selectNormalTopic(item.id)}><i>{viewed ? <CheckCircle2 size={15} /> : <CircleDashed size={15} />}</i><span><b>{item.title}</b><small>{viewed ? 'VIEWED · monitoring concept only' : 'Select to study this monitoring area'}</small></span></button>; })}</div><p className="operation-review-count">{reviewedNormalTopics.length} / {normalTopics.length} topics viewed · No displayed topic verifies an acceptable real operating condition.</p></div>}

          {state === 'loadChange' && <div className="operation-readiness-panel operation-firing-panel"><span>LOAD CHANGE · QUALITATIVE RESPONSE</span><div className="operation-pilot-options operation-firing-options"><button className={loadChangeView === 'steady' ? 'active proven' : ''} onClick={() => setLoadChangeView('steady')}><CheckCircle2 size={15} /><span><b>Stable Baseline</b><small>Required learning view before Controlled Shutdown</small></span></button><button className={loadChangeView === 'increase' ? 'active proven' : ''} onClick={() => setLoadChangeView('increase')}><Flame size={15} /><span><b>Higher Heat Demand</b><small>Qualitative increase in heat-input response</small></span></button><button className={loadChangeView === 'decrease' ? 'active proven' : ''} onClick={() => setLoadChangeView('decrease')}><CircleDashed size={15} /><span><b>Lower Heat Demand</b><small>Qualitative decrease in heat-input response</small></span></button><button className={loadChangeView === 'notStabilized' ? 'active blocked' : ''} onClick={() => setLoadChangeView('notStabilized')}><ShieldAlert size={15} /><span><b>Response Not Stabilized</b><small>Blocked awareness branch</small></span></button></div><p className="operation-review-count">Return to Stable Baseline before studying Controlled Shutdown. No controller move, burner staging, fuel / air value or load-ramp rate is implied by these views.</p></div>}

          {state === 'controlledShutdown' && <div className="operation-readiness-panel operation-firing-panel"><span>CONTROLLED SHUTDOWN · QUALITATIVE VIEWS</span><div className="operation-pilot-options operation-firing-options"><button className={shutdownView === 'stableEntry' ? 'active proven' : ''} onClick={() => setShutdownView('stableEntry')}><CheckCircle2 size={15} /><span><b>Stable Entry</b><small>Reference condition before reduction</small></span></button><button className={shutdownView === 'reducedHeatInput' ? 'active proven' : ''} onClick={() => setShutdownView('reducedHeatInput')}><Flame size={15} /><span><b>Reduced Heat Input</b><small>Qualitative firing reduction only</small></span></button><button className={shutdownView === 'firingRemoved' ? 'active proven' : ''} onClick={() => setShutdownView('firingRemoved')}><ShieldCheck size={15} /><span><b>Firing Removed Concept</b><small>Required learning view before cool-down</small></span></button><button className={shutdownView === 'responseConcern' ? 'active blocked' : ''} onClick={() => setShutdownView('responseConcern')}><ShieldAlert size={15} /><span><b>Response Concern</b><small>Blocked · approved procedure governs response</small></span></button></div><p className="operation-review-count">These are conceptual snapshots, not a burner shutdown sequence. Fuel isolation, process circulation, ventilation and timing remain Site / OEM / SOP specific.</p></div>}

          {state === 'coolDownNonFiring' && <div className="operation-readiness-panel operation-firing-panel"><span>COOL-DOWN / NON-FIRING · RESIDUAL HEAT</span><div className="operation-pilot-options operation-firing-options"><button className={cooldownView === 'residualHeat' ? 'active proven' : ''} onClick={() => setCooldownView('residualHeat')}><Flame size={15} /><span><b>Residual Heat Present</b><small>No flame · equipment remains hot</small></span></button><button className={cooldownView === 'coolingProgress' ? 'active proven' : ''} onClick={() => setCooldownView('coolingProgress')}><CircleDashed size={15} /><span><b>Cooling Progression</b><small>Qualitative thermal decay only</small></span></button><button className={cooldownView === 'nonFiringState' ? 'active proven' : ''} onClick={() => setCooldownView('nonFiringState')}><ShieldCheck size={15} /><span><b>Non-Firing Equipment State</b><small>Not a maintenance-release state</small></span></button><button className={cooldownView === 'unevenCooling' ? 'active blocked' : ''} onClick={() => setCooldownView('unevenCooling')}><ShieldAlert size={15} /><span><b>Uneven Cooling Concern</b><small>Procedure-review awareness</small></span></button></div><p className="operation-review-count">No view represents a real elapsed time, safe temperature, ventilation shutdown criterion, isolation status or permit-to-work release.</p></div>}

          <div className="operation-principle-note"><ShieldCheck size={17} /><div><b>SAFETY ARCHITECTURE</b><p>The normal O-00 → O-14 journey remains independent from the Abnormal Awareness Lab. Non-firing still does not mean cold, isolated or maintenance-released.</p></div></div></> : <div className="abnormal-lab-panel">{renderAbnormalPanel()}</div>}
        </aside>

        <div className="radiant-viewer operation-viewer hero-viewer">
          <Heater3D mode="cutaway" selected={effectiveSelected} labels flow={effectiveFlowVisible} explode={false} contextMode={effectiveContextMode} damperPosition={18} burnerStudyMode={effectiveBurnerStudyMode} radiantStudyMode={abnormalRadiantStudyMode} radiantScenario={abnormalRadiantScenario} draftStudyMode={abnormalDraftStudyMode} draftPressureScenario={abnormalDraftPressureScenario} operationState={effectiveOperationState} operationFocus={effectiveOperationFocus} cameraCommand={cameraCommand} onSelect={noSelect} />
          <div className="viewer-kicker operation-kicker"><i /> OPERATION 3D <span>Training state visualization · Drag to rotate · Wheel / pinch to zoom</span></div>
          <div className="radiant-view-state operation-view-state"><span>{copy.code} · CURRENT TRAINING STATE</span><b>{copy.title}</b></div>

          {!abnormalLabOpen ? <div className="radiant-center-tabs operation-center-tabs">
            {stateOrder.map((item, index) => <button key={item} disabled={index > unlockedIndex} className={state === item ? 'active' : ''} onClick={() => goToState(item)}>{stateCopy[item].code}</button>)}
          </div> : <div className="abnormal-center-title"><ShieldAlert size={14} /> ABNORMAL LAB · {abnormalScenario.title}</div>}

          {abnormalLabOpen ? <div className={`operation-state-badge abnormal ${abnormalPhase}`}><ShieldAlert size={14} />{abnormalPhaseLabel} · {abnormalScenario.title}</div> : <div className={`operation-state-badge ${state}`}>{badgeIcon}{badgeText[state]}</div>}
          {abnormalLabOpen && <div className={`abnormal-visual-status ${abnormalPhase}`}><i /><span>{abnormalPhaseLabel}</span><b>{abnormalScenario.title}</b></div>}

          {!abnormalLabOpen && state === 'readiness' && <div className="operation-zone-badge"><b>{zone.title}</b><span>{zone.body}</span></div>}
          {!abnormalLabOpen && state === 'purgeReady' && <div className="operation-zone-badge purge"><b>{purgeTopic.title}</b><span>{purgeTopic.body}</span></div>}
          {!abnormalLabOpen && state === 'pilotIgnition' && <div className="operation-zone-badge pilot"><b>IGNITION SOURCE ≠ PILOT FLAME ≠ FLAME PROVING</b><span>The micro-view separates the ignition electrode, representative pilot flame and proving function. Main firing remains absent.</span></div>}
          {!abnormalLabOpen && state === 'pilotProven' && <div className={`operation-zone-badge pilot ${pilotOutcome !== 'normal' ? 'blocked' : 'proven'}`}><b>{pilotOutcome === 'normal' ? 'FLAME PROVING CONCEPT · ACCEPTED' : 'SEQUENCE DOES NOT PROGRESS'}</b><span>{pilotOutcome === 'notEstablished' ? 'The pilot is not shown as stably established.' : pilotOutcome === 'notProven' ? 'A visible pilot flame is shown without an accepted proving indication.' : 'Pilot flame and proving indication are shown as separate concepts; Main Burner becomes eligible only for the next training state.'}</span></div>}
          {!abnormalLabOpen && state === 'mainBurnerLightOff' && <div className="operation-zone-badge firing proven"><b>REPRESENTATIVE MAIN FLAME ESTABLISHED</b><span>One representative main burner is shown firing inside the firebox. This does not prescribe burner order, valve actions or timing.</span></div>}
          {!abnormalLabOpen && state === 'firingStabilization' && <div className={`operation-zone-badge firing ${firingOutcome === 'stable' ? 'proven' : 'blocked'}`}><b>{firingOutcome === 'stable' ? 'STABLE FIRING · TRAINING ACCEPTED' : 'BLOCKED · DO NOT PROGRESS'}</b><span>{firingOutcome === 'unstable' ? 'Flame stability is not accepted.' : firingOutcome === 'impingement' ? 'A representative flame approaches the tube zone to illustrate impingement concern.' : firingOutcome === 'draftAbnormal' ? 'Draft condition is represented as abnormal; no target or damper action is provided.' : 'Flame pattern, scanner concept, draft awareness and tube clearance are shown as monitoring concepts.'}</span></div>}
          {!abnormalLabOpen && state === 'controlledWarmUp' && <div className={`operation-zone-badge firing ${warmupView === 'uneven' ? 'blocked' : 'proven'}`}><b>{warmupView === 'uneven' ? 'THERMAL RESPONSE CONCERN · BLOCKED' : 'CONTROLLED WARM-UP · QUALITATIVE THERMAL VIEW'}</b><span>{warmupView === 'early' ? 'Early thermal response: heat glow is intentionally limited and qualitative.' : warmupView === 'developing' ? 'Developing response: the model increases thermal glow without implying a time or temperature rate.' : warmupView === 'balanced' ? 'Balanced response: the model shows a more even qualitative thermal condition.' : 'Uneven response: asymmetric heat cues illustrate a condition that requires real procedure-based evaluation.'}</span></div>}
          {!abnormalLabOpen && state === 'normalOperation' && <div className="operation-zone-badge firing proven"><b>{normalTopic.title}</b><span>{normalTopic.body}</span></div>}
          {!abnormalLabOpen && state === 'loadChange' && <div className={`operation-zone-badge firing ${loadChangeView === 'notStabilized' ? 'blocked' : 'proven'}`}><b>{loadChangeView === 'notStabilized' ? 'RESPONSE NOT STABILIZED · BLOCKED' : loadChangeView === 'increase' ? 'HIGHER HEAT DEMAND · QUALITATIVE' : loadChangeView === 'decrease' ? 'LOWER HEAT DEMAND · QUALITATIVE' : 'STABLE BASELINE'}</b><span>{loadChangeView === 'increase' ? 'Heat-input response is shown increasing qualitatively while the same monitoring responsibilities remain active.' : loadChangeView === 'decrease' ? 'Heat-input response is shown decreasing qualitatively while flame and process stability remain monitored.' : loadChangeView === 'notStabilized' ? 'The visual response remains unsettled; no corrective control action is prescribed.' : 'Reference condition before studying a change in process heat demand.'}</span></div>}
          {!abnormalLabOpen && state === 'controlledShutdown' && <div className={`operation-zone-badge firing ${shutdownView === 'responseConcern' ? 'blocked' : 'proven'}`}><b>{shutdownView === 'responseConcern' ? 'SHUTDOWN RESPONSE CONCERN · BLOCKED' : shutdownView === 'firingRemoved' ? 'FIRING REMOVED CONCEPT' : shutdownView === 'reducedHeatInput' ? 'REDUCED HEAT INPUT · QUALITATIVE' : 'STABLE SHUTDOWN ENTRY'}</b><span>{shutdownView === 'stableEntry' ? 'Stable operating reference before the shutdown learning sequence begins.' : shutdownView === 'reducedHeatInput' ? 'Flame and heat cues reduce qualitatively without implying a rate, target or burner sequence.' : shutdownView === 'firingRemoved' ? 'Main flames are absent in this training view; actual fuel isolation and shutdown completion criteria are not asserted.' : 'Thermal / firing response is shown unsettled; approved site procedure governs evaluation and response.'}</span></div>}
          {!abnormalLabOpen && state === 'coolDownNonFiring' && <div className={`operation-zone-badge firing ${cooldownView === 'unevenCooling' ? 'blocked' : 'proven'}`}><b>{cooldownView === 'unevenCooling' ? 'UNEQUAL RESIDUAL-HEAT CONCERN' : cooldownView === 'nonFiringState' ? 'NON-FIRING · NOT MAINTENANCE RELEASE' : cooldownView === 'coolingProgress' ? 'COOLING PROGRESSION · QUALITATIVE' : 'RESIDUAL HEAT PRESENT'}</b><span>{cooldownView === 'residualHeat' ? 'Combustion is absent while residual heat remains visible in the heater.' : cooldownView === 'coolingProgress' ? 'Thermal glow reduces qualitatively without representing elapsed time or a temperature target.' : cooldownView === 'nonFiringState' ? 'The heater is non-firing, but this does not establish cool, isolated, gas-free or work-ready status.' : 'Asymmetric residual heat is shown as a procedure-review concern; no corrective action is prescribed.'}</span></div>}
          {!abnormalLabOpen && processFlowVisible && <div className="radiant-flow-legend operation-flow-legend"><span className="process">PROCESS FLUID · REPRESENTATIVE TUBE / PASS FLOW</span>{purgePathVisible && <span className="purge">{state === 'purgeActive' ? 'PURGE MEDIUM · REPRESENTATIVE SWEEP' : 'PURGE PATH · COMPLETION CONCEPT'}</span>}{hotProductsVisible && <span className="hot">HOT PRODUCTS · REPRESENTATIVE PATH</span>}</div>}

          {!abnormalLabOpen ? <div className="operation-step-controls">
            <button onClick={previous} disabled={currentIndex === 0}><ChevronLeft size={16} /> Previous</button>
            <div><small>STEP {currentIndex + 1} OF {stateOrder.length}</small><strong>{copy.code}</strong></div>
            {state !== 'coolDownNonFiring' ? <button className="primary" onClick={advance} disabled={advanceDisabled}>{advanceLabel} <ChevronRight size={16} /></button> : <button disabled>NORMAL JOURNEY ENDS HERE · ABNORMAL LAB IS SEPARATE</button>}
          </div> : <div className="abnormal-phase-controls"><button className={abnormalPhase === 'normal' ? 'active normal' : ''} onClick={() => setAbnormalPhase('normal')}>NORMAL</button><button className={abnormalPhase === 'abnormal' ? 'active danger' : ''} onClick={() => setAbnormalPhase('abnormal')}>ABNORMAL</button><button className={abnormalPhase === 'outcome' ? 'active outcome' : ''} onClick={() => setAbnormalPhase('outcome')}>OUTCOME</button></div>}

          <div className="study-mobile-actions operation-mobile-actions"><button onClick={() => { setAbnormalLabOpen(false); setMobileSheet('states'); }}><Layers3 size={17} /> Study</button><button className={abnormalLabOpen ? 'active danger' : ''} onClick={() => { setAbnormalLabOpen(true); setAbnormalPhase('normal'); setMobileSheet('abnormal'); }}><ShieldAlert size={17} /> Abnormal</button><button onClick={() => setMobileSheet('details')}><Info size={17} /> Details</button></div>
          <div className={`study-mobile-sheet operation-mobile-sheet ${mobileSheet ? 'open' : ''}`}>
            <button className="study-mobile-close" onClick={() => setMobileSheet(null)} aria-label="Close mobile operation panel"><X size={17} /></button>
            {mobileSheet === 'states' ? renderMobileStudyPanel() : mobileSheet === 'abnormal' ? renderAbnormalPanel() : abnormalLabOpen ? renderAbnormalDetails() : renderStateDetails()}
          </div>
          <div className="radiant-mobile-summary operation-mobile-summary"><ShieldCheck size={17} /><span>{abnormalLabOpen ? `ABNORMAL LAB · ${abnormalScenario.title} · ${abnormalPhaseLabel}` : `${copy.code} · ${copy.title}`}</span></div>
        </div>

        <aside className="radiant-tech operation-tech">
          {abnormalLabOpen ? renderAbnormalDetails() : <><div className="radiant-tech-head operation-tech-head"><span>{copy.code} · OPERATION TRAINING STATE</span><h2>{copy.title}</h2><p>{copy.purpose}</p></div>
          <section className="radiant-tech-section"><span>WHAT CHANGES</span><ul>{copy.changes.map(item => <li key={item}>{item}</li>)}</ul></section>
          <section className="radiant-tech-section"><span>OPERATOR OBSERVES</span><ul>{copy.observe.map(item => <li key={item}>{item}</li>)}</ul></section>
          <section className="radiant-tech-section"><span>WHY THIS STATE EXISTS</span><p>{copy.why}</p></section>
          {state === 'readiness' && <section className="radiant-tech-section operation-zone-detail"><span>CURRENT WALKDOWN ZONE</span><h3>{zone.title}</h3><p>{zone.body}</p><small>VIEWED means this training topic was opened. It does not mean field readiness has been verified.</small></section>}
          {state === 'purgeReady' && <section className="radiant-tech-section operation-zone-detail purge"><span>CURRENT PURGE-READINESS TOPIC</span><h3>{purgeTopic.title}</h3><p>{purgeTopic.body}</p><small>VIEWED means the concept was studied. It does not establish a real purge permissive.</small></section>}
          {state === 'pilotIgnition' && <section className="radiant-tech-section operation-zone-detail pilot"><span>PILOT MICRO-VIEW</span><h3>Three different concepts</h3><p>Ignition source initiates the attempt; the pilot flame is the combustion result; flame detection / proving is the protective-system acceptance concept.</p><small>Generic training representation. Actual pilot, igniter and detector geometry varies by burner / OEM.</small></section>}
          {state === 'pilotProven' && <section className={`radiant-tech-section operation-zone-detail pilot ${pilotOutcome !== 'normal' ? 'blocked' : 'proven'}`}><span>TRAINING OUTCOME</span><h3>{pilotOutcome === 'normal' ? 'Pilot Proven Concept' : pilotOutcome === 'notEstablished' ? 'Pilot Not Established' : 'Pilot Not Proven'}</h3><p>{pilotOutcome === 'normal' ? 'The model shows a pilot flame and a separate accepted proving cue. Only this normal training branch can continue to the Main Burner Light-Off concept.' : pilotOutcome === 'notEstablished' ? 'No stable pilot flame is represented, so the training sequence does not progress.' : 'A pilot flame may be visible, but the proving cue is withheld. The training sequence does not progress.'}</p><small>No retry, reset, valve action or relight instruction is provided.</small></section>}
          {state === 'mainBurnerLightOff' && <section className="radiant-tech-section operation-zone-detail firing proven"><span>MAIN-FLAME ESTABLISHMENT CONCEPT</span><h3>Representative burner only</h3><p>The 3D model shows one representative main burner flame established inside the firebox while process flow and hot-product paths remain visible.</p><small>No burner order, valve sequence, fuel pressure, fuel / air setting or ignition timing is prescribed.</small></section>}
          {state === 'firingStabilization' && <section className={`radiant-tech-section operation-zone-detail firing ${firingOutcome === 'stable' ? 'proven' : 'blocked'}`}><span>FIRING CONDITION</span><h3>{firingOutcome === 'stable' ? 'Stable Firing' : firingOutcome === 'unstable' ? 'Unstable Flame' : firingOutcome === 'impingement' ? 'Impingement Concern' : 'Draft Abnormal'}</h3><p>{firingOutcome === 'stable' ? 'The training model shows a stable representative firing pattern with flames inside the firebox and clear of the radiant tubes.' : firingOutcome === 'unstable' ? 'Flame motion is exaggerated to represent a stability concern. The learning sequence remains blocked from progression.' : firingOutcome === 'impingement' ? 'A representative burner flame is biased toward the tube zone to demonstrate why flame-to-tube contact is an unacceptable concern.' : 'Flame motion is disturbed to represent an abnormal draft-awareness condition. No draft target or corrective damper action is provided.'}</p><small>Abnormal branches are awareness only. Actual diagnosis and response belong to approved site / OEM / BMS procedures.</small></section>}
          {state === 'controlledWarmUp' && <section className={`radiant-tech-section operation-zone-detail firing ${warmupView === 'uneven' ? 'blocked' : 'proven'}`}><span>QUALITATIVE THERMAL RESPONSE</span><h3>{warmupView === 'early' ? 'Early Thermal Response' : warmupView === 'developing' ? 'Developing Response' : warmupView === 'balanced' ? 'Balanced Warm-Up' : 'Uneven Heating Concern'}</h3><p>{warmupView === 'early' ? 'The model shows limited thermal glow while stable firing and process circulation continue.' : warmupView === 'developing' ? 'Thermal glow increases qualitatively to show developing heat response without representing elapsed time or a temperature ramp.' : warmupView === 'balanced' ? 'The heater is shown with a more even qualitative thermal response across the firing enclosure while process flow remains visible.' : 'Asymmetric heat cues represent an uneven thermal-response concern. The model intentionally provides no diagnosis, firing change or corrective action.'}</p><small>No displayed stage corresponds to a real temperature, hold time, ramp rate or completion criterion.</small></section>}
          {state === 'normalOperation' && <section className="radiant-tech-section operation-zone-detail firing proven"><span>CURRENT MONITORING AREA</span><h3>{normalTopic.title}</h3><p>{normalTopic.body}</p><small>VIEWED means this monitoring relationship was studied. It does not verify a real operating limit or condition.</small></section>}
          {state === 'loadChange' && <section className={`radiant-tech-section operation-zone-detail firing ${loadChangeView === 'notStabilized' ? 'blocked' : 'proven'}`}><span>LOAD-RESPONSE VIEW</span><h3>{loadChangeView === 'increase' ? 'Higher Heat Demand' : loadChangeView === 'decrease' ? 'Lower Heat Demand' : loadChangeView === 'notStabilized' ? 'Response Not Stabilized' : 'Stable Baseline'}</h3><p>{loadChangeView === 'increase' ? 'The 3D view increases flame / thermal intensity qualitatively to represent a higher heat-demand response while monitoring responsibilities remain unchanged.' : loadChangeView === 'decrease' ? 'The 3D view reduces flame / thermal intensity qualitatively to represent a lower heat-demand response while maintaining stable-combustion awareness.' : loadChangeView === 'notStabilized' ? 'Flame and heat cues are intentionally unsettled to represent a response that has not stabilized. No controller, fuel, air or damper action is supplied.' : 'A stable reference condition is shown before the training user compares load-change responses.'}</p><small>These views are not tied to a load percentage, firing rate, controller output, fuel flow, air flow, temperature or ramp rate.</small></section>}
          {state === 'controlledShutdown' && <section className={`radiant-tech-section operation-zone-detail firing ${shutdownView === 'responseConcern' ? 'blocked' : 'proven'}`}><span>CONTROLLED-SHUTDOWN VIEW</span><h3>{shutdownView === 'stableEntry' ? 'Stable Entry' : shutdownView === 'reducedHeatInput' ? 'Reduced Heat Input' : shutdownView === 'firingRemoved' ? 'Firing Removed Concept' : 'Response Concern'}</h3><p>{shutdownView === 'stableEntry' ? 'The heater is shown at a stable reference condition before the training model begins reducing heat input.' : shutdownView === 'reducedHeatInput' ? 'Main flames, firebox glow and hot-products activity reduce qualitatively while the process path remains visible.' : shutdownView === 'firingRemoved' ? 'Main flames and active hot-products animation are removed. This does not assert fuel isolation, burner shutdown order, purge completion or a real safe temperature.' : 'Firing / thermal cues are shown unsettled to represent a shutdown-response concern. The model intentionally supplies no control or valve action.'}</p><small>No displayed view defines a burner order, fuel-valve sequence, firing-rate ramp, process-flow requirement, draft target, oxygen target, temperature threshold or ventilation action.</small></section>}
          {state === 'coolDownNonFiring' && <section className={`radiant-tech-section operation-zone-detail firing ${cooldownView === 'unevenCooling' ? 'blocked' : 'proven'}`}><span>RESIDUAL-HEAT VIEW</span><h3>{cooldownView === 'residualHeat' ? 'Residual Heat Present' : cooldownView === 'coolingProgress' ? 'Cooling Progression' : cooldownView === 'nonFiringState' ? 'Non-Firing Equipment State' : 'Uneven Cooling Concern'}</h3><p>{cooldownView === 'residualHeat' ? 'No flame is present, but the model retains significant tube / refractory heat glow to emphasize residual energy.' : cooldownView === 'coolingProgress' ? 'Residual thermal glow falls qualitatively without representing elapsed time or an approved cool-down curve.' : cooldownView === 'nonFiringState' ? 'The heater is visually non-firing with lower residual glow. This does not mean isolated, gas-free, cool enough for entry or maintenance-released.' : 'Asymmetric residual heat is shown as an awareness concern. Actual evaluation and response belong to the approved site procedure.'}</p><small>Post-shutdown ventilation, process handling, draining, isolation, entry and maintenance-release criteria are intentionally not simulated.</small></section>}
          <section className="radiant-tech-section operation-gate"><span>PROGRESSION GATE</span><p>{copy.gate}</p></section>
          <section className="radiant-tech-section"><span>SITE / OEM / BMS SPECIFIC</span><ul>{copy.siteSpecific.map(item => <li key={item}>{item}</li>)}</ul></section>
          <section className="radiant-warning operation-warning"><ShieldAlert size={17} /><p><b>Training model — not an operating procedure.</b> No displayed state, animation, completion badge or button authorizes equipment operation. Actual purge, startup and shutdown are governed by the approved site SOP, OEM burner/heater documentation and BMS/SIS logic.</p></section></>}
        </aside>
      </section>
    </main>
  );
}
