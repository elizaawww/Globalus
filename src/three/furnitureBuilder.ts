import * as THREE from 'three';
import { ROOMS, VENTS } from '../data/stationLayout';
import { THEORY_BOOKS } from '../data/theoryBooks';
import { RoomId, TheoryBookId } from '../types/game';
import { createArtworkTexture, createBatikTexture, createScreenTexture } from './proceduralTextures';

export interface VentObject {
  id: string;
  x: number;
  z: number;
  lid: THREE.Group;
  ringMat: THREE.MeshStandardMaterial;
  openProgress: number;
  outlineGroup: THREE.Group;
  hitMesh: THREE.Mesh;
}

export interface TheoryBookObject {
  id: TheoryBookId;
  roomId: RoomId;
  position: THREE.Vector3;
  group: THREE.Group;
  haloMat: THREE.MeshStandardMaterial;
  beacon: THREE.Mesh;
  sparkles: THREE.Points;
  sparkleMat: THREE.PointsMaterial;
  outlineGroup: THREE.Group;
  outlineMat: THREE.LineBasicMaterial;
  outlineRingMat: THREE.MeshBasicMaterial;
  hitMesh: THREE.Mesh;
}

export interface SpinnerEntry {
  obj: THREE.Object3D;
  speedY: number;
  speedX?: number;
  floatAmp?: number;
  baseY?: number;
}

export interface RoomGroupEntry {
  roomId: RoomId;
  group: THREE.Group;
  centerX: number;
  centerZ: number;
  microProps: THREE.Object3D[];
  spinners: SpinnerEntry[];
}

export interface SecretTvObject {
  position: THREE.Vector3;
  outlineGroup: THREE.Group;
  hitMesh: THREE.Mesh;
  beaconMat: THREE.MeshStandardMaterial;
  beacon: THREE.Mesh;
}

export interface CustomizeTerminalObject {
  position: THREE.Vector3;
  group: THREE.Group;
  beacon: THREE.Mesh;
  outlineGroup: THREE.Group;
  hitMesh: THREE.Mesh;
}

export interface AuliaQuest3DObjects {
  cabinetGroup: THREE.Group;
  boxGroup: THREE.Group;
  boxOutlineGroup: THREE.Group;
  boxHitMesh: THREE.Mesh;
  boxPos: THREE.Vector3;
  ladderGroup: THREE.Group;
  ladderOutlineGroup: THREE.Group;
  ladderHitMesh: THREE.Mesh;
  ladderRestPos: THREE.Vector3;
  ladderPlacedPos: THREE.Vector3;
  setLadderPlaced: (placed: boolean) => void;
  setBoxVisible: (visible: boolean) => void;
}

export interface FurnitureBuildResult {
  vents: VentObject[];
  theoryBooks: TheoryBookObject[];
  spinners: SpinnerEntry[];
  roomGroups: RoomGroupEntry[];
  secretTv: SecretTvObject;
  customizeTerminal: CustomizeTerminalObject;
  auliaQuestObjs: AuliaQuest3DObjects;
}

export function populateStationFurniture(
  stationGroup: THREE.Group,
  _isSoftwareGl: boolean
): FurnitureBuildResult {
  const spinners: SpinnerEntry[] = [];
  const roomGroupMap = new Map<RoomId, RoomGroupEntry>();
  const roomGroups: RoomGroupEntry[] = [];
  Object.values(ROOMS).forEach((rm) => {
    const grp = new THREE.Group();
    stationGroup.add(grp);
    const entry: RoomGroupEntry = {
      roomId: rm.id,
      group: grp,
      centerX: rm.center.x,
      centerZ: rm.center.z,
      microProps: [],
      spinners: [],
    };
    roomGroupMap.set(rm.id, entry);
    roomGroups.push(entry);
  });

  let activeRoom: RoomGroupEntry = roomGroups[0];
  const setActiveRoom = (id: RoomId) => {
    activeRoom = roomGroupMap.get(id) || roomGroups[0];
  };
  const registerSpinner = (s: SpinnerEntry) => {
    spinners.push(s);
    activeRoom.spinners.push(s);
  };
  const registerMicroProp = (obj: THREE.Object3D) => {
    activeRoom.microProps.push(obj);
  };

  // Geometry & Material Caches (prevents redundant GPU buffers & WebGL shaders)
  const boxGeoCache = new Map<string, THREE.BoxGeometry>();
  const cylGeoCache = new Map<string, THREE.CylinderGeometry>();
  const matCache = new Map<string, THREE.MeshStandardMaterial>();
  const screenMatCache = new Map<THREE.CanvasTexture, THREE.MeshStandardMaterial>();

  const boxGeo = (w: number, h: number, d: number): THREE.BoxGeometry => {
    const k = `${w.toFixed(3)}:${h.toFixed(3)}:${d.toFixed(3)}`;
    let g = boxGeoCache.get(k);
    if (!g) {
      g = new THREE.BoxGeometry(w, h, d);
      boxGeoCache.set(k, g);
    }
    return g;
  };
  const cylGeo = (rt: number, rb: number, h: number, seg = 10): THREE.CylinderGeometry => {
    const k = `${rt.toFixed(3)}:${rb.toFixed(3)}:${h.toFixed(3)}:${seg}`;
    let g = cylGeoCache.get(k);
    if (!g) {
      g = new THREE.CylinderGeometry(rt, rb, h, seg);
      cylGeoCache.set(k, g);
    }
    return g;
  };
  const stdMat = (
    color: number,
    roughness = 0.5,
    metalness = 0.2,
    emissive?: number,
    emissiveIntensity = 1.0
  ): THREE.MeshStandardMaterial => {
    const k = `${color}:${roughness}:${metalness}:${emissive ?? -1}:${emissiveIntensity}`;
    let m = matCache.get(k);
    if (!m) {
      m = new THREE.MeshStandardMaterial({
        color,
        roughness,
        metalness,
        ...(emissive !== undefined ? { emissive, emissiveIntensity } : {}),
      });
      matCache.set(k, m);
    }
    return m;
  };

  // Shared PBR Materials (#49 neutral metallic space station steel/titanium tones)
  const metalDark = new THREE.MeshStandardMaterial({ color: 0x1e2430, roughness: 0.36, metalness: 0.74 });
  const metalSlate = new THREE.MeshStandardMaterial({ color: 0x2d3544, roughness: 0.4, metalness: 0.68 });
  const metalLight = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.25, metalness: 0.85 });
  const metalBrass = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.28, metalness: 0.82 });
  const ceramicWhite = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.35, metalness: 0.15 });
  const sofaNavyMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.76, metalness: 0.08 });
  const sofaMaroonMat = new THREE.MeshStandardMaterial({ color: 0x6b1d37, roughness: 0.76, metalness: 0.08 });
  const sofaTealMat = new THREE.MeshStandardMaterial({ color: 0x115e59, roughness: 0.74, metalness: 0.08 });
  const woodWalnut = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.65, metalness: 0.08 });
  const woodOak = new THREE.MeshStandardMaterial({ color: 0x926239, roughness: 0.62, metalness: 0.06 });
  const pipeMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.35, metalness: 0.82 });
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x064e3b,
    emissiveIntensity: 0.42,
    roughness: 0.48,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x7dd3fc,
    transparent: true,
    opacity: 0.28,
    roughness: 0.08,
    depthWrite: false,
  });

  // Procedural Textures
  const screenWorldTex = createScreenTexture('worldmap');
  const screenRadarTex = createScreenTexture('radar');
  const screenLabTex = createScreenTexture('lab');
  const screenMarketTex = createScreenTexture('market');
  const screenNetTex = createScreenTexture('network');
  const screenGalaxyTex = createScreenTexture('galaxy');
  const screenIneqTex = createScreenTexture('inequality');
  const screenImpactTex = createScreenTexture('impact');
  const screenInfoTex = createScreenTexture('info');
  const screenTvCultureTex = createScreenTexture('tv_culture');

  const batikEmeraldTex = createBatikTexture('#065f46', '#fbbf24');
  const batikRoyalTex = createBatikTexture('#4c1d95', '#f59e0b');
  const batikCrimsonTex = createBatikTexture('#7f1d1d', '#fde68a');
  const artNusantaraTex = createArtworkTexture('nusantara');
  const artWayangTex = createArtworkTexture('wayang');
  const artWorldTex = createArtworkTexture('world_mosaic');

  const makeScreenMat = (tex: THREE.CanvasTexture) => {
    let m = screenMatCache.get(tex);
    if (!m) {
      m = new THREE.MeshStandardMaterial({
        map: tex,
        emissive: 0x38bdf8,
        emissiveMap: tex,
        emissiveIntensity: 0.85,
        roughness: 0.2,
      });
      screenMatCache.set(tex, m);
    }
    return m;
  };

  // ------------------------------------------------------------------
  // REUSABLE HIGH-DETAIL COMPOSITE BUILDERS
  // ------------------------------------------------------------------

  // Non-colliding Deck Floor Rug / Pad for grounding furniture clusters
  const addFloorPad = (x: number, z: number, w: number, d: number, rotY: number, color = 0x1e293b, border = 0x38bdf8) => {
    const g = new THREE.Group();
    g.position.set(x, 0.014, z);
    g.rotation.y = rotY;
    const pad = new THREE.Mesh(
      boxGeo(w, 0.016, d),
      stdMat(color, 0.88, 0.1)
    );
    pad.position.y = 0.008;
    const rim = new THREE.Mesh(
      boxGeo(w + 0.1, 0.008, d + 0.1),
      stdMat(border, 0.4, 0.2, border, 0.55)
    );
    rim.position.y = -0.002;
    g.add(rim, pad);
    activeRoom.group.add(g);
  };

  // Multi-Joint Ergonomic Sci-Fi Chair with 5-Star Wheelbase & Headrest
  const addChair = (parent: THREE.Group, x: number, z: number, rotY: number, color = 0x0ea5e9) => {
    const chair = new THREE.Group();
    chair.position.set(x, 0, z);
    chair.rotation.y = rotY;

    // 5-star spoke base
    const spokeGeo = boxGeo(0.06, 0.04, 0.3);
    const wheelGeo = cylGeo(0.03, 0.03, 0.03, 8);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const spoke = new THREE.Mesh(spokeGeo, metalLight);
      spoke.position.set(Math.sin(a) * 0.16, 0.04, Math.cos(a) * 0.16);
      spoke.rotation.y = a;
      const wheel = new THREE.Mesh(wheelGeo, metalDark);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(Math.sin(a) * 0.28, 0.03, Math.cos(a) * 0.28);
      chair.add(spoke, wheel);
    }

    const cStem = new THREE.Mesh(cylGeo(0.055, 0.065, 0.36, 10), metalDark);
    cStem.position.y = 0.24;
    const cushionMat = stdMat(color, 0.62, 0.08);
    const seat = new THREE.Mesh(boxGeo(0.56, 0.1, 0.52), cushionMat);
    seat.position.y = 0.45;
    const seatShell = new THREE.Mesh(boxGeo(0.6, 0.05, 0.56), metalDark);
    seatShell.position.y = 0.4;
    const back = new THREE.Mesh(boxGeo(0.5, 0.56, 0.09), cushionMat);
    back.position.set(0, 0.78, 0.23);
    back.rotation.x = -0.1;
    const headrest = new THREE.Mesh(boxGeo(0.32, 0.16, 0.08), metalDark);
    headrest.position.set(0, 1.12, 0.25);
    headrest.rotation.x = -0.05;
    const armGeo = boxGeo(0.06, 0.05, 0.36);
    const armPostGeo = boxGeo(0.04, 0.18, 0.06);
    const armL = new THREE.Mesh(armGeo, metalDark);
    armL.position.set(-0.28, 0.58, 0.02);
    const armPostL = new THREE.Mesh(armPostGeo, metalLight);
    armPostL.position.set(-0.28, 0.49, 0.04);
    const armR = armL.clone();
    armR.position.x = 0.28;
    const armPostR = armPostL.clone();
    armPostR.position.x = 0.28;
    chair.add(cStem, seat, seatShell, back, headrest, armL, armPostL, armR, armPostR);
    parent.add(chair);
  };

  // Micro-Props (Mugs, Documents, Headsets, Desk Lamps) - tracked for distance LOD culling
  const addDeskProps = (parent: THREE.Group, topY: number, variant: 'mug' | 'docs' | 'headset' | 'lamp') => {
    const propGroup = new THREE.Group();
    if (variant === 'mug') {
      const mug = new THREE.Mesh(cylGeo(0.06, 0.055, 0.13, 10), ceramicWhite);
      mug.position.set(0.88, topY + 0.065, 0.25);
      const coffee = new THREE.Mesh(cylGeo(0.05, 0.05, 0.02, 10), stdMat(0x3b1e08, 0.2, 0.05));
      coffee.position.set(0.88, topY + 0.125, 0.25);
      const pad = new THREE.Mesh(boxGeo(0.28, 0.015, 0.22), metalSlate);
      pad.position.set(-0.88, topY + 0.01, 0.22);
      propGroup.add(mug, coffee, pad);
    } else if (variant === 'docs') {
      [0, 1, 2].forEach((i) => {
        const doc = new THREE.Mesh(
          boxGeo(0.28, 0.025, 0.36),
          i === 1 ? ceramicWhite : stdMat(i === 0 ? 0x38bdf8 : 0xf59e0b, 0.7, 0.05)
        );
        doc.position.set(-0.84, topY + 0.015 + i * 0.028, 0.14);
        doc.rotation.y = (i - 1) * 0.18;
        propGroup.add(doc);
      });
    } else if (variant === 'headset') {
      const stand = new THREE.Mesh(cylGeo(0.04, 0.09, 0.28, 8), metalLight);
      stand.position.set(0.95, topY + 0.14, 0.18);
      const arc = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.022, 8, 16, Math.PI), stdMat(0x0ea5e9, 0.4, 0.3));
      arc.position.set(0.95, topY + 0.28, 0.18);
      const cupGeo = cylGeo(0.05, 0.05, 0.04, 8);
      const cupL = new THREE.Mesh(cupGeo, metalDark);
      cupL.rotation.z = Math.PI / 2;
      cupL.position.set(0.84, topY + 0.25, 0.18);
      const cupR = cupL.clone();
      cupR.position.x = 1.06;
      propGroup.add(stand, arc, cupL, cupR);
    } else {
      const lBase = new THREE.Mesh(cylGeo(0.08, 0.1, 0.04, 10), metalDark);
      lBase.position.set(-0.95, topY + 0.02, -0.2);
      const lArm = new THREE.Mesh(cylGeo(0.02, 0.02, 0.36, 8), metalLight);
      lArm.position.set(-0.95, topY + 0.2, -0.2);
      lArm.rotation.z = -0.25;
      const lHead = new THREE.Mesh(
        new THREE.ConeGeometry(0.1, 0.12, 10),
        stdMat(0xfde68a, 0.4, 0.1, 0xfbbf24, 0.9)
      );
      lHead.position.set(-0.84, topY + 0.36, -0.2);
      lHead.rotation.z = 0.6;
      propGroup.add(lBase, lArm, lHead);
    }
    parent.add(propGroup);
    registerMicroProp(propGroup);
  };

  // Upgraded Futuristic Workstation (LED Desk Trim, VESA Monitor Arm, Tower PC, Backlit Keyboard & Mouse)
  const addWorkstation = (
    x: number,
    z: number,
    rotY: number,
    screenTex: THREE.CanvasTexture,
    chairColor = 0x0ea5e9,
    monitors: 1 | 2 | 3 = 2,
    propVariant: 'mug' | 'docs' | 'headset' | 'lamp' = 'mug'
  ) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rotY;

    // Desk slab + glowing trim strip
    const top = new THREE.Mesh(boxGeo(2.65, 0.09, 1.18), metalDark);
    top.position.y = 0.82;
    const ledStrip = new THREE.Mesh(
      boxGeo(2.67, 0.025, 1.2),
      stdMat(chairColor, 0.35, 0.2, chairColor, 1.0)
    );
    ledStrip.position.y = 0.78;
    const legL = new THREE.Mesh(boxGeo(0.14, 0.78, 0.98), metalLight);
    legL.position.set(-1.16, 0.39, 0);
    const legR = legL.clone();
    legR.position.x = 1.16;
    const modesty = new THREE.Mesh(boxGeo(2.2, 0.42, 0.06), metalSlate);
    modesty.position.set(0, 0.56, -0.4);
    g.add(top, ledStrip, legL, legR, modesty);

    // Under-desk Tower PC with glowing status bar
    const pcTower = new THREE.Mesh(boxGeo(0.28, 0.56, 0.54), metalDark);
    pcTower.position.set(0.92, 0.28, -0.1);
    const pcStrip = new THREE.Mesh(
      boxGeo(0.04, 0.44, 0.03),
      stdMat(chairColor, 0.35, 0.2, chairColor, 1.3)
    );
    pcStrip.position.set(0.92, 0.28, 0.18);
    g.add(pcTower, pcStrip);

    // Articulated Monitor Bar + Curved Monitors
    const bar = new THREE.Mesh(boxGeo(1.7, 0.05, 0.05), metalLight);
    bar.position.set(0, 1.2, -0.34);
    const barPost = new THREE.Mesh(cylGeo(0.05, 0.07, 0.38, 8), metalDark);
    barPost.position.set(0, 1.02, -0.36);
    g.add(bar, barPost);

    const monMat = makeScreenMat(screenTex);
    const monFrameGeo = boxGeo(0.84, 0.52, 0.05);
    const monPlaneGeo = new THREE.PlaneGeometry(0.77, 0.45);
    const monOffsets = monitors === 1 ? [0] : monitors === 2 ? [-0.55, 0.55] : [-0.82, 0, 0.82];
    monOffsets.forEach((mx, idx) => {
      const frame = new THREE.Mesh(monFrameGeo, metalDark);
      frame.position.set(mx, 1.24, -0.26 + (idx === 1 && monitors === 3 ? -0.07 : 0));
      if (monitors > 1) frame.rotation.y = mx < 0 ? 0.22 : mx > 0 ? -0.22 : 0;
      const scr = new THREE.Mesh(monPlaneGeo, monMat);
      scr.position.set(0, 0, 0.03);
      frame.add(scr);
      g.add(frame);
    });

    // Backlit Keyboard + Ergonomic Mouse
    const kb = new THREE.Mesh(boxGeo(0.68, 0.03, 0.24), metalLight);
    kb.position.set(-0.08, 0.88, 0.16);
    const kbGlow = new THREE.Mesh(
      boxGeo(0.62, 0.015, 0.18),
      stdMat(chairColor, 0.35, 0.2, chairColor, 0.7)
    );
    kbGlow.position.set(-0.08, 0.892, 0.16);
    const mouse = new THREE.Mesh(boxGeo(0.08, 0.03, 0.13), metalDark);
    mouse.position.set(0.4, 0.88, 0.17);
    g.add(kb, kbGlow, mouse);

    addDeskProps(g, 0.865, propVariant);
    addChair(g, 0, 0.86, 0, chairColor);
    activeRoom.group.add(g);
  };

  // High-Detail Glass-Front Multi-Blade Server Rack + Overhead Cable Duct
  const addServerRack = (x: number, z: number, rotY: number, ledColor = 0x38bdf8) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rotY;

    const cab = new THREE.Mesh(boxGeo(1.12, 2.55, 0.78), metalDark);
    cab.position.y = 1.275;
    const roofFan = new THREE.Mesh(cylGeo(0.32, 0.34, 0.12, 12), metalLight);
    roofFan.position.y = 2.6;
    const cableDuct = new THREE.Mesh(cylGeo(0.08, 0.08, 1.35, 8), pipeMat);
    cableDuct.position.set(0, 3.25, -0.12);
    g.add(cab, roofFan, cableDuct);

    const ledMat = stdMat(ledColor, 0.35, 0.2, ledColor, 1.4);
    const greenLed = stdMat(0x10b981, 0.35, 0.2, 0x10b981, 1.2);
    const bladeGeo = boxGeo(0.94, 0.24, 0.05);
    const slotGeo = boxGeo(0.62, 0.05, 0.03);
    const dotGeo = boxGeo(0.08, 0.05, 0.03);
    for (let i = 0; i < 6; i++) {
      const y = 0.35 + i * 0.37;
      const blade = new THREE.Mesh(bladeGeo, metalSlate);
      blade.position.set(0, y, 0.38);
      const slot = new THREE.Mesh(slotGeo, ledMat);
      slot.position.set(-0.08, y, 0.41);
      const dot = new THREE.Mesh(dotGeo, greenLed);
      dot.position.set(0.34, y, 0.41);
      g.add(blade, slot, dot);
    }

    const frontGlass = new THREE.Mesh(boxGeo(1.0, 2.35, 0.03), glassMat);
    frontGlass.position.set(0, 1.28, 0.43);
    g.add(frontGlass);
    activeRoom.group.add(g);
  };

  // High-Detail Traditional & Cultural Mannequin with Articulated Arms, Skirt/Coat, & Headdress
  const addMannequin = (
    x: number,
    z: number,
    rotY: number,
    tex: THREE.CanvasTexture,
    accentColor: number,
    headdress: 'crown' | 'udeng' | 'halo' = 'crown'
  ) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rotY;

    const ped1 = new THREE.Mesh(cylGeo(0.56, 0.64, 0.16, 16), woodWalnut);
    ped1.position.y = 0.08;
    const pedRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.55, 0.025, 8, 24),
      stdMat(accentColor, 0.35, 0.2, accentColor, 1.0)
    );
    pedRim.rotation.x = Math.PI / 2;
    pedRim.position.y = 0.17;
    const stand = new THREE.Mesh(cylGeo(0.045, 0.055, 0.65, 8), metalBrass);
    stand.position.y = 0.48;

    const skirtMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.58 });
    const skirt = new THREE.Mesh(cylGeo(0.24, 0.38, 0.62, 14), skirtMat);
    skirt.position.y = 0.88;
    const torso = new THREE.Mesh(cylGeo(0.26, 0.21, 0.52, 14), skirtMat);
    torso.position.y = 1.4;

    const sash = new THREE.Mesh(boxGeo(0.56, 0.11, 0.28), stdMat(accentColor, 0.4, 0.4));
    sash.position.set(0, 1.44, 0);
    sash.rotation.z = 0.32;

    const armGeo = new THREE.CapsuleGeometry(0.065, 0.36, 4, 8);
    const armL = new THREE.Mesh(armGeo, skirtMat);
    armL.position.set(-0.32, 1.38, 0.05);
    armL.rotation.set(-0.25, 0, 0.22);
    const armR = new THREE.Mesh(armGeo, skirtMat);
    armR.position.set(0.32, 1.38, 0.05);
    armR.rotation.set(-0.25, 0, -0.22);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.155, 14, 12), ceramicWhite);
    head.position.y = 1.82;

    if (headdress === 'crown') {
      const crown = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.2, 6), metalBrass);
      crown.position.y = 2.02;
      g.add(crown);
    } else if (headdress === 'udeng') {
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.045, 8, 16), metalBrass);
      band.rotation.x = Math.PI / 2;
      band.position.y = 1.9;
      g.add(band);
    } else {
      const halo = new THREE.Mesh(
        new THREE.TorusGeometry(0.24, 0.02, 8, 24),
        stdMat(accentColor, 0.35, 0.2, accentColor, 1.1)
      );
      halo.position.set(0, 1.88, -0.06);
      g.add(halo);
    }

    const plaque = new THREE.Mesh(boxGeo(0.36, 0.14, 0.04), metalBrass);
    plaque.position.set(0, 0.12, 0.56);
    plaque.rotation.x = -0.35;

    g.add(ped1, pedRim, stand, skirt, torso, sash, armL, armR, head, plaque);
    activeRoom.group.add(g);
  };

  // High-Detail Lab Microscope + Centrifuge + Reagent Apparatus Builder
  const addLabMicroscope = (parent: THREE.Group, lx: number, ly: number, lz: number) => {
    const m = new THREE.Group();
    m.position.set(lx, ly, lz);
    const base = new THREE.Mesh(boxGeo(0.32, 0.055, 0.38), ceramicWhite);
    base.position.y = 0.028;
    const illuminator = new THREE.Mesh(cylGeo(0.05, 0.06, 0.04, 10), stdMat(0x38bdf8, 0.3, 0.2, 0x38bdf8, 1.4));
    illuminator.position.set(0, 0.07, 0.08);
    const stage = new THREE.Mesh(boxGeo(0.24, 0.025, 0.22), metalDark);
    stage.position.set(0, 0.2, 0.06);
    const arm = new THREE.Mesh(boxGeo(0.07, 0.42, 0.08), ceramicWhite);
    arm.position.set(0, 0.26, -0.1);
    const turret = new THREE.Mesh(cylGeo(0.065, 0.055, 0.08, 10), metalLight);
    turret.position.set(0, 0.34, 0.05);
    const eyeL = new THREE.Mesh(cylGeo(0.026, 0.032, 0.22, 10), metalDark);
    eyeL.position.set(-0.04, 0.5, 0.08);
    eyeL.rotation.x = 0.55;
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.04;
    m.add(base, illuminator, stage, arm, turret, eyeL, eyeR);
    parent.add(m);
    registerMicroProp(m);
  };

  const addSofaAndTable = (
    x: number,
    z: number,
    rotY: number,
    style: 'navy' | 'maroon' | 'teal' = 'navy'
  ) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rotY;
    const cMat = style === 'maroon' ? sofaMaroonMat : style === 'teal' ? sofaTealMat : sofaNavyMat;

    const base = new THREE.Mesh(boxGeo(2.6, 0.34, 1.0), metalDark);
    base.position.y = 0.17;
    const seat = new THREE.Mesh(boxGeo(2.45, 0.18, 0.9), cMat);
    seat.position.set(0, 0.42, 0.04);
    const back = new THREE.Mesh(boxGeo(2.55, 0.56, 0.22), cMat);
    back.position.set(0, 0.72, -0.38);
    const armL = new THREE.Mesh(boxGeo(0.22, 0.42, 0.96), cMat);
    armL.position.set(-1.2, 0.56, 0);
    const armR = armL.clone();
    armR.position.x = 1.2;
    g.add(base, seat, back, armL, armR);

    const tbl = new THREE.Mesh(cylGeo(0.56, 0.56, 0.07, 16), glassMat);
    tbl.position.set(0, 0.42, 1.12);
    const tblLeg = new THREE.Mesh(cylGeo(0.11, 0.24, 0.38, 12), metalLight);
    tblLeg.position.set(0, 0.19, 1.12);
    const book = new THREE.Mesh(boxGeo(0.28, 0.04, 0.2), stdMat(0xf59e0b, 0.65, 0.05));
    book.position.set(-0.14, 0.475, 1.08);
    book.rotation.y = 0.3;
    const cup = new THREE.Mesh(cylGeo(0.05, 0.045, 0.1, 10), ceramicWhite);
    cup.position.set(0.18, 0.5, 1.16);
    g.add(tbl, tblLeg, book, cup);
    registerMicroProp(book);
    registerMicroProp(cup);

    activeRoom.group.add(g);
  };

  const addIndoorPlant = (x: number, z: number, scale = 1, neonHex = 0x38bdf8) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.scale.setScalar(scale);

    const pot = new THREE.Mesh(cylGeo(0.4, 0.28, 0.56, 14), ceramicWhite);
    pot.position.y = 0.28;
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.4, 0.03, 8, 24),
      stdMat(neonHex, 0.35, 0.2, neonHex, 0.9)
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.56;
    g.add(pot, rim);

    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.78, 6), leafMat);
      leaf.position.set(Math.cos(a) * 0.18, 0.82, Math.sin(a) * 0.18);
      leaf.rotation.z = -Math.cos(a) * 0.48;
      leaf.rotation.x = Math.sin(a) * 0.48;
      g.add(leaf);
    }
    activeRoom.group.add(g);
  };

  const shelfBookUnitGeo = boxGeo(0.11, 1.0, 0.36);
  const shelfBookSharedMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.65, metalness: 0.05 });
  const shelfBookDummy = new THREE.Object3D();
  const shelfBookColor = new THREE.Color();

  const addBookshelf = (x: number, z: number, rotY: number, width = 2.2, wood = false) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rotY;
    const frameMat = wood ? woodWalnut : metalDark;
    const back = new THREE.Mesh(boxGeo(width, 2.3, 0.1), frameMat);
    back.position.set(0, 1.15, -0.32);
    const sideL = new THREE.Mesh(boxGeo(0.1, 2.3, 0.68), frameMat);
    sideL.position.set(-width / 2 + 0.05, 1.15, 0);
    const sideR = sideL.clone();
    sideR.position.x = width / 2 - 0.05;
    g.add(back, sideL, sideR);

    const bookColors = [0x0ea5e9, 0xf59e0b, 0x10b981, 0xf43f5e, 0x8b5cf6, 0xe2e8f0];
    const plankGeo = boxGeo(width - 0.06, 0.07, 0.66);
    const shelfYs = [0.2, 0.75, 1.3, 1.85, 2.26];
    const perRowCount = Math.max(1, Math.floor((width - 0.4) / 0.16));
    const totalBooks = 4 * perRowCount;
    const instancedBooks = new THREE.InstancedMesh(shelfBookUnitGeo, shelfBookSharedMat, totalBooks);

    let instIdx = 0;
    shelfYs.forEach((sy, sIdx) => {
      const plank = new THREE.Mesh(plankGeo, frameMat);
      plank.position.set(0, sy, 0);
      g.add(plank);
      if (sIdx < 4) {
        for (let b = 0; b < perRowCount; b++) {
          const bh = 0.28 + ((b + sIdx) % 3) * 0.07;
          shelfBookDummy.position.set(-width / 2 + 0.25 + b * 0.15, sy + 0.035 + bh / 2, 0.04);
          shelfBookDummy.scale.set(1, bh, 1);
          shelfBookDummy.rotation.set(0, 0, 0);
          shelfBookDummy.updateMatrix();
          instancedBooks.setMatrixAt(instIdx, shelfBookDummy.matrix);
          shelfBookColor.setHex(bookColors[(b + sIdx * 2) % bookColors.length]);
          instancedBooks.setColorAt(instIdx, shelfBookColor);
          instIdx++;
        }
      }
    });
    instancedBooks.instanceMatrix.needsUpdate = true;
    if (instancedBooks.instanceColor) instancedBooks.instanceColor.needsUpdate = true;
    instancedBooks.computeBoundingSphere();
    g.add(instancedBooks);
    registerMicroProp(instancedBooks);
    activeRoom.group.add(g);
  };

  const addInfoKiosk = (x: number, z: number, rotY: number, screenTex: THREE.CanvasTexture, accent = 0x38bdf8) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rotY;
    const ped = new THREE.Mesh(cylGeo(0.38, 0.48, 1.1, 12), metalDark);
    ped.position.y = 0.55;
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.44, 0.03, 8, 24),
      stdMat(accent, 0.35, 0.2, accent, 1.0)
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 1.1;
    const board = new THREE.Mesh(boxGeo(1.15, 0.85, 0.08), metalSlate);
    board.position.set(0, 1.65, 0);
    board.rotation.x = -0.18;
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.04, 0.74), makeScreenMat(screenTex));
    scr.position.z = 0.045;
    board.add(scr);
    g.add(ped, rim, board);
    activeRoom.group.add(g);
  };

  const addRoundMeetingTable = (
    x: number,
    z: number,
    chairCount = 3,
    chairColor = 0xf59e0b,
    withHolo = false
  ) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    const col = new THREE.Mesh(cylGeo(0.14, 0.34, 0.75, 12), metalLight);
    col.position.y = 0.375;
    const top = new THREE.Mesh(cylGeo(0.85, 0.85, 0.08, 20), woodOak);
    top.position.y = 0.78;
    g.add(col, top);

    for (let i = 0; i < chairCount; i++) {
      const a = (i / chairCount) * Math.PI * 2 + 0.4;
      addChair(g, Math.cos(a) * 1.02, Math.sin(a) * 1.02, -a + Math.PI / 2, chairColor);
    }

    if (withHolo) {
      const pad = new THREE.Mesh(
        cylGeo(0.28, 0.32, 0.05, 16),
        stdMat(0x38bdf8, 0.35, 0.2, 0x0ea5e9, 1.0)
      );
      pad.position.y = 0.84;
      const holoNode = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.26, 0),
        new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xf59e0b, emissiveIntensity: 0.9, wireframe: true })
      );
      holoNode.position.y = 1.28;
      g.add(pad, holoNode);
      registerSpinner({ obj: holoNode, speedY: 1.1, floatAmp: 0.08, baseY: 1.28 });
    } else {
      const pad = new THREE.Mesh(boxGeo(0.32, 0.03, 0.24), ceramicWhite);
      pad.position.set(-0.2, 0.84, 0.1);
      g.add(pad);
      registerMicroProp(pad);
    }
    activeRoom.group.add(g);
  };

  const addWallDisplay = (x: number, y: number, z: number, rotY: number, w: number, h: number, tex: THREE.CanvasTexture) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = rotY;
    const frame = new THREE.Mesh(boxGeo(w + 0.22, h + 0.22, 0.12), metalDark);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(w, h), makeScreenMat(tex));
    scr.position.z = 0.072;
    g.add(frame, scr);
    activeRoom.group.add(g);
  };

  const addFramedArt = (x: number, y: number, z: number, rotY: number, w: number, h: number, tex: THREE.CanvasTexture) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = rotY;
    const frame = new THREE.Mesh(boxGeo(w + 0.18, h + 0.18, 0.08), metalBrass);
    const canvasMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55 })
    );
    canvasMesh.position.z = 0.052;
    g.add(frame, canvasMesh);
    activeRoom.group.add(g);
  };

  const addHangingLamp = (x: number, z: number, color = 0x38bdf8, radius = 0.9) => {
    const g = new THREE.Group();
    g.position.set(x, 4.15, z);
    const rod = new THREE.Mesh(cylGeo(0.03, 0.03, 0.55, 8), metalLight);
    rod.position.y = -0.275;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.06, 8, 28),
      stdMat(color, 0.35, 0.2, color, 1.25)
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.55;
    const hub = new THREE.Mesh(cylGeo(0.18, 0.12, 0.12, 12), metalDark);
    hub.position.y = -0.55;
    g.add(rod, ring, hub);
    activeRoom.group.add(g);
  };

  const addWallPipes = (x: number, z: number, length: number, rotY: number) => {
    const g = new THREE.Group();
    g.position.set(x, 3.45, z);
    g.rotation.y = rotY;
    [-0.18, 0.18].forEach((dy) => {
      const pipe = new THREE.Mesh(cylGeo(0.08, 0.08, length, 10), pipeMat);
      pipe.rotation.z = Math.PI / 2;
      pipe.position.y = dy;
      g.add(pipe);
    });
    activeRoom.group.add(g);
  };

  // Ceiling Chandeliers across all rooms (placed inside each room's culling group)
  Object.values(ROOMS).forEach((rm) => {
    setActiveRoom(rm.id);
    addHangingLamp(rm.center.x, rm.center.z, rm.accentNum, rm.id === 'central_lobby' ? 1.35 : 0.75);
  });

  // ==================================================================
  // 1. CENTRAL LOBBY
  // ==================================================================
  setActiveRoom('central_lobby');
  addFloorPad(-6.2, 5.4, 3.8, 3.0, Math.PI * 0.75, 0x172554, 0x38bdf8);
  addWorkstation(-6.1, -5.8, Math.PI * 0.2, screenNetTex, 0x0ea5e9, 2, 'lamp');
  addSofaAndTable(-6.2, 5.4, Math.PI * 0.75, 'navy');
  // Waiting Bench & Chairs SE
  const waitGroup = new THREE.Group();
  waitGroup.position.set(2.8, 0, 6.0);
  const waitBase = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.32, 0.85), metalSlate);
  waitBase.position.y = 0.16;
  const waitCush = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.16, 0.75), sofaNavyMat);
  waitCush.position.y = 0.4;
  const sideTable = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.22, 0.48, 12), metalLight);
  sideTable.position.set(0.95, 0.24, -0.75);
  waitGroup.add(waitBase, waitCush, sideTable);
  activeRoom.group.add(waitGroup);
  // South-Center Holographic Map Podium & Security Totem (lobby_info_sc)
  addInfoKiosk(-1.3, 6.1, Math.PI, screenWorldTex, 0x38bdf8);
  // Crew Locker Cabinet SE-Wall & Directory Kiosk NE (clear of widened 6.4m doors)
  addServerRack(7.9, 4.7, -Math.PI / 2, 0x38bdf8);
  // Digital Directory Kiosk & Storage Rack NE
  addInfoKiosk(4.3, -6.5, -Math.PI * 0.15, screenInfoTex, 0x38bdf8);
  addBookshelf(6.2, -6.3, Math.PI, 2.1, false);
  addIndoorPlant(7.8, -4.6, 1.1, 0x38bdf8);
  addWallDisplay(0, 2.35, 7.75, Math.PI, 4.6, 2.1, screenWorldTex);
  addWallDisplay(-8.75, 2.3, -4.5, Math.PI / 2, 3.2, 1.6, screenInfoTex);
  addFramedArt(8.75, 2.3, 4.5, -Math.PI / 2, 2.0, 1.4, artWorldTex);

  // Secret Culture TV Console (Central Lobby SW-South at -3.25, 6.95)
  const tvGroup = new THREE.Group();
  tvGroup.position.set(-3.25, 0, 6.95);
  tvGroup.rotation.y = Math.PI;
  const tvStandBase = new THREE.Mesh(boxGeo(1.08, 0.62, 0.58), metalDark);
  tvStandBase.position.y = 0.31;
  const tvStandTrim = new THREE.Mesh(boxGeo(1.14, 0.06, 0.62), stdMat(0xf59e0b, 0.35, 0.4, 0xd97706, 0.55));
  tvStandTrim.position.y = 0.64;
  const tvCabinet = new THREE.Mesh(boxGeo(1.12, 0.78, 0.44), metalSlate);
  tvCabinet.position.y = 1.06;
  const tvScreenMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 0.58), makeScreenMat(screenTvCultureTex));
  tvScreenMesh.position.set(-0.07, 1.07, 0.228);
  const tvSpeakerPanel = new THREE.Mesh(boxGeo(0.14, 0.56, 0.02), metalDark);
  tvSpeakerPanel.position.set(0.43, 1.07, 0.222);
  const tvDialTop = new THREE.Mesh(cylGeo(0.038, 0.038, 0.04, 10), metalBrass);
  tvDialTop.rotation.x = Math.PI / 2;
  tvDialTop.position.set(0.43, 1.24, 0.24);
  const tvDialBot = tvDialTop.clone();
  tvDialBot.position.y = 1.12;
  const tvAntL = new THREE.Mesh(cylGeo(0.015, 0.015, 0.52, 6), metalLight);
  tvAntL.position.set(-0.16, 1.66, -0.02);
  tvAntL.rotation.z = 0.42;
  const tvAntR = new THREE.Mesh(cylGeo(0.015, 0.015, 0.52, 6), metalLight);
  tvAntR.position.set(0.16, 1.66, -0.02);
  tvAntR.rotation.z = -0.42;
  const tvBeaconMat = new THREE.MeshStandardMaterial({
    color: 0xf472b6,
    emissive: 0xec4899,
    emissiveIntensity: 1.15,
    roughness: 0.2,
  });
  const tvBeacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.15, 0), tvBeaconMat);
  tvBeacon.position.set(0, 1.98, 0);
  registerSpinner({ obj: tvBeacon, speedY: 1.5, floatAmp: 0.08, baseY: 1.98 });

  const tvOutlineGroup = new THREE.Group();
  const tvOutlineEdge = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(1.24, 1.48, 0.68)),
    new THREE.LineBasicMaterial({ color: 0xf472b6, transparent: true, opacity: 0.95 })
  );
  tvOutlineEdge.position.y = 0.74;
  tvOutlineGroup.add(tvOutlineEdge);
  tvOutlineGroup.visible = false;

  const tvHitMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.35, 1.75, 0.9),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
  );
  tvHitMesh.position.y = 0.9;
  tvHitMesh.userData = { interactType: 'secret_tv' };

  tvGroup.add(
    tvStandBase,
    tvStandTrim,
    tvCabinet,
    tvScreenMesh,
    tvSpeakerPanel,
    tvDialTop,
    tvDialBot,
    tvAntL,
    tvAntR,
    tvBeacon,
    tvOutlineGroup,
    tvHitMesh
  );
  activeRoom.group.add(tvGroup);
  const secretTv: SecretTvObject = {
    position: new THREE.Vector3(-3.25, 0, 6.95),
    outlineGroup: tvOutlineGroup,
    hitMesh: tvHitMesh,
    beaconMat: tvBeaconMat,
    beacon: tvBeacon,
  };

  // Multiplayer Waiting Lobby Holographic Customization Terminal (5.0, 0, 3.6)
  const custGroup = new THREE.Group();
  custGroup.position.set(5.0, 0, 3.6);
  custGroup.rotation.y = -Math.PI * 0.75;
  const custBase = new THREE.Mesh(cylGeo(0.46, 0.56, 0.92, 12), metalDark);
  custBase.position.y = 0.46;
  const custTrim = new THREE.Mesh(
    new THREE.TorusGeometry(0.47, 0.03, 8, 24),
    stdMat(0x2dd4bf, 0.3, 0.4, 0x14b8a6, 0.9)
  );
  custTrim.rotation.x = Math.PI / 2;
  custTrim.position.y = 0.92;
  const custMirrorFrame = new THREE.Mesh(boxGeo(0.76, 1.05, 0.08), metalSlate);
  custMirrorFrame.position.set(0, 1.48, -0.05);
  const custScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.62, 0.88),
    stdMat(0x38bdf8, 0.2, 0.1, 0x0ea5e9, 0.85)
  );
  custScreen.position.set(0, 1.48, 0.0);
  const custBeacon = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.14, 0),
    stdMat(0xc084fc, 0.2, 0.3, 0xa855f7, 1.2)
  );
  custBeacon.position.set(0, 2.32, 0);
  registerSpinner({ obj: custBeacon, speedY: 1.5, floatAmp: 0.07, baseY: 2.32 });

  const custOutlineGroup = new THREE.Group();
  const custEdge = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(0.95, 2.05, 0.85)),
    new THREE.LineBasicMaterial({ color: 0x2dd4bf, transparent: true, opacity: 0.95 })
  );
  custEdge.position.y = 1.02;
  custOutlineGroup.add(custEdge);
  custOutlineGroup.visible = false;

  const custHitMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.75, 0.75, 2.2, 8),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
  );
  custHitMesh.position.y = 1.1;
  custHitMesh.userData = { interactType: 'customize_terminal' };

  custGroup.add(custBase, custTrim, custMirrorFrame, custScreen, custBeacon, custOutlineGroup, custHitMesh);
  activeRoom.group.add(custGroup);
  const customizeTerminal: CustomizeTerminalObject = {
    position: new THREE.Vector3(5.0, 0, 3.6),
    group: custGroup,
    beacon: custBeacon,
    outlineGroup: custOutlineGroup,
    hitMesh: custHitMesh,
  };

  // ==================================================================
  // 2. COMMUNICATION ROOM
  // ==================================================================
  setActiveRoom('communication_room');
  addFloorPad(-22.5, -16.4, 3.6, 5.2, 0, 0x0c1a38, 0x0ea5e9);
  addWorkstation(-22.5, -16.4, Math.PI / 2, screenRadarTex, 0x0284c7, 3, 'headset');
  addWorkstation(-15.0, -16.1, -Math.PI / 2, screenNetTex, 0x38bdf8, 2, 'mug');
  addServerRack(-12.5, -17.5, -Math.PI / 2, 0x38bdf8);
  addServerRack(-12.5, -19.8, -Math.PI / 2, 0x0ea5e9);
  // Additional Server Racks SW (comm_racks_sw)
  addServerRack(-23.4, -11.6, 0, 0x10b981);
  addServerRack(-22.0, -11.6, 0, 0x38bdf8);
  // North Comms Signal Booster Console (comm_trans_n)
  addInfoKiosk(-18.0, -21.0, 0, screenNetTex, 0x0ea5e9);
  addWallPipes(-18, -21.6, 12, 0);
  addWallDisplay(-24.7, 2.3, -16.2, Math.PI / 2, 4.0, 1.85, screenWorldTex);
  // Spinning Radar Dish Array NW
  const radarBase = new THREE.Group();
  radarBase.position.set(-22.8, 0, -20.4);
  const rPed = new THREE.Mesh(cylGeo(0.55, 0.72, 1.15, 12), metalDark);
  rPed.position.y = 0.575;
  const rDish = new THREE.Mesh(
    new THREE.ConeGeometry(0.82, 0.48, 16, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.25, side: THREE.DoubleSide })
  );
  rDish.position.y = 1.5;
  rDish.rotation.x = Math.PI / 3;
  const rAnt = new THREE.Mesh(cylGeo(0.03, 0.03, 0.9, 6), metalLight);
  rAnt.position.set(0.45, 1.5, 0.35);
  radarBase.add(rPed, rDish, rAnt);
  activeRoom.group.add(radarBase);
  registerSpinner({ obj: rDish, speedY: 1.3 });

  // ==================================================================
  // 3. TECHNOLOGY LABORATORY
  // ==================================================================
  setActiveRoom('technology_lab');
  addFloorPad(-22.4, 16.6, 3.6, 5.2, 0, 0x15183b, 0x6366f1);
  // Main Lab Bench + Robotic Arm + Compound Microscope + Test Tubes
  const labBench = new THREE.Group();
  labBench.position.set(-22.4, 0, 16.6);
  const lbTop = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.14, 4.8), ceramicWhite);
  lbTop.position.y = 0.9;
  const lbBase = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.85, 4.4), metalDark);
  lbBase.position.y = 0.425;
  labBench.add(lbTop, lbBase);
  // Articulated Robotic Arm
  const armBase = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.2, 12), metalDark);
  armBase.position.set(0, 1.07, -1.4);
  const armSeg = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.85, 0.14),
    new THREE.MeshStandardMaterial({ color: 0x6366f1, metalness: 0.6, roughness: 0.3 })
  );
  armSeg.position.set(0, 1.48, -1.3);
  armSeg.rotation.x = 0.35;
  const armHead = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.2, 8), metalBrass);
  armHead.position.set(0, 1.85, -1.16);
  labBench.add(armBase, armSeg, armHead);

  addLabMicroscope(labBench, 0.15, 0.97, 0.1);

  // Rack of 6 Glowing Test Tubes
  const tubeRack = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, 0.32), metalDark);
  tubeRack.position.set(-0.2, 1.01, 1.3);
  labBench.add(tubeRack);
  const vialsGroup = new THREE.Group();
  for (let ti = 0; ti < 6; ti++) {
    const col = ti % 3 === 0 ? 0x22d3ee : ti % 3 === 1 ? 0xa855f7 : 0x10b981;
    const vial = new THREE.Mesh(
      cylGeo(0.032, 0.032, 0.28, 8),
      stdMat(col, 0.35, 0.2, col, 1.0)
    );
    vial.position.set(-0.34 + (ti % 3) * 0.14, 1.15, 1.24 + Math.floor(ti / 3) * 0.12);
    vialsGroup.add(vial);
  }
  labBench.add(vialsGroup);
  activeRoom.group.add(labBench);
  registerMicroProp(tubeRack);
  registerMicroProp(vialsGroup);
  addChair(activeRoom.group, -20.9, 16.6, -Math.PI / 2, 0x6366f1);

  // Bio-Spectrometer & Spinning Centrifuge Station NW (tech_spectro_nw)
  const specStation = new THREE.Group();
  specStation.position.set(-23.05, 0, 11.9);
  const spDesk = new THREE.Mesh(boxGeo(2.8, 0.12, 1.8), metalSlate);
  spDesk.position.y = 0.88;
  const specBase = new THREE.Mesh(boxGeo(2.5, 0.82, 1.5), metalDark);
  specBase.position.y = 0.41;
  const centBody = new THREE.Mesh(cylGeo(0.36, 0.42, 0.28, 16), ceramicWhite);
  centBody.position.set(-0.65, 1.08, 0);
  const centRotor = new THREE.Mesh(
    cylGeo(0.28, 0.28, 0.08, 6),
    stdMat(0x38bdf8, 0.35, 0.2, 0x0ea5e9, 0.9)
  );
  centRotor.position.set(-0.65, 1.24, 0);
  const specMon = new THREE.Mesh(boxGeo(0.85, 0.55, 0.08), metalDark);
  specMon.position.set(0.55, 1.22, -0.2);
  const specScr = new THREE.Mesh(new THREE.PlaneGeometry(0.76, 0.46), makeScreenMat(screenLabTex));
  specScr.position.z = 0.045;
  specMon.add(specScr);
  specStation.add(spDesk, specBase, centBody, centRotor, specMon);
  activeRoom.group.add(specStation);
  registerSpinner({ obj: centRotor, speedY: 4.5 });

  // Sample & Equipment Cabinet SW + Lab Compute Rack SE
  addBookshelf(-22.5, 20.7, Math.PI, 2.6, false);
  addServerRack(-15.0, 20.7, Math.PI, 0x6366f1);
  addWallDisplay(-24.75, 2.25, 16.5, Math.PI / 2, 3.8, 1.8, screenLabTex);

  // Cryo Bio-Tech Experiment Cylinders E
  [17.2, 19.6].forEach((cz) => {
    const cryo = new THREE.Group();
    cryo.position.set(-12.5, 0, cz);
    const capB = new THREE.Mesh(cylGeo(0.55, 0.6, 0.35, 16), metalDark);
    capB.position.y = 0.175;
    const tube = new THREE.Mesh(cylGeo(0.46, 0.46, 2.0, 16), glassMat);
    tube.position.y = 1.35;
    const core = new THREE.Mesh(
      cylGeo(0.16, 0.16, 1.7, 12),
      stdMat(0x22d3ee, 0.3, 0.2, 0x06b6d4, 1.5)
    );
    core.position.y = 1.35;
    const capT = capB.clone();
    capT.position.y = 2.52;
    cryo.add(capB, tube, core, capT);
    activeRoom.group.add(cryo);
  });

  // Companion Lab Robot (tech_bot_ce)
  const labBot = new THREE.Group();
  labBot.position.set(-15.0, 0, 15.2);
  const botWheel = new THREE.Mesh(cylGeo(0.38, 0.44, 0.24, 14), metalDark);
  botWheel.position.y = 0.12;
  const botBody = new THREE.Mesh(cylGeo(0.34, 0.38, 0.55, 14), ceramicWhite);
  botBody.position.y = 0.54;
  const botHead = new THREE.Mesh(boxGeo(0.52, 0.34, 0.42), metalSlate);
  botHead.position.y = 1.02;
  const botEyeL = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 8, 8),
    stdMat(0x38bdf8, 0.25, 0.2, 0x38bdf8, 1.8)
  );
  botEyeL.position.set(-0.12, 1.04, 0.22);
  const botEyeR = botEyeL.clone();
  botEyeR.position.x = 0.12;
  const botArmL = new THREE.Mesh(boxGeo(0.08, 0.36, 0.12), metalLight);
  botArmL.position.set(-0.42, 0.64, 0.1);
  botArmL.rotation.x = -0.45;
  const botArmR = botArmL.clone();
  botArmR.position.x = 0.42;
  const botAnt = new THREE.Mesh(cylGeo(0.02, 0.02, 0.28, 6), metalLight);
  botAnt.position.set(0, 1.32, 0);
  labBot.add(botWheel, botBody, botHead, botEyeL, botEyeR, botArmL, botArmR, botAnt);
  activeRoom.group.add(labBot);
  registerSpinner({ obj: labBot, speedY: 0.7, floatAmp: 0.05, baseY: 0.04 });

  // Center Holographic DNA/AI Core Pedestal
  const techHolo = new THREE.Group();
  techHolo.position.set(-18.0, 0, 14.2);
  const thPed = new THREE.Mesh(cylGeo(0.52, 0.62, 0.85, 14), metalDark);
  thPed.position.y = 0.425;
  const thOrb = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.28, 0.07, 48, 8),
    stdMat(0xa855f7, 0.3, 0.2, 0x9333ea, 1.1)
  );
  thOrb.position.y = 1.45;
  techHolo.add(thPed, thOrb);
  activeRoom.group.add(techHolo);
  registerSpinner({ obj: thOrb, speedY: 1.0, speedX: 0.4, floatAmp: 0.08, baseY: 1.45 });

  // ==================================================================
  // 4. NAVIGATION ROOM
  // ==================================================================
  setActiveRoom('navigation_room');
  addWorkstation(-40.8, 4.8, Math.PI, screenGalaxyTex, 0x2563eb, 3, 'headset');
  addWorkstation(-40.9, -4.8, 0, screenRadarTex, 0x0ea5e9, 2, 'docs');
  addServerRack(-36.9, -5.4, 0, 0x2563eb);
  addServerRack(-35.5, -5.4, 0, 0x38bdf8);
  addWorkstation(-36.3, 5.2, Math.PI, screenWorldTex, 0x0ea5e9, 2, 'lamp');
  // Miniature Spaceship Display Pedestal SE
  const shipPed = new THREE.Group();
  shipPed.position.set(-32.8, 0, 4.8);
  const spBase = new THREE.Mesh(cylGeo(0.68, 0.82, 0.9, 14), metalDark);
  spBase.position.y = 0.45;
  const miniShip = new THREE.Group();
  miniShip.position.y = 1.45;
  const msHull = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.15, 12), ceramicWhite);
  msHull.rotation.x = Math.PI / 2;
  const msWing = new THREE.Mesh(boxGeo(1.1, 0.05, 0.42), stdMat(0x2563eb, 0.35, 0.6));
  const msCanopy = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), glassMat);
  msCanopy.position.set(0, 0.12, -0.1);
  miniShip.add(msHull, msWing, msCanopy);
  shipPed.add(spBase, miniShip);
  activeRoom.group.add(shipPed);
  registerSpinner({ obj: miniShip, speedY: 0.65, floatAmp: 0.06, baseY: 1.45 });
  addWallDisplay(-43.7, 2.35, 0, Math.PI / 2, 5.2, 2.2, screenGalaxyTex);

  // ==================================================================
  // 5. CULTURAL ROOM
  // ==================================================================
  setActiveRoom('cultural_room');
  addFloorPad(22.5, -15.0, 3.4, 4.4, 0, 0x0c2d27, 0x10b981);
  [-17.0, -19.5].forEach((vz, idx) => {
    const vit = new THREE.Group();
    vit.position.set(13.0, 0, vz);
    const ped = new THREE.Mesh(boxGeo(1.15, 0.95, 1.15), woodWalnut);
    ped.position.y = 0.475;
    const dome = new THREE.Mesh(boxGeo(0.96, 1.1, 0.96), glassMat);
    dome.position.y = 1.5;
    const art = new THREE.Mesh(
      idx === 0 ? new THREE.OctahedronGeometry(0.32, 1) : new THREE.TorusKnotGeometry(0.24, 0.07, 40, 8),
      new THREE.MeshStandardMaterial({ map: idx === 0 ? batikEmeraldTex : batikRoyalTex, roughness: 0.4 })
    );
    art.position.y = 1.48;
    vit.add(ped, dome, art);
    activeRoom.group.add(vit);
    registerSpinner({ obj: art, speedY: 0.85 });
  });
  addSofaAndTable(22.5, -15.0, -Math.PI / 2, 'teal');
  // Two High-Detail Traditional Mannequins NE
  addMannequin(21.7, -20.0, -0.35, batikEmeraldTex, 0xf59e0b, 'crown');
  addMannequin(23.5, -20.0, -0.5, batikRoyalTex, 0x38bdf8, 'udeng');
  // Cultural Bookshelf SE + Artifact Pedestal N
  addBookshelf(23.1, -11.1, Math.PI, 2.4, true);
  addInfoKiosk(15.7, -20.6, 0.25, screenInfoTex, 0x10b981);
  // World Culture Hologram Center-North
  const cultHolo = new THREE.Group();
  cultHolo.position.set(18.0, 0, -14.5);
  const chBase = new THREE.Mesh(cylGeo(0.55, 0.68, 0.82, 14), woodOak);
  chBase.position.y = 0.41;
  const chGlobe = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 18, 14),
    new THREE.MeshStandardMaterial({ map: artWorldTex, emissive: 0x10b981, emissiveIntensity: 0.35 })
  );
  chGlobe.position.y = 1.48;
  cultHolo.add(chBase, chGlobe);
  activeRoom.group.add(cultHolo);
  registerSpinner({ obj: chGlobe, speedY: 0.65, floatAmp: 0.06, baseY: 1.48 });
  addFramedArt(24.75, 2.35, -18.8, -Math.PI / 2, 2.2, 1.6, artNusantaraTex);
  addFramedArt(11.25, 2.35, -14.2, Math.PI / 2, 2.0, 1.5, artWorldTex);

  // Chapter 4 Secret Quest (#39): Tall Cabinet, Locked Box "Febriyani" on Top, and Movable Step-Ladder
  const cabinetGroup = new THREE.Group();
  cabinetGroup.position.set(19.4, 0, -21.25);
  const cabBody = new THREE.Mesh(boxGeo(1.45, 2.35, 0.9), woodWalnut);
  cabBody.position.y = 1.175;
  const cabTrim = new THREE.Mesh(boxGeo(1.52, 0.08, 0.96), metalDark);
  cabTrim.position.y = 2.34;
  const cabDoorL = new THREE.Mesh(boxGeo(0.66, 2.05, 0.05), woodOak);
  cabDoorL.position.set(-0.35, 1.14, 0.45);
  const cabDoorR = cabDoorL.clone();
  cabDoorR.position.x = 0.35;
  const cabKnobL = new THREE.Mesh(cylGeo(0.03, 0.03, 0.06, 8), metalBrass);
  cabKnobL.rotation.x = Math.PI / 2;
  cabKnobL.position.set(-0.08, 1.14, 0.49);
  const cabKnobR = cabKnobL.clone();
  cabKnobR.position.x = 0.08;
  cabinetGroup.add(cabBody, cabTrim, cabDoorL, cabDoorR, cabKnobL, cabKnobR);
  activeRoom.group.add(cabinetGroup);

  // Secret Box "Febriyani" resting atop tall cabinet (y = 2.38)
  const boxGroup = new THREE.Group();
  boxGroup.position.set(19.4, 2.38, -21.25);
  const chestBody = new THREE.Mesh(boxGeo(0.48, 0.24, 0.34), stdMat(0x6d2817, 0.52, 0.18));
  chestBody.position.y = 0.12;
  const chestLid = new THREE.Mesh(boxGeo(0.5, 0.08, 0.36), woodWalnut);
  chestLid.position.y = 0.26;
  const chestClasp = new THREE.Mesh(boxGeo(0.11, 0.12, 0.04), stdMat(0xfbbf24, 0.25, 0.7, 0xf59e0b, 0.85));
  chestClasp.position.set(0, 0.21, 0.185);
  const boxOutlineGroup = new THREE.Group();
  const boxOutlineEdge = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(0.62, 0.42, 0.48)),
    new THREE.LineBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.95 })
  );
  boxOutlineEdge.position.y = 0.18;
  boxOutlineGroup.add(boxOutlineEdge);
  boxOutlineGroup.visible = false;
  const boxHitMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 0.85, 0.85),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
  );
  boxHitMesh.position.y = 0.22;
  boxHitMesh.userData = { interactType: 'aulia_box' };
  boxGroup.add(chestBody, chestLid, chestClasp, boxOutlineGroup, boxHitMesh);
  activeRoom.group.add(boxGroup);

  // Movable Aluminum Step-Ladder (tangga)
  const ladderRestPos = new THREE.Vector3(14.8, 0, -14.8);
  const ladderPlacedPos = new THREE.Vector3(19.4, 0, -20.05);
  const ladderGroup = new THREE.Group();
  ladderGroup.position.copy(ladderRestPos);
  ladderGroup.rotation.y = 0.4;
  const railGeo = boxGeo(0.06, 1.72, 0.07);
  const railL = new THREE.Mesh(railGeo, metalLight);
  railL.position.set(-0.26, 0.86, 0);
  railL.rotation.x = 0.12;
  const railR = railL.clone();
  railR.position.x = 0.26;
  const rearRailL = new THREE.Mesh(railGeo, metalSlate);
  rearRailL.position.set(-0.26, 0.84, -0.36);
  rearRailL.rotation.x = -0.18;
  const rearRailR = rearRailL.clone();
  rearRailR.position.x = 0.26;
  ladderGroup.add(railL, railR, rearRailL, rearRailR);
  for (let r = 0; r < 5; r++) {
    const rung = new THREE.Mesh(boxGeo(0.54, 0.045, 0.11), stdMat(0xf59e0b, 0.4, 0.4));
    rung.position.set(0, 0.28 + r * 0.31, 0.04 - r * 0.036);
    ladderGroup.add(rung);
  }
  const ladderOutlineGroup = new THREE.Group();
  const ladderOutlineEdge = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(0.75, 1.8, 0.72)),
    new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.95 })
  );
  ladderOutlineEdge.position.set(0, 0.9, -0.14);
  ladderOutlineGroup.add(ladderOutlineEdge);
  ladderOutlineGroup.visible = false;
  const ladderHitMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, 1.9, 0.95),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
  );
  ladderHitMesh.position.set(0, 0.95, -0.1);
  ladderHitMesh.userData = { interactType: 'aulia_ladder' };
  ladderGroup.add(ladderOutlineGroup, ladderHitMesh);
  activeRoom.group.add(ladderGroup);

  const auliaQuestObjs: AuliaQuest3DObjects = {
    cabinetGroup,
    boxGroup,
    boxOutlineGroup,
    boxHitMesh,
    boxPos: new THREE.Vector3(19.4, 2.38, -21.25),
    ladderGroup,
    ladderOutlineGroup,
    ladderHitMesh,
    ladderRestPos,
    ladderPlacedPos,
    setLadderPlaced: (placed: boolean) => {
      if (placed) {
        ladderGroup.position.copy(ladderPlacedPos);
        ladderGroup.rotation.y = Math.PI;
      } else {
        ladderGroup.position.copy(ladderRestPos);
        ladderGroup.rotation.y = 0.4;
      }
    },
    setBoxVisible: (visible: boolean) => {
      boxGroup.visible = visible;
    },
  };

  // ==================================================================
  // 6. ECONOMIC ROOM
  // ==================================================================
  setActiveRoom('economic_room');
  addWorkstation(13.2, 18.4, Math.PI / 2, screenMarketTex, 0xf59e0b, 3, 'docs');
  addWorkstation(13.0, 14.7, Math.PI / 2, screenWorldTex, 0x10b981, 2, 'mug');
  addWallDisplay(24.75, 2.3, 16.5, -Math.PI / 2, 4.2, 1.9, screenMarketTex);
  addRoundMeetingTable(18.0, 14.5, 3, 0xf59e0b, true);
  // Financial Data Server Racks NE + Document Archive SE
  addServerRack(22.2, 11.7, 0, 0xf59e0b);
  addServerRack(23.6, 11.7, 0, 0x10b981);
  addBookshelf(22.8, 20.8, Math.PI, 2.6, false);
  // Cargo Crates East
  [14.8, 18.0].forEach((cz, idx) => {
    const crateGroup = new THREE.Group();
    crateGroup.position.set(22.8, 0, cz);
    const crate1 = new THREE.Mesh(
      boxGeo(1.4, 1.1, 1.4),
      stdMat(idx === 0 ? 0xb45309 : 0x0f766e, 0.65, 0.2)
    );
    crate1.position.y = 0.55;
    const crate2 = new THREE.Mesh(
      boxGeo(0.95, 0.85, 0.95),
      stdMat(0x334155, 0.45, 0.6)
    );
    crate2.position.set(0.1, 1.52, -0.1);
    crateGroup.add(crate1, crate2);
    activeRoom.group.add(crateGroup);
  });

  // ==================================================================
  // 7. GLOBAL EXCHANGE ROOM
  // ==================================================================
  setActiveRoom('global_exchange_room');
  addFloorPad(40.8, 4.7, 4.2, 3.0, 0, 0x0f292e, 0x14b8a6);
  const confGroup = new THREE.Group();
  confGroup.position.set(40.8, 0, 4.7);
  const cTop = new THREE.Mesh(boxGeo(3.2, 0.1, 1.5), woodWalnut);
  cTop.position.y = 0.78;
  const cPed1 = new THREE.Mesh(cylGeo(0.18, 0.3, 0.74, 10), metalLight);
  cPed1.position.set(-0.9, 0.37, 0);
  const cPed2 = cPed1.clone();
  cPed2.position.x = 0.9;
  confGroup.add(cTop, cPed1, cPed2);
  addChair(confGroup, -0.8, -0.95, Math.PI, 0x14b8a6);
  addChair(confGroup, 0.8, -0.95, Math.PI, 0x14b8a6);
  addChair(confGroup, -0.8, 0.95, 0, 0x14b8a6);
  addChair(confGroup, 0.8, 0.95, 0, 0x14b8a6);
  addDeskProps(confGroup, 0.83, 'docs');
  activeRoom.group.add(confGroup);

  // Exhibition Shelf + Glokalisasi Mannequins N + Media Desk S
  addBookshelf(40.8, -4.7, 0, 3.2, true);
  addMannequin(35.6, -5.3, 0, batikEmeraldTex, 0x14b8a6, 'halo');
  addMannequin(37.2, -5.3, 0, batikCrimsonTex, 0xfbbf24, 'udeng');
  addWorkstation(36.2, 5.2, Math.PI, screenInfoTex, 0x14b8a6, 2, 'headset');
  addInfoKiosk(32.6, 4.8, Math.PI * 0.75, screenWorldTex, 0x14b8a6);
  addWallDisplay(43.7, 2.35, 0, -Math.PI / 2, 5.2, 2.2, screenWorldTex);

  // ==================================================================
  // 8. WORLD ECONOMY ROOM
  // ==================================================================
  setActiveRoom('world_economy_room');
  addWorkstation(-23.5, -40.9, 0, screenMarketTex, 0xb91c1c, 3, 'docs');
  addBookshelf(-16.4, -41.4, 0, 3.4, false);
  addRoundMeetingTable(-23.4, -31.4, 3, 0xb91c1c, false);
  // Economy High-Frequency Server Rack NW & Cargo Crates S
  addServerRack(-25.6, -38.1, Math.PI / 2, 0xb91c1c);
  addBookshelf(-19.0, -31.0, Math.PI, 2.2, false);
  addWallDisplay(-26.7, 2.3, -36, Math.PI / 2, 4.4, 2.0, screenIneqTex);
  addWallDisplay(-20.0, 2.3, -42.7, 0, 4.0, 1.85, screenWorldTex);
  // Wallerstein 3-Tier Glowing Pyramid
  const pyr = new THREE.Group();
  pyr.position.set(-19.0, 0, -36.0);
  const pBase = new THREE.Mesh(cylGeo(1.2, 1.4, 0.65, 4), metalDark);
  pBase.position.y = 0.325;
  pBase.rotation.y = Math.PI / 4;
  const tier1 = new THREE.Mesh(boxGeo(1.8, 0.32, 1.8), stdMat(0xb91c1c, 0.4, 0.2, 0x7f1d1d, 0.6));
  tier1.position.y = 0.82;
  const tier2 = new THREE.Mesh(boxGeo(1.2, 0.32, 1.2), stdMat(0xf59e0b, 0.4, 0.2, 0xb45309, 0.7));
  tier2.position.y = 1.16;
  const tier3 = new THREE.Mesh(new THREE.ConeGeometry(0.65, 0.7, 4), stdMat(0x38bdf8, 0.35, 0.2, 0x0ea5e9, 1.0));
  tier3.position.y = 1.68;
  tier3.rotation.y = Math.PI / 4;
  pyr.add(pBase, tier1, tier2, tier3);
  activeRoom.group.add(pyr);

  // ==================================================================
  // 9. CULTURAL IDENTITY ROOM
  // ==================================================================
  setActiveRoom('cultural_identity_room');
  addBookshelf(19.6, -36.0, Math.PI / 2, 2.4, true);
  addRoundMeetingTable(23.6, -40.9, 3, 0xd97706, false);
  addMannequin(23.6, -31.4, -Math.PI * 0.75, batikRoyalTex, 0xfbbf24, 'crown');
  addMannequin(19.5, -31.0, Math.PI, batikCrimsonTex, 0xf59e0b, 'udeng');
  addIndoorPlant(25.7, -38.2, 1.05, 0xd97706);
  addInfoKiosk(16.6, -41.2, 0.3, screenInfoTex, 0xd97706);
  addWallDisplay(26.75, 2.3, -36, -Math.PI / 2, 4.0, 1.9, screenLabTex);
  addFramedArt(20.0, 2.35, -42.7, 0, 2.6, 1.8, artNusantaraTex);
  addFramedArt(20.0, 2.35, -29.3, Math.PI, 2.4, 1.7, artWayangTex);

  // ==================================================================
  // 10. GLOBAL BALANCE ROOM (Enriched symmetrically outside cross corridors)
  // ==================================================================
  setActiveRoom('global_balance_room');
  addFloorPad(-5.0, -31.8, 3.2, 2.4, Math.PI * 0.75, 0x2b0a18, 0xf43f5e);
  addFloorPad(5.0, -31.8, 3.2, 2.4, -Math.PI * 0.75, 0x092920, 0x10b981);
  addWorkstation(-5.0, -31.8, Math.PI * 0.75, screenImpactTex, 0xf43f5e, 2, 'docs');
  addWorkstation(5.0, -31.8, -Math.PI * 0.75, screenNetTex, 0x10b981, 2, 'lamp');
  addInfoKiosk(4.5, -40.1, -Math.PI * 0.25, screenImpactTex, 0xf43f5e);
  addServerRack(5.85, -40.2, -Math.PI / 2, 0xf43f5e);
  addWallDisplay(-4.8, 2.3, -41.75, 0, 3.0, 1.5, screenIneqTex);
  addWallDisplay(4.8, 2.3, -41.75, 0, 3.0, 1.5, screenWorldTex);
  addWallDisplay(-4.8, 2.3, -30.25, Math.PI, 2.8, 1.4, screenImpactTex);
  addWallDisplay(4.8, 2.3, -30.25, Math.PI, 2.8, 1.4, screenMarketTex);
  addWallPipes(0, -30.5, 10, 0);

  // ==================================================================
  // 11. EARTH OBSERVATION ROOM
  // ==================================================================
  setActiveRoom('earth_observation_room');
  addFloorPad(-8.3, -57.8, 3.6, 4.4, 0, 0x172554, 0xeab308);
  addFloorPad(8.3, -57.8, 3.6, 4.4, 0, 0x3b0722, 0xeab308);
  addSofaAndTable(-8.3, -57.8, Math.PI * 0.65, 'navy');
  addSofaAndTable(8.3, -57.8, -Math.PI * 0.65, 'maroon');
  // Futuristic Space Telescope aimed out North Window NW
  const scope = new THREE.Group();
  scope.position.set(-7.2, 0, -63.5);
  const scTripod = new THREE.Mesh(cylGeo(0.18, 0.65, 1.1, 6), metalLight);
  scTripod.position.y = 0.55;
  const scTube = new THREE.Mesh(cylGeo(0.24, 0.32, 1.85, 14), ceramicWhite);
  scTube.position.set(0, 1.48, -0.15);
  scTube.rotation.x = Math.PI / 2.6;
  const scLens = new THREE.Mesh(
    cylGeo(0.25, 0.25, 0.1, 14),
    stdMat(0x38bdf8, 0.3, 0.2, 0x0ea5e9, 0.9)
  );
  scLens.position.set(0, 1.78, -0.96);
  scLens.rotation.x = Math.PI / 2.6;
  scope.add(scTripod, scTube, scLens);
  activeRoom.group.add(scope);
  // Observatory Workstation NW + Planetary Monitor Desk NE + Server Racks NE
  addWorkstation(-10.1, -63.1, 0.35, screenGalaxyTex, 0x38bdf8, 2, 'lamp');
  addWorkstation(7.2, -63.5, -0.25, screenWorldTex, 0xeab308, 3, 'mug');
  addServerRack(10.1, -62.5, -Math.PI / 2, 0xeab308);
  addServerRack(10.1, -64.0, -Math.PI / 2, 0x38bdf8);
  // South Briefing Tables SW & SE
  addRoundMeetingTable(-6.2, -50.6, 2, 0xeab308, false);
  addRoundMeetingTable(6.2, -50.6, 2, 0x38bdf8, false);
  addIndoorPlant(-10.0, -50.4, 1.15, 0xeab308);
  addIndoorPlant(10.0, -50.4, 1.15, 0xeab308);
  addFramedArt(-11.7, 2.35, -57.8, Math.PI / 2, 2.4, 1.7, artWorldTex);
  addFramedArt(11.7, 2.35, -57.8, -Math.PI / 2, 2.4, 1.7, artNusantaraTex);

  // ==================================================================
  // PHYSICAL 3D VENT GRATES
  // ==================================================================
  const vents: VentObject[] = VENTS.map((v) => {
    const vGroup = new THREE.Group();
    vGroup.position.set(v.x, 0, v.z);

    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.08, 1.45), metalDark);
    frame.position.y = 0.02;
    vGroup.add(frame);

    const shaft = new THREE.Mesh(
      new THREE.PlaneGeometry(1.15, 1.15),
      new THREE.MeshBasicMaterial({ color: 0x020617 })
    );
    shaft.rotation.x = -Math.PI / 2;
    shaft.position.y = 0.065;
    vGroup.add(shaft);

    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.85,
    });
    const rim = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.03, 1.52), ringMat);
    rim.position.y = 0.015;
    vGroup.add(rim);

    const ventOutlineMat = new THREE.LineBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.95 });
    const ventOutlineGroup = new THREE.Group();
    const ventEdge = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1.6, 0.14, 1.6)),
      ventOutlineMat
    );
    ventEdge.position.y = 0.07;
    ventOutlineGroup.add(ventEdge);
    ventOutlineGroup.visible = false;
    vGroup.add(ventOutlineGroup);

    const ventHitMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.65, 0.45, 1.65),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
    );
    ventHitMesh.position.y = 0.22;
    ventHitMesh.userData = { interactType: 'vent', ventId: v.id };
    vGroup.add(ventHitMesh);

    const lid = new THREE.Group();
    lid.position.set(0, 0.08, -0.58);
    const lidBase = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.04, 1.16), metalLight);
    lidBase.position.set(0, 0, 0.58);
    lid.add(lidBase);
    for (let s = -0.36; s <= 0.36; s += 0.24) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.05, 0.1), metalDark);
      slat.position.set(0, 0.025, 0.58 + s);
      lid.add(slat);
    }
    vGroup.add(lid);
    stationGroup.add(vGroup);

    return {
      id: v.id,
      x: v.x,
      z: v.z,
      lid,
      ringMat,
      openProgress: 0,
      outlineGroup: ventOutlineGroup,
      hitMesh: ventHitMesh,
    };
  });

  // ==================================================================
  // INTERACTIVE 3D SOCIOLOGY THEORY BOOKS (11 Physical Props Across Rooms)
  // ==================================================================
  const bookCoverGeo = boxGeo(0.36, 0.075, 0.48);
  const bookPagesGeo = boxGeo(0.31, 0.058, 0.44);
  const bookSpineGeo = boxGeo(0.06, 0.082, 0.485);
  const bookBeaconGeo = new THREE.OctahedronGeometry(0.09, 0);
  const bookHaloGeo = new THREE.RingGeometry(0.24, 0.31, 20);
  const bookOutlineEdgeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(0.43, 0.12, 0.55));
  const bookOutlineRingGeo = new THREE.RingGeometry(0.29, 0.36, 24);
  const bookHitGeo = new THREE.BoxGeometry(0.72, 0.65, 0.72);
  const bookHitMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
    colorWrite: false,
  });
  const pagesMat = stdMat(0xf8fafc, 0.8, 0.02);

  // Shared 4-point star sparkle sprite texture for unread books
  const bookStarTex = (() => {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const ctx = c.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.25, 'rgba(253,230,138,0.92)');
      grad.addColorStop(0.6, 'rgba(56,189,248,0.45)');
      grad.addColorStop(1, 'rgba(56,189,248,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(32, 4);
      ctx.quadraticCurveTo(34, 28, 60, 32);
      ctx.quadraticCurveTo(34, 36, 32, 60);
      ctx.quadraticCurveTo(30, 36, 4, 32);
      ctx.quadraticCurveTo(30, 28, 32, 4);
      ctx.fill();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  })();

  const sparkleCount = 12;
  const theoryBooks: TheoryBookObject[] = THEORY_BOOKS.map((bookDef, idx) => {
    setActiveRoom(bookDef.roomId);
    const accentNum = parseInt(bookDef.accentHex.replace('#', ''), 16);
    const bGroup = new THREE.Group();
    bGroup.position.set(bookDef.position.x, bookDef.position.y, bookDef.position.z);
    bGroup.rotation.y = (idx % 4 - 1.5) * 0.28;

    const coverMat = stdMat(accentNum, 0.42, 0.28);
    const haloMat = new THREE.MeshStandardMaterial({
      color: accentNum,
      emissive: accentNum,
      emissiveIntensity: 1.2,
      roughness: 0.2,
      side: THREE.DoubleSide,
    });

    const cover = new THREE.Mesh(bookCoverGeo, coverMat);
    cover.position.y = 0.04;
    const pages = new THREE.Mesh(bookPagesGeo, pagesMat);
    pages.position.set(0.025, 0.042, 0);
    const spine = new THREE.Mesh(bookSpineGeo, metalBrass);
    spine.position.set(-0.16, 0.042, 0);

    const halo = new THREE.Mesh(bookHaloGeo, haloMat);
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = 0.008;

    const beacon = new THREE.Mesh(bookBeaconGeo, haloMat);
    beacon.position.y = 0.42;

    // Gentle starlight sparkle particles around unread books
    const spPositions = new Float32Array(sparkleCount * 3);
    for (let s = 0; s < sparkleCount; s++) {
      const a = (s / sparkleCount) * Math.PI * 2;
      const r = 0.24 + (s % 3) * 0.09;
      spPositions[s * 3] = Math.cos(a) * r;
      spPositions[s * 3 + 1] = 0.14 + (s / sparkleCount) * 0.65;
      spPositions[s * 3 + 2] = Math.sin(a) * r;
    }
    const spGeo = new THREE.BufferGeometry();
    spGeo.setAttribute('position', new THREE.BufferAttribute(spPositions, 3));
    const sparkleMat = new THREE.PointsMaterial({
      size: 0.26,
      map: bookStarTex,
      color: 0xfde68a,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const sparkles = new THREE.Points(spGeo, sparkleMat);

    // Subtle proximity/hover highlight outline (hidden unless within range or hovered)
    const outlineGroup = new THREE.Group();
    const outlineMat = new THREE.LineBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.95 });
    const edgeLines = new THREE.LineSegments(bookOutlineEdgeGeo, outlineMat);
    edgeLines.position.y = 0.048;
    const outlineRingMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ringOutline = new THREE.Mesh(bookOutlineRingGeo, outlineRingMat);
    ringOutline.rotation.x = -Math.PI / 2;
    ringOutline.position.y = 0.014;
    outlineGroup.add(edgeLines, ringOutline);
    outlineGroup.visible = false;

    const hitMesh = new THREE.Mesh(bookHitGeo, bookHitMat);
    hitMesh.position.y = 0.25;
    hitMesh.userData = { interactType: 'book', bookId: bookDef.id, roomId: bookDef.roomId };

    bGroup.add(cover, pages, spine, halo, beacon, sparkles, outlineGroup, hitMesh);
    activeRoom.group.add(bGroup);
    registerSpinner({ obj: beacon, speedY: 1.6, floatAmp: 0.07, baseY: 0.42 });

    return {
      id: bookDef.id,
      roomId: bookDef.roomId,
      position: new THREE.Vector3(bookDef.position.x, bookDef.position.y, bookDef.position.z),
      group: bGroup,
      haloMat,
      beacon,
      sparkles,
      sparkleMat,
      outlineGroup,
      outlineMat,
      outlineRingMat,
      hitMesh,
    };
  });

  return {
    vents,
    theoryBooks,
    spinners,
    roomGroups,
    secretTv,
    customizeTerminal,
    auliaQuestObjs,
  };
}
