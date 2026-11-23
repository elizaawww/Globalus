import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowUp,
  Award,
  BookCheck,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Crosshair,
  Crown,
  Eye,
  Hand,
  Headphones,
  HelpCircle,
  Home,
  Lock,
  LockOpen,
  LogOut,
  Map as MapIcon,
  MessageSquare,
  Mic,
  MicOff,
  Music,
  Package,
  Palette,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Settings,
  ShieldAlert,
  SkipBack,
  SkipForward,
  Smile,
  Square,
  Trophy,
  Tv,
  Users,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Wind,
  X,
  Zap,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  MUSIC_TRACKS,
  MusicPlaybackState,
  normalizeMusicTrackId,
  soundEngine,
} from '../audio/soundEngine';
import {
  CHAPTER_INFO,
  EMOTE_CATEGORY_LABELS,
  EMOTES,
  IMPOSTOR_CHALLENGES,
  MISSION_META,
  PLAYER_COLORS,
} from '../data/gameData';
import { getRoomSvgPoints, ROOMS, VENTS, WALKABLE_RECTS } from '../data/stationLayout';
import {
  areRequiredBooksRead,
  computeRoomLearningStatus,
  getBooksForRoom,
  getMissionBookProgress,
  THEORY_BOOKS,
} from '../data/theoryBooks';
import {
  AuliaSecretQuestState,
  ConnectionStatus,
  EmoteCategory,
  EmoteId,
  GameSettings,
  GraphicsQuality,
  HostSettings,
  MissionId,
  MultiplayerPhase,
  MultiplayerRole,
  MusicTrackId,
  RoomId,
  RoomMissionStatus,
  RoomSnapshot,
  SaveState,
  TheoryBookId,
} from '../types/game';
import { HudLiveState } from './GameCanvas';
import type {
  VoiceDeviceInfo,
  VoicePermissionState,
  VoiceStatus,
} from '../multiplayer/useVoiceChat';

export interface HudVoiceControls {
  micOn: boolean;
  muted: boolean;
  speaking: boolean;
  micError: string | null;
  voiceStatus?: VoiceStatus;
  voiceStatusLabel?: string;
  permissionState?: VoicePermissionState;
  permissionPromptOpen?: boolean;
  audioInputs?: VoiceDeviceInfo[];
  selectedDeviceId?: string;
  connectedPeerIds: string[];
  locallyMutedIds: string[];
  onToggleMic: () => void;
  onToggleMute: () => void;
  onToggleLocalMutePeer: (peerId: string) => void;
  onClearMicError: () => void;
  onConfirmMicPermission?: () => void;
  onDismissMicPermission?: () => void;
  onSelectDevice?: (deviceId: string) => void;
  onRetryVoice?: () => void;
}

interface HUDProps {
  hud: HudLiveState;
  saveState: SaveState;
  isPaused: boolean;
  joystickInputRef: React.MutableRefObject<{ x: number; y: number }>;
  lockedRooms?: RoomId[];
  chapterLockedRooms?: RoomId[];
  activeMissionRoomId?: RoomId | null;
  activeTheoryBookId?: TheoryBookId | null;
  activeEmote?: EmoteId | null;
  unlockedEmotes?: EmoteId[];
  cameraMode?: '360' | 'topdown';
  secretTvCompleted?: boolean;
  auliaQuest?: AuliaSecretQuestState;
  // Multiplayer Props
  isMultiplayer?: boolean;
  isOnline?: boolean;
  myPlayerId?: string | null;
  mpStatus?: ConnectionStatus;
  reconnectAttempt?: number;
  maxReconnectAttempts?: number;
  mpLastError?: string | null;
  mpRole?: MultiplayerRole | null;
  mpPhase?: MultiplayerPhase | null;
  amAlive?: boolean;
  mpSnapshot?: RoomSnapshot | null;
  completedMpMissions?: string[];
  completedImpChallenges?: string[];
  voiceControls?: HudVoiceControls;
  onTogglePause: () => void;
  onToggleCameraMode?: () => void;
  onOpenInventory: () => void;
  onOpenCustomize?: () => void;
  onOpenRanking?: () => void;
  onOpenMusicModal?: () => void;
  onOpenTutorial?: () => void;
  onResetCamera: () => void;
  onJump: () => void;
  onTriggerEmote: (emoteId: EmoteId) => void;
  onInteract: (roomId: RoomId, missionId?: MissionId) => void;
  onInteractBook?: (bookId: TheoryBookId) => void;
  onInteractVent: (ventId: string) => void;
  onInteractSecretTv?: () => void;
  onInteractCustomizeTerminal?: () => void;
  onInteractAulia?: (action: 'aulia_talk' | 'aulia_ladder_move' | 'aulia_climb_box') => void;
  onCallMeeting?: (reason: 'emergency' | 'report', podId?: string) => void;
  onEliminateTarget?: (targetId: string) => void;
  onToggleReady?: () => void;
  onStartGame?: () => void;
  onUpdateHostSettings?: (next: HostSettings) => void;
  onSendLobbyChat?: (text: string) => void;
  onLeaveMpRoom?: () => void;
  onRetryConnect?: () => void;
  onExitToSolo?: () => void;
  onUpdateSettings: (next: GameSettings) => void;
  onOpenFinalQuiz: () => void;
  onBackHome: () => void;
}

const SpaceshipHullSilhouette: React.FC = () => (
  <g opacity={0.92} pointerEvents="none">
    <path
      d="M 0 -72 C 12 -72 17 -62 17 -48 L 31 -46 L 31 -27 L 28 -25 L 28 -11 L 47 -9 L 47 9 L 28 11 L 28 24 L 11 24 L 8 15 L -8 15 L -11 24 L -28 24 L -28 11 L -47 9 L -47 -9 L -28 -11 L -28 -25 L -31 -27 L -31 -46 L -17 -48 C -17 -62 -12 -72 0 -72 Z"
      fill="#071022"
      stroke="#1e40af"
      strokeWidth={0.9}
      strokeLinejoin="round"
    />
    <rect x={-23} y={24} width={9} height={3.5} rx={1.2} fill="#0ea5e9" opacity={0.55} />
    <rect x={14} y={24} width={9} height={3.5} rx={1.2} fill="#0ea5e9" opacity={0.55} />
    <path d="M -9 -64 Q 0 -70 9 -64" fill="none" stroke="#38bdf8" strokeWidth={0.65} opacity={0.7} />
  </g>
);

export const HUD: React.FC<HUDProps> = ({
  hud,
  saveState,
  isPaused,
  joystickInputRef,
  lockedRooms = [],
  chapterLockedRooms = [],
  activeMissionRoomId = null,
  activeTheoryBookId = null,
  activeEmote = null,
  unlockedEmotes,
  cameraMode = '360',
  secretTvCompleted = false,
  auliaQuest,
  isMultiplayer = false,
  isOnline = true,
  myPlayerId = null,
  mpStatus = 'disconnected',
  reconnectAttempt = 0,
  maxReconnectAttempts = 3,
  mpLastError = null,
  mpRole = null,
  mpPhase = null,
  amAlive = true,
  mpSnapshot = null,
  completedMpMissions = [],
  completedImpChallenges = [],
  voiceControls,
  onTogglePause,
  onToggleCameraMode,
  onOpenInventory,
  onOpenCustomize,
  onOpenRanking,
  onOpenMusicModal,
  onOpenTutorial,
  onResetCamera,
  onJump,
  onTriggerEmote,
  onInteract,
  onInteractBook,
  onInteractVent,
  onInteractSecretTv,
  onInteractCustomizeTerminal,
  onInteractAulia,
  onCallMeeting,
  onEliminateTarget,
  onToggleReady,
  onStartGame,
  onUpdateHostSettings,
  onSendLobbyChat,
  onLeaveMpRoom,
  onRetryConnect,
  onExitToSolo,
  onUpdateSettings,
  onOpenFinalQuiz,
  onBackHome,
}) => {
  const [trackerOpen, setTrackerOpen] = useState(true);
  const [fullMapOpen, setFullMapOpen] = useState(false);
  const [fullMapMode, setFullMapMode] = useState<'follow' | 'free'>('follow');
  const [fullMapZoom, setFullMapZoom] = useState(1.15);
  const [freeMapCenter, setFreeMapCenter] = useState({ x: hud.playerX, z: hud.playerZ });
  const [smoothCenter, setSmoothCenter] = useState({ x: hud.playerX, z: hud.playerZ });
  const [musicPanelOpen, setMusicPanelOpen] = useState(false);
  const [musicPlayback, setMusicPlayback] = useState<MusicPlaybackState>(() =>
    soundEngine.getPlaybackState()
  );
  const [voicePanelOpen, setVoicePanelOpen] = useState(false);
  const [emotesOpen, setEmotesOpen] = useState(false);
  const [emoteCat, setEmoteCat] = useState<EmoteCategory>('sapaan');
  const [joyVisual, setJoyVisual] = useState({ x: 0, y: 0, active: false });
  const [killCdSecs, setKillCdSecs] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [lobbyChatOpen, setLobbyChatOpen] = useState(false);
  const [lobbyChatInput, setLobbyChatInput] = useState('');
  const joyBaseRef = useRef<HTMLDivElement>(null);
  const joyPointerIdRef = useRef<number | null>(null);
  const mapDragRef = useRef<{ pointerId: number; lastX: number; lastY: number } | null>(null);
  const fullMapSvgRef = useRef<SVGSVGElement>(null);
  const playerTargetRef = useRef({ x: hud.playerX, z: hud.playerZ });
  playerTargetRef.current = { x: hud.playerX, z: hud.playerZ };

  useEffect(() => {
    if (!musicPanelOpen) return;
    setMusicPlayback(soundEngine.getPlaybackState());
    return soundEngine.subscribePlayback(setMusicPlayback);
  }, [musicPanelOpen]);

  const chapterData = CHAPTER_INFO[saveState.unlockedChapter];
  const lockedSet = useMemo(() => new Set(lockedRooms), [lockedRooms]);
  const chapterLockedSet = useMemo(() => new Set(chapterLockedRooms), [chapterLockedRooms]);
  const unlockedEmoteSet = useMemo(
    () =>
      new Set<EmoteId>(
        unlockedEmotes && unlockedEmotes.length > 0
          ? unlockedEmotes
          : EMOTES.filter((e) => e.isStarter).map((e) => e.id)
      ),
    [unlockedEmotes]
  );
  const readBooksArr = saveState.readBooks || [];
  const readBookSet = useMemo(() => new Set(readBooksArr), [readBooksArr]);
  const mpDoneSet = useMemo(() => new Set(completedMpMissions), [completedMpMissions]);
  const impDoneSet = useMemo(() => new Set(completedImpChallenges), [completedImpChallenges]);

  const allChaptersDone = !isMultiplayer && saveState.completedChapters.length >= 5;
  const isMpWaitingLobby = isMultiplayer && (mpPhase === 'lobby' || mpSnapshot?.phase === 'lobby');
  const mpPlayers = mpSnapshot?.players || [];
  const mpMe = mpPlayers.find((p) => p.id === myPlayerId);
  const isMpHost = Boolean(mpMe?.isHost);
  const mpAllNonHostReady = mpPlayers.filter((p) => !p.isHost).every((p) => p.ready);
  const canHostStart = isMpHost && mpPlayers.length >= 2 && mpAllNonHostReady && mpStatus === 'connected';
  const lobbyChatCount = mpSnapshot?.lobbyMessages?.length || 0;

  const getRoomStatus = (roomId: RoomId): RoomMissionStatus => {
    const room = ROOMS[roomId];
    const meta = room.missionId ? MISSION_META[room.missionId] : undefined;
    return computeRoomLearningStatus({
      roomId,
      missionId: room.missionId,
      missionChapter: meta?.chapter,
      isMultiplayer,
      unlockedChapter: saveState.unlockedChapter,
      completedMissions: isMultiplayer ? completedMpMissions : saveState.completedMissions,
      lockedRooms,
      activeMissionRoomId,
      activeTheoryBookId,
      readBooks: readBooksArr,
      allChaptersDone,
      quizCompleted: saveState.quizCompleted,
    });
  };

  useEffect(() => {
    if (!isMultiplayer || mpRole !== 'impostor' || !mpSnapshot?.killCooldownEndsAt) {
      setKillCdSecs(0);
      return;
    }
    const update = () => {
      const rem = Math.max(0, Math.ceil((mpSnapshot.killCooldownEndsAt - Date.now()) / 1000));
      setKillCdSecs(rem);
    };
    update();
    const id = window.setInterval(update, 250);
    return () => window.clearInterval(id);
  }, [isMultiplayer, mpRole, mpSnapshot?.killCooldownEndsAt]);

  const updateJoystick = (clientX: number, clientY: number) => {
    const el = joyBaseRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width * 0.38;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    joystickInputRef.current = { x: dx / maxR, y: dy / maxR };
    setJoyVisual({ x: dx, y: dy, active: true });
  };

  const resetJoystick = (pointerId?: number) => {
    if (pointerId !== undefined && joyPointerIdRef.current !== null && pointerId !== joyPointerIdRef.current) {
      return;
    }
    joyPointerIdRef.current = null;
    joystickInputRef.current = { x: 0, y: 0 };
    setJoyVisual({ x: 0, y: 0, active: false });
  };

  // Smoothly interpolate map follow center around controlled player (snap cleanly on teleport)
  useEffect(() => {
    let rafId = 0;
    let lastT = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastT) / 1000));
      lastT = now;
      const target = playerTargetRef.current;
      setSmoothCenter((prev) => {
        const dx = target.x - prev.x;
        const dz = target.z - prev.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 0.015) {
          return prev.x === target.x && prev.z === target.z ? prev : target;
        }
        if (dist > 10) {
          return { x: target.x, z: target.z };
        }
        const alpha = 1 - Math.exp(-12 * dt);
        return {
          x: prev.x + dx * alpha,
          z: prev.z + dz * alpha,
        };
      });
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const playerArrowDeg = 180 - (hud.playerYaw * 180) / Math.PI;

  // Minimap dynamically recenters around controlled player (46x46 span)
  const miniSpan = 46;
  const miniViewBox = `${(smoothCenter.x - miniSpan / 2).toFixed(2)} ${(smoothCenter.z - miniSpan / 2).toFixed(2)} ${miniSpan} ${miniSpan}`;

  // Full station map viewBox supports Follow Player, Free Look pan, Recenter, and Zoom
  const fullSpan = 96 / fullMapZoom;
  const fullCenter = fullMapMode === 'follow' ? smoothCenter : freeMapCenter;
  const fullMapViewBox = `${(fullCenter.x - fullSpan / 2).toFixed(2)} ${(fullCenter.z - fullSpan / 2).toFixed(2)} ${fullSpan.toFixed(2)} ${fullSpan.toFixed(2)}`;

  const activeTrackId: MusicTrackId = normalizeMusicTrackId(saveState.settings.musicTrack);
  const activeTrackDef = MUSIC_TRACKS.find((t) => t.id === activeTrackId) || MUSIC_TRACKS[0];
  const cycleTrack = (dir: -1 | 1) => {
    const idx = MUSIC_TRACKS.findIndex((t) => t.id === activeTrackId);
    const next = MUSIC_TRACKS[(idx + dir + MUSIC_TRACKS.length) % MUSIC_TRACKS.length];
    onUpdateSettings({ ...saveState.settings, musicTrack: next.id, musicPaused: false, musicMuted: false });
  };

  const openFullMap = () => {
    soundEngine.playClick();
    setMusicPanelOpen(false);
    setVoicePanelOpen(false);
    setFullMapMode('follow');
    setFreeMapCenter({ x: hud.playerX, z: hud.playerZ });
    setFullMapOpen(true);
  };

  const recenterFullMap = () => {
    soundEngine.playClick();
    setFullMapMode('follow');
    setFreeMapCenter({ x: hud.playerX, z: hud.playerZ });
  };

  const visibleOtherPlayers = useMemo(() => {
    if (!isMultiplayer || !mpSnapshot) return [];
    return mpSnapshot.players.filter(
      (rp) => rp.id !== myPlayerId && !rp.inVent && (rp.alive || !amAlive)
    );
  }, [isMultiplayer, mpSnapshot, myPlayerId, amAlive]);

  const mpConnectionLost = isMultiplayer && (mpStatus === 'failed' || mpStatus === 'offline' || !isOnline);
  const mpReconnecting = isMultiplayer && !mpConnectionLost && (mpStatus === 'reconnecting' || mpStatus === 'connecting');

  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-2 sm:p-3 md:p-4 safe-hud-inset">
      {/* Spectator Banner */}
      {isMultiplayer && !amAlive && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-30 bg-rose-950/90 border border-rose-500/60 text-rose-200 px-3 sm:px-4 py-1 rounded-xl text-[11px] sm:text-xs font-bold shadow-lg max-w-[90vw] truncate">
          MODE PENONTON (STASIS) — Bantu selesaikan misi atau saksikan permainan
        </div>
      )}

      {/* Multiplayer Connection Recovery Banner (Never stuck in infinite reconnect loop) */}
      {(mpConnectionLost || mpReconnecting) && (
        <div className="fixed top-12 sm:top-14 left-1/2 -translate-x-1/2 z-40 pointer-events-auto w-[min(92vw,420px)] bg-[#070d20]/95 border border-rose-500/55 rounded-xl px-3.5 py-2.5 shadow-2xl flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-bold text-white flex items-center gap-1.5">
              <WifiOff className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              {mpStatus === 'offline' || !isOnline
                ? 'Koneksi Internet Terputus'
                : mpReconnecting
                  ? `Menghubungkan ulang (${reconnectAttempt}/${maxReconnectAttempts})...`
                  : 'Koneksi Multiplayer Terputus'}
            </p>
            {mpConnectionLost && (
              <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                {mpLastError || 'Coba hubungkan ulang atau beralih ke Mode Solo.'}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {mpConnectionLost && onRetryConnect && (
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onRetryConnect();
                }}
                disabled={!isOnline}
                className="min-h-[36px] px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                Coba Lagi
              </button>
            )}
            {onExitToSolo && (
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onExitToSolo();
                }}
                className="min-h-[36px] px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] cursor-pointer"
              >
                Keluar ke Mode Solo
              </button>
            )}
          </div>
        </div>
      )}

      {/* TOP BAR ROW */}
      <div className="flex items-start justify-between gap-2">
        {/* TOP-LEFT: Simplified Objective Checklist or Playable 3D Waiting Lobby Roster */}
        <div className="pointer-events-auto max-w-[245px] sm:max-w-[295px] md:max-w-[330px] bg-[#070d20]/92 border border-sky-500/35 rounded-xl overflow-hidden shadow-lg">
          <button
            onClick={() => {
              soundEngine.playClick();
              setTrackerOpen((o) => !o);
            }}
            className="w-full min-h-[40px] px-3 py-1.5 flex items-center justify-between gap-2 text-left bg-slate-900/75 hover:bg-slate-800/75 cursor-pointer"
          >
            <div className="min-w-0">
              {isMpWaitingLobby ? (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-sky-400 truncate">
                    WAITING LOBBY 3D · {mpSnapshot?.roomCode}
                  </p>
                  <p className="text-[11px] sm:text-xs font-semibold text-white truncate">
                    {mpPlayers.length}/{mpSnapshot?.maxPlayers || 15} Pemain · {isMpHost ? 'Host Room' : mpMe?.ready ? 'Siap' : 'Belum Siap'}
                  </p>
                </>
              ) : isMultiplayer ? (
                <>
                  <p
                    className={`text-[10px] font-bold uppercase tracking-wider truncate ${
                      mpRole === 'impostor'
                        ? 'text-rose-400'
                        : mpRole === 'peramal'
                          ? 'text-violet-300'
                          : 'text-sky-400'
                    }`}
                  >
                    {mpRole === 'impostor' ? 'IMPOSTOR' : mpRole === 'peramal' ? 'PERAMAL' : 'CREWMATE'} · {mpSnapshot?.roomCode}
                  </p>
                  <p className="text-[11px] sm:text-xs font-semibold text-white truncate">
                    {mpRole === 'impostor'
                      ? `Sabotase (${mpSnapshot?.impostorObjectiveDone || 0}/${mpSnapshot?.impostorObjectiveTotal || 4})`
                      : `Misi Tim (${mpSnapshot?.crewMissionDone || 0}/${mpSnapshot?.crewMissionTotal || 6}) · Kamu ${mpDoneSet.size}`}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-sky-400 truncate">
                    {allChaptersDone ? 'EVALUASI AKHIR' : `CHAPTER ${saveState.unlockedChapter}/5`}
                  </p>
                  <p className="text-[11px] sm:text-xs font-semibold text-white truncate">
                    {allChaptersDone ? 'Earth Observation Room' : chapterData.title}
                  </p>
                </>
              )}
            </div>
            {trackerOpen ? (
              <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            )}
          </button>

          {trackerOpen && (
            <div className="px-3 py-2 space-y-2 border-t border-slate-800/80 max-h-[44dvh] overflow-y-auto sci-scroll">
              {isMpWaitingLobby && mpSnapshot ? (
                <div className="space-y-2.5 text-[11px]">
                  {/* Room Code Copy Row */}
                  <div className="flex items-center justify-between gap-2 bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5">
                    <div>
                      <span className="text-[9px] uppercase text-slate-400 block">KODE ROOM</span>
                      <span className="font-mono-num font-extrabold text-sm tracking-widest text-sky-300">
                        {mpSnapshot.roomCode}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        soundEngine.playClick();
                        navigator.clipboard?.writeText(mpSnapshot.roomCode).catch(() => {});
                        setCopiedCode(true);
                        window.setTimeout(() => setCopiedCode(false), 1600);
                      }}
                      className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCode ? 'Tersalin' : 'Salin'}</span>
                    </button>
                  </div>

                  {/* Host Settings */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                        Pengaturan Match
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {mpPlayers.length >= 11 ? 'Peramal Aktif (≥11)' : 'Peramal ≥11 Pemain'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-300">Impostor</span>
                      {isMpHost && onUpdateHostSettings ? (
                        <div className="flex gap-1">
                          {([1, 2, 3] as const).map((cnt) => (
                            <button
                              key={cnt}
                              onClick={() => {
                                soundEngine.playClick();
                                onUpdateHostSettings({
                                  ...(mpSnapshot.hostSettings || { impostorCount: 1, votingDurationSec: 45 }),
                                  impostorCount: cnt,
                                });
                              }}
                              className={`px-2 py-0.5 rounded font-mono-num font-bold cursor-pointer ${
                                (mpSnapshot.hostSettings?.impostorCount || 1) === cnt
                                  ? 'bg-rose-500 text-white'
                                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              }`}
                            >
                              {cnt}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="font-mono-num font-bold text-rose-300">
                          {mpSnapshot.hostSettings?.impostorCount || 1} Impostor
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-300">Waktu Voting</span>
                      {isMpHost && onUpdateHostSettings ? (
                        <div className="flex gap-1">
                          {([30, 45, 60, 90] as const).map((sec) => (
                            <button
                              key={sec}
                              onClick={() => {
                                soundEngine.playClick();
                                onUpdateHostSettings({
                                  ...(mpSnapshot.hostSettings || { impostorCount: 1, votingDurationSec: 45 }),
                                  votingDurationSec: sec,
                                });
                              }}
                              className={`px-1.5 py-0.5 rounded font-mono-num font-bold cursor-pointer ${
                                (mpSnapshot.hostSettings?.votingDurationSec || 45) === sec
                                  ? 'bg-sky-500 text-slate-950'
                                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              }`}
                            >
                              {sec}s
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="font-mono-num font-bold text-sky-300">
                          {mpSnapshot.hostSettings?.votingDurationSec || 45} dtk
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Compact Live Roster */}
                  <div className="space-y-1 max-h-24 overflow-y-auto sci-scroll pr-0.5">
                    {mpPlayers.map((p) => {
                      const col = PLAYER_COLORS.find((c) => c.id === p.character.color) || PLAYER_COLORS[1];
                      return (
                        <div key={p.id} className="flex items-center justify-between gap-2 bg-slate-900/70 rounded-md px-2 py-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: col.hex }} />
                            <span className="truncate font-semibold text-white">
                              {p.name} {p.id === myPlayerId ? '(Kamu)' : ''}
                            </span>
                            {p.isHost && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                          </div>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                              p.isHost
                                ? 'bg-amber-500/20 text-amber-300'
                                : p.ready
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {p.isHost ? 'HOST' : p.ready ? 'SIAP' : 'TUNGGU'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Ready / Start / Customize / Leave Action Row */}
                  <div className="flex flex-col gap-1.5">
                    {isMpHost ? (
                      <button
                        disabled={!canHostStart}
                        onClick={() => {
                          soundEngine.playClick();
                          onStartGame?.();
                        }}
                        className="w-full py-2 px-3 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-display font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        {mpPlayers.length < 2
                          ? 'BUTUH MIN. 2 PEMAIN'
                          : !mpAllNonHostReady
                            ? 'TUNGGU SEMUA SIAP'
                            : 'MULAI PERMAINAN'}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          soundEngine.playClick();
                          onToggleReady?.();
                        }}
                        className={`w-full py-2 px-3 rounded-lg font-display font-bold text-xs cursor-pointer ${
                          mpMe?.ready
                            ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-300'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                        }`}
                      >
                        {mpMe?.ready ? 'SUDAH SIAP (BATALKAN)' : 'TANDAI SIAP'}
                      </button>
                    )}

                    <div className="grid grid-cols-3 gap-1">
                      {onOpenCustomize && (
                        <button
                          onClick={() => {
                            soundEngine.playClick();
                            onOpenCustomize();
                          }}
                          className="py-1.5 px-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Palette className="w-3 h-3" />
                          <span>Kostum</span>
                        </button>
                      )}
                      {onSendLobbyChat && (
                        <button
                          onClick={() => {
                            soundEngine.playClick();
                            setLobbyChatOpen((v) => !v);
                          }}
                          className={`py-1.5 px-1.5 rounded-lg font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer ${
                            lobbyChatOpen
                              ? 'bg-sky-500 text-slate-950'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                          }`}
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Chat ({lobbyChatCount})</span>
                        </button>
                      )}
                      {onLeaveMpRoom && (
                        <button
                          onClick={() => {
                            soundEngine.playClick();
                            onLeaveMpRoom();
                          }}
                          className="py-1.5 px-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <LogOut className="w-3 h-3" />
                          <span>Keluar</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : isMultiplayer ? (
                mpRole === 'impostor' ? (
                  <>
                    <div className="space-y-1.5">
                      {IMPOSTOR_CHALLENGES.map((ch) => {
                        const done = impDoneSet.has(ch.id);
                        return (
                          <div key={ch.id} className="flex items-start gap-2 text-[11px]">
                            <ShieldAlert
                              className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                                done ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            />
                            <span className={done ? 'line-through text-slate-400' : 'text-slate-200'}>
                              {ch.topic} ({ROOMS[ch.roomId].shortName})
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            ((mpSnapshot?.crewMissionDone || 0) / Math.max(1, mpSnapshot?.crewMissionTotal || 1)) * 100
                          )}%`,
                        }}
                      />
                    </div>
                    {mpRole === 'peramal' && (
                      <div className="bg-violet-500/15 border border-violet-400/40 rounded-lg px-2 py-1 text-[10px] text-violet-200">
                        Peramal: Terawang 1 pemain saat Emergency Meeting!
                      </div>
                    )}
                    <div className="space-y-1 max-h-28 overflow-y-auto sci-scroll pr-0.5">
                      {(Object.keys(MISSION_META) as MissionId[]).map((mId) => {
                        const meta = MISSION_META[mId];
                        const done = mpDoneSet.has(mId);
                        return (
                          <div key={mId} className="flex items-start gap-1.5 text-[10px]">
                            {done ? (
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />
                            ) : (
                              <Square className="w-3.5 h-3.5 shrink-0 mt-0.5 text-sky-400" />
                            )}
                            <span className={done ? 'line-through text-slate-400' : 'text-slate-200'}>
                              {meta.title} ({ROOMS[meta.roomId].shortName})
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[10px] font-mono-num text-emerald-300 pt-0.5 border-t border-slate-800/80">
                      Misi Kamu: {mpDoneSet.size}/{Object.keys(MISSION_META).length} · Hidup: {mpPlayers.filter((p) => p.alive).length}
                    </p>
                  </>
                )
              ) : !allChaptersDone ? (
                <>
                  <div className="space-y-1.5">
                    {chapterData.missions.map((mId) => {
                      const meta = MISSION_META[mId];
                      const roomName = ROOMS[meta.roomId].name;
                      const status = getRoomStatus(meta.roomId);
                      const bookProg = getMissionBookProgress(mId, readBooksArr);
                      const done = status === 'completed' || status === 'completed_locked';

                      if (done) {
                        return (
                          <div key={mId} className="flex items-center gap-1.5 text-[11px] text-slate-400">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                            <span className="line-through truncate">{roomName} (Selesai)</span>
                          </div>
                        );
                      }

                      return (
                        <div key={mId} className="space-y-1">
                          <div className="flex items-start gap-1.5 text-[11px]">
                            {bookProg.allRead ? (
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />
                            ) : (
                              <Square className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                            )}
                            <span
                              className={
                                bookProg.allRead
                                  ? 'line-through text-slate-400'
                                  : 'text-amber-100 font-medium'
                              }
                            >
                              Membaca materi di {roomName} ({bookProg.readCount}/{bookProg.totalCount})
                            </span>
                          </div>
                          <div className="flex items-start gap-1.5 text-[11px]">
                            <Square
                              className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                                bookProg.allRead ? 'text-teal-400' : 'text-slate-500'
                              }`}
                            />
                            <span className={bookProg.allRead ? 'text-teal-200 font-medium' : 'text-slate-400'}>
                              Selesaikan kuis di {roomName} (0/1)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {auliaQuest && auliaQuest.stage !== 'not_started' && auliaQuest.stage !== 'completed' && (
                    <div className="bg-sky-500/15 border border-sky-400/40 rounded-lg px-2 py-1.5 text-[10px] text-sky-200 leading-snug">
                      <span className="font-bold text-amber-300 block">Misi Rahasia Aulia:</span>
                      {auliaQuest.stage === 'seeking_box'
                        ? !auliaQuest.ladderPlaced
                          ? 'Ke Cultural Room, pindahkan tangga lipat ke lemari tinggi.'
                          : 'Panjat tangga & ambil kotak "Febriyani" di atas lemari.'
                        : 'Bawa kotak "Febriyani" kembali kepada Aulia di Central Lobby.'}
                    </div>
                  )}
                  <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono-num">
                    <span>Misi {saveState.completedMissions.length}/10</span>
                    <span>Buku {readBookSet.size}/{THEORY_BOOKS.length}</span>
                    <span className="text-amber-300">{saveState.totalExp} EXP</span>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  {auliaQuest && auliaQuest.stage !== 'not_started' && auliaQuest.stage !== 'completed' && (
                    <div className="bg-sky-500/15 border border-sky-400/40 rounded-lg px-2 py-1.5 text-[10px] text-sky-200 leading-snug">
                      <span className="font-bold text-amber-300 block">Misi Rahasia Aulia:</span>
                      {auliaQuest.stage === 'seeking_box'
                        ? !auliaQuest.ladderPlaced
                          ? 'Ke Cultural Room, pindahkan tangga ke lemari tinggi.'
                          : 'Panjat tangga & ambil kotak "Febriyani".'
                        : 'Bawa kotak "Febriyani" ke Aulia di Central Lobby.'}
                    </div>
                  )}
                  <button
                    onClick={() => {
                      soundEngine.playClick();
                      onOpenFinalQuiz();
                    }}
                    className="w-full min-h-[40px] py-2 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Award className="w-4 h-4" />
                    MULAI FINAL QUIZ (12 SOAL)
                  </button>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono-num">
                    <span>5/5 Chapter</span>
                    <span>Buku {readBookSet.size}/{THEORY_BOOKS.length}</span>
                    <span className="text-amber-300">{saveState.totalExp} EXP</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Expandable Lobby Chat Drawer inside 3D Waiting Lobby */}
          {isMpWaitingLobby && lobbyChatOpen && onSendLobbyChat && (
            <div className="border-t border-slate-800 bg-[#050a19]/95 p-2.5 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold text-sky-300 uppercase">
                <span>Chat Lobby</span>
                <button
                  onClick={() => setLobbyChatOpen(false)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="max-h-28 overflow-y-auto sci-scroll space-y-1 text-[11px]">
                {(mpSnapshot?.lobbyMessages || []).length === 0 ? (
                  <p className="text-slate-500 text-[10px] italic">Belum ada pesan lobby.</p>
                ) : (
                  (mpSnapshot?.lobbyMessages || []).map((msg) => (
                    <div key={msg.id} className="leading-snug">
                      <span className="font-bold text-sky-300">{msg.senderName}: </span>
                      <span className="text-slate-200 break-words">{msg.text}</span>
                    </div>
                  ))
                )}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const txt = lobbyChatInput.trim();
                  if (!txt) return;
                  onSendLobbyChat(txt);
                  setLobbyChatInput('');
                }}
                className="flex gap-1"
              >
                <input
                  type="text"
                  maxLength={140}
                  value={lobbyChatInput}
                  onChange={(e) => setLobbyChatInput(e.target.value)}
                  placeholder="Tulis pesan..."
                  className="flex-1 min-w-0 bg-slate-900 border border-slate-700 focus:border-sky-400 rounded-lg px-2 py-1 text-[11px] text-white outline-none"
                />
                <button
                  type="submit"
                  className="px-2 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 cursor-pointer shrink-0"
                  title="Kirim Pesan"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* TOP-CENTER: Current Room & MP Connection (Compass Removed) */}
        <div className="hidden md:flex flex-col items-center bg-[#070d20]/92 border border-slate-700/80 rounded-xl px-4 py-1.5 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-medium text-white">
            <span className="truncate max-w-[210px]">{hud.currentRoomName}</span>
            {isMultiplayer && (
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                  mpStatus === 'connected'
                    ? 'text-emerald-400'
                    : mpConnectionLost
                      ? 'text-rose-400'
                      : 'text-amber-300'
                }`}
              >
                {mpStatus === 'connected' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {mpStatus === 'connected'
                  ? 'Live'
                  : mpStatus === 'offline' || !isOnline
                    ? 'Offline'
                    : mpStatus === 'failed'
                      ? 'Terputus'
                      : `Sync ${reconnectAttempt}/${maxReconnectAttempts}`}
              </span>
            )}
          </div>
          {isMpWaitingLobby && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
              Menunggu Host Memulai
            </span>
          )}
        </div>

        {/* TOP-RIGHT: Voice Chat + Music + Map + Minimap + Action Controls */}
        <div className="pointer-events-auto relative flex flex-col items-end gap-1.5 sm:gap-2">
          <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-1.5 max-w-[54vw] sm:max-w-none">
            {isMultiplayer && voiceControls && (
              <>
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    voiceControls.onToggleMic();
                  }}
                  disabled={!isOnline || saveState.settings.voiceEnabled === false}
                  title={voiceControls.voiceStatusLabel || 'Kontrol Mikrofon Voice Chat'}
                  className={`touch-control px-2.5 py-2 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                    !isOnline || saveState.settings.voiceEnabled === false
                      ? 'bg-slate-900/80 border-slate-700 text-slate-500 cursor-not-allowed'
                      : voiceControls.voiceStatus === 'mic_denied' || voiceControls.voiceStatus === 'no_mic'
                        ? 'bg-rose-950/80 border-rose-500/60 text-rose-200'
                        : voiceControls.voiceStatus === 'mic_requesting'
                          ? 'bg-sky-500/20 border-sky-400/60 text-sky-200'
                          : voiceControls.micOn
                            ? voiceControls.muted
                              ? 'bg-amber-500/20 border-amber-400/60 text-amber-200'
                              : voiceControls.speaking
                                ? 'bg-emerald-500 border-emerald-200 text-slate-950 shadow-lg shadow-emerald-500/30'
                                : 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200'
                            : 'bg-[#070d20]/90 hover:bg-slate-800 border-slate-700 text-slate-200'
                  }`}
                >
                  {voiceControls.micOn && !voiceControls.muted && isOnline ? (
                    <Mic className="w-3.5 h-3.5" />
                  ) : (
                    <MicOff className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">
                    {!isOnline
                      ? 'Offline'
                      : voiceControls.voiceStatus === 'mic_requesting'
                        ? 'Izin Mic...'
                        : voiceControls.voiceStatus === 'mic_denied'
                          ? 'Izin Ditolak'
                          : voiceControls.micOn
                            ? voiceControls.speaking && !voiceControls.muted
                              ? 'Bicara'
                              : voiceControls.muted
                                ? 'Mic Off'
                                : 'Mic On'
                            : 'On Mic'}
                  </span>
                </button>

                {voiceControls.micOn && (
                  <button
                    onClick={() => {
                      soundEngine.playClick();
                      voiceControls.onToggleMute();
                    }}
                    title={voiceControls.muted ? 'Unmute Mikrofon' : 'Mute Mikrofon'}
                    className={`px-2.5 py-2 rounded-xl border text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                      voiceControls.muted
                        ? 'bg-rose-600 hover:bg-rose-500 border-rose-300 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-100'
                    }`}
                  >
                    {voiceControls.muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    <span className="hidden md:inline">{voiceControls.muted ? 'Unmute' : 'Mute'}</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    soundEngine.playClick();
                    setMusicPanelOpen(false);
                    setEmotesOpen(false);
                    setVoicePanelOpen((v) => !v);
                  }}
                  title="Pengaturan & Status Voice Chat"
                  className={`touch-control p-2 rounded-xl border cursor-pointer flex items-center justify-center ${
                    voicePanelOpen
                      ? 'bg-sky-500 border-sky-300 text-slate-950'
                      : 'bg-[#070d20]/90 hover:bg-slate-800 border-slate-700 text-sky-300'
                  }`}
                >
                  <Headphones className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              onClick={() => {
                soundEngine.playClick();
                setVoicePanelOpen(false);
                setEmotesOpen(false);
                setMusicPanelOpen((v) => !v);
              }}
              title="Kontrol Musik Latar"
              className={`touch-control px-2.5 py-2 rounded-xl border flex items-center justify-center gap-1.5 text-[11px] font-bold cursor-pointer ${
                musicPanelOpen
                  ? 'bg-violet-500 border-violet-300 text-white'
                  : saveState.settings.musicMuted || saveState.settings.musicPaused
                    ? 'bg-[#070d20]/90 hover:bg-slate-800 border-slate-700 text-slate-400'
                    : 'bg-[#070d20]/90 hover:bg-slate-800 border-violet-500/40 text-violet-300'
              }`}
            >
              <Music className="w-4 h-4" />
              <span className="hidden lg:inline max-w-[90px] truncate">{activeTrackDef.title}</span>
            </button>

            <button
              onClick={openFullMap}
              className="touch-control p-2 rounded-xl bg-[#070d20]/90 hover:bg-slate-800 border border-slate-700 text-sky-300 flex items-center justify-center cursor-pointer"
              title="Buka Peta Stasiun"
            >
              <MapIcon className="w-4 h-4" />
            </button>
            {onToggleCameraMode && (
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onToggleCameraMode();
                }}
                className={`touch-control p-2 rounded-xl border flex items-center justify-center cursor-pointer ${
                  cameraMode === 'topdown'
                    ? 'bg-sky-500 border-sky-300 text-slate-950'
                    : 'bg-[#070d20]/90 hover:bg-slate-800 border-slate-700 text-sky-200'
                }`}
                title={cameraMode === 'topdown' ? 'Kamera: Top-Down (Klik untuk 360°)' : 'Kamera: 360° (Klik untuk Top-Down)'}
                aria-label="Ganti Mode Kamera"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            {onOpenRanking && (
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onOpenRanking();
                }}
                className="touch-control p-2 rounded-xl bg-[#070d20]/90 hover:bg-slate-800 border border-slate-700 text-amber-300 flex items-center justify-center cursor-pointer"
                title="Ranking Global Stasiun"
                aria-label="Ranking Global Stasiun"
              >
                <Trophy className="w-4 h-4" />
              </button>
            )}
            {!isMultiplayer ? (
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onOpenInventory();
                }}
                className="touch-control p-2 rounded-xl bg-[#070d20]/90 hover:bg-slate-800 border border-slate-700 text-emerald-300 flex items-center justify-center cursor-pointer"
                title="Buka Inventaris"
              >
                <Package className="w-4 h-4" />
              </button>
            ) : isMpWaitingLobby && onOpenCustomize ? (
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onOpenCustomize();
                }}
                className="touch-control p-2 rounded-xl bg-[#070d20]/90 hover:bg-slate-800 border border-sky-500/40 text-sky-300 flex items-center justify-center cursor-pointer"
                title="Kustomisasi Karakter"
              >
                <Palette className="w-4 h-4" />
              </button>
            ) : null}
            <button
              onClick={() => {
                soundEngine.playClick();
                onResetCamera();
              }}
              className="touch-control p-2 rounded-xl bg-[#070d20]/90 hover:bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-center cursor-pointer"
              title="Reset Kamera (R)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                soundEngine.playClick();
                onUpdateSettings({ ...saveState.settings, muted: !saveState.settings.muted });
              }}
              className="touch-control p-2 rounded-xl bg-[#070d20]/90 hover:bg-slate-800 border border-slate-700 text-amber-300 flex items-center justify-center cursor-pointer"
              title="Mute / Unmute Global"
            >
              {saveState.settings.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            {onOpenTutorial && (
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onOpenTutorial();
                }}
                className="touch-control p-2 rounded-xl bg-[#070d20]/90 hover:bg-slate-800 border border-slate-700 text-sky-200 flex items-center justify-center cursor-pointer"
                title="Panduan Tutorial"
                aria-label="Panduan Tutorial"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => {
                soundEngine.playClick();
                onTogglePause();
              }}
              className="touch-control p-2 rounded-xl bg-[#070d20]/90 hover:bg-slate-800 border border-slate-700 text-white flex items-center justify-center cursor-pointer"
              title="Menu Pause (ESC)"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>

          {/* Voice Error Alert */}
          {isMultiplayer && voiceControls?.micError && (
            <div className="w-64 sm:w-72 bg-rose-950/95 border border-rose-500/60 rounded-xl px-3 py-2 text-[11px] text-rose-100 flex items-start justify-between gap-2 shadow-xl">
              <span>{voiceControls.micError}</span>
              <button
                onClick={voiceControls.onClearMicError}
                className="text-rose-300 hover:text-white cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Music Quick Popover */}
          {musicPanelOpen && (
            <div className="w-64 sm:w-72 max-w-[calc(100vw-24px)] max-h-[calc(100dvh-110px)] overflow-y-auto sci-scroll bg-[#070d22]/95 border border-violet-500/45 rounded-2xl p-3.5 shadow-2xl space-y-3 z-40">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-violet-400" />
                  <span className="font-display text-xs font-bold text-white uppercase tracking-wider">
                    MUSIK STASIUN
                  </span>
                </div>
                <button
                  onClick={() => setMusicPanelOpen(false)}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {musicPlayback.isExternal && saveState.settings.selectedExternalTrack
                        ? saveState.settings.selectedExternalTrack.title
                        : activeTrackDef.title}
                    </p>
                    <p className="text-[10px] text-violet-300 truncate">
                      {musicPlayback.isExternal && saveState.settings.selectedExternalTrack
                        ? saveState.settings.selectedExternalTrack.artist || 'Musik Online'
                        : activeTrackDef.genre}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => cycleTrack(-1)}
                      title="Lagu Sebelumnya"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                    >
                      <SkipBack className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        soundEngine.playClick();
                        if (musicPlayback.ended) {
                          soundEngine.replayCurrentTrack();
                          if (saveState.settings.musicPaused) {
                            onUpdateSettings({ ...saveState.settings, musicPaused: false });
                          }
                        } else {
                          onUpdateSettings({
                            ...saveState.settings,
                            musicPaused: !saveState.settings.musicPaused,
                          });
                        }
                      }}
                      title={
                        musicPlayback.ended
                          ? 'Putar Ulang'
                          : saveState.settings.musicPaused
                            ? 'Putar Musik'
                            : 'Jeda Musik'
                      }
                      className="p-1.5 rounded-lg bg-violet-500 hover:bg-violet-400 text-white cursor-pointer"
                    >
                      {musicPlayback.ended ? (
                        <RotateCcw className="w-3.5 h-3.5" />
                      ) : saveState.settings.musicPaused ? (
                        <Play className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Pause className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => cycleTrack(1)}
                      title="Lagu Berikutnya"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Live Playback Progress */}
                <div className="space-y-1">
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-violet-400 transition-[width] duration-200"
                      style={{
                        width: `${
                          musicPlayback.durationSec > 0
                            ? Math.min(100, (musicPlayback.currentTimeSec / musicPlayback.durationSec) * 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono-num text-slate-400">
                    <span>
                      {`${Math.floor(musicPlayback.currentTimeSec / 60)}:${String(
                        Math.floor(musicPlayback.currentTimeSec % 60)
                      ).padStart(2, '0')}`}
                    </span>
                    <span className="text-violet-300">
                      {musicPlayback.ended
                        ? 'Selesai'
                        : musicPlayback.isPreview
                          ? 'Preview 30 dtk'
                          : musicPlayback.isExternal
                            ? 'Full Song Online'
                            : 'Audio Stasiun'}
                    </span>
                    <span>
                      {`${Math.floor(musicPlayback.durationSec / 60)}:${String(
                        Math.floor(musicPlayback.durationSec % 60)
                      ).padStart(2, '0')}`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300">Volume Musik</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono-num text-violet-300">
                      {Math.round(saveState.settings.musicVolume * 100)}%
                    </span>
                    <button
                      onClick={() =>
                        onUpdateSettings({
                          ...saveState.settings,
                          musicMuted: !saveState.settings.musicMuted,
                        })
                      }
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                        saveState.settings.musicMuted
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-slate-800 text-slate-200'
                      }`}
                    >
                      {saveState.settings.musicMuted ? 'Dimatikan' : 'Matikan'}
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={saveState.settings.musicVolume}
                  onChange={(e) =>
                    onUpdateSettings({ ...saveState.settings, musicVolume: parseFloat(e.target.value) })
                  }
                  className="w-full accent-violet-400 cursor-pointer"
                />
              </div>

              <div className="space-y-1 max-h-36 overflow-y-auto sci-scroll pr-0.5">
                {MUSIC_TRACKS.map((tr) => {
                  const selected = tr.id === activeTrackId;
                  return (
                    <button
                      key={tr.id}
                      onClick={() =>
                        onUpdateSettings({
                          ...saveState.settings,
                          musicTrack: tr.id,
                          musicPaused: false,
                          musicMuted: false,
                        })
                      }
                      className={`w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between text-[11px] cursor-pointer ${
                        selected
                          ? 'bg-violet-500/20 border border-violet-400/60 text-white'
                          : 'bg-slate-900/70 hover:bg-slate-800 text-slate-300 border border-transparent'
                      }`}
                    >
                      <span className="font-semibold truncate">{tr.title}</span>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-2">{tr.genre}</span>
                    </button>
                  );
                })}
              </div>
              {onOpenMusicModal && (
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    setMusicPanelOpen(false);
                    onOpenMusicModal();
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/50 text-sky-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  Cari Lagu Online &amp; Pemutar Lengkap
                </button>
              )}
              <p className="text-[10px] text-slate-400">
                * Audio otomatis mengecil saat dialog, cutscene, dan voice chat.
              </p>
            </div>
          )}

          {/* Voice Chat Panel Popover */}
          {isMultiplayer && voicePanelOpen && voiceControls && (
            <div className="w-64 sm:w-72 max-w-[calc(100vw-24px)] max-h-[calc(100dvh-110px)] overflow-y-auto sci-scroll bg-[#070d22]/95 border border-sky-500/45 rounded-2xl p-3.5 shadow-2xl space-y-3 z-40">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-sky-400" />
                  <span className="font-display text-xs font-bold text-white uppercase tracking-wider">
                    VOICE CHAT TIM
                  </span>
                </div>
                <button
                  onClick={() => setVoicePanelOpen(false)}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {!isOnline && (
                <div className="bg-amber-950/60 border border-amber-500/40 rounded-lg px-2.5 py-1.5 text-[11px] text-amber-200">
                  Mode Offline aktif — Voice Chat membutuhkan koneksi internet.
                </div>
              )}

              {/* Explicit Voice Connection & Permission Status */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-slate-400">Status Voice</span>
                  <span
                    className={`font-bold ${
                      voiceControls.voiceStatus === 'mic_denied' ||
                      voiceControls.voiceStatus === 'no_mic' ||
                      voiceControls.voiceStatus === 'voice_failed'
                        ? 'text-rose-300'
                        : voiceControls.voiceStatus === 'voice_connected' ||
                            voiceControls.voiceStatus === 'mic_active'
                          ? 'text-emerald-300'
                          : 'text-sky-300'
                    }`}
                  >
                    {voiceControls.voiceStatusLabel || (voiceControls.micOn ? 'Mic Aktif' : 'Siap')}
                  </span>
                </div>
                {voiceControls.voiceStatus === 'voice_failed' && voiceControls.onRetryVoice && (
                  <button
                    onClick={() => {
                      soundEngine.playClick();
                      voiceControls.onRetryVoice?.();
                    }}
                    className="w-full py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/50 text-sky-200 text-[11px] font-bold cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Sambung Ulang Voice
                  </button>
                )}
                {(voiceControls.voiceStatus === 'mic_denied' || voiceControls.voiceStatus === 'no_mic') && (
                  <p className="text-[10px] text-amber-200/90 leading-relaxed">
                    {voiceControls.voiceStatus === 'mic_denied'
                      ? 'Ketuk ikon gembok di bilah browser → Izinkan Mikrofon, lalu tekan On Mic lagi. Game tetap dapat dimainkan.'
                      : 'Sambungkan headset/mikrofon atau pilih input audio yang tersedia di perangkat Anda.'}
                  </p>
                )}
              </div>

              {voiceControls.audioInputs && voiceControls.audioInputs.length > 0 && voiceControls.onSelectDevice && (
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-400 font-semibold">
                    Perangkat Mikrofon
                  </label>
                  <select
                    value={voiceControls.selectedDeviceId || ''}
                    onChange={(e) => voiceControls.onSelectDevice?.(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-100 outline-none focus:border-sky-400"
                  >
                    {voiceControls.audioInputs.map((dev) => (
                      <option key={dev.deviceId} value={dev.deviceId}>
                        {dev.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 text-xs">
                <span className="text-slate-200 font-medium">Fitur Voice Chat</span>
                <button
                  onClick={() =>
                    onUpdateSettings({
                      ...saveState.settings,
                      voiceEnabled: saveState.settings.voiceEnabled === false,
                    })
                  }
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                    saveState.settings.voiceEnabled === false
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-emerald-500 text-slate-950'
                  }`}
                >
                  {saveState.settings.voiceEnabled === false ? 'Nonaktif' : 'Aktif'}
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-300">Volume Suara Pemain</span>
                  <span className="font-mono-num text-sky-300">
                    {Math.round((saveState.settings.voiceVolume ?? 0.9) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={saveState.settings.voiceVolume ?? 0.9}
                  onChange={(e) =>
                    onUpdateSettings({ ...saveState.settings, voiceVolume: parseFloat(e.target.value) })
                  }
                  className="w-full accent-sky-400 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto sci-scroll pr-0.5">
                {(mpSnapshot?.players || []).map((rp) => {
                  const isMe = rp.id === myPlayerId;
                  const peerMicOn = isMe ? voiceControls.micOn : Boolean(rp.voice?.micOn);
                  const peerMuted = isMe ? voiceControls.muted : Boolean(rp.voice?.muted);
                  const peerSpeaking = isMe
                    ? voiceControls.micOn && !voiceControls.muted && voiceControls.speaking
                    : Boolean(rp.voice?.micOn && !rp.voice?.muted && rp.voice?.speaking);
                  const locallyMuted = voiceControls.locallyMutedIds.includes(rp.id);
                  return (
                    <div
                      key={rp.id}
                      className="flex items-center justify-between gap-2 bg-slate-900/75 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px]"
                    >
                      <div className="min-w-0 flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            peerSpeaking
                              ? 'bg-emerald-400'
                              : peerMicOn && !peerMuted
                                ? 'bg-sky-400'
                                : 'bg-slate-600'
                          }`}
                        />
                        <span className="text-slate-100 font-semibold truncate">
                          {rp.name} {isMe ? '(Kamu)' : ''}
                        </span>
                      </div>
                      {isMe ? (
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {!peerMicOn ? 'Mic Off' : peerMuted ? 'Muted' : peerSpeaking ? 'Bicara' : 'Siap'}
                        </span>
                      ) : (
                        <button
                          onClick={() => voiceControls.onToggleLocalMutePeer(rp.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer shrink-0 ${
                            locallyMuted
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          {locallyMuted ? 'Unmute' : 'Bisukan'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Live Minimap (Compact on short mobile landscape) */}
          <button
            onClick={openFullMap}
            className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 bg-[#060b1c]/92 border border-sky-500/40 rounded-xl p-1 shadow-lg cursor-pointer hover:border-sky-400 overflow-hidden"
            title="Klik untuk Peta Besar"
          >
            <svg viewBox={miniViewBox} className="w-full h-full">
              <SpaceshipHullSilhouette />
              {WALKABLE_RECTS.map((r) =>
                r.roomId ? (
                  <polygon
                    key={r.id}
                    points={getRoomSvgPoints(r.roomId)}
                    fill="#1e293b"
                    stroke="#38bdf8"
                    strokeWidth={0.5}
                    strokeLinejoin="round"
                  />
                ) : (
                  <rect
                    key={r.id}
                    x={r.minX}
                    y={r.minZ}
                    width={r.maxX - r.minX}
                    height={r.maxZ - r.minZ}
                    fill="#0f172a"
                    stroke="#334155"
                    strokeWidth={0.25}
                  />
                )
              )}
              {VENTS.map((v) => (
                <rect
                  key={v.id}
                  x={v.x - 0.8}
                  y={v.z - 0.8}
                  width={1.6}
                  height={1.6}
                  fill="#10b981"
                  opacity={0.7}
                />
              ))}
              {Object.values(ROOMS).map((room) => {
                const status = getRoomStatus(room.id);
                const showMarker = room.missionId || room.id === 'earth_observation_room';
                if (!showMarker) return null;
                const fillColor =
                  status === 'completed' || status === 'completed_locked'
                    ? '#10b981'
                    : status === 'in_progress'
                      ? '#0ea5e9'
                      : status === 'reading'
                        ? '#38bdf8'
                        : status === 'ready_quiz'
                          ? '#14b8a6'
                          : status === 'unread'
                            ? '#f59e0b'
                            : '#f43f5e';
                const symbol =
                  status === 'completed_locked'
                    ? '🔒✓'
                    : status === 'completed'
                      ? '✓'
                      : status === 'in_progress'
                        ? '●'
                        : status === 'reading'
                          ? '📖'
                          : status === 'ready_quiz'
                            ? '✓'
                            : status === 'unread'
                              ? '!'
                              : '🔒';
                return (
                  <g key={room.id}>
                    <circle
                      cx={room.terminalPos.x}
                      cy={room.terminalPos.z}
                      r={1.7}
                      fill={fillColor}
                      stroke="#020617"
                      strokeWidth={0.4}
                    />
                    <text
                      x={room.terminalPos.x}
                      y={room.terminalPos.z + (status === 'completed_locked' ? 0.55 : 0.72)}
                      textAnchor="middle"
                      fontSize={status === 'completed_locked' ? '1.35' : '1.9'}
                      fill="#020617"
                      fontWeight="bold"
                    >
                      {symbol}
                    </text>
                  </g>
                );
              })}
              {/* Remote Multiplayer Players (colored dots distinct from local directional arrow) */}
              {visibleOtherPlayers.map((rp) => {
                const col = PLAYER_COLORS.find((c) => c.id === rp.character.color) || PLAYER_COLORS[1];
                return (
                  <circle
                    key={rp.id}
                    cx={rp.x}
                    cy={rp.z}
                    r={1.35}
                    fill={col.hex}
                    stroke="#020617"
                    strokeWidth={0.45}
                    opacity={rp.alive ? 0.95 : 0.55}
                  />
                );
              })}
              {/* Local Active Player Directional Arrow */}
              <g transform={`translate(${hud.playerX}, ${hud.playerZ}) rotate(${playerArrowDeg})`}>
                <circle cx={0} cy={0} r={2.5} fill="#38bdf8" fillOpacity={0.22} />
                <polygon
                  points="0,-2.1 1.55,1.55 0,0.85 -1.55,1.55"
                  fill="#ffffff"
                  stroke="#0284c7"
                  strokeWidth={0.55}
                />
              </g>
            </svg>
          </button>
        </div>
      </div>

      {/* BOTTOM ROW: Touch Joystick, Device-Aware Proximity Prompts, Jump/Emotes/Action Controls */}
      <div className="flex items-end justify-between gap-2 sm:gap-4">
        {/* Bottom-Left: Virtual Joystick (isolated pointerId for smooth multi-touch camera 360°) */}
        <div className="pointer-events-auto shrink-0">
          {saveState.settings.showTouchControls && (
            <div
              ref={joyBaseRef}
              onPointerDown={(e) => {
                e.stopPropagation();
                joyPointerIdRef.current = e.pointerId;
                try {
                  e.currentTarget.setPointerCapture(e.pointerId);
                } catch {
                  // ignore
                }
                updateJoystick(e.clientX, e.clientY);
              }}
              onPointerMove={(e) => {
                if (joyPointerIdRef.current === e.pointerId) {
                  e.stopPropagation();
                  updateJoystick(e.clientX, e.clientY);
                }
              }}
              onPointerUp={(e) => resetJoystick(e.pointerId)}
              onPointerCancel={(e) => resetJoystick(e.pointerId)}
              className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-slate-900/75 border-2 border-sky-400/40 flex items-center justify-center touch-none cursor-grab"
            >
              <div
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-sky-400/85 border-2 border-white shadow-lg transition-transform duration-75"
                style={{ transform: `translate(${joyVisual.x}px, ${joyVisual.y}px)` }}
              />
            </div>
          )}
        </div>

        {/* Bottom-Center: Device-Aware Proximity Prompts */}
        <div className="flex flex-col items-center gap-1.5 mb-0.5 min-w-0 flex-1 max-w-[calc(100vw-220px)] sm:max-w-lg">
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            {hud.nearbyStasisPod && amAlive && onCallMeeting && (
              <button
                onClick={() => {
                  soundEngine.playInteract();
                  onCallMeeting('report', hud.nearbyStasisPod!.id);
                }}
                className="pointer-events-auto min-h-[44px] flex items-center gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-display font-bold text-[11px] sm:text-xs md:text-sm shadow-xl cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  {hud.isTouchDevice
                    ? `Tap Laporkan Stasis (${hud.nearbyStasisPod.victimName})`
                    : `Tekan E — Laporkan Stasis (${hud.nearbyStasisPod.victimName})`}
                </span>
              </button>
            )}

            {hud.nearbyVent && amAlive && (
              <button
                onClick={() => {
                  soundEngine.playInteract();
                  onInteractVent(hud.nearbyVent!.id);
                }}
                className="pointer-events-auto min-h-[44px] flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-[11px] sm:text-xs md:text-sm shadow-xl cursor-pointer"
              >
                <Wind className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  {hud.isTouchDevice
                    ? `Tap ${hud.nearbyVent.label}`
                    : `Tekan E — ${hud.nearbyVent.label}`}
                </span>
              </button>
            )}

            {hud.nearbyBook && onInteractBook && (() => {
              const isBookRead = readBookSet.has(hud.nearbyBook.id);
              const isBookOpen = activeTheoryBookId === hud.nearbyBook.id;
              return (
                <button
                  onClick={() => {
                    soundEngine.playInteract();
                    onInteractBook(hud.nearbyBook!.id);
                  }}
                  className={`pointer-events-auto min-h-[44px] flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-display font-bold text-[11px] sm:text-xs md:text-sm shadow-xl cursor-pointer border-2 max-w-full ${
                    isBookOpen
                      ? 'bg-sky-400 border-sky-200 text-slate-950 shadow-sky-500/25'
                      : isBookRead
                        ? 'bg-emerald-500 hover:bg-emerald-400 border-emerald-300 text-slate-950 shadow-emerald-500/25'
                        : 'bg-amber-400 hover:bg-amber-300 border-amber-200 text-slate-950 shadow-amber-500/35'
                  }`}
                >
                  {!hud.isTouchDevice ? (
                    <kbd className="inline-flex items-center justify-center min-w-[22px] h-6 px-1.5 rounded-md bg-slate-950 text-amber-300 font-mono-num text-xs font-extrabold shadow shrink-0">
                      E
                    </kbd>
                  ) : (
                    <Hand className="w-4 h-4 shrink-0" />
                  )}
                  {isBookRead ? (
                    <BookCheck className="w-4 h-4 shrink-0" />
                  ) : (
                    <BookOpen className="w-4 h-4 shrink-0" />
                  )}
                  <span className="truncate">
                    {hud.isTouchDevice
                      ? isBookRead
                        ? `Tap untuk baca ulang Buku (${hud.nearbyBook.topicLabel})`
                        : `Tap untuk membaca Buku (${hud.nearbyBook.topicLabel})`
                      : isBookRead
                        ? `Tekan E — Baca Ulang Buku (${hud.nearbyBook.topicLabel})`
                        : `Tekan E untuk membuka Buku (${hud.nearbyBook.topicLabel})`}
                  </span>
                </button>
              );
            })()}

            {hud.nearbyTerminal && (() => {
              const term = hud.nearbyTerminal;
              const isMissionTerm = Boolean(term.missionId);
              const termMission = term.missionId;
              const isImpMp = isMultiplayer && mpRole === 'impostor';
              const isDone = termMission
                ? isMultiplayer
                  ? mpDoneSet.has(termMission)
                  : saveState.completedMissions.includes(termMission)
                : false;
              const chapLocked =
                !isMultiplayer &&
                termMission !== undefined &&
                MISSION_META[termMission].chapter > saveState.unlockedChapter;
              const booksReady =
                !isMissionTerm ||
                isImpMp ||
                !termMission ||
                areRequiredBooksRead(termMission, readBooksArr);
              const blockedByBook = isMissionTerm && !isImpMp && !chapLocked && !booksReady && !isDone;
              return (
                <button
                  onClick={() => {
                    soundEngine.playInteract();
                    onInteract(term.roomId, term.missionId);
                  }}
                  className={`pointer-events-auto min-h-[44px] flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-display font-bold text-[11px] sm:text-xs md:text-sm shadow-xl cursor-pointer max-w-full ${
                    blockedByBook
                      ? 'bg-amber-950/95 hover:bg-amber-900 border border-amber-400/60 text-amber-200 shadow-amber-500/15'
                      : chapLocked
                        ? 'bg-slate-800/95 border border-slate-600 text-slate-300'
                        : booksReady && isMissionTerm && !isDone
                          ? 'bg-teal-400 hover:bg-teal-300 text-slate-950 shadow-teal-500/30'
                          : 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-sky-500/30'
                  }`}
                >
                  {blockedByBook || chapLocked ? (
                    <Lock className="w-4 h-4 shrink-0" />
                  ) : booksReady && isMissionTerm && !isDone ? (
                    <LockOpen className="w-4 h-4 shrink-0" />
                  ) : hud.isTouchDevice ? (
                    <Hand className="w-4 h-4 shrink-0" />
                  ) : (
                    <kbd className="inline-flex items-center justify-center min-w-[22px] h-6 px-1.5 rounded-md bg-slate-950 text-sky-300 font-mono-num text-xs font-extrabold shadow shrink-0">
                      E
                    </kbd>
                  )}
                  <span className="truncate">
                    {blockedByBook
                      ? `Kuis Terkunci — Baca Buku Teori Dulu (${term.label})`
                      : hud.isTouchDevice
                        ? `Tap untuk membuka Terminal (${term.label})`
                        : `Tekan E untuk mengakses Terminal (${term.label})`}
                  </span>
                </button>
              );
            })()}

            {hud.nearbySecretTv && !isMultiplayer && onInteractSecretTv && (
              <button
                onClick={() => {
                  soundEngine.playInteract();
                  onInteractSecretTv();
                }}
                className="pointer-events-auto min-h-[44px] flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-pink-500 hover:bg-pink-400 text-slate-950 font-display font-bold text-[11px] sm:text-xs md:text-sm shadow-xl cursor-pointer"
              >
                <Tv className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  {hud.isTouchDevice
                    ? secretTvCompleted
                      ? 'Tap TV Budaya Global (Selesai)'
                      : 'Tap TV Budaya Global (Rahasia)'
                    : secretTvCompleted
                      ? 'Tekan E — TV Budaya Global (Selesai)'
                      : 'Tekan E — TV Budaya Global (Rahasia)'}
                </span>
              </button>
            )}

            {isMpWaitingLobby && hud.nearbyCustomizeTerminal && onInteractCustomizeTerminal && (
              <button
                onClick={() => {
                  soundEngine.playInteract();
                  onInteractCustomizeTerminal();
                }}
                className="pointer-events-auto min-h-[44px] flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-display font-bold text-[11px] sm:text-xs md:text-sm shadow-xl cursor-pointer"
              >
                <Palette className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  {hud.isTouchDevice
                    ? 'Tap Terminal Kustomisasi'
                    : 'Tekan E — Terminal Kustomisasi'}
                </span>
              </button>
            )}

            {!isMultiplayer && hud.nearbyAuliaInteract && onInteractAulia && (
              <button
                onClick={() => {
                  soundEngine.playInteract();
                  onInteractAulia(hud.nearbyAuliaInteract!);
                }}
                className="pointer-events-auto min-h-[44px] flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-display font-bold text-[11px] sm:text-xs md:text-sm shadow-xl cursor-pointer"
              >
                <Hand className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  {hud.nearbyAuliaInteract === 'aulia_ladder_move'
                    ? hud.isTouchDevice
                      ? 'Tap Pindahkan Tangga ke Lemari'
                      : 'Tekan E — Pindahkan Tangga ke Lemari'
                    : hud.nearbyAuliaInteract === 'aulia_climb_box'
                      ? hud.isTouchDevice
                        ? 'Tap Panjat & Ambil Kotak "Febriyani"'
                        : 'Tekan E — Panjat & Ambil Kotak "Febriyani"'
                      : hud.isTouchDevice
                        ? 'Tap Berikan Kotak ke Aulia'
                        : 'Tekan E — Berikan Kotak ke Aulia'}
                </span>
              </button>
            )}

            {hud.nearbyEmergencyConsole && !isMpWaitingLobby && amAlive && onCallMeeting && (
              <button
                onClick={() => {
                  soundEngine.playInteract();
                  onCallMeeting('emergency');
                }}
                className="pointer-events-auto min-h-[44px] flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-bold text-[11px] sm:text-xs md:text-sm shadow-xl cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  {hud.isTouchDevice ? 'Tap Emergency Meeting' : 'Tekan E — Emergency Meeting'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Bottom-Right: Closable 6-Category 18-Emote Panel + Jump / Emotes / Impostor Actions */}
        <div className="pointer-events-auto relative flex flex-col items-end gap-2 shrink-0">
          {emotesOpen && (
            <div className="w-72 sm:w-80 max-w-[calc(100vw-24px)] max-h-[calc(100dvh-110px)] overflow-y-auto sci-scroll bg-[#070d22]/95 border border-sky-500/45 rounded-2xl p-3 shadow-2xl space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Smile className="w-4 h-4 text-sky-400" />
                  <span className="font-display text-xs font-bold text-white uppercase tracking-wider">
                    EMOTES ({unlockedEmoteSet.size}/{EMOTES.length})
                  </span>
                </div>
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    setEmotesOpen(false);
                  }}
                  aria-label="Tutup Panel Emote"
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {(Object.keys(EMOTE_CATEGORY_LABELS) as EmoteCategory[]).map((catKey) => (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setEmoteCat(catKey);
                    }}
                    className={`px-1.5 py-1 rounded-lg text-[10px] font-bold truncate cursor-pointer ${
                      emoteCat === catKey
                        ? 'bg-sky-400 text-slate-950'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {EMOTE_CATEGORY_LABELS[catKey]}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {EMOTES.filter((em) => em.category === emoteCat).map((em) => {
                  const isUnlocked = unlockedEmoteSet.has(em.id);
                  const isActive = activeEmote === em.id;
                  return (
                    <button
                      key={em.id}
                      disabled={!isUnlocked}
                      onClick={() => {
                        if (!isUnlocked) return;
                        onTriggerEmote(em.id);
                        setEmotesOpen(false);
                      }}
                      title={isUnlocked ? em.label : `${em.label} — ${em.unlockLabel || 'Terkunci'}`}
                      className={`min-h-[54px] flex flex-col items-center justify-center py-1.5 px-1.5 rounded-xl border transition-all ${
                        !isUnlocked
                          ? 'bg-slate-950/80 border-slate-800 text-slate-500 cursor-not-allowed opacity-70'
                          : isActive
                            ? 'bg-sky-500/25 border-sky-400 text-white cursor-pointer'
                            : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/80 text-slate-200 cursor-pointer'
                      }`}
                    >
                      <span className="text-base leading-none">{isUnlocked ? em.emoji : '🔒'}</span>
                      <span className="text-[10px] font-semibold truncate w-full text-center mt-1">
                        {em.label}
                      </span>
                      {!isUnlocked && em.unlockLabel && (
                        <span className="text-[8px] text-amber-300/80 truncate w-full text-center">
                          {em.unlockLabel}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5 sm:gap-2">
            {isMultiplayer && mpRole === 'impostor' && amAlive && onEliminateTarget && (
              <button
                disabled={!hud.nearbyEliminateTarget || killCdSecs > 0}
                onClick={() => {
                  if (hud.nearbyEliminateTarget) {
                    soundEngine.playEliminate();
                    onEliminateTarget(hud.nearbyEliminateTarget.id);
                  }
                }}
                className={`min-h-[48px] px-3 sm:px-4 py-2 sm:py-3 rounded-2xl font-display font-bold text-[11px] sm:text-xs flex flex-col items-center justify-center border-2 shadow-xl transition-all ${
                  hud.nearbyEliminateTarget && killCdSecs === 0
                    ? 'bg-rose-600 hover:bg-rose-500 border-rose-300 text-white cursor-pointer'
                    : 'bg-slate-900/90 border-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" />
                <span>
                  {killCdSecs > 0
                    ? `STASIS (${killCdSecs}s)`
                    : hud.nearbyEliminateTarget
                      ? `STASIS: ${hud.nearbyEliminateTarget.name}`
                      : 'STASIS'}
                </span>
              </button>
            )}

            <button
              onClick={() => {
                soundEngine.playClick();
                setMusicPanelOpen(false);
                setVoicePanelOpen(false);
                setEmotesOpen((v) => !v);
              }}
              aria-label="Buka Panel Emote"
              title="Emotes"
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 font-display font-bold text-[9px] sm:text-[10px] flex flex-col items-center justify-center shadow-lg cursor-pointer transition-colors ${
                emotesOpen || activeEmote
                  ? 'bg-violet-500 border-violet-300 text-white'
                  : 'bg-[#08122b]/90 hover:bg-slate-800 border-violet-400/50 text-violet-200'
              }`}
            >
              <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>EMOTE</span>
            </button>

            <button
              onPointerDown={(e) => {
                e.stopPropagation();
                onJump();
              }}
              onClick={(e) => e.preventDefault()}
              aria-label="Lompat"
              title="Lompat (Spasi)"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-sky-500 hover:bg-sky-400 active:scale-95 border-2 border-sky-200 text-slate-950 font-display font-bold text-[9px] sm:text-[10px] flex flex-col items-center justify-center shadow-xl cursor-pointer touch-none"
            >
              <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              <span>LOMPAT</span>
            </button>
          </div>
        </div>
      </div>

      {/* FULL STATION MAP MODAL (INFO ONLY — NO INSTANT TELEPORT!) */}
      {fullMapOpen && (
        <div className="fixed inset-0 z-50 pointer-events-auto bg-slate-950/85 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[90vh] bg-[#080f24] border border-sky-500/40 rounded-2xl p-5 flex flex-col gap-4 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-display text-lg font-bold text-white">
                  PETA GLOBALUS SPACE STATION (11 RUANGAN &amp; STATUS MISI)
                </h3>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-slate-300">
                  <span className="inline-flex items-center gap-1 text-amber-300">
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] inline-flex items-center justify-center">!</span>
                    Belum Dibaca (Buku + !)
                  </span>
                  <span className="inline-flex items-center gap-1 text-sky-300">
                    <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                    Sedang Membaca
                  </span>
                  <span className="inline-flex items-center gap-1 text-teal-300">
                    <BookCheck className="w-3.5 h-3.5 text-teal-400" />
                    Siap Kuis (Buku ✓ · Kuis Terbuka)
                  </span>
                  <span className="inline-flex items-center gap-1 text-emerald-300">
                    <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 font-black text-[9px] inline-flex items-center justify-center">✓</span>
                    Selesai / Terbuka
                  </span>
                  <span className="inline-flex items-center gap-1 text-emerald-300">
                    <Lock className="w-3 h-3 text-emerald-400" />
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Selesai &amp; Terkunci
                  </span>
                  <span className="inline-flex items-center gap-1 text-rose-300">
                    <Lock className="w-3 h-3 text-rose-400" />
                    Terkunci (Chapter)
                  </span>
                  <span className="inline-flex items-center gap-1 text-amber-200 font-mono-num">
                    · Buku: {readBookSet.size}/{THEORY_BOOKS.length}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setFullMapOpen(false);
                }}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 min-h-0">
              <div className="md:col-span-7 bg-[#050916] border border-slate-800 rounded-xl p-3 flex flex-col gap-2.5">
                {/* Interactive Full Map Controls: Follow Player / Free Look / Recenter / Zoom */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        soundEngine.playClick();
                        setFullMapMode('follow');
                      }}
                      className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer border ${
                        fullMapMode === 'follow'
                          ? 'bg-sky-500 text-slate-950 border-sky-300'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      Follow Player
                    </button>
                    <button
                      onClick={() => {
                        soundEngine.playClick();
                        setFreeMapCenter({ x: fullCenter.x, z: fullCenter.z });
                        setFullMapMode('free');
                      }}
                      className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer border ${
                        fullMapMode === 'free'
                          ? 'bg-amber-400 text-slate-950 border-amber-200'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      Free Look
                    </button>
                    <button
                      onClick={recenterFullMap}
                      className="px-2.5 py-1 rounded-lg font-bold cursor-pointer bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-600 flex items-center gap-1"
                    >
                      <Crosshair className="w-3.5 h-3.5" />
                      Recenter
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setFullMapZoom((z) => Math.max(0.65, +(z - 0.25).toFixed(2)))}
                      title="Perkecil Peta"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono-num text-slate-300 w-11 text-center">
                      {Math.round(fullMapZoom * 100)}%
                    </span>
                    <button
                      onClick={() => setFullMapZoom((z) => Math.min(2.6, +(z + 0.25).toFixed(2)))}
                      title="Perbesar Peta"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <svg
                  ref={fullMapSvgRef}
                  viewBox={fullMapViewBox}
                  onPointerDown={(e) => {
                    try {
                      e.currentTarget.setPointerCapture(e.pointerId);
                    } catch {
                      // ignore
                    }
                    mapDragRef.current = { pointerId: e.pointerId, lastX: e.clientX, lastY: e.clientY };
                  }}
                  onPointerMove={(e) => {
                    const drag = mapDragRef.current;
                    const svg = fullMapSvgRef.current;
                    if (!drag || drag.pointerId !== e.pointerId || !svg) return;
                    const dxPx = e.clientX - drag.lastX;
                    const dyPx = e.clientY - drag.lastY;
                    if (Math.abs(dxPx) < 1 && Math.abs(dyPx) < 1) return;
                    drag.lastX = e.clientX;
                    drag.lastY = e.clientY;
                    const rect = svg.getBoundingClientRect();
                    const worldPerPx = fullSpan / Math.max(120, Math.min(rect.width, rect.height));
                    const baseX = fullMapMode === 'follow' ? smoothCenter.x : freeMapCenter.x;
                    const baseZ = fullMapMode === 'follow' ? smoothCenter.z : freeMapCenter.z;
                    setFullMapMode('free');
                    setFreeMapCenter({
                      x: Math.max(-55, Math.min(55, baseX - dxPx * worldPerPx)),
                      z: Math.max(-72, Math.min(28, baseZ - dyPx * worldPerPx)),
                    });
                  }}
                  onPointerUp={() => {
                    mapDragRef.current = null;
                  }}
                  onPointerCancel={() => {
                    mapDragRef.current = null;
                  }}
                  onWheel={(e) => {
                    e.preventDefault();
                    setFullMapZoom((z) =>
                      Math.max(0.65, Math.min(2.6, +(z - e.deltaY * 0.0012).toFixed(2)))
                    );
                  }}
                  className="w-full h-full max-h-[360px] touch-none cursor-grab active:cursor-grabbing rounded-lg bg-[#030712]"
                >
                  <SpaceshipHullSilhouette />
                  {WALKABLE_RECTS.map((r) => {
                    const isComp = Boolean(r.roomId && lockedSet.has(r.roomId));
                    const isChap = Boolean(r.roomId && chapterLockedSet.has(r.roomId));
                    const fill = isComp ? '#06281e' : isChap ? '#1f0c14' : r.roomId ? '#1e293b' : '#0f172a';
                    const stroke = isComp ? '#10b981' : isChap ? '#f43f5e' : r.roomId ? '#38bdf8' : '#334155';
                    if (r.roomId) {
                      return (
                        <polygon
                          key={r.id}
                          points={getRoomSvgPoints(r.roomId)}
                          fill={fill}
                          stroke={stroke}
                          strokeWidth={0.55}
                          strokeLinejoin="round"
                        />
                      );
                    }
                    return (
                      <rect
                        key={r.id}
                        x={r.minX}
                        y={r.minZ}
                        width={r.maxX - r.minX}
                        height={r.maxZ - r.minZ}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth={0.45}
                      />
                    );
                  })}
                  {VENTS.map((v) => (
                    <rect
                      key={v.id}
                      x={v.x - 1.2}
                      y={v.z - 1.2}
                      width={2.4}
                      height={2.4}
                      rx={0.4}
                      fill="#10b981"
                      stroke="#022c22"
                      strokeWidth={0.3}
                    />
                  ))}
                  {THEORY_BOOKS.map((b) => {
                    const isReadingThis = activeTheoryBookId === b.id;
                    const isReadThis = readBookSet.has(b.id);
                    return (
                      <rect
                        key={b.id}
                        x={b.position.x - 0.85}
                        y={b.position.z - 0.85}
                        width={1.7}
                        height={1.7}
                        rx={0.3}
                        fill={isReadingThis ? '#38bdf8' : isReadThis ? '#34d399' : '#f59e0b'}
                        stroke="#020617"
                        strokeWidth={0.35}
                      />
                    );
                  })}
                  {Object.values(ROOMS).map((room) => {
                    const status = getRoomStatus(room.id);
                    const fillColor =
                      status === 'completed' || status === 'completed_locked'
                        ? '#10b981'
                        : status === 'in_progress'
                          ? '#0ea5e9'
                          : status === 'reading'
                            ? '#38bdf8'
                            : status === 'ready_quiz'
                              ? '#14b8a6'
                              : status === 'unread'
                                ? '#f59e0b'
                                : '#f43f5e';
                    const symbol =
                      status === 'completed_locked'
                        ? '🔒✓'
                        : status === 'completed'
                          ? '✓'
                          : status === 'in_progress'
                            ? '●'
                            : status === 'reading'
                              ? '📖'
                              : status === 'ready_quiz'
                                ? '✓'
                                : status === 'unread'
                                  ? '!'
                                  : '🔒';
                    return (
                      <g key={room.id}>
                        <text
                          x={room.center.x}
                          y={room.center.z + 1}
                          textAnchor="middle"
                          fontSize="2.2"
                          fill="#cbd5e1"
                          fontWeight="bold"
                        >
                          {room.shortName}
                        </text>
                        {(room.missionId || room.id === 'earth_observation_room') && (
                          <>
                            <circle
                              cx={room.terminalPos.x}
                              cy={room.terminalPos.z}
                              r={1.95}
                              fill={fillColor}
                              stroke="#020617"
                              strokeWidth={0.35}
                            />
                            <text
                              x={room.terminalPos.x}
                              y={room.terminalPos.z + (status === 'completed_locked' ? 0.65 : 0.85)}
                              textAnchor="middle"
                              fontSize={status === 'completed_locked' ? '1.55' : '2.1'}
                              fill="#020617"
                              fontWeight="bold"
                            >
                              {symbol}
                            </text>
                          </>
                        )}
                      </g>
                    );
                  })}
                  {/* Remote Multiplayer Players */}
                  {visibleOtherPlayers.map((rp) => {
                    const col = PLAYER_COLORS.find((c) => c.id === rp.character.color) || PLAYER_COLORS[1];
                    return (
                      <g key={rp.id}>
                        <circle
                          cx={rp.x}
                          cy={rp.z}
                          r={1.55}
                          fill={col.hex}
                          stroke="#020617"
                          strokeWidth={0.45}
                          opacity={rp.alive ? 0.95 : 0.55}
                        />
                        <text
                          x={rp.x}
                          y={rp.z - 2.1}
                          textAnchor="middle"
                          fontSize="1.65"
                          fill={col.hex}
                          fontWeight="bold"
                        >
                          {rp.name}
                        </text>
                      </g>
                    );
                  })}
                  {/* Local Active Player Directional Arrow */}
                  <g transform={`translate(${hud.playerX}, ${hud.playerZ}) rotate(${playerArrowDeg})`}>
                    <circle cx={0} cy={0} r={3.0} fill="#38bdf8" fillOpacity={0.22} />
                    <polygon
                      points="0,-2.5 1.85,1.85 0,1.0 -1.85,1.85"
                      fill="#ffffff"
                      stroke="#0284c7"
                      strokeWidth={0.65}
                    />
                  </g>
                </svg>
                <p className="text-[10px] text-slate-400">
                  Geser peta untuk Free Look · Gulir atau tekan +/- untuk Zoom · Tekan Recenter untuk kembali mengikuti karaktermu.
                </p>
              </div>

              <div className="md:col-span-5 overflow-y-auto sci-scroll space-y-2 pr-1">
                {Object.values(ROOMS).map((room) => {
                  const status = getRoomStatus(room.id);
                  const isCurrent = hud.currentRoomId === room.id;
                  const roomBooks = getBooksForRoom(room.id);
                  const bookProg = room.missionId
                    ? getMissionBookProgress(room.missionId, readBooksArr)
                    : null;
                  const statusBadge =
                    status === 'in_progress'
                      ? { text: '● Sedang Kuis', cls: 'bg-sky-500/20 text-sky-300 border-sky-400/50' }
                      : status === 'reading'
                        ? { text: '📖 Sedang Membaca', cls: 'bg-sky-400/20 text-sky-200 border-sky-400/50' }
                        : status === 'completed_locked'
                          ? { text: '🔒 ✓ Selesai & Terkunci', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' }
                          : status === 'completed'
                            ? { text: '✓ Misi Selesai', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50' }
                            : status === 'ready_quiz'
                              ? {
                                  text: room.missionId ? '📖✓ Siap Kuis' : 'Siap Final Quiz',
                                  cls: 'bg-teal-500/20 text-teal-300 border-teal-400/50',
                                }
                              : status === 'locked_chapter'
                                ? {
                                    text: room.chapter ? `🔒 Ch.${room.chapter} Terkunci` : '🔒 Terkunci (Butuh 5 Ch)',
                                    cls: 'bg-rose-950/60 text-rose-300 border-rose-500/40',
                                  }
                                : { text: '📖! Belum Dibaca', cls: 'bg-amber-400/20 text-amber-300 border-amber-400/50' };

                  return (
                    <div
                      key={room.id}
                      className={`border rounded-xl p-3 flex items-center justify-between gap-2 ${
                        isCurrent
                          ? 'bg-sky-500/15 border-sky-400'
                          : 'bg-slate-900/80 border-slate-800'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-sm shrink-0"
                            style={{ backgroundColor: room.accentHex }}
                          />
                          <span className="truncate">{room.name}</span>
                        </p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {room.chapter ? `Chapter ${room.chapter}` : 'Area Akhir'}
                          {bookProg && roomBooks.length > 0
                            ? ` · Buku ${bookProg.readCount}/${bookProg.totalCount}`
                            : ''}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-bold whitespace-nowrap ${statusBadge.cls}`}>
                          {statusBadge.text}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded bg-sky-500 text-slate-950 text-[10px] font-bold whitespace-nowrap">
                            POSISI KAMU
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAUSE MODAL */}
      {isPaused && (
        <div className="fixed inset-0 z-50 pointer-events-auto bg-slate-950/85 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#080f24] border border-sky-500/40 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-sky-400" />
                GAME PAUSED
              </h3>
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onTogglePause();
                }}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isMultiplayer && mpSnapshot && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sky-300 font-semibold">
                  <Users className="w-4 h-4" /> Room {mpSnapshot.roomCode}
                </span>
                <span className="text-slate-300">{mpSnapshot.players.length} Pemain Terhubung</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                <span className="text-slate-200 font-medium">Kontrol Sentuh / Joystick Layar</span>
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    onUpdateSettings({
                      ...saveState.settings,
                      showTouchControls: !saveState.settings.showTouchControls,
                    });
                  }}
                  className={`px-3 py-1 rounded-lg font-bold cursor-pointer ${
                    saveState.settings.showTouchControls
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {saveState.settings.showTouchControls ? 'Aktif' : 'Nonaktif'}
                </button>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                <div className="flex justify-between mb-1">
                  <span className="text-slate-200">Sensitivitas Kamera 360°</span>
                  <span className="font-mono-num text-sky-400">{saveState.settings.cameraSensitivity.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min={0.4}
                  max={2.0}
                  step={0.1}
                  value={saveState.settings.cameraSensitivity}
                  onChange={(e) =>
                    onUpdateSettings({ ...saveState.settings, cameraSensitivity: parseFloat(e.target.value) })
                  }
                  className="w-full accent-sky-400 cursor-pointer"
                />
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-200 font-medium">Musik Latar ({activeTrackDef.title})</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        onUpdateSettings({
                          ...saveState.settings,
                          musicPaused: !saveState.settings.musicPaused,
                        })
                      }
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-violet-300 font-bold cursor-pointer"
                    >
                      {saveState.settings.musicPaused ? 'Putar' : 'Jeda'}
                    </button>
                    <button
                      onClick={() => cycleTrack(1)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold cursor-pointer"
                    >
                      Ganti Lagu
                    </button>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-200">Volume Musik Latar</span>
                    <span className="font-mono-num text-emerald-400">{Math.round(saveState.settings.musicVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={saveState.settings.musicVolume}
                    onChange={(e) =>
                      onUpdateSettings({ ...saveState.settings, musicVolume: parseFloat(e.target.value) })
                    }
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-200">Volume Efek Suara (SFX)</span>
                    <span className="font-mono-num text-sky-400">{Math.round(saveState.settings.sfxVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={saveState.settings.sfxVolume}
                    onChange={(e) =>
                      onUpdateSettings({ ...saveState.settings, sfxVolume: parseFloat(e.target.value) })
                    }
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-200 font-medium">Kualitas Grafis 3D</span>
                  <span className="font-mono-num uppercase text-sky-400 font-bold">
                    {saveState.settings.graphicsQuality}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      { id: 'low', label: 'Low' },
                      { id: 'medium', label: 'Medium' },
                      { id: 'high', label: 'High' },
                    ] as Array<{ id: GraphicsQuality; label: string }>
                  ).map((opt) => {
                    const active = saveState.settings.graphicsQuality === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          soundEngine.playClick();
                          onUpdateSettings({ ...saveState.settings, graphicsQuality: opt.id });
                        }}
                        className={`py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                          active
                            ? 'bg-sky-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onTogglePause();
                }}
                className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-display font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                LANJUTKAN BERMAIN
              </button>
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onBackHome();
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                {isMultiplayer ? 'KELUAR DARI ROOM MULTIPLAYER' : 'KEMBALI KE MENU UTAMA'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
