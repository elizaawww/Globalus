import * as THREE from 'three';
import { PLAYER_COLORS } from '../data/gameData';
import {
  CharacterAnimState,
  CharacterConfig,
  EmoteId,
  HelmetDesignId,
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

export interface CharacterRig {
  root: THREE.Group;
  bodyPivot: THREE.Group;
  headGroup: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  capeMesh?: THREE.Object3D;
  animatedAccGroups?: Array<{
    obj: THREE.Object3D;
    mode: 'orbit' | 'pulse' | 'wave' | 'ring_spin';
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

  // Detailed Chestplate + Identity Badge
  const chestPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.44, 0.28, 0.12),
    config.costume === 'nusantara_batik'
      ? new THREE.MeshStandardMaterial({ map: tex.batikGold, roughness: 0.42, metalness: 0.35 })
      : metallicMat
  );
  chestPlate.position.set(0, 1.14, 0.34);
  bodyPivot.add(chestPlate);

  const idBadge = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.04), neonMat);
  idBadge.position.set(-0.11, 1.19, 0.4);
  bodyPivot.add(idBadge);

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

  // Head + Helmet Design Variants
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.64, 0);
  bodyPivot.add(headGroup);

  const neckCollar = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.055, 8, 20), metallicMat);
  neckCollar.rotation.x = Math.PI / 2;
  neckCollar.position.y = -0.22;
  headGroup.add(neckCollar);

  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.38, 22, 18), suitMat);
  helmet.castShadow = !isGhost;
  headGroup.add(helmet);

  // Visor shape varies with helmet design
  const hDesign = config.helmet || 'standard_visor';
  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.28, 22, 16), visorMat);
  visor.position.set(0, 0.02, 0.18);
  visor.scale.set(
    hDesign === 'explorer_dome' ? 1.24 : 1.14,
    hDesign === 'cyber_recon' ? 0.64 : 0.8,
    0.66
  );
  headGroup.add(visor);

  const visorRim = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.032, 8, 24), metallicMat);
  visorRim.position.set(0, 0.02, 0.29);
  visorRim.scale.set(hDesign === 'explorer_dome' ? 1.28 : 1.2, hDesign === 'cyber_recon' ? 0.72 : 0.85, 0.5);
  headGroup.add(visorRim);

  if (hDesign === 'commander_crest') {
    const crest = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.18, 0.46), metallicMat);
    crest.position.set(0, 0.36, -0.02);
    const crestGlow = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.38), neonMat);
    crestGlow.position.set(0, 0.45, 0);
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

  // Arms with cuff rings & gloves
  const makeArm = (xOffset: number) => {
    const armGroup = new THREE.Group();
    armGroup.position.set(xOffset, 1.3, 0);
    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.115, 0.34, 6, 10), suitMat);
    sleeve.position.y = -0.22;
    sleeve.castShadow = !isGhost;
    armGroup.add(sleeve);

    const cuff = new THREE.Mesh(
      new THREE.CylinderGeometry(0.125, 0.125, 0.06, 12),
      config.costume === 'cyber_neon' ? neonMat : metallicMat
    );
    cuff.position.y = -0.37;
    armGroup.add(cuff);

    const glove = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), trimMat);
    glove.position.y = -0.46;
    armGroup.add(glove);
    return armGroup;
  };
  const leftArm = makeArm(-0.53);
  const rightArm = makeArm(0.53);
  bodyPivot.add(leftArm, rightArm);

  // --- BODY ACCESSORY & BACKPACK ---
  let capeMesh: THREE.Object3D | undefined;
  const bodyAcc = config.body;
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
          ? new THREE.MeshStandardMaterial({ map: tex.batikEmerald, roughness: 0.5, metalness: 0.25 })
          : trimMat;
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.58, 0.28), packMat);
    pack.position.set(0, 1.14, -0.39);
    pack.castShadow = !isGhost;
    bodyPivot.add(pack);

    // Thruster nozzles on backpack
    const nozzleL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.085, 0.12, 10), metallicMat);
    nozzleL.position.set(-0.14, 0.82, -0.42);
    const nozzleR = nozzleL.clone();
    nozzleR.position.x = 0.14;
    bodyPivot.add(nozzleL, nozzleR);

    const statusBar = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.04), neonMat);
    statusBar.position.set(0, 1.28, -0.53);
    bodyPivot.add(statusBar);
  }
  if (bodyAcc === 'cape') {
    const capeMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, side: THREE.DoubleSide, roughness: 0.62 });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.98, 4, 4), capeMat);
    mesh.position.set(0, 0.96, -0.45);
    mesh.rotation.x = 0.18;
    bodyPivot.add(mesh);
    capeMesh = mesh;
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

    const claspL = new THREE.Mesh(new THREE.OctahedronGeometry(0.07, 0), goldTrimMat);
    claspL.position.set(-0.34, 1.4, 0.14);
    const claspR = claspL.clone();
    claspR.position.x = 0.34;
    royalGrp.add(claspL, claspR);

    const capeTail = new THREE.Group();
    capeTail.position.set(0, 1.38, -0.41);
    capeTail.rotation.x = 0.18;
    const clothMat = new THREE.MeshStandardMaterial({
      map: tex.batikMaroon,
      side: THREE.DoubleSide,
      roughness: 0.48,
      metalness: 0.12,
    });
    const cloth = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.5, 0.98, 12, 1, true, Math.PI * 0.72, Math.PI * 0.56), clothMat);
    cloth.position.set(0, -0.48, 0.22);
    const hemBar = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.045, 0.04), goldTrimMat);
    hemBar.position.set(0, -0.96, -0.14);
    capeTail.add(cloth, hemBar);
    royalGrp.add(capeTail);
    bodyPivot.add(royalGrp);
    capeMesh = capeTail;
  } else if (bodyAcc === 'modern_batik_cape') {
    // Nusantara Tech Mantle — Signature Reward from BIMA
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
      roughness: 0.5,
      metalness: 0.22,
    });

    // High armored sculpted shoulder collar + golden filigree bezel
    const collarBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.47, 0.14, 18, 1, true),
      darkArmorMat
    );
    collarBase.position.set(0, 1.43, -0.02);
    const collarRim = new THREE.Mesh(new THREE.TorusGeometry(0.41, 0.028, 8, 24), goldMat);
    collarRim.rotation.x = Math.PI / 2;
    collarRim.position.set(0, 1.49, -0.02);
    mantleGrp.add(collarBase, collarRim);

    // Asymmetrical Sculpted Shoulder Mantle Wings (3D embossed golden batik crest + glowing emerald vents)
    const makeShoulderPlate = (side: -1 | 1) => {
      const pGrp = new THREE.Group();
      pGrp.position.set(side * 0.48, 1.38, -0.02);
      pGrp.rotation.z = side * (side === -1 ? 0.34 : 0.2);

      const shell = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.12, 0.34), darkArmorMat);
      const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.04, 0.14), goldMat);
      ridge.position.y = 0.06;
      const vein = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.025, 0.28), emeraldGlowMat);
      vein.position.y = -0.04;
      pGrp.add(shell, ridge, vein);
      return pGrp;
    };
    const leftShoulder = makeShoulderPlate(-1);
    const rightShoulder = makeShoulderPlate(1);
    // Asymmetric chest-to-shoulder sash strap
    const asymStrap = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.08, 0.12), batikMantleMat);
    asymStrap.position.set(-0.04, 1.24, 0.31);
    asymStrap.rotation.z = 0.42;
    const strapClasp = new THREE.Mesh(new THREE.OctahedronGeometry(0.065, 0), emeraldGlowMat);
    strapClasp.position.set(-0.24, 1.34, 0.38);
    mantleGrp.add(leftShoulder, rightShoulder, asymStrap, strapClasp);

    // Spine Reactor Core + Multi-panel Draping Tech Mantle
    const spineCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), emeraldGlowMat);
    spineCore.position.set(0, 1.33, -0.45);
    const spineFrame = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.022, 8, 6), goldMat);
    spineFrame.position.set(0, 1.33, -0.44);
    mantleGrp.add(spineCore, spineFrame);

    const mantlePivot = new THREE.Group();
    mantlePivot.position.set(0, 1.36, -0.42);
    mantlePivot.rotation.x = 0.17;

    // Tapered asymmetric Batik drape shape using ExtrudeGeometry for crisp 3D depth
    const drapeShape = new THREE.Shape();
    drapeShape.moveTo(-0.34, 0);
    drapeShape.lineTo(0.34, 0);
    drapeShape.lineTo(0.46, -0.82);
    drapeShape.lineTo(0.08, -0.98);
    drapeShape.lineTo(-0.22, -0.88);
    drapeShape.lineTo(-0.44, -0.94);
    drapeShape.closePath();

    const drapeGeo = new THREE.ExtrudeGeometry(drapeShape, {
      depth: 0.025,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01,
      bevelSegments: 2,
    });
    const drapeMesh = new THREE.Mesh(drapeGeo, batikMantleMat);
    drapeMesh.position.z = -0.02;

    // Glowing emerald energy edge veins & golden side rails
    const railL = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.024, 0.92, 8), goldMat);
    railL.position.set(-0.38, -0.46, 0.01);
    railL.rotation.z = -0.1;
    const railR = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.024, 0.84, 8), emeraldGlowMat);
    railR.position.set(0.39, -0.42, 0.01);
    railR.rotation.z = 0.12;
    const finCenter = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.72, 0.03), emeraldGlowMat);
    finCenter.position.set(0, -0.45, -0.03);

    mantlePivot.add(drapeMesh, railL, railR, finCenter);
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
    const sash = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 0.28, 16),
      new THREE.MeshStandardMaterial({ map: tex.batikGold, roughness: 0.48, metalness: 0.3 })
    );
    sash.position.y = 1.08;
    sash.scale.set(1.02, 1, 0.89);
    bodyPivot.add(sash);
  }
  if (bodyAcc === 'jaket_astronaut') {
    const collar = new THREE.Mesh(
      new THREE.TorusGeometry(0.36, 0.09, 10, 20),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.45, metalness: 0.4 })
    );
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 1.46;
    bodyPivot.add(collar);
  }
  if (bodyAcc === 'aksesori_futuristik') {
    const finMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x7e22ce,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.7,
    });
    const finL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.68, 0.36), finMat);
    finL.position.set(-0.28, 1.26, -0.46);
    finL.rotation.set(0.3, 0, -0.35);
    const finR = finL.clone();
    finR.position.x = 0.28;
    finR.rotation.z = 0.35;
    bodyPivot.add(finL, finR);
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
        ? new THREE.MeshStandardMaterial({ map: tex.batikGold, roughness: 0.55 })
        : new THREE.MeshStandardMaterial({
            color: hAcc === 'futuristic_blue_hat' ? 0x0ea5e9 : 0xf8fafc,
            roughness: 0.35,
            metalness: 0.4,
          });
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.32, 0.18, 16), hatMat);
    cap.position.set(0, 0.39, 0);
    const brim = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.04, 0.36), hatMat);
    brim.position.set(0, 0.32, 0.2);
    headwearMount.add(cap, brim);
  } else if (hAcc === 'helm_futuristik' || hAcc === 'aksesori_antariksa') {
    const antMat = new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      emissive: 0x0891b2,
      emissiveIntensity: 0.9,
      metalness: 0.7,
      roughness: 0.2,
    });
    const stalkL = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.3, 8), metallicMat);
    stalkL.position.set(-0.24, 0.44, 0);
    const tipL = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), antMat);
    tipL.position.set(-0.24, 0.6, 0);
    headwearMount.add(stalkL, tipL);
    if (hAcc === 'aksesori_antariksa') {
      const stalkR = stalkL.clone();
      stalkR.position.x = 0.24;
      const tipR = tipL.clone();
      tipR.position.x = 0.24;
      headwearMount.add(stalkR, tipR);
    }
  } else if (hAcc === 'headset') {
    const earMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.75, roughness: 0.25 });
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.035, 8, 24, Math.PI), earMat);
    band.position.y = 0.06;
    const cupL = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.08, 12), earMat);
    cupL.rotation.z = Math.PI / 2;
    cupL.position.set(-0.4, 0.02, 0);
    const cupR = cupL.clone();
    cupR.position.x = 0.4;
    const mic = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.26), earMat);
    mic.position.set(0.32, -0.06, 0.22);
    headwearMount.add(band, cupL, cupR, mic);
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
    leftLeg,
    rightLeg,
    capeMesh,
    animatedAccGroups,
    nameSprite,
    suitParts,
  };
}

export function buildNpcAstronaut(npcId: NpcCharacterId): CharacterRig {
  const tex = getSharedTextures();
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
    phoneGroup.position.set(0, -0.45, 0.14);
    phoneGroup.rotation.x = -0.6;
    rig.rightArm.add(phoneGroup);
    rig.rightArm.rotation.x = -0.7;
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
    globeGroup.position.set(0, -0.42, 0.22);
    rig.rightArm.add(globeGroup);
    rig.rightArm.rotation.x = -0.65;
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
    waveOrb.position.set(0, -0.42, 0.2);
    rig.rightArm.add(waveOrb);
    rig.rightArm.rotation.x = -0.68;
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
    tradePrism.position.set(0, -0.43, 0.2);
    rig.rightArm.add(tradePrism);
    rig.rightArm.rotation.x = -0.66;
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
  tabGroup.position.set(0, -0.44, 0.16);
  tabGroup.rotation.x = -0.55;
  rig.rightArm.add(tabGroup);
  rig.rightArm.rotation.x = -0.68;
  rig.heldProp = tabGroup;
  return rig;
}

export function animateCharacterRig(
  rig: CharacterRig,
  time: number,
  animState: CharacterAnimState,
  delta: number,
  gesture?: 'explain' | 'point' | 'nod' | 'ponder' | 'gearup' | 'scratch_head' | 'tilt_curious',
  activeEmote?: EmoteId | null,
  emoteElapsed = 0
) {
  const k = 1 - Math.exp(-12 * delta);
  // Emotes are expressed purely via 3D character body/limb animation (no floating overhead emoji)

  if (animState === 'jump') {
    rig.leftLeg.rotation.x = THREE.MathUtils.lerp(rig.leftLeg.rotation.x, -0.52, k);
    rig.rightLeg.rotation.x = THREE.MathUtils.lerp(rig.rightLeg.rotation.x, 0.36, k);
    rig.leftArm.rotation.x = THREE.MathUtils.lerp(rig.leftArm.rotation.x, -1.95, k);
    rig.leftArm.rotation.z = THREE.MathUtils.lerp(rig.leftArm.rotation.z, 0.42, k);
    if (!rig.heldProp) {
      rig.rightArm.rotation.x = THREE.MathUtils.lerp(rig.rightArm.rotation.x, -1.95, k);
      rig.rightArm.rotation.z = THREE.MathUtils.lerp(rig.rightArm.rotation.z, -0.42, k);
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
      rig.capeMesh.rotation.x = THREE.MathUtils.lerp(rig.capeMesh.rotation.x, 0.58, k);
    }
  } else if (animState === 'walk' || animState === 'run') {
    const isRun = animState === 'run';
    const freq = isRun ? 14 : 9.5;
    const amp = isRun ? 0.85 : 0.62;
    const swing = Math.sin(time * freq) * amp;
    rig.leftLeg.rotation.x = swing;
    rig.rightLeg.rotation.x = -swing;
    rig.leftArm.rotation.x = -swing * 0.78;
    rig.leftArm.rotation.z = THREE.MathUtils.lerp(rig.leftArm.rotation.z, 0, k);
    if (!rig.heldProp) {
      rig.rightArm.rotation.x = swing * 0.78;
      rig.rightArm.rotation.z = THREE.MathUtils.lerp(rig.rightArm.rotation.z, 0, k);
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
      rig.capeMesh.rotation.x = (isRun ? 0.45 : 0.28) + Math.sin(time * freq * 0.8) * 0.12;
    }
  } else if (animState === 'interact') {
    rig.leftLeg.rotation.x = THREE.MathUtils.lerp(rig.leftLeg.rotation.x, 0, k);
    rig.rightLeg.rotation.x = THREE.MathUtils.lerp(rig.rightLeg.rotation.x, 0, k);
    rig.leftArm.rotation.x = -0.85 + Math.sin(time * 14) * 0.12;
    rig.leftArm.rotation.z = THREE.MathUtils.lerp(rig.leftArm.rotation.z, 0, k);
    if (!rig.heldProp) {
      rig.rightArm.rotation.x = -0.85 + Math.cos(time * 14) * 0.12;
      rig.rightArm.rotation.z = THREE.MathUtils.lerp(rig.rightArm.rotation.z, 0, k);
    }
    rig.bodyPivot.rotation.x = THREE.MathUtils.lerp(rig.bodyPivot.rotation.x, 0.08, k);
    rig.bodyPivot.rotation.y = THREE.MathUtils.lerp(rig.bodyPivot.rotation.y, 0, k);
    rig.bodyPivot.rotation.z = THREE.MathUtils.lerp(rig.bodyPivot.rotation.z, 0, k);
    rig.headGroup.rotation.x = THREE.MathUtils.lerp(rig.headGroup.rotation.x, 0.12, k);
  } else if (animState === 'vent_in') {
    rig.bodyPivot.position.y = THREE.MathUtils.lerp(rig.bodyPivot.position.y, -1.2, k);
    rig.bodyPivot.scale.setScalar(THREE.MathUtils.lerp(rig.bodyPivot.scale.x, 0.25, k));
    rig.leftArm.rotation.x = THREE.MathUtils.lerp(rig.leftArm.rotation.x, -2.1, k);
    if (!rig.heldProp) rig.rightArm.rotation.x = THREE.MathUtils.lerp(rig.rightArm.rotation.x, -2.1, k);
  } else if (animState === 'vent_out') {
    rig.bodyPivot.position.y = THREE.MathUtils.lerp(rig.bodyPivot.position.y, 0.05, k);
    rig.bodyPivot.scale.setScalar(THREE.MathUtils.lerp(rig.bodyPivot.scale.x, 1, k));
    rig.leftArm.rotation.x = THREE.MathUtils.lerp(rig.leftArm.rotation.x, 0, k);
    if (!rig.heldProp) rig.rightArm.rotation.x = THREE.MathUtils.lerp(rig.rightArm.rotation.x, 0, k);
  } else if (animState === 'celebrate') {
    rig.bodyPivot.position.y = Math.abs(Math.sin(time * 7)) * 0.22;
    rig.leftArm.rotation.x = -2.3 + Math.sin(time * 9) * 0.25;
    if (!rig.heldProp) rig.rightArm.rotation.x = -2.3 - Math.sin(time * 9) * 0.25;
    rig.bodyPivot.scale.setScalar(1);
  } else if (animState === 'defeat') {
    rig.bodyPivot.position.y = -0.05;
    rig.bodyPivot.rotation.x = 0.22;
    rig.headGroup.rotation.x = 0.35;
    rig.leftArm.rotation.x = 0.15;
    if (!rig.heldProp) rig.rightArm.rotation.x = 0.15;
  } else if (activeEmote) {
    const et = emoteElapsed || time;
    rig.bodyPivot.scale.setScalar(THREE.MathUtils.lerp(rig.bodyPivot.scale.x, 1, k));
    rig.leftLeg.rotation.x = THREE.MathUtils.lerp(rig.leftLeg.rotation.x, 0, k);
    rig.rightLeg.rotation.x = THREE.MathUtils.lerp(rig.rightLeg.rotation.x, 0, k);
    rig.bodyPivot.rotation.x = THREE.MathUtils.lerp(rig.bodyPivot.rotation.x, 0, k);
    rig.bodyPivot.rotation.y = THREE.MathUtils.lerp(rig.bodyPivot.rotation.y, 0, k);
    rig.bodyPivot.rotation.z = THREE.MathUtils.lerp(rig.bodyPivot.rotation.z, 0, k);

    if (activeEmote === 'wave') {
      rig.bodyPivot.position.y = Math.sin(et * 4) * 0.03;
      rig.headGroup.rotation.z = -0.1;
      rig.headGroup.rotation.y = Math.sin(et * 3) * 0.1;
      rig.leftArm.rotation.x = THREE.MathUtils.lerp(rig.leftArm.rotation.x, -0.1, k);
      rig.leftArm.rotation.z = THREE.MathUtils.lerp(rig.leftArm.rotation.z, 0.1, k);
      if (!rig.heldProp) {
        rig.rightArm.rotation.x = -2.35;
        rig.rightArm.rotation.z = -0.45 + Math.sin(et * 11) * 0.35;
      }
    } else if (activeEmote === 'clap') {
      const clap = Math.abs(Math.sin(et * 11));
      rig.bodyPivot.position.y = clap * 0.04;
      rig.headGroup.rotation.x = Math.sin(et * 5.5) * 0.08;
      rig.leftArm.rotation.x = -1.25;
      rig.leftArm.rotation.z = -0.58 + clap * 0.34;
      if (!rig.heldProp) {
        rig.rightArm.rotation.x = -1.25;
        rig.rightArm.rotation.z = 0.58 - clap * 0.34;
      }
    } else if (activeEmote === 'thumbs_up') {
      rig.bodyPivot.position.y = Math.sin(et * 3.5) * 0.03;
      rig.headGroup.rotation.x = -0.12;
      rig.headGroup.rotation.z = 0.08;
      rig.leftArm.rotation.x = -0.12;
      rig.leftArm.rotation.z = 0.1;
      if (!rig.heldProp) {
        rig.rightArm.rotation.x = -1.55 + Math.sin(et * 4) * 0.06;
        rig.rightArm.rotation.z = -0.18;
      }
    } else if (activeEmote === 'heart') {
      rig.bodyPivot.position.y = Math.sin(et * 5) * 0.04;
      rig.headGroup.rotation.x = -0.06;
      rig.headGroup.rotation.z = Math.sin(et * 3) * 0.12;
      rig.leftArm.rotation.x = -2.25;
      rig.leftArm.rotation.z = -0.45;
      if (!rig.heldProp) {
        rig.rightArm.rotation.x = -2.25;
        rig.rightArm.rotation.z = 0.45;
      }
    } else if (activeEmote === 'laugh') {
      rig.bodyPivot.position.y = Math.abs(Math.sin(et * 12)) * 0.1;
      rig.bodyPivot.rotation.x = -0.14 + Math.sin(et * 12) * 0.08;
      rig.headGroup.rotation.x = -0.25 + Math.sin(et * 12) * 0.14;
      rig.leftArm.rotation.x = -0.75 + Math.sin(et * 12) * 0.2;
      rig.leftArm.rotation.z = 0.25;
      if (!rig.heldProp) {
        rig.rightArm.rotation.x = -0.75 - Math.sin(et * 12) * 0.2;
        rig.rightArm.rotation.z = -0.25;
      }
    } else if (activeEmote === 'sad') {
      rig.bodyPivot.position.y = -0.06;
      rig.bodyPivot.rotation.x = 0.2;
      rig.headGroup.rotation.x = 0.38;
      rig.headGroup.rotation.z = Math.sin(et * 3.5) * 0.14;
      rig.leftArm.rotation.x = -0.45;
      rig.leftArm.rotation.z = -0.18;
      if (!rig.heldProp) {
        rig.rightArm.rotation.x = -0.45;
        rig.rightArm.rotation.z = 0.18;
      }
    } else if (activeEmote === 'surprised') {
      rig.bodyPivot.position.y = Math.abs(Math.sin(et * 8)) * 0.08;
      rig.bodyPivot.rotation.x = -0.16;
      rig.headGroup.rotation.x = -0.24;
      rig.leftArm.rotation.x = -1.65;
      rig.leftArm.rotation.z = 0.65;
      if (!rig.heldProp) {
        rig.rightArm.rotation.x = -1.65;
        rig.rightArm.rotation.z = -0.65;
      }
    } else if (activeEmote === 'dance') {
      rig.bodyPivot.position.y = Math.abs(Math.sin(et * 9)) * 0.14;
      rig.bodyPivot.rotation.y = Math.sin(et * 4.5) * 0.42;
      rig.bodyPivot.rotation.z = Math.sin(et * 9) * 0.14;
      rig.leftLeg.rotation.x = Math.sin(et * 9) * 0.45;
      rig.rightLeg.rotation.x = -Math.sin(et * 9) * 0.45;
      rig.leftArm.rotation.x = -1.5 + Math.sin(et * 9) * 0.7;
      rig.leftArm.rotation.z = 0.35 + Math.cos(et * 9) * 0.25;
      if (!rig.heldProp) {
        rig.rightArm.rotation.x = -1.5 - Math.sin(et * 9) * 0.7;
        rig.rightArm.rotation.z = -0.35 - Math.cos(et * 9) * 0.25;
      }
      rig.headGroup.rotation.y = -Math.sin(et * 4.5) * 0.25;
    } else if (activeEmote === 'celebrate') {
      rig.bodyPivot.position.y = Math.abs(Math.sin(et * 8)) * 0.22;
      rig.headGroup.rotation.x = -0.15;
      rig.leftArm.rotation.x = -2.45 + Math.sin(et * 10) * 0.24;
      rig.leftArm.rotation.z = 0.32;
      if (!rig.heldProp) {
        rig.rightArm.rotation.x = -2.45 - Math.sin(et * 10) * 0.24;
        rig.rightArm.rotation.z = -0.32;
      }
    } else if (activeEmote === 'think') {
      rig.bodyPivot.position.y = Math.sin(et * 2.5) * 0.02;
      rig.headGroup.rotation.x = 0.14;
      rig.headGroup.rotation.z = 0.2 + Math.sin(et * 2.5) * 0.05;
      rig.leftArm.rotation.x = -0.25;
      rig.leftArm.rotation.z = 0.1;
      if (!rig.heldProp) {
        rig.rightArm.rotation.x = -1.65;
        rig.rightArm.rotation.z = -0.38;
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

    if (gesture === 'explain') {
      rig.leftArm.rotation.x = THREE.MathUtils.lerp(rig.leftArm.rotation.x, -0.75 + Math.sin(time * 5) * 0.2, k);
      rig.leftArm.rotation.z = THREE.MathUtils.lerp(rig.leftArm.rotation.z, 0, k);
      if (!rig.heldProp) {
        rig.rightArm.rotation.x = THREE.MathUtils.lerp(rig.rightArm.rotation.x, -0.6 + Math.cos(time * 4) * 0.18, k);
        rig.rightArm.rotation.z = THREE.MathUtils.lerp(rig.rightArm.rotation.z, 0, k);
      }
      rig.headGroup.rotation.y = Math.sin(time * 2.5) * 0.16;
    } else if (gesture === 'point') {
      rig.leftArm.rotation.x = THREE.MathUtils.lerp(rig.leftArm.rotation.x, -1.25, k);
      rig.leftArm.rotation.z = THREE.MathUtils.lerp(rig.leftArm.rotation.z, 0, k);
      if (!rig.heldProp) {
        rig.rightArm.rotation.x = THREE.MathUtils.lerp(rig.rightArm.rotation.x, -0.2, k);
        rig.rightArm.rotation.z = THREE.MathUtils.lerp(rig.rightArm.rotation.z, 0, k);
      }
      rig.headGroup.rotation.y = THREE.MathUtils.lerp(rig.headGroup.rotation.y, 0.18, k);
    } else if (gesture === 'nod') {
      rig.headGroup.rotation.x = Math.sin(time * 6) * 0.18;
      rig.leftArm.rotation.x = THREE.MathUtils.lerp(rig.leftArm.rotation.x, -0.15, k);
      rig.leftArm.rotation.z = THREE.MathUtils.lerp(rig.leftArm.rotation.z, 0, k);
    } else if (gesture === 'ponder') {
      rig.leftArm.rotation.x = THREE.MathUtils.lerp(rig.leftArm.rotation.x, -0.95, k);
      rig.leftArm.rotation.z = THREE.MathUtils.lerp(rig.leftArm.rotation.z, 0, k);
      rig.headGroup.rotation.z = THREE.MathUtils.lerp(rig.headGroup.rotation.z, 0.12, k);
    } else if (gesture === 'gearup') {
      rig.leftArm.rotation.x = -1.4 + Math.sin(time * 6) * 0.2;
      rig.leftArm.rotation.z = THREE.MathUtils.lerp(rig.leftArm.rotation.z, 0, k);
      if (!rig.heldProp) {
        rig.rightArm.rotation.x = -1.4 - Math.sin(time * 6) * 0.2;
        rig.rightArm.rotation.z = THREE.MathUtils.lerp(rig.rightArm.rotation.z, 0, k);
      }
    } else if (gesture === 'scratch_head') {
      rig.headGroup.rotation.x = THREE.MathUtils.lerp(rig.headGroup.rotation.x, -0.06, k);
      rig.headGroup.rotation.y = THREE.MathUtils.lerp(rig.headGroup.rotation.y, Math.sin(time * 1.8) * 0.08, k);
      rig.headGroup.rotation.z = THREE.MathUtils.lerp(rig.headGroup.rotation.z, 0.16 + Math.sin(time * 2.8) * 0.04, k);
      rig.leftArm.rotation.x = THREE.MathUtils.lerp(rig.leftArm.rotation.x, -0.16, k);
      rig.leftArm.rotation.z = THREE.MathUtils.lerp(rig.leftArm.rotation.z, 0.08, k);
      if (!rig.heldProp) {
        rig.rightArm.rotation.x = THREE.MathUtils.lerp(rig.rightArm.rotation.x, -2.28 + Math.sin(time * 10.5) * 0.14, k);
        rig.rightArm.rotation.z = THREE.MathUtils.lerp(rig.rightArm.rotation.z, -0.44 + Math.cos(time * 10.5) * 0.08, k);
      }
    } else if (gesture === 'tilt_curious') {
      rig.headGroup.rotation.x = THREE.MathUtils.lerp(rig.headGroup.rotation.x, 0.16, k);
      rig.headGroup.rotation.y = THREE.MathUtils.lerp(rig.headGroup.rotation.y, Math.sin(time * 1.5) * 0.12, k);
      rig.headGroup.rotation.z = THREE.MathUtils.lerp(rig.headGroup.rotation.z, 0.24 + Math.sin(time * 2.2) * 0.05, k);
      rig.leftArm.rotation.x = THREE.MathUtils.lerp(rig.leftArm.rotation.x, -0.25, k);
      rig.leftArm.rotation.z = THREE.MathUtils.lerp(rig.leftArm.rotation.z, 0.05, k);
      if (!rig.heldProp) {
        rig.rightArm.rotation.x = THREE.MathUtils.lerp(rig.rightArm.rotation.x, -2.05 + Math.sin(time * 8.0) * 0.1, k);
        rig.rightArm.rotation.z = THREE.MathUtils.lerp(rig.rightArm.rotation.z, -0.38, k);
      }
    } else {
      rig.headGroup.rotation.x = THREE.MathUtils.lerp(rig.headGroup.rotation.x, 0, k);
      rig.headGroup.rotation.y = THREE.MathUtils.lerp(rig.headGroup.rotation.y, Math.sin(time * 1.1) * 0.1, k);
      rig.headGroup.rotation.z = THREE.MathUtils.lerp(rig.headGroup.rotation.z, 0, k);
      rig.leftArm.rotation.x = THREE.MathUtils.lerp(rig.leftArm.rotation.x, Math.sin(time * 2) * 0.04, k);
      rig.leftArm.rotation.z = THREE.MathUtils.lerp(rig.leftArm.rotation.z, 0, k);
      if (!rig.heldProp) {
        rig.rightArm.rotation.x = THREE.MathUtils.lerp(rig.rightArm.rotation.x, -Math.sin(time * 2) * 0.04, k);
        rig.rightArm.rotation.z = THREE.MathUtils.lerp(rig.rightArm.rotation.z, 0, k);
      }
    }

    if (rig.capeMesh) {
      rig.capeMesh.rotation.x = THREE.MathUtils.lerp(
        rig.capeMesh.rotation.x,
        0.16 + Math.sin(time * 2) * 0.03,
        k
      );
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
      }
    }
  }
}
