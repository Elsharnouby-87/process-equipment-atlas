import * as THREE from 'three';
import { getDraftTrainingMetrics } from './draftTrainingLogic';

function cylinderBetween(a: THREE.Vector3, b: THREE.Vector3, radius: number, material: THREE.Material, segments = 12) {
  const direction = new THREE.Vector3().subVectors(b, a);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), segments), material);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  return mesh;
}

function makeStaticLabel(text: string, width = 520) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = 96;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(3,17,28,.94)';
  ctx.strokeStyle = '#64d8ff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(6, 6, width - 12, 84, 14);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#eef8fc';
  ctx.font = '700 26px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, 48);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
  sprite.scale.set(4.6, 0.85, 1);
  return sprite;
}

function makeGaugeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return { canvas, texture };
}

function drawGauge(canvas: HTMLCanvasElement, texture: THREE.CanvasTexture, value: number) {
  const ctx = canvas.getContext('2d')!;
  const w = canvas.width;
  const c = w / 2;
  ctx.clearRect(0, 0, w, w);
  ctx.fillStyle = '#071923';
  ctx.beginPath();
  ctx.arc(c, c, 222, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#6edcff';
  ctx.lineWidth = 9;
  ctx.stroke();

  const start = Math.PI * 0.75;
  const sweep = Math.PI * 1.5;
  for (let i = 0; i <= 20; i += 1) {
    const t = i / 20;
    const a = start + t * sweep;
    const major = i % 5 === 0;
    const r1 = major ? 163 : 176;
    const r2 = 202;
    ctx.strokeStyle = major ? '#d9f4ff' : '#567989';
    ctx.lineWidth = major ? 6 : 3;
    ctx.beginPath();
    ctx.moveTo(c + Math.cos(a) * r1, c + Math.sin(a) * r1);
    ctx.lineTo(c + Math.cos(a) * r2, c + Math.sin(a) * r2);
    ctx.stroke();
  }

  const labels = [-20, -10, 0, 10, 20];
  ctx.fillStyle = '#cfeaf5';
  ctx.font = '700 27px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  labels.forEach((label, i) => {
    const a = start + (i / 4) * sweep;
    ctx.fillText(String(label), c + Math.cos(a) * 132, c + Math.sin(a) * 132);
  });

  const normalized = THREE.MathUtils.clamp((value + 20) / 40, 0, 1);
  const angle = start + normalized * sweep;
  ctx.strokeStyle = value >= 0 ? '#ff754b' : '#ff9a3d';
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(c, c);
  ctx.lineTo(c + Math.cos(angle) * 142, c + Math.sin(angle) * 142);
  ctx.stroke();
  ctx.fillStyle = '#eef9fd';
  ctx.beginPath();
  ctx.arc(c, c, 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#72dcff';
  ctx.font = '700 25px Arial';
  ctx.fillText('ARCH DRAFT', c, 322);
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 42px Arial';
  ctx.fillText(`${value > 0 ? '+' : ''}${value.toFixed(1)}`, c, 370);
  ctx.fillStyle = '#9bc8d9';
  ctx.font = '700 23px Arial';
  ctx.fillText('mmH₂O   ·   RANGE −20 … +20', c, 408);
  texture.needsUpdate = true;
}

function makeAnalyzerTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 620;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return { canvas, texture };
}

function drawAnalyzerPanel(canvas: HTMLCanvasElement, texture: THREE.CanvasTexture, damperRestriction: number) {
  const metrics = getDraftTrainingMetrics(damperRestriction);
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#061923';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#4dcff9';
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#79dcff';
  ctx.font = '800 34px Arial';
  ctx.fillText('STACK GAS ANALYZERS', 42, 62);
  ctx.fillStyle = '#8aaebb';
  ctx.font = '700 22px Arial';
  ctx.fillText('REPRESENTATIVE TRAINING INDICATIONS', 42, 96);

  const rows = [
    ['O₂', `${metrics.oxygenPct.toFixed(1)} %`, metrics.oxygenLabel],
    ['CO', `${metrics.coPpm} ppm*`, metrics.coLabel],
    ['NOx', 'TREND ONLY', metrics.noxLabel],
    ['SOx', 'TREND ONLY', metrics.soxLabel],
  ];
  rows.forEach((row, index) => {
    const y = 150 + index * 98;
    ctx.fillStyle = index === 0 ? '#74e9ff' : index === 1 && metrics.coPpm >= 100 ? '#ff845c' : '#f3f9fb';
    ctx.font = '800 34px Arial';
    ctx.fillText(row[0], 42, y);
    ctx.textAlign = 'right';
    ctx.font = '800 32px Arial';
    ctx.fillText(row[1], 676, y);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#92b5c2';
    ctx.font = '600 18px Arial';
    ctx.fillText(row[2], 42, y + 31);
    ctx.strokeStyle = 'rgba(111,190,217,.22)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(42, y + 52);
    ctx.lineTo(678, y + 52);
    ctx.stroke();
  });
  ctx.fillStyle = '#ffb35a';
  ctx.font = '700 18px Arial';
  ctx.fillText('*CO value is a representative training cue, not an alarm/setpoint.', 42, 560);
  ctx.fillStyle = '#83a8b6';
  ctx.font = '600 17px Arial';
  ctx.fillText('O₂ may be biased by tramp / leakage air depending on sample location.', 42, 590);
  texture.needsUpdate = true;
}

function createParticle(material: THREE.Material, radius: number) {
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 9, 7), material);
}

export function createDraftInstrumentation3D() {
  const draftGroup = new THREE.Group();
  const analyzerGroup = new THREE.Group();
  const flowGroup = new THREE.Group();

  const steel = new THREE.MeshPhysicalMaterial({ color: '#50616a', metalness: 0.86, roughness: 0.32 });
  const dark = new THREE.MeshPhysicalMaterial({ color: '#14232b', metalness: 0.72, roughness: 0.42 });
  const tube = new THREE.MeshPhysicalMaterial({ color: '#aab8bf', metalness: 0.9, roughness: 0.25 });
  const orangeMat = new THREE.MeshBasicMaterial({ color: '#ff7a18', transparent: true, opacity: 0.94, depthWrite: false, blending: THREE.AdditiveBlending });
  const oxygenMat = new THREE.MeshBasicMaterial({ color: '#7be8ff', transparent: true, opacity: 0.64, depthWrite: false, blending: THREE.AdditiveBlending });
  const leakMat = new THREE.MeshBasicMaterial({ color: '#ff9a45', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });

  // Arch / radiant-roof draft tap and local indicator.
  draftGroup.add(cylinderBetween(new THREE.Vector3(4.7, 16.9, 4.05), new THREE.Vector3(4.7, 16.9, 4.72), 0.075, tube, 14));
  draftGroup.add(cylinderBetween(new THREE.Vector3(4.7, 16.9, 4.72), new THREE.Vector3(4.7, 16.25, 4.72), 0.055, tube, 12));
  const gaugeHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.28, 36), dark);
  gaugeHousing.rotation.x = Math.PI / 2;
  gaugeHousing.position.set(4.7, 15.75, 4.72);
  draftGroup.add(gaugeHousing);
  const gaugeData = makeGaugeTexture();
  const gaugeFace = new THREE.Mesh(new THREE.PlaneGeometry(1.62, 1.62), new THREE.MeshBasicMaterial({ map: gaugeData.texture, transparent: true, depthWrite: false }));
  gaugeFace.position.set(4.7, 15.75, 4.875);
  draftGroup.add(gaugeFace);
  const draftTag = makeStaticLabel('ARCH DRAFT · PT / PI');
  draftTag.position.set(4.65, 17.65, 4.65);
  draftTag.scale.set(3.7, 0.7, 1);
  draftGroup.add(draftTag);

  // Stack gas sample probe, sample line and analyzer cabinet.
  analyzerGroup.add(cylinderBetween(new THREE.Vector3(0, 33.7, 2.02), new THREE.Vector3(0, 33.7, 3.05), 0.075, tube, 14));
  analyzerGroup.add(cylinderBetween(new THREE.Vector3(0, 33.7, 3.05), new THREE.Vector3(3.1, 33.7, 3.05), 0.055, tube, 12));
  analyzerGroup.add(cylinderBetween(new THREE.Vector3(3.1, 33.7, 3.05), new THREE.Vector3(3.1, 33.1, 3.05), 0.055, tube, 12));
  const cabinet = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.65, 0.78), steel);
  cabinet.position.set(3.9, 32.9, 3.05);
  analyzerGroup.add(cabinet);
  const analyzerData = makeAnalyzerTexture();
  const analyzerFace = new THREE.Mesh(new THREE.PlaneGeometry(1.85, 2.15), new THREE.MeshBasicMaterial({ map: analyzerData.texture, transparent: false }));
  analyzerFace.position.set(3.9, 32.9, 3.455);
  analyzerGroup.add(analyzerFace);
  const analyzerTag = makeStaticLabel('STACK SAMPLE · O₂ · CO · NOx · SOx', 680);
  analyzerTag.position.set(3.5, 35.0, 2.8);
  analyzerTag.scale.set(5.2, 0.74, 1);
  analyzerGroup.add(analyzerTag);

  // Deliberately non-stoichiometric visual cue: 48 orange particles vs 8 cyan particles (~16.7% by count).
  const orangeParticles: THREE.Mesh[] = [];
  const oxygenParticles: THREE.Mesh[] = [];
  const leakParticles: THREE.Mesh[] = [];
  for (let i = 0; i < 48; i += 1) {
    const p = createParticle(orangeMat, 0.115);
    p.userData.phase = i / 48;
    p.userData.seed = (i * 1.73) % 1;
    flowGroup.add(p);
    orangeParticles.push(p);
  }
  for (let i = 0; i < 8; i += 1) {
    const p = createParticle(oxygenMat, 0.085);
    p.userData.phase = i / 8;
    p.userData.seed = (i * 2.31) % 1;
    p.userData.index = i;
    flowGroup.add(p);
    oxygenParticles.push(p);
  }
  for (let i = 0; i < 6; i += 1) {
    const p = createParticle(leakMat, 0.08);
    p.userData.phase = i / 6;
    p.userData.seed = (i * 1.91) % 1;
    p.visible = false;
    flowGroup.add(p);
    leakParticles.push(p);
  }
  flowGroup.visible = false;

  let lastRestriction = Number.NaN;
  const updateReadouts = (damperRestriction: number) => {
    if (Math.abs(damperRestriction - lastRestriction) < 0.05) return;
    const metrics = getDraftTrainingMetrics(damperRestriction);
    drawGauge(gaugeData.canvas, gaugeData.texture, metrics.draftMmH2O);
    drawAnalyzerPanel(analyzerData.canvas, analyzerData.texture, damperRestriction);
    oxygenMat.opacity = metrics.blueParticleOpacity;
    orangeMat.opacity = THREE.MathUtils.lerp(0.84, 0.98, metrics.damperOpening / 100);
    leakMat.opacity = 0.72 * metrics.leakIntensity;
    lastRestriction = damperRestriction;
  };
  updateReadouts(50);

  const update = (damperRestriction: number, elapsed: number, showFlow: boolean) => {
    const metrics = getDraftTrainingMetrics(damperRestriction);
    updateReadouts(damperRestriction);
    flowGroup.visible = showFlow;
    if (!showFlow) return;

    const opening01 = metrics.damperOpening / 100;
    const congestion = metrics.flowCongestion;
    const speed = 0.052 * metrics.flowSpeedScale;

    orangeParticles.forEach(p => {
      const phase = p.userData.phase as number;
      const seed = p.userData.seed as number;
      const raw = (phase + elapsed * speed) % 1;
      // When the damper is restricted, the visual spends more time below the damper instead of implying unchanged evacuation velocity.
      const u = Math.pow(raw, 1 + congestion * 0.82);
      const lower = u < 0.34;
      const r = lower ? u / 0.34 : (u - 0.34) / 0.66;
      let y = lower ? THREE.MathUtils.lerp(24.7, 29.5, r) : THREE.MathUtils.lerp(29.5, 39.0, r);
      let width = lower ? THREE.MathUtils.lerp(2.55, 0.62, r) : 0.62;

      if (lower) {
        const nearDamper = THREE.MathUtils.smoothstep(r, 0.55, 1);
        const pocket = congestion * nearDamper;
        y -= pocket * (0.55 + Math.sin((r + seed) * Math.PI) * 0.45) * 1.15;
        width += pocket * 0.72;
      }

      const angle = (u * 8.5 + seed * 6.2) * Math.PI;
      p.position.set(Math.sin(angle) * width, y, Math.cos(angle * 0.82) * width * 0.72);
      const pulse = 0.88 + Math.sin(elapsed * 4.2 + phase * 12) * 0.12;
      const axialStretch = metrics.flowStretchScale * (0.86 + opening01 * 0.22);
      p.scale.set(pulse * 0.92, pulse * axialStretch, pulse * 0.92);
    });

    const visibleOxygenCount = Math.max(2, Math.round(oxygenParticles.length * metrics.oxygenParticleFraction));
    oxygenParticles.forEach(p => {
      const index = p.userData.index as number;
      p.visible = index < visibleOxygenCount;
      if (!p.visible) return;
      const phase = p.userData.phase as number;
      const seed = p.userData.seed as number;
      const raw = (phase + elapsed * speed * 0.88) % 1;
      const u = Math.pow(raw, 1 + congestion * 0.68);
      const lower = u < 0.34;
      const r = lower ? u / 0.34 : (u - 0.34) / 0.66;
      let y = lower ? THREE.MathUtils.lerp(24.75, 29.55, r) : THREE.MathUtils.lerp(29.55, 39.0, r);
      let width = lower ? THREE.MathUtils.lerp(2.75, 0.76, r) : 0.76;
      if (lower) {
        const nearDamper = THREE.MathUtils.smoothstep(r, 0.58, 1);
        y -= congestion * nearDamper * 0.8;
        width += congestion * nearDamper * 0.42;
      }
      const angle = (u * 7.2 + seed * 7.1) * Math.PI;
      p.position.set(Math.cos(angle) * width, y, Math.sin(angle * 0.77) * width * 0.76);
      const pulse = 0.9 + Math.sin(elapsed * 3.6 + phase * 9) * 0.1;
      p.scale.set(pulse * 0.86, pulse * metrics.flowStretchScale, pulse * 0.86);
    });

    // Positive-pressure awareness only: a restrained outward hot-gas cue at the arch/casing reference region.
    leakParticles.forEach(p => {
      const phase = p.userData.phase as number;
      const seed = p.userData.seed as number;
      const active = metrics.leakIntensity > 0.02;
      p.visible = active;
      if (!active) return;
      const u = (phase + elapsed * (0.12 + metrics.leakIntensity * 0.08)) % 1;
      const baseX = 5.35;
      const baseY = 16.45 + seed * 0.7;
      const baseZ = 3.85 + (seed - 0.5) * 1.1;
      p.position.set(
        baseX + u * (1.15 + metrics.leakIntensity * 0.85),
        baseY + Math.sin((u + seed) * Math.PI) * 0.32,
        baseZ + Math.sin((u + seed) * 7.0) * 0.18,
      );
      const fade = (1 - u) * metrics.leakIntensity;
      p.scale.setScalar(0.72 + fade * 0.8);
    });
  };

  return { draftGroup, analyzerGroup, flowGroup, update };
}
