import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.163.0/build/three.module.js";

export class PocketEmpireScene {
  constructor({ mount, onHqTap }) {
    this.mount = mount;
    this.onHqTap = onHqTap;
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0xe9f2ff, 18, 48);

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
    this.cameraTarget = new THREE.Vector3(0, 4.5, 0);
    this.cameraAngle = -0.5;
    this.targetCameraAngle = -0.5;
    this.cameraRadius = 15;
    this.cameraHeight = 8.4;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(mount.clientWidth, mount.clientHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    mount.appendChild(this.renderer.domElement);

    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.interactiveMeshes = [];
    this.particlePool = [];
    this.stateVisuals = {
      valuation: 0,
      companyLevels: {},
    };

    this.drag = {
      active: false,
      moved: false,
      startX: 0,
      lastX: 0,
      totalDelta: 0,
    };

    this.setupLights();
    this.setupWorld();
    this.setupPointer();
    this.resize();

    window.addEventListener("resize", () => this.resize(), { passive: true });
  }

  setupLights() {
    const hemi = new THREE.HemisphereLight(0xf8fdff, 0xcad7ea, 1.2);
    this.scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xffffff, 1.7);
    dir.position.set(6, 14, 9);
    dir.castShadow = true;
    dir.shadow.mapSize.set(1024, 1024);
    dir.shadow.camera.left = -18;
    dir.shadow.camera.right = 18;
    dir.shadow.camera.top = 18;
    dir.shadow.camera.bottom = -18;
    dir.shadow.camera.near = 1;
    dir.shadow.camera.far = 40;
    dir.shadow.bias = -0.00025;
    this.scene.add(dir);

    this.sunLight = dir;
  }

  setupWorld() {
    const world = new THREE.Group();
    this.world = world;
    this.scene.add(world);

    const ground = new THREE.Mesh(
      new THREE.CylinderGeometry(11, 12.2, 0.9, 48),
      new THREE.MeshStandardMaterial({
        color: 0xf6fbff,
        roughness: 0.78,
        metalness: 0.05,
      })
    );
    ground.receiveShadow = true;
    ground.position.y = -0.46;
    world.add(ground);

    const platformTrim = new THREE.Mesh(
      new THREE.TorusGeometry(10.2, 0.18, 14, 80),
      new THREE.MeshStandardMaterial({
        color: 0x89d7d7,
        emissive: 0x5cd3d3,
        emissiveIntensity: 0.32,
        roughness: 0.42,
        metalness: 0.65,
      })
    );
    platformTrim.rotation.x = Math.PI * 0.5;
    platformTrim.position.y = -0.02;
    world.add(platformTrim);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(28, 80),
      new THREE.MeshStandardMaterial({
        color: 0xeaf2ff,
        roughness: 0.98,
        metalness: 0.02,
      })
    );
    floor.rotation.x = -Math.PI * 0.5;
    floor.position.y = -0.95;
    floor.receiveShadow = true;
    world.add(floor);

    this.createSkyline();
    this.createHQ();
    this.createProps();
    this.createParticles();
  }

  createSkyline() {
    const count = 120;
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0xdbe8ff,
      roughness: 0.82,
      metalness: 0.18,
    });

    const mesh = new THREE.InstancedMesh(geometry, material, count);
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.skyline = mesh;
    this.skylineData = [];

    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const position = new THREE.Vector3();

    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.08;
      const ring = i < count * 0.5 ? 15 + Math.random() * 4 : 20 + Math.random() * 7;
      const x = Math.cos(angle) * ring;
      const z = Math.sin(angle) * ring;
      const baseHeight = 2.5 + Math.random() * 10;
      const width = 0.8 + Math.random() * 1.4;
      const depth = 0.8 + Math.random() * 1.6;

      this.skylineData.push({
        x,
        z,
        width,
        depth,
        baseHeight,
        targetHeight: 1,
        currentHeight: 1,
      });

      position.set(x, 0, z);
      scale.set(width, 0.05, depth);
      matrix.compose(position, quaternion, scale);
      mesh.setMatrixAt(i, matrix);
    }

    this.scene.add(mesh);
  }

  createHQ() {
    const group = new THREE.Group();
    this.hqGroup = group;

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 2.8, 0.7, 10),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.5,
        metalness: 0.4,
      })
    );
    base.castShadow = true;
    base.receiveShadow = true;
    base.position.y = 0.1;
    group.add(base);

    const tower = new THREE.Mesh(
      new THREE.CylinderGeometry(1.55, 1.92, 5.8, 9),
      new THREE.MeshStandardMaterial({
        color: 0xfafcff,
        roughness: 0.25,
        metalness: 0.78,
        emissive: 0x4bbdc7,
        emissiveIntensity: 0.05,
      })
    );
    tower.position.y = 3.15;
    tower.castShadow = true;
    tower.receiveShadow = true;
    group.add(tower);

    const towerInset = new THREE.Mesh(
      new THREE.CylinderGeometry(1.22, 1.4, 4.8, 9),
      new THREE.MeshStandardMaterial({
        color: 0xbfd4ff,
        roughness: 0.08,
        metalness: 0.95,
        emissive: 0x7cafff,
        emissiveIntensity: 0.22,
      })
    );
    towerInset.position.y = 3.3;
    group.add(towerInset);

    const crown = new THREE.Mesh(
      new THREE.CylinderGeometry(1.05, 1.3, 0.95, 9),
      new THREE.MeshStandardMaterial({
        color: 0xfff8e9,
        roughness: 0.12,
        metalness: 0.8,
        emissive: 0xffd66f,
        emissiveIntensity: 0.25,
      })
    );
    crown.position.y = 6.6;
    crown.castShadow = true;
    group.add(crown);

    const antenna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.12, 1.6, 8),
      new THREE.MeshStandardMaterial({
        color: 0xeef5ff,
        roughness: 0.15,
        metalness: 0.8,
      })
    );
    antenna.position.y = 7.7;
    group.add(antenna);

    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 16, 16),
      new THREE.MeshStandardMaterial({
        color: 0xffefc7,
        emissive: 0xffda7c,
        emissiveIntensity: 1.3,
        roughness: 0.2,
        metalness: 0.35,
      })
    );
    beacon.position.y = 8.65;
    group.add(beacon);

    const hitTarget = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.6, 8.6, 12),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitTarget.position.y = 3.8;
    group.add(hitTarget);
    this.interactiveMeshes.push(hitTarget);

    this.scene.add(group);
    this.hqHitTarget = hitTarget;
  }

  createProps() {
    this.propGroups = {};
    const entries = [
      { key: "cometcat", angle: -0.25, radius: 6.4, builder: () => this.buildCometCat() },
      { key: "voltra", angle: 0.8, radius: 6.1, builder: () => this.buildVoltra() },
      { key: "chattr", angle: 1.92, radius: 6.3, builder: () => this.buildChattr() },
      { key: "brainforge", angle: 3.1, radius: 6.1, builder: () => this.buildBrainForge() },
      { key: "boroloop", angle: 4.18, radius: 6.5, builder: () => this.buildBoroLoop() },
      { key: "starmesh", angle: 5.23, radius: 6.25, builder: () => this.buildStarMesh() },
    ];

    for (const entry of entries) {
      const group = entry.builder();
      group.position.set(Math.cos(entry.angle) * entry.radius, 0.15, Math.sin(entry.angle) * entry.radius);
      group.userData.baseY = group.position.y;
      group.rotation.y = -entry.angle + Math.PI * 0.5;
      group.scale.setScalar(0.24);
      this.scene.add(group);
      this.propGroups[entry.key] = {
        group,
        targetScale: 0.24,
        bobOffset: Math.random() * Math.PI * 2,
      };
    }
  }

  buildCometCat() {
    const group = new THREE.Group();

    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.34, 2.2, 14),
      new THREE.MeshStandardMaterial({ color: 0xf8fbff, roughness: 0.18, metalness: 0.82 })
    );
    body.rotation.z = Math.PI * 0.5;
    body.castShadow = true;
    group.add(body);

    const nose = new THREE.Mesh(
      new THREE.ConeGeometry(0.24, 0.52, 14),
      new THREE.MeshStandardMaterial({ color: 0x8ec6ff, roughness: 0.18, metalness: 0.72 })
    );
    nose.rotation.z = -Math.PI * 0.5;
    nose.position.x = 1.34;
    nose.castShadow = true;
    group.add(nose);

    const finMat = new THREE.MeshStandardMaterial({ color: 0x4bbdc7, roughness: 0.38, metalness: 0.65 });
    for (const y of [-0.36, 0.36]) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.46, 0.12), finMat);
      fin.position.set(-0.74, y, 0);
      fin.castShadow = true;
      group.add(fin);
    }

    const engine = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.2, 0.26, 12),
      new THREE.MeshStandardMaterial({
        color: 0xfff0c8,
        emissive: 0xffb755,
        emissiveIntensity: 1.2,
        roughness: 0.32,
        metalness: 0.35,
      })
    );
    engine.rotation.z = Math.PI * 0.5;
    engine.position.x = -1.22;
    group.add(engine);

    return group;
  }

  buildVoltra() {
    const group = new THREE.Group();

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 0.42, 0.8),
      new THREE.MeshStandardMaterial({ color: 0xf6fbff, roughness: 0.24, metalness: 0.68 })
    );
    body.position.y = 0.4;
    body.castShadow = true;
    group.add(body);

    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.3, 0.72),
      new THREE.MeshStandardMaterial({ color: 0xa7d8ff, roughness: 0.12, metalness: 0.88 })
    );
    cabin.position.set(0.05, 0.72, 0);
    cabin.castShadow = true;
    group.add(cabin);

    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x35425f, roughness: 0.8, metalness: 0.2 });
    const wheelGeometry = new THREE.CylinderGeometry(0.18, 0.18, 0.16, 16);
    for (const x of [-0.54, 0.54]) {
      for (const z of [-0.4, 0.4]) {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.z = Math.PI * 0.5;
        wheel.position.set(x, 0.18, z);
        wheel.castShadow = true;
        group.add(wheel);
      }
    }

    return group;
  }

  buildChattr() {
    const group = new THREE.Group();

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.16, 1.8, 12),
      new THREE.MeshStandardMaterial({ color: 0xeef5ff, roughness: 0.35, metalness: 0.7 })
    );
    pole.position.y = 0.9;
    pole.castShadow = true;
    group.add(pole);

    const board = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 0.98, 0.1),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0x7f9bff,
        emissiveIntensity: 0.22,
        roughness: 0.18,
        metalness: 0.68,
      })
    );
    board.position.y = 1.65;
    board.castShadow = true;
    group.add(board);

    const glowBar = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.18, 0.04),
      new THREE.MeshStandardMaterial({
        color: 0xfff3c5,
        emissive: 0xffcf73,
        emissiveIntensity: 0.95,
        roughness: 0.22,
        metalness: 0.25,
      })
    );
    glowBar.position.set(0, 1.68, 0.08);
    group.add(glowBar);

    return group;
  }

  buildBrainForge() {
    const group = new THREE.Group();

    const core = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 1.1, 0.3),
      new THREE.MeshStandardMaterial({
        color: 0xf8fbff,
        roughness: 0.14,
        metalness: 0.88,
        emissive: 0x66f0ff,
        emissiveIntensity: 0.2,
      })
    );
    core.position.y = 0.75;
    core.castShadow = true;
    group.add(core);

    const pinMaterial = new THREE.MeshStandardMaterial({ color: 0xd2dfff, roughness: 0.25, metalness: 0.92 });
    for (let i = 0; i < 5; i += 1) {
      const offset = -0.4 + i * 0.2;
      for (const side of [-0.72, 0.72]) {
        const pin = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.07, 0.07), pinMaterial);
        pin.position.set(side, 0.3 + i * 0.18, offset);
        pin.castShadow = true;
        group.add(pin);
      }
    }

    return group;
  }

  buildBoroLoop() {
    const group = new THREE.Group();

    const loopMaterial = new THREE.MeshStandardMaterial({
      color: 0xfff7e1,
      roughness: 0.22,
      metalness: 0.88,
      emissive: 0xffd36a,
      emissiveIntensity: 0.16,
    });

    for (let i = 0; i < 3; i += 1) {
      const loop = new THREE.Mesh(new THREE.TorusGeometry(0.64 + i * 0.16, 0.08, 12, 44), loopMaterial);
      loop.rotation.y = Math.PI * 0.5;
      loop.position.set(i * 0.28, 0.7, 0);
      loop.castShadow = true;
      group.add(loop);
    }

    return group;
  }

  buildStarMesh() {
    const group = new THREE.Group();

    const core = new THREE.Mesh(
      new THREE.BoxGeometry(0.56, 0.56, 0.56),
      new THREE.MeshStandardMaterial({ color: 0xf8fbff, roughness: 0.18, metalness: 0.84 })
    );
    core.position.y = 0.82;
    core.castShadow = true;
    group.add(core);

    const armMaterial = new THREE.MeshStandardMaterial({ color: 0xb8d1ff, roughness: 0.2, metalness: 0.8 });
    const panelMaterial = new THREE.MeshStandardMaterial({
      color: 0x4968b8,
      roughness: 0.32,
      metalness: 0.45,
      emissive: 0x5d8dff,
      emissiveIntensity: 0.12,
    });

    for (const x of [-1.08, 1.08]) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.08, 0.08), armMaterial);
      arm.position.set(x * 0.52, 0.82, 0);
      group.add(arm);

      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.42, 0.04), panelMaterial);
      panel.position.set(x, 0.82, 0);
      panel.castShadow = true;
      group.add(panel);
    }

    const dish = new THREE.Mesh(
      new THREE.ConeGeometry(0.28, 0.22, 18),
      new THREE.MeshStandardMaterial({ color: 0xfff2cf, roughness: 0.22, metalness: 0.42 })
    );
    dish.rotation.z = Math.PI * 0.5;
    dish.position.set(0, 1.22, 0.2);
    group.add(dish);

    return group;
  }

  createParticles() {
    const geometry = new THREE.SphereGeometry(0.09, 10, 10);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffe7a4,
      emissive: 0xffc759,
      emissiveIntensity: 0.85,
      roughness: 0.32,
      metalness: 0.16,
    });

    for (let i = 0; i < 180; i += 1) {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.visible = false;
      this.scene.add(mesh);
      this.particlePool.push({
        mesh,
        alive: false,
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 1,
      });
    }
  }

  setupPointer() {
    const canvas = this.renderer.domElement;

    const onPointerDown = (event) => {
      this.drag.active = true;
      this.drag.moved = false;
      this.drag.startX = event.clientX;
      this.drag.lastX = event.clientX;
      this.drag.totalDelta = 0;
    };

    const onPointerMove = (event) => {
      if (!this.drag.active) return;
      const delta = event.clientX - this.drag.lastX;
      this.drag.lastX = event.clientX;
      this.drag.totalDelta += Math.abs(delta);
      if (Math.abs(delta) > 0.6) {
        this.drag.moved = true;
      }
      this.targetCameraAngle -= delta * 0.006;
    };

    const onPointerUp = (event) => {
      if (!this.drag.active) return;

      const wasTap = this.drag.totalDelta < 10;
      this.drag.active = false;

      if (wasTap) {
        const rect = canvas.getBoundingClientRect();
        this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const intersections = this.raycaster.intersectObjects(this.interactiveMeshes, false);
        if (intersections.length > 0 && typeof this.onHqTap === "function") {
          this.onHqTap({ x: event.clientX, y: event.clientY });
        }
      }
    };

    canvas.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointercancel", () => {
      this.drag.active = false;
    }, { passive: true });
  }

  resize() {
    const width = Math.max(1, this.mount.clientWidth);
    const height = Math.max(1, this.mount.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  setVisualState({ valuation, companyLevels }) {
    this.stateVisuals.valuation = valuation;
    this.stateVisuals.companyLevels = { ...companyLevels };
  }

  spawnEarningsBurst(intensity = 1) {
    const origin = new THREE.Vector3(0, 7.2, 0);
    let spawned = 0;

    for (const particle of this.particlePool) {
      if (spawned >= Math.round(10 + intensity * 3)) break;
      if (particle.alive) continue;
      particle.alive = true;
      particle.life = 0;
      particle.maxLife = 0.85 + Math.random() * 0.45;
      particle.mesh.visible = true;
      particle.mesh.position.copy(origin).add(
        new THREE.Vector3((Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.8)
      );
      particle.mesh.scale.setScalar(0.85 + Math.random() * 0.8);
      particle.velocity.set((Math.random() - 0.5) * 1.4, 1.9 + Math.random() * 1.4, (Math.random() - 0.5) * 1.4);
      spawned += 1;
    }
  }

  update(delta) {
    const time = performance.now() * 0.001;
    this.cameraAngle += (this.targetCameraAngle - this.cameraAngle) * Math.min(1, delta * 5.2);

    this.camera.position.set(
      Math.cos(this.cameraAngle) * this.cameraRadius,
      this.cameraHeight + Math.sin(time * 0.5) * 0.05,
      Math.sin(this.cameraAngle) * this.cameraRadius
    );
    this.camera.lookAt(this.cameraTarget);

    if (this.hqGroup) {
      this.hqGroup.position.y = Math.sin(time * 1.45) * 0.12;
      this.hqGroup.rotation.y = Math.sin(time * 0.35) * 0.08;
    }

    this.updateSkyline(delta);
    this.updateProps(delta, time);
    this.updateParticles(delta);

    this.renderer.render(this.scene, this.camera);
  }

  updateSkyline(delta) {
    const valuationFactor = Math.max(0.24, Math.min(1.9, Math.log10(this.stateVisuals.valuation + 10) / 3.7));
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const position = new THREE.Vector3();

    for (let i = 0; i < this.skylineData.length; i += 1) {
      const data = this.skylineData[i];
      const pulse = 0.94 + Math.sin((performance.now() * 0.001 + i) * 0.22) * 0.02;
      data.targetHeight = data.baseHeight * valuationFactor * pulse;
      data.currentHeight += (data.targetHeight - data.currentHeight) * Math.min(1, delta * 2.4);
      position.set(data.x, data.currentHeight * 0.5 - 0.95, data.z);
      scale.set(data.width, Math.max(0.05, data.currentHeight), data.depth);
      matrix.compose(position, quaternion, scale);
      this.skyline.setMatrixAt(i, matrix);
    }

    this.skyline.instanceMatrix.needsUpdate = true;
  }

  updateProps(delta, time) {
    for (const [key, entry] of Object.entries(this.propGroups)) {
      const level = this.stateVisuals.companyLevels[key] ?? 0;
      entry.targetScale = 0.24 + Math.min(1.95, level * 0.085);
      const current = entry.group.scale.x;
      const next = current + (entry.targetScale - current) * Math.min(1, delta * 4.2);
      entry.group.scale.setScalar(next);
      entry.group.position.y = entry.group.userData.baseY + Math.sin(time * 1.2 + entry.bobOffset) * 0.06;
      entry.group.rotation.y += delta * 0.18;
    }
  }

  updateParticles(delta) {
    for (const particle of this.particlePool) {
      if (!particle.alive) continue;
      particle.life += delta;

      if (particle.life >= particle.maxLife) {
        particle.alive = false;
        particle.mesh.visible = false;
        continue;
      }

      particle.velocity.y -= 3.2 * delta;
      particle.mesh.position.addScaledVector(particle.velocity, delta);
      const lifeRatio = 1 - particle.life / particle.maxLife;
      particle.mesh.scale.setScalar(Math.max(0.05, lifeRatio));
    }
  }

  destroy() {
    this.renderer.dispose();
    this.mount.innerHTML = "";
  }
}
