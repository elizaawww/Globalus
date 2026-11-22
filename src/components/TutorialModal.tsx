import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Compass,
  Eye,
  Gamepad2,
  Lock,
  Move,
  Play,
  SkipForward,
  Sparkles,
  X,
} from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface TutorialModalProps {
  isFirstTime?: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

interface TutorialSlide {
  id: string;
  badge: string;
  title: string;
  accentHex: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  summary: string;
  desktopHint: string;
  mobileHint: string;
  visualType: 'move' | 'camera' | 'rooms' | 'books' | 'quiz';
}

const SLIDES: TutorialSlide[] = [
  {
    id: 'move',
    badge: 'Langkah 1 / 5',
    title: 'Bergerak & Jelajahi Stasiun',
    accentHex: '#38bdf8',
    icon: Move,
    summary:
      'Kendalikan astronautmu menyusuri koridor dan 11 ruangan di GLOBALUS Space Station.',
    desktopHint: 'Desktop: Gunakan W, A, S, D atau Panah Arah. Tahan Shift untuk berlari dan Spasi untuk melompat.',
    mobileHint: 'Layar Sentuh: Geser Virtual Joystick di kiri bawah dan tekan tombol LOMPAT di kanan bawah.',
    visualType: 'move',
  },
  {
    id: 'camera',
    badge: 'Langkah 2 / 5',
    title: 'Kamera 360° & Zoom',
    accentHex: '#a78bfa',
    icon: Eye,
    summary:
      'Putar sudut pandang dengan bebas untuk memeriksa buku, terminal, dan pintu ruangan.',
    desktopHint: 'Desktop: Klik & tahan lalu geser mouse untuk memutar kamera 360°. Scroll untuk zoom, tekan R untuk reset.',
    mobileHint: 'Layar Sentuh: Geser area layar kanan/tengah untuk memutar kamera dan cubit (pinch) untuk zoom.',
    visualType: 'camera',
  },
  {
    id: 'rooms',
    badge: 'Langkah 3 / 5',
    title: 'Akses Ruangan Per Chapter & Peta',
    accentHex: '#f43f5e',
    icon: Compass,
    summary:
      'Setiap Chapter membuka ruangan misi secara bertahap dari Chapter 1 hingga Chapter 5.',
    desktopHint: 'Ruangan dengan ikon Gembok Merah belum terbuka. Ruangan dengan Gembok + Centang Hijau sudah selesai.',
    mobileHint: 'Ketuk Minimap di kanan atas kapan saja untuk melihat Peta Stasiun lengkap dan lokasi misimu.',
    visualType: 'rooms',
  },
  {
    id: 'books',
    badge: 'Langkah 4 / 5',
    title: 'Ikuti Sparkle & Wajib Baca Buku',
    accentHex: '#f59e0b',
    icon: BookOpen,
    summary:
      'Di setiap ruangan misi, cari buku yang dikelilingi cahaya sparkle berkilau sebelum mengakses terminal kuis.',
    desktopHint: 'Dekati buku hingga garis sorot muncul, lalu tekan [E] atau klik buku tersebut dan tekan "Selesai Membaca".',
    mobileHint: 'Dekati buku hingga garis sorot muncul, lalu tap langsung bukunya atau tekan tombol BUKU.',
    visualType: 'books',
  },
  {
    id: 'quiz',
    badge: 'Langkah 5 / 5',
    title: 'Aturan Kuis 100% Benar & Hadiah',
    accentHex: '#10b981',
    icon: Award,
    summary:
      'Terminal kuis hanya dapat diselesaikan jika seluruh soal dijawab dengan benar (100%).',
    desktopHint: 'Jika masih ada jawaban keliru, perhatikan nomor soal yang salah lalu ulangi kuis hingga semua benar.',
    mobileHint: 'Selesaikan semua misi di suatu Chapter untuk membuka cutscene cerita dan klaim item kostum baru!',
    visualType: 'quiz',
  },
];

export const TutorialModal: React.FC<TutorialModalProps> = ({
  isFirstTime = false,
  onComplete,
  onSkip,
}) => {
  // step === -1 is the compact welcome card ("Mulai Tutorial" / "Lewati")
  const [step, setStep] = useState<number>(isFirstTime ? -1 : 0);
  const [animTick, setAnimTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setAnimTick((t) => (t + 1) % 60), 120);
    return () => window.clearInterval(id);
  }, []);

  const slide = step >= 0 ? SLIDES[step] : null;
  const phase = animTick / 60;

  return (
    <div className="fixed inset-0 z-[75] bg-slate-950/90 flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-2xl max-h-[92dvh] bg-[#080f24] border border-sky-500/45 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-400/40 flex items-center justify-center shrink-0">
              <Gamepad2 className="w-5 h-5 text-sky-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-sky-400">
                Panduan Singkat Sebelum Memulai
              </p>
              <h2 className="font-display text-base sm:text-lg font-extrabold text-white truncate">
                TUTORIAL MISI GLOBALUS
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playClick();
              onSkip();
            }}
            aria-label="Tutup Tutorial"
            className="min-w-[40px] min-h-[40px] p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto sci-scroll p-4 sm:p-6">
          {step === -1 ? (
            <div className="space-y-5 text-center py-2">
              <div className="w-16 h-16 rounded-2xl mx-auto bg-sky-500/15 border border-sky-400/45 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-sky-300" />
              </div>
              <div className="space-y-2">
                <h3 className="font-display text-xl sm:text-2xl font-extrabold text-white">
                  Selamat Datang di Stasiun GLOBALUS!
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
                  Sebelum memulai Chapter 1, pelajari secara singkat cara menggerakkan astronaut, mengikuti cahaya sparkle menuju buku teori, serta menyelesaikan kuis Sosiologi.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2.5 max-w-md mx-auto text-[11px]">
                <div className="bg-slate-900/85 border border-slate-800 rounded-xl p-2.5">
                  <Move className="w-4 h-4 text-sky-400 mx-auto mb-1" />
                  <p className="font-semibold text-white">Kontrol 3D</p>
                </div>
                <div className="bg-slate-900/85 border border-slate-800 rounded-xl p-2.5">
                  <BookOpen className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                  <p className="font-semibold text-white">Baca Materi</p>
                </div>
                <div className="bg-slate-900/85 border border-slate-800 rounded-xl p-2.5">
                  <Award className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                  <p className="font-semibold text-white">Kuis 100%</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    setStep(0);
                  }}
                  className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-display font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-sky-500/20"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Mulai Tutorial
                </button>
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    onSkip();
                  }}
                  className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <SkipForward className="w-4 h-4" />
                  Lewati
                </button>
              </div>
            </div>
          ) : slide ? (
            <div className="space-y-4">
              {/* Step progress indicator */}
              <div className="flex items-center justify-between gap-2">
                <span
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider text-slate-950"
                  style={{ backgroundColor: slide.accentHex }}
                >
                  {slide.badge}
                </span>
                <div className="flex items-center gap-1.5">
                  {SLIDES.map((s, idx) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        soundEngine.playClick();
                        setStep(idx);
                      }}
                      aria-label={`Langkah ${idx + 1}`}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        idx === step
                          ? 'w-7 bg-sky-400'
                          : idx < step
                            ? 'w-3 bg-emerald-400/70'
                            : 'w-3 bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Title & Summary */}
              <div className="flex items-start gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `${slide.accentHex}20`,
                    border: `1px solid ${slide.accentHex}55`,
                  }}
                >
                  <slide.icon className="w-6 h-6" style={{ color: slide.accentHex }} />
                </div>
                <div>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-white">
                    {slide.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                    {slide.summary}
                  </p>
                </div>
              </div>

              {/* Animated Cutscene-Style Visual Stage */}
              <div className="bg-slate-950/95 border border-slate-800 rounded-xl p-3.5 space-y-3">
                <div className="relative h-28 w-full rounded-lg overflow-hidden bg-gradient-to-r from-[#040817] via-[#0a1632] to-[#040817] border border-slate-800/90 flex items-center justify-center">
                  <svg viewBox="0 0 420 110" className="w-full h-full">
                    {/* Corridor grid floor */}
                    <line x1="20" y1="88" x2="400" y2="88" stroke="#1e293b" strokeWidth="2" />
                    <line x1="20" y1="22" x2="400" y2="22" stroke="#1e293b" strokeWidth="1.5" strokeDasharray="6 6" />
                    {slide.visualType === 'move' && (
                      <>
                        {/* Moving astronaut along corridor */}
                        <g transform={`translate(${55 + Math.sin(phase * Math.PI * 2) * 110 + 110}, 56)`}>
                          <circle cx="0" cy="-14" r="11" fill="#38bdf8" />
                          <rect x="-10" y="-4" width="20" height="24" rx="8" fill="#0284c7" />
                          <ellipse cx="4" cy="-14" rx="6" ry="4" fill="#bae6fd" />
                          <circle cx="-18" cy="4" r={3 + (animTick % 3)} fill="#7dd3fc" opacity="0.7" />
                        </g>
                        <text x="210" y="102" textAnchor="middle" fill="#7dd3fc" fontSize="10" fontWeight="700">
                          WASD / Joystick · Lari · Lompat
                        </text>
                      </>
                    )}
                    {slide.visualType === 'camera' && (
                      <>
                        <circle cx="210" cy="56" r="34" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="4 4" />
                        <g transform="translate(210, 56)">
                          <circle cx="0" cy="-10" r="9" fill="#38bdf8" />
                          <rect x="-8" y="0" width="16" height="18" rx="6" fill="#0284c7" />
                        </g>
                        <circle
                          cx={210 + Math.cos(phase * Math.PI * 2) * 34}
                          cy={56 + Math.sin(phase * Math.PI * 2) * 20}
                          r="6"
                          fill="#c4b5fd"
                        />
                        <text x="210" y="102" textAnchor="middle" fill="#ddd6fe" fontSize="10" fontWeight="700">
                          Putar 360° &amp; Mode Kamera Atas (Top-Down)
                        </text>
                      </>
                    )}
                    {slide.visualType === 'rooms' && (
                      <>
                        {[1, 2, 3, 4, 5].map((ch, i) => {
                          const rx = 56 + i * 74;
                          const unlockedIdx = Math.floor(phase * 5);
                          const done = i < unlockedIdx;
                          const active = i === unlockedIdx;
                          const fill = done ? '#065f46' : active ? '#78350f' : '#450a0a';
                          const stroke = done ? '#34d399' : active ? '#fbbf24' : '#fb7185';
                          return (
                            <g key={ch} transform={`translate(${rx}, 52)`}>
                              <rect x="-22" y="-22" width="44" height="44" rx="8" fill={fill} stroke={stroke} strokeWidth="2" />
                              <text x="0" y="4" textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="800">
                                CH{ch}
                              </text>
                            </g>
                          );
                        })}
                        <text x="210" y="102" textAnchor="middle" fill="#fda4af" fontSize="10" fontWeight="700">
                          Selesaikan Chapter untuk membuka ruangan berikutnya
                        </text>
                      </>
                    )}
                    {slide.visualType === 'books' && (
                      <>
                        {/* Sparkle guiding astronaut to glowing book */}
                        <g transform={`translate(${75 + phase * 185}, 56)`}>
                          <circle cx="0" cy="-12" r="9" fill="#38bdf8" />
                          <rect x="-8" y="-2" width="16" height="18" rx="6" fill="#0284c7" />
                        </g>
                        <circle
                          cx={110 + phase * 175}
                          cy={42 + Math.sin(phase * 12) * 6}
                          r="6"
                          fill="#fde68a"
                        />
                        <g transform="translate(325, 56)">
                          <rect x="-15" y="-10" width="30" height="22" rx="4" fill="#f59e0b" />
                          <rect x="-11" y="-6" width="22" height="14" rx="2" fill="#fef3c7" />
                        </g>
                        <text x="210" y="102" textAnchor="middle" fill="#fde68a" fontSize="10" fontWeight="700">
                          Ikuti Sparkle → Buka &amp; Baca Buku Teori
                        </text>
                      </>
                    )}
                    {slide.visualType === 'quiz' && (
                      <>
                        <rect x="115" y="24" width="190" height="52" rx="10" fill="#064e3b" stroke="#34d399" strokeWidth="2" />
                        <text x="210" y="47" textAnchor="middle" fill="#ecfdf5" fontSize="12" fontWeight="800">
                          SKOR TARGET: 100%
                        </text>
                        <text x="210" y="64" textAnchor="middle" fill="#6ee7b7" fontSize="10" fontWeight="600">
                          Buka Cutscene + Hadiah + Emote
                        </text>
                        <circle cx="92" cy="50" r={5 + (animTick % 4)} fill="#fbbf24" />
                        <circle cx="328" cy="50" r={5 + ((animTick + 2) % 4)} fill="#38bdf8" />
                      </>
                    )}
                  </svg>
                </div>

                {slide.visualType === 'move' && (
                  <div className="flex flex-wrap items-center justify-around gap-4 text-xs">
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex gap-1">
                        <kbd className="w-8 h-8 rounded-lg bg-slate-800 border border-sky-400/50 text-sky-300 font-bold flex items-center justify-center">
                          W
                        </kbd>
                      </div>
                      <div className="flex gap-1">
                        {['A', 'S', 'D'].map((k) => (
                          <kbd
                            key={k}
                            className="w-8 h-8 rounded-lg bg-slate-800 border border-sky-400/50 text-sky-300 font-bold flex items-center justify-center"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5">Gerak Desktop</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-12 h-12 rounded-full bg-slate-900 border-2 border-sky-400/50 flex items-center justify-center">
                        <div className="w-5 h-5 rounded-full bg-sky-400" />
                      </div>
                      <span className="text-[10px] text-slate-400">Joystick Mobile</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="px-3 py-1.5 rounded-lg bg-sky-500 text-slate-950 font-display font-bold text-xs">
                        SPASI / LOMPAT
                      </span>
                      <span className="text-[10px] text-slate-400">Lompat &amp; Shift Lari</span>
                    </div>
                  </div>
                )}

                {slide.visualType === 'camera' && (
                  <div className="flex flex-wrap items-center justify-around gap-3 text-xs text-slate-200">
                    <div className="px-3 py-2 rounded-lg bg-slate-900 border border-violet-400/40 text-center">
                      <p className="font-bold text-violet-300">Drag / Geser Layar</p>
                      <p className="text-[10px] text-slate-400">Putar Kamera 360°</p>
                    </div>
                    <div className="px-3 py-2 rounded-lg bg-slate-900 border border-violet-400/40 text-center">
                      <p className="font-bold text-violet-300">Scroll / Pinch</p>
                      <p className="text-[10px] text-slate-400">Perbesar / Perkecil</p>
                    </div>
                    <div className="px-3 py-2 rounded-lg bg-slate-900 border border-violet-400/40 text-center">
                      <p className="font-bold text-violet-300">Tombol [R] / Atas</p>
                      <p className="text-[10px] text-slate-400">Reset atau Mode Top-Down</p>
                    </div>
                  </div>
                )}

                {slide.visualType === 'rooms' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="bg-rose-950/40 border border-rose-500/40 rounded-lg p-2.5 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-rose-400 shrink-0" />
                      <div>
                        <p className="font-bold text-rose-200">Terkunci</p>
                        <p className="text-[10px] text-slate-400">Butuh Chapter sebelumnya</p>
                      </div>
                    </div>
                    <div className="bg-amber-950/40 border border-amber-500/40 rounded-lg p-2.5 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                      <div>
                        <p className="font-bold text-amber-200">Aktif</p>
                        <p className="text-[10px] text-slate-400">Baca buku &amp; kerjakan kuis</p>
                      </div>
                    </div>
                    <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-lg p-2.5 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <p className="font-bold text-emerald-200">Selesai</p>
                        <p className="text-[10px] text-slate-400">Pintu terkunci otomatis</p>
                      </div>
                    </div>
                  </div>
                )}

                {slide.visualType === 'books' && (
                  <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                    <span className="px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-400/50 text-amber-200 font-semibold">
                      1. Cari Cahaya Sparkle
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                    <span className="px-3 py-1.5 rounded-lg bg-sky-500/15 border border-sky-400/50 text-sky-200 font-semibold">
                      2. Tekan [E] / Tap Buku
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                    <span className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-400/50 text-emerald-200 font-semibold">
                      3. Klik Selesai Membaca
                    </span>
                  </div>
                )}

                {slide.visualType === 'quiz' && (
                  <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
                    <div className="px-3 py-2 rounded-lg bg-emerald-500/15 border border-emerald-400/50 text-emerald-200 font-bold">
                      Target Lulus: 100% Semua Soal Benar
                    </div>
                    <div className="px-3 py-2 rounded-lg bg-amber-500/15 border border-amber-400/50 text-amber-200 font-semibold">
                      Nomor salah ditampilkan agar mudah diulang
                    </div>
                  </div>
                )}
              </div>

              {/* Device hints */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                  <p className="font-bold text-sky-300 mb-1">Komputer / Laptop</p>
                  <p className="text-slate-200 leading-relaxed">{slide.desktopHint}</p>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                  <p className="font-bold text-emerald-300 mb-1">HP / Tablet</p>
                  <p className="text-slate-200 leading-relaxed">{slide.mobileHint}</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer (shown on slides 0..4) */}
        {step >= 0 && (
          <div className="px-4 sm:px-6 py-3 border-t border-slate-800 bg-slate-900/75 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              {step > 0 && (
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    setStep((s) => Math.max(0, s - 1));
                  }}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Kembali
                </button>
              )}
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onSkip();
                }}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Lewati
              </button>
            </div>

            {step < SLIDES.length - 1 ? (
              <button
                onClick={() => {
                  soundEngine.playClick();
                  setStep((s) => Math.min(SLIDES.length - 1, s + 1));
                }}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-display font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
              >
                Lanjut
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onComplete();
                }}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                Mulai Bermain
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
