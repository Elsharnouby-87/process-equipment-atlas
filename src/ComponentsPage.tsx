import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Boxes, Flame, Layers3, Thermometer, Wind } from 'lucide-react';
import GlobalNavigation from './GlobalNavigation';
import type { NavigationTarget } from './GlobalNavigation';
import './componentsExplodedStackV4.css';

export type ComponentModuleId = 'burner' | 'radiant' | 'heatRecovery' | 'draftStack';

type Props = {
  onBack: () => void;
  onNavigate: (target: NavigationTarget) => void;
  onOpenModule: (module: ComponentModuleId) => void;
};

const modules: { id: ComponentModuleId; eyebrow: string; title: string; description: string; path: string }[] = [
  {
    id: 'burner',
    eyebrow: 'COMBUSTION SYSTEM',
    title: 'Burner Assembly',
    description: 'Study underfurnace hardware, internal burner geometry, the flame root, exploded assembly, pilot, ignition and flame-proving relationships.',
    path: 'Fuel + air → burner → flame root → radiant section',
  },
  {
    id: 'radiant',
    eyebrow: 'RADIANT SECTION',
    title: 'Radiant Tubes',
    description: 'Follow heat from the firebox to a representative vertical process pass, including supports, flame clearance, process flow and inspection cues.',
    path: 'Firebox → tube surface → tube wall → process fluid',
  },
  {
    id: 'heatRecovery',
    eyebrow: 'UPPER HEAT RECOVERY',
    title: 'Shield + Convection',
    description: 'Separate the bare shield rows from the finned convection bank and understand gas-side flow, process-side heat recovery and fouling effects.',
    path: 'Radiant outlet → shield → convection → breeching',
  },
  {
    id: 'draftStack',
    eyebrow: 'DRAFT & FLUE-GAS SYSTEM',
    title: 'Breeching + Stack',
    description: 'Read the breeching, internal damper, draft instruments, analyzers and stack as one connected pressure and flue-gas path.',
    path: 'Convection outlet → breeching → damper → stack',
  },
];

function ModuleIcon({ id }: { id: ComponentModuleId }) {
  if (id === 'burner') return <Flame size={23} />;
  if (id === 'radiant') return <Thermometer size={23} />;
  if (id === 'heatRecovery') return <Layers3 size={23} />;
  return <Wind size={23} />;
}

export default function ComponentsPage({ onBack, onNavigate, onOpenModule }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => setActiveIndex((current) => (current + 1) % modules.length), 2400);
    return () => window.clearInterval(timer);
  }, [paused]);

  const activeModule = modules[activeIndex];

  return (
    <main className="app-shell architecture-page components-hub-page">
      <header className="atlas-topbar architecture-topbar">
        <button className="back-atlas" onClick={onBack}><ArrowLeft size={16} /> Atlas</button>
        <div className="brand-lockup"><strong>FIRED HEATER <em>ATLAS</em></strong><span>DETAILED COMPONENT STUDIES</span></div>
        <GlobalNavigation active="components" onNavigate={onNavigate} />
      </header>

      <section className="architecture-contextbar">
        <div><span>COMPONENT STUDIES</span><strong>Move from whole-heater location context into dedicated system learning</strong></div>
        <p>Four detailed modules available now · More component studies can be added without changing the Atlas</p>
      </section>

      <section className="components-hub-content">
        <div className="components-hub-intro">
          <span><Boxes size={16} /> COMPONENTS · MOTION STUDY 03</span>
          <h1>Read the heater as an exploded system stack.</h1>
          <p>Each layer separates from the equipment hierarchy, becomes the active learning zone, then reconnects into the full heat and flue-gas path.</p>
        </div>

        <section
          className={`exploded-stack-v4 ${paused ? 'is-paused' : ''}`}
          onPointerEnter={() => setPaused(true)}
          onPointerLeave={() => setPaused(false)}
          aria-label="Exploded fired heater component navigator"
        >
          <div className="exploded-stack-visual">
            <div className="exploded-stack-axis" aria-hidden="true"><i /><i /></div>
            {[3, 2, 1, 0].map((moduleIndex) => {
              const module = modules[moduleIndex];
              const isActive = moduleIndex === activeIndex;
              return (
                <button
                  key={module.id}
                  className={`exploded-layer exploded-layer-${module.id} ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    if (isActive) onOpenModule(module.id);
                    else setActiveIndex(moduleIndex);
                  }}
                  aria-label={`${isActive ? 'Open' : 'Focus'} ${module.title}`}
                >
                  <span className="exploded-layer-number">0{moduleIndex + 1}</span>
                  <span className="exploded-layer-icon"><ModuleIcon id={module.id} /></span>
                  <span className="exploded-layer-copy">
                    <small>{module.eyebrow}</small>
                    <strong>{module.title}</strong>
                  </span>
                  <span className="exploded-layer-open">{isActive ? 'OPEN' : 'FOCUS'} <ArrowRight size={12} /></span>
                </button>
              );
            })}
          </div>

          <div className="exploded-stack-readout">
            <div className="exploded-stack-kicker">ACTIVE SYSTEM · 0{activeIndex + 1}</div>
            <div className="exploded-stack-title-row">
              <span className="exploded-stack-big-icon"><ModuleIcon id={activeModule.id} /></span>
              <div>
                <small>{activeModule.eyebrow}</small>
                <h2>{activeModule.title}</h2>
              </div>
            </div>
            <p>{activeModule.description}</p>
            <div className="exploded-stack-flow">{activeModule.path}</div>
            <div className="exploded-stack-dots">
              {modules.map((module, index) => (
                <button key={module.id} className={index === activeIndex ? 'active' : ''} onClick={() => setActiveIndex(index)} aria-label={`Focus ${module.title}`} />
              ))}
            </div>
            <button className="exploded-stack-cta" onClick={() => onOpenModule(activeModule.id)}>
              Open detailed study <ArrowRight size={15} />
            </button>
          </div>
        </section>

        <div className="component-module-grid exploded-stack-original-grid">
          {modules.map((module, index) => (
            <button key={module.id} className={`component-module-card module-${module.id}`} onClick={() => onOpenModule(module.id)}>
              <div className="component-module-number">0{index + 1}</div>
              <div className="component-module-icon"><ModuleIcon id={module.id} /></div>
              <span>{module.eyebrow}</span>
              <h2>{module.title}</h2>
              <p>{module.description}</p>
              <div className="component-module-path">{module.path}</div>
              <div className="component-module-action">Open detailed study <ArrowRight size={16} /></div>
            </button>
          ))}
        </div>

        <div className="components-hub-note">
          <b>EXPERIMENT ONLY</b>
          <span>The original four study cards remain below unchanged. This branch tests only a different motion/navigation language.</span>
        </div>
      </section>
    </main>
  );
}
