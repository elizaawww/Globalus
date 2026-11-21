import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowUp,
  Award,
  BookCheck,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  Crosshair,
  Hand,
  Headphones,
  Home,
  Lock,
  LockOpen,
  Map as MapIcon,
  Mic,
  MicOff,
  Music,
  Package,
  Pause,
  Play,
  RotateCcw,
  Settings,
  ShieldAlert,
  SkipBack,
  SkipForward,
  Smile,
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
import { MUSIC_TRACKS, soundEngine } from '../audio/soundEngine';
import { CHAPTER_INFO, EMOTES, IMPOSTOR_CHALLENGES, MISSION_META, PLAYER_COLORS } from '../data/gameData';
import { ROOMS, VENTS, WALKABLE_RECTS } from '../data/stationLayout';
import {
  areRequiredBooksRead,
  computeRoomLearningStatus,
  getBooksForRoom,
  getMissionBookProgress,
  THEORY_BOOKS,
} from '../data/theoryBooks';
import {
  ConnectionStatus,
  EmoteId,
  GameSettings,
  GraphicsQuality,
  MissionId,
  MultiplayerRole,
  MusicTrackId,
  RoomId,
  RoomMissionStatus,
  RoomSnapshot,
  SaveState,
  TheoryBookId,
} from '../types/game';
import { HudLiveState } from './GameCanvas';

export interface HudVoiceControls {
  micOn: boolean;
  muted: boolean;
  speaking: boolean;
  micError: string | null;
  connectedPeerIds: string[];
  locallyMutedIds: string[];
  onToggleMic: () => void;
  onToggleMute: () => void;
  onToggleLocalMutePeer: (peerId: string) => void;
  onClearMicError: () => void;
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
  // Multiplayer Props
  isMultiplayer?: boolean;
  myPlayerId?: string | null;
  mpStatus?: ConnectionStatus;
  mpRole?: MultiplayerRole | null;
  amAlive?: boolean;
  mpSnapshot?: RoomSnapshot | null;
  completedMpMissions?: string[];
  completedImpChallenges?: string[];
  voiceControls?: HudVoiceControls;
  onTogglePause: () => void;
  onOpenInventory: () => void;
  onResetCamera: () => void;
  onJump: () => void;
  onTriggerEmote: (emoteId: EmoteId) => void;
  onInteract: (roomId: RoomId, missionId?: MissionId) => void;
  onInteractBook?: (bookId: TheoryBookId) => void;
  onInteractVent: (ventId: string) => void;
  onCallMeeting?: (reason: 'emergency' | 'report', podId?: string) => void;
  onEliminateTarget?: (targetId: string) => void;
  onUpdateSettings: (next: GameSettings) => void;
  onOpenFinalQuiz: () => void;
  onBackHome: () => void;
}

function getCardinalLabel(cameraYaw: number): { label: string; deg: number } {
  let deg = Math.round(((-cameraYaw * 180) / Math.PI) % 360);
  if (deg < 0) deg += 360;
  const dirs = ['Utara', 'Timur Laut', 'Timur', 'Tenggara', 'Selatan', 'Barat Daya', 'Barat', 'Barat Laut'];
  const idx = Math.round(deg / 45) % 8;
  return { label: dirs[idx], deg };
}

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
  isMultiplayer = false,
  myPlayerId = null,
  mpStatus = 'disconnected',
  mpRole = null,
  amAlive = true,
  mpSnapshot = null,
  completedMpMissions = [],
  completedImpChallenges = [],
  voiceControls,
  onTogglePause,
  onOpenInventory,
  onResetCamera,
  onJump,
  onTriggerEmote,
  onInteract,
  onInteractBook,
  onInteractVent,
  onCallMeeting,
  onEliminateTarget,
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
  const [voicePanelOpen, setVoicePanelOpen] = useState(false);
  const [emotesOpen, setEmotesOpen] = useState(false);
  const [joyVisual, setJoyVisual] = useState({ x: 0, y: 0, active: false });
  const [killCdSecs, setKillCdSecs] = useState(0);
  const joyBaseRef = useRef<HTMLDivElement>(null);
  const joyPointerIdRef = useRef<number | null>(null);
  const mapDragRef = useRef<{ pointerId: number; lastX: number; lastY: number } | null>(null);
  const fullMapSvgRef = useRef<SVGSVGElement>(null);
  const playerTargetRef = useRef({ x: hud.playerX, z: hud.playerZ });
  playerTargetRef.current = { x: hud.playerX, z: hud.playerZ };

  const chapterData = CHAPTER_INFO[saveState.unlockedChapter];
  const lockedSet = useMemo(() => new Set(lockedRooms), [lockedRooms]);
  const chapterLockedSet = useMemo(() => new Set(chapterLockedRooms), [chapterLockedRooms]);
  const readBooksArr = saveState.readBooks || [];
  const readBookSet = useMemo(() => new Set(readBooksArr), [readBooksArr]);
  const mpDoneSet = useMemo(() => new Set(completedMpMissions), [completedMpMissions]);
  const impDoneSet = useMemo(() => new Set(completedImpChallenges), [completedImpChallenges]);

  const allChaptersDone = !isMultiplayer && saveState.completedChapters.length >= 5;
  const compass = getCardinalLabel(hud.cameraYaw);

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

  const activeTrackId: MusicTrackId = saveState.settings.musicTrack || 'cosmic_drift';
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

  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-2.5 md:p-4">
      {/* Spectator Banner */}
      {isMultiplayer && !amAlive && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-30 bg-rose-950/90 border border-rose-500/60 text-rose-200 px-4 py-1.5 rounded-xl text-xs font-bold shadow-lg">
          MODE PENONTON (STASIS) — Tetap bantu selesaikan misi atau saksikan jalannya permainan
        </div>
      )}

      {/* TOP BAR ROW */}
      <div className="flex items-start justify-between gap-2">
        {/* TOP-LEFT: Objective Tracker */}
        <div className="pointer-events-auto max-w-[270px] md:max-w-[310px] bg-[#070d20]/90 border border-sky-500/35 rounded-xl overflow-hidden shadow-lg">
          <button
            onClick={() => {
              soundEngine.playClick();
              setTrackerOpen((o) => !o);
            }}
            className="w-full px-3.5 py-2 flex items-center justify-between gap-2 text-left bg-slate-900/70 hover:bg-slate-800/70 cursor-pointer"
          >
            <div className="min-w-0">
              {isMultiplayer ? (
                <>
                  <p
                    className={`text-[10px] font-bold uppercase tracking-wider truncate ${
                      mpRole === 'impostor' ? 'text-rose-400' : 'text-sky-400'
                    }`}
                  >
                    {mpRole === 'impostor' ? 'PERAN RAHASIA: IMPOSTOR' : 'PERAN: CREWMATE'} · ROOM {mpSnapshot?.roomCode}
                  </p>
                  <p className="text-xs font-semibold text-white truncate">
                    {mpRole === 'impostor'
                      ? `Sabotase Sosiologi (${mpSnapshot?.impostorObjectiveDone || 0}/${mpSnapshot?.impostorObjectiveTotal || 4})`
                      : `Misi Kru (${mpSnapshot?.crewMissionDone || 0}/${mpSnapshot?.crewMissionTotal || 6})`}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-sky-400 truncate">
                    {allChaptersDone ? 'EVALUASI AKHIR' : `CHAPTER ${saveState.unlockedChapter}`} · {saveState.character.name}
                  </p>
                  <p className="text-xs font-semibold text-white truncate">
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
            <div className="px-3.5 py-2.5 space-y-2 border-t border-slate-800/80">
              {isMultiplayer ? (
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
                    <p className="text-[10px] text-rose-300 border-t border-slate-800 pt-1.5">
                      Gunakan Vent [E], selesaikan tantangan rahasia, atau stasis Crewmate.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
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
                    <p className="text-[11px] text-slate-300">
                      Jelajahi ruangan misi di stasiun untuk memulihkan Global Network dan waspadai Impostor!
                    </p>
                    <p className="text-[11px] font-mono-num text-emerald-300">
                      Misi Kamu Selesai: {mpDoneSet.size} · Kru Hidup: {mpSnapshot?.players.filter((p) => p.alive).length || 0}
                    </p>
                  </>
                )
              ) : !allChaptersDone ? (
                <>
                  {chapterData.missions.map((mId) => {
                    const meta = MISSION_META[mId];
                    const status = getRoomStatus(meta.roomId);
                    const bookProg = getMissionBookProgress(mId, readBooksArr);
                    const done = status === 'completed' || status === 'completed_locked';
                    const activeNow = status === 'in_progress';
                    const isReading = status === 'reading';
                    const isReadyQuiz = status === 'ready_quiz';
                    return (
                      <div key={mId} className="flex items-start gap-2 text-[11px]">
                        {done ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                        ) : activeNow ? (
                          <span className="w-4 h-4 shrink-0 mt-0.5 rounded-full bg-sky-400 animate-pulse inline-block" />
                        ) : isReading ? (
                          <BookOpen className="w-4 h-4 shrink-0 mt-0.5 text-sky-400 animate-pulse" />
                        ) : isReadyQuiz ? (
                          <span className="relative shrink-0 mt-0.5 inline-flex items-center justify-center w-4 h-4 text-teal-300">
                            <BookCheck className="w-4 h-4" />
                          </span>
                        ) : (
                          <span className="relative shrink-0 mt-0.5 inline-flex items-center justify-center w-4 h-4 text-amber-300">
                            <BookOpen className="w-4 h-4" />
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 text-slate-950 font-black text-[8px] flex items-center justify-center">
                              !
                            </span>
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <span
                            className={
                              done
                                ? 'line-through text-slate-400'
                                : activeNow || isReading
                                  ? 'text-sky-300 font-semibold'
                                  : isReadyQuiz
                                    ? 'text-teal-200 font-semibold'
                                    : 'text-amber-100'
                            }
                          >
                            {meta.title} ({ROOMS[meta.roomId].shortName})
                          </span>
                          {!done && (
                            <p className="text-[10px] leading-tight mt-0.5">
                              {activeNow ? (
                                <span className="text-sky-300">Sedang Mengerjakan Kuis</span>
                              ) : isReading ? (
                                <span className="text-sky-300">Sedang Membaca Buku Teori</span>
                              ) : isReadyQuiz ? (
                                <span className="text-teal-300">
                                  Siap Kuis ({bookProg.readCount}/{bookProg.totalCount} Buku ✓) — Akses Terminal
                                </span>
                              ) : (
                                <span className="text-amber-300">
                                  Belum Dibaca ({bookProg.readCount}/{bookProg.totalCount} Buku !)
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono-num">
                    <span>Misi: {saveState.completedMissions.length}/10</span>
                    <span>Buku: {readBookSet.size}/{THEORY_BOOKS.length}</span>
                    <span className="text-amber-300">{saveState.totalExp} EXP</span>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      soundEngine.playClick();
                      onOpenFinalQuiz();
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Award className="w-4 h-4" />
                    MULAI FINAL QUIZ (12 SOAL)
                  </button>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono-num">
                    <span>5/5 Chapter</span>
                    <span>Buku: {readBookSet.size}/{THEORY_BOOKS.length}</span>
                    <span className="text-amber-300">{saveState.totalExp} EXP</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* TOP-CENTER: Compass, Current Room & MP Connection */}
        <div className="hidden sm:flex flex-col items-center bg-[#070d20]/90 border border-slate-700/80 rounded-xl px-4 py-1.5 shadow-lg">
          <div className="flex items-center gap-2 text-xs text-sky-300 font-semibold">
            <Compass className="w-3.5 h-3.5" />
            <span>{compass.label}</span>
            <span className="font-mono-num text-slate-400">{compass.deg}°</span>
            {isMultiplayer && (
              <span
                className={`ml-1 inline-flex items-center gap-1 text-[11px] ${
                  mpStatus === 'connected' ? 'text-emerald-400' : 'text-amber-300'
                }`}
              >
                {mpStatus === 'connected' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {mpStatus === 'connected' ? 'Live' : 'Sync...'}
              </span>
            )}
          </div>
          <p className="text-[11px] font-medium text-white truncate max-w-[220px]">
            {hud.currentRoomName}
          </p>
        </div>

        {/* TOP-RIGHT: Voice Chat + Music + Map + Minimap + Action Controls */}
        <div className="pointer-events-auto relative flex flex-col items-end gap-2">
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {isMultiplayer && voiceControls && (
              <>
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    voiceControls.onToggleMic();
                  }}
                  disabled={saveState.settings.voiceEnabled === false}
                  title={
                    saveState.settings.voiceEnabled === false
                      ? 'Voice Chat dinonaktifkan'
                      : voiceControls.micOn
                        ? 'Matikan Mikrofon'
                        : 'Aktifkan On Mic'
                  }
                  className={`px-2.5 py-2 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                    saveState.settings.voiceEnabled === false
                      ? 'bg-slate-900/80 border-slate-700 text-slate-500 cursor-not-allowed'
                      : voiceControls.micOn
                        ? voiceControls.muted
                          ? 'bg-amber-500/20 border-amber-400/60 text-amber-200'
                          : voiceControls.speaking
                            ? 'bg-emerald-500 border-emerald-200 text-slate-950 shadow-lg shadow-emerald-500/30'
                            : 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200'
                        : 'bg-[#070d20]/90 hover:bg-slate-800 border-slate-700 text-slate-200'
                  }`}
                >
                  {voiceControls.micOn && !voiceControls.muted ? (
                    <Mic className={`w-3.5 h-3.5 ${voiceControls.speaking ? 'animate-pulse' : ''}`} />
                  ) : (
                    <MicOff className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">
                    {voiceControls.micOn
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
                    setVoicePanelOpen((v) => !v);
                  }}
                  title="Pengaturan & Status Voice Chat"
                  className={`p-2 rounded-xl border cursor-pointer ${
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
                setMusicPanelOpen((v) => !v);
              }}
              title="Kontrol Musik Latar"
              className={`px-2.5 py-2 rounded-xl border flex items-center gap-1.5 text-[11px] font-bold cursor-pointer ${
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
              className="p-2 rounded-xl bg-[#070d20]/90 hover:bg-slate-800 border border-slate-700 text-sky-300 cursor-pointer"
              title="Buka Peta Stasiun"
            >
              <MapIcon className="w-4 h-4" />
            </button>
            {!isMultiplayer && (
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onOpenInventory();
                }}
                className="p-2 rounded-xl bg-[#070d20]/90 hover:bg-slate-800 border border-slate-700 text-emerald-300 cursor-pointer"
                title="Buka Inventaris"
              >
                <Package className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => {
                soundEngine.playClick();
                onResetCamera();
              }}
              className="p-2 rounded-xl bg-[#070d20]/90 hover:bg-slate-800 border border-slate-700 text-slate-200 cursor-pointer"
              title="Reset Kamera (R)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                soundEngine.playClick();
                onUpdateSettings({ ...saveState.settings, muted: !saveState.settings.muted });
              }}
              className="p-2 rounded-xl bg-[#070d20]/90 hover:bg-slate-800 border border-slate-700 text-amber-300 cursor-pointer"
              title="Mute / Unmute Global"
            >
              {saveState.settings.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                soundEngine.playClick();
                onTogglePause();
              }}
              className="p-2 rounded-xl bg-[#070d20]/90 hover:bg-slate-800 border border-slate-700 text-white cursor-pointer"
              title="Menu Pause (ESC)"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>

          {/* Voice Error Alert */}
          {isMultiplayer && voiceControls?.micError && (
            <div className="w-72 bg-rose-950/95 border border-rose-500/60 rounded-xl px-3 py-2 text-[11px] text-rose-100 flex items-start justify-between gap-2 shadow-xl">
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
            <div className="w-72 bg-[#070d22]/95 border border-violet-500/45 rounded-2xl p-3.5 shadow-2xl space-y-3 z-40">
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

              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{activeTrackDef.title}</p>
                  <p className="text-[10px] text-violet-300 truncate">{activeTrackDef.genre}</p>
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
                      onUpdateSettings({
                        ...saveState.settings,
                        musicPaused: !saveState.settings.musicPaused,
                      });
                    }}
                    title={saveState.settings.musicPaused ? 'Putar Musik' : 'Jeda Musik'}
                    className="p-1.5 rounded-lg bg-violet-500 hover:bg-violet-400 text-white cursor-pointer"
                  >
                    {saveState.settings.musicPaused ? (
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
              <p className="text-[10px] text-slate-400">
                * Audio otomatis mengecil saat dialog, cutscene, dan voice chat.
              </p>
            </div>
          )}

          {/* Voice Chat Panel Popover */}
          {isMultiplayer && voicePanelOpen && voiceControls && (
            <div className="w-72 bg-[#070d22]/95 border border-sky-500/45 rounded-2xl p-3.5 shadow-2xl space-y-3 z-40">
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

              <div className="space-y-1.5 max-h-40 overflow-y-auto sci-scroll pr-0.5">
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
                              ? 'bg-emerald-400 animate-pulse'
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

          {/* Live Minimap (Smoothly Auto-Recentered around Controlled Player) */}
          <button
            onClick={openFullMap}
            className="w-28 h-28 md:w-32 md:h-32 bg-[#060b1c]/92 border border-sky-500/40 rounded-xl p-1 shadow-lg cursor-pointer hover:border-sky-400 overflow-hidden"
            title="Klik untuk Peta Besar"
          >
            <svg viewBox={miniViewBox} className="w-full h-full">
              {WALKABLE_RECTS.map((r) => (
                <rect
                  key={r.id}
                  x={r.minX}
                  y={r.minZ}
                  width={r.maxX - r.minX}
                  height={r.maxZ - r.minZ}
                  fill={r.roomId ? '#1e293b' : '#0f172a'}
                  stroke={r.roomId ? '#38bdf8' : '#334155'}
                  strokeWidth={r.roomId ? 0.5 : 0.25}
                />
              ))}
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

      {/* BOTTOM ROW: Touch Joystick, Proximity Prompts, Jump/Emotes/Action Controls */}
      <div className="flex items-end justify-between gap-4">
        {/* Bottom-Left: Virtual Joystick (isolated pointerId for smooth multi-touch camera 360°) */}
        <div className="pointer-events-auto">
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
              className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-slate-900/75 border-2 border-sky-400/40 flex items-center justify-center touch-none cursor-grab"
            >
              <div
                className="w-10 h-10 rounded-full bg-sky-400/85 border-2 border-white shadow-lg transition-transform duration-75"
                style={{ transform: `translate(${joyVisual.x}px, ${joyVisual.y}px)` }}
              />
            </div>
          )}
        </div>

        {/* Bottom-Center: Proximity Prompts & Desktop Hints */}
        <div className="flex flex-col items-center gap-2 mb-1">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {hud.nearbyStasisPod && amAlive && onCallMeeting && (
              <button
                onClick={() => {
                  soundEngine.playInteract();
                  onCallMeeting('report', hud.nearbyStasisPod!.id);
                }}
                className="pointer-events-auto flex items-center gap-2 px-5 py-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-display font-bold text-xs md:text-sm shadow-xl cursor-pointer animate-float-slow"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>[E] LAPORKAN STASIS ({hud.nearbyStasisPod.victimName})</span>
              </button>
            )}

            {hud.nearbyVent && amAlive && (
              <button
                onClick={() => {
                  soundEngine.playInteract();
                  onInteractVent(hud.nearbyVent!.id);
                }}
                className="pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-xs md:text-sm shadow-xl cursor-pointer"
              >
                <Wind className="w-4 h-4" />
                <span>[E] {hud.nearbyVent.label}</span>
              </button>
            )}

            {hud.nearbyBook && onInteractBook && (() => {
              const isBookRead = readBookSet.has(hud.nearbyBook.id);
              const isBookOpen = activeTheoryBookId === hud.nearbyBook.id;
              const isFirstBookStart =
                !isBookRead &&
                hud.nearbyBook.id === 'book_2_karakteristik' &&
                saveState.completedMissions.length === 0;
              return (
                <button
                  onClick={() => {
                    soundEngine.playInteract();
                    onInteractBook(hud.nearbyBook!.id);
                  }}
                  className={`pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl font-display font-bold text-xs md:text-sm shadow-xl cursor-pointer animate-float-slow whitespace-nowrap border-2 ${
                    isBookOpen
                      ? 'bg-sky-400 border-sky-200 text-slate-950 shadow-sky-500/25'
                      : isBookRead
                        ? 'bg-emerald-500 hover:bg-emerald-400 border-emerald-300 text-slate-950 shadow-emerald-500/25'
                        : 'bg-amber-400 hover:bg-amber-300 border-amber-200 text-slate-950 shadow-amber-500/35'
                  }`}
                >
                  <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-md bg-slate-950 text-amber-300 font-mono-num text-xs font-extrabold shadow">
                    E
                  </kbd>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-950/15">
                    <Hand className="w-3 h-3 shrink-0" />
                    Tap
                  </span>
                  {isBookRead ? (
                    <BookCheck className="w-4 h-4 shrink-0" />
                  ) : (
                    <BookOpen className="w-4 h-4 shrink-0" />
                  )}
                  <span>
                    {isBookRead
                      ? `Baca Ulang Buku (✓): ${hud.nearbyBook.topicLabel}`
                      : isFirstBookStart
                        ? `Buka Buku Pertama: ${hud.nearbyBook.topicLabel}`
                        : `Buka Buku Teori: ${hud.nearbyBook.topicLabel}`}
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
                  className={`pointer-events-auto flex items-center gap-2 px-5 py-3 rounded-xl font-display font-bold text-xs md:text-sm shadow-xl cursor-pointer animate-float-slow whitespace-nowrap ${
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
                  ) : (
                    <Hand className="w-4 h-4 shrink-0" />
                  )}
                  <span>
                    [E]{' '}
                    {blockedByBook
                      ? `Kuis Terkunci — Baca Buku Teori Dulu (${term.label})`
                      : term.label}
                  </span>
                </button>
              );
            })()}

            {hud.nearbyEmergencyConsole && amAlive && onCallMeeting && (
              <button
                onClick={() => {
                  soundEngine.playInteract();
                  onCallMeeting('emergency');
                }}
                className="pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-bold text-xs md:text-sm shadow-xl cursor-pointer whitespace-nowrap"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>EMERGENCY MEETING</span>
              </button>
            )}
          </div>
        </div>

        {/* Bottom-Right: Closable Emote Panel + Jump / Emotes / Context Actions */}
        <div className="pointer-events-auto relative flex flex-col items-end gap-2">
          {emotesOpen && (
            <div className="w-64 sm:w-72 bg-[#070d22]/95 border border-sky-500/45 rounded-2xl p-3 shadow-2xl space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Smile className="w-4 h-4 text-sky-400" />
                  <span className="font-display text-xs font-bold text-white uppercase tracking-wider">
                    EMOTES (10)
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
              <div className="grid grid-cols-5 gap-1.5">
                {EMOTES.map((em) => {
                  const isActive = activeEmote === em.id;
                  return (
                    <button
                      key={em.id}
                      onClick={() => {
                        onTriggerEmote(em.id);
                        setEmotesOpen(false);
                      }}
                      title={em.label}
                      className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-sky-500/25 border-sky-400 text-white'
                          : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/80 text-slate-200'
                      }`}
                    >
                      <span className="text-lg leading-none">{em.emoji}</span>
                      <span className="text-[9px] font-semibold truncate w-full text-center mt-1">
                        {em.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            {isMultiplayer && mpRole === 'impostor' && amAlive && onEliminateTarget && (
              <button
                disabled={!hud.nearbyEliminateTarget || killCdSecs > 0}
                onClick={() => {
                  if (hud.nearbyEliminateTarget) {
                    soundEngine.playEliminate();
                    onEliminateTarget(hud.nearbyEliminateTarget.id);
                  }
                }}
                className={`px-4 py-3 rounded-2xl font-display font-bold text-xs flex flex-col items-center justify-center border-2 shadow-xl transition-all ${
                  hud.nearbyEliminateTarget && killCdSecs === 0
                    ? 'bg-rose-600 hover:bg-rose-500 border-rose-300 text-white cursor-pointer'
                    : 'bg-slate-900/90 border-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Zap className="w-5 h-5 mb-0.5" />
                <span>
                  {killCdSecs > 0
                    ? `STASIS (${killCdSecs}s)`
                    : hud.nearbyEliminateTarget
                      ? `STASIS: ${hud.nearbyEliminateTarget.name}`
                      : 'STASIS'}
                </span>
              </button>
            )}

            {saveState.settings.showTouchControls && hud.nearbyBook && onInteractBook && (
              <button
                onClick={() => {
                  soundEngine.playInteract();
                  onInteractBook(hud.nearbyBook!.id);
                }}
                className="w-16 h-16 rounded-full bg-amber-400 hover:bg-amber-300 border-2 border-amber-200 text-slate-950 font-display font-bold text-[10px] flex flex-col items-center justify-center shadow-lg cursor-pointer"
              >
                <BookOpen className="w-5 h-5" />
                <span>TAP BUKU</span>
              </button>
            )}

            {saveState.settings.showTouchControls && hud.nearbyTerminal && (
              <button
                onClick={() => {
                  soundEngine.playInteract();
                  onInteract(hud.nearbyTerminal!.roomId, hud.nearbyTerminal!.missionId);
                }}
                className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-xs flex flex-col items-center justify-center shadow-lg cursor-pointer"
              >
                <Hand className="w-5 h-5" />
                <span>AKSES</span>
              </button>
            )}

            <button
              onClick={() => {
                soundEngine.playClick();
                setEmotesOpen((v) => !v);
              }}
              aria-label="Buka Panel Emote"
              title="Emotes"
              className={`w-14 h-14 md:w-15 md:h-15 rounded-full border-2 font-display font-bold text-[10px] flex flex-col items-center justify-center shadow-lg cursor-pointer transition-colors ${
                emotesOpen || activeEmote
                  ? 'bg-violet-500 border-violet-300 text-white'
                  : 'bg-[#08122b]/90 hover:bg-slate-800 border-violet-400/50 text-violet-200'
              }`}
            >
              <Smile className="w-5 h-5" />
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
              className="w-16 h-16 rounded-full bg-sky-500 hover:bg-sky-400 active:scale-95 border-2 border-sky-200 text-slate-950 font-display font-bold text-[10px] flex flex-col items-center justify-center shadow-xl cursor-pointer touch-none"
            >
              <ArrowUp className="w-5 h-5 stroke-[2.5]" />
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
                  {WALKABLE_RECTS.map((r) => {
                    const isComp = Boolean(r.roomId && lockedSet.has(r.roomId));
                    const isChap = Boolean(r.roomId && chapterLockedSet.has(r.roomId));
                    return (
                      <rect
                        key={r.id}
                        x={r.minX}
                        y={r.minZ}
                        width={r.maxX - r.minX}
                        height={r.maxZ - r.minZ}
                        fill={
                          isComp
                            ? '#06281e'
                            : isChap
                              ? '#1f0c14'
                              : r.roomId
                                ? '#1e293b'
                                : '#0f172a'
                        }
                        stroke={
                          isComp
                            ? '#10b981'
                            : isChap
                              ? '#f43f5e'
                              : r.roomId
                                ? '#38bdf8'
                                : '#334155'
                        }
                        strokeWidth={0.5}
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
