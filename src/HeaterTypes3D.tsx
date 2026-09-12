import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { HeaterType, HeaterTypeView } from './modelTypes';

type CameraCommand = {
  id: number;
  action: 'fit' | 'zoomIn' | 'zoomOut' | 'reset';
};

type Props = {
  heaterType: HeaterType;
  view: HeaterTypeView;
  compare: boolean;
  cameraCommand: CameraCommand;
};

type OrbitState = {
  yaw: number;
  pitch: number;
  radius: number;
  target: THREE.Vector3;
};

type ModelVisual = {
  type: HeaterType;
  root: THREE.Group;
  exteriorShell: THREE.Group;
  cutawayShell: THREE.Group;
  internals: THREE.Group;
  radiant: THREE.Group;
  burners: THREE.Group;
  convection: THREE.Group;
  flow: THREE.Group;
  label: THREE.Sprite;
  processCurve: THREE.Curve<THREE.Vector3>;
  flueCurve: THREE.Curve<THREE.Vector3>;
  processParticles: THREE.Mesh[];
  flueParticles: THREE.Mesh[];
  flames: THREE.Mesh[];
};

type Materials = {
  shell: THREE.MeshPhysicalMaterial;
  shellDark: THREE.MeshPhysicalMaterial;
  steel: THREE.MeshPhysicalMaterial;
  tube: THREE.MeshPhysicalMaterial;
  tubeFocus: THREE.MeshPhysicalMaterial;
  refractory: THREE.MeshStandardMaterial;
  burner: THREE.MeshPhysicalMaterial;
  flame: THREE.MeshBasicMaterial;
  fin: THREE.MeshPhysicalMaterial;
  ghost: THREE.MeshPhysicalMaterial;
  process: THREE.MeshBasicMaterial;
  flue: THREE.MeshBasicMaterial;
  rail: THREE.MeshPhysicalMaterial;
};

const typeOrder: HeaterType[] = ['box', 'cabin', 'cylindrical'];
const typeLabels: Record<HeaterType, string> = {
  box: 'BOX HEATER',
  cabin: 'CABIN HEATER',
  cylindrical: 'VERTICAL CYLINDRICAL',
};

function meshBox(size: [number, number, number], position: [number, number, number], material: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function cylinder(radius: number, height: number, position: [number, number, number], material: THREE.Material, segments = 22) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, segments), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function cylinderBetween(a: THREE.Vector3, b: THREE.Vector3, radius: number, material: THREE.Material, segments = 10) {
  const direction = new THREE.Vector3().subVectors(b, a);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), segments), material);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function tube(points: THREE.Vector3[], radius: number, material: THREE.Material, tubularSegments = 64) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.18);
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, tubularSegments, radius, 10, false), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function makeLabel(text: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 520;
  canvas.height = 100;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(3,17,28,.92)';
  ctx.strokeStyle = '#62c9f7';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(5, 5, 510, 90, 14);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#eef7fb';
  ctx.font = '700 27px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 260, 50);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(5.2, 1, 1);
  return sprite;
}

function rememberMaterials(group: THREE.Object3D) {
  group.traverse(object => {
    if (object instanceof THREE.Mesh && !object.userData.originalMaterial) object.userData.originalMaterial = object.material;
  });
}

function restoreMaterials(group: THREE.Object3D) {
  group.traverse(object => {
    if (object instanceof THREE.Mesh && object.userData.originalMaterial) object.material = object.userData.originalMaterial as THREE.Material | THREE.Material[];
  });
}

function applyMaterial(group: THREE.Object3D, material: THREE.Material) {
  group.traverse(object => {
    if (object instanceof THREE.Mesh) object.material = material;
  });
}

function addFloorBurner(group: THREE.Group, x: number, z: number, floorY: number, materials: Materials, flames: THREE.Mesh[]) {
  const register = cylinder(0.46, 0.42, [x, floorY - 0.28, z], materials.burner, 18);
  group.add(register);
  const throat = cylinder(0.32, 0.24, [x, floorY + 0.1, z], materials.refractory, 18);
  group.add(throat);
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.5, 3.7, 18, 1, true), materials.flame);
  flame.position.set(x, floorY + 2.0, z);
  flame.userData.baseY = flame.position.y;
  flame.userData.phase = flames.length * 0.81;
  group.add(flame);
  flames.push(flame);
}

function addFinnedBank(group: THREE.Group, y0: number, width: number, zs: number[], materials: Materials, rows = 5) {
  for (let row = 0; row < rows; row += 1) {
    const y = y0 + row * 0.55;
    for (const z of zs) {
      const tubeMesh = cylinderBetween(new THREE.Vector3(-width / 2, y, z), new THREE.Vector3(width / 2, y, z), 0.12, materials.tube, 12);
      group.add(tubeMesh);
      for (let x = -width / 2 + 0.35; x < width / 2; x += 0.7) {
        const fin = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.025, 12), materials.fin);
        fin.rotation.z = Math.PI / 2;
        fin.position.set(x, y, z);
        group.add(fin);
      }
    }
  }
}

function addFrame(root: THREE.Group, xs: number[], zs: number[], topY: number, materials: Materials) {
  for (const x of xs) {
    for (const z of zs) root.add(meshBox([0.22, topY, 0.22], [x, topY / 2, z], materials.steel));
  }
  for (const z of zs) root.add(meshBox([Math.abs(xs[1] - xs[0]) + 0.5, 0.2, 0.25], [0, topY - 0.1, z], materials.steel));
}

function createParticles(group: THREE.Group, curve: THREE.Curve<THREE.Vector3>, material: THREE.Material, count: number, radius: number) {
  const particles: THREE.Mesh[] = [];
  for (let i = 0; i < count; i += 1) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(radius, 7, 6), material);
    p.userData.t = i / count;
    p.position.copy(curve.getPoint(i / count));
    group.add(p);
    particles.push(p);
  }
  return particles;
}

function buildBox(materials: Materials): ModelVisual {
  const root = new THREE.Group();
  const exteriorShell = new THREE.Group();
  const cutawayShell = new THREE.Group();
  const internals = new THREE.Group();
  const radiant = new THREE.Group();
  const burners = new THREE.Group();
  const convection = new THREE.Group();
  const flow = new THREE.Group();
  const flames: THREE.Mesh[] = [];

  const buildShell = (group: THREE.Group, cutaway: boolean) => {
    group.add(meshBox([10.4, 0.35, 6.6], [0, 4.8, 0], materials.shellDark));
    group.add(meshBox([10.5, 10.4, 0.18], [0, 10.0, -3.3], materials.shell));
    group.add(meshBox([0.18, 10.4, 6.5], [-5.2, 10.0, 0], materials.shell));
    group.add(meshBox([0.18, 10.4, 6.5], [5.2, 10.0, 0], materials.shell));
    if (!cutaway) group.add(meshBox([10.5, 10.4, 0.18], [0, 10.0, 3.3], materials.shell));
    group.add(meshBox([10.6, 4.6, 6.6], [0, 17.5, 0], materials.shell));
    if (cutaway) group.add(meshBox([10.0, 4.1, 0.14], [0, 17.5, -3.27], materials.shellDark));
    group.add(cylinder(1.28, 5.1, [0, 22.2, 0], materials.shell, 30));
  };
  buildShell(exteriorShell, false);
  buildShell(cutawayShell, true);
  addFrame(exteriorShell, [-5.6, 5.6], [-3.65, 3.65], 4.8, materials);
  addFrame(cutawayShell, [-5.6, 5.6], [-3.65, 3.65], 4.8, materials);

  for (const x of [-4.55, 4.55]) {
    for (const z of [-2.25, -0.75, 0.75, 2.25]) {
      radiant.add(cylinderBetween(new THREE.Vector3(x, 5.6, z), new THREE.Vector3(x, 14.3, z), 0.16, materials.tube, 12));
    }
  }
  for (const x of [-4.55, 4.55]) {
    for (const z of [-2.25, 0.75]) {
      radiant.add(tube([
        new THREE.Vector3(x, 14.3, z),
        new THREE.Vector3(x, 14.65, z + 0.75),
        new THREE.Vector3(x, 14.3, z + 1.5),
      ], 0.16, materials.tube, 22));
    }
  }
  for (const x of [-2.4, 0, 2.4]) for (const z of [-1.45, 1.45]) addFloorBurner(burners, x, z, 5.0, materials, flames);
  addFinnedBank(convection, 16.1, 9.2, [-2.3, -0.8, 0.8, 2.3], materials, 5);
  internals.add(radiant, burners, convection);

  const processCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(4.55, 5.7, -2.25),
    new THREE.Vector3(4.55, 9.8, -2.25),
    new THREE.Vector3(4.55, 14.3, -2.25),
    new THREE.Vector3(4.55, 14.6, -1.5),
    new THREE.Vector3(4.55, 14.3, -0.75),
    new THREE.Vector3(4.55, 9.8, -0.75),
    new THREE.Vector3(4.55, 5.7, -0.75),
  ], false, 'centripetal', 0.18);
  const flueCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 6.0, 0),
    new THREE.Vector3(0.4, 11.5, -0.2),
    new THREE.Vector3(-0.3, 16.2, 0.3),
    new THREE.Vector3(0, 19.6, 0),
    new THREE.Vector3(0, 24.5, 0),
  ], false, 'centripetal', 0.18);
  const processParticles = createParticles(flow, processCurve, materials.process, 18, 0.095);
  const flueParticles = createParticles(flow, flueCurve, materials.flue, 22, 0.105);
  const label = makeLabel(typeLabels.box);
  label.position.set(0, 26.2, 0);
  root.add(exteriorShell, cutawayShell, internals, flow, label);
  rememberMaterials(root);
  return { type: 'box', root, exteriorShell, cutawayShell, internals, radiant, burners, convection, flow, label, processCurve, flueCurve, processParticles, flueParticles, flames };
}

function buildCabin(materials: Materials): ModelVisual {
  const root = new THREE.Group();
  const exteriorShell = new THREE.Group();
  const cutawayShell = new THREE.Group();
  const internals = new THREE.Group();
  const radiant = new THREE.Group();
  const burners = new THREE.Group();
  const convection = new THREE.Group();
  const flow = new THREE.Group();
  const flames: THREE.Mesh[] = [];

  const buildShell = (group: THREE.Group, cutaway: boolean) => {
    group.add(meshBox([12.8, 0.34, 7.3], [0, 3.8, 0], materials.shellDark));
    group.add(meshBox([12.8, 8.6, 0.18], [0, 8.1, -3.65], materials.shell));
    group.add(meshBox([0.18, 8.6, 7.2], [-6.4, 8.1, 0], materials.shell));
    group.add(meshBox([0.18, 8.6, 7.2], [6.4, 8.1, 0], materials.shell));
    if (!cutaway) group.add(meshBox([12.8, 8.6, 0.18], [0, 8.1, 3.65], materials.shell));
    const leftRoof = meshBox([6.8, 0.28, 7.25], [-3.15, 13.0, 0], materials.shellDark);
    leftRoof.rotation.z = -0.16;
    group.add(leftRoof);
    const rightRoof = meshBox([6.8, 0.28, 7.25], [3.15, 13.0, 0], materials.shellDark);
    rightRoof.rotation.z = 0.16;
    group.add(rightRoof);
    group.add(meshBox([8.2, 4.0, 6.4], [0, 15.3, 0], materials.shell));
    group.add(cylinder(1.18, 4.4, [0, 19.5, 0], materials.shell, 28));
  };
  buildShell(exteriorShell, false);
  buildShell(cutawayShell, true);
  addFrame(exteriorShell, [-6.8, 6.8], [-4.0, 4.0], 3.8, materials);
  addFrame(cutawayShell, [-6.8, 6.8], [-4.0, 4.0], 3.8, materials);

  const coilZ = -3.05;
  const ys = [5.0, 6.35, 7.7, 9.05, 10.4, 11.75];
  ys.forEach((y, index) => {
    radiant.add(cylinderBetween(new THREE.Vector3(-5.35, y, coilZ), new THREE.Vector3(5.35, y, coilZ), 0.16, materials.tube, 12));
    if (index < ys.length - 1) {
      const side = index % 2 === 0 ? 5.35 : -5.35;
      radiant.add(tube([
        new THREE.Vector3(side, y, coilZ),
        new THREE.Vector3(side + (side > 0 ? 0.35 : -0.35), (y + ys[index + 1]) / 2, coilZ),
        new THREE.Vector3(side, ys[index + 1], coilZ),
      ], 0.16, materials.tube, 22));
    }
  });
  for (const x of [-4.2, -1.4, 1.4, 4.2]) for (const z of [-1.55, 1.55]) addFloorBurner(burners, x, z, 4.0, materials, flames);
  addFinnedBank(convection, 14.1, 7.3, [-2.0, -0.7, 0.7, 2.0], materials, 5);
  internals.add(radiant, burners, convection);

  const processPoints: THREE.Vector3[] = [];
  ys.forEach((y, index) => {
    const from = index % 2 === 0 ? -5.35 : 5.35;
    const to = -from;
    processPoints.push(new THREE.Vector3(from, y, coilZ), new THREE.Vector3(to, y, coilZ));
  });
  const processCurve = new THREE.CatmullRomCurve3(processPoints, false, 'centripetal', 0.08);
  const flueCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.5, 5.0, 0),
    new THREE.Vector3(0.7, 9.2, 0.4),
    new THREE.Vector3(0, 13.0, -0.2),
    new THREE.Vector3(0, 17.1, 0),
    new THREE.Vector3(0, 21.4, 0),
  ], false, 'centripetal', 0.18);
  const processParticles = createParticles(flow, processCurve, materials.process, 20, 0.095);
  const flueParticles = createParticles(flow, flueCurve, materials.flue, 22, 0.105);
  const label = makeLabel(typeLabels.cabin);
  label.position.set(0, 23.3, 0);
  root.add(exteriorShell, cutawayShell, internals, flow, label);
  rememberMaterials(root);
  return { type: 'cabin', root, exteriorShell, cutawayShell, internals, radiant, burners, convection, flow, label, processCurve, flueCurve, processParticles, flueParticles, flames };
}

function buildCylindrical(materials: Materials): ModelVisual {
  const root = new THREE.Group();
  const exteriorShell = new THREE.Group();
  const cutawayShell = new THREE.Group();
  const internals = new THREE.Group();
  const radiant = new THREE.Group();
  const burners = new THREE.Group();
  const convection = new THREE.Group();
  const flow = new THREE.Group();
  const flames: THREE.Mesh[] = [];

  const fullShell = new THREE.Mesh(new THREE.CylinderGeometry(4.3, 4.3, 10.8, 44, 1, true), materials.shell);
  fullShell.position.y = 9.2;
  exteriorShell.add(fullShell);
  exteriorShell.add(cylinder(4.38, 0.32, [0, 3.8, 0], materials.shellDark, 44));
  exteriorShell.add(cylinder(4.38, 0.28, [0, 14.65, 0], materials.shellDark, 44));

  const cutShell = new THREE.Mesh(new THREE.CylinderGeometry(4.3, 4.3, 10.8, 44, 1, true, -0.18, Math.PI * 1.48), materials.shell);
  cutShell.position.y = 9.2;
  cutawayShell.add(cutShell);
  cutawayShell.add(cylinder(4.38, 0.32, [0, 3.8, 0], materials.shellDark, 44));

  for (const shell of [exteriorShell, cutawayShell]) {
    shell.add(meshBox([7.1, 4.1, 7.1], [0, 16.7, 0], materials.shell));
    shell.add(cylinder(1.1, 4.1, [0, 20.75, 0], materials.shell, 28));
    for (const x of [-4.7, 4.7]) for (const z of [-2.4, 2.4]) shell.add(meshBox([0.2, 3.7, 0.2], [x, 1.85, z], materials.steel));
  }

  const helixPoints: THREE.Vector3[] = [];
  const turns = 5.5;
  for (let i = 0; i <= 140; i += 1) {
    const u = i / 140;
    const a = u * Math.PI * 2 * turns + 0.5;
    helixPoints.push(new THREE.Vector3(Math.cos(a) * 3.45, 4.8 + u * 8.8, Math.sin(a) * 3.45));
  }
  radiant.add(tube(helixPoints, 0.16, materials.tube, 150));
  for (let i = 0; i < 5; i += 1) {
    const a = (i / 5) * Math.PI * 2;
    addFloorBurner(burners, Math.cos(a) * 1.65, Math.sin(a) * 1.65, 4.0, materials, flames);
  }
  addFinnedBank(convection, 15.55, 6.2, [-2.1, -0.7, 0.7, 2.1], materials, 5);
  internals.add(radiant, burners, convection);

  const processCurve = new THREE.CatmullRomCurve3(helixPoints, false, 'centripetal', 0.12);
  const flueCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 4.8, 0),
    new THREE.Vector3(0.4, 9.0, -0.2),
    new THREE.Vector3(-0.3, 13.9, 0.3),
    new THREE.Vector3(0, 17.7, 0),
    new THREE.Vector3(0, 22.7, 0),
  ], false, 'centripetal', 0.18);
  const processParticles = createParticles(flow, processCurve, materials.process, 22, 0.09);
  const flueParticles = createParticles(flow, flueCurve, materials.flue, 22, 0.105);
  const label = makeLabel(typeLabels.cylindrical);
  label.position.set(0, 24.5, 0);
  root.add(exteriorShell, cutawayShell, internals, flow, label);
  rememberMaterials(root);
  return { type: 'cylindrical', root, exteriorShell, cutawayShell, internals, radiant, burners, convection, flow, label, processCurve, flueCurve, processParticles, flueParticles, flames };
}

function disposeScene(scene: THREE.Scene) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  scene.traverse(object => {
    const renderable = object as THREE.Object3D & { geometry?: THREE.BufferGeometry; material?: THREE.Material | THREE.Material[] };
    if (renderable.geometry && !geometries.has(renderable.geometry)) {
      geometries.add(renderable.geometry);
      renderable.geometry.dispose();
    }
    const mats = renderable.material ? (Array.isArray(renderable.material) ? renderable.material : [renderable.material]) : [];
    mats.forEach(material => {
      if (materials.has(material)) return;
      materials.add(material);
      Object.values(material).forEach(value => {
        if (value instanceof THREE.Texture && !textures.has(value)) {
          textures.add(value);
          value.dispose();
        }
      });
      material.dispose();
    });
  });
}

export default function HeaterTypes3D({ heaterType, view, compare, cameraCommand }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const modelsRef = useRef<Map<HeaterType, ModelVisual>>(new Map());
  const applyStateRef = useRef<((type: HeaterType, currentView: HeaterTypeView, isCompare: boolean) => void) | null>(null);
  const cameraActionRef = useRef<((command: CameraCommand, type: HeaterType, isCompare: boolean) => void) | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const mobile = window.matchMedia('(max-width: 700px)').matches || host.clientWidth <= 700;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#07141f');
    scene.fog = new THREE.FogExp2('#07141f', 0.016);
    const camera = new THREE.PerspectiveCamera(35, host.clientWidth / Math.max(host.clientHeight, 1), 0.1, 160);
    const renderer = new THREE.WebGLRenderer({ antialias: !mobile, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.1 : 1.65));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = !mobile;
    host.appendChild(renderer.domElement);

    const materials: Materials = {
      shell: new THREE.MeshPhysicalMaterial({ color: '#68757c', metalness: 0.78, roughness: 0.42, clearcoat: 0.06 }),
      shellDark: new THREE.MeshPhysicalMaterial({ color: '#283239', metalness: 0.84, roughness: 0.37 }),
      steel: new THREE.MeshPhysicalMaterial({ color: '#4e5b62', metalness: 0.86, roughness: 0.34 }),
      tube: new THREE.MeshPhysicalMaterial({ color: '#3d454a', metalness: 0.93, roughness: 0.24, emissive: '#130a05', emissiveIntensity: 0.12 }),
      tubeFocus: new THREE.MeshPhysicalMaterial({ color: '#69777d', metalness: 0.9, roughness: 0.2, emissive: '#133447', emissiveIntensity: 0.5 }),
      refractory: new THREE.MeshStandardMaterial({ color: '#a68d6d', roughness: 0.95, emissive: '#281008', emissiveIntensity: 0.08 }),
      burner: new THREE.MeshPhysicalMaterial({ color: '#8d4d24', metalness: 0.82, roughness: 0.34 }),
      flame: new THREE.MeshBasicMaterial({ color: '#ff7a18', transparent: true, opacity: 0.56, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }),
      fin: new THREE.MeshPhysicalMaterial({ color: '#5a6469', metalness: 0.9, roughness: 0.3 }),
      ghost: new THREE.MeshPhysicalMaterial({ color: '#547080', metalness: 0.2, roughness: 0.75, transparent: true, opacity: 0.12, depthWrite: false }),
      process: new THREE.MeshBasicMaterial({ color: '#25c9ff', transparent: true, opacity: 0.95 }),
      flue: new THREE.MeshBasicMaterial({ color: '#ff7a18', transparent: true, opacity: 0.88 }),
      rail: new THREE.MeshPhysicalMaterial({ color: '#d79217', metalness: 0.55, roughness: 0.42 }),
    };

    scene.add(new THREE.HemisphereLight('#c4e8fa', '#25140e', 1.4));
    const key = new THREE.DirectionalLight('#e7f4ff', 5.4);
    key.position.set(-12, 26, 18);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);
    const rim = new THREE.DirectionalLight('#5acbff', 2.8);
    rim.position.set(18, 18, -15);
    scene.add(rim);
    const warm = new THREE.PointLight('#ff7a18', 28, 30, 1.8);
    warm.position.set(0, 8, 3);
    scene.add(warm);

    const ground = meshBox([58, 0.25, 34], [0, -0.35, 0], new THREE.MeshStandardMaterial({ color: '#10191e', roughness: 0.82, metalness: 0.16 }));
    scene.add(ground);
    const grid = new THREE.GridHelper(56, 56, '#274352', '#142934');
    grid.position.y = -0.2;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.28;
    scene.add(grid);

    const models = new Map<HeaterType, ModelVisual>();
    models.set('box', buildBox(materials));
    models.set('cabin', buildCabin(materials));
    models.set('cylindrical', buildCylindrical(materials));
    models.forEach(model => scene.add(model.root));
    modelsRef.current = models;

    const applyState = (type: HeaterType, currentView: HeaterTypeView, isCompare: boolean) => {
      typeOrder.forEach((modelType, index) => {
        const model = models.get(modelType)!;
        const show = isCompare || modelType === type;
        model.root.visible = show;
        if (!show) return;
        model.root.position.set(isCompare ? (index - 1) * 15.5 : 0, 0, 0);
        model.root.scale.setScalar(isCompare ? 0.72 : 1);
        restoreMaterials(model.root);
        model.label.visible = isCompare;
        model.flow.visible = currentView === 'flow';
        model.internals.visible = currentView !== 'exterior';
        model.exteriorShell.visible = currentView === 'exterior';
        model.cutawayShell.visible = currentView !== 'exterior';
        if (currentView === 'tubes') {
          applyMaterial(model.cutawayShell, materials.ghost);
          applyMaterial(model.burners, materials.ghost);
          applyMaterial(model.radiant, materials.tubeFocus);
        } else if (currentView === 'burners') {
          applyMaterial(model.cutawayShell, materials.ghost);
          applyMaterial(model.radiant, materials.ghost);
          applyMaterial(model.convection, materials.ghost);
        } else if (currentView === 'flow') {
          applyMaterial(model.cutawayShell, materials.ghost);
          applyMaterial(model.radiant, materials.ghost);
          applyMaterial(model.convection, materials.ghost);
        }
      });
    };
    applyStateRef.current = applyState;

    const orbit: OrbitState = { yaw: -0.72, pitch: 0.09, radius: 34, target: new THREE.Vector3(0, 11.5, 0) };
    let desired: OrbitState | null = null;
    const updateCamera = () => {
      camera.position.set(
        orbit.target.x + Math.sin(orbit.yaw) * Math.cos(orbit.pitch) * orbit.radius,
        orbit.target.y + Math.sin(orbit.pitch) * orbit.radius,
        orbit.target.z + Math.cos(orbit.yaw) * Math.cos(orbit.pitch) * orbit.radius
      );
      camera.lookAt(orbit.target);
    };
    const fit = (type: HeaterType, isCompare: boolean) => {
      const targetY = type === 'box' ? 12.5 : type === 'cabin' ? 11.2 : 11.8;
      desired = { yaw: -0.72, pitch: 0.08, radius: isCompare ? (mobile ? 61 : 54) : type === 'cabin' ? 32 : 30, target: new THREE.Vector3(0, isCompare ? 11.5 : targetY, 0) };
    };
    const cameraAction = (command: CameraCommand, type: HeaterType, isCompare: boolean) => {
      if (command.action === 'fit' || command.action === 'reset') fit(type, isCompare);
      else if (command.action === 'zoomIn') desired = { ...orbit, radius: THREE.MathUtils.clamp(orbit.radius - 6, 10, 80), target: orbit.target.clone() };
      else desired = { ...orbit, radius: THREE.MathUtils.clamp(orbit.radius + 6, 10, 80), target: orbit.target.clone() };
    };
    cameraActionRef.current = cameraAction;
    applyState(heaterType, view, compare);
    fit(heaterType, compare);
    updateCamera();

    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let pinchDistance = 0;
    const pointers = new Map<number, { x: number; y: number }>();
    const onPointerDown = (event: PointerEvent) => {
      desired = null;
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      renderer.domElement.setPointerCapture(event.pointerId);
      if (pointers.size === 2) {
        const pts = [...pointers.values()];
        pinchDistance = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      }
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!dragging || !pointers.has(event.pointerId)) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size >= 2) {
        const pts = [...pointers.values()].slice(0, 2);
        const distance = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
        if (pinchDistance > 0) orbit.radius = THREE.MathUtils.clamp(orbit.radius * (pinchDistance / Math.max(distance, 1)), 10, 80);
        pinchDistance = distance;
        updateCamera();
        return;
      }
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      orbit.yaw -= dx * 0.005;
      orbit.pitch = THREE.MathUtils.clamp(orbit.pitch + dy * 0.0035, -0.38, 0.65);
      lastX = event.clientX;
      lastY = event.clientY;
      updateCamera();
    };
    const onPointerUp = (event: PointerEvent) => {
      pointers.delete(event.pointerId);
      dragging = pointers.size > 0;
      pinchDistance = 0;
    };
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      desired = null;
      orbit.radius = THREE.MathUtils.clamp(orbit.radius + event.deltaY * 0.04, 10, 80);
      updateCamera();
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointercancel', onPointerUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    const clock = new THREE.Clock();
    let animationId = 0;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      if (desired) {
        orbit.yaw = THREE.MathUtils.lerp(orbit.yaw, desired.yaw, 0.075);
        orbit.pitch = THREE.MathUtils.lerp(orbit.pitch, desired.pitch, 0.075);
        orbit.radius = THREE.MathUtils.lerp(orbit.radius, desired.radius, 0.075);
        orbit.target.lerp(desired.target, 0.075);
        if (Math.abs(orbit.radius - desired.radius) < 0.03 && orbit.target.distanceTo(desired.target) < 0.03) desired = null;
        updateCamera();
      }
      models.forEach(model => {
        model.flames.forEach(flame => {
          const phase = (flame.userData.phase as number | undefined) ?? 0;
          flame.scale.y = 0.9 + Math.sin(t * 5.2 + phase) * 0.09 + Math.sin(t * 9.1 + phase) * 0.035;
          flame.scale.x = 0.95 + Math.sin(t * 6.0 + phase * 1.3) * 0.07;
          flame.scale.z = flame.scale.x;
          flame.position.y = ((flame.userData.baseY as number | undefined) ?? flame.position.y) + Math.sin(t * 4.4 + phase) * 0.05;
        });
        model.processParticles.forEach(p => {
          const u = (((p.userData.t as number | undefined) ?? 0) + t * 0.045) % 1;
          p.position.copy(model.processCurve.getPoint(u));
        });
        model.flueParticles.forEach(p => {
          const u = (((p.userData.t as number | undefined) ?? 0) + t * 0.06) % 1;
          p.position.copy(model.flueCurve.getPoint(u));
        });
      });
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      camera.aspect = host.clientWidth / Math.max(host.clientHeight, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointercancel', onPointerUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      if (host.contains(renderer.domElement)) host.removeChild(renderer.domElement);
      disposeScene(scene);
      renderer.renderLists.dispose();
      renderer.dispose();
      modelsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    applyStateRef.current?.(heaterType, view, compare);
    cameraActionRef.current?.({ id: cameraCommand.id, action: 'fit' }, heaterType, compare);
  }, [heaterType, view, compare]);

  useEffect(() => {
    cameraActionRef.current?.(cameraCommand, heaterType, compare);
  }, [cameraCommand, heaterType, compare]);

  return <div ref={hostRef} className="three-host types-three-host" aria-label="Interactive 3D comparison of representative fired-heater types" />;
}
