import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FastForward, Play, RotateCw, ShieldAlert, ShieldCheck, Sparkles } from 'lucide-react';
import { soundEngine } from './audio/soundEngine';
import { CustomizationScreen } from './components/CustomizationScreen';
import { CutsceneOverlay, RewardModal } from './components/CutsceneOverlay';
import { EndingScreen } from './components/EndingScreen';
import { FinalQuizModal } from './components/FinalQuizModal';
import { GameCanvas, HudLiveState } from './components/GameCanvas';
import { HomeScreen } from './components/HomeScreen';
import { HUD } from './components/HUD';
import { ImpostorChallengeModal } from './components/ImpostorChallengeModal';
import { InventoryModal } from './components/InventoryModal';
import { MatchResultModal } from './components/MatchResultModal';
import { MeetingModal } from './components/MeetingModal';
import { MissionModal } from './components/MissionModal';
import { MultiplayerLobby } from './components/MultiplayerLobby';
import { MusicSearchModal } from './components/MusicSearchModal';
import { getApiBaseUrl, RankingModal } from './components/RankingModal';
import { SecretTvModal } from './components/SecretTvModal';
import { TheoryBookModal } from './components/TheoryBookModal';
import { TutorialModal } from './components/TutorialModal';
import { VentModal } from './components/VentModal';
import {
  CHAPTER_INFO,
  CUTSCENES,
  EMOTE_MAP,
  evaluateSoloAchievementBadge,
  FIRST_MEETING_REACTIONS,
  getBatikMerahRequirements,
  IMPOSTOR_CHALLENGES,
  INVENTORY_ITEMS,
  MISSION_META,
  pickHigherSoloBadge,
} from './data/gameData';
import {
  getChapterLockedDoorIds,
  getChapterLockedRooms,
  ROOMS,
  VENTS,
} from './data/stationLayout';
import {
  areRequiredBooksRead,
  getMissionBookProgress,
  getUnreadBooksForMission,
  THEORY_BOOK_MAP,
} from './data/theoryBooks';
import { useMultiplayerClient } from './multiplayer/wsClient';
import { useVoiceChat } from './multiplayer/useVoiceChat';
import { HudVoiceControls } from './components/HUD';
import {
  BodyAccessoryId,
  ChapterId,
  CharacterAnimState,
  CharacterConfig,
  CostumeStyleId,
  CutsceneCharacterId,
  CutsceneCheckpoint,
  CutsceneLine,
  EliminationEvent,
  EmoteId,
  GameMode,
  GameSettings,
  HeadAccessoryId,
  HostSettings,
  ImpostorChallenge,
  InventoryItemDef,
  MissionId,
  MultiplayerRole,
  NeckAccessoryId,
  NpcCharacterId,
  RoomId,
  SaveState,
  ScreenView,
  TheoryBookId,
} from './types/game';
import {
  CHAPTER_UNLOCKED_EMOTES,
  createChapterReplayState,
  generateSoloRunId,
  getChapterCutsceneId,
  getCompletedLockedRooms,
  getDefaultSaveState,
  loadPersistedSaveState,
  markBookReadInSaveState,
  normalizeAndRecoverSaveState,
  persistSaveStateNow,
  pickChapterRewardOnce,
  STARTER_EMOTE_IDS,
  STORAGE_KEY,
} from './utils/progressionRecovery';

const LOCAL_PLAYER_ID_KEY = 'globalus_local_player_id_v1';

function getOrCreateLocalPlayerId(): string {
  try {
    const existing = localStorage.getItem(LOCAL_PLAYER_ID_KEY);
    if (existing && existing.trim().length >= 4) return existing;
    const created = `plr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(LOCAL_PLAYER_ID_KEY, created);
    return created;
  } catch {
    return `plr_${Math.random().toString(36).slice(2, 10)}`;
  }
}

export default function App() {
  const [saveState, setSaveState] = useState<SaveState>(loadPersistedSaveState);
  const saveStateRef = useRef<SaveState>(saveState);
  saveStateRef.current = saveState;

  const [localPlayerId] = useState<string>(getOrCreateLocalPlayerId);
  const [view, setView] = useState<ScreenView>('home');
  const [gameMode, setGameMode] = useState<GameMode>('solo');
  const [customizeReturnView, setCustomizeReturnView] = useState<ScreenView>('home');

  const [isPaused, setIsPaused] = useState(false);
  const [cameraMode, setCameraMode] = useState<'360' | 'topdown'>('360');
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [showRankingModal, setShowRankingModal] = useState(false);
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [secretTvOpen, setSecretTvOpen] = useState(false);
  const [activeMission, setActiveMission] = useState<MissionId | null>(null);
  const [activeImpChallenge, setActiveImpChallenge] = useState<ImpostorChallenge | null>(null);
  const [activeVentId, setActiveVentId] = useState<string | null>(null);
  const [activeTheoryBook, setActiveTheoryBook] = useState<TheoryBookId | null>(null);

  const [activeCutscene, setActiveCutscene] = useState<CutsceneCharacterId | null>(null);
  const [activeCutsceneInitialLine, setActiveCutsceneInitialLine] = useState(0);
  const [activeCutsceneLine, setActiveCutsceneLine] = useState<CutsceneLine | null>(null);
  const [cutsceneResumePrompt, setCutsceneResumePrompt] = useState<CutsceneCheckpoint | null>(null);

  const [pendingReward, setPendingReward] = useState<{
    chapter: ChapterId;
    rewardItem: InventoryItemDef;
    specialItem?: InventoryItemDef;
    titleLabel?: string;
    subtitleLabel?: string;
    continueLabel?: string;
    isSpecialBonus?: boolean;
  } | null>(null);
  const [pendingBatikMerahModal, setPendingBatikMerahModal] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [tutorialModal, setTutorialModal] = useState<{
    open: boolean;
    startPendingSolo: boolean;
  }>({ open: false, startPendingSolo: false });
  const [chapterIntro, setChapterIntro] = useState<ChapterId | null>(null);
  const [roleRevealBanner, setRoleRevealBanner] = useState<MultiplayerRole | null>(null);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);
  const [latestEliminationEvent, setLatestEliminationEvent] = useState<EliminationEvent | null>(null);
  const [stasisOverlayEvent, setStasisOverlayEvent] = useState<EliminationEvent | null>(null);
  const seenElimIdsRef = useRef<Set<string>>(new Set());

  const [resetCameraTick, setResetCameraTick] = useState(0);
  const [teleportPos, setTeleportPos] = useState<{
    x: number;
    z: number;
    tick: number;
    skipAnim?: boolean;
    yaw?: number;
  } | null>(null);
  const joystickInputRef = useRef({ x: 0, y: 0 });
  const triggerJumpRef = useRef<(() => void) | null>(null);
  const [activeEmote, setActiveEmote] = useState<EmoteId | null>(null);
  const [activeEmoteStartedAt, setActiveEmoteStartedAt] = useState(0);
  const emoteTimerRef = useRef<number | null>(null);

  // Multiplayer completed lists per match
  const [mpDoneMissions, setMpDoneMissions] = useState<string[]>([]);
  const [mpDoneImpChallenges, setMpDoneImpChallenges] = useState<string[]>([]);

  const remoteMoveBufferRef = useRef<
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
  >(new Map());

  const rtcSignalHandlerRef = useRef<
    (msg: { fromId: string; signalType: 'offer' | 'answer' | 'ice'; data: unknown }) => void
  >(() => {});
  const mpPlayerIdRef = useRef<string | null>(null);

  const mp = useMultiplayerClient(
    (move) => {
      const prev = remoteMoveBufferRef.current.get(move.playerId);
      remoteMoveBufferRef.current.set(move.playerId, {
        x: move.x,
        y: move.y,
        z: move.z,
        yaw: move.yaw,
        animState: move.animState,
        inVent: move.inVent,
        activeEmote: move.activeEmote !== undefined ? move.activeEmote : prev?.activeEmote,
      });
    },
    (em) => {
      const prev = remoteMoveBufferRef.current.get(em.playerId);
      if (prev) {
        remoteMoveBufferRef.current.set(em.playerId, { ...prev, activeEmote: em.emoteId });
      }
    },
    (sig) => {
      rtcSignalHandlerRef.current(sig);
    },
    (ev) => {
      if (seenElimIdsRef.current.has(ev.eventId)) return;
      seenElimIdsRef.current.add(ev.eventId);
      setLatestEliminationEvent(ev);
      if (ev.victimId === mpPlayerIdRef.current) {
        setActiveMission(null);
        setActiveTheoryBook(null);
        setActiveVentId(null);
        setActiveImpChallenge(null);
        setStasisOverlayEvent(ev);
        window.setTimeout(() => {
          setStasisOverlayEvent((cur) => (cur?.eventId === ev.eventId ? null : cur));
        }, 1500);
      }
    }
  );
  mpPlayerIdRef.current = mp.playerId;

  const meInMpForVoice = useMemo(() => {
    if (gameMode !== 'multiplayer' || !mp.snapshot || !mp.playerId) return null;
    return mp.snapshot.players.find((p) => p.id === mp.playerId) || null;
  }, [gameMode, mp.snapshot, mp.playerId]);

  const voice = useVoiceChat({
    enabled:
      gameMode === 'multiplayer' &&
      mp.isOnline &&
      Boolean(mp.roomCode) &&
      (view === 'playing' || view === 'multiplayer_lobby' || view === 'customize'),
    voiceFeatureEnabled: saveState.settings.voiceEnabled !== false,
    voiceVolume: saveState.settings.voiceVolume ?? 0.9,
    myId: mp.playerId,
    players: mp.snapshot?.players || [],
    mpPhase: mp.snapshot?.phase,
    amAlive: Boolean(meInMpForVoice?.alive ?? true),
    sendVoiceState: mp.sendVoiceState,
    sendRtcSignal: mp.sendRtcSignal,
  });
  rtcSignalHandlerRef.current = voice.handleRtcSignal;

  const voiceControls: HudVoiceControls = useMemo(
    () => ({
      micOn: voice.micOn,
      muted: voice.muted,
      speaking: voice.speaking,
      micError: voice.micError,
      voiceStatus: voice.voiceStatus,
      voiceStatusLabel: voice.voiceStatusLabel,
      permissionState: voice.permissionState,
      permissionPromptOpen: voice.permissionPromptOpen,
      audioInputs: voice.audioInputs,
      selectedDeviceId: voice.selectedDeviceId,
      connectedPeerIds: voice.connectedPeerIds,
      locallyMutedIds: voice.locallyMutedIds,
      onToggleMic: () => {
        void voice.toggleMic();
      },
      onToggleMute: voice.toggleMute,
      onToggleLocalMutePeer: voice.toggleLocalMutePeer,
      onClearMicError: voice.clearMicError,
      onConfirmMicPermission: voice.confirmMicPermission,
      onDismissMicPermission: voice.dismissMicPermission,
      onSelectDevice: voice.selectDevice,
      onRetryVoice: voice.retryVoiceConnections,
    }),
    [voice]
  );

  const [hud, setHud] = useState<HudLiveState>({
    playerX: 0,
    playerZ: 3.2,
    playerYaw: Math.PI,
    cameraYaw: 0,
    currentRoomId: 'central_lobby',
    currentRoomName: 'Central Lobby',
    isTouchDevice:
      typeof window !== 'undefined' &&
      Boolean(window.matchMedia?.('(pointer: coarse)').matches),
    nearbyTerminal: null,
    nearbyBook: null,
    nearbyVent: null,
    nearbyStasisPod: null,
    nearbyEmergencyConsole: false,
    nearbySecretTv: false,
    nearbyCustomizeTerminal: false,
    nearbyAuliaInteract: null,
    nearbyEliminateTarget: null,
  });

  const [isPortraitMobile, setIsPortraitMobile] = useState(false);
  const [dismissPortrait, setDismissPortrait] = useState(false);

  useEffect(() => {
    const checkOrient = () => {
      setIsPortraitMobile(window.innerWidth < 760 && window.innerHeight > window.innerWidth);
    };
    checkOrient();
    window.addEventListener('resize', checkOrient);
    return () => window.removeEventListener('resize', checkOrient);
  }, []);

  useEffect(() => {
    persistSaveStateNow(saveState);
    soundEngine.updateSettings(saveState.settings);
  }, [saveState]);

  useEffect(() => {
    const mpPhase = gameMode === 'multiplayer' ? mp.snapshot?.phase : null;
    if (view === 'playing') {
      if (mpPhase === 'meeting' && mp.snapshot?.meeting) {
        soundEngine.setMusicMode('discussion');
      } else if (mpPhase === 'ended' && mp.snapshot?.matchResult) {
        soundEngine.setMusicMode('none');
      } else if (activeCutscene) {
        soundEngine.setMusicMode('cutscene');
      } else {
        soundEngine.setMusicMode('gameplay');
      }
    } else if (view === 'ending') {
      soundEngine.setMusicMode('none');
    } else {
      soundEngine.setMusicMode('home');
    }
    soundEngine.setCutsceneDucking(Boolean(activeCutscene || chapterIntro));
  }, [view, activeCutscene, chapterIntro, gameMode, mp.snapshot]);

  const showNotice = useCallback((msg: string) => {
    setInfoNotice(msg);
    window.setTimeout(() => {
      setInfoNotice((cur) => (cur === msg ? null : cur));
    }, 3800);
  }, []);

  const syncRankingToServer = useCallback(
    async (targetState?: SaveState): Promise<boolean> => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) return false;
      const st = targetState || saveStateRef.current;
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 5000);
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/rankings/submit`, {
          method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId: localPlayerId,
            playerName: st.character.name,
            avatarColor: st.character.color,
            unlockedItems: st.unlockedItems,
            unlockedEmotes: st.unlockedEmotes || STARTER_EMOTE_IDS,
            completedChapters: st.completedChapters.length,
            totalExp: st.totalExp,
            bestCompletionMs: st.bestCompletionMs ?? null,
          }),
        });
        if (!res.ok) return false;
        const cur = saveStateRef.current;
        if (cur.pendingRankingSync) {
          const cleared: SaveState = { ...cur, pendingRankingSync: false };
          saveStateRef.current = cleared;
          setSaveState(cleared);
          persistSaveStateNow(cleared);
        }
        return true;
      } catch {
        return false;
      } finally {
        window.clearTimeout(timer);
      }
    },
    [localPlayerId]
  );

  useEffect(() => {
    if (saveState.pendingRankingSync && (typeof navigator === 'undefined' || navigator.onLine)) {
      void syncRankingToServer(saveState);
    }
    const handleOnline = () => {
      const cur = saveStateRef.current;
      if (cur.pendingRankingSync) {
        void syncRankingToServer(cur);
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [syncRankingToServer, saveState.pendingRankingSync]);

  // Helper: evaluate & unlock Batik SMADA Merah whenever all 5 cumulative conditions are met (#41)
  const applyBatikMerahCheck = useCallback(
    (state: SaveState): { nextState: SaveState; newlyUnlocked: boolean } => {
      if (state.unlockedItems.includes('batik_smada_merah')) {
        return { nextState: state, newlyUnlocked: false };
      }
      const reqs = getBatikMerahRequirements(state);
      if (!reqs.allMet) {
        return { nextState: state, newlyUnlocked: false };
      }
      const nextState: SaveState = {
        ...state,
        unlockedItems: [...state.unlockedItems, 'batik_smada_merah'],
        totalExp: state.totalExp + 300,
        pendingRankingSync: true,
      };
      return { nextState, newlyUnlocked: true };
    },
    []
  );

  // React to Multiplayer server phase transitions (Playable 3D Waiting Lobby, Match Start, Post-Meeting Respawn, Return to Lobby)
  const prevMpPhaseRef = useRef<string | null>(null);
  useEffect(() => {
    if (gameMode !== 'multiplayer' || !mp.snapshot) {
      prevMpPhaseRef.current = null;
      return;
    }

    const phase = mp.snapshot.phase;
    const prev = prevMpPhaseRef.current;
    prevMpPhaseRef.current = phase;
    const me = mp.snapshot.players.find((p) => p.id === mp.playerId);

    if (phase === 'lobby') {
      // Entering room from Create/Join screen OR returning from finished match -> Playable 3D Central Lobby (#47)
      if (view === 'multiplayer_lobby' || (prev && prev !== 'lobby')) {
        remoteMoveBufferRef.current.clear();
        seenElimIdsRef.current.clear();
        setLatestEliminationEvent(null);
        setStasisOverlayEvent(null);
        setMpDoneMissions([]);
        setMpDoneImpChallenges([]);
        setActiveMission(null);
        setActiveImpChallenge(null);
        setActiveVentId(null);
        setIsPaused(false);
        setView('playing');
        if (me) {
          setTeleportPos({ x: me.x, z: me.z, yaw: me.yaw, tick: Date.now(), skipAnim: true });
        }
      }
    } else if (
      prev === 'lobby' ||
      view === 'multiplayer_lobby'
    ) {
      remoteMoveBufferRef.current.clear();
      seenElimIdsRef.current.clear();
      setLatestEliminationEvent(null);
      setStasisOverlayEvent(null);
      setMpDoneMissions(mp.snapshot.myCompletedMissions || []);
      setMpDoneImpChallenges([]);
      setActiveMission(null);
      setActiveImpChallenge(null);
      setActiveVentId(null);
      setIsPaused(false);
      setView('playing');
      soundEngine.playGameStart();

      if (me) {
        setTeleportPos({ x: me.x, z: me.z, yaw: me.yaw, tick: Date.now(), skipAnim: true });
      }
      if (mp.role && prev === 'lobby') {
        setRoleRevealBanner(mp.role);
        window.setTimeout(() => setRoleRevealBanner(null), 4500);
      }
    } else if (phase === 'playing' && prev === 'meeting') {
      if (me) {
        setTeleportPos({ x: me.x, z: me.z, yaw: me.yaw, tick: Date.now(), skipAnim: true });
      }
    }
  }, [gameMode, mp.snapshot, mp.playerId, mp.role, view]);

  // Keep local completed mission checklist synchronized with server snapshot (supports reconnect recovery, #46)
  useEffect(() => {
    if (gameMode !== 'multiplayer' || !mp.snapshot) return;
    if (mp.snapshot.phase === 'lobby') {
      setMpDoneMissions((prev) => (prev.length > 0 ? [] : prev));
      return;
    }
    const serverMissions = mp.snapshot.myCompletedMissions || [];
    if (serverMissions.length > 0) {
      setMpDoneMissions((prev) => {
        const merged = Array.from(new Set([...prev, ...serverMissions]));
        return merged.length === prev.length ? prev : merged;
      });
    }
  }, [gameMode, mp.snapshot]);

  // Track completed multiplayer matches once per matchId & check cumulative Batik SMADA Merah (#41)
  useEffect(() => {
    if (gameMode !== 'multiplayer' || mp.snapshot?.phase !== 'ended' || !mp.snapshot.matchResult) {
      return;
    }
    const res = mp.snapshot.matchResult;
    const matchKey =
      res.matchId || `${mp.snapshot.roomCode}_${res.winner}_${res.crewMissionDone}_${res.players.length}`;
    const cur = saveStateRef.current;
    const prevIds = cur.countedMatchIds || [];
    if (prevIds.includes(matchKey)) return;

    const incremented: SaveState = {
      ...cur,
      multiplayerCompletions: (cur.multiplayerCompletions ?? 0) + 1,
      countedMatchIds: [...prevIds, matchKey].slice(-50),
      totalExp: cur.totalExp + 60,
      pendingRankingSync: true,
    };
    const { nextState, newlyUnlocked } = applyBatikMerahCheck(incremented);
    saveStateRef.current = nextState;
    setSaveState(nextState);
    persistSaveStateNow(nextState);
    void syncRankingToServer(nextState);
    if (newlyUnlocked) {
      setPendingBatikMerahModal(true);
      showNotice('SELAMAT! Seluruh 5 syarat terpenuhi — Kostum Batik SMADA Merah terbuka!');
    }
  }, [gameMode, mp.snapshot?.phase, mp.snapshot?.matchResult, mp.snapshot?.roomCode, applyBatikMerahCheck, syncRankingToServer, showNotice]);

  // Show queued Batik SMADA Merah reward modal when no other blocking modal is open (#41)
  useEffect(() => {
    if (!pendingBatikMerahModal) return;
    const mpMeetingActive =
      gameMode === 'multiplayer' && mp.snapshot?.phase === 'meeting' && Boolean(mp.snapshot.meeting);
    const mpResultActive =
      gameMode === 'multiplayer' && mp.snapshot?.phase === 'ended' && Boolean(mp.snapshot.matchResult);
    const hasBlockingModal =
      Boolean(pendingReward) ||
      Boolean(activeCutscene) ||
      Boolean(chapterIntro) ||
      Boolean(cutsceneResumePrompt) ||
      quizOpen ||
      mpMeetingActive ||
      mpResultActive;
    if (hasBlockingModal) return;
    if (view !== 'playing' && view !== 'ending' && view !== 'home') return;

    const merahItem = INVENTORY_ITEMS.find((i) => i.id === 'batik_smada_merah');
    setPendingBatikMerahModal(false);
    if (merahItem) {
      setPendingReward({
        chapter: 5,
        rewardItem: merahItem,
        titleLabel: 'MASTER KOLEKTOR GLOBALUS!',
        subtitleLabel: '5 Syarat Kumulatif Terpenuhi — Batik SMADA Merah Terbuka',
        continueLabel: 'LANJUT BERMAIN',
        isSpecialBonus: true,
      });
    }
  }, [
    pendingBatikMerahModal,
    pendingReward,
    activeCutscene,
    chapterIntro,
    cutsceneResumePrompt,
    quizOpen,
    view,
    gameMode,
    mp.snapshot?.phase,
    mp.snapshot?.meeting,
    mp.snapshot?.matchResult,
  ]);

  // Sync vent teleport coordinate from server
  useEffect(() => {
    if (mp.ventTeleportTick) {
      setTeleportPos(mp.ventTeleportTick);
    }
  }, [mp.ventTeleportTick]);

  // Show eliminated notice once
  useEffect(() => {
    if (mp.eliminatedNotice) {
      soundEngine.playEliminate();
      showNotice(mp.eliminatedNotice);
      mp.clearEliminatedNotice();
    }
  }, [mp.eliminatedNotice, mp, showNotice]);

  // ESC pauses gameplay
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.code === 'Escape' &&
        view === 'playing' &&
        !activeCutscene &&
        !cutsceneResumePrompt &&
        !activeMission &&
        !activeImpChallenge &&
        !activeVentId &&
        !activeTheoryBook &&
        !quizOpen &&
        !inventoryOpen &&
        !showRankingModal &&
        !showMusicModal &&
        !secretTvOpen &&
        !tutorialModal.open
      ) {
        setIsPaused((p) => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    view,
    activeCutscene,
    cutsceneResumePrompt,
    activeMission,
    activeImpChallenge,
    activeVentId,
    activeTheoryBook,
    quizOpen,
    inventoryOpen,
    showRankingModal,
    showMusicModal,
    secretTvOpen,
    tutorialModal.open,
  ]);

  const enterSoloGameplay = useCallback(
    (latest: SaveState) => {
      soundEngine.playGameStart();
      if ((!latest.runStartedAt && !latest.completedChapters.includes(5)) || !latest.activeSoloRunId) {
        const started: SaveState = {
          ...latest,
          runStartedAt: latest.runStartedAt || Date.now(),
          activeSoloRunId: latest.activeSoloRunId || generateSoloRunId(),
        };
        saveStateRef.current = started;
        setSaveState(started);
        persistSaveStateNow(started);
        latest = started;
      }
      setGameMode('solo');
      setIsPaused(false);
      setTeleportPos({ x: 0, z: 3.2, tick: Date.now(), skipAnim: true });
      setView('playing');

      if (latest.activeCutsceneCheckpoint) {
        if (
          latest.activeCutsceneCheckpoint.cutsceneId === 'prolog' &&
          latest.activeCutsceneCheckpoint.lineIndex === 0
        ) {
          setActiveCutsceneInitialLine(0);
          setActiveCutscene('prolog');
          return;
        }
        setCutsceneResumePrompt(latest.activeCutsceneCheckpoint);
        return;
      }

      if (latest.pendingRewardChapter) {
        const chap = latest.pendingRewardChapter;
        const chapInfo = CHAPTER_INFO[chap];
        const ownedRewardId = chapInfo.rewardPool.find((id) => latest.unlockedItems.includes(id));
        const rewardItem =
          INVENTORY_ITEMS.find((i) => i.id === ownedRewardId) ||
          INVENTORY_ITEMS.find((i) => i.id === chapInfo.rewardPool[0])!;
        const specialItem = INVENTORY_ITEMS.find((i) => i.id === chapInfo.specialItemId)!;
        setPendingReward({ chapter: chap, rewardItem, specialItem });
        return;
      }

      if (!latest.prologSeen && latest.completedMissions.length === 0) {
        setActiveCutsceneInitialLine(0);
        setActiveCutscene('prolog');
      } else if (
        latest.prologSeen &&
        latest.completedMissions.length === 0 &&
        !(latest.readBooks || []).includes('book_2_karakteristik')
      ) {
        setTeleportPos({ x: -35.4, z: 3.25, tick: Date.now(), skipAnim: true });
        showNotice('Tekan [E] atau Tap Buku untuk membuka materi pertama!');
      } else if (latest.completedMissions.length === 0) {
        setChapterIntro(1);
      } else {
        for (const chap of [2, 3, 4, 5] as ChapterId[]) {
          const prevChap = (chap - 1) as ChapterId;
          if (
            latest.completedChapters.includes(prevChap) &&
            !latest.completedChapters.includes(chap) &&
            CHAPTER_INFO[chap].missions.every((m) => !latest.completedMissions.includes(m))
          ) {
            setChapterIntro(chap);
            break;
          }
        }
      }
    },
    [showNotice]
  );

  const handlePlaySolo = () => {
    soundEngine.unlock();
    const latest = normalizeAndRecoverSaveState(saveStateRef.current);
    saveStateRef.current = latest;
    setSaveState(latest);
    persistSaveStateNow(latest);

    if (
      !latest.tutorialSeen &&
      !latest.prologSeen &&
      latest.completedMissions.length === 0 &&
      !latest.activeCutsceneCheckpoint
    ) {
      setTutorialModal({ open: true, startPendingSolo: true });
      return;
    }

    enterSoloGameplay(latest);
  };

  const handleCloseTutorial = () => {
    const startPending = tutorialModal.startPendingSolo;
    setTutorialModal({ open: false, startPendingSolo: false });
    const prev = saveStateRef.current;
    const next: SaveState = prev.tutorialSeen ? prev : { ...prev, tutorialSeen: true };
    if (!prev.tutorialSeen) {
      saveStateRef.current = next;
      setSaveState(next);
      persistSaveStateNow(next);
    }
    if (startPending) {
      enterSoloGameplay(next);
    }
  };

  const handleExitMultiplayerToSolo = () => {
    soundEngine.setVoiceDucking(false);
    setActiveMission(null);
    setActiveImpChallenge(null);
    setActiveVentId(null);
    setActiveTheoryBook(null);
    setIsPaused(false);
    mp.leaveRoom();
    mp.disconnect();
    const latest = normalizeAndRecoverSaveState(saveStateRef.current);
    saveStateRef.current = latest;
    setSaveState(latest);
    persistSaveStateNow(latest);
    enterSoloGameplay(latest);
  };

  const handleOpenMultiplayer = () => {
    soundEngine.unlock();
    if (!mp.isOnline) {
      showNotice('Mode Offline aktif. Multiplayer Online membutuhkan koneksi internet.');
      return;
    }
    setGameMode('multiplayer');
    mp.connect(false);
    setView('multiplayer_lobby');
  };

  const meInMp = useMemo(() => {
    if (gameMode !== 'multiplayer' || !mp.snapshot || !mp.playerId) return null;
    return mp.snapshot.players.find((p) => p.id === mp.playerId) || null;
  }, [gameMode, mp.snapshot, mp.playerId]);

  const amAlive = gameMode === 'solo' ? true : Boolean(meInMp?.alive ?? true);

  const activeMissionRoomId = useMemo<RoomId | null>(
    () => (activeMission ? MISSION_META[activeMission].roomId : null),
    [activeMission]
  );

  const lockedRooms = useMemo<RoomId[]>(() => {
    if (gameMode !== 'solo') return [];
    return getCompletedLockedRooms(saveState, activeMissionRoomId, {
      x: hud.playerX,
      z: hud.playerZ,
    });
  }, [gameMode, saveState, activeMissionRoomId, hud.playerX, hud.playerZ]);

  const chapterLockedDoorIds = useMemo<string[]>(() => {
    if (gameMode !== 'solo') return [];
    return getChapterLockedDoorIds(saveState.unlockedChapter, saveState.completedChapters.length);
  }, [gameMode, saveState.unlockedChapter, saveState.completedChapters.length]);

  const chapterLockedRooms = useMemo<RoomId[]>(() => {
    if (gameMode !== 'solo') return [];
    return getChapterLockedRooms(saveState.unlockedChapter, saveState.completedChapters.length);
  }, [gameMode, saveState.unlockedChapter, saveState.completedChapters.length]);

  const prevLockedRoomsRef = useRef<Set<RoomId>>(new Set(lockedRooms));
  useEffect(() => {
    if (view !== 'playing' || gameMode !== 'solo') {
      prevLockedRoomsRef.current = new Set(lockedRooms);
      return;
    }
    const prev = prevLockedRoomsRef.current;
    const newlyLocked = lockedRooms.filter((r) => !prev.has(r));
    if (newlyLocked.length > 0) {
      const names = newlyLocked.map((r) => ROOMS[r].name).join(', ');
      showNotice(`Ruangan ${names} selesai & pintu otomatis dikunci.`);
    }
    prevLockedRoomsRef.current = new Set(lockedRooms);

    // Persist newly completed-locked rooms so lock state remains across refresh/restart
    const curSaved = saveStateRef.current.lockedCompletedRooms || [];
    const missing = lockedRooms.filter((r) => !ROOMS[r].neverLock && !curSaved.includes(r));
    if (missing.length > 0) {
      const merged = Array.from(new Set([...curSaved, ...missing]));
      const next: SaveState = { ...saveStateRef.current, lockedCompletedRooms: merged };
      saveStateRef.current = next;
      setSaveState(next);
      persistSaveStateNow(next);
    }
  }, [lockedRooms, view, gameMode, showNotice]);

  const handleOpenBook = useCallback((bookId: TheoryBookId) => {
    // Opening a book puts the room in "Sedang Membaca" without prematurely marking it completed.
    setActiveTheoryBook(bookId);
  }, []);

  const handleMarkBookRead = useCallback(
    (bookId: TheoryBookId) => {
      const prev = saveStateRef.current;
      const next = markBookReadInSaveState(prev, bookId);
      saveStateRef.current = next;
      setSaveState(next);
      persistSaveStateNow(next);

      const book = THEORY_BOOK_MAP[bookId];
      const room = book ? ROOMS[book.roomId] : null;
      if (book && room?.missionId) {
        const prog = getMissionBookProgress(room.missionId, next.readBooks || []);
        if (prog.allRead) {
          showNotice(
            `Materi "${book.topicLabel}" selesai dibaca! Akses kuis di ${room.name} kini terbuka.`
          );
        } else {
          showNotice(
            `Materi "${book.topicLabel}" selesai dibaca (${prog.readCount}/${prog.totalCount} buku di ${room.name}). Baca buku lainnya di ruangan ini untuk membuka kuis.`
          );
        }
      } else if (book) {
        showNotice(`Materi "${book.topicLabel}" selesai dibaca!`);
      }
    },
    [showNotice]
  );

  const handleInteractTerminal = useCallback(
    (roomId: RoomId, missionId?: MissionId) => {
      const currentReadBooks = saveStateRef.current.readBooks || [];

      if (gameMode === 'multiplayer') {
        if (mp.snapshot?.phase === 'lobby') {
          showNotice('Pertandingan belum dimulai! Tekan MULAI di panel Lobby untuk memulai permainan.');
          return;
        }
        if (roomId === 'central_lobby') {
          if (amAlive) {
            mp.callMeeting('emergency');
          } else {
            showNotice('Mode Penonton tidak dapat memanggil Emergency Meeting.');
          }
          return;
        }

        if (mp.role === 'impostor') {
          const impChallenge = IMPOSTOR_CHALLENGES.find((c) => c.roomId === roomId);
          if (impChallenge) {
            soundEngine.playImpostorAction();
            setActiveImpChallenge(impChallenge);
          } else {
            showNotice(
              `${ROOMS[roomId].name}: Gunakan ruangan Misi Rahasia Impostor (Comm, Navigation, Exchange, World Econ) atau tekan [E] di Vent.`
            );
          }
          return;
        }

        if (missionId) {
          if (!areRequiredBooksRead(missionId, currentReadBooks)) {
            const unread = getUnreadBooksForMission(missionId, currentReadBooks);
            const unreadNames = unread.map((b) => `"${b.title}"`).join(' & ');
            soundEngine.playError();
            showNotice(
              `Kuis masih terkunci! Baca buku teori ${unreadNames} di ${ROOMS[roomId].name} dan tekan "Selesai Membaca" terlebih dahulu.`
            );
            return;
          }
          soundEngine.playMissionStart();
          setActiveMission(missionId);
        } else {
          showNotice(`${ROOMS[roomId].name}: Pantau pergerakan kru dan waspadai sabotase.`);
        }
        return;
      }

      // SOLO MODE
      if (roomId === 'earth_observation_room') {
        if (saveState.completedChapters.length >= 5) {
          soundEngine.playMissionStart();
          setQuizOpen(true);
        } else {
          showNotice(
            `Terminal Evaluasi Akhir terkunci. Selesaikan seluruh 5 Chapter terlebih dahulu (${saveState.completedChapters.length}/5 selesai).`
          );
        }
        return;
      }

      if (missionId) {
        const meta = MISSION_META[missionId];
        if (meta.chapter > saveState.unlockedChapter) {
          soundEngine.playError();
          showNotice(
            `Misi Chapter ${meta.chapter} masih terkunci! Selesaikan seluruh misi & cutscene Chapter ${saveState.unlockedChapter} terlebih dahulu.`
          );
          return;
        }
        if (!areRequiredBooksRead(missionId, currentReadBooks)) {
          const unread = getUnreadBooksForMission(missionId, currentReadBooks);
          const unreadNames = unread.map((b) => `"${b.title}"`).join(' & ');
          soundEngine.playError();
          showNotice(
            `Kuis masih terkunci! Baca buku teori ${unreadNames} di ${ROOMS[roomId].name} dan tekan "Selesai Membaca" terlebih dahulu.`
          );
          return;
        }
        soundEngine.playMissionStart();
        setActiveMission(missionId);
        return;
      }

      const done = saveState.completedMissions.length;
      showNotice(
        `${ROOMS[roomId].name}: Progres Global Network ${done}/10 Misi selesai (Chapter ${saveState.unlockedChapter}/5).`
      );
    },
    [
      gameMode,
      amAlive,
      mp,
      saveState.completedMissions.length,
      saveState.unlockedChapter,
      saveState.completedChapters.length,
      showNotice,
    ]
  );

  const handleInteractVent = useCallback(
    (ventId: string) => {
      const vDef = VENTS.find((v) => v.id === ventId);
      if (gameMode === 'solo' && vDef) {
        const rm = ROOMS[vDef.roomId];
        if (rm && !rm.neverLock && lockedRooms.includes(vDef.roomId)) {
          soundEngine.playError();
          showNotice(`${rm.name} sudah selesai & terkunci otomatis (jalur ventilasi ditutup).`);
          return;
        }
        if (chapterLockedRooms.includes(vDef.roomId)) {
          soundEngine.playError();
          showNotice('Complete the previous chapter to unlock this room.');
          return;
        }
      }
      if (gameMode === 'multiplayer' && mp.role === 'impostor' && amAlive) {
        mp.setVentState(true);
      }
      setActiveVentId(ventId);
    },
    [gameMode, mp, amAlive, lockedRooms, chapterLockedRooms, showNotice]
  );

  const handleCloseVent = () => {
    if (gameMode === 'multiplayer' && mp.role === 'impostor') {
      mp.setVentState(false);
    }
    setActiveVentId(null);
  };

  const handleSelectVentDest = (toVentId: string) => {
    if (!activeVentId) return;
    const destVent = VENTS.find((v) => v.id === toVentId);
    if (gameMode === 'solo' && destVent) {
      const rm = ROOMS[destVent.roomId];
      if (rm && !rm.neverLock && lockedRooms.includes(destVent.roomId)) {
        soundEngine.playError();
        showNotice(`${rm.name} sudah selesai & terkunci otomatis!`);
        return;
      }
      if (chapterLockedRooms.includes(destVent.roomId)) {
        soundEngine.playError();
        showNotice('Complete the previous chapter to unlock this room.');
        return;
      }
    }
    if (gameMode === 'multiplayer') {
      mp.useVent(activeVentId, toVentId);
    }
    setActiveVentId(null);
  };

  const handleTriggerEmote = useCallback(
    (emoteId: EmoteId) => {
      if (emoteTimerRef.current) {
        window.clearTimeout(emoteTimerRef.current);
        emoteTimerRef.current = null;
      }
      soundEngine.playEmote();
      setActiveEmote(emoteId);
      setActiveEmoteStartedAt(performance.now());
      if (gameMode === 'multiplayer') {
        mp.sendEmote(emoteId);
      }
      const dur = EMOTE_MAP[emoteId]?.durationMs || 2800;
      emoteTimerRef.current = window.setTimeout(() => {
        setActiveEmote(null);
        emoteTimerRef.current = null;
        if (gameMode === 'multiplayer') {
          mp.sendEmote(null);
        }
      }, dur);
    },
    [gameMode, mp]
  );

  const handleCancelEmote = useCallback(() => {
    if (emoteTimerRef.current) {
      window.clearTimeout(emoteTimerRef.current);
      emoteTimerRef.current = null;
    }
    setActiveEmote((cur) => {
      if (cur && gameMode === 'multiplayer') {
        mp.sendEmote(null);
      }
      return null;
    });
  }, [gameMode, mp]);

  const handleLockedDoorBlocked = useCallback(
    (reason: 'chapter_locked' | 'completed_locked') => {
      if (gameMode === 'multiplayer' && mp.snapshot?.phase === 'lobby') {
        showNotice('Pintu sektor stasiun terkunci selama di Lobby Multiplayer. Tekan MULAI untuk memulai permainan!');
        return;
      }
      if (reason === 'chapter_locked') {
        showNotice('Complete the previous chapter to unlock this room.');
      } else {
        showNotice('Ruangan ini sudah selesai & terkunci otomatis.');
      }
    },
    [gameMode, mp.snapshot?.phase, showNotice]
  );

  // Trigger Aulia Chapter 4+ Secret Quest automatically once player enters Central Lobby in Chapter 4+ (#39)
  useEffect(() => {
    if (view !== 'playing' || gameMode !== 'solo') return;
    if (hud.currentRoomId !== 'central_lobby') return;
    if (saveState.unlockedChapter < 4) return;
    const stage = saveState.auliaSecretQuest?.stage || 'not_started';
    if (stage !== 'not_started') return;
    if (
      activeCutscene ||
      cutsceneResumePrompt ||
      pendingReward ||
      chapterIntro ||
      quizOpen ||
      activeMission ||
      activeTheoryBook ||
      activeImpChallenge ||
      activeVentId ||
      inventoryOpen ||
      showRankingModal ||
      showMusicModal ||
      secretTvOpen ||
      tutorialModal.open
    ) {
      return;
    }

    const prev = saveStateRef.current;
    const started: SaveState = {
      ...prev,
      auliaSecretQuest: {
        stage: 'cutscene_collapse',
        hasBox: false,
        ladderPlaced: false,
        checkpointLine: 0,
      },
      activeCutsceneCheckpoint: { cutsceneId: 'aulia_collapse', lineIndex: 0 },
    };
    saveStateRef.current = started;
    setSaveState(started);
    persistSaveStateNow(started);
    setActiveCutsceneInitialLine(0);
    setActiveCutscene('aulia_collapse');
  }, [
    view,
    gameMode,
    hud.currentRoomId,
    saveState.unlockedChapter,
    saveState.auliaSecretQuest?.stage,
    activeCutscene,
    cutsceneResumePrompt,
    pendingReward,
    chapterIntro,
    quizOpen,
    activeMission,
    activeTheoryBook,
    activeImpChallenge,
    activeVentId,
    inventoryOpen,
    showRankingModal,
    showMusicModal,
    secretTvOpen,
    tutorialModal.open,
  ]);

  const handleInteractAulia = useCallback(
    (action: 'aulia_talk' | 'aulia_ladder_move' | 'aulia_climb_box') => {
      if (gameMode !== 'solo') return;
      const prev = saveStateRef.current;
      const quest = prev.auliaSecretQuest || {
        stage: 'not_started' as const,
        hasBox: false,
        ladderPlaced: false,
      };
      if (action === 'aulia_ladder_move') {
        if (quest.stage !== 'seeking_box' || quest.ladderPlaced) return;
        soundEngine.playClick();
        const next: SaveState = {
          ...prev,
          auliaSecretQuest: {
            ...quest,
            stage: 'seeking_box',
            ladderPlaced: true,
          },
        };
        saveStateRef.current = next;
        setSaveState(next);
        persistSaveStateNow(next);
        showNotice(
          'Tangga ditempatkan di depan lemari tinggi! Tekan [E] atau Tap tangga sekali lagi untuk memanjat & mengambil kotak.'
        );
      } else if (action === 'aulia_climb_box') {
        if (quest.stage !== 'seeking_box' || !quest.ladderPlaced) return;
        soundEngine.playMissionStart();
        setActiveCutsceneInitialLine(0);
        setActiveCutscene('aulia_febriyani');
      } else if (action === 'aulia_talk') {
        if (quest.stage === 'returning_box' && quest.hasBox) {
          soundEngine.playMissionStart();
          setActiveCutsceneInitialLine(0);
          setActiveCutscene('aulia_open');
        } else if (quest.stage === 'seeking_box') {
          showNotice(
            'Aulia sedang ditangani Dani, Sari, & Raka! Segera ke Cultural Room untuk mencari kotak berlabel "Febriyani" di atas lemari tinggi.'
          );
        }
      }
    },
    [gameMode, showNotice]
  );

  const handleLeaveMpRoom = useCallback(() => {
    setActiveMission(null);
    setActiveImpChallenge(null);
    setActiveVentId(null);
    setIsPaused(false);
    handleCancelEmote();
    mp.leaveRoom();
    setView('multiplayer_lobby');
  }, [handleCancelEmote, mp]);

  const handleCompleteMission = (
    missionId: MissionId,
    score: number,
    firstAttemptScore?: number
  ) => {
    const currentReadBooks = saveStateRef.current.readBooks || [];
    if (!areRequiredBooksRead(missionId, currentReadBooks)) {
      soundEngine.playError();
      setActiveMission(null);
      showNotice(
        `Tidak dapat menyelesaikan misi sebelum seluruh Buku Teori di ruangan ini selesai dibaca!`
      );
      return;
    }

    setActiveMission(null);
    soundEngine.playTaskComplete();
    const meta = MISSION_META[missionId];

    if (gameMode === 'multiplayer') {
      mp.completeMission(missionId, score);
      setMpDoneMissions((prev) => (prev.includes(missionId) ? prev : [...prev, missionId]));
      showNotice(`Misi Crewmate "${meta.title}" selesai! (+${score} Poin Edukasi)`);
      return;
    }

    const prev = saveStateRef.current;
    const chap = meta.chapter;
    const prevAlready = prev.completedMissions.includes(missionId);
    const updatedCompleted = prevAlready
      ? prev.completedMissions
      : [...prev.completedMissions, missionId];
    const chapMissions = CHAPTER_INFO[chap].missions;
    const allChapMissionsDone = chapMissions.every((m) => updatedCompleted.includes(m));
    const cutsceneId = getChapterCutsceneId(chap);
    const cutsceneAlreadySeen =
      prev.completedCutscenes.includes(cutsceneId) || prev.completedChapters.includes(chap);
    const shouldTriggerCutscene =
      allChapMissionsDone && !cutsceneAlreadySeen ? cutsceneId : null;

    const prevScore = prev.missionScores[missionId] ?? 0;
    const nextScores = { ...prev.missionScores, [missionId]: Math.max(prevScore, score) };
    const existingFirst = prev.missionFirstScores?.[missionId];
    const nextFirstScores = {
      ...(prev.missionFirstScores || {}),
      [missionId]:
        typeof existingFirst === 'number'
          ? existingFirst
          : Math.max(0, Math.min(100, Math.round(firstAttemptScore ?? score))),
    };
    const expGain = prevAlready ? 15 : Math.round(score * 1.5);

    const nextState: SaveState = {
      ...prev,
      prologSeen: true,
      completedMissions: updatedCompleted,
      missionScores: nextScores,
      missionFirstScores: nextFirstScores,
      totalExp: prev.totalExp + expGain,
      activeCutsceneCheckpoint: shouldTriggerCutscene
        ? { cutsceneId: shouldTriggerCutscene, lineIndex: 0 }
        : prev.activeCutsceneCheckpoint,
      chapterProgress: {
        ...(prev.chapterProgress || getDefaultSaveState().chapterProgress!),
        [chap]: {
          missionsCompleted: allChapMissionsDone,
          cutsceneCompleted: cutsceneAlreadySeen,
          chapterCompleted: prev.completedChapters.includes(chap),
          rewardClaimed: prev.unlockedItems.includes(CHAPTER_INFO[chap].specialItemId),
        },
      },
    };

    saveStateRef.current = nextState;
    setSaveState(nextState);
    persistSaveStateNow(nextState);

    if (shouldTriggerCutscene) {
      setActiveCutsceneInitialLine(0);
      setActiveCutscene(shouldTriggerCutscene);
    } else {
      showNotice(`Misi "${meta.title}" berhasil diselesaikan! (+Skor ${score})`);
    }
  };

  const handleCompleteImpostorChallenge = (challengeId: string, score: number) => {
    setActiveImpChallenge(null);
    soundEngine.playImpostorAction();
    mp.completeImpostorChallenge(challengeId, score);
    setMpDoneImpChallenges((prev) => (prev.includes(challengeId) ? prev : [...prev, challengeId]));
    showNotice('Dekripsi Sabotase Sosiologi berhasil! Cooldown Stasis berkurang.');
  };

  const handleCutsceneLineChange = useCallback(
    (line: CutsceneLine, index: number) => {
      setActiveCutsceneLine(line);
      if (!activeCutscene) return;
      const cur = saveStateRef.current;
      const next: SaveState = {
        ...cur,
        activeCutsceneCheckpoint: { cutsceneId: activeCutscene, lineIndex: index },
      };
      saveStateRef.current = next;
      setSaveState(next);
      persistSaveStateNow(next);
    },
    [activeCutscene]
  );

  const completeCutsceneAndUnlock = useCallback(
    (cs: CutsceneCharacterId) => {
      setActiveCutscene(null);
      setActiveCutsceneLine(null);
      setActiveCutsceneInitialLine(0);
      setCutsceneResumePrompt(null);

      const prev = saveStateRef.current;

      if (cs === 'prolog') {
        const next: SaveState = {
          ...prev,
          prologSeen: true,
          activeCutsceneCheckpoint: null,
          completedCutscenes: prev.completedCutscenes.includes('prolog')
            ? prev.completedCutscenes
            : [...prev.completedCutscenes, 'prolog'],
        };
        saveStateRef.current = next;
        setSaveState(next);
        persistSaveStateNow(next);
        setTeleportPos({ x: -35.4, z: 3.25, tick: Date.now(), skipAnim: true });
        showNotice('Tekan [E] atau Tap untuk membuka Buku Teori Pertama di meja!');
        return;
      }

      if (cs === 'all_final') {
        const next: SaveState = {
          ...prev,
          endingSeen: true,
          activeCutsceneCheckpoint: null,
          completedCutscenes: prev.completedCutscenes.includes('all_final')
            ? prev.completedCutscenes
            : [...prev.completedCutscenes, 'all_final'],
        };
        saveStateRef.current = next;
        setSaveState(next);
        persistSaveStateNow(next);
        setView('ending');
        return;
      }

      if (cs === 'aulia_collapse') {
        const next: SaveState = {
          ...prev,
          activeCutsceneCheckpoint: null,
          completedCutscenes: prev.completedCutscenes.includes('aulia_collapse')
            ? prev.completedCutscenes
            : [...prev.completedCutscenes, 'aulia_collapse'],
          auliaSecretQuest: {
            stage: 'seeking_box',
            hasBox: false,
            ladderPlaced: Boolean(prev.auliaSecretQuest?.ladderPlaced),
            checkpointLine: 0,
          },
        };
        saveStateRef.current = next;
        setSaveState(next);
        persistSaveStateNow(next);
        showNotice(
          'Misi Rahasia Aulia dimulai! Pergi ke Cultural Room, pasang tangga ke lemari tinggi, lalu temukan kotak "Febriyani".'
        );
        return;
      }

      if (cs === 'aulia_febriyani') {
        const next: SaveState = {
          ...prev,
          activeCutsceneCheckpoint: null,
          completedCutscenes: prev.completedCutscenes.includes('aulia_febriyani')
            ? prev.completedCutscenes
            : [...prev.completedCutscenes, 'aulia_febriyani'],
          auliaSecretQuest: {
            stage: 'returning_box',
            hasBox: true,
            ladderPlaced: true,
            checkpointLine: 0,
          },
        };
        saveStateRef.current = next;
        setSaveState(next);
        persistSaveStateNow(next);
        showNotice(
          'Kotak misterius "Febriyani" ditemukan! Bawa kembali dan serahkan kepada Aulia di Central Lobby.'
        );
        return;
      }

      if (cs === 'aulia_open') {
        const alreadyHadBiru = prev.unlockedItems.includes('batik_smada_biru');
        const nextItems = alreadyHadBiru
          ? prev.unlockedItems
          : [...prev.unlockedItems, 'batik_smada_biru'];
        const candidate: SaveState = {
          ...prev,
          unlockedItems: nextItems,
          totalExp: alreadyHadBiru ? prev.totalExp : prev.totalExp + 180,
          pendingRankingSync: true,
          activeCutsceneCheckpoint: null,
          completedCutscenes: prev.completedCutscenes.includes('aulia_open')
            ? prev.completedCutscenes
            : [...prev.completedCutscenes, 'aulia_open'],
          auliaSecretQuest: {
            stage: 'completed',
            hasBox: true,
            ladderPlaced: true,
            checkpointLine: 0,
          },
        };
        const { nextState, newlyUnlocked: merahUnlocked } = applyBatikMerahCheck(candidate);
        saveStateRef.current = nextState;
        setSaveState(nextState);
        persistSaveStateNow(nextState);
        void syncRankingToServer(nextState);

        if (merahUnlocked) {
          setPendingBatikMerahModal(true);
        }

        const biruItem = INVENTORY_ITEMS.find((i) => i.id === 'batik_smada_biru');
        if (!alreadyHadBiru && biruItem) {
          setPendingReward({
            chapter: 4,
            rewardItem: biruItem,
            titleLabel: 'MISI RAHASIA AULIA SELESAI',
            subtitleLabel: 'Hadiah Spesial — Seragam Batik SMADA Biru',
            continueLabel: 'LANJUT BERMAIN',
            isSpecialBonus: true,
          });
        } else {
          showNotice('Misi Rahasia Aulia selesai!');
        }
        return;
      }

      const chap: ChapterId =
        cs === 'rex'
          ? 1
          : cs === 'bima'
            ? 2
            : cs === 'fuzzy'
              ? 3
              : cs === 'bob'
                ? 4
                : 5;
      const { rewardItem, specialItem, alreadyClaimed } = pickChapterRewardOnce(
        chap,
        prev.unlockedItems,
        Boolean(prev.replayMode)
      );

      // #40: Completing Chapter 5 (ratu_laras) permanently unlocks Batik SMADA Ungu
      const ch5BatikUngu = chap === 5 ? ['batik_smada_ungu'] : [];
      const newlyUnlockedCh5Batik = chap === 5 && !prev.unlockedItems.includes('batik_smada_ungu');

      const nextUnlockedItems = Array.from(
        new Set([...prev.unlockedItems, rewardItem.id, specialItem.id, ...ch5BatikUngu])
      );
      const chapEmote = CHAPTER_UNLOCKED_EMOTES[chap];
      const nextUnlockedEmotes = Array.from(
        new Set([...(prev.unlockedEmotes || STARTER_EMOTE_IDS), ...(chapEmote ? [chapEmote] : [])])
      );
      const npcId = cs as NpcCharacterId;
      const nextMetNpcs = (prev.metNpcs || []).includes(npcId)
        ? prev.metNpcs || []
        : [...(prev.metNpcs || []), npcId];
      const nextCompletedChapters = prev.completedChapters.includes(chap)
        ? prev.completedChapters
        : [...prev.completedChapters, chap];
      const nextCutscenes = prev.completedCutscenes.includes(cs)
        ? prev.completedCutscenes
        : [...prev.completedCutscenes, cs];
      const nextUnlockedChapter = Math.max(
        prev.unlockedChapter,
        chap < 5 ? chap + 1 : 5
      ) as ChapterId;

      const candidateState: SaveState = {
        ...prev,
        unlockedItems: nextUnlockedItems,
        unlockedEmotes: nextUnlockedEmotes,
        metNpcs: nextMetNpcs,
        completedChapters: nextCompletedChapters,
        completedCutscenes: nextCutscenes,
        unlockedChapter: nextUnlockedChapter,
        totalExp: alreadyClaimed ? prev.totalExp : prev.totalExp + 200,
        pendingRankingSync: true,
        activeCutsceneCheckpoint: null,
        pendingRewardChapter: alreadyClaimed ? null : chap,
        chapterProgress: {
          ...(prev.chapterProgress || getDefaultSaveState().chapterProgress!),
          [chap]: {
            missionsCompleted: true,
            cutsceneCompleted: true,
            chapterCompleted: true,
            rewardClaimed: true,
          },
        },
      };

      const { nextState, newlyUnlocked: merahUnlocked } = applyBatikMerahCheck(candidateState);
      saveStateRef.current = nextState;
      setSaveState(nextState);
      persistSaveStateNow(nextState);
      void syncRankingToServer(nextState);

      if (newlyUnlockedCh5Batik) {
        showNotice('Chapter 5 Selesai! Kostum Batik SMADA Ungu terbuka di Menu Kostum & Inventory!');
      }
      if (merahUnlocked) {
        setPendingBatikMerahModal(true);
      }

      if (!alreadyClaimed) {
        setPendingReward({ chapter: chap, rewardItem, specialItem });
      } else if (chap < 5) {
        setChapterIntro((chap + 1) as ChapterId);
        showNotice(`Chapter ${chap} selesai! Chapter ${chap + 1} kini terbuka.`);
      } else {
        setQuizOpen(true);
      }
    },
    [showNotice, syncRankingToServer, applyBatikMerahCheck]
  );

  const handleCutsceneFinish = useCallback(() => {
    if (!activeCutscene) return;
    completeCutsceneAndUnlock(activeCutscene);
  }, [activeCutscene, completeCutsceneAndUnlock]);

  const handleEquipRewardAndContinue = () => {
    if (!pendingReward) return;
    const item = pendingReward.rewardItem;
    const chap = pendingReward.chapter;
    const isSpecialBonus = Boolean(pendingReward.isSpecialBonus);
    const prev = saveStateRef.current;
    const nextChar = { ...prev.character };
    if (item.category === 'costume' && item.costumeId) {
      nextChar.costume = item.costumeId as CostumeStyleId;
    } else if (item.equipId) {
      if (item.category === 'head') nextChar.head = item.equipId as HeadAccessoryId;
      if (item.category === 'body') nextChar.body = item.equipId as BodyAccessoryId;
      if (item.category === 'neck') nextChar.neck = item.equipId as NeckAccessoryId;
    }
    const next: SaveState = {
      ...prev,
      character: nextChar,
      pendingRewardChapter: isSpecialBonus ? prev.pendingRewardChapter ?? null : null,
    };
    saveStateRef.current = next;
    setSaveState(next);
    persistSaveStateNow(next);

    setPendingReward(null);
    if (isSpecialBonus) {
      showNotice(`"${item.name}" dipasang pada karakter!`);
      return;
    }
    if (chap < 5) {
      setChapterIntro((chap + 1) as ChapterId);
    } else {
      setQuizOpen(true);
    }
  };

  const handleContinueAfterReward = () => {
    if (!pendingReward) return;
    const chap = pendingReward.chapter;
    const isSpecialBonus = Boolean(pendingReward.isSpecialBonus);
    const prev = saveStateRef.current;
    const next: SaveState = {
      ...prev,
      pendingRewardChapter: isSpecialBonus ? prev.pendingRewardChapter ?? null : null,
    };
    saveStateRef.current = next;
    setSaveState(next);
    persistSaveStateNow(next);

    setPendingReward(null);
    if (isSpecialBonus) return;
    if (chap < 5) {
      setChapterIntro((chap + 1) as ChapterId);
    } else {
      setQuizOpen(true);
    }
  };

  const handleFinishQuiz = (score: number, correctCount: number, totalCount = 12) => {
    setQuizOpen(false);
    const prev = saveStateRef.current;
    const elapsedMs = prev.runStartedAt ? Math.max(15000, Date.now() - prev.runStartedAt) : null;
    const nextBestMs = elapsedMs
      ? prev.bestCompletionMs
        ? Math.min(prev.bestCompletionMs, elapsedMs)
        : elapsedMs
      : (prev.bestCompletionMs ?? null);

    const runId = prev.activeSoloRunId || generateSoloRunId();
    const claimedIds = prev.claimedSoloBadgeRunIds || [];
    const alreadyClaimedThisRun = claimedIds.includes(runId);

    const badgeEval = evaluateSoloAchievementBadge({
      state: prev,
      quizCorrectCount: correctCount,
      quizTotalCount: totalCount,
      durationMs: elapsedMs,
      runId,
    });

    const earnedBadge = badgeEval.eligible ? badgeEval.record : null;
    const shouldAddNewClaim = Boolean(earnedBadge && !alreadyClaimedThisRun);
    const nextClaimedIds = shouldAddNewClaim ? [...claimedIds, runId] : claimedIds;
    const nextHistory = shouldAddNewClaim && earnedBadge
      ? [...(prev.soloBadgeHistory || []), earnedBadge].slice(-25)
      : prev.soloBadgeHistory || [];
    const nextBestBadge = earnedBadge
      ? pickHigherSoloBadge(prev.bestSoloBadge, earnedBadge.tier)
      : prev.bestSoloBadge ?? null;

    const candidate: SaveState = {
      ...prev,
      activeSoloRunId: runId,
      quizCompleted: true,
      quizScore: Math.max(prev.quizScore, score),
      quizCorrectCount: Math.max(prev.quizCorrectCount, correctCount),
      soloCompletions: alreadyClaimedThisRun
        ? (prev.soloCompletions ?? 1)
        : (prev.soloCompletions ?? 0) + 1,
      totalExp: alreadyClaimedThisRun ? prev.totalExp : prev.totalExp + Math.round(score * 3),
      bestCompletionMs: nextBestMs,
      claimedSoloBadgeRunIds: nextClaimedIds,
      soloBadgeHistory: nextHistory,
      bestSoloBadge: nextBestBadge,
      lastSoloBadgeRecord: earnedBadge ?? prev.lastSoloBadgeRecord ?? null,
      replayMode: false,
      pendingRankingSync: true,
      activeCutsceneCheckpoint: { cutsceneId: 'all_final', lineIndex: 0 },
    };
    const { nextState, newlyUnlocked } = applyBatikMerahCheck(candidate);
    saveStateRef.current = nextState;
    setSaveState(nextState);
    persistSaveStateNow(nextState);
    void syncRankingToServer(nextState);
    if (newlyUnlocked) {
      setPendingBatikMerahModal(true);
    }

    setActiveCutsceneInitialLine(0);
    setActiveCutscene('all_final');
  };

  const handleSecretTvComplete = () => {
    const prev = saveStateRef.current;
    const nextEmotes = Array.from(
      new Set<EmoteId>([...(prev.unlockedEmotes || STARTER_EMOTE_IDS), 'kpop_groove', 'star_hop'])
    );
    const candidate: SaveState = {
      ...prev,
      secretTvCompleted: true,
      unlockedEmotes: nextEmotes,
      totalExp: prev.totalExp + 120,
      pendingRankingSync: true,
    };
    const { nextState, newlyUnlocked } = applyBatikMerahCheck(candidate);
    saveStateRef.current = nextState;
    setSaveState(nextState);
    persistSaveStateNow(nextState);
    void syncRankingToServer(nextState);
    if (newlyUnlocked) {
      setPendingBatikMerahModal(true);
      showNotice('Emote rahasia terbuka & syarat Batik SMADA Merah terpenuhi!');
    } else {
      showNotice('Berhasil! Emote rahasia "Cosmic Idol" & "Starlight Pop" terbuka!');
    }
  };

  const handleResetProgress = () => {
    localStorage.removeItem(STORAGE_KEY);
    const prev = saveStateRef.current;
    const reset: SaveState = {
      ...getDefaultSaveState(),
      settings: prev.settings,
      creatorInfo: prev.creatorInfo,
    };
    saveStateRef.current = reset;
    setSaveState(reset);
    persistSaveStateNow(reset);
    showNotice('Progres permainan berhasil direset.');
  };

  const handlePlayAgain = () => {
    const prev = saveStateRef.current;
    const next: SaveState = {
      ...getDefaultSaveState(),
      activeSoloRunId: generateSoloRunId(),
      character: prev.character,
      settings: prev.settings,
      creatorInfo: prev.creatorInfo,
      unlockedItems: prev.unlockedItems,
      unlockedEmotes: prev.unlockedEmotes || STARTER_EMOTE_IDS,
      secretTvCompleted: Boolean(prev.secretTvCompleted),
      soloCompletions: prev.soloCompletions ?? 0,
      multiplayerCompletions: prev.multiplayerCompletions ?? 0,
      countedMatchIds: prev.countedMatchIds || [],
      claimedSoloBadgeRunIds: prev.claimedSoloBadgeRunIds || [],
      soloBadgeHistory: prev.soloBadgeHistory || [],
      bestSoloBadge: prev.bestSoloBadge ?? null,
      lastSoloBadgeRecord: prev.lastSoloBadgeRecord ?? null,
      metNpcs: prev.metNpcs || [],
      bestCompletionMs: prev.bestCompletionMs ?? null,
      totalExp: prev.totalExp,
      tutorialSeen: prev.tutorialSeen,
      runStartedAt: Date.now(),
    };
    saveStateRef.current = next;
    setSaveState(next);
    persistSaveStateNow(next);
    setGameMode('solo');
    setTeleportPos({ x: 0, z: 3.2, tick: Date.now(), skipAnim: true });
    setView('playing');
    soundEngine.playGameStart();
    setActiveCutsceneInitialLine(0);
    setActiveCutscene('prolog');
  };

  const handleReplayChapters = () => {
    const prev = saveStateRef.current;
    const next = createChapterReplayState(prev);
    saveStateRef.current = next;
    setSaveState(next);
    persistSaveStateNow(next);
    setActiveMission(null);
    setActiveTheoryBook(null);
    setPendingReward(null);
    setCutsceneResumePrompt(null);
    setQuizOpen(false);
    setGameMode('solo');
    setIsPaused(false);
    setTeleportPos({ x: 0, z: 3.2, tick: Date.now(), skipAnim: true });
    setView('playing');
    soundEngine.playGameStart();
    setChapterIntro(1);
    showNotice('Mode Ulangi Chapter aktif! Selesaikan Chapter 1–5 untuk koleksi item baru.');
  };

  const cutscenePrependedLines = useMemo<CutsceneLine[] | undefined>(() => {
    if (
      activeCutscene === 'rex' ||
      activeCutscene === 'bima' ||
      activeCutscene === 'fuzzy' ||
      activeCutscene === 'bob' ||
      activeCutscene === 'ratu_laras'
    ) {
      if (!(saveState.metNpcs || []).includes(activeCutscene)) {
        return [FIRST_MEETING_REACTIONS[activeCutscene]];
      }
    }
    return undefined;
  }, [activeCutscene, saveState.metNpcs]);

  const isMpMeetingOpen =
    gameMode === 'multiplayer' && mp.snapshot?.phase === 'meeting' && Boolean(mp.snapshot.meeting);
  const isMpResultOpen =
    gameMode === 'multiplayer' && mp.snapshot?.phase === 'ended' && Boolean(mp.snapshot.matchResult);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#050814]">
      {isPortraitMobile && !dismissPortrait && (
        <div className="fixed inset-0 z-[100] bg-[#040714]/95 flex flex-col items-center justify-center p-6 text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-sky-500/20 border border-sky-400/50 flex items-center justify-center">
            <RotateCw className="w-7 h-7 text-sky-400" />
          </div>
          <h2 className="font-display text-xl font-bold text-white">
            Putar Perangkat ke Mode Landscape
          </h2>
          <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
            GLOBALUS dirancang untuk tampilan horizontal 16:9 agar eksplorasi 3D, peta, dan kontrol kamera 360° lebih nyaman.
          </p>
          <button
            onClick={() => setDismissPortrait(true)}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-200 text-xs font-semibold"
          >
            Lanjutkan Tetap
          </button>
        </div>
      )}

      {/* HOME / TUTORIAL / SETTINGS / ABOUT */}
      {(view === 'home' || view === 'howtoplay' || view === 'settings' || view === 'about') && (
        <HomeScreen
          view={view}
          saveState={saveState}
          isOnline={mp.isOnline}
          onNavigate={(v) => setView(v)}
          onPlayGame={handlePlaySolo}
          onOpenMultiplayer={handleOpenMultiplayer}
          onOpenTutorial={() => setTutorialModal({ open: true, startPendingSolo: false })}
          onOpenRanking={() => setShowRankingModal(true)}
          onOpenMusic={() => setShowMusicModal(true)}
          onReplayChapters={handleReplayChapters}
          onUpdateSettings={(next) => setSaveState((p) => ({ ...p, settings: next }))}
          onResetProgress={handleResetProgress}
        />
      )}

      {/* CHARACTER CUSTOMIZATION */}
      {view === 'customize' && (
        <CustomizationScreen
          initialConfig={saveState.character}
          unlockedItems={saveState.unlockedItems}
          saveState={saveState}
          onSave={(char: CharacterConfig) => {
            setSaveState((p) => ({ ...p, character: char }));
            if (mp.roomCode) {
              mp.updateCharacter(char);
            }
          }}
          onBack={() => setView(customizeReturnView)}
        />
      )}

      {/* MULTIPLAYER LOBBY */}
      {view === 'multiplayer_lobby' && (
        <MultiplayerLobby
          character={saveState.character}
          status={mp.status}
          isOnline={mp.isOnline}
          reconnectAttempt={mp.reconnectAttempt}
          maxReconnectAttempts={mp.maxReconnectAttempts}
          playerId={mp.playerId}
          roomCode={mp.roomCode}
          snapshot={mp.snapshot}
          lastError={mp.lastError}
          voiceControls={voiceControls}
          voiceEnabled={saveState.settings.voiceEnabled !== false}
          onCreateRoom={() => mp.createRoom(saveState.character)}
          onJoinRoom={(code) => mp.joinRoom(code, saveState.character)}
          onLeaveRoom={() => mp.leaveRoom()}
          onToggleReady={() => mp.toggleReady()}
          onStartGame={() => mp.startGame()}
          onOpenCustomize={() => {
            setCustomizeReturnView('multiplayer_lobby');
            setView('customize');
          }}
          onRetryConnect={() => mp.retryConnect()}
          onBackToSolo={handleExitMultiplayerToSolo}
          onBackHome={() => {
            soundEngine.setVoiceDucking(false);
            mp.disconnect();
            setCustomizeReturnView('home');
            setView('home');
          }}
          onClearError={() => mp.clearError()}
        />
      )}

      {/* MAIN 3D GAMEPLAY (SOLO & MULTIPLAYER) */}
      {view === 'playing' && (
        <div className="relative w-full h-full">
          <GameCanvas
            character={saveState.character}
            settings={saveState.settings}
            cameraMode={cameraMode}
            completedMissions={
              gameMode === 'multiplayer'
                ? (mpDoneMissions as MissionId[])
                : saveState.completedMissions
            }
            unlockedChapter={saveState.unlockedChapter}
            completedChaptersCount={saveState.completedChapters.length}
            lockedRooms={lockedRooms}
            chapterLockedDoorIds={chapterLockedDoorIds}
            activeMissionRoomId={activeMissionRoomId}
            readBooks={saveState.readBooks || []}
            activeTheoryBook={activeTheoryBook}
            activeCutscene={activeCutscene}
            activeCutsceneLine={activeCutsceneLine}
            auliaQuest={saveState.auliaSecretQuest}
            isPaused={
              isPaused ||
              tutorialModal.open ||
              Boolean(activeMission) ||
              Boolean(activeImpChallenge) ||
              Boolean(activeVentId) ||
              Boolean(activeTheoryBook) ||
              Boolean(cutsceneResumePrompt) ||
              quizOpen ||
              inventoryOpen ||
              showRankingModal ||
              showMusicModal ||
              secretTvOpen ||
              Boolean(pendingReward) ||
              Boolean(chapterIntro) ||
              isMpMeetingOpen ||
              isMpResultOpen
            }
            joystickInputRef={joystickInputRef}
            triggerJumpRef={triggerJumpRef}
            activeEmote={activeEmote}
            activeEmoteStartedAt={activeEmoteStartedAt}
            onCancelEmote={handleCancelEmote}
            resetCameraTick={resetCameraTick}
            teleportPos={teleportPos}
            isMultiplayer={gameMode === 'multiplayer'}
            mpPhase={mp.snapshot?.phase ?? null}
            myPlayerId={mp.playerId}
            myRole={mp.role}
            amAlive={amAlive}
            inVent={Boolean(meInMp?.inVent)}
            localSpeaking={voice.micOn && !voice.muted && voice.speaking}
            latestEliminationEvent={latestEliminationEvent}
            remotePlayers={mp.snapshot?.players || []}
            stasisPods={mp.snapshot?.stasisPods || []}
            remoteMoveBufferRef={remoteMoveBufferRef}
            onSendMove={mp.sendMove}
            onHudUpdate={setHud}
            onInteractTerminal={handleInteractTerminal}
            onInteractBook={handleOpenBook}
            onInteractVent={handleInteractVent}
            onInteractSecretTv={() => setSecretTvOpen(true)}
            onInteractCustomizeTerminal={() => {
              setCustomizeReturnView('playing');
              setView('customize');
            }}
            onInteractAulia={handleInteractAulia}
            onReportStasisPod={(podId) => mp.callMeeting('report', podId)}
            onLockedDoorBlocked={handleLockedDoorBlocked}
          />

          {!activeCutscene && (
            <HUD
              hud={hud}
              saveState={saveState}
              isPaused={isPaused}
              joystickInputRef={joystickInputRef}
              lockedRooms={lockedRooms}
              chapterLockedRooms={chapterLockedRooms}
              activeMissionRoomId={activeMissionRoomId}
              activeTheoryBookId={activeTheoryBook}
              activeEmote={activeEmote}
              unlockedEmotes={saveState.unlockedEmotes || STARTER_EMOTE_IDS}
              cameraMode={cameraMode}
              secretTvCompleted={Boolean(saveState.secretTvCompleted)}
              auliaQuest={saveState.auliaSecretQuest}
              isMultiplayer={gameMode === 'multiplayer'}
              isOnline={mp.isOnline}
              myPlayerId={mp.playerId}
              mpStatus={mp.status}
              reconnectAttempt={mp.reconnectAttempt}
              maxReconnectAttempts={mp.maxReconnectAttempts}
              mpLastError={mp.lastError}
              mpRole={mp.role}
              mpPhase={mp.snapshot?.phase ?? null}
              amAlive={amAlive}
              mpSnapshot={mp.snapshot}
              completedMpMissions={mpDoneMissions}
              completedImpChallenges={mpDoneImpChallenges}
              voiceControls={voiceControls}
              onTogglePause={() => setIsPaused((p) => !p)}
              onToggleCameraMode={() => setCameraMode((m) => (m === '360' ? 'topdown' : '360'))}
              onOpenInventory={() => setInventoryOpen(true)}
              onOpenCustomize={() => {
                setCustomizeReturnView('playing');
                setView('customize');
              }}
              onOpenRanking={() => setShowRankingModal(true)}
              onOpenMusicModal={() => setShowMusicModal(true)}
              onOpenTutorial={() => setTutorialModal({ open: true, startPendingSolo: false })}
              onResetCamera={() => setResetCameraTick((t) => t + 1)}
              onJump={() => triggerJumpRef.current?.()}
              onTriggerEmote={handleTriggerEmote}
              onInteract={handleInteractTerminal}
              onInteractBook={handleOpenBook}
              onInteractVent={handleInteractVent}
              onInteractSecretTv={() => setSecretTvOpen(true)}
              onInteractCustomizeTerminal={() => {
                setCustomizeReturnView('playing');
                setView('customize');
              }}
              onInteractAulia={handleInteractAulia}
              onCallMeeting={(reason, podId) => mp.callMeeting(reason, podId)}
              onEliminateTarget={(targetId) => mp.eliminatePlayer(targetId)}
              onToggleReady={() => mp.toggleReady()}
              onStartGame={() => mp.startGame()}
              onUpdateHostSettings={(next: HostSettings) => mp.updateHostSettings(next)}
              onSendLobbyChat={(txt: string) => mp.sendLobbyChat(txt)}
              onLeaveMpRoom={handleLeaveMpRoom}
              onRetryConnect={() => mp.retryConnect()}
              onExitToSolo={handleExitMultiplayerToSolo}
              onUpdateSettings={(next) => setSaveState((p) => ({ ...p, settings: next }))}
              onOpenFinalQuiz={() => setQuizOpen(true)}
              onBackHome={() => {
                setIsPaused(false);
                handleCancelEmote();
                soundEngine.setVoiceDucking(false);
                if (gameMode === 'multiplayer') {
                  mp.leaveRoom();
                  mp.disconnect();
                }
                setView('home');
              }}
            />
          )}

          {/* Non-graphic Futuristic Stasis Hologram Teleport Overlay */}
          {stasisOverlayEvent && (
            <div className="fixed inset-0 z-[45] pointer-events-none flex items-center justify-center bg-sky-950/35">
              <div className="bg-[#071028]/95 border-2 border-cyan-400/75 rounded-2xl px-7 py-5 text-center shadow-2xl max-w-sm animate-pulse">
                <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-300">
                  PROSES TELEPORTASI STASIS
                </p>
                <h3 className="font-display text-xl font-extrabold text-white mt-1">
                  Kapsul Stasis Aktif
                </h3>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  {stasisOverlayEvent.impostorName} memindahkanmu ke Kapsul Stasis di {stasisOverlayEvent.roomName}. Memasuki Mode Penonton...
                </p>
              </div>
            </div>
          )}

          {/* Private Role Reveal Briefing (Multiplayer Match Start) */}
          {roleRevealBanner && (
            <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-4">
              <div
                className={`px-8 py-6 rounded-2xl border-2 shadow-2xl text-center max-w-md ${
                  roleRevealBanner === 'impostor'
                    ? 'bg-rose-950/95 border-rose-500 text-rose-100'
                    : roleRevealBanner === 'peramal'
                      ? 'bg-violet-950/95 border-violet-400 text-violet-100'
                      : 'bg-sky-950/95 border-sky-400 text-sky-100'
                }`}
              >
                {roleRevealBanner === 'impostor' ? (
                  <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto mb-2" />
                ) : roleRevealBanner === 'peramal' ? (
                  <Sparkles className="w-12 h-12 text-violet-300 mx-auto mb-2" />
                ) : (
                  <ShieldCheck className="w-12 h-12 text-sky-400 mx-auto mb-2" />
                )}
                <p className="text-xs font-bold uppercase tracking-widest opacity-80">
                  PERAN RAHASIA KAMU
                </p>
                <h2 className="font-display text-3xl font-extrabold mt-1">
                  {roleRevealBanner === 'impostor'
                    ? 'IMPOSTOR'
                    : roleRevealBanner === 'peramal'
                      ? 'PERAMAL'
                      : 'CREWMATE'}
                </h2>
                <p className="text-xs mt-2 leading-relaxed opacity-90">
                  {roleRevealBanner === 'impostor'
                    ? 'Selesaikan 4 Misi Rahasia Sosiologi atau masukkan Crewmate ke Kapsul Stasis. Gunakan Vent [E] secara diam-diam!'
                    : roleRevealBanner === 'peramal'
                      ? 'Selesaikan misi bersama Crewmate dan gunakan kemampuan TERAWANG 1x saat Rapat Darurat untuk mengetahui peran rahasia seorang pemain secara privat!'
                      : 'Jelajahi ruangan, selesaikan misi Global Network, dan identifikasi Impostor saat Emergency Meeting!'}
                </p>
              </div>
            </div>
          )}

          {/* Toast Info Banner */}
          {infoNotice && (
            <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 bg-[#081028]/95 border border-sky-400/60 text-sky-100 px-5 py-2.5 rounded-xl text-xs md:text-sm font-medium shadow-2xl max-w-md text-center">
              {infoNotice}
            </div>
          )}

          {/* Chapter Opening Story Modal */}
          {chapterIntro && gameMode === 'solo' && (
            <div className="fixed inset-0 z-50 bg-slate-950/85 flex items-center justify-center p-4">
              <div
                className="w-full max-w-lg bg-[#080f24] border-2 rounded-2xl p-6 space-y-4 shadow-2xl"
                style={{ borderColor: CHAPTER_INFO[chapterIntro].accentHex }}
              >
                <div>
                  <p
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: CHAPTER_INFO[chapterIntro].accentHex }}
                  >
                    Opening Story · {CHAPTER_INFO[chapterIntro].perspective}
                  </p>
                  <h2 className="font-display text-xl md:text-2xl font-extrabold text-white mt-1">
                    {CHAPTER_INFO[chapterIntro].title}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {CHAPTER_INFO[chapterIntro].subtitle}
                  </p>
                </div>

                <p className="text-sm text-slate-200 leading-relaxed bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                  {CHAPTER_INFO[chapterIntro].openingStory}
                </p>

                <button
                  onClick={() => {
                    soundEngine.playClick();
                    setChapterIntro(null);
                  }}
                  className="w-full py-3 rounded-xl font-display font-bold text-sm text-slate-950 cursor-pointer"
                  style={{ backgroundColor: CHAPTER_INFO[chapterIntro].accentHex }}
                >
                  MULAI EKSPLORASI CHAPTER {chapterIntro}
                </button>
              </div>
            </div>
          )}

          {/* Interactive Crewmate / Solo Mission Modal */}
          {activeMission && (
            <MissionModal
              missionId={activeMission}
              alreadyCompleted={
                gameMode === 'multiplayer'
                  ? mpDoneMissions.includes(activeMission)
                  : saveState.completedMissions.includes(activeMission)
              }
              readBooks={saveState.readBooks || []}
              onOpenBook={handleOpenBook}
              onComplete={handleCompleteMission}
              onClose={() => setActiveMission(null)}
            />
          )}

          {/* Impostor Secret Sociology Challenge Modal */}
          {activeImpChallenge && (
            <ImpostorChallengeModal
              challenge={activeImpChallenge}
              alreadyDone={mpDoneImpChallenges.includes(activeImpChallenge.id)}
              onComplete={handleCompleteImpostorChallenge}
              onClose={() => setActiveImpChallenge(null)}
            />
          )}

          {/* Physical Vent System Modal */}
          {activeVentId && (
            <VentModal
              currentVentId={activeVentId}
              canUseVent={gameMode === 'multiplayer' && mp.role === 'impostor' && amAlive}
              lockedRooms={lockedRooms}
              chapterLockedRooms={chapterLockedRooms}
              onSelectDestination={handleSelectVentDest}
              onClose={handleCloseVent}
            />
          )}

          {/* Interactive 3D Theory Book Modal */}
          {activeTheoryBook && (
            <TheoryBookModal
              bookId={activeTheoryBook}
              alreadyRead={(saveState.readBooks || []).includes(activeTheoryBook)}
              onMarkRead={handleMarkBookRead}
              onClose={() => setActiveTheoryBook(null)}
            />
          )}

          {/* Interrupted Cutscene Recovery & Resume/Skip Modal */}
          {cutsceneResumePrompt && gameMode === 'solo' && (
            <div className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4">
              <div
                className="w-full max-w-lg bg-[#080f24] border-2 rounded-2xl p-6 space-y-4 shadow-2xl"
                style={{ borderColor: CUTSCENES[cutsceneResumePrompt.cutsceneId].themeColorHex }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${CUTSCENES[cutsceneResumePrompt.cutsceneId].themeColorHex}22`,
                    }}
                  >
                    <Sparkles
                      className="w-6 h-6"
                      style={{ color: CUTSCENES[cutsceneResumePrompt.cutsceneId].themeColorHex }}
                    />
                  </div>
                  <div>
                    <p
                      className="text-[11px] font-bold uppercase tracking-widest"
                      style={{ color: CUTSCENES[cutsceneResumePrompt.cutsceneId].themeColorHex }}
                    >
                      Pemulihan Progres Tersimpan
                    </p>
                    <h2 className="font-display text-lg md:text-xl font-extrabold text-white mt-0.5">
                      Cutscene Sempat Terhenti
                    </h2>
                    <p className="text-xs text-slate-300 mt-1">
                      {CUTSCENES[cutsceneResumePrompt.cutsceneId].title} · Dialog{' '}
                      {cutsceneResumePrompt.lineIndex + 1} /{' '}
                      {CUTSCENES[cutsceneResumePrompt.cutsceneId].lines.length}
                    </p>
                  </div>
                </div>

                <p className="text-xs md:text-sm text-slate-200 leading-relaxed bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                  {cutsceneResumePrompt.cutsceneId === 'prolog'
                    ? 'Prolog petualangan stasiun sempat terhenti sebelum selesai! Kamu dapat melanjutkan cutscene dari dialog terakhir atau langsung melewatinya menuju buku teori pertama di Navigation Room.'
                    : 'Seluruh misi pada chapter ini sudah selesai tersimpan! Kamu dapat melanjutkan cutscene dari dialog terakhir atau langsung melewatinya untuk mengklaim hadiah dan membuka chapter berikutnya.'}
                </p>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    onClick={() => {
                      soundEngine.playClick();
                      const cp = cutsceneResumePrompt;
                      setCutsceneResumePrompt(null);
                      setActiveCutsceneInitialLine(cp.lineIndex);
                      setActiveCutscene(cp.cutsceneId);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-display font-bold text-xs md:text-sm text-slate-950 cursor-pointer"
                    style={{
                      backgroundColor: CUTSCENES[cutsceneResumePrompt.cutsceneId].themeColorHex,
                    }}
                  >
                    <Play className="w-4 h-4 fill-current" />
                    LANJUTKAN CUTSCENE
                  </button>
                  <button
                    onClick={() => {
                      soundEngine.playClick();
                      completeCutsceneAndUnlock(cutsceneResumePrompt.cutsceneId);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-display font-bold text-xs md:text-sm border border-slate-600 cursor-pointer"
                  >
                    <FastForward className="w-4 h-4" />
                    {cutsceneResumePrompt.cutsceneId === 'prolog'
                      ? 'LEWATI KE BUKU PERTAMA'
                      : 'LEWATI & LANJUT CHAPTER'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Cutscene Dialogue Overlay (Prolog + Two-way Chapter Cutscenes + Aulia Secret) */}
          {activeCutscene && (
            <CutsceneOverlay
              cutsceneId={activeCutscene}
              initialLineIndex={activeCutsceneInitialLine}
              prependedLines={cutscenePrependedLines}
              onLineChange={handleCutsceneLineChange}
              onFinish={handleCutsceneFinish}
            />
          )}

          {/* Final HOTS Quiz Modal */}
          {quizOpen && (
            <FinalQuizModal
              onFinishQuiz={handleFinishQuiz}
              onClose={() => setQuizOpen(false)}
            />
          )}

          {/* Multiplayer Emergency Meeting & Voting Modal */}
          {isMpMeetingOpen && mp.snapshot?.meeting && mp.playerId && (
            <MeetingModal
              meeting={mp.snapshot.meeting}
              players={mp.snapshot.players}
              myId={mp.playerId}
              myRole={mp.role}
              myPeramalUsed={mp.snapshot.myPeramalUsed}
              peramalResult={mp.peramalResult}
              onInspectRole={(targetId) => mp.inspectRole(targetId)}
              onClearPeramalResult={() => mp.clearPeramalResult()}
              voiceControls={voiceControls}
              voiceEnabled={saveState.settings.voiceEnabled !== false}
              voiceVolume={saveState.settings.voiceVolume ?? 0.9}
              onToggleVoiceFeature={() =>
                setSaveState((p) => ({
                  ...p,
                  settings: { ...p.settings, voiceEnabled: p.settings.voiceEnabled === false },
                }))
              }
              onChangeVoiceVolume={(v) =>
                setSaveState((p) => ({
                  ...p,
                  settings: { ...p.settings, voiceVolume: v },
                }))
              }
              onSendChat={(txt) => mp.sendMeetingChat(txt)}
              onCastVote={(targetId) => mp.castVote(targetId)}
            />
          )}

          {/* Multiplayer Match Result Modal */}
          {isMpResultOpen && mp.snapshot?.matchResult && mp.playerId && (
            <MatchResultModal
              result={mp.snapshot.matchResult}
              myId={mp.playerId}
              onReturnToLobby={() => mp.returnToLobby()}
              onBackHome={() => {
                soundEngine.setVoiceDucking(false);
                mp.leaveRoom();
                mp.disconnect();
                setView('home');
              }}
            />
          )}
        </div>
      )}

      {/* ENDING SUMMARY SCREEN */}
      {view === 'ending' && (
        <EndingScreen
          saveState={saveState}
          onOpenInventory={() => setInventoryOpen(true)}
          onOpenCustomize={() => {
            setCustomizeReturnView('ending');
            setView('customize');
          }}
          onOpenRanking={() => setShowRankingModal(true)}
          onReplayChapters={handleReplayChapters}
          onPlayAgain={handlePlayAgain}
          onBackHome={() => {
            setCustomizeReturnView('home');
            setView('home');
          }}
        />
      )}

      {/* Reward Celebration Modal (Chapters + Secret Batik SMADA Rewards) */}
      {pendingReward && (
        <RewardModal
          chapter={pendingReward.chapter}
          character={saveState.character}
          rewardItem={pendingReward.rewardItem}
          specialItem={pendingReward.specialItem}
          titleLabel={pendingReward.titleLabel}
          subtitleLabel={pendingReward.subtitleLabel}
          continueLabel={pendingReward.continueLabel}
          onEquipAndContinue={handleEquipRewardAndContinue}
          onContinue={handleContinueAfterReward}
        />
      )}

      {/* Global Inventory Modal */}
      {inventoryOpen && (
        <InventoryModal
          character={saveState.character}
          unlockedItems={saveState.unlockedItems}
          saveState={saveState}
          onEquipChange={(nextChar) =>
            setSaveState((prev) => ({ ...prev, character: nextChar }))
          }
          onClose={() => setInventoryOpen(false)}
        />
      )}

      {/* Global Ranking Modal */}
      {showRankingModal && (
        <RankingModal
          currentPlayerId={localPlayerId}
          currentPlayerName={saveState.character.name}
          pendingSync={Boolean(saveState.pendingRankingSync)}
          localBestMs={saveState.bestCompletionMs ?? null}
          localItemCount={
            INVENTORY_ITEMS.filter((i) => !i.isDefault && saveState.unlockedItems.includes(i.id)).length
          }
          localEmoteCount={(saveState.unlockedEmotes || STARTER_EMOTE_IDS).length}
          onSyncNow={() => syncRankingToServer()}
          onClose={() => setShowRankingModal(false)}
        />
      )}

      {/* Full Music Search & Ambience Player Modal */}
      {showMusicModal && (
        <MusicSearchModal
          settings={saveState.settings}
          onUpdateSettings={(next) => setSaveState((p) => ({ ...p, settings: next }))}
          onClose={() => setShowMusicModal(false)}
        />
      )}

      {/* Secret Cultural TV Console Modal */}
      {secretTvOpen && (
        <SecretTvModal
          alreadyCompleted={Boolean(saveState.secretTvCompleted)}
          onComplete={handleSecretTvComplete}
          onClose={() => setSecretTvOpen(false)}
        />
      )}

      {/* Pre-Chapter-1 & Reopenable Visual Tutorial Modal */}
      {tutorialModal.open && (
        <TutorialModal
          isFirstTime={tutorialModal.startPendingSolo}
          onComplete={handleCloseTutorial}
          onSkip={handleCloseTutorial}
        />
      )}

      {/* First-Time Microphone Permission Explanation Modal */}
      {voice.permissionPromptOpen && (
        <div className="fixed inset-0 z-[90] bg-slate-950/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0a1229] border border-sky-500/50 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="space-y-1.5">
              <h3 className="font-display text-lg font-bold text-white">
                Izin Mikrofon untuk Voice Chat Tim
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                GLOBALUS membutuhkan akses mikrofon agar rekan satu tim di room multiplayer dapat mendengar suara Anda saat fitur <strong>On Mic</strong> aktif.
              </p>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-1.5 text-[11px] text-slate-300">
              <p>• Mikrofon dapat dimatikan atau di-mute kapan saja melalui tombol HUD.</p>
              <p>• Jika ditolak, permainan dan chat rapat tetap berjalan normal tanpa gangguan.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                onClick={() => {
                  soundEngine.playClick();
                  voice.dismissMicPermission();
                }}
                className="flex-1 min-h-[42px] py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
              >
                Nanti Saja
              </button>
              <button
                onClick={() => {
                  soundEngine.playClick();
                  voice.confirmMicPermission();
                }}
                className="flex-1 min-h-[42px] py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold cursor-pointer shadow-lg shadow-sky-500/20"
              >
                Lanjutkan &amp; Izinkan Mic
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
