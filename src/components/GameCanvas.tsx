import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { soundEngine } from '../audio/soundEngine';
import { CUTSCENES, MISSION_META, PLAYER_COLORS } from '../data/gameData';
import {
  detectBlockedDoorAttempt,
  getLockedDoorColliders,
  getRoomAtPosition,
  isPointWalkable,
  PROP_COLLIDERS,
  PropCollider,
  resolvePlayerMovement,
  ROOMS,
  VENTS,
} from '../data/stationLayout';
import { areRequiredBooksRead, THEORY_BOOK_MAP } from '../data/theoryBooks';
import {
  animateCharacterRig,
  buildAstronautRig,
  buildNpcAstronaut,
  CharacterRig,
} from '../three/characterBuilder';
import { detectSoftwareGl } from '../three/proceduralTextures';
import { createSparkleGuide, SparkleGuideController } from '../three/sparkleGuide';
import {
  buildStationWorld,
  DoorLockVisualState,
  getDoorLockBadgeTexture,
  StationWorld,
} from '../three/stationBuilder';
import {
  ChapterId,
  CharacterAnimState,
  CharacterConfig,
  CutsceneCharacterId,
  CutsceneLine,
  EliminationEvent,
  EmoteId,
  GameSettings,
  MissionId,
  MultiplayerRole,
  NpcCharacterId,
  RemotePlayerPublic,
  RoomId,
  StasisPodState,
  TheoryBookId,
} from '../types/game';

export interface HudLiveState {
  playerX: number;
  playerZ: number;
  playerYaw: number;
  cameraYaw: number;
  currentRoomId: RoomId | null;
  currentRoomName: string;
  nearbyTerminal: {
    roomId: RoomId;
    missionId?: MissionId;
    label: string;
  } | null;
  nearbyBook: {
    id: TheoryBookId;
    title: string;
    topicLabel: string;
  } | null;
  nearbyVent: {
    id: string;
    label: string;
    roomId: RoomId;
  } | null;
  nearbyStasisPod: {
    id: string;
    victimName: string;
    roomName: string;
  } | null;
  nearbyEmergencyConsole: boolean;
  nearbyEliminateTarget: {
    id: string;
    name: string;
  } | null;
}

interface GameCanvasProps {
  character: CharacterConfig;
  settings: GameSettings;
  completedMissions: MissionId[];
  unlockedChapter: ChapterId;
  completedChaptersCount?: number;
  lockedRooms?: RoomId[];
  chapterLockedDoorIds?: string[];
  activeMissionRoomId?: RoomId | null;
  readBooks?: TheoryBookId[];
  activeTheoryBook?: TheoryBookId | null;
  activeCutscene: CutsceneCharacterId | null;
  activeCutsceneLine?: CutsceneLine | null;
  isPaused: boolean;
  joystickInputRef: React.MutableRefObject<{ x: number; y: number }>;
  triggerJumpRef?: React.MutableRefObject<(() => void) | null>;
  activeEmote?: EmoteId | null;
  activeEmoteStartedAt?: number;
  onCancelEmote?: () => void;
  resetCameraTick: number;
  teleportPos: { x: number; z: number; tick: number; skipAnim?: boolean; yaw?: number } | null;
  // Multiplayer props
  isMultiplayer?: boolean;
  myPlayerId?: string | null;
  myRole?: MultiplayerRole | null;
  amAlive?: boolean;
  inVent?: boolean;
  localSpeaking?: boolean;
  latestEliminationEvent?: EliminationEvent | null;
  remotePlayers?: RemotePlayerPublic[];
  stasisPods?: StasisPodState[];
  remoteMoveBufferRef?: React.MutableRefObject<
    Map<
      string,
      {
        x: number;
        y?: number;
        z: number;
        yaw: number;
        animState: CharacterAnimState;
        inVent: boolean;
        activeEmote?: EmoteId | null;
      }
    >
  >;
  onSendMove?: (
    x: number,
    y: number,
    z: number,
    yaw: number,
    animState: CharacterAnimState,
    activeEmote?: EmoteId | null
  ) => void;
  onHudUpdate: (hud: HudLiveState) => void;
  onInteractTerminal: (roomId: RoomId, missionId?: MissionId) => void;
  onInteractBook?: (bookId: TheoryBookId) => void;
  onInteractVent?: (ventId: string) => void;
  onReportStasisPod?: (podId: string) => void;
  onLockedDoorBlocked?: (reason: 'chapter_locked' | 'completed_locked', doorLabel: string) => void;
}

const _camTarget = new THREE.Vector3();
const _desiredCamPos = new THREE.Vector3();
const _rayOrigin = new THREE.Vector3();
const _rayDir = new THREE.Vector3();
const _ray = new THREE.Ray();
const _hitPoint = new THREE.Vector3();
const _losRaycaster = new THREE.Raycaster();
const _losTarget = new THREE.Vector3();
const _tmpColor = new THREE.Color();
const _doneSet = new Set<MissionId>();
const _readBookSet = new Set<TheoryBookId>();
const _hiddenCutsceneObjects = new Set<THREE.Object3D>();
const _sparklePos = new THREE.Vector3();

// Pre-built camera occlusion AABBs for station furniture so camera raycast avoids clipping props
const PROP_CAM_BOXES: THREE.Box3[] = PROP_COLLIDERS.map(
  (p) => new THREE.Box3(new THREE.Vector3(p.minX, 0, p.minZ), new THREE.Vector3(p.maxX, 2.35, p.maxZ))
);

const PROLOG_SPOT_PATH = [
  { x: 0, z: 3.0 },
  { x: -2.4, z: 2.3 },
  { x: -5.4, z: 0.2 },
];

const PROLOG_FOLLOW_PLAYER_PATH = [
  { x: -5.4, z: 0.2 },
  { x: -12.5, z: 0 },
  { x: -22.0, z: 0 },
  { x: -30.0, z: 0 },
  { x: -32.4, z: 2.0 },
  { x: -34.6, z: 3.0 },
  { x: -35.4, z: 3.25 },
];

const PROLOG_FOLLOW_SPARKLE_PATH = [
  { x: -14.5, y: 1.48, z: 0 },
  { x: -22.0, y: 1.42, z: 0 },
  { x: -30.0, y: 1.38, z: 0 },
  { x: -32.8, y: 1.34, z: 2.2 },
  { x: -35.4, y: 1.24, z: 4.95 },
];

function samplePath2D(
  pts: ReadonlyArray<{ x: number; z: number }>,
  t: number
): { x: number; z: number; dx: number; dz: number } {
  if (pts.length === 0) return { x: 0, z: 0, dx: 0, dz: 1 };
  if (pts.length === 1) return { x: pts[0].x, z: pts[0].z, dx: 0, dz: 1 };
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z);
  }
  let targetDist = Math.max(0, Math.min(1, t)) * total;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const segLen = Math.hypot(b.x - a.x, b.z - a.z);
    if (targetDist <= segLen || i === pts.length - 1) {
      const f = segLen > 1e-5 ? Math.max(0, Math.min(1, targetDist / segLen)) : 1;
      return {
        x: a.x + (b.x - a.x) * f,
        z: a.z + (b.z - a.z) * f,
        dx: b.x - a.x,
        dz: b.z - a.z,
      };
    }
    targetDist -= segLen;
  }
  const last = pts[pts.length - 1];
  const prev = pts[pts.length - 2];
  return { x: last.x, z: last.z, dx: last.x - prev.x, dz: last.z - prev.z };
}

function samplePath3D(
  pts: ReadonlyArray<{ x: number; y: number; z: number }>,
  t: number,
  out: THREE.Vector3
) {
  if (pts.length === 0) {
    out.set(0, 1.4, 0);
    return;
  }
  if (pts.length === 1) {
    out.set(pts[0].x, pts[0].y, pts[0].z);
    return;
  }
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y, pts[i].z - pts[i - 1].z);
  }
  let targetDist = Math.max(0, Math.min(1, t)) * total;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const segLen = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
    if (targetDist <= segLen || i === pts.length - 1) {
      const f = segLen > 1e-5 ? Math.max(0, Math.min(1, targetDist / segLen)) : 1;
      out.set(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f, a.z + (b.z - a.z) * f);
      return;
    }
    targetDist -= segLen;
  }
}

function lerpYaw(current: number, target: number, alpha: number): number {
  let diff = target - current;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return current + diff * alpha;
}

function buildStasisPodMesh(colorHex: number): THREE.Group {
  const g = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.68, 0.78, 0.2, 16),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.25 })
  );
  base.position.y = 0.1;
  g.add(base);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.66, 0.04, 8, 24),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 1.2 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.22;
  g.add(ring);

  const capsule = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.55, 1.35, 16),
    new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x0369a1,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.36,
      roughness: 0.1,
      depthWrite: false,
    })
  );
  capsule.position.y = 0.9;
  g.add(capsule);

  const innerBody = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.28, 0.52, 6, 12),
    new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.45 })
  );
  innerBody.position.y = 0.82;
  g.add(innerBody);

  const beacon = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.18, 0),
    new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xe11d48, emissiveIntensity: 1.4 })
  );
  beacon.position.y = 1.9;
  g.add(beacon);

  return g;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  character,
  settings,
  completedMissions,
  unlockedChapter,
  completedChaptersCount = 0,
  lockedRooms = [],
  chapterLockedDoorIds = [],
  activeMissionRoomId = null,
  readBooks = [],
  activeTheoryBook = null,
  activeCutscene,
  activeCutsceneLine,
  isPaused,
  joystickInputRef,
  triggerJumpRef,
  activeEmote = null,
  activeEmoteStartedAt = 0,
  onCancelEmote,
  resetCameraTick,
  teleportPos,
  isMultiplayer = false,
  myPlayerId = null,
  myRole = null,
  amAlive = true,
  inVent = false,
  localSpeaking = false,
  latestEliminationEvent = null,
  remotePlayers = [],
  stasisPods = [],
  remoteMoveBufferRef,
  onSendMove,
  onHudUpdate,
  onInteractTerminal,
  onInteractBook,
  onInteractVent,
  onReportStasisPod,
  onLockedDoorBlocked,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglError, setWebglError] = useState(false);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const completedMissionsRef = useRef(completedMissions);
  completedMissionsRef.current = completedMissions;
  const unlockedChapterRef = useRef(unlockedChapter);
  unlockedChapterRef.current = unlockedChapter;
  const completedChaptersCountRef = useRef(completedChaptersCount);
  completedChaptersCountRef.current = completedChaptersCount;
  const activeMissionRoomIdRef = useRef(activeMissionRoomId);
  activeMissionRoomIdRef.current = activeMissionRoomId;
  const readBooksRef = useRef(readBooks);
  readBooksRef.current = readBooks;
  const activeTheoryBookRef = useRef(activeTheoryBook);
  activeTheoryBookRef.current = activeTheoryBook;

  const activeEmoteRef = useRef<EmoteId | null>(activeEmote);
  activeEmoteRef.current = activeEmote;
  const activeEmoteStartedAtRef = useRef(activeEmoteStartedAt);
  activeEmoteStartedAtRef.current = activeEmoteStartedAt;
  const onCancelEmoteRef = useRef(onCancelEmote);
  onCancelEmoteRef.current = onCancelEmote;

  const completedLockedRoomsRef = useRef<RoomId[]>(lockedRooms);
  completedLockedRoomsRef.current = lockedRooms;
  const completedLockedRoomSetRef = useRef<Set<RoomId>>(new Set(lockedRooms));
  const chapterLockedDoorIdsRef = useRef<string[]>(chapterLockedDoorIds);
  chapterLockedDoorIdsRef.current = chapterLockedDoorIds;
  const chapterLockedDoorSetRef = useRef<Set<string>>(new Set(chapterLockedDoorIds));
  const completedDoorIdSetRef = useRef<Set<string>>(new Set());
  const lockedDoorCollidersRef = useRef<PropCollider[]>([]);

  useEffect(() => {
    lockedDoorCollidersRef.current = getLockedDoorColliders(lockedRooms, chapterLockedDoorIds);
    completedLockedRoomSetRef.current = new Set(lockedRooms);
    const compDoors = new Set<string>();
    lockedRooms.forEach((rid) => {
      const rm = ROOMS[rid];
      if (rm && !rm.neverLock && rm.doorId) compDoors.add(rm.doorId);
    });
    completedDoorIdSetRef.current = compDoors;
    chapterLockedDoorSetRef.current = new Set(chapterLockedDoorIds);
  }, [lockedRooms, chapterLockedDoorIds]);

  const activeCutsceneRef = useRef(activeCutscene);
  activeCutsceneRef.current = activeCutscene;
  const activeCutsceneLineRef = useRef(activeCutsceneLine);
  activeCutsceneLineRef.current = activeCutsceneLine;
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;
  const isMultiplayerRef = useRef(isMultiplayer);
  isMultiplayerRef.current = isMultiplayer;
  const myRoleRef = useRef(myRole);
  myRoleRef.current = myRole;
  const amAliveRef = useRef(amAlive);
  amAliveRef.current = amAlive;
  const inVentRef = useRef(inVent);
  inVentRef.current = inVent;
  const characterRef = useRef(character);
  characterRef.current = character;

  const onHudUpdateRef = useRef(onHudUpdate);
  onHudUpdateRef.current = onHudUpdate;
  const onInteractRef = useRef(onInteractTerminal);
  onInteractRef.current = onInteractTerminal;
  const onInteractBookRef = useRef(onInteractBook);
  onInteractBookRef.current = onInteractBook;
  const onInteractVentRef = useRef(onInteractVent);
  onInteractVentRef.current = onInteractVent;
  const onReportPodRef = useRef(onReportStasisPod);
  onReportPodRef.current = onReportStasisPod;
  const onSendMoveRef = useRef(onSendMove);
  onSendMoveRef.current = onSendMove;
  const onLockedDoorBlockedRef = useRef(onLockedDoorBlocked);
  onLockedDoorBlockedRef.current = onLockedDoorBlocked;

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null);
  const isSoftwareGlRef = useRef(false);
  const playerRigRef = useRef<CharacterRig | null>(null);
  const playerPosRef = useRef(new THREE.Vector3(0, 0, 3.2));
  const playerVelYRef = useRef(0);
  const isGroundedRef = useRef(true);
  const lastSafePosRef = useRef({ x: 0, z: 3.2 });
  const playerYawRef = useRef(Math.PI);
  const camYawRef = useRef(0);
  const camPitchRef = useRef(0.42);
  const camDistRef = useRef(6.8);
  const worldRef = useRef<StationWorld | null>(null);
  const npcRigsRef = useRef<Array<{ id: NpcCharacterId; rig: CharacterRig; targetPos: THREE.Vector3 }>>([]);
  const cutsceneTimeRef = useRef(0);
  const sparkleGuideRef = useRef<SparkleGuideController | null>(null);
  const prologLineKeyRef = useRef('');
  const prologLineElapsedRef = useRef(0);
  const prevActiveCutsceneRef = useRef<CutsceneCharacterId | null>(null);
  const interactAnimUntilRef = useRef(0);
  const ventOutAnimUntilRef = useRef(0);

  const nearbyTerminalRef = useRef<HudLiveState['nearbyTerminal']>(null);
  const nearbyBookRef = useRef<HudLiveState['nearbyBook']>(null);
  const nearbyTermDistRef = useRef(Infinity);
  const nearbyBookDistRef = useRef(Infinity);
  const nearbyVentRef = useRef<HudLiveState['nearbyVent']>(null);
  const nearbyPodRef = useRef<HudLiveState['nearbyStasisPod']>(null);

  const localSpeakingRef = useRef(localSpeaking);
  localSpeakingRef.current = localSpeaking;
  const myPlayerIdRef = useRef(myPlayerId);
  myPlayerIdRef.current = myPlayerId;

  // Remote Multiplayer Rigs Map
  const remoteRigMapRef = useRef<
    Map<
      string,
      {
        rig: CharacterRig;
        voiceRing: THREE.Mesh;
        x: number;
        y: number;
        z: number;
        yaw: number;
        animState: CharacterAnimState;
        activeEmote: EmoteId | null;
        emoteStartedAt: number;
        alive: boolean;
        inVent: boolean;
        speaking: boolean;
        name: string;
        roleSig: string;
      }
    >
  >(new Map());
  const remotePlayersRef = useRef(remotePlayers);
  remotePlayersRef.current = remotePlayers;

  const localVoiceRingRef = useRef<THREE.Mesh | null>(null);
  const stasisPodMapRef = useRef<Map<string, THREE.Group>>(new Map());
  const stasisPodsRef = useRef(stasisPods);
  stasisPodsRef.current = stasisPods;

  const playedElimIdsRef = useRef<Set<string>>(new Set());
  const eliminationEffectsRef = useRef<
    Array<{
      group: THREE.Group;
      ring: THREE.Mesh;
      ringMat: THREE.MeshBasicMaterial;
      beam: THREE.Mesh;
      beamMat: THREE.MeshBasicMaterial;
      shards: THREE.Points;
      shardsMat: THREE.PointsMaterial;
      age: number;
      duration: number;
    }>
  >([]);

  // Apply adaptive graphics quality (low / medium / high) dynamically without re-creating scene
  useEffect(() => {
    const renderer = rendererRef.current;
    const keyLight = keyLightRef.current;
    const world = worldRef.current;
    if (!renderer || !keyLight || !world) return;
    const isSw = isSoftwareGlRef.current;
    const q = settings.graphicsQuality || 'medium';

    if (q === 'low') {
      renderer.setPixelRatio(1);
      renderer.shadowMap.enabled = false;
      keyLight.castShadow = false;
      world.starPoints.count = Math.min(world.maxStars, 180);
    } else if (q === 'medium') {
      renderer.setPixelRatio(isSw ? 1 : Math.min(window.devicePixelRatio, 1.5));
      renderer.shadowMap.enabled = !isSw;
      keyLight.castShadow = !isSw;
      world.starPoints.count = Math.min(world.maxStars, 360);
    } else {
      renderer.setPixelRatio(isSw ? 1 : Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = !isSw;
      keyLight.castShadow = !isSw;
      world.starPoints.count = world.maxStars;
    }
    renderer.shadowMap.needsUpdate = true;
  }, [settings.graphicsQuality]);

  // Reset camera when signal ticks
  useEffect(() => {
    if (resetCameraTick > 0) {
      camYawRef.current = playerYawRef.current - Math.PI;
      camPitchRef.current = 0.42;
      camDistRef.current = 6.8;
    }
  }, [resetCameraTick]);

  // Reposition player (e.g. Vent exit, Meeting spawn, MP Central Lobby spawn, Play Again)
  useEffect(() => {
    if (teleportPos) {
      playerPosRef.current.set(teleportPos.x, 0, teleportPos.z);
      playerVelYRef.current = 0;
      isGroundedRef.current = true;
      if (isPointWalkable(teleportPos.x, teleportPos.z, 0.48)) {
        lastSafePosRef.current = { x: teleportPos.x, z: teleportPos.z };
      }
      if (typeof teleportPos.yaw === 'number') {
        playerYawRef.current = teleportPos.yaw;
        camYawRef.current = teleportPos.yaw - Math.PI;
        camPitchRef.current = 0.42;
      }
      if (!teleportPos.skipAnim) {
        ventOutAnimUntilRef.current = performance.now() + 550;
      }
      if (Math.hypot(teleportPos.x - -35.4, teleportPos.z - 3.25) < 0.25) {
        playerYawRef.current = 0;
        camYawRef.current = Math.PI * 0.9;
        camPitchRef.current = 0.42;
      }
    }
  }, [teleportPos]);

  // Rebuild local player rig when customization / ghost status changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (playerRigRef.current) {
      scene.remove(playerRigRef.current.root);
    }
    const newRig = buildAstronautRig(character, {
      ghostMode: isMultiplayer && !amAlive,
      showNameplate: isMultiplayer,
      nameplateSubtitle: isMultiplayer && !amAlive ? 'Spectator' : undefined,
    });
    const voiceRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.42, 0.035, 6, 24),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 })
    );
    voiceRing.rotation.x = Math.PI / 2;
    voiceRing.position.y = 2.15;
    voiceRing.visible = false;
    newRig.root.add(voiceRing);
    localVoiceRingRef.current = voiceRing;

    newRig.root.position.copy(playerPosRef.current);
    newRig.root.rotation.y = playerYawRef.current;
    playerRigRef.current = newRig;
    scene.add(newRig.root);
  }, [character, isMultiplayer, amAlive]);

  // Sync remote multiplayer players into 3D scene
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const map = remoteRigMapRef.current;

    if (!isMultiplayer) {
      map.forEach((entry) => scene.remove(entry.rig.root));
      map.clear();
      return;
    }

    const activeIds = new Set<string>();
    remotePlayers.forEach((rp) => {
      if (rp.id === myPlayerId) return;
      activeIds.add(rp.id);
      const roleSig = `${rp.character.color}|${rp.character.helmet}|${rp.character.costume}|${rp.character.head}|${rp.character.body}|${rp.character.neck}|${rp.alive}`;
      const isSpeaking = Boolean(rp.voice?.micOn && !rp.voice?.muted && rp.voice?.speaking);
      const existing = map.get(rp.id);
      if (!existing || existing.roleSig !== roleSig) {
        if (existing) scene.remove(existing.rig.root);
        const rig = buildAstronautRig(rp.character, {
          showNameplate: true,
          ghostMode: !rp.alive,
          nameplateSubtitle: !rp.alive ? 'Stasis Ghost' : undefined,
        });
        const voiceRing = new THREE.Mesh(
          new THREE.TorusGeometry(0.42, 0.035, 6, 24),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 })
        );
        voiceRing.rotation.x = Math.PI / 2;
        voiceRing.position.y = 2.15;
        voiceRing.visible = isSpeaking;
        rig.root.add(voiceRing);

        rig.root.position.set(rp.x, rp.y ?? 0, rp.z);
        rig.root.rotation.y = rp.yaw;
        scene.add(rig.root);
        map.set(rp.id, {
          rig,
          voiceRing,
          x: rp.x,
          y: rp.y ?? 0,
          z: rp.z,
          yaw: rp.yaw,
          animState: rp.animState,
          activeEmote: rp.activeEmote ?? null,
          emoteStartedAt: rp.activeEmote ? performance.now() : 0,
          alive: rp.alive,
          inVent: rp.inVent,
          speaking: isSpeaking,
          name: rp.name,
          roleSig,
        });
      } else {
        existing.alive = rp.alive;
        existing.inVent = rp.inVent;
        existing.speaking = isSpeaking;
        existing.voiceRing.visible = isSpeaking;
        existing.name = rp.name;
        if (!remoteMoveBufferRef?.current.has(rp.id)) {
          existing.x = rp.x;
          existing.y = rp.y ?? 0;
          existing.z = rp.z;
          existing.yaw = rp.yaw;
          existing.animState = rp.animState;
          if (rp.activeEmote !== undefined && rp.activeEmote !== existing.activeEmote) {
            existing.activeEmote = rp.activeEmote;
            existing.emoteStartedAt = rp.activeEmote ? performance.now() : 0;
          }
        }
      }
    });

    Array.from(map.keys()).forEach((id) => {
      if (!activeIds.has(id)) {
        const entry = map.get(id);
        if (entry) scene.remove(entry.rig.root);
        map.delete(id);
      }
    });
  }, [isMultiplayer, remotePlayers, myPlayerId, remoteMoveBufferRef]);

  // Spawn non-graphic futuristic hologram stasis VFX once per deduplicated EliminationEvent
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !latestEliminationEvent) return;
    if (playedElimIdsRef.current.has(latestEliminationEvent.eventId)) return;
    playedElimIdsRef.current.add(latestEliminationEvent.eventId);

    soundEngine.playEliminate();
    if (latestEliminationEvent.impostorId === myPlayerIdRef.current) {
      interactAnimUntilRef.current = performance.now() + 450;
    }

    const colNum =
      PLAYER_COLORS.find((c) => c.id === latestEliminationEvent.victimColor)?.num ?? 0x38bdf8;
    const group = new THREE.Group();
    group.position.set(latestEliminationEvent.x, 0.04, latestEliminationEvent.z);

    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.62, 28), ringMat);
    ring.rotation.x = -Math.PI / 2;
    group.add(ring);

    const beamMat = new THREE.MeshBasicMaterial({
      color: colNum,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.62, 3.1, 20, 1, true), beamMat);
    beam.position.y = 1.55;
    group.add(beam);

    const count = 24;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2;
      const r = 0.25 + (i % 3) * 0.22;
      positions[i * 3] = Math.cos(ang) * r;
      positions[i * 3 + 1] = 0.2 + (i % 5) * 0.28;
      positions[i * 3 + 2] = Math.sin(ang) * r;
    }
    const shardGeo = new THREE.BufferGeometry();
    shardGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const shardsMat = new THREE.PointsMaterial({
      color: 0xf43f5e,
      size: 0.14,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });
    const shards = new THREE.Points(shardGeo, shardsMat);
    group.add(shards);

    scene.add(group);
    eliminationEffectsRef.current.push({
      group,
      ring,
      ringMat,
      beam,
      beamMat,
      shards,
      shardsMat,
      age: 0,
      duration: 1.45,
    });
  }, [latestEliminationEvent]);

  // Sync Stasis Pods in 3D scene
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const map = stasisPodMapRef.current;

    const activeIds = new Set<string>();
    stasisPods.forEach((pod) => {
      activeIds.add(pod.id);
      if (!map.has(pod.id)) {
        const col = PLAYER_COLORS.find((c) => c.id === pod.victimColor) || PLAYER_COLORS[1];
        const mesh = buildStasisPodMesh(col.num);
        mesh.position.set(pod.x, 0, pod.z);
        scene.add(mesh);
        map.set(pod.id, mesh);
      }
    });

    Array.from(map.keys()).forEach((id) => {
      if (!activeIds.has(id)) {
        const mesh = map.get(id);
        if (mesh) scene.remove(mesh);
        map.delete(id);
      }
    });
  }, [stasisPods]);

  // Manage NPC spawning & unobstructed staging strictly during active cutscenes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const prevCs = prevActiveCutsceneRef.current;
    prevActiveCutsceneRef.current = activeCutscene;

    npcRigsRef.current.forEach((n) => scene.remove(n.rig.root));
    npcRigsRef.current = [];
    cutsceneTimeRef.current = 0;
    prologLineKeyRef.current = '';
    prologLineElapsedRef.current = 0;

    if (!activeCutscene) {
      if (sparkleGuideRef.current) {
        sparkleGuideRef.current.update(_sparklePos, 0, 0);
      }
      if (prevCs === 'prolog') {
        playerPosRef.current.set(-35.4, 0, 3.25);
        lastSafePosRef.current = { x: -35.4, z: 3.25 };
        playerYawRef.current = 0;
        camYawRef.current = Math.PI * 0.9;
        camPitchRef.current = 0.42;
        camDistRef.current = 6.2;
      }
      return;
    }

    if (activeCutscene === 'prolog') {
      const initPhase = activeCutsceneLineRef.current?.scenePhase;
      if (initPhase === 'sparkle_follow') {
        playerPosRef.current.set(-5.4, 0, 0.2);
        playerYawRef.current = -Math.PI / 2;
      } else if (initPhase === 'sparkle_book') {
        playerPosRef.current.set(-34.6, 0, 3.0);
        playerYawRef.current = -0.35;
      } else {
        playerPosRef.current.set(0, 0, 3.0);
        playerYawRef.current = Math.PI;
      }
      if (worldRef.current) {
        worldRef.current.shuttleGroup.position.set(0, 6.5, 42);
      }
    } else if (activeCutscene === 'rex') {
      // Unobstructed south aisle of Navigation Room (clear of holo table & terminals)
      playerPosRef.current.set(-33.0, 0, 2.35);
      playerYawRef.current = -Math.PI / 2;
      const rex = buildNpcAstronaut('rex');
      rex.root.position.set(-38.5, 0, 2.35);
      scene.add(rex.root);
      npcRigsRef.current.push({
        id: 'rex',
        rig: rex,
        targetPos: new THREE.Vector3(-35.4, 0, 2.35),
      });
    } else if (activeCutscene === 'bima') {
      // Unobstructed north aisle of Global Exchange Room
      playerPosRef.current.set(33.0, 0, -2.35);
      playerYawRef.current = Math.PI / 2;
      const bima = buildNpcAstronaut('bima');
      bima.root.position.set(38.5, 0, -2.35);
      scene.add(bima.root);
      npcRigsRef.current.push({
        id: 'bima',
        rig: bima,
        targetPos: new THREE.Vector3(35.4, 0, -2.35),
      });
    } else if (activeCutscene === 'fuzzy') {
      // Unobstructed center plaza of Communication Room
      playerPosRef.current.set(-17.4, 0, -13.0);
      playerYawRef.current = Math.PI * 0.85;
      const fuzzy = buildNpcAstronaut('fuzzy');
      fuzzy.root.position.set(-19.5, 0, -16.2);
      scene.add(fuzzy.root);
      npcRigsRef.current.push({
        id: 'fuzzy',
        rig: fuzzy,
        targetPos: new THREE.Vector3(-18.6, 0, -14.8),
      });
    } else if (activeCutscene === 'bob') {
      // Unobstructed east aisle of World Economy Room
      playerPosRef.current.set(-15.4, 0, -33.6);
      playerYawRef.current = Math.PI;
      const bob = buildNpcAstronaut('bob');
      bob.root.position.set(-16.4, 0, -38.4);
      scene.add(bob.root);
      npcRigsRef.current.push({
        id: 'bob',
        rig: bob,
        targetPos: new THREE.Vector3(-15.8, 0, -36.0),
      });
    } else if (activeCutscene === 'ratu_laras') {
      // Unobstructed panoramic north deck of Earth Observation Room
      playerPosRef.current.set(1.8, 0, -58.4);
      playerYawRef.current = -Math.PI * 0.55;
      const laras = buildNpcAstronaut('ratu_laras');
      laras.root.position.set(-3.0, 0, -59.8);
      scene.add(laras.root);
      npcRigsRef.current.push({
        id: 'ratu_laras',
        rig: laras,
        targetPos: new THREE.Vector3(-1.6, 0, -58.6),
      });
    } else if (activeCutscene === 'all_final') {
      // 5 Mentors semicircle on Earth Observation Room open north deck facing player
      playerPosRef.current.set(0, 0, -57.6);
      playerYawRef.current = Math.PI;
      const rex = buildNpcAstronaut('rex');
      const fuzzy = buildNpcAstronaut('fuzzy');
      const bima = buildNpcAstronaut('bima');
      const bob = buildNpcAstronaut('bob');
      const laras = buildNpcAstronaut('ratu_laras');
      rex.root.position.set(-3.8, 0, -58.8);
      fuzzy.root.position.set(-2.0, 0, -59.8);
      bima.root.position.set(0, 0, -60.2);
      bob.root.position.set(2.0, 0, -59.8);
      laras.root.position.set(3.8, 0, -58.8);
      scene.add(rex.root, fuzzy.root, bima.root, bob.root, laras.root);
      npcRigsRef.current.push(
        { id: 'rex', rig: rex, targetPos: new THREE.Vector3(-3.2, 0, -58.4) },
        { id: 'fuzzy', rig: fuzzy, targetPos: new THREE.Vector3(-1.6, 0, -59.2) },
        { id: 'bima', rig: bima, targetPos: new THREE.Vector3(0, 0, -59.5) },
        { id: 'bob', rig: bob, targetPos: new THREE.Vector3(1.6, 0, -59.2) },
        { id: 'ratu_laras', rig: laras, targetPos: new THREE.Vector3(3.2, 0, -58.4) }
      );
    }
  }, [activeCutscene]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();
    isSoftwareGlRef.current = isSoftwareGl;
    const initQuality = settingsRef.current.graphicsQuality || 'medium';
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
      rendererRef.current = renderer;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
      const initPr =
        isSoftwareGl || initQuality === 'low'
          ? 1
          : initQuality === 'medium'
            ? Math.min(window.devicePixelRatio, 1.5)
            : Math.min(window.devicePixelRatio, 2);
      renderer.setPixelRatio(initPr);
      renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
      renderer.shadowMap.enabled = !isSoftwareGl && initQuality !== 'low';
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(renderer.domElement);
    } catch {
      setWebglError(true);
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040713);
    scene.fog = new THREE.FogExp2(0x040713, 0.0082);
    sceneRef.current = scene;

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(
      58,
      (container.clientWidth || window.innerWidth) / (container.clientHeight || window.innerHeight),
      0.15,
      360
    );

    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x0f172a, 0.82);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.38);
    keyLightRef.current = keyLight;
    keyLight.position.set(18, 28, 16);
    if (!isSoftwareGl) {
      keyLight.castShadow = initQuality !== 'low';
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.left = -28;
      keyLight.shadow.camera.right = 28;
      keyLight.shadow.camera.top = 28;
      keyLight.shadow.camera.bottom = -28;
      keyLight.shadow.bias = -0.0005;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.7);
    rimLight.position.set(-20, 14, -22);
    scene.add(rimLight);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const world = buildStationWorld(scene, maxAniso, isSoftwareGl);
    world.starPoints.count =
      initQuality === 'low'
        ? Math.min(world.maxStars, 180)
        : initQuality === 'medium'
          ? Math.min(world.maxStars, 360)
          : world.maxStars;
    worldRef.current = world;

    const playerRig = buildAstronautRig(characterRef.current, {
      ghostMode: isMultiplayerRef.current && !amAliveRef.current,
      showNameplate: isMultiplayerRef.current,
    });
    playerRig.root.position.copy(playerPosRef.current);
    playerRig.root.rotation.y = playerYawRef.current;
    playerRigRef.current = playerRig;
    scene.add(playerRig.root);

    const sparkleGuide = createSparkleGuide();
    sparkleGuideRef.current = sparkleGuide;
    scene.add(sparkleGuide.group);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const triggerJump = () => {
      if (isPausedRef.current || activeCutsceneRef.current || inVentRef.current) return;
      if (isGroundedRef.current && playerPosRef.current.y <= 0.04) {
        playerVelYRef.current = 8.4;
        isGroundedRef.current = false;
        soundEngine.playJump();
        if (activeEmoteRef.current) onCancelEmoteRef.current?.();
      }
    };
    if (triggerJumpRef) {
      triggerJumpRef.current = triggerJump;
    }

    const keys: Record<string, boolean> = {};
    const onKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement | null)?.tagName;
      const isTyping = targetTag === 'INPUT' || targetTag === 'TEXTAREA' || targetTag === 'SELECT';
      keys[e.code] = true;
      if (e.code === 'Space' && !isTyping && !isPausedRef.current && !activeCutsceneRef.current) {
        e.preventDefault();
        triggerJump();
        return;
      }
      if (e.code === 'KeyE' && !isTyping && !isPausedRef.current && !activeCutsceneRef.current) {
        if (activeEmoteRef.current) onCancelEmoteRef.current?.();
        if (nearbyPodRef.current && amAliveRef.current && onReportPodRef.current) {
          soundEngine.playInteract();
          onReportPodRef.current(nearbyPodRef.current.id);
          return;
        }
        if (nearbyVentRef.current && onInteractVentRef.current && amAliveRef.current) {
          soundEngine.playInteract();
          interactAnimUntilRef.current = performance.now() + 450;
          onInteractVentRef.current(nearbyVentRef.current.id);
          return;
        }
        const hasTerm = Boolean(nearbyTerminalRef.current);
        const hasBook = Boolean(nearbyBookRef.current && onInteractBookRef.current);
        if (hasBook && (!hasTerm || nearbyBookDistRef.current <= nearbyTermDistRef.current)) {
          soundEngine.playInteract();
          interactAnimUntilRef.current = performance.now() + 450;
          onInteractBookRef.current!(nearbyBookRef.current!.id);
          return;
        }
        if (hasTerm) {
          soundEngine.playInteract();
          interactAnimUntilRef.current = performance.now() + 550;
          onInteractRef.current(
            nearbyTerminalRef.current!.roomId,
            nearbyTerminalRef.current!.missionId
          );
        }
      }
      if (e.code === 'KeyR' && !isTyping && !isPausedRef.current && !activeCutsceneRef.current) {
        camYawRef.current = playerYawRef.current - Math.PI;
        camPitchRef.current = 0.42;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };

    // Unified PointerEvent 360° camera drag + multi-touch support (never conflicts with left joystick!)
    const dom = renderer.domElement;
    dom.style.touchAction = 'none';
    const activePointers = new Map<number, { x: number; y: number }>();
    let prevPinchDist: number | null = null;

    const onContextMenu = (e: MouseEvent) => e.preventDefault();
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 2) return;
      try {
        dom.setPointerCapture(e.pointerId);
      } catch {
        // ignore synthetic event capture failures
      }
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (activePointers.size === 2) {
        const pts = Array.from(activePointers.values());
        prevPinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      }
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!activePointers.has(e.pointerId) || activeCutsceneRef.current || isPausedRef.current) return;
      const prev = activePointers.get(e.pointerId)!;
      if (activePointers.size === 1) {
        const dx = e.clientX - prev.x;
        const dy = e.clientY - prev.y;
        const baseSens = e.pointerType === 'touch' ? 0.0062 : 0.0052;
        const sens = baseSens * settingsRef.current.cameraSensitivity;
        camYawRef.current -= dx * sens;
        camPitchRef.current = THREE.MathUtils.clamp(camPitchRef.current + dy * sens, 0.16, 1.15);
        activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      } else if (activePointers.size >= 2) {
        activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const pts = Array.from(activePointers.values());
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (prevPinchDist !== null) {
          const deltaDist = prevPinchDist - dist;
          camDistRef.current = THREE.MathUtils.clamp(camDistRef.current + deltaDist * 0.025, 4.0, 12.5);
        }
        prevPinchDist = dist;
      }
    };
    const onPointerUp = (e: PointerEvent) => {
      activePointers.delete(e.pointerId);
      if (activePointers.size < 2) prevPinchDist = null;
    };
    const onWheel = (e: WheelEvent) => {
      if (activeCutsceneRef.current || isPausedRef.current) return;
      e.preventDefault();
      camDistRef.current = THREE.MathUtils.clamp(camDistRef.current + e.deltaY * 0.005, 4.0, 12.5);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    dom.addEventListener('contextmenu', onContextMenu);
    dom.addEventListener('pointerdown', onPointerDown);
    dom.addEventListener('pointermove', onPointerMove);
    dom.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('pointercancel', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    const onResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    camera.position.set(0, 4.5, 9.5);
    camera.lookAt(0, 1.3, 3.2);

    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;
    let lastHudEmit = 0;
    let lastMoveEmit = 0;
    let lastSentAnim: CharacterAnimState = 'idle';
    let lastSentEmote: EmoteId | null = null;
    let lastSentGrounded = true;
    const doorOpenSoundCooldown = new Map<string, number>();
    const blockedDoorNoticeCooldown = new Map<string, number>();

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      if (!sync) {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const tick = () => {
      if (disposed) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();
      const nowMs = performance.now();

      const pPos = playerPosRef.current;
      const cs = activeCutsceneRef.current;
      const csLine = activeCutsceneLineRef.current;
      let animState: CharacterAnimState = 'idle';

      // Restore any furniture hidden during previous cutscene frame
      if (_hiddenCutsceneObjects.size > 0) {
        _hiddenCutsceneObjects.forEach((obj) => {
          obj.visible = true;
        });
        _hiddenCutsceneObjects.clear();
      }

      // 1. Local Player Movement, Sprint & Blocked-Door Notification
      const lockedBoxes = isMultiplayerRef.current ? undefined : lockedDoorCollidersRef.current;
      if (!isPausedRef.current && !cs && !inVentRef.current) {
        let inputX = 0;
        let inputZ = 0;
        if (keys['KeyW'] || keys['ArrowUp']) inputZ -= 1;
        if (keys['KeyS'] || keys['ArrowDown']) inputZ += 1;
        if (keys['KeyA'] || keys['ArrowLeft']) inputX -= 1;
        if (keys['KeyD'] || keys['ArrowRight']) inputX += 1;

        const joy = joystickInputRef.current;
        if (Math.abs(joy.x) > 0.08 || Math.abs(joy.y) > 0.08) {
          inputX += joy.x;
          inputZ += joy.y;
        }

        const len = Math.hypot(inputX, inputZ);
        if (len > 0.05) {
          if (activeEmoteRef.current && len > 0.08) {
            onCancelEmoteRef.current?.();
          }
          const isSprinting = Boolean(keys['ShiftLeft'] || keys['ShiftRight']) || len > 0.96;
          animState = isSprinting ? 'run' : 'walk';
          const nx = inputX / Math.max(1, len);
          const nz = inputZ / Math.max(1, len);

          const yaw = camYawRef.current;
          const forwardX = -Math.sin(yaw);
          const forwardZ = -Math.cos(yaw);
          const rightX = Math.cos(yaw);
          const rightZ = -Math.sin(yaw);

          const moveDirX = rightX * nx + forwardX * -nz;
          const moveDirZ = rightZ * nx + forwardZ * -nz;
          const baseSpeed = isSprinting ? 8.6 : 6.1;
          const speed = baseSpeed * settingsRef.current.moveSensitivity;

          const stepX = moveDirX * speed * dt;
          const stepZ = moveDirZ * speed * dt;

          const attemptX = pPos.x + stepX;
          const attemptZ = pPos.z + stepZ;

          // Continuous substepped circle-vs-AABB sliding collision against walls, pillars, locked doors & furniture
          const resolved = resolvePlayerMovement(
            pPos.x,
            pPos.z,
            attemptX,
            attemptZ,
            0.48,
            lockedBoxes
          );
          pPos.x = resolved.x;
          pPos.z = resolved.z;

          if (!isMultiplayerRef.current && onLockedDoorBlockedRef.current) {
            const blockedAttempt = detectBlockedDoorAttempt(
              attemptX,
              attemptZ,
              0.48,
              completedLockedRoomsRef.current,
              chapterLockedDoorIdsRef.current
            );
            if (blockedAttempt) {
              const lastWarn = blockedDoorNoticeCooldown.get(blockedAttempt.doorId) || 0;
              if (elapsed - lastWarn > 2.2) {
                blockedDoorNoticeCooldown.set(blockedAttempt.doorId, elapsed);
                soundEngine.playError();
                onLockedDoorBlockedRef.current(blockedAttempt.reason, blockedAttempt.doorLabel);
              }
            }
          }

          const targetYaw = Math.atan2(moveDirX, moveDirZ);
          let diff = targetYaw - playerYawRef.current;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          playerYawRef.current += diff * (1 - Math.exp(-12 * dt));

          if (amAliveRef.current && isGroundedRef.current && pPos.y <= 0.04) {
            soundEngine.playFootstep(isSprinting);
          }
        }
      }

      // Vertical Jump & Gravity Physics + Horizontal Anti-Clip Failsafe
      if (!cs) {
        if (!isPausedRef.current && !inVentRef.current) {
          let vy = playerVelYRef.current;
          if (!isGroundedRef.current || pPos.y > 0 || vy > 0) {
            vy -= 24.0 * dt;
            pPos.y += vy * dt;
            if (pPos.y >= 2.1) {
              pPos.y = 2.1;
              if (vy > 0) vy = 0;
            }
            if (pPos.y <= 0) {
              pPos.y = 0;
              vy = 0;
              isGroundedRef.current = true;
            }
            playerVelYRef.current = vy;
          }
        }
        if (isPointWalkable(pPos.x, pPos.z, 0.46, lockedBoxes)) {
          lastSafePosRef.current.x = pPos.x;
          lastSafePosRef.current.z = pPos.z;
        } else {
          pPos.x = lastSafePosRef.current.x;
          pPos.z = lastSafePosRef.current.z;
        }
      } else {
        pPos.y = 0;
        playerVelYRef.current = 0;
        isGroundedRef.current = true;
      }

      if (inVentRef.current) {
        animState = 'vent_in';
      } else if (nowMs < ventOutAnimUntilRef.current) {
        animState = 'vent_out';
      } else if (!isGroundedRef.current || pPos.y > 0.04) {
        animState = 'jump';
      } else if (nowMs < interactAnimUntilRef.current && animState === 'idle') {
        animState = 'interact';
      }

      // 2.5. Prolog Cutscene Choreography (Global Network -> Sparkle Spot -> Follow -> First Book)
      let overrideCutsceneGesture: CutsceneLine['gesture'] | undefined =
        cs && csLine?.speakerId === 'player' ? csLine.gesture : undefined;
      let sparkleIntensity = 0;
      const prologPhase = cs === 'prolog' ? csLine?.scenePhase : undefined;

      if (cs === 'prolog') {
        const lineKey = `${cs}:${csLine?.scenePhase || csLine?.cameraFocus || 'story'}`;
        if (prologLineKeyRef.current !== lineKey) {
          prologLineKeyRef.current = lineKey;
          prologLineElapsedRef.current = 0;
        } else {
          prologLineElapsedRef.current += dt;
        }
        const phaseT = prologLineElapsedRef.current;

        if (prologPhase === 'sparkle_spot') {
          const walkDur = 1.7;
          if (phaseT < walkDur) {
            const u = THREE.MathUtils.smoothstep(phaseT / walkDur, 0, 1);
            const sample = samplePath2D(PROLOG_SPOT_PATH, u);
            pPos.x = sample.x;
            pPos.z = sample.z;
            playerYawRef.current = lerpYaw(
              playerYawRef.current,
              Math.atan2(sample.dx, sample.dz),
              1 - Math.exp(-10 * dt)
            );
            animState = 'walk';
            overrideCutsceneGesture = undefined;
          } else {
            pPos.x = THREE.MathUtils.lerp(pPos.x, -5.4, 1 - Math.exp(-10 * dt));
            pPos.z = THREE.MathUtils.lerp(pPos.z, 0.2, 1 - Math.exp(-10 * dt));
            playerYawRef.current = lerpYaw(
              playerYawRef.current,
              -Math.PI / 2,
              1 - Math.exp(-8 * dt)
            );
            animState = 'idle';
            overrideCutsceneGesture = 'scratch_head';
          }
          _sparklePos.set(
            -14.5 + Math.sin(elapsed * 1.3) * 0.16,
            1.48,
            Math.cos(elapsed * 1.7) * 0.22
          );
          sparkleIntensity = THREE.MathUtils.clamp(phaseT / 0.45, 0.25, 1.0);
        } else if (prologPhase === 'sparkle_follow') {
          const playerWalkDur = 5.0;
          const sparkleTravelDur = 3.6;
          if (phaseT < playerWalkDur) {
            const pu = THREE.MathUtils.smoothstep(phaseT / playerWalkDur, 0, 1);
            const sample = samplePath2D(PROLOG_FOLLOW_PLAYER_PATH, pu);
            pPos.x = sample.x;
            pPos.z = sample.z;
            playerYawRef.current = lerpYaw(
              playerYawRef.current,
              Math.atan2(sample.dx, sample.dz),
              1 - Math.exp(-9 * dt)
            );
            animState = 'walk';
          } else {
            pPos.x = THREE.MathUtils.lerp(pPos.x, -35.4, 1 - Math.exp(-10 * dt));
            pPos.z = THREE.MathUtils.lerp(pPos.z, 3.25, 1 - Math.exp(-10 * dt));
            playerYawRef.current = lerpYaw(playerYawRef.current, 0, 1 - Math.exp(-8 * dt));
            animState = 'idle';
          }

          if (phaseT < sparkleTravelDur) {
            const su = THREE.MathUtils.smoothstep(phaseT / sparkleTravelDur, 0, 1);
            samplePath3D(PROLOG_FOLLOW_SPARKLE_PATH, su, _sparklePos);
            _sparklePos.y += Math.sin(elapsed * 3.5) * 0.08;
            sparkleIntensity = 1.0;
          } else {
            const settleT = phaseT - sparkleTravelDur;
            _sparklePos.set(
              -35.4 + Math.cos(elapsed * 2.1) * 0.22,
              1.22 + Math.sin(elapsed * 2.8) * 0.04,
              4.95 + Math.sin(elapsed * 2.1) * 0.22
            );
            sparkleIntensity = THREE.MathUtils.lerp(1.0, 0.48, Math.min(1, settleT / 1.5));
          }
        } else if (prologPhase === 'sparkle_book') {
          const dx = -35.4 - pPos.x;
          const dz = 3.25 - pPos.z;
          const rem = Math.hypot(dx, dz);
          if (rem > 0.08) {
            const step = Math.min(rem, 5.4 * dt);
            pPos.x += (dx / rem) * step;
            pPos.z += (dz / rem) * step;
            playerYawRef.current = lerpYaw(
              playerYawRef.current,
              Math.atan2(dx, dz),
              1 - Math.exp(-10 * dt)
            );
            animState = 'walk';
            overrideCutsceneGesture = undefined;
          } else {
            pPos.x = -35.4;
            pPos.z = 3.25;
            playerYawRef.current = lerpYaw(playerYawRef.current, 0, 1 - Math.exp(-9 * dt));
            animState = 'idle';
            overrideCutsceneGesture = 'tilt_curious';
          }

          _sparklePos.set(
            -35.4 + Math.cos(elapsed * 1.9) * 0.14,
            1.18 + Math.sin(elapsed * 2.6) * 0.03,
            4.95 + Math.sin(elapsed * 1.9) * 0.14
          );
          sparkleIntensity = Math.max(0, 0.48 * (1 - phaseT / 2.2));
        }
      }

      if (sparkleGuideRef.current) {
        sparkleGuideRef.current.update(_sparklePos, sparkleIntensity, elapsed);
      }

      const curEmote = !cs && animState === 'idle' ? activeEmoteRef.current : null;
      const curEmoteElapsed = curEmote ? Math.max(0, (nowMs - activeEmoteStartedAtRef.current) / 1000) : 0;

      if (playerRigRef.current) {
        playerRigRef.current.root.position.copy(pPos);
        playerRigRef.current.root.rotation.y = playerYawRef.current;
        if (localVoiceRingRef.current) {
          const speakingNow = isMultiplayerRef.current && localSpeakingRef.current;
          localVoiceRingRef.current.visible = speakingNow;
          if (speakingNow) {
            const pulse = 1 + Math.sin(elapsed * 12) * 0.12;
            localVoiceRingRef.current.scale.set(pulse, pulse, 1);
          }
        }
        animateCharacterRig(
          playerRigRef.current,
          elapsed,
          animState,
          dt,
          overrideCutsceneGesture,
          curEmote,
          curEmoteElapsed
        );
      }

      // Update active futuristic Stasis Elimination VFX
      if (eliminationEffectsRef.current.length > 0) {
        for (let i = eliminationEffectsRef.current.length - 1; i >= 0; i--) {
          const fx = eliminationEffectsRef.current[i];
          fx.age += dt;
          const u = Math.min(1, fx.age / fx.duration);
          const s = 1 + u * 3.4;
          fx.ring.scale.set(s, s, 1);
          fx.ringMat.opacity = (1 - u) * 0.9;
          fx.beam.scale.set(1 - u * 0.55, 1 + u * 0.65, 1 - u * 0.55);
          fx.beamMat.opacity = (1 - u) * 0.6;
          fx.shards.position.y = u * 1.9;
          fx.shards.rotation.y += dt * 3.2;
          fx.shardsMat.opacity = 1 - u;
          if (fx.age >= fx.duration) {
            scene.remove(fx.group);
            fx.ring.geometry.dispose();
            fx.ringMat.dispose();
            fx.beam.geometry.dispose();
            fx.beamMat.dispose();
            fx.shards.geometry.dispose();
            fx.shardsMat.dispose();
            eliminationEffectsRef.current.splice(i, 1);
          }
        }
      }

      // Emit throttled multiplayer position update (~15fps, faster when airborne/emote changes)
      if (isMultiplayerRef.current && !cs && !isPausedRef.current && onSendMoveRef.current) {
        const groundedNow = isGroundedRef.current;
        const importantChange =
          (animState !== lastSentAnim && animState === 'idle') ||
          curEmote !== lastSentEmote ||
          groundedNow !== lastSentGrounded;
        const interval = groundedNow ? 0.065 : 0.04;
        if (elapsed - lastMoveEmit > interval || importantChange) {
          lastMoveEmit = elapsed;
          lastSentAnim = animState;
          lastSentEmote = curEmote;
          lastSentGrounded = groundedNow;
          onSendMoveRef.current(pPos.x, pPos.y, pPos.z, playerYawRef.current, animState, curEmote);
        }
      }

      // 2. Smooth Remote Multiplayer Players Interpolation
      if (isMultiplayerRef.current) {
        const buf = remoteMoveBufferRef?.current;
        remoteRigMapRef.current.forEach((entry, pid) => {
          const buffered = buf?.get(pid);
          if (buffered) {
            entry.x = buffered.x;
            entry.y = buffered.y ?? entry.y;
            entry.z = buffered.z;
            entry.yaw = buffered.yaw;
            entry.animState = buffered.animState;
            entry.inVent = buffered.inVent;
            if (buffered.activeEmote !== undefined && buffered.activeEmote !== entry.activeEmote) {
              entry.activeEmote = buffered.activeEmote;
              entry.emoteStartedAt = buffered.activeEmote ? nowMs : 0;
            }
          }
          // Ghost visibility rule: alive players do NOT see ghosts; everyone hides players inside vents
          const visible = !entry.inVent && (entry.alive || !amAliveRef.current);
          entry.rig.root.visible = visible;
          if (visible) {
            const k = 1 - Math.exp(-14 * dt);
            entry.rig.root.position.x = THREE.MathUtils.lerp(entry.rig.root.position.x, entry.x, k);
            entry.rig.root.position.y = THREE.MathUtils.lerp(entry.rig.root.position.y, entry.y, k);
            entry.rig.root.position.z = THREE.MathUtils.lerp(entry.rig.root.position.z, entry.z, k);
            let yDiff = entry.yaw - entry.rig.root.rotation.y;
            while (yDiff > Math.PI) yDiff -= Math.PI * 2;
            while (yDiff < -Math.PI) yDiff += Math.PI * 2;
            entry.rig.root.rotation.y += yDiff * k;
            if (entry.speaking) {
              const pulse = 1 + Math.sin(elapsed * 12) * 0.12;
              entry.voiceRing.scale.set(pulse, pulse, 1);
            }
            const remEmote = entry.animState === 'idle' ? entry.activeEmote : null;
            const remElapsed = remEmote ? Math.max(0, (nowMs - entry.emoteStartedAt) / 1000) : 0;
            animateCharacterRig(entry.rig, elapsed, entry.animState, dt, undefined, remEmote, remElapsed);
          }
        });
      }

      // 3. Animate Cutscene NPCs & Prolog Shuttle
      if (cs) {
        cutsceneTimeRef.current += dt;
        if (cs === 'prolog') {
          const shuttle = world.shuttleGroup;
          shuttle.position.z = THREE.MathUtils.lerp(shuttle.position.z, 13.5, 1 - Math.exp(-0.55 * dt));
          shuttle.position.y = 4.5 + Math.sin(elapsed * 2.1) * 0.25;
        }
        npcRigsRef.current.forEach((npc) => {
          const dist = npc.rig.root.position.distanceTo(npc.targetPos);
          const npcMoving = dist > 0.08;
          if (npcMoving) {
            const k = 1 - Math.exp(-2.8 * dt);
            npc.rig.root.position.lerp(npc.targetPos, k);
          }
          const dx = pPos.x - npc.rig.root.position.x;
          const dz = pPos.z - npc.rig.root.position.z;
          npc.rig.root.rotation.y = Math.atan2(dx, dz);

          const isSpeaking = csLine?.speakerId === npc.id;
          animateCharacterRig(
            npc.rig,
            elapsed,
            npcMoving ? 'walk' : 'idle',
            dt,
            isSpeaking ? csLine?.gesture : undefined
          );
        });
      }

      // 4. Automatic Sliding Doors, Chapter Locking & Post-Completion Sealing
      world.doors.forEach((door) => {
        const isCompLocked = !isMultiplayerRef.current && completedDoorIdSetRef.current.has(door.id);
        const isChapLocked = !isMultiplayerRef.current && chapterLockedDoorSetRef.current.has(door.id);
        const isLocked = isCompLocked || isChapLocked;
        let shouldOpen = !isLocked && (Math.hypot(pPos.x - door.x, pPos.z - door.z) < 4.5 || Boolean(cs));
        if (!isLocked && !shouldOpen && isMultiplayerRef.current) {
          remoteRigMapRef.current.forEach((entry) => {
            if (entry.alive && !entry.inVent && Math.hypot(entry.x - door.x, entry.z - door.z) < 4.5) {
              shouldOpen = true;
            }
          });
        }

        const nextLockVisual: DoorLockVisualState = isCompLocked
          ? 'completed_locked'
          : isChapLocked
            ? 'chapter_locked'
            : 'none';
        if (door.lockVisualState !== nextLockVisual) {
          door.lockVisualState = nextLockVisual;
          if (nextLockVisual === 'none') {
            door.lockSprite.visible = false;
          } else {
            door.lockSpriteMat.map = getDoorLockBadgeTexture(nextLockVisual);
            door.lockSpriteMat.needsUpdate = true;
            door.lockSprite.visible = true;
          }
        }

        if (isCompLocked) {
          door.statusMat.color.setHex(0x10b981);
          door.statusMat.emissive.setHex(0x059669);
        } else if (isChapLocked) {
          door.statusMat.color.setHex(0xef4444);
          door.statusMat.emissive.setHex(0xdc2626);
        } else {
          door.statusMat.color.setHex(door.accentNum);
          door.statusMat.emissive.setHex(door.accentNum);
        }

        const prevOpen = door.openProgress;
        door.openProgress = THREE.MathUtils.damp(door.openProgress, shouldOpen ? 1 : 0, 8, dt);

        if (shouldOpen && prevOpen < 0.15 && door.openProgress >= 0.15) {
          const lastT = doorOpenSoundCooldown.get(door.id) || 0;
          if (elapsed - lastT > 1.8) {
            doorOpenSoundCooldown.set(door.id, elapsed);
            soundEngine.playDoorOpen();
          }
        }

        const slideDist = (door.width - 0.6) * 0.48 * door.openProgress;
        const leafBase = (door.width - 0.6) / 4;
        door.leftLeaf.position.x = -leafBase - slideDist;
        door.rightLeaf.position.x = leafBase + slideDist;
      });

      // 5. Physical Vents Hinged Lid Animation & Proximity
      let foundVent: HudLiveState['nearbyVent'] = null;
      let bestVentDist = 2.6;
      world.vents.forEach((ventObj) => {
        const d = Math.hypot(pPos.x - ventObj.x, pPos.z - ventObj.z);
        const isNear = d < 2.6 && !cs;
        ventObj.openProgress = THREE.MathUtils.damp(ventObj.openProgress, isNear || inVentRef.current ? 1 : 0, 9, dt);
        ventObj.lid.rotation.x = -ventObj.openProgress * 1.15;
        if (d < bestVentDist && !cs) {
          bestVentDist = d;
          const vDef = VENTS.find((v) => v.id === ventObj.id);
          if (vDef) {
            foundVent = { id: vDef.id, label: vDef.label, roomId: vDef.roomId };
          }
        }
      });
      nearbyVentRef.current = foundVent;

      // 6. Adaptive Distance Culling, Micro-Prop LOD, Dynamic Local Lights, Spinners & Terminals
      const quality = settingsRef.current.graphicsQuality || 'medium';
      const focusX = cs ? _camTarget.x : pPos.x;
      const focusZ = cs ? _camTarget.z : pPos.z;
      const cullDistSq = cs ? 140 * 140 : quality === 'low' ? 34 * 34 : quality === 'medium' ? 50 * 50 : 95 * 95;
      const microDistSq = quality === 'low' ? 11 * 11 : quality === 'medium' ? 18 * 18 : 30 * 30;
      const animDistSq = cs ? 140 * 140 : quality === 'low' ? 28 * 28 : quality === 'medium' ? 42 * 42 : 95 * 95;

      let closestIdx = 0;
      let closestSq = Infinity;
      let secondIdx = 1;
      let secondSq = Infinity;

      for (let i = 0; i < world.roomGroups.length; i++) {
        const rg = world.roomGroups[i];
        const dx = rg.centerX - focusX;
        const dz = rg.centerZ - focusZ;
        const dSq = dx * dx + dz * dz;

        if (dSq < closestSq) {
          secondSq = closestSq;
          secondIdx = closestIdx;
          closestSq = dSq;
          closestIdx = i;
        } else if (dSq < secondSq) {
          secondSq = dSq;
          secondIdx = i;
        }

        const isVis = dSq <= cullDistSq;
        rg.group.visible = isVis;
        if (isVis) {
          const showMicro = cs ? true : dSq <= microDistSq;
          for (let m = 0; m < rg.microProps.length; m++) {
            rg.microProps[m].visible = showMicro;
          }
          if (dSq <= animDistSq) {
            for (let s = 0; s < rg.spinners.length; s++) {
              const sp = rg.spinners[s];
              sp.obj.rotation.y += dt * sp.speedY;
              if (sp.speedX) sp.obj.rotation.x += dt * sp.speedX;
              if (sp.floatAmp && sp.baseY !== undefined) {
                sp.obj.position.y = sp.baseY + Math.sin(elapsed * 2.5) * sp.floatAmp;
              }
            }
          }
        }
      }

      // Smoothly move 2 local PointLights to closest & 2nd-closest rooms
      const lightMix = 1 - Math.exp(-5 * dt);
      const roomA = ROOMS[world.roomGroups[closestIdx]?.roomId || 'central_lobby'];
      const roomB = ROOMS[world.roomGroups[secondIdx]?.roomId || 'global_balance_room'];
      const [lA, lB] = world.localLights;
      lA.position.x = THREE.MathUtils.lerp(lA.position.x, roomA.center.x, lightMix);
      lA.position.z = THREE.MathUtils.lerp(lA.position.z, roomA.center.z, lightMix);
      _tmpColor.setHex(roomA.accentNum);
      lA.color.lerp(_tmpColor, lightMix);

      lB.position.x = THREE.MathUtils.lerp(lB.position.x, roomB.center.x, lightMix);
      lB.position.z = THREE.MathUtils.lerp(lB.position.z, roomB.center.z, lightMix);
      _tmpColor.setHex(roomB.accentNum);
      lB.color.lerp(_tmpColor, lightMix);

      world.earthMesh.rotation.y += dt * 0.03;
      world.starPoints.rotation.y += dt * 0.004;
      for (let i = 0; i < world.animatedSpinners.length; i++) {
        const sp = world.animatedSpinners[i];
        const refObj = sp.obj.parent && sp.obj.parent !== scene && sp.obj.parent !== world.stationGroup ? sp.obj.parent : sp.obj;
        const dx = refObj.position.x - focusX;
        const dz = refObj.position.z - focusZ;
        // Skip distant station-internal holos; always animate distant space ringedPlanet (|x| > 80)
        if (Math.abs(refObj.position.x) < 80 && dx * dx + dz * dz > animDistSq) continue;
        sp.obj.rotation.y += dt * sp.speedY;
        if (sp.speedX) sp.obj.rotation.x += dt * sp.speedX;
        if (sp.floatAmp && sp.baseY !== undefined) {
          sp.obj.position.y = sp.baseY + Math.sin(elapsed * 2.5) * sp.floatAmp;
        }
      }

      let foundTerminal: HudLiveState['nearbyTerminal'] = null;
      let bestTermDist = 3.2;
      _doneSet.clear();
      const doneArr = completedMissionsRef.current;
      for (let i = 0; i < doneArr.length; i++) _doneSet.add(doneArr[i]);
      const inProgRoom = activeMissionRoomIdRef.current;
      const curUnlockedChap = unlockedChapterRef.current;
      const isMp = isMultiplayerRef.current;
      const rbArr = readBooksRef.current;
      const activeBookId = activeTheoryBookRef.current;

      for (let i = 0; i < world.terminals.length; i++) {
        const term = world.terminals[i];
        if (term.missionId) {
          const isDone = _doneSet.has(term.missionId);
          const isInProgress = !isMp && inProgRoom === term.roomId;
          const meta = MISSION_META[term.missionId];
          const booksReady = areRequiredBooksRead(term.missionId, rbArr);
          if (isInProgress) {
            // Active/in-progress room mission pulses blue
            term.beaconMat.color.setHex(0x38bdf8);
            term.beaconMat.emissive.setHex(0x0ea5e9);
            term.beaconMat.emissiveIntensity = 1.45 + Math.sin(elapsed * 5.2) * 0.45;
          } else if (isDone) {
            term.beaconMat.color.setHex(0x10b981);
            term.beaconMat.emissive.setHex(0x10b981);
            term.beaconMat.emissiveIntensity = 1.15;
          } else if (isMp || meta.chapter <= curUnlockedChap) {
            if (booksReady) {
              // Books read — quiz unlocked! Bright glowing cyan-teal beacon
              term.beaconMat.color.setHex(0x22d3ee);
              term.beaconMat.emissive.setHex(0x06b6d4);
              term.beaconMat.emissiveIntensity = 1.35 + Math.sin(elapsed * 4.0) * 0.35;
            } else {
              // Books unread — quiz locked until Selesai Membaca
              term.beaconMat.color.setHex(0xd97706);
              term.beaconMat.emissive.setHex(0xb45309);
              term.beaconMat.emissiveIntensity = 0.6;
            }
          } else {
            // Chapter locked
            term.beaconMat.color.setHex(0x64748b);
            term.beaconMat.emissive.setHex(0x334155);
            term.beaconMat.emissiveIntensity = 0.55;
          }
        } else if (term.roomId === 'earth_observation_room' && !isMp) {
          if (completedChaptersCountRef.current >= 5) {
            term.beaconMat.color.setHex(0xfacc15);
            term.beaconMat.emissive.setHex(0xeab308);
            term.beaconMat.emissiveIntensity = 1.4;
          } else {
            term.beaconMat.color.setHex(0x475569);
            term.beaconMat.emissive.setHex(0x1e293b);
            term.beaconMat.emissiveIntensity = 0.5;
          }
        }
        const d = Math.hypot(pPos.x - term.position.x, pPos.z - term.position.z);
        if (d < bestTermDist) {
          bestTermDist = d;
          const roomDef = ROOMS[term.roomId];
          foundTerminal = {
            roomId: term.roomId,
            missionId: term.missionId,
            label: roomDef.terminalLabel,
          };
        }
      }
      nearbyTerminalRef.current = foundTerminal;
      nearbyTermDistRef.current = bestTermDist;

      // Interactive 3D Theory Books Proximity, Glowing Halo Status & Unread Book Starlight Sparkles
      let foundBook: HudLiveState['nearbyBook'] = null;
      let bestBookDist = 2.75;
      _readBookSet.clear();
      for (let i = 0; i < rbArr.length; i++) _readBookSet.add(rbArr[i]);

      for (let i = 0; i < world.theoryBooks.length; i++) {
        const tb = world.theoryBooks[i];
        tb.beacon.rotation.y += dt * 1.45;
        tb.beacon.position.y = 0.24 + Math.sin(elapsed * 2.4 + i) * 0.04;
        const isReadingNow = activeBookId === tb.id;
        const isRead = _readBookSet.has(tb.id);
        const bookRoom = ROOMS[tb.roomId];
        const isRoomCompLocked = !isMp && completedLockedRoomSetRef.current.has(tb.roomId);
        const isRoomChapLocked =
          !isMp &&
          ((bookRoom?.chapter !== undefined && bookRoom.chapter > curUnlockedChap) ||
            (tb.roomId === 'earth_observation_room' && completedChaptersCountRef.current < 5));

        if (isReadingNow) {
          tb.haloMat.color.setHex(0x38bdf8);
          tb.haloMat.emissive.setHex(0x0ea5e9);
          tb.haloMat.emissiveIntensity = 1.55 + Math.sin(elapsed * 5.0) * 0.35;
        } else if (isRead) {
          tb.haloMat.color.setHex(0x10b981);
          tb.haloMat.emissive.setHex(0x059669);
          tb.haloMat.emissiveIntensity = 0.85;
        } else {
          tb.haloMat.color.setHex(0xf59e0b);
          tb.haloMat.emissive.setHex(0xd97706);
          tb.haloMat.emissiveIntensity = 1.25 + Math.sin(elapsed * 3.0 + i) * 0.3;
        }

        // Twinkling 3D sparkles around unread, unlocked books (fade cleanly once read)
        const wantSparkles = !isRead && !isRoomCompLocked && !isRoomChapLocked;
        const targetOpacity = wantSparkles ? 0.68 + Math.sin(elapsed * 3.8 + i) * 0.26 : 0;
        tb.sparkleMat.opacity = THREE.MathUtils.damp(tb.sparkleMat.opacity, targetOpacity, 7, dt);
        tb.sparkles.visible = tb.sparkleMat.opacity > 0.03;
        if (tb.sparkles.visible) {
          tb.sparkles.rotation.y += dt * 0.55;
          tb.sparkles.position.y = Math.sin(elapsed * 2.2 + i) * 0.05;
        }

        if (!cs) {
          const d = Math.hypot(pPos.x - tb.position.x, pPos.z - tb.position.z);
          if (d < bestBookDist) {
            bestBookDist = d;
            const bDef = THEORY_BOOK_MAP[tb.id];
            foundBook = {
              id: tb.id,
              title: bDef.title,
              topicLabel: bDef.topicLabel,
            };
          }
        }
      }
      nearbyBookRef.current = foundBook;
      nearbyBookDistRef.current = bestBookDist;

      // Stasis Pods & Emergency & Eliminate detection (Multiplayer)
      let foundPod: HudLiveState['nearbyStasisPod'] = null;
      if (isMultiplayerRef.current && amAliveRef.current && !cs) {
        let bestPodDist = 4.2;
        stasisPodsRef.current.forEach((pod) => {
          const d = Math.hypot(pPos.x - pod.x, pPos.z - pod.z);
          if (d < bestPodDist) {
            bestPodDist = d;
            foundPod = { id: pod.id, victimName: pod.victimName, roomName: pod.roomName };
          }
        });
      }
      nearbyPodRef.current = foundPod;

      const nearbyEmergency =
        isMultiplayerRef.current &&
        amAliveRef.current &&
        !cs &&
        Math.hypot(pPos.x, pPos.z) < 4.5;

      let nearbyTarget: HudLiveState['nearbyEliminateTarget'] = null;
      if (isMultiplayerRef.current && myRoleRef.current === 'impostor' && amAliveRef.current && !inVentRef.current && !cs) {
        let bestTargetDist = 3.8;
        remoteRigMapRef.current.forEach((entry, pid) => {
          if (!entry.alive || entry.inVent) return;
          const d = Math.hypot(pPos.x - entry.x, pPos.z - entry.z);
          if (d < bestTargetDist) {
            bestTargetDist = d;
            nearbyTarget = { id: pid, name: entry.name };
          }
        });
      }

      // 7. Dynamic Cutscene Camera Choreography + LOS Occlusion Guard OR 360° Free-Look Camera
      if (cs) {
        const focus = csLine?.cameraFocus || 'wide';
        const speakerNpc = npcRigsRef.current.find((n) => n.id === csLine?.speakerId)?.rig.root.position;
        const firstNpc = npcRigsRef.current[0]?.rig.root.position;

        if (cs === 'prolog') {
          if (focus === 'space') {
            _camTarget.set(0, -3, -95);
            _desiredCamPos.set(14, 18, 32);
          } else if (focus === 'shuttle') {
            const sh = world.shuttleGroup.position;
            _camTarget.set(sh.x, sh.y, sh.z);
            _desiredCamPos.set(sh.x + 6.5, sh.y + 3.0, sh.z + 8.5);
          } else if (focus === 'player') {
            _camTarget.set(pPos.x, 1.38, pPos.z);
            _desiredCamPos.set(pPos.x + 1.9, 1.85, pPos.z + 2.4);
          } else if (focus === 'hologram') {
            _camTarget.set(0, 1.7, 0);
            _desiredCamPos.set(3.4, 2.35, 4.3);
          } else if (focus === 'sparkle_spot') {
            if (prologLineElapsedRef.current < 1.55) {
              _camTarget.set(pPos.x - 1.6, 1.35, pPos.z * 0.45);
              _desiredCamPos.set(pPos.x + 2.5, 2.25, pPos.z + 2.1);
            } else {
              _camTarget.set(-9.6, 1.38, 0.08);
              _desiredCamPos.set(-2.2, 2.05, 1.7);
            }
          } else if (focus === 'sparkle_follow') {
            if (prologLineElapsedRef.current >= 4.4) {
              _camTarget.set(-35.4, 1.15, 4.2);
              _desiredCamPos.set(-33.1, 1.92, 1.85);
            } else {
              const vx = _sparklePos.x - pPos.x;
              const vz = _sparklePos.z - pPos.z;
              const vLen = Math.hypot(vx, vz) || 1;
              const fx = vx / vLen;
              const fz = vz / vLen;
              const rx = -fz;
              const rz = fx;
              _camTarget.set(
                THREE.MathUtils.lerp(pPos.x, _sparklePos.x, 0.4),
                1.3,
                THREE.MathUtils.lerp(pPos.z, _sparklePos.z, 0.4)
              );
              _desiredCamPos.set(
                pPos.x - fx * 3.1 + rx * 0.65,
                2.05,
                pPos.z - fz * 3.1 + rz * 0.65
              );
            }
          } else if (focus === 'sparkle_book') {
            _camTarget.set(-35.4, 1.05, 4.25);
            _desiredCamPos.set(-33.35, 1.82, 2.35);
          } else {
            _camTarget.set(0, 1.3, 0.8);
            _desiredCamPos.set(-4.2, 3.0, 5.4);
          }
        } else if (cs === 'rex') {
          if (focus === 'player') {
            _camTarget.set(pPos.x, 1.38, pPos.z);
            _desiredCamPos.set(-36.0, 1.95, 2.55);
          } else if (focus === 'npc' && firstNpc) {
            _camTarget.set(firstNpc.x, 1.38, firstNpc.z);
            _desiredCamPos.set(-32.8, 1.95, 2.55);
          } else if (focus === 'hologram') {
            _camTarget.set(-35.7, 1.5, 0);
            _desiredCamPos.set(-32.6, 2.45, 2.8);
          } else {
            _camTarget.set(-34.2, 1.35, 2.2);
            _desiredCamPos.set(-34.2, 2.25, 3.7);
          }
        } else if (cs === 'bima') {
          if (focus === 'player') {
            _camTarget.set(pPos.x, 1.38, pPos.z);
            _desiredCamPos.set(36.0, 1.95, -2.55);
          } else if (focus === 'npc' && firstNpc) {
            _camTarget.set(firstNpc.x, 1.38, firstNpc.z);
            _desiredCamPos.set(32.8, 1.95, -2.55);
          } else if (focus === 'hologram') {
            _camTarget.set(35.7, 1.5, 0);
            _desiredCamPos.set(32.6, 2.45, -2.8);
          } else {
            _camTarget.set(34.2, 1.35, -2.2);
            _desiredCamPos.set(34.2, 2.25, -3.7);
          }
        } else if (cs === 'fuzzy') {
          if (focus === 'player') {
            _camTarget.set(pPos.x, 1.38, pPos.z);
            _desiredCamPos.set(-19.4, 1.95, -15.6);
          } else if (focus === 'npc' && firstNpc) {
            _camTarget.set(firstNpc.x, 1.38, firstNpc.z);
            _desiredCamPos.set(-16.8, 1.95, -12.0);
          } else if (focus === 'hologram') {
            _camTarget.set(-20.4, 1.6, -16.2);
            _desiredCamPos.set(-16.6, 2.25, -12.6);
          } else {
            _camTarget.set(-18.0, 1.35, -14.1);
            _desiredCamPos.set(-16.6, 2.25, -11.0);
          }
        } else if (cs === 'bob') {
          if (focus === 'player') {
            _camTarget.set(pPos.x, 1.38, pPos.z);
            _desiredCamPos.set(-14.3, 1.95, -36.5);
          } else if (focus === 'npc' && firstNpc) {
            _camTarget.set(firstNpc.x, 1.38, firstNpc.z);
            _desiredCamPos.set(-14.2, 1.95, -33.2);
          } else if (focus === 'hologram') {
            _camTarget.set(-19.0, 1.5, -36.0);
            _desiredCamPos.set(-14.6, 2.25, -33.4);
          } else {
            _camTarget.set(-15.7, 1.35, -35.0);
            _desiredCamPos.set(-14.0, 2.2, -31.8);
          }
        } else {
          // ratu_laras & all_final in Earth Observation Room north deck
          if (focus === 'player') {
            _camTarget.set(pPos.x, 1.38, pPos.z);
            _desiredCamPos.set(pPos.x + 1.6, 1.9, pPos.z - 2.3);
          } else if (focus === 'npc' && speakerNpc) {
            _camTarget.set(speakerNpc.x, 1.38, speakerNpc.z);
            _desiredCamPos.set(speakerNpc.x * 0.75, 1.9, speakerNpc.z + 2.5);
          } else if (focus === 'hologram') {
            _camTarget.set(0, 2.1, -55.0);
            _desiredCamPos.set(3.2, 2.45, -51.4);
          } else {
            _camTarget.set(0, 1.4, -59.0);
            _desiredCamPos.set(0, 2.45, -56.9);
          }
        }

        // Prevent cutscene camera from clipping through outer station walls
        _rayOrigin.copy(_camTarget);
        _rayDir.subVectors(_desiredCamPos, _rayOrigin);
        const csDist = _rayDir.length();
        if (csDist > 0.1 && focus !== 'space' && focus !== 'shuttle') {
          _rayDir.normalize();
          _ray.set(_rayOrigin, _rayDir);
          let minWallHit = csDist;
          for (let i = 0; i < world.wallBoxes.length; i++) {
            const hit = _ray.intersectBox(world.wallBoxes[i], _hitPoint);
            if (hit) {
              const d = _rayOrigin.distanceTo(hit);
              if (d < minWallHit && d > 0.4) {
                minWallHit = d - 0.35;
              }
            }
          }
          if (minWallHit < csDist) {
            _desiredCamPos.copy(_rayOrigin).addScaledVector(_rayDir, Math.max(1.4, minWallHit));
          }
        }

        const k = 1 - Math.exp(-3.4 * dt);
        camera.position.lerp(_desiredCamPos, k);
        camera.lookAt(_camTarget);

        // Dynamic LOS Occlusion Guard: hide any room furniture prop blocking camera -> actors/target
        if (focus !== 'space' && focus !== 'shuttle') {
          const csRoomId =
            cs === 'prolog' && (prologPhase === 'sparkle_book' || pPos.x < -28)
              ? 'navigation_room'
              : CUTSCENES[cs].roomId;
          const roomEntry = world.roomGroups.find((rg) => rg.roomId === csRoomId);
          if (roomEntry && roomEntry.group.visible) {
            const checkVisibilityAlongRay = (targetVec: THREE.Vector3) => {
              _rayDir.subVectors(targetVec, camera.position);
              const targetDist = _rayDir.length();
              if (targetDist <= 0.3) return;
              _rayDir.normalize();
              _losRaycaster.set(camera.position, _rayDir);
              _losRaycaster.near = 0.05;
              _losRaycaster.far = targetDist - 0.2;
              const hits = _losRaycaster.intersectObject(roomEntry.group, true);
              for (let h = 0; h < hits.length; h++) {
                let obj: THREE.Object3D | null = hits[h].object;
                if (obj && obj !== roomEntry.group) {
                  obj.visible = false;
                  _hiddenCutsceneObjects.add(obj);
                }
              }
            };

            checkVisibilityAlongRay(_camTarget);
            if (speakerNpc) {
              _losTarget.set(speakerNpc.x, 1.25, speakerNpc.z);
              checkVisibilityAlongRay(_losTarget);
            }
            if (csLine?.speakerId === 'player') {
              _losTarget.set(pPos.x, 1.25, pPos.z);
              checkVisibilityAlongRay(_losTarget);
            }
          }
        }
      } else {
        const camYOffset = 1.35 + pPos.y * 0.65;
        _camTarget.set(pPos.x, camYOffset, pPos.z);
        const horiz = Math.cos(camPitchRef.current) * camDistRef.current;
        const vert = Math.sin(camPitchRef.current) * camDistRef.current;
        _desiredCamPos.set(
          pPos.x + Math.sin(camYawRef.current) * horiz,
          camYOffset + vert,
          pPos.z + Math.cos(camYawRef.current) * horiz
        );

        _rayOrigin.copy(_camTarget);
        _rayDir.subVectors(_desiredCamPos, _rayOrigin);
        const fullDist = _rayDir.length();
        if (fullDist > 0.01) {
          _rayDir.normalize();
          _ray.set(_rayOrigin, _rayDir);
          let closestHit = fullDist;
          for (let i = 0; i < world.wallBoxes.length; i++) {
            const hit = _ray.intersectBox(world.wallBoxes[i], _hitPoint);
            if (hit) {
              const d = _rayOrigin.distanceTo(hit);
              if (d < closestHit && d > 0.4) {
                closestHit = d - 0.35;
              }
            }
          }
          for (let i = 0; i < PROP_CAM_BOXES.length; i++) {
            const hit = _ray.intersectBox(PROP_CAM_BOXES[i], _hitPoint);
            if (hit) {
              const d = _rayOrigin.distanceTo(hit);
              if (d < closestHit && d > 0.55) {
                closestHit = d - 0.3;
              }
            }
          }
          if (closestHit < fullDist) {
            _desiredCamPos.copy(_rayOrigin).addScaledVector(_rayDir, Math.max(1.5, closestHit));
          }
        }

        _desiredCamPos.y = THREE.MathUtils.clamp(_desiredCamPos.y, 0.45, 3.85);
        const k = 1 - Math.exp(-14 * dt);
        camera.position.lerp(_desiredCamPos, k);
        camera.lookAt(_camTarget);
      }

      if (!isSoftwareGl && keyLight.castShadow) {
        keyLight.position.set(pPos.x + 15, 25, pPos.z + 12);
        keyLight.target.position.copy(pPos);
        keyLight.target.updateMatrixWorld();
      }

      renderer.render(scene, camera);

      if (elapsed - lastHudEmit > 0.066) {
        lastHudEmit = elapsed;
        const room = getRoomAtPosition(pPos.x, pPos.z);
        onHudUpdateRef.current({
          playerX: pPos.x,
          playerZ: pPos.z,
          playerYaw: playerYawRef.current,
          cameraYaw: camYawRef.current,
          currentRoomId: room?.id ?? null,
          currentRoomName: room ? room.name : 'Koridor Stasiun',
          nearbyTerminal: foundTerminal,
          nearbyBook: foundBook,
          nearbyVent: foundVent,
          nearbyStasisPod: foundPod,
          nearbyEmergencyConsole: nearbyEmergency,
          nearbyEliminateTarget: nearbyTarget,
        });
      }

      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      if (triggerJumpRef) triggerJumpRef.current = null;
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      dom.removeEventListener('contextmenu', onContextMenu);
      dom.removeEventListener('pointerdown', onPointerDown);
      dom.removeEventListener('pointermove', onPointerMove);
      dom.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('pointercancel', onPointerUp);
      dom.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      if (sparkleGuideRef.current) {
        sparkleGuideRef.current.dispose();
        scene.remove(sparkleGuideRef.current.group);
        sparkleGuideRef.current = null;
      }
      eliminationEffectsRef.current.forEach((fx) => {
        scene.remove(fx.group);
        fx.ring.geometry.dispose();
        fx.ringMat.dispose();
        fx.beam.geometry.dispose();
        fx.beamMat.dispose();
        fx.shards.geometry.dispose();
        fx.shardsMat.dispose();
      });
      eliminationEffectsRef.current = [];
      renderer.dispose();
      if (dom.parentNode === container) container.removeChild(dom);
    };
  }, []);

  if (webglError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#060916] p-6 text-center">
        <div className="max-w-md bg-[#0b132b] border border-amber-500/40 rounded-2xl p-6 space-y-2">
          <h3 className="font-display text-lg font-bold text-white">WebGL 3D Tidak Aktif</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Browser atau perangkat ini memblokir grafis 3D (WebGL). Buka tautan langsung menggunakan Google Chrome / Safari terbaru dan aktifkan akselerasi perangkat keras (Hardware Acceleration).
          </p>
        </div>
      </div>
    );
  }

  return <div ref={mountRef} className="w-full h-full relative" />;
};
