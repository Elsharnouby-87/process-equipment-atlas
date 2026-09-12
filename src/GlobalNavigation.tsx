import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Activity, BookOpen, Boxes, ChevronRight, Menu, Shapes, TriangleAlert, X } from 'lucide-react';

export type NavigationTarget = 'atlas' | 'components' | 'heaterTypes' | 'operation' | 'troubleshooting';

type Props = {
  active: NavigationTarget;
  onNavigate: (target: NavigationTarget) => void;
  className?: string;
};

const navigationItems: { id: NavigationTarget; label: string; description: string; available: boolean }[] = [
  { id: 'atlas', label: 'ATLAS', description: 'Master 3D fired-heater reference', available: true },
  { id: 'components', label: 'COMPONENTS', description: 'Detailed equipment study modules', available: true },
  { id: 'heaterTypes', label: 'HEATER TYPES', description: 'Box, Cabin and Vertical Cylindrical', available: true },
  { id: 'operation', label: 'OPERATION', description: 'Safety-grounded operating state journey', available: true },
  { id: 'troubleshooting', label: 'TROUBLESHOOTING', description: 'Interactive 3D diagnostic learning', available: true },
];

function NavigationIcon({ target }: { target: NavigationTarget }) {
  if (target === 'atlas') return <BookOpen size={18} />;
  if (target === 'components') return <Boxes size={18} />;
  if (target === 'heaterTypes') return <Shapes size={18} />;
  if (target === 'operation') return <Activity size={18} />;
  return <TriangleAlert size={18} />;
}

export default function GlobalNavigation({ active, onNavigate, className = '' }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const sheetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!mobileOpen) return;
    sheetRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [mobileOpen]);

  const activate = (target: NavigationTarget, available: boolean) => {
    if (!available) return;
    setMobileOpen(false);
    if (target !== active) onNavigate(target);
  };

  const mobileNavigation = createPortal(
    <>
      <button className="global-mobile-trigger" onClick={() => setMobileOpen(true)} aria-label="Open global navigation" aria-expanded={mobileOpen}>
        <Menu size={20} />
      </button>

      <button className={`global-mobile-backdrop ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(false)} aria-label="Close global navigation" tabIndex={mobileOpen ? 0 : -1} />

      <section ref={sheetRef} className={`global-mobile-sheet ${mobileOpen ? 'open' : ''}`} role="dialog" aria-modal="true" aria-label="Explore Fired Heater Atlas">
        <div className="global-mobile-sheet-head">
          <div><span>EXPLORE</span><strong>Fired Heater Atlas</strong></div>
          <button onClick={() => setMobileOpen(false)} aria-label="Close explore menu"><X size={19} /></button>
        </div>
        <div className="global-mobile-nav-list">
          {navigationItems.map(item => (
            <button key={item.id} className={`${active === item.id ? 'active' : ''} ${!item.available ? 'coming-soon' : ''}`.trim()} disabled={!item.available} onClick={() => activate(item.id, item.available)}>
              <i><NavigationIcon target={item.id} /></i>
              <span><b>{item.label}</b><small>{item.description}</small></span>
              {item.available ? <ChevronRight size={17} /> : <em>COMING SOON</em>}
            </button>
          ))}
        </div>
        <p className="global-mobile-nav-note">Global navigation stays available across every study module. Detailed 3D controls remain inside each module.</p>
      </section>
    </>,
    document.body
  );

  return (
    <>
      <nav className={`primary-nav ${className}`.trim()} aria-label="Primary navigation">
        {navigationItems.map(item => (
          <button key={item.id} className={active === item.id ? 'active' : ''} disabled={!item.available} onClick={() => activate(item.id, item.available)} title={item.available ? item.description : `${item.label} · Coming soon`}>
            {item.label}
          </button>
        ))}
      </nav>
      {mobileNavigation}
    </>
  );
}
