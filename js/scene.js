import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.163.0/build/three.module.js';

const COMPANY_POSITIONS = {
  cometcat: [-4.8, 0, -2.4],
  voltra: [4.4, 0, -2.2],
  chattr: [-4.5, 0, 2.8],
  brainforge: [4.2, 0, 2.8],
  boroloop: [-1.8, 0, 4.1],
  starmesh: [2.1, 0, 4.1],
};

function makeRoundedBox(width, height, depth, color) {
  const group = new THREE.Group();
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({ color, roughness: 0.38, metalness: 0.18 })
  );
  group.add(mesh);
  return group;
}

function createRocket() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.28, 1.6, 16),
    new THREE.MeshStandardMaterial({ color: 0xeef7ff, metalness: 0.45, roughness: 0.28 })
  );
  body.position.y = 1.05;
  group.add(body);

  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(0.22, 0.45, 16),
    new THREE.MeshStandardMaterial({ color: 0xffc56e, metalness: 0.2, roughness: 0.5 })
  );
  nose.position.y = 2.05;
  group.add(nose);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.48, 0.55, 0.25, 18),
    new THREE.MeshStandardMaterial({ color: 0x2d3956, metalness: 0.25, roughness: 0.7 })
  );
  base.position.y = 0.12;
  group.add(base);

  return group;
}

function createCar() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 0.4, 0.7),
    new THREE.MeshStandardMaterial({ color: 0x7cf4c0, metalness: 0.2, roughness: 0.4 })
  );
  body.position.y = 0.45;
  group.add(body);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.32, 0.62),
    new THREE.MeshStandardMaterial({ color: 0xb8fff0, metalness: 0.18, roughness: 0.35 })
  );
  cabin.position.set(0.08, 0.7, 0);
  group.add(cabin);

  for (const x of [-0.4, 0.42]) {
    for (const z of [-0.34, 0.34]) {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.16, 0.12, 16),
        new THREE.MeshStandardMaterial({ color: 0x1b2031, roughness: 0.8 })
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.18, z);
      group.add(wheel);
    }
  }

  return group;
}

function createBillboard() {
  const group = new THREE.Group();
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 1.4, 10),
    new THREE.MeshStandardMaterial({ color: 0x9faecc, metalness: 0.25, roughness: 0.6 })
  );
  pole.position.y = 0.7;
  group.add(pole);

  const board = new THREE.Mesh(
    new THREE.BoxGeometry(1.35, 0.72, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x79b4ff, emissive: 0x244b88, emissiveIntensity: 0.55 })
  );
  board.position.y = 1.45;
  group.add(board);

  return group;
}

function createChip() {
  const group = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.18, 1.1),
    new THREE.MeshStandardMaterial({ color: 0x876dff, metalness: 0.3, roughness: 0.4 })
  );
  base.position.y = 0.12;
  group.add(base);

  const core = new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 0.2, 0.58),
    new THREE.MeshStandardMaterial({ color: 0xc7bbff, emissive: 0x7153ff, emissiveIntensity: 0.5 })
  );
  core.position.y = 0.26;
  group.add(core);

  return group;
}

function createTunnel() {
  const group = new THREE.Group();
  const ringMaterial = new THREE.MeshStandardMaterial({ color: 0xff889e, metalness: 0.22, roughness: 0.55 });
  for (let i = 0; i < 4; i += 1) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.1, 10, 20), ringMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 0.4, i * 0.42);
    group.add(ring);
  }
  return group;
}

function createSatellite() {
  const group = new THREE.Group();
  const stand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.1, 0.9, 12),
    new THREE.MeshStandardMaterial({ color: 0xa3ffd9, metalness: 0.35, roughness: 0.35 })
  );
  stand.position.y = 0.45;
  group.add(stand);

  const dish = new THREE.Mesh(
    new THREE.SphereGeometry(0.54, 18, 18, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xd9fff2, metalness: 0.25, roughness: 0.25 })
  );
  dish.rotation.x = -Math.PI / 2.5;
  dish.position.y = 1.0;
  group.add(dish);

  return group;
}

function createFactory(type) {
  switch (type) {
    case 'rocket': return createRocket();
    case 'car': return createCar();
    case 'billboard': return createBillboard();
    case 'chip': return createChip();
    case 'tunnel': return createTunnel();
    case 'satellite': return createSatellite();
    default: return makeRoundedBox(1, 1, 1, 0xffffff);
  }
}

export class PocketEmpireScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    this.camera.position.set(0, 9.5, 13.5);
    this.camera.lookAt(0, 2.2, 0);

    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.root = new THREE.Group();
    this.city = new THREE.Group();
    this.props = new Map();
    this.running = false;
    this.rotationTarget = 0.55;
    this.rotationCurrent = 0.55;
    this.tapCallback = null;
    this.dragState = null;

    this.setupScene();
    this.bind();
  }

  setupScene() {
    this.scene.add(this.root);
    this.root.add(this.city);

    const hemi = new THREE.HemisphereLight(0xbfd9ff, 0x223049, 1.25);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xffffff, 1.8);
    sun.position.set(6, 10, 5);
    this.scene.add(sun);

    const ambience = new THREE.PointLight(0x88d8ff, 24, 30, 1.6);
    ambience.position.set(0, 6, 0);
    this.scene.add(ambience);

    const ground = new THREE.Mesh(
      new THREE.CylinderGeometry(8, 9.5, 0.8, 50),
      new THREE.MeshStandardMaterial({ color: 0x0f2138, roughness: 0.9, metalness: 0.06 })
    );
    ground.position.y = -0.4;
    this.root.add(ground);

    const glow = new THREE.Mesh(
      new THREE.CylinderGeometry(7.7, 7.7, 0.02, 40),
      new THREE.MeshBasicMaterial({ color: 0x183962, transparent: true, opacity: 0.55 })
    );
    glow.position.y = 0.01;
    this.root.add(glow);

    const hqBase = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.7, 0.35, 20),
      new THREE.MeshStandardMaterial({ color: 0x213858, roughness: 0.65, metalness: 0.2 })
    );
    hqBase.position.y = 0.18;
    this.city.add(hqBase);

    this.hqTower = new THREE.Group();
    const tower = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 1.1, 4.1, 18),
      new THREE.MeshStandardMaterial({ color: 0x79b4ff, emissive: 0x1f4b8c, emissiveIntensity: 0.4, roughness: 0.35, metalness: 0.28 })
    );
    tower.position.y = 2.2;
    this.hqTower.add(tower);

    const crown = new THREE.Mesh(
      new THREE.ConeGeometry(0.78, 1.08, 18),
      new THREE.MeshStandardMaterial({ color: 0xa0f0ff, emissive: 0x4da2e1, emissiveIntensity: 0.48, roughness: 0.2, metalness: 0.35 })
    );
    crown.position.y = 4.75;
    this.hqTower.add(crown);

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(1.15, 0.08, 10, 26),
      new THREE.MeshBasicMaterial({ color: 0x8fe6ff, transparent: true, opacity: 0.78 })
    );
    halo.rotation.x = Math.PI / 2;
    halo.position.y = 4.1;
    this.hqTower.add(halo);

    this.hqTower.userData.tapTarget = true;
    this.city.add(this.hqTower);

    for (let i = 0; i < 20; i += 1) {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 1 + Math.random() * 3.2, 0.7),
        new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.56 + Math.random() * 0.1, 0.55, 0.3 + Math.random() * 0.18), roughness: 0.7, metalness: 0.1 })
      );
      box.position.set(
        (Math.random() - 0.5) * 10,
        box.geometry.parameters.height / 2,
        (Math.random() - 0.5) * 10
      );
      if (box.position.length() < 3.1) box.position.multiplyScalar(1.55);
      this.city.add(box);
    }

    const stars = new THREE.BufferGeometry();
    const starCount = 200;
    const positions = [];
    for (let i = 0; i < starCount; i += 1) {
      positions.push((Math.random() - 0.5) * 60, 8 + Math.random() * 22, (Math.random() - 0.5) * 60);
    }
    stars.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const starPoints = new THREE.Points(
      stars,
      new THREE.PointsMaterial({ color: 0xcde9ff, size: 0.12, transparent: true, opacity: 0.85 })
    );
    this.scene.add(starPoints);
  }

  bind() {
    window.addEventListener('resize', () => this.handleResize());

    const onPointerDown = (event) => {
      const point = this.getLocalPoint(event);
      this.dragState = {
        startX: point.x,
        startY: point.y,
        lastX: point.x,
        moved: false,
      };
    };

    const onPointerMove = (event) => {
      if (!this.dragState) return;
      const point = this.getLocalPoint(event);
      const dx = point.x - this.dragState.lastX;
      const distance = Math.hypot(point.x - this.dragState.startX, point.y - this.dragState.startY);
      if (distance > 6) this.dragState.moved = true;
      this.rotationTarget += dx * 0.008;
      this.rotationTarget = THREE.MathUtils.clamp(this.rotationTarget, -0.45, 1.55);
      this.dragState.lastX = point.x;
    };

    const onPointerUp = (event) => {
      if (!this.dragState) return;
      const point = this.getLocalPoint(event);
      const wasMoved = this.dragState.moved || Math.hypot(point.x - this.dragState.startX, point.y - this.dragState.startY) > 6;
      this.dragState = null;
      if (!wasMoved) this.tryTap(event);
    };

    this.canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }

  getLocalPoint(event) {
    if (event.touches && event.touches[0]) {
      return { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }
    return { x: event.clientX, y: event.clientY };
  }

  tryTap(event) {
    const rect = this.canvas.getBoundingClientRect();
    const point = this.getLocalPoint(event);
    this.pointer.x = ((point.x - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((point.y - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObjects(this.hqTower.children, true);
    if (intersects.length > 0) {
      this.bumpTower();
      this.tapCallback?.();
    }
  }

  bumpTower() {
    this.hqTower.scale.setScalar(1.08);
  }

  handleResize() {
    const width = this.canvas.clientWidth || this.canvas.parentElement.clientWidth;
    const height = this.canvas.clientHeight || this.canvas.parentElement.clientHeight;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  onTap(callback) {
    this.tapCallback = callback;
  }

  ensureProp(companyId, companyType) {
    if (this.props.has(companyId)) return this.props.get(companyId);
    const mesh = createFactory(companyType);
    const [x, y, z] = COMPANY_POSITIONS[companyId];
    mesh.position.set(x, y, z);
    this.city.add(mesh);
    this.props.set(companyId, mesh);
    return mesh;
  }

  update(state, companyViews) {
    for (const company of companyViews) {
      const prop = this.ensureProp(company.id, company.sceneType);
      const visible = company.owned > 0;
      prop.visible = visible;
      if (!visible) continue;

      const scale = 0.85 + Math.min(company.owned, 25) * 0.032 + company.level * 0.012;
      prop.scale.setScalar(scale);
      prop.position.y = company.sceneType === 'tunnel' ? 0.08 : 0;
      prop.rotation.y += 0.004 + company.owned * 0.0002;

      if (company.sceneType === 'rocket') {
        prop.position.y = Math.sin(performance.now() * 0.0012) * 0.08;
      }
      if (company.sceneType === 'car') {
        prop.rotation.y = Math.sin(performance.now() * 0.001) * 0.2;
      }
      if (company.sceneType === 'satellite') {
        prop.rotation.z = Math.sin(performance.now() * 0.0015) * 0.05;
      }
    }

    const towerHeight = 1 + Math.min(state.hypeLevel, 18) * 0.018;
    this.hqTower.scale.lerp(new THREE.Vector3(towerHeight, towerHeight, towerHeight), 0.08);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.clock.start();
    const renderLoop = () => {
      if (!this.running) return;
      const elapsed = this.clock.getElapsedTime();
      this.rotationCurrent += (this.rotationTarget - this.rotationCurrent) * 0.08;
      this.city.rotation.y = this.rotationCurrent;
      this.hqTower.rotation.y = elapsed * 0.35;
      this.hqTower.children[2].rotation.z += 0.015;
      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(renderLoop);
    };
    renderLoop();
  }

  stop() {
    this.running = false;
  }
}
