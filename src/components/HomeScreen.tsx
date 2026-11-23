import React, { useState } from 'react';
import {
  BookOpen,
  Compass,
  Gamepad2,
  HelpCircle,
  Info,
  MousePointerClick,
  Package,
  Play,
  RotateCcw,
  Settings as SettingsIcon,
  Sliders,
  Sparkles,
  UserCheck,
  Volume2,
  VolumeX,
  ArrowLeft,
  Move,
  Eye,
  DoorOpen,
  CheckCircle2,
  Users,
  Wind,
  Music,
  Headphones,
  Pause,
  RefreshCw,
  Search,
  Trophy,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { MUSIC_TRACKS, normalizeMusicTrackId, soundEngine } from '../audio/soundEngine';
import { SOLO_BADGE_TIER_META } from '../data/gameData';
import { GameSettings, GraphicsQuality, SaveState, ScreenView } from '../types/game';
import { SpaceBackdrop3D } from './SpaceBackdrop3D';

interface HomeScreenProps {
  view: 'home' | 'howtoplay' | 'settings' | 'about';
  saveState: SaveState;
  isOnline?: boolean;
  onNavigate: (view: ScreenView) => void;
  onPlayGame: () => void;
  onOpenMultiplayer: () => void;
  onOpenTutorial?: () => void;
  onOpenRanking?: () => void;
  onOpenMusic?: () => void;
  onReplayChapters?: () => void;
  onUpdateSettings: (next: GameSettings) => void;
  onResetProgress: () => void;
}

const TUTORIAL_STEPS = [
  {
    title: '1. Bergerak & Lari di Stasiun',
    icon: Move,
    color: '#0ea5e9',
    desktop: 'Gunakan W, A, S, D atau Panah Arah untuk berjalan. Tahan tombol SHIFT untuk berlari lebih cepat!',
    mobile: 'Geser Virtual Joystick di sisi kiri layar untuk berjalan atau berlari.',
    tip: 'Arah gerakan astronaut selalu menyesuaikan arah hadap kamera kamu.',
  },
  {
    title: '2. Kamera 360° & Zoom',
    icon: Eye,
    color: '#8b5cf6',
    desktop: 'Tahan klik mouse & geser untuk memutar pandangan 360° ke segala arah. Scroll mouse untuk zoom.',
    mobile: 'Geser area kanan/tengah layar untuk memutar kamera 360°. Gunakan dua jari (pinch) untuk zoom.',
    tip: 'Tekan R atau tombol Reset Kamera di kanan atas jika pandangan ingin diluruskan kembali.',
  },
  {
    title: '3. Pintu Koridor & Vent System',
    icon: Wind,
    color: '#10b981',
    desktop: 'Jelajahi 11 ruangan secara manual melalui koridor & pintu otomatis. Dekati kisi Vent di lantai lalu tekan E untuk memeriksa jalur ventilasi.',
    mobile: 'Vent System menghubungkan ruangan tertentu secara rahasia (khusus Impostor di Mode Multiplayer).',
    tip: 'Lihat Minimap & Peta Stasiun untuk mengetahui letak ruangan, misi, dan kisi Vent.',
  },
  {
    title: '4. Baca Buku Teori & Kerjakan Misi',
    icon: MousePointerClick,
    color: '#f59e0b',
    desktop: 'Di setiap ruangan misi, dekati Buku Teori 3D terlebih dahulu lalu tekan E, baca materi hingga tuntas, dan klik "Selesai Membaca" untuk membuka akses kuis terminal.',
    mobile: 'Baca buku teori di ruangan dan tekan Selesai Membaca terlebih dahulu sebelum mengetuk terminal kuis.',
    tip: 'Tersedia 11 Buku Teori Sosiologi Kelas XII, Mode Cerita Solo (5 Chapter), serta Mode Multiplayer Online!',
  },
  {
    title: '5. Multiplayer, Meeting & Voting',
    icon: Users,
    color: '#f43f5e',
    desktop: 'Buat Room atau gabung dengan Kode Room. Diskusi di Emergency Meeting atau laporkan Kapsul Stasis untuk memilih Impostor!',
    mobile: 'Baik Crewmate maupun Impostor memiliki tantangan Sosiologi agar semua tetap belajar sambil bermain.',
    tip: 'Dalam Mode Solo, selesaikan 5 Chapter (10 Misi) untuk membuka Final Quiz 12 soal HOTS di Earth Observation Room.',
  },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  view,
  saveState,
  isOnline = true,
  onNavigate,
  onPlayGame,
  onOpenMultiplayer,
  onOpenTutorial,
  onOpenRanking,
  onOpenMusic,
  onReplayChapters,
  onUpdateSettings,
  onResetProgress,
}) => {
  const [tutStep, setTutStep] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);

  const hasProgress =
    saveState.completedMissions.length > 0 || saveState.totalExp > 0;

  const btnHover = () => soundEngine.playHover();
  const btnClick = () => {
    soundEngine.unlock();
    soundEngine.playClick();
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <SpaceBackdrop3D />
      {/* Contrast scrim */}
      <div className="fixed inset-0 z-[1] bg-gradient-to-r from-[#040714]/90 via-[#040714]/60 to-transparent pointer-events-none" />

      {view === 'home' && (
        <div className="relative z-10 w-full h-full overflow-y-auto sci-scroll flex items-center justify-between px-5 sm:px-6 md:px-14 py-5 safe-hud-inset">
          <div className="max-w-xl w-full flex flex-col gap-3.5 my-auto">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <p className="text-[11px] md:text-sm font-medium tracking-widest uppercase text-sky-400">
                  Sosiologi Kelas XII SMA · Petualangan Edukasi 3D
                </p>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                    isOnline
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                  }`}
                >
                  {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  {isOnline ? 'Online' : 'Mode Offline · Solo Aktif'}
                </span>
              </div>
              <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.04]">
                GLOBALUS
              </h1>
              <p className="font-display text-base sm:text-xl md:text-2xl font-semibold text-sky-300 tracking-wide mt-1">
                MISSION OF GLOBALIZATION
              </p>
              <p className="text-xs sm:text-sm text-slate-300 mt-2.5 leading-relaxed max-w-lg">
                Jelajahi GLOBALUS Space Station dalam petualangan cerita 5 chapter bersama REX, BIMA, FUZZY, BOB, dan RATU LARAS atau Mode Multiplayer Online!
              </p>
            </div>

            {hasProgress && (
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-300 bg-[#0b132b]/85 border border-sky-500/30 rounded-xl px-3.5 py-2 w-fit">
                <span className="text-sky-300 font-semibold">Kru: {saveState.character.name}</span>
                <span>·</span>
                <span>Chapter {saveState.unlockedChapter}/5</span>
                <span>·</span>
                <span className="font-mono-num">{saveState.completedMissions.length}/10 Misi</span>
                <span>·</span>
                <span className="font-mono-num text-amber-300">{saveState.totalExp} EXP</span>
                {saveState.bestSoloBadge && (
                  <>
                    <span>·</span>
                    <span
                      className="font-bold"
                      style={{ color: SOLO_BADGE_TIER_META[saveState.bestSoloBadge].colorHex }}
                    >
                      Badge {SOLO_BADGE_TIER_META[saveState.bestSoloBadge].shortLabel}
                    </span>
                  </>
                )}
                {saveState.activeCutsceneCheckpoint && (
                  <>
                    <span>·</span>
                    <span className="text-emerald-300 font-semibold">Cutscene Siap Dilanjutkan</span>
                  </>
                )}
              </div>
            )}

            <nav className="flex flex-col gap-2 max-w-sm">
              <button
                onMouseEnter={btnHover}
                onClick={() => {
                  btnClick();
                  onPlayGame();
                }}
                className="group min-h-[46px] flex items-center justify-between px-5 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-display font-bold text-sm sm:text-base tracking-wide transition-all shadow-lg shadow-sky-500/25 cursor-pointer"
              >
                <span className="flex items-center gap-3">
                  <Play className="w-5 h-5 fill-current" />
                  {hasProgress ? 'LANJUTKAN CERITA SOLO' : 'PLAY SOLO STORY'}
                </span>
                <span className="text-[11px] font-sans font-semibold px-2 py-0.5 rounded bg-slate-950/15 whitespace-nowrap">
                  Offline Ready
                </span>
              </button>

              <button
                onMouseEnter={btnHover}
                disabled={!isOnline}
                onClick={() => {
                  btnClick();
                  onOpenMultiplayer();
                }}
                className="min-h-[46px] flex items-center justify-between px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800/90 disabled:border disabled:border-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-slate-950 font-display font-bold text-sm tracking-wide transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <span className="flex items-center gap-3">
                  <Users className="w-5 h-5" />
                  MULTIPLAYER ONLINE
                </span>
                <span className="text-[11px] font-sans font-semibold px-2 py-0.5 rounded bg-slate-950/15">
                  {isOnline ? 'Room & Impostor' : 'Butuh Internet'}
                </span>
              </button>

              {onReplayChapters &&
                (saveState.completedChapters.includes(5) || saveState.endingSeen) && (
                  <button
                    onMouseEnter={btnHover}
                    onClick={() => {
                      btnClick();
                      onReplayChapters();
                    }}
                    className="flex items-center justify-between px-5 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/50 text-amber-200 font-display font-bold text-xs sm:text-sm transition-all cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <RefreshCw className="w-4 h-4 text-amber-300" />
                      ULANGI CHAPTER (CHAPTER 1–5)
                    </span>
                    <span className="text-[10px] font-sans font-semibold text-amber-300">
                      Koleksi Hadiah
                    </span>
                  </button>
                )}

              {(onOpenRanking || onOpenMusic) && (
                <div className="grid grid-cols-2 gap-2.5">
                  {onOpenRanking && (
                    <button
                      onMouseEnter={btnHover}
                      onClick={() => {
                        btnClick();
                        onOpenRanking();
                      }}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#0d1733]/90 hover:bg-[#14234a] border border-amber-400/40 hover:border-amber-300 text-amber-200 font-semibold text-xs sm:text-sm transition-all cursor-pointer"
                    >
                      <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                      RANKING GLOBAL
                    </button>
                  )}
                  {onOpenMusic && (
                    <button
                      onMouseEnter={btnHover}
                      onClick={() => {
                        btnClick();
                        onOpenMusic();
                      }}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#0d1733]/90 hover:bg-[#14234a] border border-violet-400/40 hover:border-violet-300 text-violet-200 font-semibold text-xs sm:text-sm transition-all cursor-pointer"
                    >
                      <Music className="w-4 h-4 text-violet-400 shrink-0" />
                      MUSIK &amp; LAGU
                    </button>
                  )}
                </div>
              )}

              <button
                onMouseEnter={btnHover}
                onClick={() => {
                  btnClick();
                  onNavigate('customize');
                }}
                className="flex items-center justify-between px-5 py-3 rounded-xl bg-[#0d1733]/90 hover:bg-[#14234a] border border-slate-700/80 hover:border-sky-400/60 text-slate-100 font-medium text-sm transition-all cursor-pointer"
              >
                <span className="flex items-center gap-3">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  CHARACTER CUSTOMIZATION
                </span>
                <span className="text-xs text-slate-400">{saveState.character.name}</span>
              </button>

              <button
                onMouseEnter={btnHover}
                onClick={() => {
                  btnClick();
                  onNavigate('howtoplay');
                }}
                className="flex items-center justify-between px-5 py-3 rounded-xl bg-[#0d1733]/90 hover:bg-[#14234a] border border-slate-700/80 hover:border-sky-400/60 text-slate-100 font-medium text-sm transition-all cursor-pointer"
              >
                <span className="flex items-center gap-3">
                  <HelpCircle className="w-4 h-4 text-sky-400" />
                  HOW TO PLAY
                </span>
                <span className="text-xs text-slate-400">Tutorial Kontrol & Vent</span>
              </button>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onMouseEnter={btnHover}
                  onClick={() => {
                    btnClick();
                    onNavigate('settings');
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#0d1733]/90 hover:bg-[#14234a] border border-slate-700/80 hover:border-sky-400/60 text-slate-100 font-medium text-sm transition-all cursor-pointer"
                >
                  <SettingsIcon className="w-4 h-4 text-amber-400" />
                  SETTINGS
                </button>
                <button
                  onMouseEnter={btnHover}
                  onClick={() => {
                    btnClick();
                    onNavigate('about');
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#0d1733]/90 hover:bg-[#14234a] border border-slate-700/80 hover:border-sky-400/60 text-slate-100 font-medium text-sm transition-all cursor-pointer"
                >
                  <Info className="w-4 h-4 text-purple-400" />
                  ABOUT GAME
                </button>
              </div>
            </nav>
          </div>

          <div className="hidden lg:flex flex-col items-end justify-end self-end text-right max-w-xs gap-2 pb-2">
            <div className="bg-[#0b132b]/85 border border-slate-700/70 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-sky-300 mb-1">Materi Pembelajaran</p>
              <p className="text-xs text-slate-300 leading-relaxed">
                1. Bentuk-Bentuk Globalisasi (Komunikasi, IPTEK, Transportasi, Budaya, Ekonomi)
              </p>
              <p className="text-xs text-slate-300 leading-relaxed mt-1">
                2. Proses Globalisasi & Perspektif Kritis (Hiperglobalis, Transformasionalis, Skeptis)
              </p>
            </div>
          </div>
        </div>
      )}

      {view === 'howtoplay' && (
        <div className="relative z-10 w-full h-full flex items-center justify-center p-3 sm:p-4 md:p-8 safe-hud-inset">
          <div className="w-full max-w-4xl max-h-full flex flex-col bg-[#080f24]/95 border border-sky-500/35 rounded-2xl p-4 sm:p-5 md:p-7 shadow-2xl overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3.5 mb-4">
              <div>
                <h2 className="font-display text-lg sm:text-2xl font-bold text-white flex items-center gap-2.5">
                  <Gamepad2 className="w-5 h-5 sm:w-6 sm:h-6 text-sky-400" />
                  CARA BERMAIN (HOW TO PLAY)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Panduan interaktif menjelajahi GLOBALUS Space Station
                </p>
              </div>
              <div className="flex items-center gap-2">
                {onOpenTutorial && (
                  <button
                    onClick={() => {
                      btnClick();
                      onOpenTutorial();
                    }}
                    className="min-h-[40px] flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-display font-bold cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    Tutorial Interaktif
                  </button>
                )}
                <button
                  onClick={() => {
                    btnClick();
                    onNavigate('home');
                  }}
                  className="min-h-[40px] flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Kembali
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 overflow-y-auto sci-scroll pr-1">
              <div className="md:col-span-5 flex flex-col gap-2">
                {TUTORIAL_STEPS.map((s, idx) => {
                  const Icon = s.icon;
                  const active = tutStep === idx;
                  return (
                    <button
                      key={s.title}
                      onClick={() => {
                        btnClick();
                        setTutStep(idx);
                      }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left border transition-all cursor-pointer ${
                        active
                          ? 'bg-sky-500/15 border-sky-400 text-white'
                          : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <Icon className="w-5 h-5 shrink-0" style={{ color: s.color }} />
                      <span className="text-sm font-semibold">{s.title}</span>
                    </button>
                  );
                })}
              </div>

              <div className="md:col-span-7 bg-[#0c1633] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                {(() => {
                  const cur = TUTORIAL_STEPS[tutStep];
                  const CurIcon = cur.icon;
                  return (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${cur.color}22`, border: `1px solid ${cur.color}66` }}
                        >
                          <CurIcon className="w-6 h-6" style={{ color: cur.color }} />
                        </div>
                        <div>
                          <h3 className="font-display text-lg font-bold text-white">{cur.title}</h3>
                          <p className="text-xs text-slate-400">Langkah {tutStep + 1} dari {TUTORIAL_STEPS.length}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5">
                          <p className="text-xs font-semibold text-sky-400 mb-1">Kontrol Desktop / Laptop</p>
                          <p className="text-sm text-slate-200 leading-relaxed">{cur.desktop}</p>
                        </div>
                        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5">
                          <p className="text-xs font-semibold text-emerald-400 mb-1">Kontrol Mobile / Layar Sentuh</p>
                          <p className="text-sm text-slate-200 leading-relaxed">{cur.mobile}</p>
                        </div>
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                          <p className="text-xs text-amber-200">
                            <span className="font-bold">Tips Misi:</span> {cur.tip}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800">
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><DoorOpen className="w-3.5 h-3.5 text-sky-400" /> 11 Ruangan</span>
                    <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5 text-emerald-400" /> 10 Buku Teori</span>
                    <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-amber-400" /> 5 Tokoh</span>
                  </div>
                  <div className="flex gap-2">
                    {tutStep < TUTORIAL_STEPS.length - 1 ? (
                      <button
                        onClick={() => {
                          btnClick();
                          setTutStep((s) => s + 1);
                        }}
                        className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold cursor-pointer"
                      >
                        Berikutnya
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          btnClick();
                          onPlayGame();
                        }}
                        className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold cursor-pointer"
                      >
                        Mulai Bermain
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {view === 'settings' && (
        <div className="relative z-10 w-full h-full flex items-center justify-center p-4 md:p-8">
          <div className="w-full max-w-2xl bg-[#080f24]/95 border border-sky-500/35 rounded-2xl p-6 shadow-2xl max-h-full overflow-y-auto sci-scroll">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
              <h2 className="font-display text-2xl font-bold text-white flex items-center gap-2.5">
                <Sliders className="w-6 h-6 text-amber-400" />
                PENGATURAN (SETTINGS)
              </h2>
              <button
                onClick={() => {
                  btnClick();
                  onNavigate('home');
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali
              </button>
            </div>

            <div className="space-y-5">
              {/* Mute toggle */}
              <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-white">Audio Global</p>
                  <p className="text-xs text-slate-400">Aktifkan atau bisukan seluruh musik & efek suara</p>
                </div>
                <button
                  onClick={() => {
                    btnClick();
                    onUpdateSettings({ ...saveState.settings, muted: !saveState.settings.muted });
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer ${
                    saveState.settings.muted
                      ? 'bg-rose-500/20 border border-rose-500/50 text-rose-300'
                      : 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
                  }`}
                >
                  {saveState.settings.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  {saveState.settings.muted ? 'Muted' : 'Aktif'}
                </button>
              </div>

              {/* Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-slate-200">Volume Musik</span>
                    <span className="font-mono-num text-sky-400">{Math.round(saveState.settings.musicVolume * 100)}%</span>
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
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-slate-200">Volume Efek Suara</span>
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

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-slate-200">Sensitivitas Kamera 360°</span>
                    <span className="font-mono-num text-emerald-400">{saveState.settings.cameraSensitivity.toFixed(1)}x</span>
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
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-slate-200">Sensitivitas Gerakan</span>
                    <span className="font-mono-num text-emerald-400">{saveState.settings.moveSensitivity.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.6}
                    max={1.6}
                    step={0.1}
                    value={saveState.settings.moveSensitivity}
                    onChange={(e) =>
                      onUpdateSettings({ ...saveState.settings, moveSensitivity: parseFloat(e.target.value) })
                    }
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* Music Selection & Playback + Voice Chat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-200 flex items-center gap-1.5">
                      <Music className="w-4 h-4 text-violet-400" />
                      Musik Stasiun
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          btnClick();
                          onUpdateSettings({
                            ...saveState.settings,
                            musicPaused: !saveState.settings.musicPaused,
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-violet-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {saveState.settings.musicPaused ? (
                          <Play className="w-3 h-3 fill-current" />
                        ) : (
                          <Pause className="w-3 h-3" />
                        )}
                        {saveState.settings.musicPaused ? 'Putar' : 'Jeda'}
                      </button>
                      <button
                        onClick={() => {
                          btnClick();
                          onUpdateSettings({
                            ...saveState.settings,
                            musicMuted: !saveState.settings.musicMuted,
                          });
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                          saveState.settings.musicMuted
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {saveState.settings.musicMuted ? 'Muted' : 'Aktif'}
                      </button>
                    </div>
                  </div>
                  <select
                    value={normalizeMusicTrackId(saveState.settings.musicTrack)}
                    onChange={(e) => {
                      btnClick();
                      onUpdateSettings({
                        ...saveState.settings,
                        musicTrack: e.target.value as GameSettings['musicTrack'],
                        selectedExternalTrack: null,
                        musicPaused: false,
                        musicMuted: false,
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-violet-400 cursor-pointer"
                  >
                    {MUSIC_TRACKS.map((tr) => (
                      <option key={tr.id} value={tr.id}>
                        {tr.title} — {tr.genre}
                      </option>
                    ))}
                  </select>
                  {saveState.settings.selectedExternalTrack && (
                    <p className="text-[11px] text-sky-300 truncate">
                      Aktif: {saveState.settings.selectedExternalTrack.title} —{' '}
                      {saveState.settings.selectedExternalTrack.artist}
                    </p>
                  )}
                  {onOpenMusic && (
                    <button
                      onClick={() => {
                        btnClick();
                        onOpenMusic();
                      }}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 border border-violet-400/40 text-violet-200 text-xs font-bold cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5" />
                      Cari Lagu Online &amp; Pemutar Lengkap
                    </button>
                  )}
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-200 flex items-center gap-1.5">
                      <Headphones className="w-4 h-4 text-sky-400" />
                      Voice Chat Multiplayer
                    </span>
                    <button
                      onClick={() => {
                        btnClick();
                        onUpdateSettings({
                          ...saveState.settings,
                          voiceEnabled: saveState.settings.voiceEnabled === false,
                        });
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                        saveState.settings.voiceEnabled === false
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-emerald-500 text-slate-950'
                      }`}
                    >
                      {saveState.settings.voiceEnabled === false ? 'Nonaktif' : 'Aktif'}
                    </button>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Volume Suara Pemain</span>
                      <span className="font-mono-num text-sky-400">
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
                        onUpdateSettings({
                          ...saveState.settings,
                          voiceVolume: parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-sky-400 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Adaptive 3D Graphics Quality */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-slate-200">Kualitas Grafis 3D</p>
                    <p className="text-xs text-slate-400">
                      Sesuaikan detail pencahayaan & jarak render agar gameplay lancar di semua perangkat.
                    </p>
                  </div>
                  <span className="text-xs font-mono-num font-bold uppercase text-sky-300">
                    {saveState.settings.graphicsQuality}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'low', label: 'Low (Ringan)' },
                      { id: 'medium', label: 'Medium (Seimbang)' },
                      { id: 'high', label: 'High (Tinggi)' },
                    ] as Array<{ id: GraphicsQuality; label: string }>
                  ).map((opt) => {
                    const active = saveState.settings.graphicsQuality === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          btnClick();
                          onUpdateSettings({ ...saveState.settings, graphicsQuality: opt.id });
                        }}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${
                          active
                            ? 'bg-sky-500 text-slate-950 border-sky-400'
                            : 'bg-slate-950/70 text-slate-300 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reset Progress */}
              <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-rose-300">Reset Progres Permainan</p>
                  <p className="text-xs text-slate-400">Menghapus misi, skor, EXP, dan item hadiah yang tersimpan.</p>
                </div>
                {!confirmReset ? (
                  <button
                    onClick={() => {
                      btnClick();
                      setConfirmReset(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-xs font-semibold cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset Progres
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        btnClick();
                        onResetProgress();
                        setConfirmReset(false);
                      }}
                      className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
                    >
                      Ya, Hapus Semua
                    </button>
                    <button
                      onClick={() => {
                        btnClick();
                        setConfirmReset(false);
                      }}
                      className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {view === 'about' && (
        <div className="relative z-10 w-full h-full flex items-center justify-center p-4 md:p-8">
          <div className="w-full max-w-3xl bg-[#080f24]/95 border border-purple-500/35 rounded-2xl p-6 shadow-2xl max-h-full overflow-y-auto sci-scroll">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
              <h2 className="font-display text-2xl font-bold text-white flex items-center gap-2.5">
                <BookOpen className="w-6 h-6 text-purple-400" />
                TENTANG GAME (ABOUT GAME)
              </h2>
              <button
                onClick={() => {
                  btnClick();
                  onNavigate('home');
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="bg-slate-900/75 border border-slate-800 rounded-xl p-4">
                <h3 className="font-display text-lg font-bold text-sky-300">GLOBALUS: MISSION OF GLOBALIZATION</h3>
                <p className="text-slate-300 mt-1.5 leading-relaxed">
                  Game petualangan edukasi 3D interaktif untuk siswa kelas XII SMA. Pemain berperan sebagai astronaut penyelamat jaringan global di GLOBALUS Space Station dan mempelajari Sosiologi melalui eksplorasi, simulasi, dan dialog tokoh.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/75 border border-slate-800 rounded-xl p-4">
                  <p className="font-semibold text-emerald-300 mb-2">Tujuan Pembelajaran</p>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" /> Menganalisis bentuk-bentuk globalisasi dalam kehidupan sehari-hari.</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" /> Merunut proses terjadinya globalisasi dari masa perdagangan kuno hingga era digital.</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" /> Membandingkan teori Hiperglobalis, Transformasionalis, dan Skeptis secara kritis.</li>
                  </ul>
                </div>

                <div className="bg-slate-900/75 border border-slate-800 rounded-xl p-4">
                  <p className="font-semibold text-sky-300 mb-2">Materi Sosiologi Kelas XII</p>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    <li>• Globalisasi Komunikasi, IPTEK, Transportasi, Budaya & Ekonomi</li>
                    <li>• Akulturasi, Asimilasi & Glokalisasi</li>
                    <li>• Teori Sistem Dunia Immanuel Wallerstein (Core, Semi-Periphery, Periphery)</li>
                    <li>• Westernisasi, Neokolonialisme & Cultural Lag</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
