import { CHAPTER_INFO, CUTSCENES, INVENTORY_ITEMS } from '../data/gameData';
import { isPlayerClearOfRoomAndDoor, ROOMS } from '../data/stationLayout';
import {
  ChapterId,
  ChapterProgressState,
  CutsceneCharacterId,
  CutsceneCheckpoint,
  HeadwearTransform,
  InventoryItemDef,
  MissionId,
  RoomId,
  SaveState,
  TheoryBookId,
} from '../types/game';

export const STORAGE_KEY = 'globalus_mission_globalization_v1';

export const DEFAULT_HEADWEAR_TRANSFORM: HeadwearTransform = {
  offsetY: 0,
  offsetZ: 0,
  tiltX: 0,
  scale: 1,
};

const ALL_CHAPTERS: ChapterId[] = [1, 2, 3, 4, 5];

const VALID_MISSION_IDS = new Set<MissionId>([
  'ch1_m1',
  'ch1_m2',
  'ch2_m1',
  'ch2_m2',
  'ch3_m1',
  'ch3_m2',
  'ch4_m1',
  'ch4_m2',
  'ch5_m1',
  'ch5_m2',
]);

const VALID_BOOK_IDS = new Set<TheoryBookId>([
  'book_1_pengertian',
  'book_2_karakteristik',
  'book_3_hyperglobalist',
  'book_4_transformasionalis',
  'book_5_skeptis',
  'book_6_glokalisasi',
  'book_7_dampak_ekonomi',
  'book_8_dampak_sosbud',
  'book_9_identitas_budaya',
  'book_10_ketimpangan',
  'book_11_komunikasi',
]);

export function getPlayerReadKey(playerName?: string): string {
  const cleaned = (playerName || 'Astronaut').trim().toLowerCase();
  return cleaned || 'astronaut';
}

function filterValidBookIds(arr: unknown): TheoryBookId[] {
  if (!Array.isArray(arr)) return [];
  return Array.from(
    new Set(
      arr.filter((b): b is TheoryBookId => typeof b === 'string' && VALID_BOOK_IDS.has(b as TheoryBookId))
    )
  );
}

export function getDefaultSaveState(): SaveState {
  const isTouchDevice =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  return {
    character: {
      name: 'Astronaut',
      color: 'biru',
      helmet: 'standard_visor',
      costume: 'standard_crew',
      head: 'none',
      body: 'backpack',
      neck: 'none',
      headwearTransform: { ...DEFAULT_HEADWEAR_TRANSFORM },
    },
    settings: {
      musicVolume: 0.45,
      sfxVolume: 0.75,
      muted: false,
      musicTrack: 'cosmic_drift',
      musicPaused: false,
      musicMuted: false,
      voiceEnabled: true,
      voiceVolume: 0.9,
      cameraSensitivity: 1.0,
      moveSensitivity: 1.0,
      showTouchControls: isTouchDevice,
      graphicsQuality: 'medium',
    },
    creatorInfo: {
      creatorName: 'Tim Pengembang Sosiologi XII',
      schoolOrInstitution: 'SMA Nusantara',
      subjectInfo: 'Sosiologi Kelas XII — Globalisasi',
      year: '2026',
    },
    unlockedItems: [],
    completedMissions: [],
    unlockedChapter: 1,
    completedChapters: [],
    completedCutscenes: [],
    missionScores: {},
    quizCompleted: false,
    quizScore: 0,
    quizCorrectCount: 0,
    totalExp: 0,
    endingSeen: false,
    prologSeen: false,
    tutorialSeen: false,
    readBooks: [],
    readBooksByPlayer: { astronaut: [] },
    lockedCompletedRooms: [],
    activeCutsceneCheckpoint: null,
    pendingRewardChapter: null,
    chapterProgress: {
      1: { missionsCompleted: false, cutsceneCompleted: false, chapterCompleted: false, rewardClaimed: false },
      2: { missionsCompleted: false, cutsceneCompleted: false, chapterCompleted: false, rewardClaimed: false },
      3: { missionsCompleted: false, cutsceneCompleted: false, chapterCompleted: false, rewardClaimed: false },
      4: { missionsCompleted: false, cutsceneCompleted: false, chapterCompleted: false, rewardClaimed: false },
      5: { missionsCompleted: false, cutsceneCompleted: false, chapterCompleted: false, rewardClaimed: false },
    },
  };
}

export function getChapterCutsceneId(chap: ChapterId): CutsceneCharacterId {
  switch (chap) {
    case 1:
      return 'rex';
    case 2:
      return 'bima';
    case 3:
      return 'fuzzy';
    case 4:
      return 'bob';
    case 5:
      return 'ratu_laras';
  }
}

export const SIGNATURE_CHAPTER_REWARD: Record<ChapterId, string> = {
  1: 'comm_headset',
  2: 'modern_batik_cape',
  3: 'fuzzy_signal_ears',
  4: 'bob_cargo_goggles',
  5: 'golden_crown',
};

export function pickChapterRewardOnce(
  chap: ChapterId,
  unlockedItems: string[]
): { rewardItem: InventoryItemDef; specialItem: InventoryItemDef; alreadyClaimed: boolean } {
  const chapInfo = CHAPTER_INFO[chap];
  const specialItem = INVENTORY_ITEMS.find((i) => i.id === chapInfo.specialItemId)!;
  const ownedRewardId = chapInfo.rewardPool.find((id) => unlockedItems.includes(id));
  const specialOwned = unlockedItems.includes(chapInfo.specialItemId);

  if (ownedRewardId && specialOwned) {
    const rewardItem = INVENTORY_ITEMS.find((i) => i.id === ownedRewardId)!;
    return { rewardItem, specialItem, alreadyClaimed: true };
  }

  const signatureId = SIGNATURE_CHAPTER_REWARD[chap];
  const unowned = chapInfo.rewardPool.filter((id) => !unlockedItems.includes(id));
  const pool = unowned.length > 0 ? unowned : chapInfo.rewardPool;
  const chosenId = pool.includes(signatureId)
    ? signatureId
    : pool[Math.floor(Math.random() * pool.length)];
  const rewardItem = INVENTORY_ITEMS.find((i) => i.id === chosenId)!;
  return { rewardItem, specialItem, alreadyClaimed: false };
}

function isLegacyThreeChapterSave(raw: Partial<SaveState>): boolean {
  const cp = raw.chapterProgress as Record<number, ChapterProgressState> | undefined;
  if (cp && (cp[4] || cp[5])) return false;

  const rawMissions = (raw.completedMissions as unknown as string[]) || [];
  if (
    rawMissions.includes('ch1_m3') ||
    rawMissions.includes('ch2_m3') ||
    rawMissions.includes('ch3_m3')
  ) {
    return true;
  }

  const cutscenes = raw.completedCutscenes || [];
  const items = raw.unlockedItems || [];
  const chapters = raw.completedChapters || [];
  if (
    chapters.includes(3) &&
    (cutscenes.includes('ratu_laras') || items.includes('medalion_skeptis')) &&
    !cutscenes.includes('fuzzy') &&
    !items.includes('medalion_teknologi')
  ) {
    return true;
  }
  return false;
}

/**
 * Validates, migrates (including legacy 3-chapter -> 5-chapter migration),
 * and recovers interrupted SaveState without ever wiping valid progress.
 */
export function normalizeAndRecoverSaveState(raw: Partial<SaveState> | null | undefined): SaveState {
  const defaults = getDefaultSaveState();
  if (!raw || typeof raw !== 'object') return defaults;

  const isLegacy = isLegacyThreeChapterSave(raw);

  const rawMissionsArr = Array.isArray(raw.completedMissions)
    ? (raw.completedMissions as unknown as string[])
    : [];

  let validMissions: MissionId[] = [];
  let missionScores: Partial<Record<MissionId, number>> = {};

  if (isLegacy) {
    // Remap legacy 9 missions to their semantic equivalents in the 5-chapter layout
    const legacyMissionMap: Record<string, MissionId> = {
      ch1_m1: 'ch3_m1',
      ch1_m2: 'ch3_m2',
      ch1_m3: 'ch1_m1',
      ch2_m1: 'ch2_m1',
      ch2_m2: 'ch4_m1',
      ch2_m3: 'ch2_m2',
      ch3_m1: 'ch4_m2',
      ch3_m2: 'ch5_m1',
      ch3_m3: 'ch5_m2',
    };
    for (const oldM of rawMissionsArr) {
      const mapped = legacyMissionMap[oldM];
      if (mapped && VALID_MISSION_IDS.has(mapped) && !validMissions.includes(mapped)) {
        validMissions.push(mapped);
      }
      const oldScore = (raw.missionScores as Record<string, number> | undefined)?.[oldM];
      if (mapped && typeof oldScore === 'number') {
        missionScores[mapped] = oldScore;
      }
    }
    if (raw.completedChapters?.includes(1)) {
      if (!validMissions.includes('ch1_m1')) validMissions.push('ch1_m1');
      if (!validMissions.includes('ch1_m2')) validMissions.push('ch1_m2');
    }
    if (raw.completedChapters?.includes(2)) {
      if (!validMissions.includes('ch2_m1')) validMissions.push('ch2_m1');
      if (!validMissions.includes('ch2_m2')) validMissions.push('ch2_m2');
    }
    if (raw.completedChapters?.includes(3)) {
      if (!validMissions.includes('ch5_m1')) validMissions.push('ch5_m1');
      if (!validMissions.includes('ch5_m2')) validMissions.push('ch5_m2');
    }
  } else {
    validMissions = Array.from(
      new Set(rawMissionsArr.filter((m): m is MissionId => VALID_MISSION_IDS.has(m as MissionId)))
    );
    if (raw.missionScores && typeof raw.missionScores === 'object') {
      missionScores = { ...raw.missionScores };
    }
  }

  let unlockedItems = Array.isArray(raw.unlockedItems)
    ? Array.from(new Set(raw.unlockedItems.filter((i): i is string => typeof i === 'string')))
    : [];

  let completedChapters: ChapterId[] = Array.isArray(raw.completedChapters)
    ? Array.from(
        new Set(
          raw.completedChapters
            .map((c) => (isLegacy && c === 3 ? (5 as ChapterId) : c))
            .filter((c): c is ChapterId => ALL_CHAPTERS.includes(c as ChapterId))
        )
      )
    : [];

  let completedCutscenes = Array.isArray(raw.completedCutscenes)
    ? Array.from(new Set(raw.completedCutscenes.filter((c): c is CutsceneCharacterId => typeof c === 'string')))
    : [];

  let unlockedChapter: ChapterId =
    raw.unlockedChapter && ALL_CHAPTERS.includes(raw.unlockedChapter)
      ? raw.unlockedChapter
      : 1;

  const totalExp = typeof raw.totalExp === 'number' && Number.isFinite(raw.totalExp) ? raw.totalExp : 0;

  let activeCheckpoint: CutsceneCheckpoint | null =
    raw.activeCutsceneCheckpoint &&
    typeof raw.activeCutsceneCheckpoint.cutsceneId === 'string' &&
    CUTSCENES[raw.activeCutsceneCheckpoint.cutsceneId]
      ? {
          cutsceneId: raw.activeCutsceneCheckpoint.cutsceneId,
          lineIndex: Math.max(
            0,
            Math.min(
              CUTSCENES[raw.activeCutsceneCheckpoint.cutsceneId].lines.length - 1,
              Number(raw.activeCutsceneCheckpoint.lineIndex) || 0
            )
          ),
        }
      : null;

  let pendingRewardChapter: ChapterId | null =
    raw.pendingRewardChapter && ALL_CHAPTERS.includes(raw.pendingRewardChapter)
      ? (isLegacy && raw.pendingRewardChapter === 3 ? 5 : raw.pendingRewardChapter)
      : null;

  const chapterProgress: Record<ChapterId, ChapterProgressState> = {
    1: { missionsCompleted: false, cutsceneCompleted: false, chapterCompleted: false, rewardClaimed: false },
    2: { missionsCompleted: false, cutsceneCompleted: false, chapterCompleted: false, rewardClaimed: false },
    3: { missionsCompleted: false, cutsceneCompleted: false, chapterCompleted: false, rewardClaimed: false },
    4: { missionsCompleted: false, cutsceneCompleted: false, chapterCompleted: false, rewardClaimed: false },
    5: { missionsCompleted: false, cutsceneCompleted: false, chapterCompleted: false, rewardClaimed: false },
  };

  for (const chap of ALL_CHAPTERS) {
    const info = CHAPTER_INFO[chap];
    const csId = getChapterCutsceneId(chap);
    const savedProg =
      isLegacy && chap === 3
        ? undefined
        : isLegacy && chap === 5
        ? raw.chapterProgress?.[3]
        : raw.chapterProgress?.[chap];

    const missionsDone =
      info.missions.every((m) => validMissions.includes(m)) || Boolean(savedProg?.missionsCompleted);
    const hasSpecialOrReward =
      unlockedItems.includes(info.specialItemId) || Boolean(savedProg?.rewardClaimed);

    const csDone =
      completedCutscenes.includes(csId) ||
      completedChapters.includes(chap) ||
      Boolean(savedProg?.cutsceneCompleted) ||
      Boolean(savedProg?.chapterCompleted) ||
      hasSpecialOrReward;

    const chapDone =
      completedChapters.includes(chap) ||
      Boolean(savedProg?.chapterCompleted) ||
      (missionsDone && csDone);

    if (csDone && !completedCutscenes.includes(csId)) {
      completedCutscenes = [...completedCutscenes, csId];
    }
    if (chapDone && !completedChapters.includes(chap)) {
      completedChapters = [...completedChapters, chap];
    }

    if (chapDone) {
      const nextChap = Math.min(5, chap + 1) as ChapterId;
      if (unlockedChapter < nextChap) unlockedChapter = nextChap;
      if (activeCheckpoint?.cutsceneId === csId) {
        activeCheckpoint = null;
      }
      if (!unlockedItems.includes(info.specialItemId)) {
        const picked = pickChapterRewardOnce(chap, unlockedItems);
        unlockedItems = Array.from(new Set([...unlockedItems, picked.rewardItem.id, picked.specialItem.id]));
      }
    } else if (missionsDone && !csDone) {
      if (!activeCheckpoint || activeCheckpoint.cutsceneId !== csId) {
        activeCheckpoint = { cutsceneId: csId, lineIndex: 0 };
      }
    }

    chapterProgress[chap] = {
      missionsCompleted: missionsDone,
      cutsceneCompleted: csDone,
      chapterCompleted: chapDone,
      rewardClaimed: unlockedItems.includes(info.specialItemId),
    };
  }

  for (let c = 1 as ChapterId; c <= 4; c = (c + 1) as ChapterId) {
    if (completedChapters.includes(c) && unlockedChapter < ((c + 1) as ChapterId)) {
      unlockedChapter = (c + 1) as ChapterId;
    }
  }

  if (pendingRewardChapter && !completedChapters.includes(pendingRewardChapter)) {
    pendingRewardChapter = null;
  }

  const rawHeadwear = raw.character?.headwearTransform;
  const headwearTransform: HeadwearTransform = {
    offsetY: typeof rawHeadwear?.offsetY === 'number' && Number.isFinite(rawHeadwear.offsetY) ? Math.max(-0.2, Math.min(0.25, rawHeadwear.offsetY)) : 0,
    offsetZ: typeof rawHeadwear?.offsetZ === 'number' && Number.isFinite(rawHeadwear.offsetZ) ? Math.max(-0.2, Math.min(0.2, rawHeadwear.offsetZ)) : 0,
    tiltX: typeof rawHeadwear?.tiltX === 'number' && Number.isFinite(rawHeadwear.tiltX) ? Math.max(-0.5, Math.min(0.5, rawHeadwear.tiltX)) : 0,
    scale: typeof rawHeadwear?.scale === 'number' && Number.isFinite(rawHeadwear.scale) ? Math.max(0.7, Math.min(1.4, rawHeadwear.scale)) : 1,
  };

  const playerName = raw.character?.name || defaults.character.name;
  const playerKey = getPlayerReadKey(playerName);

  const normalizedByPlayer: Record<string, TheoryBookId[]> = {};
  if (raw.readBooksByPlayer && typeof raw.readBooksByPlayer === 'object') {
    for (const [k, list] of Object.entries(raw.readBooksByPlayer)) {
      const cleanKey = getPlayerReadKey(k);
      normalizedByPlayer[cleanKey] = filterValidBookIds(list);
    }
  }

  const legacyFlatReadBooks = filterValidBookIds(raw.readBooks);
  const readBooks: TheoryBookId[] = Array.from(
    new Set([...(normalizedByPlayer[playerKey] || []), ...legacyFlatReadBooks])
  );
  normalizedByPlayer[playerKey] = readBooks;

  const rawTrack = raw.settings?.musicTrack as string | undefined;
  const normalizedTrack =
    rawTrack === 'nebula_pulse'
      ? 'seoul_neon'
      : rawTrack === 'orbit_lofi'
        ? 'western_sunset'
        : rawTrack === 'starlight_house'
          ? 'nusantara_gamelan'
          : rawTrack === 'cosmic_drift' ||
              rawTrack === 'nusantara_gamelan' ||
              rawTrack === 'seoul_neon' ||
              rawTrack === 'western_sunset' ||
              rawTrack === 'tension_protocol'
            ? rawTrack
            : defaults.settings.musicTrack;

  const hasExistingProgress =
    Boolean(raw.prologSeen) || validMissions.length > 0 || completedChapters.length > 0;

  const normalizedState: SaveState = {
    ...defaults,
    ...raw,
    character: {
      ...defaults.character,
      ...(raw.character || {}),
      headwearTransform,
    },
    settings: {
      ...defaults.settings,
      ...(raw.settings || {}),
      musicTrack: normalizedTrack,
    },
    creatorInfo: { ...defaults.creatorInfo, ...(raw.creatorInfo || {}) },
    unlockedItems,
    completedMissions: validMissions,
    unlockedChapter,
    completedChapters,
    completedCutscenes,
    missionScores,
    totalExp,
    readBooks,
    readBooksByPlayer: normalizedByPlayer,
    lockedCompletedRooms: [],
    prologSeen: hasExistingProgress,
    tutorialSeen: Boolean(raw.tutorialSeen) || hasExistingProgress,
    activeCutsceneCheckpoint: activeCheckpoint,
    pendingRewardChapter,
    chapterProgress,
  };

  // Re-compute & persist completed locked rooms automatically (excluding neverLock hub rooms)
  const savedLockedSet = new Set(
    Array.isArray(raw.lockedCompletedRooms)
      ? raw.lockedCompletedRooms.filter((r): r is RoomId => typeof r === 'string' && r in ROOMS)
      : []
  );
  const derivedLocked = getCompletedLockedRooms(normalizedState, null, null);
  derivedLocked.forEach((r) => savedLockedSet.add(r));
  // Ensure only legitimately completed lockable rooms remain in lockedCompletedRooms
  const validLockedSet = new Set(derivedLocked);
  normalizedState.lockedCompletedRooms = Array.from(savedLockedSet).filter((r) => validLockedSet.has(r));

  return normalizedState;
}

export function markBookReadInSaveState(state: SaveState, bookId: TheoryBookId): SaveState {
  if (!VALID_BOOK_IDS.has(bookId)) return state;
  const playerKey = getPlayerReadKey(state.character?.name);
  const prevByPlayer = state.readBooksByPlayer || {};
  const existing = Array.from(
    new Set([...(state.readBooks || []), ...(prevByPlayer[playerKey] || [])])
  );
  if (existing.includes(bookId) && prevByPlayer[playerKey]?.includes(bookId)) {
    return state;
  }
  const updated = Array.from(new Set([...existing, bookId]));
  return {
    ...state,
    readBooks: updated,
    readBooksByPlayer: {
      ...prevByPlayer,
      [playerKey]: updated,
    },
  };
}

/**
 * Derives which leaf rooms should currently have their doors sealed & locked:
 * - Never locks hub/corridor rooms (`neverLock: true`)
 * - Requires room's mission completed
 * - If room hosts a chapter NPC cutscene, waits until that cutscene is finished
 * - Waits until player is physically clear of the room & doorway so doors never slam on the player
 */
export function getCompletedLockedRooms(
  saveState: SaveState,
  inProgressRoomId: RoomId | null = null,
  playerPos?: { x: number; z: number } | null
): RoomId[] {
  const locked: RoomId[] = [];
  const cutsceneRoomLockGate: Partial<Record<RoomId, CutsceneCharacterId>> = {
    navigation_room: 'rex',
    global_exchange_room: 'bima',
    communication_room: 'fuzzy',
    world_economy_room: 'bob',
  };

  const persisted = new Set(saveState.lockedCompletedRooms || []);
  for (const room of Object.values(ROOMS)) {
    if (room.neverLock || !room.doorId || !room.missionId) continue;
    if (!saveState.completedMissions.includes(room.missionId)) continue;
    if (inProgressRoomId === room.id) continue;

    const requiredCs = cutsceneRoomLockGate[room.id];
    if (requiredCs && !saveState.completedCutscenes.includes(requiredCs)) {
      continue;
    }

    if (
      !persisted.has(room.id) &&
      playerPos &&
      !isPlayerClearOfRoomAndDoor(playerPos.x, playerPos.z, room.id)
    ) {
      continue;
    }

    locked.push(room.id);
  }

  return locked;
}

export function loadPersistedSaveState(): SaveState {
  try {
    const rawStr = localStorage.getItem(STORAGE_KEY);
    if (!rawStr) return getDefaultSaveState();
    const parsed = JSON.parse(rawStr) as Partial<SaveState>;
    const recovered = normalizeAndRecoverSaveState(parsed);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recovered));
    return recovered;
  } catch {
    return getDefaultSaveState();
  }
}

export function persistSaveStateNow(state: SaveState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}
