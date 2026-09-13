import fs from 'node:fs';

function replaceOnce(source, before, after, label) {
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly one anchor, found ${count}`);
  return source.replace(before, after);
}

// CHECKPOINT 22 — Navigation Architecture Cleanup
// Pure information-architecture / presentation refactor.
// Do not change the physics kernel or Heater3D geometry / animation logic.

// 1) Global navigation: add a dedicated SIMULATOR destination.
const navPath = 'src/GlobalNavigation.tsx';
let nav = fs.readFileSync(navPath, 'utf8');

nav = replaceOnce(
  nav,
  "import { Activity, BookOpen, Boxes, ChevronRight, Menu, Shapes, TriangleAlert, X } from 'lucide-react';",
  "import { Activity, BookOpen, Boxes, ChevronRight, Gauge, Menu, Shapes, TriangleAlert, X } from 'lucide-react';",
  'global nav Gauge import',
);

nav = replaceOnce(
  nav,
  "export type NavigationTarget = 'atlas' | 'components' | 'heaterTypes' | 'operation' | 'troubleshooting';",
  "export type NavigationTarget = 'atlas' | 'components' | 'simulator' | 'heaterTypes' | 'operation' | 'troubleshooting';",
  'global nav simulator target',
);

nav = replaceOnce(
  nav,
  "  { id: 'components', label: 'COMPONENTS', description: 'Detailed equipment study modules', available: true },\n  { id: 'heaterTypes', label: 'HEATER TYPES', description: 'Box, Cabin and Vertical Cylindrical', available: true },",
  "  { id: 'components', label: 'COMPONENTS', description: 'Detailed equipment study modules', available: true },\n  { id: 'simulator', label: 'SIMULATOR', description: 'Coupled combustion and natural-draft training', available: true },\n  { id: 'heaterTypes', label: 'HEATER TYPES', description: 'Box, Cabin and Vertical Cylindrical', available: true },",
  'global nav simulator item',
);

nav = replaceOnce(
  nav,
  "  if (target === 'components') return <Boxes size={18} />;\n  if (target === 'heaterTypes') return <Shapes size={18} />;",
  "  if (target === 'components') return <Boxes size={18} />;\n  if (target === 'simulator') return <Gauge size={18} />;\n  if (target === 'heaterTypes') return <Shapes size={18} />;",
  'global nav simulator icon',
);

fs.writeFileSync(navPath, nav);

// 2) App routing: COMPONENTS becomes a landing page; SIMULATOR becomes an independent module.
const appPath = 'src/App.tsx';
let app = fs.readFileSync(appPath, 'utf8');

app = replaceOnce(
  app,
  "import TroubleshootingPage from './TroubleshootingPage';\nimport GlobalNavigation from './GlobalNavigation';",
  "import TroubleshootingPage from './TroubleshootingPage';\nimport ComponentsPage from './ComponentsPage';\nimport SimulatorPage from './SimulatorPage';\nimport GlobalNavigation from './GlobalNavigation';",
  'App architecture page imports',
);

app = replaceOnce(
  app,
  "import type { CameraAction, CameraCommand, ContextMode, ViewMode } from './modelTypes';",
  "import type { CameraAction, CameraCommand, ContextMode, ViewMode } from './modelTypes';\nimport './navigationArchitecture.css';",
  'App navigation architecture styles',
);

app = replaceOnce(
  app,
  "const [activeModule, setActiveModule] = useState<'atlas' | 'burner' | 'radiant' | 'heatRecovery' | 'draftStack' | 'heaterTypes' | 'operation' | 'troubleshooting'>('atlas');",
  "const [activeModule, setActiveModule] = useState<'atlas' | 'componentsHub' | 'simulator' | 'burner' | 'radiant' | 'heatRecovery' | 'draftStack' | 'heaterTypes' | 'operation' | 'troubleshooting'>('atlas');",
  'App active module union',
);

const navigationBlock = /  const navigateGlobal = useCallback\(\(target: NavigationTarget\) => \{[\s\S]*?\n  \}, \[activeModule, selected\]\);/;
const match = app.match(navigationBlock);
if (!match) throw new Error('App global navigation block: anchor not found');
app = app.replace(
  navigationBlock,
  `  const navigateGlobal = useCallback((target: NavigationTarget) => {\n    if (target === 'atlas') setActiveModule('atlas');\n    else if (target === 'components') setActiveModule('componentsHub');\n    else if (target === 'simulator') setActiveModule('simulator');\n    else if (target === 'heaterTypes') setActiveModule('heaterTypes');\n    else if (target === 'operation') setActiveModule('operation');\n    else if (target === 'troubleshooting') setActiveModule('troubleshooting');\n  }, []);`,
);

app = replaceOnce(
  app,
  "  if (activeModule === 'burner') return <BurnerPage onBack={() => setActiveModule('atlas')} onNavigate={navigateGlobal} />;",
  "  if (activeModule === 'componentsHub') return <ComponentsPage onBack={() => setActiveModule('atlas')} onNavigate={navigateGlobal} onOpenModule={module => setActiveModule(module)} />;\n  if (activeModule === 'simulator') return <SimulatorPage onBack={() => setActiveModule('atlas')} onNavigate={navigateGlobal} />;\n  if (activeModule === 'burner') return <BurnerPage onBack={() => setActiveModule('componentsHub')} onNavigate={navigateGlobal} />;",
  'App components hub and simulator routes',
);

app = app.replace(
  "if (activeModule === 'radiant') return <RadiantPage onBack={() => setActiveModule('atlas')} onNavigate={navigateGlobal} />;",
  "if (activeModule === 'radiant') return <RadiantPage onBack={() => setActiveModule('componentsHub')} onNavigate={navigateGlobal} />;",
).replace(
  "if (activeModule === 'heatRecovery') return <ShieldConvectionPage onBack={() => setActiveModule('atlas')} onNavigate={navigateGlobal} />;",
  "if (activeModule === 'heatRecovery') return <ShieldConvectionPage onBack={() => setActiveModule('componentsHub')} onNavigate={navigateGlobal} />;",
).replace(
  "if (activeModule === 'draftStack') return <DraftStackPage onBack={() => setActiveModule('atlas')} onNavigate={navigateGlobal} />;",
  "if (activeModule === 'draftStack') return <DraftStackPage onBack={() => setActiveModule('componentsHub')} onNavigate={navigateGlobal} />;",
);

fs.writeFileSync(appPath, app);

// 3) Burner page: keep component-study visuals, but remove the cross-system simulator UI.
// The existing physics state remains untouched underneath; only the controls/readouts are hidden here.
const burnerPath = 'src/BurnerPage.tsx';
let burner = fs.readFileSync(burnerPath, 'utf8');

burner = replaceOnce(
  burner,
  '<main className="app-shell burner-page">',
  '<main className="app-shell burner-page burner-component-page">',
  'Burner component-only page marker',
);

burner = burner.replace(
  /<div className="burner-mobile-summary"><Flame size=\{17\} \/><span>\{controlActive \? `[\s\S]*?` : copy\.title\}<\/span><\/div>/,
  '<div className="burner-mobile-summary"><Flame size={17} /><span>{copy.title}</span></div>',
);

fs.writeFileSync(burnerPath, burner);

console.log('[navigation-architecture-cleanup] COMPONENTS hub + SIMULATOR route applied without physics or 3D changes.');
