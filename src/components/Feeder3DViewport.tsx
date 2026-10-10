import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface Feeder3DProps {
  xrayMode: boolean;
  explodedLevel: number; // 0 to 1
  selectedPartId: string | null;
  onSelectPart: (partId: string) => void;
  mechanismType: 'paddle' | 'carousel' | 'auger'; // Default 'paddle' (6-Vane Rotary Star Feeder)
  motorRunning: boolean;
  motorVoltage: number; // 12V to 36V
  relayClosed: boolean; // Low-side GND/N relay status
  leftBowlWeightG: number; // 0 to 600g
  rightBowlWeightG: number; // 0 to 600g
  trayUnlocked: boolean;
  cameraPreset: 'exterior' | 'internal' | 'motor775' | 'ychute' | 'loadcell' | 'rear';
  buzzerActive: boolean;
}

interface KibbleParticle {
  mesh: THREE.Mesh;
  side: 'left' | 'right';
  progress: number;
  speed: number;
  offsetX: number;
  offsetY: number;
}

export const Feeder3DViewport: React.FC<Feeder3DProps> = ({
  xrayMode,
  explodedLevel,
  selectedPartId,
  onSelectPart,
  mechanismType,
  motorRunning,
  motorVoltage,
  relayClosed,
  leftBowlWeightG,
  rightBowlWeightG,
  trayUnlocked,
  cameraPreset,
  buzzerActive,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const stateRef = useRef({
    xrayMode,
    explodedLevel,
    selectedPartId,
    mechanismType,
    motorRunning,
    motorVoltage,
    relayClosed,
    leftBowlWeightG,
    rightBowlWeightG,
    trayUnlocked,
    buzzerActive,
  });

  useEffect(() => {
    stateRef.current = {
      xrayMode,
      explodedLevel,
      selectedPartId,
      mechanismType,
      motorRunning,
      motorVoltage,
      relayClosed,
      leftBowlWeightG,
      rightBowlWeightG,
      trayUnlocked,
      buzzerActive,
    };
  }, [
    xrayMode,
    explodedLevel,
    selectedPartId,
    mechanismType,
    motorRunning,
    motorVoltage,
    relayClosed,
    leftBowlWeightG,
    rightBowlWeightG,
    trayUnlocked,
    buzzerActive,
  ]);

  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const targetCameraPos = useRef<THREE.Vector3 | null>(null);
  const targetLookAt = useRef<THREE.Vector3 | null>(null);

  useEffect(() => {
    const presets: Record<
      Feeder3DProps['cameraPreset'],
      { pos: [number, number, number]; target: [number, number, number] }
    > = {
      exterior: { pos: [3.2, 2.8, 3.8], target: [0, 1.25, 0.2] },
      internal: { pos: [2.4, 1.95, 2.85], target: [0, 1.35, -0.05] },
      motor775: { pos: [1.65, 1.75, 1.75], target: [0, 1.54, -0.15] },
      ychute: { pos: [0, 1.60, 2.75], target: [0, 1.08, 0.15] },
      loadcell: { pos: [2.2, 0.68, 2.1], target: [0, 0.28, 0.85] },
      rear: { pos: [-2.6, 2.1, -2.9], target: [0, 1.4, -0.95] },
    };

    const p = presets[cameraPreset];
    if (p) {
      targetCameraPos.current = new THREE.Vector3(...p.pos);
      targetLookAt.current = new THREE.Vector3(...p.target);
    }
  }, [cameraPreset]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0F172A');
    scene.fog = new THREE.FogExp2('#0F172A', 0.045);

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(2.4, 1.95, 2.85);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.set(0, 1.35, -0.05);
    controls.minDistance = 1.0;
    controls.maxDistance = 9.0;
    controls.maxPolarAngle = Math.PI / 2 + 0.08;
    controlsRef.current = controls;

    const handleControlStart = () => {
      targetCameraPos.current = null;
      targetLookAt.current = null;
    };
    controls.addEventListener('start', handleControlStart);

    // 5. Three-Point Studio Lighting
    const ambientLight = new THREE.AmbientLight('#CBD5E1', 0.88);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight('#FFFBEB', 1.85);
    keyLight.position.set(4, 7, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    const d = 3.2;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight('#38BDF8', 0.68);
    fillLight.position.set(-5, 3, 2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight('#F8FAFC', 0.9);
    rimLight.position.set(0, 5, -5);
    scene.add(rimLight);

    // CAD Engineering Grid Floor
    const gridHelper = new THREE.GridHelper(12, 24, '#0284C7', '#1E293B');
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    const groundPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 16),
      new THREE.MeshStandardMaterial({
        color: '#0B1120',
        roughness: 0.9,
        metalness: 0.1,
      })
    );
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.position.y = -0.02;
    groundPlane.receiveShadow = true;
    scene.add(groundPlane);

    // ============================================================================
    // MATERIALS
    // ============================================================================
    const casingMaterial = new THREE.MeshPhysicalMaterial({
      color: '#CBD5E1',
      roughness: 0.35,
      metalness: 0.1,
      clearcoat: 0.2,
      transparent: true,
      opacity: 1.0,
    });

    const darkBaseTrimMaterial = new THREE.MeshStandardMaterial({
      color: '#1E293B',
      roughness: 0.6,
      metalness: 0.2,
    });

    const hopperPlasticMaterial = new THREE.MeshPhysicalMaterial({
      color: '#E2E8F0',
      roughness: 0.25,
      metalness: 0.05,
      transmission: 0.15,
      transparent: true,
      opacity: 0.94,
    });

    const acrylicGlassMaterial = new THREE.MeshPhysicalMaterial({
      color: '#94A3B8',
      roughness: 0.1,
      metalness: 0.05,
      transmission: 0.82,
      transparent: true,
      opacity: 0.32,
      side: THREE.DoubleSide,
    });

    const kibbleMaterial = new THREE.MeshStandardMaterial({
      color: '#D97706',
      roughness: 0.65,
      metalness: 0.05,
    });

    const stainlessSteelMaterial = new THREE.MeshStandardMaterial({
      color: '#E2E8F0',
      roughness: 0.2,
      metalness: 0.88,
    });

    const motor775SteelMaterial = new THREE.MeshStandardMaterial({
      color: '#94A3B8',
      roughness: 0.28,
      metalness: 0.85,
    });

    const siliconeVaneMaterial = new THREE.MeshStandardMaterial({
      color: '#0EA5E9', // Food-grade cyan flexible silicone paddle vanes
      roughness: 0.35,
      metalness: 0.1,
    });

    const couplerBrassMaterial = new THREE.MeshStandardMaterial({
      color: '#F59E0B',
      roughness: 0.25,
      metalness: 0.85,
    });

    const yChuteMaterial = new THREE.MeshPhysicalMaterial({
      color: '#475569',
      roughness: 0.3,
      metalness: 0.2,
      transparent: true,
      opacity: 0.86,
      side: THREE.DoubleSide,
    });

    const splitterFinMaterial = new THREE.MeshStandardMaterial({
      color: '#38BDF8',
      roughness: 0.25,
      metalness: 0.4,
    });

    const aluminumLoadCellMaterial = new THREE.MeshStandardMaterial({
      color: '#F1F5F9',
      roughness: 0.3,
      metalness: 0.85,
    });

    const strainGaugeMaterial = new THREE.MeshStandardMaterial({
      color: '#F59E0B',
      roughness: 0.4,
      metalness: 0.6,
    });

    const pcbBlueMaterial = new THREE.MeshStandardMaterial({
      color: '#0284C7',
      roughness: 0.4,
      metalness: 0.3,
    });

    const pcbGreenMaterial = new THREE.MeshStandardMaterial({
      color: '#059669',
      roughness: 0.4,
      metalness: 0.3,
    });

    const esp32PcbMaterial = new THREE.MeshStandardMaterial({
      color: '#1E1B4B',
      roughness: 0.4,
      metalness: 0.3,
    });

    const relaySwitchBoxMaterial = new THREE.MeshStandardMaterial({
      color: '#2563EB',
      roughness: 0.3,
      metalness: 0.1,
    });

    const tagGroup = (group: THREE.Object3D, partId: string) => {
      group.userData.partId = partId;
      group.traverse((child) => {
        child.userData.partId = partId;
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    };

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    const bowlOffsets = [-0.56, 0.56];

    // ----------------------------------------------------------------------------
    // 1. BASE PLATFORM
    // ----------------------------------------------------------------------------
    const baseGroup = new THREE.Group();
    rootGroup.add(baseGroup);

    const bottomTrim = new THREE.Mesh(
      new THREE.BoxGeometry(2.38, 0.08, 2.28),
      darkBaseTrimMaterial
    );
    bottomTrim.position.set(0, 0.04, 0.25);
    baseGroup.add(bottomTrim);

    const basePlatform = new THREE.Mesh(
      new THREE.BoxGeometry(2.32, 0.22, 2.22),
      casingMaterial
    );
    basePlatform.position.set(0, 0.19, 0.25);
    baseGroup.add(basePlatform);
    tagGroup(baseGroup, 'y-splitter-chute');

    // ----------------------------------------------------------------------------
    // 2. DUAL LOAD CELLS (10KG SINGLE-POINT PARALLEL BEAM) + HX711
    // ----------------------------------------------------------------------------
    const loadCellGroup = new THREE.Group();
    rootGroup.add(loadCellGroup);

    const leftLoadCellBeamRef = new THREE.Group();
    const rightLoadCellBeamRef = new THREE.Group();

    bowlOffsets.forEach((xPos, idx) => {
      const lcAssembly = idx === 0 ? leftLoadCellBeamRef : rightLoadCellBeamRef;
      lcAssembly.position.set(xPos, 0.32, 0.82);
      loadCellGroup.add(lcAssembly);

      const fixedPedestal = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.06, 0.22),
        darkBaseTrimMaterial
      );
      fixedPedestal.position.set(0, -0.02, -0.22);
      lcAssembly.add(fixedPedestal);

      const beamMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.14, 0.68),
        aluminumLoadCellMaterial
      );
      beamMesh.position.set(0, 0.05, 0);
      lcAssembly.add(beamMesh);

      [-0.08, 0.08].forEach((zHole) => {
        const holeMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.038, 0.038, 0.19, 16),
          darkBaseTrimMaterial
        );
        holeMesh.rotation.z = Math.PI / 2;
        holeMesh.position.set(0, 0.05, zHole);
        lcAssembly.add(holeMesh);

        const topGauge = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 0.008, 0.07),
          strainGaugeMaterial
        );
        topGauge.position.set(0, 0.122, zHole);
        lcAssembly.add(topGauge);

        const bottomGauge = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 0.008, 0.07),
          strainGaugeMaterial
        );
        bottomGauge.position.set(0, -0.022, zHole);
        lcAssembly.add(bottomGauge);
      });

      const floatingSpacer = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.16, 0.05, 24),
        stainlessSteelMaterial
      );
      floatingSpacer.position.set(0, 0.14, 0.16);
      lcAssembly.add(floatingSpacer);

      const hx711Pcb = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.02, 0.34),
        pcbGreenMaterial
      );
      hx711Pcb.position.set(idx === 0 ? 0.25 : -0.25, 0.02, -0.1);
      lcAssembly.add(hx711Pcb);
    });
    tagGroup(loadCellGroup, 'loadcell-hx711');

    // ----------------------------------------------------------------------------
    // 3. DUAL STAINLESS STEEL BOWLS + REMOVABLE LOCK LATCHES
    // ----------------------------------------------------------------------------
    const bowlsGroup = new THREE.Group();
    rootGroup.add(bowlsGroup);

    const leftBowlUnit = new THREE.Group();
    const rightBowlUnit = new THREE.Group();
    const lockLatches: THREE.Mesh[] = [];
    const leftKibblePileRef = new THREE.Mesh(
      new THREE.ConeGeometry(0.32, 0.22, 24),
      kibbleMaterial
    );
    const rightKibblePileRef = new THREE.Mesh(
      new THREE.ConeGeometry(0.32, 0.22, 24),
      kibbleMaterial
    );

    bowlOffsets.forEach((xPos, idx) => {
      const unit = idx === 0 ? leftBowlUnit : rightBowlUnit;
      unit.position.set(xPos, 0.45, 0.85);
      bowlsGroup.add(unit);

      const outerCollar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.46, 0.48, 0.26, 36, 1, true),
        casingMaterial
      );
      outerCollar.position.set(0, 0.04, 0);
      unit.add(outerCollar);

      const bowlRim = new THREE.Mesh(
        new THREE.TorusGeometry(0.44, 0.035, 16, 36),
        stainlessSteelMaterial
      );
      bowlRim.rotation.x = Math.PI / 2;
      bowlRim.position.set(0, 0.17, 0);
      unit.add(bowlRim);

      const bowlBasin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.43, 0.34, 0.24, 36),
        stainlessSteelMaterial
      );
      bowlBasin.position.set(0, 0.04, 0);
      unit.add(bowlBasin);

      const bowlInterior = new THREE.Mesh(
        new THREE.CylinderGeometry(0.40, 0.32, 0.02, 32),
        new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.35, metalness: 0.8 })
      );
      bowlInterior.position.set(0, 0.02, 0);
      unit.add(bowlInterior);

      const pile = idx === 0 ? leftKibblePileRef : rightKibblePileRef;
      pile.position.set(0, 0.03, 0);
      unit.add(pile);

      const latch = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.06, 0.12),
        siliconeVaneMaterial
      );
      latch.position.set(0, -0.02, 0.47);
      unit.add(latch);
      lockLatches.push(latch);
    });
    tagGroup(bowlsGroup, 'bowl-lock');

    // ----------------------------------------------------------------------------
    // 4. SINGLE CENTRAL TOWER & Y-SPLITTER CHUTE (2 WAYS TO 2 BOWLS)
    // ----------------------------------------------------------------------------
    const housingAndYChuteGroup = new THREE.Group();
    rootGroup.add(housingAndYChuteGroup);

    const centralTower = new THREE.Mesh(
      new THREE.CylinderGeometry(0.76, 0.84, 1.58, 40),
      casingMaterial
    );
    centralTower.position.set(0, 1.09, -0.36);
    housingAndYChuteGroup.add(centralTower);

    // Front Wide Inspection Window Frame
    const windowFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.42, 0.72, 0.16),
      darkBaseTrimMaterial
    );
    windowFrame.position.set(0, 1.15, 0.32);
    housingAndYChuteGroup.add(windowFrame);

    const windowGlass = new THREE.Mesh(
      new THREE.BoxGeometry(1.32, 0.62, 0.04),
      acrylicGlassMaterial
    );
    windowGlass.position.set(0, 1.15, 0.38);
    housingAndYChuteGroup.add(windowGlass);

    // INTERNAL Y-SPLITTER BIFURCATED CHUTE
    const ySplitterAssembly = new THREE.Group();
    housingAndYChuteGroup.add(ySplitterAssembly);

    // Central Wedge Apex Divider Fin right beneath the Rotary Paddle Wheel bottom outlet
    const splitterWedge = new THREE.Mesh(
      new THREE.ConeGeometry(0.19, 0.36, 4),
      splitterFinMaterial
    );
    splitterWedge.rotation.y = Math.PI / 4;
    splitterWedge.position.set(0, 1.16, -0.04);
    ySplitterAssembly.add(splitterWedge);

    // Left and Right Diverging Chute Branches (40° slope into Left and Right bowls)
    [-1, 1].forEach((dir) => {
      const branchGroup = new THREE.Group();
      branchGroup.position.set(dir * 0.28, 0.88, 0.38);
      branchGroup.rotation.x = 0.56;
      branchGroup.rotation.y = dir * 0.48;
      ySplitterAssembly.add(branchGroup);

      const floor = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.03, 1.05),
        yChuteMaterial
      );
      branchGroup.add(floor);

      [-0.13, 0.13].forEach((sideX) => {
        const wall = new THREE.Mesh(
          new THREE.BoxGeometry(0.025, 0.15, 1.05),
          yChuteMaterial
        );
        wall.position.set(sideX, 0.06, 0);
        branchGroup.add(wall);
      });
    });

    tagGroup(housingAndYChuteGroup, 'y-splitter-chute');

    // ----------------------------------------------------------------------------
    // 5. 775 DC MOTOR + DISPENSING MECHANISM (3 SELECTABLE EXAMPLES IN 3D)
    //    - Mode A ('paddle'): Vertical-Plane 6-Vane Flexible Silicone Star Wheel (Default)
    //    - Mode B ('carousel'): Horizontal-Plane 6-Pocket Carousel (Vertical Motor Shaft)
    //    - Mode C ('auger'): Horizontal Archimedes Screw Auger
    // ----------------------------------------------------------------------------
    const motorMechanismGroup = new THREE.Group();
    rootGroup.add(motorMechanismGroup);

    const mechanismCenter = new THREE.Group();
    mechanismCenter.position.set(0, 1.56, -0.12);
    motorMechanismGroup.add(mechanismCenter);

    // --- SUB-ASSEMBLY A: VERTICAL-PLANE 6-VANE ROTARY STAR PADDLE WHEEL (DEFAULT) ---
    const verticalPaddleAssembly = new THREE.Group();
    mechanismCenter.add(verticalPaddleAssembly);

    // 775 Motor mounted behind the paddle wheel chamber (shaft along Z axis)
    const motor775Rear = new THREE.Mesh(
      new THREE.CylinderGeometry(0.19, 0.19, 0.42, 32),
      motor775SteelMaterial
    );
    motor775Rear.rotation.x = Math.PI / 2;
    motor775Rear.position.set(0, 0, -0.44);
    verticalPaddleAssembly.add(motor775Rear);

    const motorFluxRingA = new THREE.Mesh(
      new THREE.CylinderGeometry(0.204, 0.204, 0.22, 32),
      new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.4, metalness: 0.7 })
    );
    motorFluxRingA.rotation.x = Math.PI / 2;
    motorFluxRingA.position.set(0, 0, -0.42);
    verticalPaddleAssembly.add(motorFluxRingA);

    // Red (+) and Blue (GND/N) terminals on rear of 775 motor
    const termRedA = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.04, 0.06),
      new THREE.MeshStandardMaterial({ color: '#DC2626' })
    );
    termRedA.position.set(-0.08, 0.12, -0.66);
    verticalPaddleAssembly.add(termRedA);

    const termBlackA = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.04, 0.06),
      new THREE.MeshStandardMaterial({ color: '#0284C7' })
    );
    termBlackA.position.set(0.08, 0.12, -0.66);
    verticalPaddleAssembly.add(termBlackA);

    // Clear Cylindrical Drum Housing (PVC 4" Ø100mm chamber) with Top Inlet & Bottom Outlet
    const paddleDrumHousing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.32, 0.36, 36, 1, true),
      acrylicGlassMaterial
    );
    paddleDrumHousing.rotation.x = Math.PI / 2;
    paddleDrumHousing.position.set(0, 0, 0);
    verticalPaddleAssembly.add(paddleDrumHousing);

    // Front transparent acrylic cover ring of the paddle drum
    const frontRing = new THREE.Mesh(
      new THREE.RingGeometry(0.08, 0.32, 36),
      acrylicGlassMaterial
    );
    frontRing.position.set(0, 0, 0.18);
    verticalPaddleAssembly.add(frontRing);

    // Anti-Pinch Wiper Lip (45° angled silicone baffle at top right of drum inlet)
    const antiPinchLip = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.03, 0.34),
      couplerBrassMaterial
    );
    antiPinchLip.position.set(0.18, 0.28, 0);
    antiPinchLip.rotation.z = -0.55;
    verticalPaddleAssembly.add(antiPinchLip);

    // Rotating 6-Vane Star Paddle Rotor
    const paddleRotorGroup = new THREE.Group();
    verticalPaddleAssembly.add(paddleRotorGroup);

    // 5mm Brass Flange Shaft Coupler
    const couplerA = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.08, 24),
      couplerBrassMaterial
    );
    couplerA.rotation.x = Math.PI / 2;
    couplerA.position.set(0, 0, -0.16);
    paddleRotorGroup.add(couplerA);

    // Central Rotor Hub
    const rotorHub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.085, 0.085, 0.34, 24),
      stainlessSteelMaterial
    );
    rotorHub.rotation.x = Math.PI / 2;
    paddleRotorGroup.add(rotorHub);

    // 6 Flexible Silicone Vanes (60° apart) + Kibble scoops inside pockets
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6;
      const vaneGroup = new THREE.Group();
      vaneGroup.rotation.z = angle;
      paddleRotorGroup.add(vaneGroup);

      // Silicone Paddle Blade
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.022, 0.22, 0.32),
        siliconeVaneMaterial
      );
      blade.position.set(0, 0.15, 0);
      vaneGroup.add(blade);

      // Flexible darker blue tip seal at outer edge of blade
      const bladeTip = new THREE.Mesh(
        new THREE.BoxGeometry(0.032, 0.03, 0.32),
        new THREE.MeshStandardMaterial({ color: '#0284C7', roughness: 0.5 })
      );
      bladeTip.position.set(0, 0.265, 0);
      vaneGroup.add(bladeTip);

      // Small cluster of kibble riding inside each pocket between blades
      const pocketKibble = new THREE.Mesh(
        new THREE.SphereGeometry(0.055, 10, 10),
        kibbleMaterial
      );
      pocketKibble.scale.set(1.1, 0.8, 1.8);
      pocketKibble.position.set(0.09, 0.14, 0);
      vaneGroup.add(pocketKibble);
    }

    // --- SUB-ASSEMBLY B: HORIZONTAL-PLANE CAROUSEL PADDLE (VERTICAL MOTOR SHAFT) ---
    const horizontalCarouselAssembly = new THREE.Group();
    mechanismCenter.add(horizontalCarouselAssembly);

    // 775 Motor mounted vertically underneath/above driving vertical shaft
    const motor775Vertical = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.38, 32),
      motor775SteelMaterial
    );
    motor775Vertical.position.set(0, 0.36, -0.25);
    horizontalCarouselAssembly.add(motor775Vertical);

    // Flat Cylindrical Carousel Chamber
    const carouselChamber = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.38, 0.22, 36, 1, true),
      acrylicGlassMaterial
    );
    horizontalCarouselAssembly.add(carouselChamber);

    // Top Offset Plate (Blocks right half, open on left half for kibble entry)
    const offsetBaffleTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.37, 0.37, 0.025, 24, 1, false, 0, Math.PI),
      couplerBrassMaterial
    );
    offsetBaffleTop.position.set(0, 0.11, 0);
    horizontalCarouselAssembly.add(offsetBaffleTop);

    const carouselRotorGroup = new THREE.Group();
    horizontalCarouselAssembly.add(carouselRotorGroup);

    const carouselHub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.20, 20),
      stainlessSteelMaterial
    );
    carouselRotorGroup.add(carouselHub);

    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6;
      const hVane = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.18, 0.022),
        siliconeVaneMaterial
      );
      hVane.position.set(Math.cos(angle) * 0.18, 0, Math.sin(angle) * 0.18);
      hVane.rotation.y = -angle;
      carouselRotorGroup.add(hVane);
    }

    // --- SUB-ASSEMBLY C: HORIZONTAL ARCHIMEDES SCREW AUGER (FOR COMPARISON) ---
    const augerAssembly = new THREE.Group();
    mechanismCenter.add(augerAssembly);

    const motor775Auger = new THREE.Mesh(
      new THREE.CylinderGeometry(0.19, 0.19, 0.42, 32),
      motor775SteelMaterial
    );
    motor775Auger.rotation.x = Math.PI / 2;
    motor775Auger.position.set(0, 0, -0.52);
    augerAssembly.add(motor775Auger);

    const augerTube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.62, 32, 1, true),
      acrylicGlassMaterial
    );
    augerTube.rotation.x = Math.PI / 2;
    augerTube.position.set(0, 0, 0);
    augerAssembly.add(augerTube);

    const augerRotorGroup = new THREE.Group();
    augerAssembly.add(augerRotorGroup);

    const augerShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.60, 16),
      stainlessSteelMaterial
    );
    augerShaft.rotation.x = Math.PI / 2;
    augerRotorGroup.add(augerShaft);

    for (let i = 0; i < 44; i++) {
      const t = i / 44;
      const angle = t * 4 * Math.PI * 2;
      const zPos = -0.26 + t * 0.52;
      const flight = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.025, 0.04),
        siliconeVaneMaterial
      );
      flight.position.set(Math.cos(angle) * 0.08, Math.sin(angle) * 0.08, zPos);
      flight.rotation.z = angle;
      flight.rotation.y = 0.35;
      augerRotorGroup.add(flight);
    }

    tagGroup(motorMechanismGroup, 'motor-775-auger');

    // ----------------------------------------------------------------------------
    // 6. SINGLE HIGH-CAPACITY HOPPER ON TOP
    // ----------------------------------------------------------------------------
    const singleHopperGroup = new THREE.Group();
    rootGroup.add(singleHopperGroup);

    const hopperContainer = new THREE.Group();
    hopperContainer.position.set(0, 2.32, -0.22);
    singleHopperGroup.add(hopperContainer);

    const hopperShell = new THREE.Mesh(
      new THREE.CylinderGeometry(0.76, 0.72, 0.90, 40),
      hopperPlasticMaterial
    );
    hopperContainer.add(hopperShell);

    const internalCone = new THREE.Mesh(
      new THREE.ConeGeometry(0.68, 0.48, 36, 1, true),
      new THREE.MeshStandardMaterial({
        color: '#94A3B8',
        roughness: 0.3,
        metalness: 0.2,
        side: THREE.DoubleSide,
      })
    );
    internalCone.rotation.x = Math.PI;
    internalCone.position.set(0, -0.24, 0.08);
    hopperContainer.add(internalCone);

    const storedKibble = new THREE.Mesh(
      new THREE.CylinderGeometry(0.68, 0.42, 0.56, 32),
      kibbleMaterial
    );
    storedKibble.position.set(0, 0.08, 0);
    hopperContainer.add(storedKibble);

    const topLid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.78, 0.78, 0.06, 40),
      casingMaterial
    );
    topLid.position.set(0, 0.45, 0);
    hopperContainer.add(topLid);

    [-0.22, 0.22].forEach((zSlot) => {
      const sightWindow = new THREE.Mesh(
        new THREE.BoxGeometry(0.92, 0.07, 0.24),
        kibbleMaterial
      );
      sightWindow.position.set(0, 0.455, zSlot);
      hopperContainer.add(sightWindow);
    });

    tagGroup(singleHopperGroup, 'single-hopper');

    // ----------------------------------------------------------------------------
    // 7. ELECTRONICS BOX: ESP32 + RELAY MODULE (GND/N SWITCH) + BUCK CONVERTER
    // ----------------------------------------------------------------------------
    const electronicsGroup = new THREE.Group();
    rootGroup.add(electronicsGroup);

    const controlBoxFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.38, 0.95, 0.28),
      new THREE.MeshPhysicalMaterial({
        color: '#1E293B',
        roughness: 0.3,
        metalness: 0.4,
        transparent: true,
        opacity: 0.88,
      })
    );
    controlBoxFrame.position.set(0, 1.15, -1.18);
    electronicsGroup.add(controlBoxFrame);

    const backplate = new THREE.Mesh(
      new THREE.BoxGeometry(1.22, 0.78, 0.03),
      new THREE.MeshStandardMaterial({ color: '#F8FAFC', roughness: 0.5 })
    );
    backplate.position.set(0, 1.15, -1.28);
    electronicsGroup.add(backplate);

    const esp32Board = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, 0.24, 0.04),
      esp32PcbMaterial
    );
    esp32Board.position.set(-0.32, 1.34, -1.31);
    electronicsGroup.add(esp32Board);

    const relayPcb = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.26, 0.03),
      pcbGreenMaterial
    );
    relayPcb.position.set(0.32, 1.34, -1.31);
    electronicsGroup.add(relayPcb);

    const blueRelayCube = new THREE.Mesh(
      new THREE.BoxGeometry(0.20, 0.16, 0.14),
      relaySwitchBoxMaterial
    );
    blueRelayCube.position.set(0.32, 1.34, -1.36);
    electronicsGroup.add(blueRelayCube);

    const relayLedMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.028, 12, 12),
      new THREE.MeshStandardMaterial({
        color: '#10B981',
        emissive: '#10B981',
        emissiveIntensity: 0,
      })
    );
    relayLedMesh.position.set(0.18, 1.38, -1.34);
    electronicsGroup.add(relayLedMesh);

    const buckPcb = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.22, 0.03),
      pcbBlueMaterial
    );
    buckPcb.position.set(-0.32, 0.96, -1.31);
    electronicsGroup.add(buckPcb);

    const buckInductor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.06, 16),
      couplerBrassMaterial
    );
    buckInductor.rotation.x = Math.PI / 2;
    buckInductor.position.set(-0.24, 0.96, -1.35);
    electronicsGroup.add(buckInductor);

    const rtcBoard = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.20, 0.03),
      pcbGreenMaterial
    );
    rtcBoard.position.set(0.28, 0.96, -1.31);
    electronicsGroup.add(rtcBoard);

    const buzzerCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 0.07, 20),
      darkBaseTrimMaterial
    );
    buzzerCylinder.rotation.x = Math.PI / 2;
    buzzerCylinder.position.set(0.50, 0.96, -1.33);
    electronicsGroup.add(buzzerCylinder);

    tagGroup(electronicsGroup, 'relay-buck-esp32');

    // ============================================================================
    // KIBBLE PARTICLE STREAM (Dropped from Paddle Wheel -> Y-Splitter -> 2 Bowls)
    // ============================================================================
    const kibbleGeo = new THREE.DodecahedronGeometry(0.038, 0);
    const particles: KibbleParticle[] = [];
    const particleGroup = new THREE.Group();
    rootGroup.add(particleGroup);

    for (let i = 0; i < 40; i++) {
      const side: 'left' | 'right' = i % 2 === 0 ? 'left' : 'right';
      const pMesh = new THREE.Mesh(kibbleGeo, kibbleMaterial);
      pMesh.visible = false;
      particleGroup.add(pMesh);
      particles.push({
        mesh: pMesh,
        side,
        progress: (i / 40) % 1,
        speed: 0.016 + Math.random() * 0.006,
        offsetX: (Math.random() - 0.5) * 0.08,
        offsetY: (Math.random() - 0.5) * 0.06,
      });
    }

    // ============================================================================
    // RAYCASTER
    // ============================================================================
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };

    const onPointerDown = (e: MouseEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: MouseEvent) => {
      const dx = Math.abs(e.clientX - pointerDownPos.x);
      const dy = Math.abs(e.clientY - pointerDownPos.y);
      if (dx > 6 || dy > 6) return;

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(rootGroup.children, true);

      for (const hit of intersects) {
        const hitPartId = hit.object.userData.partId;
        if (stateRef.current.xrayMode && hitPartId === 'y-splitter-chute' && intersects.length > 1) {
          continue;
        }
        if (hitPartId) {
          onSelectPart(hitPartId);
          break;
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    // ============================================================================
    // ANIMATION LOOP
    // ============================================================================
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const s = stateRef.current;

      // 1. X-Ray Mode opacity
      const targetCasingOpacity = s.xrayMode ? 0.14 : 1.0;
      casingMaterial.opacity += (targetCasingOpacity - casingMaterial.opacity) * 0.12;
      casingMaterial.depthWrite = casingMaterial.opacity > 0.5;

      const targetHopperOpacity = s.xrayMode ? 0.25 : 0.94;
      hopperPlasticMaterial.opacity += (targetHopperOpacity - hopperPlasticMaterial.opacity) * 0.12;

      // 2. Toggle 3D Dispensing Mechanism Example
      verticalPaddleAssembly.visible = s.mechanismType === 'paddle';
      horizontalCarouselAssembly.visible = s.mechanismType === 'carousel';
      augerAssembly.visible = s.mechanismType === 'auger';

      // 3. Exploded View separation
      const exp = s.explodedLevel;
      singleHopperGroup.position.y += (exp * 0.68 - singleHopperGroup.position.y) * 0.1;
      motorMechanismGroup.position.y += (exp * 0.24 - motorMechanismGroup.position.y) * 0.1;
      electronicsGroup.position.z += (-exp * 0.55 - electronicsGroup.position.z) * 0.1;
      loadCellGroup.position.y += (exp * 0.12 - loadCellGroup.position.y) * 0.1;

      // 4. Removable Tray Lock Simulation
      const targetTrayZ = s.trayUnlocked ? 0.55 : 0;
      const targetTrayY = s.trayUnlocked ? 0.18 + exp * 0.25 : exp * 0.25;
      bowlsGroup.position.z += (targetTrayZ - bowlsGroup.position.z) * 0.1;
      bowlsGroup.position.y += (targetTrayY - bowlsGroup.position.y) * 0.1;

      lockLatches.forEach((latch) => {
        const targetRotY = s.trayUnlocked ? Math.PI / 2 : 0;
        latch.rotation.y += (targetRotY - latch.rotation.y) * 0.15;
      });

      // 5. Rotate the active 775 Motor Mechanism when Relay closes Ground (N)
      const isSpinning = s.motorRunning && s.relayClosed;
      const speedFactor = (s.motorVoltage / 12) * 0.065; // smooth visual paddle scooping speed
      if (isSpinning) {
        paddleRotorGroup.rotation.z -= speedFactor;
        carouselRotorGroup.rotation.y += speedFactor;
        augerRotorGroup.rotation.z -= speedFactor * 2.2;
      }

      // Relay LED status
      (relayLedMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = s.relayClosed
        ? 1.5
        : 0.05;

      // 6. Kibble Pile inside Both Stainless Bowls + Load Cell Deflection
      const leftRatio = Math.min(Math.max(s.leftBowlWeightG / 550, 0.02), 1.1);
      const rightRatio = Math.min(Math.max(s.rightBowlWeightG / 550, 0.02), 1.1);

      leftKibblePileRef.visible = s.leftBowlWeightG > 2;
      rightKibblePileRef.visible = s.rightBowlWeightG > 2;
      leftKibblePileRef.scale.set(
        0.4 + leftRatio * 0.65,
        0.2 + leftRatio * 0.9,
        0.4 + leftRatio * 0.65
      );
      rightKibblePileRef.scale.set(
        0.4 + rightRatio * 0.65,
        0.2 + rightRatio * 0.9,
        0.4 + rightRatio * 0.65
      );

      leftLoadCellBeamRef.rotation.x = THREE.MathUtils.degToRad(leftRatio * 1.4);
      rightLoadCellBeamRef.rotation.x = THREE.MathUtils.degToRad(rightRatio * 1.4);

      // 7. Kibble Flow Trajectory from Paddle Wheel -> Y-Splitter -> Left & Right Bowls
      particles.forEach((p) => {
        if (!isSpinning) {
          p.mesh.visible = false;
          return;
        }
        p.mesh.visible = true;
        p.progress += p.speed * (s.motorVoltage / 15);
        if (p.progress > 1) {
          p.progress = 0;
        }

        if (p.progress < 0.35) {
          // Being scooped around the 6-Vane Paddle Wheel arc from top (12 o'clock) to bottom (6 o'clock)
          const tWheel = p.progress / 0.35;
          const arcAngle = Math.PI / 2 - tWheel * Math.PI; // +90 deg top down to -90 deg bottom
          const r = 0.21;
          p.mesh.position.set(
            Math.cos(arcAngle) * r + p.offsetX * 0.5,
            1.56 + Math.sin(arcAngle) * r,
            -0.12 + p.offsetY
          );
        } else {
          // Dropped from bottom of Paddle Wheel onto Y-Splitter Apex, sliding left (-0.56) & right (+0.56)
          const tChute = (p.progress - 0.35) / 0.65;
          const dir = p.side === 'left' ? -1 : 1;
          const xPos = dir * (tChute * 0.56) + p.offsetX;
          const yPos = 1.32 - tChute * 0.80;
          const zPos = -0.08 + tChute * 0.94;
          p.mesh.position.set(xPos, yPos, zPos);
        }

        p.mesh.rotation.x += 0.12;
        p.mesh.rotation.y += 0.09;
      });

      // 8. Smooth Camera Preset Interpolation
      if (targetCameraPos.current && targetLookAt.current) {
        camera.position.lerp(targetCameraPos.current, 0.08);
        controls.target.lerp(targetLookAt.current, 0.08);
        if (
          camera.position.distanceTo(targetCameraPos.current) < 0.03 &&
          controls.target.distanceTo(targetLookAt.current) < 0.03
        ) {
          targetCameraPos.current = null;
          targetLookAt.current = null;
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      controls.removeEventListener('start', handleControlStart);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
    };
  }, [onSelectPart]);

  const mechanismLabel =
    mechanismType === 'paddle'
      ? 'ใบพัดกังหันตักอาหารแนวตั้ง 6 แฉก (Vertical Star Wheel)'
      : mechanismType === 'carousel'
      ? 'กังหันช่องตักแนวราบ (Horizontal Carousel)'
      : 'เกลียวลำเลียง (Horizontal Screw Auger)';

  return (
    <div className="relative w-full h-full min-h-[540px] bg-slate-900 rounded-xl overflow-hidden border border-slate-200/80 shadow-sm select-none">
      {/* Three.js Canvas Mount */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top-Left HUD Overlay */}
      <div className="absolute top-3.5 left-3.5 z-10 pointer-events-none flex flex-col gap-1.5 max-w-sm">
        <div className="bg-slate-950/80 backdrop-blur-md border border-white/10 rounded-lg px-3.5 py-2.5 text-white">
          <div className="text-[11px] font-medium text-sky-400">
            ตัวอย่าง 3D · มอเตอร์ 775 + {mechanismLabel}
          </div>
          <div className="text-xs font-semibold tracking-tight mt-0.5">
            Single-Body 775 Rotary Paddle & Y-Splitter Feeder
          </div>
          <div className="text-[11px] text-slate-300 mt-1 flex items-center gap-2 tabular-nums">
            <span>ชามซ้าย (LC#1): {leftBowlWeightG.toFixed(0)} g</span>
            <span aria-hidden="true">·</span>
            <span>ชามขวา (LC#2): {rightBowlWeightG.toFixed(0)} g</span>
          </div>
        </div>

        {buzzerActive && (
          <div className="bg-amber-500/95 backdrop-blur-md text-slate-950 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm">
            กำลังส่งเสียงสัญญาณเรียกสุนัข (Cue Sound Buzzer)
          </div>
        )}
      </div>

      {/* Bottom-Left HUD Overlay */}
      <div className="absolute bottom-3.5 left-3.5 z-10 pointer-events-none hidden sm:block">
        <div className="bg-slate-950/75 backdrop-blur-md border border-white/10 rounded-lg px-3 py-1.5 text-[11px] text-slate-300">
          คลิกซ้ายค้างเพื่อหมุน 360° · เลื่อนลูกกลิ้งเพื่อซูมดูใบพัดกังหัน 6 แฉกตักอาหารลงรางแยก Y
        </div>
      </div>

      {/* Bottom-Right Live 775 Motor & Relay GND Status */}
      <div className="absolute bottom-3.5 right-3.5 z-10 pointer-events-none">
        <div className="bg-slate-950/80 backdrop-blur-md border border-white/10 rounded-lg px-3.5 py-2 text-[11px] text-slate-200 font-mono tabular-nums space-y-0.5">
          <div>
            775 Motor ({motorVoltage}V):{' '}
            <span className={motorRunning && relayClosed ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
              {motorRunning && relayClosed ? 'RUNNING (กังหันหมุนตักอาหาร)' : 'STOPPED (ใบพัดล็อคกันรั่ว)'}
            </span>
          </div>
          <div>
            Relay (GND/N Switch):{' '}
            <span className={relayClosed ? 'text-sky-400 font-semibold' : 'text-amber-400'}>
              {relayClosed ? 'CLOSED (ต่อสายกราวด์ N)' : 'OPEN (ตัดสายกราวด์ N)'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
