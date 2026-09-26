import fs from 'node:fs';

function replaceOnce(source, before, after, label) {
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly one anchor, found ${count}`);
  return source.replace(before, after);
}

function replaceRegex(source, pattern, replacement, label) {
  const matches = source.match(pattern);
  if (!matches) throw new Error(`${label}: anchor not found`);
  return source.replace(pattern, replacement);
}

// -----------------------------------------------------------------------------
// FREE EXPLORE / BLENDER-LIKE CAMERA UX
// Runs AFTER assemble-preview.mjs, so it patches the final generated source.
// -----------------------------------------------------------------------------

const appPath = 'src/App.tsx';
let app = fs.readFileSync(appPath, 'utf8');

app = replaceOnce(
  app,
  "  const [mode, setMode] = useState<ViewMode>('cutaway');",
  "  const [mode, setMode] = useState<ViewMode>('normal');",
  'default atlas mode'
);

app = replaceOnce(
  app,
  "  const [selected, setSelected] = useState('Radiant Tubes');",
  "  const [selected, setSelected] = useState('');",
  'default free-explore selection'
);

app = replaceOnce(
  app,
  "  const detail = details[selected] ?? details['Radiant Tubes'];",
  "  const detail: Detail = selected ? details[selected] : {\n    group: '',\n    location: '',\n    summary: '',\n    function: '',\n    why: '',\n    observe: [],\n    issues: [],\n    inspection: [],\n    related: [],\n  };",
  'empty free-explore detail state'
);

app = replaceOnce(
  app,
  '<main className="app-shell">',
  '<main className={\`app-shell \${!selected ? \'free-explore-active\' : \'\'}\`}>',
  'free-explore shell state'
);

app = replaceOnce(
  app,
  "  const cameraAction = (action: CameraAction, component = selected) => {",
  "  const cameraAction = (action: CameraAction, component = selected || 'Radiant Tubes') => {",
  'camera action fallback'
);

app = replaceRegex(
  app,
  /  const chooseComponent = useCallback\(\(name: string\) => \{[\s\S]*?\n  \}, \[issueCameraCommand\]\);/,
  `  const chooseComponent = useCallback((name: string) => {\n    if (!name) {\n      setSelected('');\n      setContextMode('full');\n      setMobileNavigatorOpen(false);\n      setMobileInspectorOpen(false);\n      issueCameraCommand('fitHeater', 'Radiant Tubes');\n      return;\n    }\n    setSelected(name);\n    setMode(smartMode[name] ?? 'cutaway');\n    setExplode(false);\n    setContextMode('focus');\n    setMobileNavigatorOpen(false);\n    setMobileInspectorOpen(name !== 'Stack Damper');\n    issueCameraCommand('focusComponent', name);\n  }, [issueCameraCommand]);`,
  'component selection with empty-space deselect'
);

app = replaceRegex(
  app,
  /  const showFullHeater = \(\) => \{[\s\S]*?\n  \};/,
  `  const showFullHeater = () => {\n    setSelected('');\n    setContextMode('full');\n    setExplode(false);\n    setMobileInspectorOpen(false);\n    issueCameraCommand('fitHeater', 'Radiant Tubes');\n  };`,
  'free explore full-heater action'
);

app = replaceRegex(
  app,
  /  const focusSelected = \(\) => \{[\s\S]*?\n  \};/,
  `  const focusSelected = () => {\n    if (!selected) return;\n    setMode(smartMode[selected] ?? 'cutaway');\n    setExplode(false);\n    setContextMode('focus');\n    cameraAction('focusComponent', selected);\n  };`,
  'focus guard'
);

app = replaceRegex(
  app,
  /  const isolateSelected = \(\) => \{[\s\S]*?\n  \};/,
  `  const isolateSelected = () => {\n    if (!selected) return;\n    setMode(smartMode[selected] ?? 'cutaway');\n    setExplode(false);\n    setContextMode('isolate');\n    cameraAction('fitComponent', selected);\n  };`,
  'isolate guard'
);

app = replaceRegex(
  app,
  /  const resetAtlas = \(\) => \{[\s\S]*?\n  \};/,
  `  const resetAtlas = () => {\n    setMode('normal');\n    setExplode(false);\n    setContextMode('full');\n    setFlow(false);\n    setLabels(true);\n    setSelected('');\n    setQuery('');\n    setDamperPosition(50);\n    setMobileInspectorOpen(false);\n    issueCameraCommand('reset', 'Radiant Tubes');\n  };`,
  'free explore reset'
);

app = replaceOnce(
  app,
  '<div className={`context-state ${contextMode}`}><span>{contextMode === \'full\' ? \'FULL HEATER\' : contextMode === \'focus\' ? \'FOCUS + CONTEXT\' : \'CONTEXT ISOLATE\'}</span><b>{selected}</b></div>',
  '<div className={`context-state ${contextMode} ${!selected ? \'free-explore\' : \'\'}`}><span>{!selected ? \'FREE EXPLORE\' : contextMode === \'full\' ? \'FULL HEATER\' : contextMode === \'focus\' ? \'FOCUS + CONTEXT\' : \'CONTEXT ISOLATE\'}</span><b>{selected || \'WHOLE HEATER\'}</b></div>',
  'free explore status badge'
);

app = replaceOnce(
  app,
  'Drag: rotate · Wheel / pinch: zoom · Shift-drag / two fingers: pan · Double tap: fit component',
  'Drag: free orbit · Wheel / pinch: zoom · Shift-drag / two fingers: pan · Tap empty space: free explore · Double tap component: focus',
  'viewer interaction hint'
);

app = app.replace(
  'title="Fit complete heater" onClick={() => cameraAction(\'fitHeater\')}',
  'title="Free explore complete heater" onClick={showFullHeater}'
);
app = app.replace('<Maximize2 size={17} /> Heater</button>', '<Maximize2 size={17} /> Explore</button>');
app = app.replace(
  'title="Fit selected component" onClick={() => cameraAction(\'fitComponent\')}',
  'title="Fit selected component" disabled={!selected} onClick={() => cameraAction(\'fitComponent\')}'
);
app = app.replace(
  'className={contextMode === \'focus\' ? \'active\' : \'\'} onClick={focusSelected}',
  'className={contextMode === \'focus\' ? \'active\' : \'\'} disabled={!selected} onClick={focusSelected}'
);
app = app.replace(
  'className={contextMode === \'isolate\' ? \'active\' : \'\'} onClick={isolateSelected}',
  'className={contextMode === \'isolate\' ? \'active\' : \'\'} disabled={!selected} onClick={isolateSelected}'
);
app = app.replace('<h2>{selected}</h2>', '<h2>{selected || \'Free Explore\'}</h2>');
app = app.replace(
  '<aside className={`inspector-panel ${mobileInspectorOpen ? \'mobile-open\' : \'\'}`}>',
  '<aside className={`inspector-panel ${mobileInspectorOpen ? \'mobile-open\' : \'\'} ${!selected ? \'free-explore\' : \'\'}`}> '
);

fs.writeFileSync(appPath, app);

const heaterPath = 'src/Heater3D.tsx';
let heater = fs.readFileSync(heaterPath, 'utf8');

heater = replaceOnce(
  heater,
  "        orbitRef.current.pitch = THREE.MathUtils.clamp(orbitRef.current.pitch + dy * 0.0036, -0.44, 0.72);",
  "        orbitRef.current.pitch = THREE.MathUtils.clamp(orbitRef.current.pitch + dy * 0.0039, -1.48, 1.48);",
  'near-full vertical orbit'
);

heater = replaceOnce(
  heater,
  "      transition({ yaw: orbit.yaw, pitch: 0.06, radius: 62, target: [0, 19.0, 0] }, 900);",
  "      transition({ yaw: orbit.yaw, pitch: orbit.pitch, radius: 62, target: [0, 19.0, 0] }, 900);",
  'fit heater preserves viewing angle'
);

heater = replaceRegex(
  heater,
  /      if \(!moved\) \{\n        const name = pickComponent\(event\.clientX, event\.clientY\);\n        if \(name\) \{\n          const now = performance\.now\(\);\n          onSelect\(name\);\n          if \(event\.pointerType === 'touch' && now - lastTapAt < 320\) \{\n            const preset = cameraPresets\[name\];\n            if \(preset\) transitionCamera\(\{ \.\.\.preset, radius: Math\.max\(9, preset\.radius \* 0\.86\) \}, 650\);\n          \}\n          lastTapAt = now;\n        \}\n      \}/,
  `      if (!moved) {\n        const name = pickComponent(event.clientX, event.clientY);\n        const now = performance.now();\n        if (name) {\n          onSelect(name);\n          if (event.pointerType === 'touch' && now - lastTapAt < 320) {\n            const preset = cameraPresets[name];\n            if (preset) transitionCamera({ ...preset, radius: Math.max(9, preset.radius * 0.86) }, 650);\n          }\n          lastTapAt = now;\n        } else {\n          onSelect('');\n          const orbit = orbitRef.current;\n          transitionCamera({ yaw: orbit.yaw, pitch: orbit.pitch, radius: orbit.radius, target: [0, 19.0, 0] }, 520);\n          lastTapAt = 0;\n        }\n      }`,
  'empty-space deselect'
);

heater = replaceOnce(
  heater,
  "    transition(getAtlasModeCameraPreset(selected, mode, explode), explode ? 1050 : selected === 'Stack Damper' ? 850 : 900);",
  "    const preset = !selected && !explode ? ({ yaw: orbitRef.current.yaw, pitch: orbitRef.current.pitch, radius: Math.max(48, orbitRef.current.radius), target: [0, 19.0, 0] } as CameraPreset) : getAtlasModeCameraPreset(selected, mode, explode);\n    transition(preset, explode ? 1050 : selected === 'Stack Damper' ? 850 : 900);",
  'free-explore view-mode camera preset'
);

fs.writeFileSync(heaterPath, heater);

const cssPath = 'src/index.css';
let css = fs.readFileSync(cssPath, 'utf8');
if (!css.includes('/* free explore camera UX v11 */')) {
  css += `\n\n/* free explore camera UX v11 */\n.control-dock button:disabled{opacity:.32;cursor:not-allowed;filter:saturate(.45)}\n.context-state.free-explore{border-color:rgba(86,201,255,.34);box-shadow:0 10px 28px rgba(0,0,0,.18),inset 0 0 22px rgba(75,201,255,.035)}\n.context-state.free-explore span{color:#6dd9f7}\n.app-shell.free-explore-active .inspector-panel{display:none!important}\n.app-shell.free-explore-active .mobile-panel-actions button:last-child{display:none!important}\n@media(min-width:1181px){.app-shell.free-explore-active .atlas-workspace{grid-template-columns:246px minmax(0,1fr)}}\n@media(min-width:981px) and (max-width:1180px){.app-shell.free-explore-active .atlas-workspace{grid-template-columns:220px minmax(0,1fr)}}\n.three-host canvas{touch-action:none;overscroll-behavior:contain}\n`;
}
fs.writeFileSync(cssPath, css);
