import * as THREE from 'three';
import { PLAYER_COLORS } from '../data/gameData';
import {
  CharacterAnimState,
  CharacterConfig,
  CostumeStyleId,
  EmoteId,
  HelmetDesignId,
  LobbyCrewNpcId,
  NpcCharacterId,
} from '../types/game';
import {
  createBatikTexture,
  createContactShadowTexture,
  createEarthTexture,
  createNameplateTexture,
} from './proceduralTextures';

export const HELMET_HEAD_MOUNTS: Record<
  HelmetDesignId,
  { y: number; z: number; tiltX: number; scale: number }
> = {
  standard_visor: { y: 0, z: 0, tiltX: 0, scale: 1.0 },
  commander_crest: { y: 0.04, z: -0.02, tiltX: -0.04, scale: 1.02 },
  cyber_recon: { y: 0.015, z: 0.005, tiltX: 0, scale: 1.03 },
  explorer_dome: { y: 0.025, z: -0.02, tiltX: -0.03, scale: 1.05 },
};

export interface ClothSurface {
  geo: THREE.BufferGeometry;
  basePos: Float32Array;
  height: number;
  amplitude: number;
}

export interface CharacterRig {
  root: THREE.Group;
  bodyPivot: THREE.Group;
  headGroup: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftForearm: THREE.Group;
  rightForearm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  capeMesh?: THREE.Object3D;
  capeCloths?: ClothSurface[];
  animatedAccGroups?: Array<{
    obj: THREE.Object3D;
    mode: 'orbit' | 'pulse' | 'wave' | 'ring_spin' | 'wing_L' | 'wing_R';
    speed?: number;
    baseRotX?: number;
    phase?: number;
  }>;
  heldProp?: THREE.Group;
  nameSprite?: THREE.Sprite;
  suitParts: THREE.Mesh[];
}

let sharedShadowTex: THREE.CanvasTexture | null = null;
let sharedBatikEmeraldTex: THREE.CanvasTexture | null = null;
let sharedBatikMaroonTex: THREE.CanvasTexture | null = null;
let sharedBatikGoldTex: THREE.CanvasTexture | null = null;
let sharedEarthTex: THREE.CanvasTexture | null = null;
const batikSmadaTexCache: Partial<Record<CostumeStyleId, THREE.Texture>> = {};

function getBatikSmadaTexture(costume: CostumeStyleId): THREE.Texture | null {
  if (
    costume !== 'batik_smada_merah' &&
    costume !== 'batik_smada_biru' &&
    costume !== 'batik_smada_ungu'
  ) {
    return null;
  }
  if (batikSmadaTexCache[costume]) return batikSmadaTexCache[costume]!;
  const path =
    costume === 'batik_smada_merah'
      ? '/assets/batik/batik_smada_merah.jpg'
      : costume === 'batik_smada_biru'
        ? '/assets/batik/batik_smada_biru.jpg'
        : '/assets/batik/batik_smada_ungu.jpg';
  const fallbackBg =
    costume === 'batik_smada_merah'
      ? '#7f1d1d'
      : costume === 'batik_smada_biru'
        ? '#1d4ed8'
        : '#5b21b6';
  const fallbackTex = createBatikTexture(fallbackBg, '#eab308');
  const loader = new THREE.TextureLoader();
  const loaded = loader.load(
    path,
    (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.needsUpdate = true;
    },
    undefined,
    () => {
      // Fall back safely to procedural batik texture if file fetch fails offline
      loaded.image = fallbackTex.image as unknown as HTMLImageElement;
      loaded.colorSpace = THREE.SRGBColorSpace;
      loaded.needsUpdate = true;
    }
  );
  loaded.colorSpace = THREE.SRGBColorSpace;
  loaded.wrapS = THREE.RepeatWrapping;
  loaded.wrapT = THREE.RepeatWrapping;
  batikSmadaTexCache[costume] = loaded;
  return loaded;
}

function getSharedTextures() {
  if (!sharedShadowTex) sharedShadowTex = createContactShadowTexture();
  if (!sharedBatikEmeraldTex) sharedBatikEmeraldTex = createBatikTexture('#065f46', '#fbbf24');
  if (!sharedBatikMaroonTex) sharedBatikMaroonTex = createBatikTexture('#7f1d1d', '#fbbf24');
  if (!sharedBatikGoldTex) sharedBatikGoldTex = createBatikTexture('#1e3a8a', '#f59e0b');
  if (!sharedEarthTex) sharedEarthTex = createEarthTexture();
  return {
    shadowTex: sharedShadowTex,
    batikEmerald: sharedBatikEmeraldTex,
    batikMaroon: sharedBatikMaroonTex,
    batikGold: sharedBatikGoldTex,
    earthTex: sharedEarthTex,
  };
}

export function buildAstronautRig(
  config: CharacterConfig,
  options?: { showNameplate?: boolean; nameplateSubtitle?: string; ghostMode?: boolean }
): CharacterRig {
  const tex = getSharedTextures();
  const colorEntry = PLAYER_COLORS.find((c) => c.id === config.color) || PLAYER_COLORS[1];
  const isGhost = Boolean(options?.ghostMode);

  const root = new THREE.Group();
  root.name = `astronaut_${config.name}`;

  const suitParts: THREE.Mesh[] = [];
  const animatedAccGroups: NonNullable<CharacterRig['animatedAccGroups']> = [];
  const capeCloths: ClothSurface[] = [];

  // Contact shadow grounded at y = 0.015
  if (!isGhost) {
    const shadowMat = new THREE.MeshBasicMaterial({
      map: tex.shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.55,
    });
    const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.015;
    root.add(shadowPlane);
  }

  const suitMat = new THREE.MeshStandardMaterial({
    color: colorEntry.num,
    roughness: config.costume === 'tactical_armor' ? 0.34 : 0.42,
    metalness: config.costume === 'tactical_armor' ? 0.38 : 0.18,
    transparent: isGhost,
    opacity: isGhost ? 0.42 : 1,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: colorEntry.darkNum,
    roughness: 0.55,
    metalness: 0.4,
    transparent: isGhost,
    opacity: isGhost ? 0.42 : 1,
  });
  const metallicMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.22,
    metalness: 0.88,
    transparent: isGhost,
    opacity: isGhost ? 0.45 : 1,
  });
  const neonMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: config.costume === 'cyber_neon' ? 0x22d3ee : 0x0ea5e9,
    emissiveIntensity: config.costume === 'cyber_neon' ? 1.5 : 0.7,
    roughness: 0.2,
  });
  const visorMat = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    emissive: 0x0c4a6e,
    emissiveIntensity: 0.5,
    roughness: 0.06,
    metalness: 0.28,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
    transparent: isGhost,
    opacity: isGhost ? 0.65 : 1,
  });

  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);

  // Articulated Legs with Knee Guards & Heavy Space Boots
  const makeLeg = (xOffset: number) => {
    const legGroup = new THREE.Group();
    legGroup.position.set(xOffset, 0.68, 0);

    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.145, 0.28, 6, 12), suitMat);
    thigh.position.y = -0.22;
    thigh.castShadow = !isGhost;
    legGroup.add(thigh);

    // Knee joint guard
    const knee = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.22), trimMat);
    knee.position.set(0, -0.35, 0.04);
    legGroup.add(knee);

    // Boot upper + sole tread
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.19, 0.38), trimMat);
    boot.position.set(0, -0.55, 0.05);
    boot.castShadow = !isGhost;
    legGroup.add(boot);

    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.41), metallicMat);
    sole.position.set(0, -0.655, 0.05);
    legGroup.add(sole);

    return legGroup;
  };

  const leftLeg = makeLeg(-0.21);
  const rightLeg = makeLeg(0.21);
  bodyPivot.add(leftLeg, rightLeg);

  // Torso + Costume Styles
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.5, 8, 16), suitMat);
  torso.position.y = 1.1;
  torso.scale.set(1.02, 1.0, 0.86);
  torso.castShadow = !isGhost;
  torso.receiveShadow = !isGhost;
  suitParts.push(torso);
  bodyPivot.add(torso);

  // Waist tech belt & buckle
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.13, 16), trimMat);
  belt.position.y = 0.86;
  belt.scale.set(1.02, 1.0, 0.88);
  bodyPivot.add(belt);

  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.08), metallicMat);
  buckle.position.set(0, 0.86, 0.39);
  bodyPivot.add(buckle);

  const isBatikSmada =
    config.costume === 'batik_smada_merah' ||
    config.costume === 'batik_smada_biru' ||
    config.costume === 'batik_smada_ungu';
  const batikSmadaTex = isBatikSmada ? getBatikSmadaTexture(config.costume) : null;
  const batikSmadaMat = batikSmadaTex
    ? new THREE.MeshStandardMaterial({
        map: batikSmadaTex,
        roughness: 0.54,
        metalness: 0.1,
        transparent: isGhost,
        opacity: isGhost ? 0.5 : 1,
      })
    : null;
  const innerSleeveMat = new THREE.MeshStandardMaterial({
    color: 0x1e2430,
    roughness: 0.55,
    metalness: 0.25,
    transparent: isGhost,
    opacity: isGhost ? 0.42 : 1,
  });

  // Detailed Chestplate + Costume Overlays + Identity Badge
  if (isBatikSmada && batikSmadaMat) {
    const collarMat = new THREE.MeshStandardMaterial({
      map: batikSmadaTex!,
      color: 0xf8fafc,
      roughness: 0.5,
      metalness: 0.1,
    });
    const placketMat = new THREE.MeshStandardMaterial({
      color: 0x1e2430,
      roughness: 0.55,
      metalness: 0.2,
    });
    const buttonMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      roughness: 0.28,
      metalness: 0.85,
    });
    const shirtShell = new THREE.Mesh(
      new THREE.CylinderGeometry(0.435, 0.445, 0.58, 20, 1, false),
      batikSmadaMat
    );
    shirtShell.position.y = 1.1;
    shirtShell.scale.set(1.03, 1.0, 0.88);
    shirtShell.castShadow = !isGhost;

    // Collared front button placket
    const placket = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.48, 0.045), placketMat);
    placket.position.set(0, 1.13, 0.382);
    bodyPivot.add(shirtShell, placket);

    for (let b = 0; b < 5; b++) {
      const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.02, 8), buttonMat);
      btn.rotation.x = Math.PI / 2;
      btn.position.set(0, 1.3 - b * 0.085, 0.405);
      bodyPivot.add(btn);
    }

    // Folded shirt V-collar lapels around neck
    const collarL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.085, 0.16), collarMat);
    collarL.position.set(-0.12, 1.4, 0.22);
    collarL.rotation.set(0.28, 0.22, -0.32);
    const collarR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.085, 0.16), collarMat);
    collarR.position.set(0.12, 1.4, 0.22);
    collarR.rotation.set(0.28, -0.22, 0.32);
    bodyPivot.add(collarL, collarR);
  } else {
    if (config.costume === 'nusantara_batik') {
      const batikWrapMat = new THREE.MeshStandardMaterial({
        map: tex.batikGold,
        roughness: 0.48,
        metalness: 0.24,
      });
      const goldPipingMat = new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        metalness: 0.88,
        roughness: 0.22,
      });
      const tunicShell = new THREE.Mesh(
        new THREE.CylinderGeometry(0.435, 0.445, 0.56, 18, 1, true),
        batikWrapMat
      );
      tunicShell.position.y = 1.1;
      tunicShell.scale.set(1.02, 1.0, 0.88);
      const hemTrim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.024, 8, 22), goldPipingMat);
      hemTrim.rotation.x = Math.PI / 2;
      hemTrim.scale.set(1.03, 0.89, 1);
      hemTrim.position.y = 0.83;
      const collarLapelL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.34, 0.1), goldPipingMat);
      collarLapelL.position.set(-0.11, 1.24, 0.36);
      collarLapelL.rotation.z = 0.24;
      const collarLapelR = collarLapelL.clone();
      collarLapelR.position.x = 0.11;
      collarLapelR.rotation.z = -0.24;
      bodyPivot.add(tunicShell, hemTrim, collarLapelL, collarLapelR);
    }

    const chestPlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, 0.26, 0.11),
      config.costume === 'nusantara_batik'
        ? new THREE.MeshStandardMaterial({ map: tex.batikMaroon, roughness: 0.42, metalness: 0.28 })
        : metallicMat
    );
    chestPlate.position.set(0, 1.14, 0.35);
    bodyPivot.add(chestPlate);

    const idBadge = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.04), neonMat);
    idBadge.position.set(-0.11, 1.19, 0.415);
    bodyPivot.add(idBadge);
  }

  if (config.costume === 'tactical_armor' || config.costume === 'cyber_neon') {
    const pauldronGeo = new THREE.SphereGeometry(0.19, 12, 10);
    const pMat = config.costume === 'cyber_neon' ? neonMat : metallicMat;
    const pL = new THREE.Mesh(pauldronGeo, pMat);
    pL.position.set(-0.48, 1.33, 0);
    pL.scale.set(1.0, 0.65, 1.1);
    const pR = pL.clone();
    pR.position.x = 0.48;
    bodyPivot.add(pL, pR);
  }

  // Head + Helmet Design Variants (Clean visor projection proud of helmet sphere: zero clipping/blue face orb)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.64, 0);
  bodyPivot.add(headGroup);

  const neckCollar = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.055, 8, 20), metallicMat);
  neckCollar.rotation.x = Math.PI / 2;
  neckCollar.position.y = -0.22;
  headGroup.add(neckCollar);

  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.38, 24, 20), suitMat);
  helmet.castShadow = !isGhost;
  headGroup.add(helmet);

  // Visor sits cleanly at z = 0.228 with forward extent 0.416 > helmet radius 0.38 (eliminates Z-fighting/blue patch)
  const hDesign = config.helmet || 'standard_visor';
  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.262, 24, 18), visorMat);
  visor.position.set(0, 0.02, 0.228);
  visor.scale.set(
    hDesign === 'explorer_dome' ? 1.22 : 1.15,
    hDesign === 'cyber_recon' ? 0.62 : 0.78,
    0.72
  );
  headGroup.add(visor);

  const visorRim = new THREE.Mesh(new THREE.TorusGeometry(0.264, 0.028, 10, 28), metallicMat);
  visorRim.position.set(0, 0.02, 0.292);
  visorRim.scale.set(
    hDesign === 'explorer_dome' ? 1.2 : 1.14,
    hDesign === 'cyber_recon' ? 0.65 : 0.81,
    0.45
  );
  headGroup.add(visorRim);

  if (hDesign === 'commander_crest') {
    const crest = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, 0.44), metallicMat);
    crest.position.set(0, 0.37, -0.02);
    const crestGlow = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.055, 0.36), neonMat);
    crestGlow.position.set(0, 0.455, 0);
    headGroup.add(crest, crestGlow);
  } else if (hDesign === 'cyber_recon') {
    const earPodL = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.08, 12), neonMat);
    earPodL.rotation.z = Math.PI / 2;
    earPodL.position.set(-0.39, 0.02, 0);
    const earPodR = earPodL.clone();
    earPodR.position.x = 0.39;
    headGroup.add(earPodL, earPodR);
  } else if (hDesign === 'explorer_dome') {
    const brow = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.03, 8, 20, Math.PI), metallicMat);
    brow.position.set(0, 0.18, 0.14);
    brow.rotation.x = 0.5;
    headGroup.add(brow);
  }

  // Articulated Upper Arms + Elbow Forearm Pivots with Cuffs & Gloves
  const makeArm = (xOffset: number) => {
    const armGroup = new THREE.Group();
    armGroup.position.set(xOffset, 1.3, 0);

    const upperSleeve = new THREE.Mesh(
      new THREE.CapsuleGeometry(isBatikSmada ? 0.125 : 0.112, 0.16, 6, 10),
      isBatikSmada && batikSmadaMat ? batikSmadaMat : suitMat
    );
    upperSleeve.position.y = -0.11;
    upperSleeve.castShadow = !isGhost;
    armGroup.add(upperSleeve);

    if (isBatikSmada && batikSmadaMat) {
      const shortHem = new THREE.Mesh(new THREE.CylinderGeometry(0.132, 0.132, 0.032, 12), batikSmadaMat);
      shortHem.position.y = -0.2;
      armGroup.add(shortHem);
    }

    const forearmGroup = new THREE.Group();
    forearmGroup.position.set(0, -0.22, 0);

    const lowerSleeve = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.098, 0.14, 6, 10),
      isBatikSmada ? innerSleeveMat : suitMat
    );
    lowerSleeve.position.y = -0.09;
    lowerSleeve.castShadow = !isGhost;
    forearmGroup.add(lowerSleeve);

    const cuffMat =
      config.costume === 'cyber_neon'
        ? neonMat
        : config.costume === 'nusantara_batik'
          ? new THREE.MeshStandardMaterial({ map: tex.batikGold, roughness: 0.45, metalness: 0.3 })
          : metallicMat;
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.118, 0.118, 0.065, 12), cuffMat);
    cuff.position.y = -0.17;
    forearmGroup.add(cuff);

    const glove = new THREE.Mesh(new THREE.SphereGeometry(0.122, 12, 10), trimMat);
    glove.position.y = -0.25;
    forearmGroup.add(glove);

    armGroup.add(forearmGroup);
    return { armGroup, forearmGroup };
  };
  const leftArmBuilt = makeArm(-0.53);
  const rightArmBuilt = makeArm(0.53);
  const leftArm = leftArmBuilt.armGroup;
  const rightArm = rightArmBuilt.armGroup;
  const leftForearm = leftArmBuilt.forearmGroup;
  const rightForearm = rightArmBuilt.forearmGroup;
  bodyPivot.add(leftArm, rightArm);

  // --- BODY ACCESSORY & BACKPACK ---
  const bodyAcc = config.body || 'backpack';
  let capeMesh: THREE.Object3D | undefined;
  const createDrapedClothMesh = (
    topWidth: number,
    bottomWidth: number,
    height: number,
    mat: THREE.Material,
    amplitude = 0.08
  ) => {
    const segW = 8;
    const segH = 10;
    const geo = new THREE.PlaneGeometry(1, height, segW, segH);
    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < posAttr.count; i++) {
      const u = posAttr.getX(i); // -0.5..0.5
      const origY = posAttr.getY(i); // -h/2 .. +h/2
      const vDrop = (height * 0.5 - origY) / height; // 0 at shoulder, 1 at hem
      const w = THREE.MathUtils.lerp(topWidth, bottomWidth, vDrop);
      const curveZ = -Math.pow(vDrop, 1.25) * 0.22 - (1 - Math.abs(u * 2)) * 0.045 * vDrop;
      posAttr.setXYZ(i, u * w, -vDrop * height, curveZ);
    }
    posAttr.needsUpdate = true;
    geo.computeVertexNormals();
    const basePos = new Float32Array(posAttr.array.length);
    basePos.set(posAttr.array as Float32Array);
    capeCloths.push({ geo, basePos, height, amplitude });
    return new THREE.Mesh(geo, mat);
  };

  if (
    bodyAcc === 'none' ||
    bodyAcc === 'backpack' ||
    bodyAcc === 'tech_backpack' ||
    bodyAcc === 'cultural_backpack'
  ) {
    const packMat =
      bodyAcc === 'tech_backpack'
        ? new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.28, metalness: 0.65 })
        : bodyAcc === 'cultural_backpack'
          ? new THREE.MeshStandardMaterial({ map: tex.batikEmerald, roughness: 0.48, metalness: 0.22 })
          : trimMat;
    const packGroup = new THREE.Group();
    packGroup.position.set(0, 1.14, -0.39);
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.54, 0.24), packMat);
    pack.castShadow = !isGhost;
    const topCap = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.08, 12), metallicMat);
    topCap.scale.set(1.0, 1.0, 0.55);
    topCap.position.set(0, 0.29, 0);
    const tankL = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.34, 4, 10), metallicMat);
    tankL.position.set(-0.18, 0.02, -0.06);
    const tankR = tankL.clone();
    tankR.position.x = 0.18;
    const nozzleL = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.085, 0.13, 10), metallicMat);
    nozzleL.position.set(-0.14, -0.32, -0.03);
    const nozzleR = nozzleL.clone();
    nozzleR.position.x = 0.14;
    const statusBar = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.055, 0.04), neonMat);
    statusBar.position.set(0, 0.14, -0.13);
    packGroup.add(pack, topCap, tankL, tankR, nozzleL, nozzleR, statusBar);
    bodyPivot.add(packGroup);
  }
  if (bodyAcc === 'cape') {
    const capeMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, side: THREE.DoubleSide, roughness: 0.62 });
    const collarBar = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.036, 8, 22, Math.PI * 1.15), metallicMat);
    collarBar.rotation.x = Math.PI / 2;
    collarBar.rotation.z = -Math.PI * 0.075;
    collarBar.position.set(0, 1.4, -0.04);
    const capePivot = new THREE.Group();
    capePivot.position.set(0, 1.38, -0.37);
    capePivot.rotation.x = 0.14;
    const cloth = createDrapedClothMesh(0.56, 0.94, 0.96, capeMat, 0.075);
    capePivot.add(cloth);
    bodyPivot.add(collarBar, capePivot);
    capeMesh = capePivot;
  } else if (bodyAcc === 'royal_batik_cape') {
    const royalGrp = new THREE.Group();
    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      metalness: 0.9,
      roughness: 0.2,
    });
    const collar = new THREE.Mesh(
      new THREE.TorusGeometry(0.38, 0.045, 8, 22, Math.PI * 1.45),
      goldTrimMat
    );
    collar.rotation.x = Math.PI / 2;
    collar.rotation.z = -Math.PI * 0.225;
    collar.position.set(0, 1.42, -0.02);
    royalGrp.add(collar);

    const claspL = new THREE.Mesh(new THREE.OctahedronGeometry(0.068, 0), goldTrimMat);
    claspL.position.set(-0.34, 1.4, 0.14);
    const claspR = claspL.clone();
    claspR.position.x = 0.34;
    royalGrp.add(claspL, claspR);

    const capeTail = new THREE.Group();
    capeTail.position.set(0, 1.38, -0.39);
    capeTail.rotation.x = 0.16;
    const clothMat = new THREE.MeshStandardMaterial({
      map: tex.batikMaroon,
      side: THREE.DoubleSide,
      roughness: 0.5,
      metalness: 0.14,
    });
    const cloth = createDrapedClothMesh(0.62, 1.04, 1.0, clothMat, 0.085);
    const goldShoulderDrape = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.05, 0.06), goldTrimMat);
    goldShoulderDrape.position.set(0, -0.02, -0.01);
    capeTail.add(cloth, goldShoulderDrape);
    royalGrp.add(capeTail);
    bodyPivot.add(royalGrp);
    capeMesh = capeTail;
  } else if (bodyAcc === 'modern_batik_cape') {
    // Nusantara Tech Mantle — Signature Reward from BIMA (flexible draped batik cloth + armored shoulders)
    const mantleGrp = new THREE.Group();
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      metalness: 0.92,
      roughness: 0.18,
    });
    const darkArmorMat = new THREE.MeshStandardMaterial({
      color: 0x0f2924,
      metalness: 0.68,
      roughness: 0.28,
    });
    const emeraldGlowMat = new THREE.MeshStandardMaterial({
      color: 0x34d399,
      emissive: 0x10b981,
      emissiveIntensity: 1.45,
      roughness: 0.2,
    });
    const batikMantleMat = new THREE.MeshStandardMaterial({
      map: tex.batikEmerald,
      side: THREE.DoubleSide,
      roughness: 0.48,
      metalness: 0.18,
    });

    const collarBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.47, 0.14, 18, 1, true),
      darkArmorMat
    );
    collarBase.position.set(0, 1.43, -0.02);
    const collarRim = new THREE.Mesh(new THREE.TorusGeometry(0.41, 0.028, 8, 24), goldMat);
    collarRim.rotation.x = Math.PI / 2;
    collarRim.position.set(0, 1.49, -0.02);
    mantleGrp.add(collarBase, collarRim);

    const makeShoulderPlate = (side: -1 | 1) => {
      const pGrp = new THREE.Group();
      pGrp.position.set(side * 0.48, 1.38, -0.02);
      pGrp.rotation.z = side * (side === -1 ? 0.34 : 0.2);

      const shell = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.16, 4, 8), darkArmorMat);
      shell.rotation.z = Math.PI / 2;
      const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.04, 0.14), goldMat);
      ridge.position.y = 0.07;
      const vein = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.025, 0.24), emeraldGlowMat);
      vein.position.y = -0.04;
      pGrp.add(shell, ridge, vein);
      return pGrp;
    };
    const leftShoulder = makeShoulderPlate(-1);
    const rightShoulder = makeShoulderPlate(1);
    const asymStrap = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.08, 0.11), batikMantleMat);
    asymStrap.position.set(-0.04, 1.24, 0.34);
    asymStrap.rotation.z = 0.42;
    const strapClasp = new THREE.Mesh(new THREE.OctahedronGeometry(0.065, 0), emeraldGlowMat);
    strapClasp.position.set(-0.24, 1.34, 0.41);
    mantleGrp.add(leftShoulder, rightShoulder, asymStrap, strapClasp);

    const spineCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.1, 0), emeraldGlowMat);
    spineCore.position.set(0, 1.35, -0.42);
    const spineFrame = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.02, 8, 6), goldMat);
    spineFrame.position.set(0, 1.35, -0.41);
    mantleGrp.add(spineCore, spineFrame);

    const mantlePivot = new THREE.Group();
    mantlePivot.position.set(0, 1.38, -0.39);
    mantlePivot.rotation.x = 0.15;
    const drapeCloth = createDrapedClothMesh(0.58, 0.96, 0.96, batikMantleMat, 0.08);
    mantlePivot.add(drapeCloth);
    mantleGrp.add(mantlePivot);
    bodyPivot.add(mantleGrp);

    capeMesh = mantlePivot;
    animatedAccGroups.push({ obj: spineCore, mode: 'pulse', phase: 0.4 });
  } else if (bodyAcc === 'fuzzy_transceiver_pack') {
    // Chapter 3 FUZZY Reward: Quantum Transceiver Pack
    const cyberFrameMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, metalness: 0.78, roughness: 0.28 });
    const magGlow = new THREE.MeshStandardMaterial({
      color: 0xf472b6,
      emissive: 0xec4899,
      emissiveIntensity: 1.4,
      roughness: 0.2,
    });
    const cyanGlow = new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      emissive: 0x06b6d4,
      emissiveIntensity: 1.3,
      roughness: 0.2,
    });
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.56, 0.24), cyberFrameMat);
    chassis.position.set(0, 1.16, -0.39);
    const dishGeo = new THREE.ConeGeometry(0.16, 0.12, 12, 1, true);
    const dishL = new THREE.Mesh(dishGeo, metallicMat);
    dishL.rotation.x = -Math.PI / 2.2;
    dishL.position.set(-0.22, 1.46, -0.45);
    const dishR = dishL.clone();
    dishR.position.x = 0.22;
    const nodeL = new THREE.Mesh(new THREE.OctahedronGeometry(0.055, 0), magGlow);
    nodeL.position.set(-0.22, 1.49, -0.5);
    const nodeR = new THREE.Mesh(new THREE.OctahedronGeometry(0.055, 0), cyanGlow);
    nodeR.position.set(0.22, 1.49, -0.5);
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.34, 10), magGlow);
    core.position.set(0, 1.18, -0.51);
    bodyPivot.add(chassis, dishL, dishR, nodeL, nodeR, core);
    animatedAccGroups.push({ obj: core, mode: 'pulse', phase: 0.5 });
  } else if (bodyAcc === 'bob_hydraulic_frame') {
    // Chapter 4 BOB Reward: Cargo Exo-Stabilizer
    const indMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.72, roughness: 0.32 });
    const darkSteel = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.28 });
    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.62, 0.26), darkSteel);
    spine.position.set(0, 1.15, -0.4);
    const strutL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.72, 10), indMat);
    strutL.position.set(-0.34, 1.24, -0.36);
    strutL.rotation.z = 0.22;
    const strutR = strutL.clone();
    strutR.position.x = 0.34;
    strutR.rotation.z = -0.22;
    const guardL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.36), indMat);
    guardL.position.set(-0.46, 1.44, -0.04);
    const guardR = guardL.clone();
    guardR.position.x = 0.46;
    const beacon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.12, 10),
      new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xd97706, emissiveIntensity: 1.2 })
    );
    beacon.position.set(0, 1.5, -0.42);
    bodyPivot.add(spine, strutL, strutR, guardL, guardR, beacon);
  }
  if (bodyAcc === 'ornamen_batik') {
    // Rich Nusantara Selendang & Batik Vest spanning chest, waist, and shoulders
    const batikVestMat = new THREE.MeshStandardMaterial({ map: tex.batikGold, roughness: 0.46, metalness: 0.28 });
    const batikSelendangMat = new THREE.MeshStandardMaterial({ map: tex.batikMaroon, roughness: 0.46, metalness: 0.24 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.9, roughness: 0.2 });

    const vest = new THREE.Mesh(new THREE.CylinderGeometry(0.445, 0.455, 0.48, 18), batikVestMat);
    vest.position.y = 1.12;
    vest.scale.set(1.02, 1.0, 0.89);

    const selendang = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.068, 8, 24), batikSelendangMat);
    selendang.position.set(0, 1.18, 0);
    selendang.rotation.set(0.28, 0.22, -0.62);
    selendang.scale.set(1.04, 1.04, 0.84);

    const epauletL = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.16, 4, 8), batikSelendangMat);
    epauletL.rotation.z = Math.PI / 2 - 0.15;
    epauletL.position.set(-0.46, 1.4, 0);
    const epauletR = epauletL.clone();
    epauletR.rotation.z = -Math.PI / 2 + 0.15;
    epauletR.position.x = 0.46;

    const brooch = new THREE.Mesh(new THREE.OctahedronGeometry(0.065, 0), goldMat);
    brooch.position.set(0.16, 1.28, 0.4);
    bodyPivot.add(vest, selendang, epauletL, epauletR, brooch);
  }
  if (bodyAcc === 'jaket_astronaut') {
    const jacketMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.42, metalness: 0.48 });
    const trimCyanMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.7, roughness: 0.25 });
    const jacketBody = new THREE.Mesh(new THREE.CylinderGeometry(0.445, 0.455, 0.5, 18), jacketMat);
    jacketBody.position.y = 1.11;
    jacketBody.scale.set(1.03, 1.0, 0.9);
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.085, 10, 22), trimCyanMat);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 1.44;
    const lapelL = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.36, 0.07), trimCyanMat);
    lapelL.position.set(-0.18, 1.15, 0.38);
    const lapelR = lapelL.clone();
    lapelR.position.x = 0.18;
    bodyPivot.add(jacketBody, collar, lapelL, lapelR);
  }
  if (bodyAcc === 'aksesori_futuristik') {
    // Sculpted Curved Multi-Layer Holo-Angel Wings (replaces flat raw boxes)
    const wingChassisMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, metalness: 0.85, roughness: 0.22 });
    const wingBladeMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x7e22ce,
      emissiveIntensity: 0.95,
      roughness: 0.2,
      metalness: 0.65,
      transparent: true,
      opacity: 0.92,
    });
    const wingEdgeMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0ea5e9,
      emissiveIntensity: 1.25,
      roughness: 0.15,
    });

    const dorsalMount = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.42, 12), wingChassisMat);
    dorsalMount.position.set(0, 1.22, -0.38);
    const wingCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 0), wingEdgeMat);
    wingCore.position.set(0, 1.24, -0.5);
    bodyPivot.add(dorsalMount, wingCore);

    const makeFeatherGeo = (len: number, tipLift: number) => {
      const sh = new THREE.Shape();
      sh.moveTo(0, -0.05);
      sh.quadraticCurveTo(len * 0.48, 0.02, len, tipLift);
      sh.quadraticCurveTo(len * 0.65, tipLift - 0.14, len * 0.25, -0.14);
      sh.closePath();
      return new THREE.ExtrudeGeometry(sh, {
        depth: 0.026,
        bevelEnabled: true,
        bevelThickness: 0.008,
        bevelSize: 0.008,
        bevelSegments: 2,
      });
    };
    const primaryGeo = makeFeatherGeo(0.95, 0.44);
    const secondaryGeo = makeFeatherGeo(0.78, 0.18);
    const tertiaryGeo = makeFeatherGeo(0.58, -0.06);

    const makeWingSide = (side: -1 | 1) => {
      const wPivot = new THREE.Group();
      wPivot.position.set(side * 0.16, 1.26, -0.44);
      wPivot.rotation.y = side * -0.42;

      const f1 = new THREE.Mesh(primaryGeo, wingBladeMat);
      f1.position.set(0, 0.1, 0);
      const f2 = new THREE.Mesh(secondaryGeo, wingEdgeMat);
      f2.position.set(0, 0.0, -0.01);
      const f3 = new THREE.Mesh(tertiaryGeo, wingBladeMat);
      f3.position.set(0, -0.11, -0.02);
      if (side === -1) {
        wPivot.scale.x = -1;
      }
      wPivot.add(f1, f2, f3);
      return wPivot;
    };

    const wingL = makeWingSide(-1);
    const wingR = makeWingSide(1);
    bodyPivot.add(wingL, wingR);
    animatedAccGroups.push(
      { obj: wingL, mode: 'wing_L', phase: 0 },
      { obj: wingR, mode: 'wing_R', phase: 0 },
      { obj: wingCore, mode: 'pulse', phase: 0.5 }
    );
  }

  // --- NECK ACCESSORY ---
  if (config.neck !== 'none') {
    const ringColor =
      config.neck === 'medali' || config.neck === 'batik_necklace' || config.neck === 'bob_trade_medallion'
        ? 0xf59e0b
        : config.neck === 'chip_necklace'
          ? 0x0ea5e9
          : config.neck === 'planet_necklace'
            ? 0x10b981
            : config.neck === 'fuzzy_fiber_necklace'
              ? 0xec4899
              : 0x38bdf8;
    const chain = new THREE.Mesh(
      new THREE.TorusGeometry(0.29, config.neck === 'fuzzy_fiber_necklace' ? 0.042 : 0.032, 8, 24),
      new THREE.MeshStandardMaterial({
        color: ringColor,
        emissive: config.neck === 'fuzzy_fiber_necklace' ? 0xec4899 : 0x000000,
        emissiveIntensity: config.neck === 'fuzzy_fiber_necklace' ? 0.8 : 0,
        metalness: 0.85,
        roughness: 0.2,
      })
    );
    chain.rotation.x = Math.PI / 2 + 0.15;
    chain.position.set(0, 1.4, 0.08);
    bodyPivot.add(chain);

    const pendantGeo =
      config.neck === 'planet_necklace'
        ? new THREE.SphereGeometry(0.09, 12, 12)
        : config.neck === 'bob_trade_medallion'
          ? new THREE.CylinderGeometry(0.11, 0.11, 0.035, 8)
          : new THREE.OctahedronGeometry(0.09, 0);
    const pendant = new THREE.Mesh(
      pendantGeo,
      new THREE.MeshStandardMaterial({
        color: ringColor,
        emissive: ringColor,
        emissiveIntensity: 0.7,
        metalness: 0.72,
        roughness: 0.2,
      })
    );
    pendant.position.set(0, 1.34, 0.38);
    if (config.neck === 'bob_trade_medallion') pendant.rotation.x = Math.PI / 2;
    bodyPivot.add(pendant);
  }

  // --- HEAD ACCESSORY MOUNT (Calibrated per-helmet + User HeadwearTransform) ---
  const baseMount = HELMET_HEAD_MOUNTS[hDesign] || HELMET_HEAD_MOUNTS.standard_visor;
  const userT = config.headwearTransform || { offsetY: 0, offsetZ: 0, tiltX: 0, scale: 1 };
  const headwearMount = new THREE.Group();
  headwearMount.position.set(0, baseMount.y + userT.offsetY, baseMount.z + userT.offsetZ);
  headwearMount.rotation.x = baseMount.tiltX + userT.tiltX;
  headwearMount.scale.setScalar(baseMount.scale * userT.scale);
  headGroup.add(headwearMount);

  const hAcc = config.head;
  if (hAcc === 'topi_astronaut' || hAcc === 'futuristic_blue_hat' || hAcc === 'topi_batik') {
    const hatMat =
      hAcc === 'topi_batik'
        ? new THREE.MeshStandardMaterial({ map: tex.batikGold, roughness: 0.52 })
        : new THREE.MeshStandardMaterial({
            color: hAcc === 'futuristic_blue_hat' ? 0x0ea5e9 : 0xf8fafc,
            roughness: 0.32,
            metalness: 0.42,
          });
    const hatBandMat =
      hAcc === 'topi_batik'
        ? new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.85, roughness: 0.22 })
        : neonMat;
    const crownDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.52),
      hatMat
    );
    crownDome.position.set(0, 0.24, -0.01);
    const capBand = new THREE.Mesh(new THREE.TorusGeometry(0.315, 0.024, 8, 24), hatBandMat);
    capBand.rotation.x = Math.PI / 2;
    capBand.position.set(0, 0.27, -0.01);
    const brim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.38, 0.032, 18, 1, false, -Math.PI * 0.35, Math.PI * 0.7),
      hatMat
    );
    brim.position.set(0, 0.25, 0.12);
    brim.rotation.x = 0.16;
    const emblem = new THREE.Mesh(new THREE.OctahedronGeometry(0.04, 0), hatBandMat);
    emblem.position.set(0, 0.36, 0.28);
    headwearMount.add(crownDome, capBand, brim, emblem);
  } else if (hAcc === 'helm_futuristik' || hAcc === 'aksesori_antariksa') {
    const antMat = new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      emissive: 0x0891b2,
      emissiveIntensity: 1.0,
      metalness: 0.7,
      roughness: 0.2,
    });
    const podL = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.07, 12), metallicMat);
    podL.rotation.z = Math.PI / 2;
    podL.position.set(-0.37, 0.12, -0.02);
    const stalkL = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.028, 0.34, 8), metallicMat);
    stalkL.position.set(-0.34, 0.36, -0.02);
    stalkL.rotation.z = 0.15;
    const tipL = new THREE.Mesh(new THREE.OctahedronGeometry(0.055, 0), antMat);
    tipL.position.set(-0.36, 0.54, -0.02);
    headwearMount.add(podL, stalkL, tipL);
    if (hAcc === 'aksesori_antariksa') {
      const podR = podL.clone();
      podR.position.x = 0.37;
      const stalkR = stalkL.clone();
      stalkR.position.x = 0.34;
      stalkR.rotation.z = -0.15;
      const tipR = tipL.clone();
      tipR.position.x = 0.36;
      const dish = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.015, 8, 18), antMat);
      dish.position.set(0, 0.44, -0.1);
      dish.rotation.x = Math.PI / 2.6;
      headwearMount.add(podR, stalkR, tipR, dish);
    }
  } else if (hAcc === 'headset') {
    const earMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.78, roughness: 0.24 });
    const cushionMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, emissive: 0x0284c7, emissiveIntensity: 0.5, roughness: 0.35 });
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.032, 8, 24, Math.PI), earMat);
    band.position.y = 0.06;
    const cupL = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.08, 14), earMat);
    cupL.rotation.z = Math.PI / 2;
    cupL.position.set(-0.4, 0.02, 0);
    const cupGlowL = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.014, 6, 16), cushionMat);
    cupGlowL.rotation.y = Math.PI / 2;
    cupGlowL.position.set(-0.442, 0.02, 0);
    const cupR = cupL.clone();
    cupR.position.x = 0.4;
    const cupGlowR = cupGlowL.clone();
    cupGlowR.position.x = 0.442;
    const mic = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.26, 8), earMat);
    mic.rotation.x = Math.PI / 2;
    mic.position.set(0.32, -0.06, 0.2);
    headwearMount.add(band, cupL, cupGlowL, cupR, cupGlowR, mic);
  } else if (hAcc === 'comm_headset') {
    // Cosmic Neural Interface — Signature Reward from REX
    const neuralGrp = new THREE.Group();
    const frameAlloyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.88, roughness: 0.18 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.92, roughness: 0.15 });
    const cyanHoloMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0ea5e9,
      emissiveIntensity: 1.5,
      roughness: 0.15,
      transparent: true,
      opacity: 0.9,
    });
    const violetPulseMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x7c3aed,
      emissiveIntensity: 1.35,
      roughness: 0.2,
    });

    const crownArc = new THREE.Mesh(
      new THREE.TorusGeometry(0.415, 0.026, 8, 28, Math.PI * 1.16),
      frameAlloyMat
    );
    crownArc.position.set(0, 0.08, -0.04);
    crownArc.rotation.z = -Math.PI * 0.08;
    neuralGrp.add(crownArc);

    const crownGlowRail = new THREE.Mesh(
      new THREE.TorusGeometry(0.425, 0.011, 6, 28, Math.PI * 0.95),
      cyanHoloMat
    );
    crownGlowRail.position.set(0, 0.08, -0.04);
    crownGlowRail.rotation.z = Math.PI * 0.025;
    neuralGrp.add(crownGlowRail);

    const finShape = new THREE.Shape();
    finShape.moveTo(0, -0.1);
    finShape.lineTo(0.18, -0.03);
    finShape.lineTo(0.12, 0.19);
    finShape.lineTo(-0.08, 0.16);
    finShape.lineTo(-0.12, 0.02);
    finShape.closePath();
    const finGeo = new THREE.ExtrudeGeometry(finShape, {
      depth: 0.045,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01,
      bevelSegments: 2,
    });

    const makeTemplePod = (side: -1 | 1) => {
      const pod = new THREE.Group();
      pod.position.set(side * 0.41, 0.03, 0);
      const wing = new THREE.Mesh(finGeo, chromeMat);
      wing.rotation.y = side * (Math.PI / 2);
      wing.position.set(side * -0.02, 0, 0);
      const coreHex = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.06, 6), cyanHoloMat);
      coreHex.rotation.z = Math.PI / 2;
      coreHex.position.set(side * 0.025, 0.01, 0);
      pod.add(wing, coreHex);
      return pod;
    };
    neuralGrp.add(makeTemplePod(-1), makeTemplePod(1));

    const holoVisor = new THREE.Mesh(
      new THREE.TorusGeometry(0.26, 0.013, 6, 22, Math.PI * 0.65),
      cyanHoloMat
    );
    holoVisor.position.set(0, 0.055, 0.34);
    holoVisor.rotation.x = Math.PI / 2;
    holoVisor.rotation.z = -Math.PI * 0.825;
    neuralGrp.add(holoVisor);

    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.028, 0.34, 8), chromeMat);
    spire.position.set(0.43, 0.25, -0.05);
    spire.rotation.z = -0.22;
    const spireCrystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.048, 0), violetPulseMat);
    spireCrystal.position.set(0.47, 0.42, -0.05);
    neuralGrp.add(spire, spireCrystal);

    const orbitPivot = new THREE.Group();
    orbitPivot.position.set(0, 0.44, -0.08);
    orbitPivot.rotation.set(0.42, 0, -0.18);

    const outerHalo = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.013, 8, 32), cyanHoloMat);
    outerHalo.rotation.x = Math.PI / 2;
    const innerHalo = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.011, 6, 28), violetPulseMat);
    innerHalo.rotation.set(Math.PI / 2.5, 0.4, 0);
    const satA = new THREE.Mesh(new THREE.OctahedronGeometry(0.036, 0), chromeMat);
    satA.position.set(0.36, 0, 0);
    const satB = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), violetPulseMat);
    satB.position.set(-0.36, 0, 0);
    orbitPivot.add(outerHalo, innerHalo, satA, satB);
    neuralGrp.add(orbitPivot);

    headwearMount.add(neuralGrp);
    animatedAccGroups.push(
      { obj: orbitPivot, mode: 'orbit', speed: 1.5 },
      { obj: spireCrystal, mode: 'pulse', phase: 0.8 }
    );
  } else if (hAcc === 'fuzzy_signal_ears') {
    // Chapter 3 FUZZY Signature Reward: Cyber Signal Fox-Ears
    const darkShell = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, metalness: 0.82, roughness: 0.24 });
    const magNeon = new THREE.MeshStandardMaterial({
      color: 0xf472b6,
      emissive: 0xec4899,
      emissiveIntensity: 1.45,
      roughness: 0.2,
    });
    const cyanNeon = new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      emissive: 0x06b6d4,
      emissiveIntensity: 1.3,
      roughness: 0.2,
    });
    const bridge = new THREE.Mesh(new THREE.TorusGeometry(0.39, 0.025, 8, 24, Math.PI), darkShell);
    bridge.position.y = 0.06;
    headwearMount.add(bridge);

    const earShape = new THREE.Shape();
    earShape.moveTo(-0.12, 0);
    earShape.lineTo(0.12, 0);
    earShape.lineTo(0.04, 0.34);
    earShape.lineTo(-0.07, 0.28);
    earShape.closePath();
    const earGeo = new THREE.ExtrudeGeometry(earShape, {
      depth: 0.055,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.012,
      bevelSegments: 2,
    });

    const makeEar = (side: -1 | 1) => {
      const earGrp = new THREE.Group();
      earGrp.position.set(side * 0.22, 0.31, -0.02);
      earGrp.rotation.z = side * -0.32;
      earGrp.rotation.y = side * 0.22;
      const shell = new THREE.Mesh(earGeo, darkShell);
      const inner = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.24, 4), magNeon);
      inner.position.set(0, 0.14, 0.045);
      const prong = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.016, 0.18, 6), cyanNeon);
      prong.position.set(side * 0.03, 0.36, 0.02);
      earGrp.add(shell, inner, prong);
      return earGrp;
    };
    const earL = makeEar(-1);
    const earR = makeEar(1);
    headwearMount.add(earL, earR);
  } else if (hAcc === 'fuzzy_holo_visor') {
    // Chapter 3 FUZZY Secondary Reward: Holo-Wave Visor
    const alloy = new THREE.MeshStandardMaterial({ color: 0x312e81, metalness: 0.85, roughness: 0.22 });
    const glassWave = new THREE.MeshPhysicalMaterial({
      color: 0xe879f9,
      emissive: 0xa855f7,
      emissiveIntensity: 0.85,
      transparent: true,
      opacity: 0.7,
      roughness: 0.1,
      clearcoat: 1.0,
    });
    const shield = new THREE.Mesh(
      new THREE.CylinderGeometry(0.37, 0.39, 0.19, 20, 1, true, -Math.PI * 0.35, Math.PI * 0.7),
      glassWave
    );
    shield.position.set(0, 0.04, 0.06);
    const bar = new THREE.Mesh(new THREE.TorusGeometry(0.395, 0.02, 8, 22, Math.PI * 0.75), alloy);
    bar.rotation.x = Math.PI / 2;
    bar.rotation.z = Math.PI * 0.125;
    bar.position.set(0, 0.13, 0.06);
    headwearMount.add(shield, bar);
  } else if (hAcc === 'bob_cargo_goggles') {
    // Chapter 4 BOB Signature Reward: Industrial Cargo Goggles
    const titanium = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.25 });
    const hazardAmber = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.9,
      roughness: 0.18,
      metalness: 0.5,
    });
    const strap = new THREE.Mesh(new THREE.TorusGeometry(0.39, 0.032, 8, 26), titanium);
    strap.rotation.x = Math.PI / 2;
    strap.position.set(0, 0.14, 0);
    const makeLens = (lx: number) => {
      const pod = new THREE.Group();
      pod.position.set(lx, 0.12, 0.34);
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.08, 12), titanium);
      rim.rotation.x = Math.PI / 2;
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.09, 12), hazardAmber);
      lens.rotation.x = Math.PI / 2;
      pod.add(rim, lens);
      return pod;
    };
    const browBridge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.06), titanium);
    browBridge.position.set(0, 0.13, 0.36);
    headwearMount.add(strap, browBridge, makeLens(-0.145), makeLens(0.145));
  } else if (hAcc === 'bob_exo_helm') {
    // Chapter 4 BOB Secondary Reward: Logistics Exo-Crest Hardhat
    const safetyMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.45, roughness: 0.35 });
    const lampMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfbbf24,
      emissiveIntensity: 1.5,
    });
    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(0.36, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.46),
      safetyMat
    );
    shell.position.set(0, 0.15, 0);
    const visorPeak = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.045, 0.2), safetyMat);
    visorPeak.position.set(0, 0.25, 0.32);
    visorPeak.rotation.x = 0.2;
    const lampL = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.09, 10), lampMat);
    lampL.rotation.x = Math.PI / 2;
    lampL.position.set(-0.22, 0.33, 0.24);
    const lampR = lampL.clone();
    lampR.position.x = 0.22;
    headwearMount.add(shell, visorPeak, lampL, lampR);
  } else if (hAcc === 'mahkota') {
    const crownMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.9,
      roughness: 0.2,
    });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.24, 0.14, 12), crownMat);
    base.position.y = 0.4;
    headwearMount.add(base);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.16, 6), crownMat);
      spike.position.set(Math.cos(a) * 0.21, 0.52, Math.sin(a) * 0.21);
      headwearMount.add(spike);
    }
  } else if (hAcc === 'golden_crown') {
    // Sovereign Heritage Crown — Signature Reward from RATU LARAS
    const sovGrp = new THREE.Group();
    const royalGoldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.94, roughness: 0.15 });
    const maroonVelvetMat = new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.58, metalness: 0.18 });
    const rubyGemMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xe11d48,
      emissiveIntensity: 1.5,
      roughness: 0.12,
      metalness: 0.3,
    });
    const auraGoldMat = new THREE.MeshStandardMaterial({
      color: 0xfde68a,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.1,
      roughness: 0.2,
    });

    const diadem = new THREE.Mesh(new THREE.CylinderGeometry(0.275, 0.255, 0.12, 20), maroonVelvetMat);
    diadem.position.y = 0.4;
    const rimBot = new THREE.Mesh(new THREE.TorusGeometry(0.258, 0.022, 8, 28), royalGoldMat);
    rimBot.rotation.x = Math.PI / 2;
    rimBot.position.y = 0.35;
    const rimTop = new THREE.Mesh(new THREE.TorusGeometry(0.278, 0.02, 8, 28), royalGoldMat);
    rimTop.rotation.x = Math.PI / 2;
    rimTop.position.y = 0.455;
    sovGrp.add(diadem, rimBot, rimTop);

    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.quadraticCurveTo(0.22, 0.05, 0.31, 0.28);
    wingShape.quadraticCurveTo(0.18, 0.24, 0.11, 0.15);
    wingShape.lineTo(0, 0.12);
    wingShape.closePath();
    const wingGeo = new THREE.ExtrudeGeometry(wingShape, {
      depth: 0.032,
      bevelEnabled: true,
      bevelThickness: 0.008,
      bevelSize: 0.008,
      bevelSegments: 2,
    });
    const wingL = new THREE.Mesh(wingGeo, royalGoldMat);
    wingL.position.set(-0.18, 0.41, 0.04);
    wingL.rotation.y = Math.PI;
    const wingR = new THREE.Mesh(wingGeo, royalGoldMat);
    wingR.position.set(0.18, 0.41, 0.01);
    sovGrp.add(wingL, wingR);

    const peakSpecs = [
      { angle: 0, r: 0.245, h: 0.26, w: 0.075 },
      { angle: 0.58, r: 0.245, h: 0.18, w: 0.055 },
      { angle: -0.58, r: 0.245, h: 0.18, w: 0.055 },
      { angle: 1.25, r: 0.245, h: 0.13, w: 0.045 },
      { angle: -1.25, r: 0.245, h: 0.13, w: 0.045 },
    ];
    peakSpecs.forEach((p, idx) => {
      const px = Math.sin(p.angle) * p.r;
      const pz = Math.cos(p.angle) * p.r;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(p.w, p.h, 4), royalGoldMat);
      spike.position.set(px, 0.46 + p.h * 0.45, pz);
      spike.rotation.y = p.angle + Math.PI / 4;
      sovGrp.add(spike);

      const pearl = new THREE.Mesh(
        new THREE.SphereGeometry(idx === 0 ? 0.035 : 0.025, 8, 8),
        idx === 0 ? rubyGemMat : auraGoldMat
      );
      pearl.position.set(px, 0.46 + p.h * 0.92, pz);
      sovGrp.add(pearl);
    });

    const gemBezel = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.016, 8, 16), royalGoldMat);
    gemBezel.position.set(0, 0.44, 0.275);
    const centerRuby = new THREE.Mesh(new THREE.OctahedronGeometry(0.058, 0), rubyGemMat);
    centerRuby.position.set(0, 0.44, 0.295);
    sovGrp.add(gemBezel, centerRuby);

    const auraPivot = new THREE.Group();
    auraPivot.position.set(0, 0.56, -0.14);
    auraPivot.rotation.x = 0.22;
    const auraRing = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.012, 8, 32), auraGoldMat);
    const auraDiamond = new THREE.Mesh(new THREE.OctahedronGeometry(0.036, 0), rubyGemMat);
    auraDiamond.position.set(0, 0.32, 0);
    auraPivot.add(auraRing, auraDiamond);
    sovGrp.add(auraPivot);

    headwearMount.add(sovGrp);
    animatedAccGroups.push(
      { obj: auraPivot, mode: 'ring_spin', speed: 0.8 },
      { obj: centerRuby, mode: 'pulse', phase: 0.2 }
    );
  } else if (hAcc === 'bunga' || hAcc === 'batik_flower' || hAcc === 'nusantara_flower') {
    const petalColor =
      hAcc === 'batik_flower' ? 0x10b981 : hAcc === 'nusantara_flower' ? 0xf59e0b : 0xf472b6;
    const flowerGroup = new THREE.Group();
    flowerGroup.position.set(0.29, 0.33, 0.12);
    const petalMat = new THREE.MeshStandardMaterial({
      color: petalColor,
      emissive: petalColor,
      emissiveIntensity: 0.25,
      roughness: 0.35,
    });
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), petalMat);
      petal.position.set(Math.cos(a) * 0.1, Math.sin(a) * 0.1, 0);
      flowerGroup.add(petal);
    }
    const center = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.3 })
    );
    flowerGroup.add(center);
    headwearMount.add(flowerGroup);
  }

  // Optional 3D Nameplate Sprite
  let nameSprite: THREE.Sprite | undefined;
  if (options?.showNameplate) {
    const nTex = createNameplateTexture(
      config.name,
      colorEntry.hex,
      options.nameplateSubtitle
    );
    const spriteMat = new THREE.SpriteMaterial({
      map: nTex,
      transparent: true,
      depthTest: false,
    });
    nameSprite = new THREE.Sprite(spriteMat);
    nameSprite.position.set(0, 2.48, 0);
    nameSprite.scale.set(1.6, 0.45, 1);
    root.add(nameSprite);
  }

  return {
    root,
    bodyPivot,
    headGroup,
    leftArm,
    rightArm,
    leftForearm,
    rightForearm,
    leftLeg,
    rightLeg,
    capeMesh,
    capeCloths,
    animatedAccGroups,
    nameSprite,
    suitParts,
  };
}

export function buildNpcAstronaut(npcId: NpcCharacterId | LobbyCrewNpcId | 'companion'): CharacterRig {
  const tex = getSharedTextures();
  if (npcId === 'companion') {
    return buildAstronautRig(
      {
        name: 'TEMAN KRU',
        color: 'kuning',
        helmet: 'standard_visor',
        costume: 'standard_crew',
        head: 'headset',
        body: 'backpack',
        neck: 'none',
      },
      { showNameplate: true, nameplateSubtitle: 'Teknisi Stasiun' }
    );
  }
  if (npcId === 'aulia') {
    return buildAstronautRig(
      {
        name: 'AULIA',
        color: 'hijau',
        helmet: 'standard_visor',
        costume: 'standard_crew',
        head: 'headset',
        body: 'backpack',
        neck: 'none',
      },
      { showNameplate: true, nameplateSubtitle: 'Analis Budaya' }
    );
  }
  if (npcId === 'dani') {
    return buildAstronautRig(
      {
        name: 'DANI',
        color: 'orange',
        helmet: 'cyber_recon',
        costume: 'tactical_armor',
        head: 'none',
        body: 'tech_backpack',
        neck: 'none',
      },
      { showNameplate: true, nameplateSubtitle: 'Teknisi Lapangan' }
    );
  }
  if (npcId === 'sari') {
    return buildAstronautRig(
      {
        name: 'SARI',
        color: 'ungu',
        helmet: 'explorer_dome',
        costume: 'standard_crew',
        head: 'bunga',
        body: 'backpack',
        neck: 'kalung',
      },
      { showNameplate: true, nameplateSubtitle: 'Kurator Data' }
    );
  }
  if (npcId === 'raka') {
    return buildAstronautRig(
      {
        name: 'RAKA',
        color: 'biru',
        helmet: 'standard_visor',
        costume: 'standard_crew',
        head: 'aksesori_antariksa',
        body: 'jaket_astronaut',
        neck: 'none',
      },
      { showNameplate: true, nameplateSubtitle: 'Navigator Kru' }
    );
  }
  if (npcId === 'rex') {
    const rig = buildAstronautRig(
      {
        name: 'REX',
        color: 'biru',
        helmet: 'cyber_recon',
        costume: 'cyber_neon',
        head: 'comm_headset',
        body: 'tech_backpack',
        neck: 'chip_necklace',
      },
      { showNameplate: true, nameplateSubtitle: 'The Hyperglobalist' }
    );
    const phoneGroup = new THREE.Group();
    const phone = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.24, 0.025),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.2 })
    );
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.12, 0.21),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0ea5e9, emissiveIntensity: 1.4 })
    );
    screen.position.z = 0.015;
    phoneGroup.add(phone, screen);
    phoneGroup.position.set(0, -0.24, 0.14);
    phoneGroup.rotation.x = -0.6;
    rig.rightForearm.add(phoneGroup);
    rig.rightArm.rotation.x = -0.65;
    rig.heldProp = phoneGroup;
    return rig;
  }

  if (npcId === 'bima') {
    const rig = buildAstronautRig(
      {
        name: 'BIMA',
        color: 'hijau',
        helmet: 'explorer_dome',
        costume: 'nusantara_batik',
        head: 'batik_flower',
        body: 'modern_batik_cape',
        neck: 'planet_necklace',
      },
      { showNameplate: true, nameplateSubtitle: 'The Transformationalist' }
    );
    const globeGroup = new THREE.Group();
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 20, 16),
      new THREE.MeshStandardMaterial({
        map: tex.earthTex,
        emissive: 0x10b981,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.9,
      })
    );
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.24, 0.015, 8, 24),
      new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xf59e0b, emissiveIntensity: 0.8 })
    );
    ring.rotation.x = Math.PI / 3;
    globeGroup.add(globe, ring);
    globeGroup.position.set(0, -0.22, 0.22);
    rig.rightForearm.add(globeGroup);
    rig.rightArm.rotation.x = -0.62;
    rig.heldProp = globeGroup;
    return rig;
  }

  if (npcId === 'fuzzy') {
    const rig = buildAstronautRig(
      {
        name: 'FUZZY',
        color: 'pink',
        helmet: 'cyber_recon',
        costume: 'cyber_neon',
        head: 'fuzzy_signal_ears',
        body: 'fuzzy_transceiver_pack',
        neck: 'fuzzy_fiber_necklace',
      },
      { showNameplate: true, nameplateSubtitle: 'The Signal Weaver' }
    );
    const waveOrb = new THREE.Group();
    const core = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.13, 0),
      new THREE.MeshStandardMaterial({ color: 0xf472b6, emissive: 0xec4899, emissiveIntensity: 1.4 })
    );
    const waveRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.21, 0.015, 8, 22),
      new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x06b6d4, emissiveIntensity: 1.2 })
    );
    waveRing.rotation.x = Math.PI / 2.4;
    waveOrb.add(core, waveRing);
    waveOrb.position.set(0, -0.22, 0.2);
    rig.rightForearm.add(waveOrb);
    rig.rightArm.rotation.x = -0.65;
    rig.heldProp = waveOrb;
    return rig;
  }

  if (npcId === 'bob') {
    const rig = buildAstronautRig(
      {
        name: 'BOB',
        color: 'orange',
        helmet: 'commander_crest',
        costume: 'tactical_armor',
        head: 'bob_cargo_goggles',
        body: 'bob_hydraulic_frame',
        neck: 'bob_trade_medallion',
      },
      { showNameplate: true, nameplateSubtitle: 'The Global Architect' }
    );
    const tradePrism = new THREE.Group();
    const prism = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 0.22, 6),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 1.1, metalness: 0.65 })
    );
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(0.2, 0.015, 6, 18),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 1.0 })
    );
    band.rotation.x = Math.PI / 3;
    tradePrism.add(prism, band);
    tradePrism.position.set(0, -0.23, 0.2);
    rig.rightForearm.add(tradePrism);
    rig.rightArm.rotation.x = -0.64;
    rig.heldProp = tradePrism;
    return rig;
  }

  const rig = buildAstronautRig(
    {
      name: 'RATU LARAS',
      color: 'maroon',
      helmet: 'commander_crest',
      costume: 'nusantara_batik',
      head: 'golden_crown',
      body: 'royal_batik_cape',
      neck: 'batik_necklace',
    },
    { showNameplate: true, nameplateSubtitle: 'The Skeptic' }
  );
  const tabGroup = new THREE.Group();
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.22, 0.025),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.25 })
  );
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.28, 0.18),
    new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xe11d48, emissiveIntensity: 1.1 })
  );
  screen.position.z = 0.015;
  tabGroup.add(frame, screen);
  tabGroup.position.set(0, -0.24, 0.16);
  tabGroup.rotation.x = -0.55;
  rig.rightForearm.add(tabGroup);
  rig.rightArm.rotation.x = -0.66;
  rig.heldProp = tabGroup;
  return rig;
}

export function animateCharacterRig(
  rig: CharacterRig,
  time: number,
  animState: CharacterAnimState,
  delta: number,
  gesture?:
    | 'explain'
    | 'point'
    | 'nod'
    | 'ponder'
    | 'gearup'
    | 'scratch_head'
    | 'tilt_curious'
    | 'panic'
    | 'crouch_check'
    | 'shock_cover',
  activeEmote?: EmoteId | null,
  emoteElapsed = 0
) {
  const k = 1 - Math.exp(-12 * delta);
  const lFore = rig.leftForearm;
  const rFore = rig.rightForearm;

  if (animState === 'jump') {
    rig.leftLeg.rotation.x = THREE.MathUtils.lerp(rig.leftLeg.rotation.x, -0.52, k);
    rig.rightLeg.rotation.x = THREE.MathUtils.lerp(rig.rightLeg.rotation.x, 0.36, k);
    rig.leftArm.rotation.x = THREE.MathUtils.lerp(rig.leftArm.rotation.x, -1.75, k);
    rig.leftArm.rotation.z = THREE.MathUtils.lerp(rig.leftArm.rotation.z, 0.42, k);
    lFore.rotation.set(THREE.MathUtils.lerp(lFore.rotation.x, -0.35, k), 0, 0);
    if (!rig.heldProp) {
      rig.rightArm.rotation.x = THREE.MathUtils.lerp(rig.rightArm.rotation.x, -1.75, k);
      rig.rightArm.rotation.z = THREE.MathUtils.lerp(rig.rightArm.rotation.z, -0.42, k);
      rFore.rotation.set(THREE.MathUtils.lerp(rFore.rotation.x, -0.35, k), 0, 0);
    }
    rig.headGroup.rotation.x = THREE.MathUtils.lerp(rig.headGroup.rotation.x, -0.1, k);
    rig.headGroup.rotation.y = THREE.MathUtils.lerp(rig.headGroup.rotation.y, 0, k);
    rig.headGroup.rotation.z = THREE.MathUtils.lerp(rig.headGroup.rotation.z, 0, k);
    rig.bodyPivot.position.y = THREE.MathUtils.lerp(rig.bodyPivot.position.y, 0.04, k);
    rig.bodyPivot.rotation.x = THREE.MathUtils.lerp(rig.bodyPivot.rotation.x, 0.08, k);
    rig.bodyPivot.rotation.y = THREE.MathUtils.lerp(rig.bodyPivot.rotation.y, 0, k);
    rig.bodyPivot.rotation.z = THREE.MathUtils.lerp(rig.bodyPivot.rotation.z, 0, k);
    rig.bodyPivot.scale.setScalar(THREE.MathUtils.lerp(rig.bodyPivot.scale.x, 1, k));
    if (rig.capeMesh) {
      rig.capeMesh.rotation.x = THREE.MathUtils.lerp(rig.capeMesh.rotation.x, 0.48, k);
    }
  } else if (animState === 'walk' || animState === 'run') {
    const isRun = animState === 'run';
    const freq = isRun ? 14 : 9.5;
    const amp = isRun ? 0.85 : 0.62;
    const swing = Math.sin(time * freq) * amp;
    rig.leftLeg.rotation.x = swing;
    rig.rightLeg.rotation.x = -swing;
    rig.leftArm.rotation.x = -swing * 0.72;
    rig.leftArm.rotation.z = THREE.MathUtils.lerp(rig.leftArm.rotation.z, 0, k);
    lFore.rotation.set(THREE.MathUtils.lerp(lFore.rotation.x, isRun ? -0.65 : -0.35, k), 0, 0);
    if (!rig.heldProp) {
      rig.rightArm.rotation.x = swing * 0.72;
      rig.rightArm.rotation.z = THREE.MathUtils.lerp(rig.rightArm.rotation.z, 0, k);
      rFore.rotation.set(THREE.MathUtils.lerp(rFore.rotation.x, isRun ? -0.65 : -0.35, k), 0, 0);
    }
    rig.headGroup.rotation.x = THREE.MathUtils.lerp(rig.headGroup.rotation.x, 0, k);
    rig.headGroup.rotation.y = THREE.MathUtils.lerp(rig.headGroup.rotation.y, 0, k);
    rig.headGroup.rotation.z = THREE.MathUtils.lerp(rig.headGroup.rotation.z, 0, k);
    rig.bodyPivot.position.y = Math.abs(Math.sin(time * freq)) * (isRun ? 0.09 : 0.05);
    rig.bodyPivot.rotation.x = THREE.MathUtils.lerp(rig.bodyPivot.rotation.x, isRun ? 0.14 : 0.03, k);
    rig.bodyPivot.rotation.y = THREE.MathUtils.lerp(rig.bodyPivot.rotation.y, 0, k);
    rig.bodyPivot.rotation.z = THREE.MathUtils.lerp(rig.bodyPivot.rotation.z, 0, k);
    rig.bodyPivot.scale.setScalar(THREE.MathUtils.lerp(rig.bodyPivot.scale.x, 1, k));
    if (rig.capeMesh) {
      rig.capeMesh.rotation.x = THREE.MathUtils.lerp(
        rig.capeMesh.rotation.x,
        (isRun ? 0.42 : 0.24) + Math.sin(time * freq * 0.8) * 0.08,
        k
      );
    }
  } else if (animState === 'interact') {
    rig.leftLeg.rotation.x = THREE.MathUtils.lerp(rig.leftLeg.rotation.x, 0, k);
    rig.rightLeg.rotation.x = THREE.MathUtils.lerp(rig.rightLeg.rotation.x, 0, k);
    rig.leftArm.rotation.x = -0.65 + Math.sin(time * 14) * 0.12;
    rig.leftArm.rotation.z = THREE.MathUtils.lerp(rig.leftArm.rotation.z, 0, k);
    lFore.rotation.set(-0.65, 0, 0);
    if (!rig.heldProp) {
      rig.rightArm.rotation.x = -0.65 + Math.cos(time * 14) * 0.12;
      rig.rightArm.rotation.z = THREE.MathUtils.lerp(rig.rightArm.rotation.z, 0, k);
      rFore.rotation.set(-0.65, 0, 0);
    }
    rig.bodyPivot.rotation.x = THREE.MathUtils.lerp(rig.bodyPivot.rotation.x, 0.08, k);
    rig.bodyPivot.rotation.y = THREE.MathUtils.lerp(rig.bodyPivot.rotation.y, 0, k);
    rig.bodyPivot.rotation.z = THREE.MathUtils.lerp(rig.bodyPivot.rotation.z, 0, k);
    rig.headGroup.rotation.x = THREE.MathUtils.lerp(rig.headGroup.rotation.x, 0.12, k);
  } else if (animState === 'vent_in') {
    rig.bodyPivot.position.y = THREE.MathUtils.lerp(rig.bodyPivot.position.y, -1.2, k);
    rig.bodyPivot.scale.setScalar(THREE.MathUtils.lerp(rig.bodyPivot.scale.x, 0.25, k));
    rig.leftArm.rotation.x = THREE.MathUtils.lerp(rig.leftArm.rotation.x, -2.1, k);
    lFore.rotation.set(0, 0, 0);
    if (!rig.heldProp) {
      rig.rightArm.rotation.x = THREE.MathUtils.lerp(rig.rightArm.rotation.x, -2.1, k);
      rFore.rotation.set(0, 0, 0);
    }
  } else if (animState === 'vent_out') {
    rig.bodyPivot.position.y = THREE.MathUtils.lerp(rig.bodyPivot.position.y, 0.05, k);
    rig.bodyPivot.scale.setScalar(THREE.MathUtils.lerp(rig.bodyPivot.scale.x, 1, k));
    rig.leftArm.rotation.x = THREE.MathUtils.lerp(rig.leftArm.rotation.x, 0, k);
    lFore.rotation.set(0, 0, 0);
    if (!rig.heldProp) {
      rig.rightArm.rotation.x = THREE.MathUtils.lerp(rig.rightArm.rotation.x, 0, k);
      rFore.rotation.set(0, 0, 0);
    }
  } else if (animState === 'celebrate') {
    rig.bodyPivot.position.y = Math.abs(Math.sin(time * 7)) * 0.22;
    rig.leftArm.rotation.x = -2.2 + Math.sin(time * 9) * 0.25;
    lFore.rotation.set(-0.35, 0, 0);
    if (!rig.heldProp) {
      rig.rightArm.rotation.x = -2.2 - Math.sin(time * 9) * 0.25;
      rFore.rotation.set(-0.35, 0, 0);
    }
    rig.bodyPivot.scale.setScalar(1);
  } else if (animState === 'defeat') {
    if (animState === 'defeat') {
      rig.bodyPivot.position.y = -0.05;
      rig.bodyPivot.rotation.x = 0.22;
      rig.headGroup.rotation.x = 0.35;
      rig.leftArm.rotation.x = 0.15;
      lFore.rotation.set(-0.2, 0, 0);
      if (!rig.heldProp) {
        rig.rightArm.rotation.x = 0.15;
        rFore.rotation.set(-0.2, 0, 0);
      }
    }
  } else if (animState === 'climb') {
    const phase = time * 9.5;
    const wave = Math.sin(phase);
    rig.bodyPivot.position.y = Math.abs(Math.cos(phase)) * 0.04;
    rig.bodyPivot.rotation.set(0.06, 0, 0);
    rig.bodyPivot.scale.setScalar(THREE.MathUtils.lerp(rig.bodyPivot.scale.x, 1, k));
    rig.headGroup.rotation.set(-0.18, 0, 0);
    rig.leftLeg.rotation.x = -0.35 + wave * 0.42;
    rig.rightLeg.rotation.x = -0.35 - wave * 0.42;
    rig.leftArm.rotation.set(-1.55 - wave * 0.55, 0, 0.14);
    lFore.rotation.set(-0.75 + wave * 0.2, 0, 0);
    if (!rig.heldProp) {
      rig.rightArm.rotation.set(-1.55 + wave * 0.55, 0, -0.14);
      rFore.rotation.set(-0.75 - wave * 0.2, 0, 0);
    }
  } else if (animState === 'collapse') {
    rig.bodyPivot.position.y = THREE.MathUtils.lerp(rig.bodyPivot.position.y, 0.28, k);
    rig.bodyPivot.rotation.x = THREE.MathUtils.lerp(rig.bodyPivot.rotation.x, 0.12, k);
    rig.bodyPivot.rotation.y = THREE.MathUtils.lerp(rig.bodyPivot.rotation.y, 0, k);
    rig.bodyPivot.rotation.z = THREE.MathUtils.lerp(rig.bodyPivot.rotation.z, Math.PI * 0.44, k);
    rig.bodyPivot.scale.setScalar(THREE.MathUtils.lerp(rig.bodyPivot.scale.x, 1, k));
    rig.headGroup.rotation.set(0.22, -0.15, -0.18);
    rig.leftLeg.rotation.x = 0.18;
    rig.rightLeg.rotation.x = -0.12;
    rig.leftArm.rotation.set(-0.35, 0, 0.45);
    lFore.rotation.set(-0.35, 0, 0);
    if (!rig.heldProp) {
      rig.rightArm.rotation.set(0.18, 0, -0.32);
      rFore.rotation.set(-0.25, 0, 0);
    }
  } else if (activeEmote) {
    const et = emoteElapsed || time;
    rig.bodyPivot.scale.setScalar(THREE.MathUtils.lerp(rig.bodyPivot.scale.x, 1, k));
    rig.leftLeg.rotation.x = THREE.MathUtils.lerp(rig.leftLeg.rotation.x, 0, k);
    rig.rightLeg.rotation.x = THREE.MathUtils.lerp(rig.rightLeg.rotation.x, 0, k);
    rig.bodyPivot.rotation.x = THREE.MathUtils.lerp(rig.bodyPivot.rotation.x, 0, k);
    rig.bodyPivot.rotation.y = THREE.MathUtils.lerp(rig.bodyPivot.rotation.y, 0, k);
    rig.bodyPivot.rotation.z = THREE.MathUtils.lerp(rig.bodyPivot.rotation.z, 0, k);
    lFore.rotation.set(0, 0, 0);
    if (!rig.heldProp) rFore.rotation.set(0, 0, 0);

    if (activeEmote === 'wave') {
      rig.bodyPivot.position.y = Math.sin(et * 4) * 0.03;
      rig.headGroup.rotation.set(-0.04, Math.sin(et * 3) * 0.12, -0.08);
      rig.leftArm.rotation.set(-0.12, 0, 0.1);
      lFore.rotation.set(-0.25, 0, 0);
      if (!rig.heldProp) {
        rig.rightArm.rotation.set(-2.25, 0, -0.35);
        rFore.rotation.set(-0.25, 0, -0.35 + Math.sin(et * 11) * 0.45);
      }
    } else if (activeEmote === 'bow') {
      rig.bodyPivot.position.y = -0.04;
      rig.bodyPivot.rotation.x = 0.52 + Math.sin(et * 2.5) * 0.05;
      rig.headGroup.rotation.set(0.24, 0, 0);
      rig.leftArm.rotation.set(-0.45, 0, -0.18);
      lFore.rotation.set(-0.85, 0, -0.45);
      if (!rig.heldProp) {
        rig.rightArm.rotation.set(-0.45, 0, 0.18);
        rFore.rotation.set(-0.85, 0, 0.45);
      }
    } else if (activeEmote === 'salute') {
      rig.bodyPivot.position.y = Math.sin(et * 2.6) * 0.012;
      rig.bodyPivot.rotation.x = 0;
      rig.headGroup.rotation.set(0, -0.04, 0);
      rig.leftArm.rotation.set(0.05, 0, 0.08);
      lFore.rotation.set(-0.12, 0, 0);
      if (!rig.heldProp) {
        // Right arm & glove held cleanly beside helmet visor brow without penetrating helmet
        rig.rightArm.rotation.set(-1.18, 0, -0.72);
        rFore.rotation.set(-1.32, 0.25, 0.58);
      }
    } else if (activeEmote === 'clap') {
      const clap = Math.abs(Math.sin(et * 11));
      rig.bodyPivot.position.y = clap * 0.04;
      rig.headGroup.rotation.set(Math.sin(et * 5.5) * 0.08, 0, 0);
      rig.leftArm.rotation.set(-0.85, 0, 0.15);
      lFore.rotation.set(-0.95, 0, -0.58 + clap * 0.36);
      if (!rig.heldProp) {
        rig.rightArm.rotation.set(-0.85, 0, -0.15);
        rFore.rotation.set(-0.95, 0, 0.58 - clap * 0.36);
      }
    } else if (activeEmote === 'thumbs_up') {
      rig.bodyPivot.position.y = Math.sin(et * 3.5) * 0.03;
      rig.headGroup.rotation.set(-0.1 + Math.sin(et * 4) * 0.04, 0, 0.08);
      rig.leftArm.rotation.set(-0.12, 0, 0.1);
      lFore.rotation.set(-0.2, 0, 0);
      if (!rig.heldProp) {
        rig.rightArm.rotation.set(-1.05, 0, -0.22);
        rFore.rotation.set(-0.75 + Math.sin(et * 4.5) * 0.1, 0, 0.1);
      }
    } else if (activeEmote === 'heart') {
      rig.bodyPivot.position.y = Math.sin(et * 5) * 0.04;
      rig.headGroup.rotation.set(-0.06, 0, Math.sin(et * 3) * 0.1);
      rig.leftArm.rotation.set(-1.75, 0, 0.65);
      lFore.rotation.set(-0.85, 0, -0.78);
      if (!rig.heldProp) {
        rig.rightArm.rotation.set(-1.75, 0, -0.65);
        rFore.rotation.set(-0.85, 0, 0.78);
      }
    } else if (activeEmote === 'laugh') {
      rig.bodyPivot.position.y = Math.abs(Math.sin(et * 12)) * 0.1;
      rig.bodyPivot.rotation.x = -0.14 + Math.sin(et * 12) * 0.08;
      rig.headGroup.rotation.set(-0.24 + Math.sin(et * 12) * 0.14, 0, 0);
      rig.leftArm.rotation.set(-0.55 + Math.sin(et * 12) * 0.18, 0, 0.28);
      lFore.rotation.set(-0.85, 0, -0.3);
      if (!rig.heldProp) {
        rig.rightArm.rotation.set(-0.55 - Math.sin(et * 12) * 0.18, 0, -0.28);
        rFore.rotation.set(-0.85, 0, 0.3);
      }
    } else if (activeEmote === 'sad') {
      rig.bodyPivot.position.y = -0.06;
      rig.bodyPivot.rotation.x = 0.22;
      rig.headGroup.rotation.set(0.38, 0, Math.sin(et * 3.5) * 0.12);
      rig.leftArm.rotation.set(-0.28, 0, -0.14);
      lFore.rotation.set(-0.45, 0, 0);
      if (!rig.heldProp) {
        rig.rightArm.rotation.set(-0.28, 0, 0.14);
        rFore.rotation.set(-0.45, 0, 0);
      }
    } else if (activeEmote === 'surprised') {
      rig.bodyPivot.position.y = Math.abs(Math.sin(et * 8)) * 0.09;
      rig.bodyPivot.rotation.x = -0.18;
      rig.headGroup.rotation.set(-0.24, 0, 0);
      rig.leftArm.rotation.set(-1.45, 0, 0.72);
      lFore.rotation.set(-0.45, 0, 0.18);
      if (!rig.heldProp) {
        rig.rightArm.rotation.set(-1.45, 0, -0.72);
        rFore.rotation.set(-0.45, 0, -0.18);
      }
    } else if (activeEmote === 'shrug') {
      const lift = 0.08 + Math.sin(et * 4.5) * 0.05;
      rig.bodyPivot.position.y = lift * 0.35;
      rig.headGroup.rotation.set(0.06, Math.sin(et * 3) * 0.14, 0.2);
      rig.leftArm.rotation.set(-0.38, 0, 0.56);
      lFore.rotation.set(-0.98, 0, 0.32);
      if (!rig.heldProp) {
        rig.rightArm.rotation.set(-0.38, 0, -0.56);
        rFore.rotation.set(-0.98, 0, -0.32);
      }
    } else if (activeEmote === 'think') {
      // Articulated bent elbow puts glove thoughtfully in front of chin without penetrating head/torso
      rig.bodyPivot.position.y = Math.sin(et * 2.4) * 0.02;
      rig.bodyPivot.rotation.x = 0.04;
      rig.headGroup.rotation.set(0.14, -0.12 + Math.sin(et * 2.2) * 0.08, 0.18 + Math.sin(et * 2.4) * 0.04);
      rig.leftArm.rotation.set(-0.48, 0, 0.12);
      lFore.rotation.set(-1.15, 0, -0.68);
      if (!rig.heldProp) {
        rig.rightArm.rotation.set(-0.78, 0, -0.22);
        rFore.rotation.set(-1.28, 0, 0.38 + Math.sin(et * 3.2) * 0.05);
      }
    } else if (activeEmote === 'celebrate') {
      rig.bodyPivot.position.y = Math.abs(Math.sin(et * 8)) * 0.22;
      rig.headGroup.rotation.set(-0.15, 0, 0);
      rig.leftArm.rotation.set(-2.35 + Math.sin(et * 10) * 0.24, 0, 0.32);
      lFore.rotation.set(-0.25, 0, 0);
      if (!rig.heldProp) {
        rig.rightArm.rotation.set(-2.35 - Math.sin(et * 10) * 0.24, 0, -0.32);
        rFore.rotation.set(-0.25, 0, 0);
      }
    } else if (activeEmote === 'cheer') {
      const pump = Math.sin(et * 11);
      rig.bodyPivot.position.y = Math.abs(pump) * 0.14;
      rig.headGroup.rotation.set(-0.12, Math.sin(et * 5.5) * 0.14, 0);
      rig.leftArm.rotation.set(-1.55 + pump * 0.45, 0, 0.28);
      lFore.rotation.set(-0.75 + pump * 0.25, 0, 0);
      if (!rig.heldProp) {
        rig.rightArm.rotation.set(-1.55 - pump * 0.45, 0, -0.28);
        rFore.rotation.set(-0.75 - pump * 0.25, 0, 0);
      }
    } else if (activeEmote === 'flex') {
      const pulse = Math.sin(et * 6) * 0.08;
      rig.bodyPivot.position.y = 0.03;
      rig.bodyPivot.rotation.x = -0.08;
      rig.headGroup.rotation.set(-0.08, Math.sin(et * 3) * 0.15, 0);
      rig.leftArm.rotation.set(-0.28, 0, 1.38 + pulse);
      lFore.rotation.set(-1.42, 0, -0.15);
      if (!rig.heldProp) {
        rig.rightArm.rotation.set(-0.28, 0, -1.38 - pulse);
        rFore.rotation.set(-1.42, 0, 0.15);
      }
    } else if (activeEmote === 'spin') {
      rig.bodyPivot.position.y = 0.06 + Math.abs(Math.sin(et * 6)) * 0.08;
      rig.bodyPivot.rotation.y = et * 7.2;
      rig.headGroup.rotation.set(0, 0, 0);
      rig.leftArm.rotation.set(-0.35, 0, 0.95);
      lFore.rotation.set(-0.25, 0, 0);
      if (!rig.heldProp) {
        rig.rightArm.rotation.set(-0.35, 0, -0.95);
        rFore.rotation.set(-0.25, 0, 0);
      }
    } else if (activeEmote === 'dance') {
      rig.bodyPivot.position.y = Math.abs(Math.sin(et * 9)) * 0.14;
      rig.bodyPivot.rotation.y = Math.sin(et * 4.5) * 0.42;
      rig.bodyPivot.rotation.z = Math.sin(et * 9) * 0.14;
      rig.leftLeg.rotation.x = Math.sin(et * 9) * 0.45;
      rig.rightLeg.rotation.x = -Math.sin(et * 9) * 0.45;
      rig.leftArm.rotation.set(-1.35 + Math.sin(et * 9) * 0.65, 0, 0.35 + Math.cos(et * 9) * 0.25);
      lFore.rotation.set(-0.65, 0, 0);
      if (!rig.heldProp) {
        rig.rightArm.rotation.set(-1.35 - Math.sin(et * 9) * 0.65, 0, -0.35 - Math.cos(et * 9) * 0.25);
        rFore.rotation.set(-0.65, 0, 0);
      }
      rig.headGroup.rotation.set(0, -Math.sin(et * 4.5) * 0.25, 0);
    } else if (activeEmote === 'kpop_groove') {
      // Crisp pop-idol groove: shoulder pop, hip groove, alternating point/wave snap
      const beat = et * 8.5;
      const sideSwitch = Math.sin(beat * 0.5) >= 0 ? 1 : -1;
      rig.bodyPivot.position.y = Math.abs(Math.sin(beat)) * 0.11;
      rig.bodyPivot.rotation.y = Math.sin(beat * 0.5) * 0.38;
      rig.bodyPivot.rotation.z = Math.cos(beat) * 0.12;
      rig.leftLeg.rotation.x = Math.sin(beat) * 0.35;
      rig.rightLeg.rotation.x = -Math.sin(beat) * 0.35;
      rig.headGroup.rotation.set(Math.sin(beat * 2) * 0.08, -Math.sin(beat * 0.5) * 0.2, sideSwitch * 0.12);
      rig.leftArm.rotation.set(-1.2 + Math.sin(beat) * 0.45, 0, 0.45 + sideSwitch * 0.2);
      lFore.rotation.set(-0.95 + Math.cos(beat) * 0.35, 0, -0.2);
      if (!rig.heldProp) {
        rig.rightArm.rotation.set(-1.55 - Math.sin(beat) * 0.45, 0, -0.45 + sideSwitch * 0.2);
        rFore.rotation.set(-0.75 - Math.cos(beat) * 0.4, 0, 0.2);
      }
    } else if (activeEmote === 'star_hop') {
      // Energetic star-jump bounce
      const hopPhase = Math.abs(Math.sin(et * 6.5));
      rig.bodyPivot.position.y = hopPhase * 0.28;
      rig.headGroup.rotation.set(-0.12 * hopPhase, 0, Math.sin(et * 6.5) * 0.14);
      rig.leftLeg.rotation.x = -0.35 * hopPhase;
      rig.rightLeg.rotation.x = 0.35 * hopPhase;
      rig.leftArm.rotation.set(-0.4 - hopPhase * 1.4, 0, 0.25 + hopPhase * 0.9);
      lFore.rotation.set(-0.25, 0, 0);
      if (!rig.heldProp) {
        rig.rightArm.rotation.set(-0.4 - hopPhase * 1.4, 0, -0.25 - hopPhase * 0.9);
        rFore.rotation.set(-0.25, 0, 0);
      }
    }
  } else {
    // IDLE + Optional Cutscene Gesture
    rig.bodyPivot.scale.setScalar(THREE.MathUtils.lerp(rig.bodyPivot.scale.x, 1, k));
    rig.bodyPivot.rotation.x = THREE.MathUtils.lerp(
      rig.bodyPivot.rotation.x,
      gesture === 'tilt_curious' ? 0.08 : 0,
      k
    );
    rig.bodyPivot.rotation.y = THREE.MathUtils.lerp(rig.bodyPivot.rotation.y, 0, k);
    rig.bodyPivot.rotation.z = THREE.MathUtils.lerp(rig.bodyPivot.rotation.z, 0, k);
    rig.leftLeg.rotation.x = THREE.MathUtils.lerp(rig.leftLeg.rotation.x, 0, k);
    rig.rightLeg.rotation.x = THREE.MathUtils.lerp(rig.rightLeg.rotation.x, 0, k);
    rig.bodyPivot.position.y = THREE.MathUtils.lerp(
      rig.bodyPivot.position.y,
      Math.sin(time * 2.2) * 0.025,
      k
    );

    if (gesture === 'panic') {
      rig.bodyPivot.position.y = Math.abs(Math.sin(time * 13)) * 0.07;
      rig.bodyPivot.rotation.z = Math.sin(time * 14) * 0.09;
      rig.headGroup.rotation.set(-0.08, Math.sin(time * 11) * 0.42, Math.sin(time * 9) * 0.14);
      rig.leftArm.rotation.set(-1.35 + Math.sin(time * 15) * 0.32, 0, 0.42);
      lFore.rotation.set(-0.85, 0, 0);
      if (!rig.heldProp) {
        rig.rightArm.rotation.set(-1.35 - Math.sin(time * 15) * 0.32, 0, -0.42);
        rFore.rotation.set(-0.85, 0, 0);
      }
    } else if (gesture === 'explain') {
      rig.leftArm.rotation.x = THREE.MathUtils.lerp(rig.leftArm.rotation.x, -0.65 + Math.sin(time * 5) * 0.2, k);
      rig.leftArm.rotation.z = THREE.MathUtils.lerp(rig.leftArm.rotation.z, 0.08, k);
      lFore.rotation.set(THREE.MathUtils.lerp(lFore.rotation.x, -0.55, k), 0, 0);
      if (!rig.heldProp) {
        rig.rightArm.rotation.x = THREE.MathUtils.lerp(rig.rightArm.rotation.x, -0.5 + Math.cos(time * 4) * 0.18, k);
        rig.rightArm.rotation.z = THREE.MathUtils.lerp(rig.rightArm.rotation.z, -0.08, k);
        rFore.rotation.set(THREE.MathUtils.lerp(rFore.rotation.x, -0.5, k), 0, 0);
      }
      rig.headGroup.rotation.y = Math.sin(time * 2.5) * 0.16;
      rig.headGroup.rotation.z = THREE.MathUtils.lerp(rig.headGroup.rotation.z, 0, k);
    } else if (gesture === 'point') {
      rig.leftArm.rotation.x = THREE.MathUtils.lerp(rig.leftArm.rotation.x, -1.25, k);
      rig.leftArm.rotation.z = THREE.MathUtils.lerp(rig.leftArm.rotation.z, 0, k);
      lFore.rotation.set(THREE.MathUtils.lerp(lFore.rotation.x, -0.15, k), 0, 0);
      if (!rig.heldProp) {
        rig.rightArm.rotation.x = THREE.MathUtils.lerp(rig.rightArm.rotation.x, -0.2, k);
        rig.rightArm.rotation.z = THREE.MathUtils.lerp(rig.rightArm.rotation.z, 0, k);
        rFore.rotation.set(0, 0, 0);
      }
      rig.headGroup.rotation.y = THREE.MathUtils.lerp(rig.headGroup.rotation.y, 0.18, k);
    } else if (gesture === 'nod') {
      rig.headGroup.rotation.x = Math.sin(time * 6) * 0.18;
      rig.leftArm.rotation.x = THREE.MathUtils.lerp(rig.leftArm.rotation.x, -0.15, k);
      rig.leftArm.rotation.z = THREE.MathUtils.lerp(rig.leftArm.rotation.z, 0, k);
      lFore.rotation.set(0, 0, 0);
    } else if (gesture === 'ponder') {
      rig.leftArm.rotation.x = THREE.MathUtils.lerp(rig.leftArm.rotation.x, -0.68, k);
      rig.leftArm.rotation.z = THREE.MathUtils.lerp(rig.leftArm.rotation.z, 0.12, k);
      lFore.rotation.set(THREE.MathUtils.lerp(lFore.rotation.x, -0.9, k), 0, 0);
      rig.headGroup.rotation.z = THREE.MathUtils.lerp(rig.headGroup.rotation.z, 0.12, k);
    } else if (gesture === 'gearup') {
      rig.leftArm.rotation.x = -1.1 + Math.sin(time * 6) * 0.2;
      rig.leftArm.rotation.z = THREE.MathUtils.lerp(rig.leftArm.rotation.z, 0, k);
      lFore.rotation.set(-0.6, 0, 0);
      if (!rig.heldProp) {
        rig.rightArm.rotation.x = -1.1 - Math.sin(time * 6) * 0.2;
        rig.rightArm.rotation.z = THREE.MathUtils.lerp(rig.rightArm.rotation.z, 0, k);
        rFore.rotation.set(-0.6, 0, 0);
      }
    } else if (gesture === 'scratch_head') {
      rig.headGroup.rotation.x = THREE.MathUtils.lerp(rig.headGroup.rotation.x, -0.04, k);
      rig.headGroup.rotation.y = THREE.MathUtils.lerp(rig.headGroup.rotation.y, Math.sin(time * 1.8) * 0.08, k);
      rig.headGroup.rotation.z = THREE.MathUtils.lerp(rig.headGroup.rotation.z, 0.16 + Math.sin(time * 2.8) * 0.04, k);
      rig.leftArm.rotation.x = THREE.MathUtils.lerp(rig.leftArm.rotation.x, -0.16, k);
      rig.leftArm.rotation.z = THREE.MathUtils.lerp(rig.leftArm.rotation.z, 0.08, k);
      lFore.rotation.set(THREE.MathUtils.lerp(lFore.rotation.x, -0.2, k), 0, 0);
      if (!rig.heldProp) {
        rig.rightArm.rotation.x = THREE.MathUtils.lerp(rig.rightArm.rotation.x, -1.62, k);
        rig.rightArm.rotation.z = THREE.MathUtils.lerp(rig.rightArm.rotation.z, -0.78, k);
        rFore.rotation.set(THREE.MathUtils.lerp(rFore.rotation.x, -1.25 + Math.sin(time * 10.5) * 0.12, k), 0, THREE.MathUtils.lerp(rFore.rotation.z, 0.68, k));
      }
    } else if (gesture === 'tilt_curious') {
      rig.headGroup.rotation.x = THREE.MathUtils.lerp(rig.headGroup.rotation.x, 0.16, k);
      rig.headGroup.rotation.y = THREE.MathUtils.lerp(rig.headGroup.rotation.y, Math.sin(time * 1.5) * 0.12, k);
      rig.headGroup.rotation.z = THREE.MathUtils.lerp(rig.headGroup.rotation.z, 0.24 + Math.sin(time * 2.2) * 0.05, k);
      rig.leftArm.rotation.x = THREE.MathUtils.lerp(rig.leftArm.rotation.x, -0.25, k);
      rig.leftArm.rotation.z = THREE.MathUtils.lerp(rig.leftArm.rotation.z, 0.05, k);
      lFore.rotation.set(THREE.MathUtils.lerp(lFore.rotation.x, -0.25, k), 0, 0);
      if (!rig.heldProp) {
        rig.rightArm.rotation.x = THREE.MathUtils.lerp(rig.rightArm.rotation.x, -0.82, k);
        rig.rightArm.rotation.z = THREE.MathUtils.lerp(rig.rightArm.rotation.z, -0.22, k);
        rFore.rotation.set(THREE.MathUtils.lerp(rFore.rotation.x, -1.22 + Math.sin(time * 4.5) * 0.06, k), 0, THREE.MathUtils.lerp(rFore.rotation.z, 0.36, k));
      }
    } else if (gesture === 'crouch_check') {
      rig.bodyPivot.position.y = THREE.MathUtils.lerp(rig.bodyPivot.position.y, -0.22, k);
      rig.bodyPivot.rotation.x = THREE.MathUtils.lerp(rig.bodyPivot.rotation.x, 0.35, k);
      rig.leftLeg.rotation.x = THREE.MathUtils.lerp(rig.leftLeg.rotation.x, -0.58, k);
      rig.rightLeg.rotation.x = THREE.MathUtils.lerp(rig.rightLeg.rotation.x, -0.45, k);
      rig.headGroup.rotation.set(0.28, Math.sin(time * 2) * 0.1, 0);
      rig.leftArm.rotation.set(-0.75, 0, 0.18);
      lFore.rotation.set(-0.35, 0, 0);
      if (!rig.heldProp) {
        rig.rightArm.rotation.set(-1.05 + Math.sin(time * 3.5) * 0.06, 0, -0.14);
        rFore.rotation.set(-0.25, 0, 0);
      }
    } else if (gesture === 'shock_cover') {
      rig.bodyPivot.position.y = Math.abs(Math.sin(time * 6)) * 0.02;
      rig.bodyPivot.rotation.x = THREE.MathUtils.lerp(rig.bodyPivot.rotation.x, -0.06, k);
      rig.headGroup.rotation.set(-0.08, Math.sin(time * 5) * 0.08, 0.06);
      rig.leftArm.rotation.set(-1.35, 0, 0.25);
      lFore.rotation.set(-1.15, 0, -0.42);
      if (!rig.heldProp) {
        rig.rightArm.rotation.set(-1.35, 0, -0.25);
        rFore.rotation.set(-1.15, 0, 0.42);
      }
    } else {
      rig.headGroup.rotation.x = THREE.MathUtils.lerp(rig.headGroup.rotation.x, 0, k);
      rig.headGroup.rotation.y = THREE.MathUtils.lerp(rig.headGroup.rotation.y, Math.sin(time * 1.1) * 0.1, k);
      rig.headGroup.rotation.z = THREE.MathUtils.lerp(rig.headGroup.rotation.z, 0, k);
      rig.leftArm.rotation.x = THREE.MathUtils.lerp(rig.leftArm.rotation.x, Math.sin(time * 2) * 0.04, k);
      rig.leftArm.rotation.z = THREE.MathUtils.lerp(rig.leftArm.rotation.z, 0, k);
      lFore.rotation.set(THREE.MathUtils.lerp(lFore.rotation.x, -0.14, k), 0, 0);
      if (!rig.heldProp) {
        rig.rightArm.rotation.x = THREE.MathUtils.lerp(rig.rightArm.rotation.x, -Math.sin(time * 2) * 0.04, k);
        rig.rightArm.rotation.z = THREE.MathUtils.lerp(rig.rightArm.rotation.z, 0, k);
        rFore.rotation.set(THREE.MathUtils.lerp(rFore.rotation.x, -0.14, k), 0, 0);
      }
    }

    if (rig.capeMesh) {
      rig.capeMesh.rotation.x = THREE.MathUtils.lerp(
        rig.capeMesh.rotation.x,
        0.14 + Math.sin(time * 2) * 0.025,
        k
      );
    }
  }

  // Flexible cloth wave deformation on capes (shoulder pinned at y=0, smooth wave toward hem, zero leg clipping)
  if (rig.capeCloths && rig.capeCloths.length > 0) {
    const isMoving = animState === 'walk' || animState === 'run' || animState === 'jump';
    const waveSpeed = animState === 'run' ? 9.5 : animState === 'walk' ? 6.2 : 2.6;
    const waveBoost = animState === 'run' ? 1.55 : isMoving ? 1.25 : 0.72;
    for (let c = 0; c < rig.capeCloths.length; c++) {
      const cloth = rig.capeCloths[c];
      const posAttr = cloth.geo.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      const base = cloth.basePos;
      for (let i = 0; i < arr.length; i += 3) {
        const bx = base[i];
        const by = base[i + 1];
        const bz = base[i + 2];
        const vDrop = Math.min(1, Math.max(0, -by / cloth.height));
        const pin = vDrop * vDrop;
        const ripple =
          Math.sin(time * waveSpeed + vDrop * 4.2 + bx * 3.1) *
          cloth.amplitude *
          waveBoost *
          pin;
        // Negative Z pulls hem backward away from legs so it never clips into the body
        arr[i] = bx + Math.sin(time * (waveSpeed * 0.6) + vDrop * 2.5) * 0.02 * pin;
        arr[i + 1] = by;
        arr[i + 2] = bz - Math.abs(ripple) * 0.55 + ripple * 0.45 - (isMoving ? 0.1 * pin : 0);
      }
      posAttr.needsUpdate = true;
    }
  }

  if (rig.heldProp) {
    rig.heldProp.rotation.y += delta * 1.4;
  }

  if (rig.animatedAccGroups && rig.animatedAccGroups.length > 0) {
    for (let i = 0; i < rig.animatedAccGroups.length; i++) {
      const acc = rig.animatedAccGroups[i];
      if (acc.mode === 'orbit') {
        acc.obj.rotation.y += delta * (acc.speed ?? 1.2);
      } else if (acc.mode === 'ring_spin') {
        acc.obj.rotation.z += delta * (acc.speed ?? 0.8);
      } else if (acc.mode === 'pulse') {
        const s = 1 + Math.sin(time * 3.4 + (acc.phase ?? 0)) * 0.08;
        acc.obj.scale.setScalar(s);
      } else if (acc.mode === 'wave') {
        acc.obj.rotation.x = (acc.baseRotX ?? 0.16) + Math.sin(time * 2.6 + (acc.phase ?? 0)) * 0.07;
      } else if (acc.mode === 'wing_L') {
        acc.obj.rotation.y = 0.42 + Math.sin(time * 3.2) * 0.12;
      } else if (acc.mode === 'wing_R') {
        acc.obj.rotation.y = -0.42 - Math.sin(time * 3.2) * 0.12;
      }
    }
  }
}
