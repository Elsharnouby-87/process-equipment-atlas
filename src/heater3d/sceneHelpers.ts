import * as THREE from 'three';

type SurfaceKind = 'steel' | 'panel' | 'refractory' | 'concrete';

// Procedural surface textures -------------------------------------------------
export function makeSurfaceTexture(kind: SurfaceKind) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const palette: Record<SurfaceKind, [string, string, string]> = {
    steel: ['#505b62', '#839198', '#252d31'],
    panel: ['#657078', '#98a2a7', '#343d42'],
    refractory: ['#9c8364', '#c5aa83', '#67523d'],
    concrete: ['#62676a', '#8b8f91', '#3e4346'],
  };
  const [base, hi, lo] = palette[kind];
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 512, 512);

  if (kind === 'refractory') {
    ctx.lineWidth = 3;
    for (let y = 0; y < 512; y += 64) {
      const offset = (Math.floor(y / 64) % 2) * 42;
      for (let x = -offset; x < 512; x += 84) {
        ctx.strokeStyle = 'rgba(49,33,23,.34)';
        ctx.strokeRect(x, y, 82, 62);
        ctx.strokeStyle = 'rgba(230,211,180,.13)';
        ctx.strokeRect(x + 3, y + 3, 76, 56);
      }
    }
  }

  for (let i = 0; i < 5400; i += 1) {
    const light = Math.random() > 0.56;
    ctx.globalAlpha = Math.random() * 0.11 + 0.02;
    ctx.fillStyle = light ? hi : lo;
    const s = Math.random() * (kind === 'refractory' ? 3 : 1.8) + 0.3;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, s, s);
  }

  if (kind === 'steel' || kind === 'panel') {
    ctx.globalAlpha = 0.09;
    for (let i = 0; i < 48; i += 1) {
      const y = Math.random() * 512;
      ctx.strokeStyle = i % 3 === 0 ? '#dce6e9' : '#1a2024';
      ctx.lineWidth = Math.random() * 1.1 + 0.25;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y + Math.random() * 8 - 4);
      ctx.stroke();
    }
  }

  if (kind === 'concrete') {
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 60; i += 1) {
      ctx.strokeStyle = Math.random() > 0.5 ? '#b9bdbe' : '#282c2e';
      ctx.lineWidth = Math.random() * 1.3 + 0.3;
      ctx.beginPath();
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.random() * 44 - 22, y + Math.random() * 44 - 22);
      ctx.stroke();
    }
  }

  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(kind === 'refractory' ? 2.2 : 4.5, kind === 'refractory' ? 3.2 : 4.5);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function makeLabel(text: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 520;
  canvas.height = 116;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(3, 15, 25, .9)';
  ctx.strokeStyle = '#55c8ff';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(5, 5, 510, 106, 14);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#f3f8fb';
  ctx.font = '600 31px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 260, 58);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(4.8, 1.08, 1);
  return sprite;
}

// Geometry primitives --------------------------------------------------------
export function box(size: [number, number, number], position: [number, number, number], material: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function cylinder(radius: number, height: number, position: [number, number, number], material: THREE.Material, segments = 28) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, segments), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function cylinderBetween(a: THREE.Vector3, b: THREE.Vector3, radius: number, material: THREE.Material, segments = 10) {
  const direction = new THREE.Vector3().subVectors(b, a);
  const length = direction.length();
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, segments), material);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function tubePath(points: THREE.Vector3[], radius: number, material: THREE.Material, segments = 86) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.2);
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, segments, radius, 14, false), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function tag(group: THREE.Group, name: string) {
  group.userData.component = name;
  group.traverse(obj => {
    obj.userData.component = name;
  });
}

// Industrial assemblies -----------------------------------------------------
export function addIBeam(group: THREE.Group, position: [number, number, number], size: [number, number, number], material: THREE.Material) {
  const [w, h, d] = size;
  group.add(box([w, 0.18, d], [position[0], position[1] + h / 2, position[2]], material));
  group.add(box([w, 0.18, d], [position[0], position[1] - h / 2, position[2]], material));
  group.add(box([0.16, h, d * 0.72], position, material));
}

export function addHandrail(group: THREE.Group, x1: number, x2: number, y: number, z: number, material: THREE.Material) {
  const railY = y + 1.08;
  group.add(cylinderBetween(new THREE.Vector3(x1, railY, z), new THREE.Vector3(x2, railY, z), 0.05, material, 8));
  group.add(cylinderBetween(new THREE.Vector3(x1, y + 0.56, z), new THREE.Vector3(x2, y + 0.56, z), 0.038, material, 8));
  for (let x = x1; x <= x2 + 0.01; x += 1.35) {
    group.add(cylinderBetween(new THREE.Vector3(x, y, z), new THREE.Vector3(x, railY, z), 0.042, material, 8));
  }
  group.add(box([Math.abs(x2 - x1), 0.13, 0.06], [(x1 + x2) / 2, y + 0.08, z], material));
}

export function addLadder(group: THREE.Group, x: number, y0: number, y1: number, z: number, material: THREE.Material) {
  group.add(cylinderBetween(new THREE.Vector3(x - 0.35, y0, z), new THREE.Vector3(x - 0.35, y1, z), 0.042, material, 8));
  group.add(cylinderBetween(new THREE.Vector3(x + 0.35, y0, z), new THREE.Vector3(x + 0.35, y1, z), 0.042, material, 8));
  for (let y = y0 + 0.32; y < y1; y += 0.38) {
    group.add(cylinderBetween(new THREE.Vector3(x - 0.35, y, z), new THREE.Vector3(x + 0.35, y, z), 0.033, material, 8));
  }
}

export function addGrating(group: THREE.Group, center: [number, number, number], width: number, depth: number, material: THREE.Material) {
  const [cx, cy, cz] = center;
  for (let x = -width / 2; x <= width / 2; x += 0.28) {
    group.add(box([0.035, 0.06, depth], [cx + x, cy, cz], material));
  }
  for (let z = -depth / 2; z <= depth / 2; z += 0.68) {
    group.add(box([width, 0.035, 0.035], [cx, cy + 0.015, cz + z], material));
  }
}

export function addBoltCircle(group: THREE.Group, center: THREE.Vector3, radius: number, count: number, y: number, material: THREE.Material) {
  for (let i = 0; i < count; i += 1) {
    const a = (i / count) * Math.PI * 2;
    group.add(cylinder(0.055, 0.13, [center.x + Math.cos(a) * radius, y, center.z + Math.sin(a) * radius], material, 8));
  }
}

export function addValveWheel(group: THREE.Group, center: THREE.Vector3, radius: number, material: THREE.Material, axis: 'x' | 'y' | 'z' = 'z') {
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.04, 6, 22), material);
  if (axis === 'x') wheel.rotation.y = Math.PI / 2;
  if (axis === 'y') wheel.rotation.x = Math.PI / 2;
  wheel.position.copy(center);
  group.add(wheel);
  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 8), material);
  hub.position.copy(center);
  group.add(hub);
  for (let i = 0; i < 4; i += 1) {
    const a = (i / 4) * Math.PI * 2;
    const end = axis === 'x'
      ? new THREE.Vector3(center.x, center.y + Math.cos(a) * radius * 0.82, center.z + Math.sin(a) * radius * 0.82)
      : axis === 'y'
        ? new THREE.Vector3(center.x + Math.cos(a) * radius * 0.82, center.y, center.z + Math.sin(a) * radius * 0.82)
        : new THREE.Vector3(center.x + Math.cos(a) * radius * 0.82, center.y + Math.sin(a) * radius * 0.82, center.z);
    group.add(cylinderBetween(center, end, 0.022, material, 6));
  }
}

export function addStair(group: THREE.Group, x: number, y0: number, z0: number, steps: number, rise: number, run: number, width: number, tread: THREE.Material, rail: THREE.Material) {
  for (let i = 0; i < steps; i += 1) {
    group.add(box([width, 0.08, run * 0.9], [x, y0 + i * rise, z0 - i * run], tread));
  }
  const topY = y0 + (steps - 1) * rise;
  const topZ = z0 - (steps - 1) * run;
  for (const sx of [-width / 2, width / 2]) {
    group.add(cylinderBetween(new THREE.Vector3(x + sx, y0 - 0.1, z0 + 0.1), new THREE.Vector3(x + sx, topY - 0.1, topZ - 0.1), 0.055, tread, 8));
    group.add(cylinderBetween(new THREE.Vector3(x + sx, y0 + 0.95, z0), new THREE.Vector3(x + sx, topY + 0.95, topZ), 0.045, rail, 8));
  }
}

export function frustum(widthBottom: number, widthTop: number, height: number, depth: number, position: [number, number, number], material: THREE.Material, openFront = false) {
  const wb = widthBottom / 2;
  const wt = widthTop / 2;
  const d = depth / 2;
  const h = height / 2;
  const vertices = new Float32Array([
    -wb, -h, -d, wb, -h, -d, wb, -h, d, -wb, -h, d,
    -wt, h, -d, wt, h, -d, wt, h, d, -wt, h, d,
  ]);
  const indices = openFront ? [
    0, 1, 2, 0, 2, 3,
    4, 6, 5, 4, 7, 6,
    0, 4, 5, 0, 5, 1,
    1, 5, 6, 1, 6, 2,
    3, 7, 4, 3, 4, 0,
  ] : [
    0, 1, 2, 0, 2, 3,
    4, 6, 5, 4, 7, 6,
    0, 4, 5, 0, 5, 1,
    1, 5, 6, 1, 6, 2,
    2, 6, 7, 2, 7, 3,
    3, 7, 4, 3, 4, 0,
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// Animated flame material ----------------------------------------------------
export function makeFlameMaterial(low: string, high: string, opacity: number, seed: number) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uLow: { value: new THREE.Color(low) },
      uHigh: { value: new THREE.Color(high) },
      uOpacity: { value: opacity },
      uSeed: { value: seed },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uSeed;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 p = position;
        float tip = pow(clamp(uv.y, 0.0, 1.0), 1.35);
        float sway = sin(uTime * 4.7 + p.y * 2.3 + uSeed) * 0.13;
        sway += sin(uTime * 8.3 + p.y * 5.1 + uSeed * 1.7) * 0.055;
        sway += sin(uTime * 12.1 + p.y * 7.4 + uSeed * 2.3) * 0.024;
        p.x += sway * (0.08 + tip * 1.35);
        p.z += cos(uTime * 4.1 + p.y * 2.9 + uSeed) * 0.10 * (0.08 + tip * 1.15);
        p.x *= 0.92 + sin(uTime * 6.7 + p.y * 4.0 + uSeed) * 0.075 * tip;
        p.z *= 0.94 + cos(uTime * 7.4 + p.y * 3.7 + uSeed) * 0.065 * tip;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uLow;
      uniform vec3 uHigh;
      uniform float uOpacity;
      uniform float uSeed;
      varying vec2 vUv;
      void main() {
        float bandA = 0.5 + 0.5 * sin(vUv.y * 41.0 - uTime * 10.0 + sin(vUv.x * 23.0 + uSeed));
        float bandB = 0.5 + 0.5 * sin(vUv.y * 19.0 - uTime * 6.2 + cos(vUv.x * 31.0 + uSeed * 1.9));
        float turbulence = mix(bandA, bandB, 0.42);
        float verticalFade = sin(clamp(vUv.y, 0.015, 0.985) * 3.14159265);
        float tipFlicker = 0.72 + 0.28 * sin(uTime * 13.0 + uSeed * 4.0 + vUv.y * 9.0);
        float alpha = (0.16 + turbulence * 0.48) * verticalFade * uOpacity * mix(1.0, tipFlicker, smoothstep(0.45, 1.0, vUv.y));
        vec3 col = mix(uLow, uHigh, smoothstep(0.05, 0.88, vUv.y));
        col *= 0.78 + turbulence * 0.52;
        gl_FragColor = vec4(col, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}

// Background + lifecycle -----------------------------------------------------
export function addIndustrialBackground(scene: THREE.Scene, material: THREE.Material) {
  const background = new THREE.Group();
  const lightMat = new THREE.MeshBasicMaterial({ color: '#ff9a45' });
  const towerPositions = [
    [-20, 11, -24, 1.15], [-14, 8, -20, 0.85], [-9, 14, -27, 1.2],
    [10, 9, -23, 0.9], [16, 13, -28, 1.1], [22, 10, -21, 0.82],
  ] as const;
  for (const [x, h, z, r] of towerPositions) {
    background.add(cylinder(r, h, [x, h / 2 - 0.1, z], material, 18));
    for (let y = 2; y < h; y += 2.6) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 1.03, 0.035, 5, 18), material);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(x, y, z);
      background.add(ring);
    }
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), lightMat);
    beacon.position.set(x, h + 0.15, z);
    background.add(beacon);
  }
  background.add(cylinderBetween(new THREE.Vector3(-22, 4.5, -21), new THREE.Vector3(21, 4.5, -21), 0.16, material, 10));
  background.add(cylinderBetween(new THREE.Vector3(-17, 6.5, -25), new THREE.Vector3(18, 6.5, -25), 0.12, material, 10));
  scene.add(background);
}

export function disposeSceneResources(scene: THREE.Scene, extraTextures: THREE.Texture[]) {
  const disposedGeometries = new Set<THREE.BufferGeometry>();
  const disposedMaterials = new Set<THREE.Material>();
  const disposedTextures = new Set<THREE.Texture>();

  const disposeTexture = (texture: THREE.Texture) => {
    if (disposedTextures.has(texture)) return;
    disposedTextures.add(texture);
    texture.dispose();
  };

  const disposeMaterial = (material: THREE.Material) => {
    if (disposedMaterials.has(material)) return;
    disposedMaterials.add(material);
    Object.values(material).forEach(value => {
      if (value instanceof THREE.Texture) disposeTexture(value);
    });
    if (material instanceof THREE.ShaderMaterial) {
      Object.values(material.uniforms).forEach(uniform => {
        if (uniform?.value instanceof THREE.Texture) disposeTexture(uniform.value);
      });
    }
    material.dispose();
  };

  scene.traverse(object => {
    const renderable = object as THREE.Object3D & {
      geometry?: THREE.BufferGeometry;
      material?: THREE.Material | THREE.Material[];
    };
    if (renderable.geometry instanceof THREE.BufferGeometry && !disposedGeometries.has(renderable.geometry)) {
      disposedGeometries.add(renderable.geometry);
      renderable.geometry.dispose();
    }
    if (renderable.material) {
      const materials = Array.isArray(renderable.material) ? renderable.material : [renderable.material];
      materials.forEach(disposeMaterial);
    }
  });

  extraTextures.forEach(disposeTexture);
}
