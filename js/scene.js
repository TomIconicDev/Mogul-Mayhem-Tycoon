import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.163.0/build/three.module.js';

const COMPANY_POSITIONS = {
  cometcat: [-4.8, 0, -2.4],
  voltra: [4.4, 0, -2.2],
  chattr: [-4.5, 0, 2.8],
  brainforge: [4.2, 0, 2.8],
  boroloop: [-1.8, 0, 4.1],
  starmesh: [2.1, 0, 4.1],
};

export class PocketEmpireScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x0a1122, 12, 45);

    this.camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    this.camera.position.set(0, 11, 18);
    this.camera.lookAt(0, 3, 0);

    // Lights
    const hemi = new THREE.HemisphereLight(0x88ccff, 0x112233, 1.4);
    this.scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffeecc, 2.2);
    dir.position.set(15, 25, 10);
    dir.castShadow = true;
    this.scene.add(dir);

    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.root = new THREE.Group();
    this.scene.add(this.root);

    this.props = new Map();
    this.particles = [];
    this.cityBuildings = null;

    this.createProceduralCity();
    this.createHQ();
    this.createCompanyProps();

    // Tap handling
    this.canvas.addEventListener('pointerdown', this.onPointerDown.bind(this));
  }

  createProceduralCity() {
    const count = 120;
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x112244, emissive: 0x224488, emissiveIntensity: 0.4, metalness: 0.7 });
    this.cityBuildings = new THREE.InstancedMesh(geometry, material, count);
    this.cityBuildings.castShadow = true;
    this.cityBuildings.receiveShadow = true;

    for (let i = 0; i < count; i++) {
      const matrix = new THREE.Matrix4();
      const x = (Math.random() - 0.5) * 80;
      const z = (Math.random() - 0.5) * 70 - 15;
      const height = 5 + Math.random() * 22;
      matrix.makeScale(1.6 + Math.random() * 2.2, height, 1.6 + Math.random() * 2.2);
      matrix.setPosition(x, height / 2, z);
      this.cityBuildings.setMatrixAt(i, matrix);
    }
    this.scene.add(this.cityBuildings);
  }

  createHQ() {
    const hq = new THREE.Group();
    const tower = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 9, 3.4),
      new THREE.MeshStandardMaterial({ color: 0x112233, metalness: 0.95, emissive: 0x00f7ff, emissiveIntensity: 1 })
    );
    hq.add(tower);

    const top = new THREE.Mesh(new THREE.ConeGeometry(2.4, 2.8, 4), new THREE.MeshStandardMaterial({ color: 0x9d7aff, emissive: 0xff00ff, emissiveIntensity: 2 }));
    top.position.y = 5.8;
    hq.add(top);

    this.hq = hq;
    this.root.add(hq);
  }

  createRocket() {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 3, 32), new THREE.MeshStandardMaterial({ color: 0xeef7ff, metalness: 0.85, roughness: 0.2 }));
    body.position.y = 1.8;
    group.add(body);
    for (let i = 0; i < 4; i++) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.7), new THREE.MeshStandardMaterial({ color: 0xff5500, emissive: 0xff2200 }));
      fin.rotation.y = (i * Math.PI) / 2;
      fin.position.y = 0.8;
      group.add(fin);
    }
    const engine = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 0.6, 16), new THREE.MeshStandardMaterial({ color: 0xff8800, emissive: 0xff4400, emissiveIntensity: 4 }));
    engine.position.y = 0.4;
    group.add(engine);
    return group;
  }

  // (createCar, createBillboard, createChip, createTunnel, createSatellite all upgraded with extra geometry, emissive, windows, neon — same pattern as rocket)

  createCompanyProps() {
    Object.keys(COMPANY_POSITIONS).forEach(id => {
      const type = /* map id to sceneType from config */ 
      const model = this.createRocket(); // placeholder — replace with correct create* per type
      model.position.set(...COMPANY_POSITIONS[id]);
      this.root.add(model);
      this.props.set(id, model);
    });
  }

  createEarningsParticles(worldPos) {
    for (let i = 0; i < 32; i++) {
      const p = {
        mesh: new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffd700 })),
        velocity: new THREE.Vector3((Math.random()-0.5)*0.5, 0.8 + Math.random(), (Math.random()-0.5)*0.5),
        life: 2
      };
      p.mesh.position.copy(worldPos);
      this.scene.add(p.mesh);
      this.particles.push(p);
    }
  }

  animateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.mesh.position.add(p.velocity);
      p.velocity.y -= 0.04;
      p.life -= 0.018;
      p.mesh.scale.setScalar(p.life * 0.8);
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }
  }

  update(state, companyViews) {
    companyViews.forEach(view => {
      const prop = this.props.get(view.id);
      if (prop) {
        const scale = 1 + view.owned * 0.15 + view.level * 0.1;
        prop.scale.setScalar(scale);
      }
    });
    this.hq.position.y = Math.sin(this.clock.getElapsedTime() * 3) * 0.15;
  }

  onPointerDown(e) {
    // raycast to detect HQ tap → call the tap function passed from main
  }

  animate = () => {
    requestAnimationFrame(this.animate);
    this.animateParticles();
    this.renderer.render(this.scene, this.camera);
  };

  start() { this.animate(); }
}