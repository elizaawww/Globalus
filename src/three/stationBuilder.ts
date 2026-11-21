import * as THREE from 'three';
import {
  DOORS,
  ROOMS,
  WALKABLE_RECTS,
  WALL_COLLIDERS,
  WALL_HEIGHT,
  WALL_SEGMENTS,
  WALL_THICK,
} from '../data/stationLayout';
import { MissionId, RoomId } from '../types/game';
import {
  populateStationFurniture,
  RoomGroupEntry,
  SpinnerEntry,
  TheoryBookObject,
  VentObject,
} from './furnitureBuilder';
import {
  createBatikTexture,
  createEarthTexture,
  createMetallicFloorTexture,
  createWallPanelTexture,
} from './proceduralTextures';

export type DoorLockVisualState = 'none' | 'chapter_locked' | 'completed_locked';

export interface DoorObject {
  id: string;
  x: number;
  z: number;
  orientation: 'horizontal' | 'vertical';
  width: number;
  accentNum: number;
  leftLeaf: THREE.Mesh;
  rightLeaf: THREE.Mesh;
  openProgress: number;
  statusMat: THREE.MeshStandardMaterial;
  lockBadgeGroup: THREE.Group;
  lockBadgeMat: THREE.MeshBasicMaterial;
  lockVisualState: DoorLockVisualState;
}

const doorLockTexCache = new Map<'chapter_locked' | 'completed_locked', THREE.CanvasTexture>();

export function getDoorLockBadgeTexture(kind: 'chapter_locked' | 'completed_locked'): THREE.CanvasTexture {
  const existing = doorLockTexCache.get(kind);
  if (existing) return existing;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 512, 256);
    const isCompleted = kind === 'completed_locked';
    ctx.fillStyle = isCompleted ? 'rgba(6, 78, 59, 0.96)' : 'rgba(69, 10, 10, 0.96)';
    ctx.strokeStyle = isCompleted ? '#34d399' : '#fb7185';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.roundRect(16, 20, 480, 216, 36);
    ctx.fill();
    ctx.stroke();

    // Crisp vector padlock icon (no OS emoji font clipping)
    const cx = isCompleted ? 218 : 256;
    const cy = 96;
    ctx.strokeStyle = isCompleted ? '#6ee7b7' : '#fda4af';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(cx, cy - 22, 22, Math.PI, 0, false);
    ctx.stroke();
    ctx.fillStyle = isCompleted ? '#34d399' : '#f43f5e';
    ctx.beginPath();
    ctx.roundRect(cx - 28, cy - 22, 56, 46, 10);
    ctx.fill();
    ctx.fillStyle = isCompleted ? '#064e3b' : '#450a0a';
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fill();

    if (isCompleted) {
      // Crisp green checkmark next to lock
      ctx.strokeStyle = '#6ee7b7';
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(276, 94);
      ctx.lineTo(294, 112);
      ctx.lineTo(324, 72);
      ctx.stroke();
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 44px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(isCompleted ? 'COMPLETED' : 'LOCKED', 256, 178);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  doorLockTexCache.set(kind, tex);
  return tex;
}

export interface TerminalObject {
  roomId: RoomId;
  missionId?: MissionId;
  position: THREE.Vector3;
  beacon: THREE.Mesh;
  beaconMat: THREE.MeshStandardMaterial;
  screenMat: THREE.MeshStandardMaterial;
  outlineGroup: THREE.Group;
  outlineMat: THREE.LineBasicMaterial;
  outlineRingMat: THREE.MeshBasicMaterial;
  hitMesh: THREE.Mesh;
}

export interface StationWorld {
  stationGroup: THREE.Group;
  doors: DoorObject[];
  vents: VentObject[];
  theoryBooks: TheoryBookObject[];
  terminals: TerminalObject[];
  interactHitMeshes: THREE.Object3D[];
  wallBoxes: THREE.Box3[];
  animatedSpinners: SpinnerEntry[];
  roomGroups: RoomGroupEntry[];
  localLights: [THREE.PointLight, THREE.PointLight];
  earthMesh: THREE.Mesh;
  starPoints: THREE.InstancedMesh;
  maxStars: number;
  shuttleGroup: THREE.Group;
}

function scaleBoxTopBottomUv(geo: THREE.BoxGeometry, rx: number, rz: number): void {
  const uv = geo.attributes.uv;
  // Indices 8..15 correspond to +Y and -Y faces in Three.js BoxGeometry
  for (let i = 8; i < 16 && i < uv.count; i++) {
    uv.setXY(i, uv.getX(i) * rx, uv.getY(i) * rz);
  }
  uv.needsUpdate = true;
}

function getRoomWindowSide(x: number, z: number, side: 'north' | 'south' | 'east' | 'west'): boolean {
  for (const room of Object.values(ROOMS)) {
    if (room.hasSpaceWindow !== side) continue;
    const b = room.bounds;
    if (side === 'north' && Math.abs(z - b.minZ) < 0.6 && x >= b.minX + 1.5 && x <= b.maxX - 1.5) return true;
    if (side === 'south' && Math.abs(z - b.maxZ) < 0.6 && x >= b.minX + 1.5 && x <= b.maxX - 1.5) return true;
    if (side === 'west' && Math.abs(x - b.minX) < 0.6 && z >= b.minZ + 1.5 && z <= b.maxZ - 1.5) return true;
    if (side === 'east' && Math.abs(x - b.maxX) < 0.6 && z >= b.minZ + 1.5 && z <= b.maxZ - 1.5) return true;
  }
  return false;
}

export function buildStationWorld(scene: THREE.Scene, maxAniso: number, isSoftwareGl: boolean): StationWorld {
  const stationGroup = new THREE.Group();
  scene.add(stationGroup);

  const floorTex = createMetallicFloorTexture(maxAniso);
  const wallTex = createWallPanelTexture(maxAniso);
  const earthTex = createEarthTexture();
  const batikTex = createBatikTexture('#065f46', '#fbbf24');

  const wallMat = new THREE.MeshStandardMaterial({
    map: wallTex,
    roughness: 0.45,
    metalness: 0.48,
  });

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.32,
    metalness: 0.8,
  });

  const windowGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x7dd3fc,
    transparent: true,
    opacity: 0.2,
    roughness: 0.08,
    metalness: 0.1,
    depthWrite: false,
  });

  // Single Shared Floor Material across all 27 rects (UVs scaled per slab)
  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTex,
    roughness: 0.4,
    metalness: 0.58,
  });
  const trimMatCache = new Map<number, THREE.MeshStandardMaterial>();

  const wallBoxes: THREE.Box3[] = [];

  // 1. Floors, Room Neon Perimeter Strips, & Overhead Structural Beams
  WALKABLE_RECTS.forEach((rect) => {
    const w = rect.maxX - rect.minX;
    const d = rect.maxZ - rect.minZ;
    const cx = (rect.minX + rect.maxX) / 2;
    const cz = (rect.minZ + rect.maxZ) / 2;

    const floorGeo = new THREE.BoxGeometry(w, 0.2, d);
    scaleBoxTopBottomUv(floorGeo, w / 4, d / 4);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(cx, -0.1, cz);
    floor.receiveShadow = !isSoftwareGl;
    stationGroup.add(floor);

    if (rect.roomId && rect.trimColor) {
      let trimMat = trimMatCache.get(rect.trimColor);
      if (!trimMat) {
        trimMat = new THREE.MeshStandardMaterial({
          color: rect.trimColor,
          emissive: rect.trimColor,
          emissiveIntensity: 0.95,
          roughness: 0.25,
        });
        trimMatCache.set(rect.trimColor, trimMat);
      }
      const stripThickness = 0.14;
      const stripY = 0.012;
      const sN = new THREE.Mesh(new THREE.BoxGeometry(w - 0.6, 0.02, stripThickness), trimMat);
      sN.position.set(cx, stripY, rect.minZ + 0.35);
      const sS = sN.clone();
      sS.position.z = rect.maxZ - 0.35;
      const sW = new THREE.Mesh(new THREE.BoxGeometry(stripThickness, 0.02, d - 0.6), trimMat);
      sW.position.set(rect.minX + 0.35, stripY, cz);
      const sE = sW.clone();
      sE.position.x = rect.maxX - 0.35;
      stationGroup.add(sN, sS, sW, sE);

      const beam = new THREE.Mesh(new THREE.BoxGeometry(w, 0.28, 0.32), frameMat);
      beam.position.set(cx, 4.25, cz);
      stationGroup.add(beam);
    }
  });

  // 2. Exact Procedural Outer Walls & Panoramic Space Windows (1:1 synced with stationLayout WALL_SEGMENTS)
  const solidWallGeo = new THREE.BoxGeometry(2.0, WALL_HEIGHT, WALL_THICK);
  const lowBulkheadGeo = new THREE.BoxGeometry(2.0, 1.05, WALL_THICK);
  const topBeamGeo = new THREE.BoxGeometry(2.0, 0.7, WALL_THICK);
  const glassGeo = new THREE.BoxGeometry(2.0, 2.45, 0.08);
  const mullionGeo = new THREE.BoxGeometry(0.14, 2.5, 0.24);
  const cornerPillarGeo = new THREE.BoxGeometry(WALL_THICK, WALL_HEIGHT, WALL_THICK);

  WALL_SEGMENTS.forEach((seg) => {
    const isHoriz = seg.side === 'north' || seg.side === 'south';
    const segLen = isHoriz ? seg.maxX - seg.minX : seg.maxZ - seg.minZ;
    const count = Math.max(1, Math.round(segLen / 2));
    const tileLen = segLen / count;
    const scaleX = tileLen / 2;

    const wallCenterZ = (seg.minZ + seg.maxZ) / 2;
    const wallCenterX = (seg.minX + seg.maxX) / 2;
    const innerEdge =
      seg.side === 'north'
        ? seg.maxZ
        : seg.side === 'south'
          ? seg.minZ
          : seg.side === 'west'
            ? seg.maxX
            : seg.minX;

    for (let i = 0; i < count; i++) {
      const along = (isHoriz ? seg.minX : seg.minZ) + (i + 0.5) * tileLen;
      const wx = isHoriz ? along : wallCenterX;
      const wz = isHoriz ? wallCenterZ : along;
      const checkX = isHoriz ? wx : innerEdge;
      const checkZ = isHoriz ? innerEdge : wz;
      const isWindow = getRoomWindowSide(checkX, checkZ, seg.side);

      const group = new THREE.Group();
      group.position.set(wx, 0, wz);
      group.rotation.y = isHoriz ? 0 : Math.PI / 2;
      group.scale.x = scaleX;

      if (isWindow) {
        const low = new THREE.Mesh(lowBulkheadGeo, frameMat);
        low.position.y = 0.525;
        const top = new THREE.Mesh(topBeamGeo, frameMat);
        top.position.y = WALL_HEIGHT - 0.35;
        const glass = new THREE.Mesh(glassGeo, windowGlassMat);
        glass.position.y = 2.275;
        const mullion = new THREE.Mesh(mullionGeo, frameMat);
        mullion.position.set(0.95, 2.275, 0);
        group.add(low, top, glass, mullion);
      } else {
        const mesh = new THREE.Mesh(solidWallGeo, wallMat);
        mesh.position.y = WALL_HEIGHT / 2;
        mesh.castShadow = !isSoftwareGl;
        mesh.receiveShadow = !isSoftwareGl;
        group.add(mesh);
      }
      stationGroup.add(group);
    }

    wallBoxes.push(
      new THREE.Box3(
        new THREE.Vector3(seg.minX, 0, seg.minZ),
        new THREE.Vector3(seg.maxX, WALL_HEIGHT, seg.maxZ)
      )
    );
  });

  // Render flush exterior 90-degree corner pillars matching WALL_COLLIDERS
  WALL_COLLIDERS.forEach((wc) => {
    if (!wc.id.startsWith('wall_corner_')) return;
    const corner = new THREE.Mesh(cornerPillarGeo, frameMat);
    corner.position.set((wc.minX + wc.maxX) / 2, WALL_HEIGHT / 2, (wc.minZ + wc.maxZ) / 2);
    corner.receiveShadow = !isSoftwareGl;
    stationGroup.add(corner);
    wallBoxes.push(
      new THREE.Box3(
        new THREE.Vector3(wc.minX, 0, wc.minZ),
        new THREE.Vector3(wc.maxX, WALL_HEIGHT, wc.maxZ)
      )
    );
  });

  // 3. Automatic Sliding Doors
  const doors: DoorObject[] = DOORS.map((d) => {
    const doorGroup = new THREE.Group();
    doorGroup.position.set(d.x, 0, d.z);
    if (d.orientation === 'vertical') {
      doorGroup.rotation.y = Math.PI / 2;
    }

    const accentNum = parseInt(d.accentHex.replace('#', ''), 16);
    const statusMat = new THREE.MeshStandardMaterial({
      color: accentNum,
      emissive: accentNum,
      emissiveIntensity: 1.0,
    });

    const pillarGeo = new THREE.BoxGeometry(0.4, 4.1, 0.52);
    const leftPillar = new THREE.Mesh(pillarGeo, frameMat);
    leftPillar.position.set(-d.width / 2 + 0.15, 2.05, 0);
    const rightPillar = new THREE.Mesh(pillarGeo, frameMat);
    rightPillar.position.set(d.width / 2 - 0.15, 2.05, 0);
    const header = new THREE.Mesh(new THREE.BoxGeometry(d.width, 0.75, 0.54), frameMat);
    header.position.set(0, 3.72, 0);
    const lightStrip = new THREE.Mesh(new THREE.BoxGeometry(d.width - 0.8, 0.12, 0.58), statusMat);
    lightStrip.position.set(0, 3.38, 0);

    const leafW = (d.width - 0.6) / 2;
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.32,
      metalness: 0.75,
    });
    const leftLeaf = new THREE.Mesh(new THREE.BoxGeometry(leafW, 3.3, 0.18), leafMat);
    leftLeaf.position.set(-leafW / 2, 1.65, 0);
    const rightLeaf = new THREE.Mesh(new THREE.BoxGeometry(leafW, 3.3, 0.18), leafMat);
    rightLeaf.position.set(leafW / 2, 1.65, 0);

    const lockBadgeMat = new THREE.MeshBasicMaterial({
      map: getDoorLockBadgeTexture('chapter_locked'),
      transparent: true,
      depthTest: true,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    const badgeGeo = new THREE.PlaneGeometry(1.75, 0.88);
    const frontBadge = new THREE.Mesh(badgeGeo, lockBadgeMat);
    frontBadge.position.set(0, 1.92, 0.16);
    const backBadge = new THREE.Mesh(badgeGeo, lockBadgeMat);
    backBadge.position.set(0, 1.92, -0.16);
    backBadge.rotation.y = Math.PI;
    const lockBadgeGroup = new THREE.Group();
    lockBadgeGroup.add(frontBadge, backBadge);
    lockBadgeGroup.visible = false;

    doorGroup.add(leftPillar, rightPillar, header, lightStrip, leftLeaf, rightLeaf, lockBadgeGroup);
    stationGroup.add(doorGroup);

    return {
      id: d.id,
      x: d.x,
      z: d.z,
      orientation: d.orientation,
      width: d.width,
      accentNum,
      leftLeaf,
      rightLeaf,
      openProgress: 0,
      statusMat,
      lockBadgeGroup,
      lockBadgeMat,
      lockVisualState: 'none' as DoorLockVisualState,
    };
  });

  // 4. Interactive Mission Terminals & Thematic Centerpieces
  const terminals: TerminalObject[] = [];
  const animatedSpinners: StationWorld['animatedSpinners'] = [];
  const termBaseEdgeGeo = new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.62, 0.78, 0.98, 12));
  const termScreenEdgeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.04, 0.66, 0.14));
  const termRingGeo = new THREE.RingGeometry(0.76, 0.88, 28);
  const termHitGeo = new THREE.CylinderGeometry(0.95, 0.95, 2.3, 8);
  const hitProxyMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
    colorWrite: false,
  });

  Object.values(ROOMS).forEach((room) => {
    const tPos = room.terminalPos;
    const termGroup = new THREE.Group();
    termGroup.position.set(tPos.x, 0, tPos.z);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.72, 0.95, 12), frameMat);
    base.position.y = 0.475;
    base.castShadow = !isSoftwareGl;
    termGroup.add(base);

    const screenMat = new THREE.MeshStandardMaterial({
      color: room.accentNum,
      emissive: room.accentNum,
      emissiveIntensity: 0.95,
      roughness: 0.2,
    });
    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.58, 0.08), screenMat);
    screen.position.set(0, 1.25, 0);
    screen.rotation.x = -0.32;
    termGroup.add(screen);

    const beaconMat = new THREE.MeshStandardMaterial({
      color: room.accentNum,
      emissive: room.accentNum,
      emissiveIntensity: 1.3,
      roughness: 0.15,
      metalness: 0.4,
    });
    const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), beaconMat);
    beacon.position.set(0, 2.2, 0);
    termGroup.add(beacon);

    // Subtle proximity/hover highlight outline (hidden by default)
    const outlineGroup = new THREE.Group();
    const outlineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.95 });
    const baseOutline = new THREE.LineSegments(termBaseEdgeGeo, outlineMat);
    baseOutline.position.y = 0.49;
    const screenOutline = new THREE.LineSegments(termScreenEdgeGeo, outlineMat);
    screenOutline.position.set(0, 1.25, 0);
    screenOutline.rotation.x = -0.32;
    const outlineRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const floorOutline = new THREE.Mesh(termRingGeo, outlineRingMat);
    floorOutline.rotation.x = -Math.PI / 2;
    floorOutline.position.y = 0.025;
    outlineGroup.add(baseOutline, screenOutline, floorOutline);
    outlineGroup.visible = false;
    termGroup.add(outlineGroup);

    const hitMesh = new THREE.Mesh(termHitGeo, hitProxyMat);
    hitMesh.position.y = 1.15;
    hitMesh.userData = { interactType: 'terminal', roomId: room.id, missionId: room.missionId };
    termGroup.add(hitMesh);

    animatedSpinners.push({ obj: beacon, speedY: 1.6, floatAmp: 0.14, baseY: 2.2 });
    stationGroup.add(termGroup);

    terminals.push({
      roomId: room.id,
      missionId: room.missionId,
      position: new THREE.Vector3(tPos.x, 0, tPos.z),
      beacon,
      beaconMat,
      screenMat,
      outlineGroup,
      outlineMat,
      outlineRingMat,
      hitMesh,
    });
  });

  const addHoloTable = (x: number, z: number, colorHex: number, kind: 'earth' | 'nav' | 'exchange' | 'balance' | 'obs') => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);

    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 1.38, 0.85, 16), frameMat);
    plinth.position.y = 0.425;
    g.add(plinth);

    const ringGlow = new THREE.Mesh(
      new THREE.TorusGeometry(1.12, 0.06, 8, 32),
      new THREE.MeshStandardMaterial({ color: colorHex, emissive: colorHex, emissiveIntensity: 1.2 })
    );
    ringGlow.rotation.x = Math.PI / 2;
    ringGlow.position.y = 0.88;
    g.add(ringGlow);

    if (kind === 'earth') {
      // Emergency Meeting Button + Global Network Globe
      const btn = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.36, 0.16, 16),
        new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 1.0 })
      );
      btn.position.set(0, 0.94, 0.55);
      g.add(btn);
    }

    if (kind === 'earth' || kind === 'obs') {
      const globe = new THREE.Mesh(
        new THREE.SphereGeometry(kind === 'obs' ? 1.05 : 0.7, 24, 18),
        new THREE.MeshStandardMaterial({
          map: earthTex,
          emissive: 0x0ea5e9,
          emissiveIntensity: 0.35,
          roughness: 0.35,
        })
      );
      globe.position.y = kind === 'obs' ? 2.15 : 1.85;
      g.add(globe);
      animatedSpinners.push({ obj: globe, speedY: 0.35 });

      const orbitRing = new THREE.Mesh(
        new THREE.TorusGeometry(kind === 'obs' ? 1.45 : 1.02, 0.025, 8, 36),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 0.9 })
      );
      orbitRing.position.y = globe.position.y;
      orbitRing.rotation.set(0.5, 0.3, 0);
      g.add(orbitRing);
      animatedSpinners.push({ obj: orbitRing, speedY: -0.7, speedX: 0.25 });
    } else if (kind === 'nav') {
      for (let i = 0; i < 3; i++) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.45 + i * 0.24, 0.025, 8, 28),
          new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x2563eb, emissiveIntensity: 1.0 })
        );
        ring.position.y = 1.65;
        ring.rotation.set(i * 0.6, i * 0.8, 0);
        g.add(ring);
        animatedSpinners.push({ obj: ring, speedY: (i % 2 === 0 ? 1 : -1) * (0.6 + i * 0.2) });
      }
    } else if (kind === 'exchange') {
      const batikSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.58, 20, 16),
        new THREE.MeshStandardMaterial({ map: batikTex, roughness: 0.45, metalness: 0.2 })
      );
      batikSphere.position.y = 1.68;
      g.add(batikSphere);
      animatedSpinners.push({ obj: batikSphere, speedY: 0.5 });
    } else if (kind === 'balance') {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 1.2, 12), frameMat);
      pillar.position.y = 1.45;
      const beam = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.1), frameMat);
      beam.position.y = 2.02;
      const panL = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.2, 0.12, 12),
        new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.8 })
      );
      panL.position.set(-0.8, 1.75, 0);
      const panR = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.2, 0.12, 12),
        new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xe11d48, emissiveIntensity: 0.8 })
      );
      panR.position.set(0.8, 1.75, 0);
      g.add(pillar, beam, panL, panR);
    }

    stationGroup.add(g);
  };

  addHoloTable(0, 0, 0x38bdf8, 'earth');
  addHoloTable(-35.7, 0, 0x2563eb, 'nav');
  addHoloTable(35.7, 0, 0x10b981, 'exchange');
  addHoloTable(0, -36, 0xf43f5e, 'balance');
  addHoloTable(0, -55, 0xeab308, 'obs');

  // 5. Populate Detailed Furniture, Interactive Theory Books, Room Culling Groups & Physical Floor Vents
  const { vents, theoryBooks, roomGroups } = populateStationFurniture(stationGroup, isSoftwareGl);

  // 2 Dynamic Local Room PointLights (replaces 11 simultaneous per-room PointLights for 60fps shading)
  const localLightA = new THREE.PointLight(0x38bdf8, 2.5, 24, 1.3);
  localLightA.position.set(0, 3.6, 0);
  const localLightB = new THREE.PointLight(0x0ea5e9, 2.1, 24, 1.3);
  localLightB.position.set(0, 3.6, -36);
  stationGroup.add(localLightA, localLightB);
  const localLights: [THREE.PointLight, THREE.PointLight] = [localLightA, localLightB];

  // 6. Outer Space Environment + Docking Shuttle (for Prolog cutscene!)
  const earthMesh = new THREE.Mesh(
    new THREE.SphereGeometry(28, 40, 32),
    new THREE.MeshStandardMaterial({
      map: earthTex,
      roughness: 0.55,
      metalness: 0.08,
      emissive: 0x082f49,
      emissiveIntensity: 0.35,
    })
  );
  earthMesh.position.set(0, -6, -112);
  scene.add(earthMesh);

  const atmo = new THREE.Mesh(
    new THREE.SphereGeometry(29.4, 32, 24),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.16, side: THREE.BackSide })
  );
  earthMesh.add(atmo);

  const ringedPlanet = new THREE.Group();
  ringedPlanet.position.set(-115, 22, -40);
  const pBody = new THREE.Mesh(
    new THREE.SphereGeometry(14, 24, 20),
    new THREE.MeshStandardMaterial({ color: 0x8b5cf6, roughness: 0.65, emissive: 0x2e1065, emissiveIntensity: 0.3 })
  );
  const pRing = new THREE.Mesh(
    new THREE.RingGeometry(18, 26, 48),
    new THREE.MeshBasicMaterial({ color: 0xc4b5fd, side: THREE.DoubleSide, transparent: true, opacity: 0.45 })
  );
  pRing.rotation.x = Math.PI / 2.6;
  pRing.rotation.y = 0.3;
  ringedPlanet.add(pBody, pRing);
  scene.add(ringedPlanet);
  animatedSpinners.push({ obj: ringedPlanet, speedY: 0.08 });

  // Approach Shuttle outside south-east space for Prolog cutscene
  const shuttleGroup = new THREE.Group();
  shuttleGroup.position.set(0, 6, 36);
  const hull = new THREE.Mesh(
    new THREE.CapsuleGeometry(1.1, 3.2, 8, 16),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.72, roughness: 0.28 })
  );
  hull.rotation.x = Math.PI / 2;
  const wing = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.12, 1.6), frameMat);
  const cockpit = new THREE.Mesh(
    new THREE.SphereGeometry(0.75, 16, 12),
    new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, emissive: 0x0c4a6e, clearcoat: 1.0 })
  );
  cockpit.position.set(0, 0.45, -1.35);
  const thruster = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.7, 0.6, 12),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0ea5e9, emissiveIntensity: 1.8 })
  );
  thruster.rotation.x = Math.PI / 2;
  thruster.position.z = 2.1;
  shuttleGroup.add(hull, wing, cockpit, thruster);
  scene.add(shuttleGroup);

  // Starfield InstancedMesh
  const starCount = 550;
  const starGeo = new THREE.OctahedronGeometry(0.32, 0);
  const starMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const starPoints = new THREE.InstancedMesh(starGeo, starMat, starCount);
  const dummy = new THREE.Object3D();
  const c = new THREE.Color();
  const palette = [0xffffff, 0xbae6fd, 0xfde68a, 0xc4b5fd];

  for (let i = 0; i < starCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 135 + Math.random() * 90;
    dummy.position.set(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi) + 5,
      r * Math.sin(phi) * Math.sin(theta) - 20
    );
    dummy.scale.setScalar(0.5 + Math.random() * 1.6);
    dummy.updateMatrix();
    starPoints.setMatrixAt(i, dummy.matrix);
    c.setHex(palette[i % palette.length]);
    starPoints.setColorAt(i, c);
  }
  starPoints.instanceMatrix.needsUpdate = true;
  if (starPoints.instanceColor) starPoints.instanceColor.needsUpdate = true;
  starPoints.computeBoundingSphere();
  scene.add(starPoints);

  const interactHitMeshes: THREE.Object3D[] = [
    ...terminals.map((t) => t.hitMesh),
    ...theoryBooks.map((b) => b.hitMesh),
    ...vents.map((v) => v.hitMesh),
  ];

  return {
    stationGroup,
    doors,
    vents,
    theoryBooks,
    terminals,
    interactHitMeshes,
    wallBoxes,
    animatedSpinners,
    roomGroups,
    localLights,
    earthMesh,
    starPoints,
    maxStars: starCount,
    shuttleGroup,
  };
}
