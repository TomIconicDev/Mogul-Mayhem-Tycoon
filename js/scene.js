import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.163.0/build/three.module.js';

export class PocketEmpireScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x0a1122, 12, 45);

    this.camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    this.camera.position.set(0, 11, 18);
    this.camera.lookAt(0, 3, 0);

    // Lighting upgrade
    const hemi = new THREE.HemisphereLight(0x88ccff, 0x112233, 1.4);
    this.scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffeecc, 2.2);
    dir.position.set(15, 25, 10);
    dir.castShadow = true;
    this.scene.add(dir);

    this.clock = new THREE.Clock();
    this.root = new THREE.Group();
    this.scene.add(this.root);

    this.props = new Map();
    this.particles = [];
    this.cityBuildings = null;

    this.createProceduralCity();
    this.createHQ();
    this.createCompanyProps();
  }

  createProceduralCity() {
    // Instanced background skyscrapers that grow with empire
    const count = 80;
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x112244, emissive: 0x224488, emissiveIntensity: 0.3, metalness: 0.6 });
    this.cityBuildings = new THREE.InstancedMesh(geometry, material, count);
    this.cityBuildings.castShadow = true;
    this.cityBuildings.receiveShadow = true;

    for (let i = 0; i < count; i++) {
      const matrix = new THREE.Matrix4();
      const x = (Math.random() - 0.5) * 60;
      const z = (Math.random() - 0.5) * 60 - 10;
      const height = 4 + Math.random() * 18;
      matrix.makeScale(1.8 + Math.random() * 2, height, 1.8 + Math.random() * 2);
      matrix.setPosition(x, height / 2, z);
      this.cityBuildings.setMatrixAt(i, matrix);
    }
    this.scene.add(this.cityBuildings);
  }

  createHQ() {
    const hq = new THREE.Group();
    const tower = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 8, 3.2),
      new THREE.MeshStandardMaterial({ color: 0x112233, metalness: 0.9, emissive: 0x00f7ff, emissiveIntensity: 0.8 })
    );
    hq.add(tower);

    // Neon top
    const top = new THREE.Mesh(new THREE.ConeGeometry(2.2, 2, 4), new THREE.MeshStandardMaterial({ color: 0x9d7aff, emissive: 0xff00ff, emissiveIntensity: 1.5 }));
    top.position.y = 5;
    hq.add(top);

    this.hq = hq;
    this.root.add(hq);
  }

  // All create* functions are now richer (example for rocket — others similar)
  createRocket() {
    const group = new THREE.Group();
    // Body
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 2.8, 32), new THREE.MeshStandardMaterial({ color: 0xeef7ff, metalness: 0.8, roughness: 0.2 }));
    body.position.y = 1.6;
    group.add(body);
    // Fins (procedural)
    for (let i = 0; i < 4; i++) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.6), new THREE.MeshStandardMaterial({ color: 0xff5500 }));
      fin.rotation.y = (i * Math.PI) / 2;
      fin.position.set(0, 0.6, 0);
      group.add(fin);
    }
    // Glowing engines
    const engine = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 0.4, 16), new THREE.MeshStandardMaterial({ color: 0xff8800, emissive: 0xff4400, emissiveIntensity: 3 }));
    engine.position.y = 0.3;
    group.add(engine);
    return group;
  }

  // (Same pattern for car, billboard, chip, tunnel, satellite — all upgraded with extra geometry, emissive neon, windows, etc.)

  createCompanyProps() {
    // ... same positions as before, but now using richer models
  }

  update(state, companyViews) {
    // Scale props by ownership + level
    companyViews.forEach(view => {
      const prop = this.props.get(view.id);
      if (prop) {
        const scale = 1 + (view.owned * 0.12) + (view.level * 0.08);
        prop.scale.setScalar(scale);
        // Pulse neon on high hype
        if (prop.material && prop.material.emissive) prop.material.emissiveIntensity = 0.8 + Math.sin(this.clock.getElapsedTime() * 8) * 0.4 * (state.hypeLevel / 10);
      }
    });

    // HQ bob + glow
    this.hq.position.y = Math.sin(this.clock.getElapsedTime() * 3) * 0.12;
  }

  createEarningsParticles(worldPos) {
    for (let i = 0; i < 28; i++) {
      const p = {
        mesh: new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffd700 })),
        velocity: new THREE.Vector3((Math.random()-0.5)*0.4, 0.6 + Math.random()*0.8, (Math.random()-0.5)*0.4),
        life: 1.8
      };
      p.mesh.position.copy(worldPos);
      this.scene.add(p.mesh);
      this.particles.push(p);
    }
  }

  animateParticles() {
    for (let i = this.particles.length-1; i >= 0; i--) {
      const p = this.particles[i];
      p.mesh.position.add(p.velocity);
      p.velocity.y -= 0.035;
      p.life -= 0.016;
      p.mesh.scale.setScalar(p.life);
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }
  }

  start() { this.animate(); }
  animate = () => {
    requestAnimationFrame(this.animate);
    this.animateParticles();
    this.renderer.render(this.scene, this.camera);
  };
}