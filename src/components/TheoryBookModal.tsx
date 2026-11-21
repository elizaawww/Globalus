import React from 'react';
import { BookOpen, CheckCircle2, Lightbulb, LockOpen, Sparkles, X } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { ROOMS } from '../data/stationLayout';
import { THEORY_BOOK_MAP } from '../data/theoryBooks';
import { TheoryBookDef, TheoryBookId } from '../types/game';

interface TheoryBookModalProps {
  bookId: TheoryBookId;
  alreadyRead: boolean;
  onMarkRead?: (bookId: TheoryBookId) => void;
  onClose: () => void;
}

const TheoryDiagramSvg: React.FC<{ diagramType: TheoryBookDef['diagramType']; accentHex: string }> = ({
  diagramType,
  accentHex,
}) => {
  switch (diagramType) {
    case 'interconnection':
      return (
        <svg viewBox="0 0 320 130" className="w-full h-32">
          <circle cx="160" cy="65" r="34" fill={`${accentHex}22`} stroke={accentHex} strokeWidth="2" />
          <circle cx="55" cy="40" r="18" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
          <circle cx="265" cy="40" r="18" fill="#0f172a" stroke="#10b981" strokeWidth="1.5" />
          <circle cx="65" cy="100" r="18" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
          <circle cx="255" cy="100" r="18" fill="#0f172a" stroke="#ec4899" strokeWidth="1.5" />
          <path d="M73 44 L128 58 M247 44 L192 58 M83 96 L130 76 M237 96 L190 76" stroke={accentHex} strokeWidth="1.8" strokeDasharray="4 3" />
          <text x="160" y="69" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">GLOBAL</text>
          <text x="55" y="43" textAnchor="middle" fill="#bae6fd" fontSize="8">Lokal A</text>
          <text x="265" y="43" textAnchor="middle" fill="#a7f3d0" fontSize="8">Lokal B</text>
          <text x="65" y="103" textAnchor="middle" fill="#fde68a" fontSize="8">Ekonomi</text>
          <text x="255" y="103" textAnchor="middle" fill="#fbcfe8" fontSize="8">Budaya</text>
        </svg>
      );
    case 'characteristics':
      return (
        <svg viewBox="0 0 320 130" className="w-full h-32">
          <rect x="20" y="20" width="84" height="88" rx="10" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
          <rect x="118" y="20" width="84" height="88" rx="10" fill="#0f172a" stroke="#2563eb" strokeWidth="1.5" />
          <rect x="216" y="20" width="84" height="88" rx="10" fill="#0f172a" stroke="#10b981" strokeWidth="1.5" />
          <text x="62" y="55" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold">RUANG &amp;</text>
          <text x="62" y="70" textAnchor="middle" fill="#e2e8f0" fontSize="9">WAKTU MENYUSUT</text>
          <text x="160" y="55" textAnchor="middle" fill="#60a5fa" fontSize="10" fontWeight="bold">EKONOMI</text>
          <text x="160" y="70" textAnchor="middle" fill="#e2e8f0" fontSize="9">TERINTEGRASI</text>
          <text x="258" y="55" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="bold">MASALAH</text>
          <text x="258" y="70" textAnchor="middle" fill="#e2e8f0" fontSize="9">BERSAMA GLOBAL</text>
        </svg>
      );
    case 'hyperglobalist':
      return (
        <svg viewBox="0 0 320 130" className="w-full h-32">
          <rect x="30" y="34" width="260" height="62" rx="31" fill={`${accentHex}18`} stroke={accentHex} strokeWidth="2" strokeDasharray="6 4" />
          <circle cx="90" cy="65" r="20" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.8" />
          <circle cx="160" cy="65" r="24" fill="#0c4a6e" stroke="#38bdf8" strokeWidth="2" />
          <circle cx="230" cy="65" r="20" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.8" />
          <text x="90" y="68" textAnchor="middle" fill="#e0f2fe" fontSize="9">Pasar</text>
          <text x="160" y="68" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">BORDERLESS</text>
          <text x="230" y="68" textAnchor="middle" fill="#e0f2fe" fontSize="9">Digital</text>
        </svg>
      );
    case 'transformationalist':
      return (
        <svg viewBox="0 0 320 130" className="w-full h-32">
          <rect x="24" y="42" width="76" height="44" rx="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
          <rect x="220" y="42" width="76" height="44" rx="8" fill="#0f172a" stroke="#10b981" strokeWidth="1.5" />
          <circle cx="160" cy="64" r="26" fill="#064e3b" stroke="#34d399" strokeWidth="2" />
          <path d="M104 54 L132 54 M132 74 L104 74 M188 54 L216 54 M216 74 L188 74" stroke="#34d399" strokeWidth="2" />
          <text x="62" y="67" textAnchor="middle" fill="#bae6fd" fontSize="10">ARUS GLOBAL</text>
          <text x="160" y="67" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">ADAPTIF</text>
          <text x="258" y="67" textAnchor="middle" fill="#a7f3d0" fontSize="10">KREATIF LOKAL</text>
        </svg>
      );
    case 'skeptic':
      return (
        <svg viewBox="0 0 320 130" className="w-full h-32">
          <polygon points="85,22 145,108 25,108" fill="#7f1d1d" fillOpacity="0.45" stroke="#f43f5e" strokeWidth="1.8" />
          <line x1="56" y1="64" x2="114" y2="64" stroke="#fca5a5" strokeWidth="1.2" />
          <text x="85" y="53" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">CORE</text>
          <text x="85" y="95" textAnchor="middle" fill="#fecdd3" fontSize="9">PERIPHERY</text>
          <rect x="175" y="34" width="122" height="62" rx="10" fill="#0f172a" stroke="#f43f5e" strokeWidth="1.5" />
          <text x="236" y="59" textAnchor="middle" fill="#fda4af" fontSize="10" fontWeight="bold">SIKAP KRITIS</text>
          <text x="236" y="76" textAnchor="middle" fill="#e2e8f0" fontSize="9">Selektif &amp; Berdaulat</text>
        </svg>
      );
    case 'glocalization':
      return (
        <svg viewBox="0 0 320 130" className="w-full h-32">
          <circle cx="118" cy="65" r="38" fill="#0284c7" fillOpacity="0.25" stroke="#38bdf8" strokeWidth="2" />
          <circle cx="202" cy="65" r="38" fill="#059669" fillOpacity="0.25" stroke="#10b981" strokeWidth="2" />
          <text x="92" y="68" textAnchor="middle" fill="#bae6fd" fontSize="10" fontWeight="bold">GLOBAL</text>
          <text x="228" y="68" textAnchor="middle" fill="#a7f3d0" fontSize="10" fontWeight="bold">LOKAL</text>
          <text x="160" y="63" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">GLOKAL</text>
          <text x="160" y="76" textAnchor="middle" fill="#fef08a" fontSize="8">Hibrida</text>
        </svg>
      );
    case 'economy':
      return (
        <svg viewBox="0 0 320 130" className="w-full h-32">
          <rect x="24" y="28" width="122" height="74" rx="10" fill="#0f172a" stroke="#10b981" strokeWidth="1.5" />
          <rect x="174" y="28" width="122" height="74" rx="10" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
          <text x="85" y="54" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="bold">PELUANG</text>
          <text x="85" y="72" textAnchor="middle" fill="#e2e8f0" fontSize="8.5">Ekspor UMKM &amp; FDI</text>
          <text x="235" y="54" textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="bold">TANTANGAN</text>
          <text x="235" y="72" textAnchor="middle" fill="#e2e8f0" fontSize="8.5">Persaingan Impor &amp; Paten</text>
        </svg>
      );
    case 'sociocultural':
      return (
        <svg viewBox="0 0 320 130" className="w-full h-32">
          <circle cx="70" cy="65" r="28" fill="#312e81" stroke="#818cf8" strokeWidth="1.8" />
          <circle cx="250" cy="65" r="28" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.8" />
          <line x1="100" y1="65" x2="220" y2="65" stroke="#a5b4fc" strokeWidth="2.5" />
          <circle cx="160" cy="65" r="16" fill="#4f46e5" />
          <text x="70" y="68" textAnchor="middle" fill="#e0e7ff" fontSize="9">IPTEK</text>
          <text x="160" y="69" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="bold">AKSES</text>
          <text x="250" y="68" textAnchor="middle" fill="#bae6fd" fontSize="9">SOSIAL</text>
        </svg>
      );
    case 'communication':
      return (
        <svg viewBox="0 0 320 130" className="w-full h-32">
          <rect x="14" y="34" width="64" height="60" rx="8" fill="#0f172a" stroke="#64748b" strokeWidth="1.4" />
          <rect x="92" y="34" width="64" height="60" rx="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.4" />
          <rect x="170" y="34" width="64" height="60" rx="8" fill="#0f172a" stroke="#0ea5e9" strokeWidth="1.6" />
          <rect x="248" y="34" width="60" height="60" rx="8" fill="#0c4a6e" stroke="#22d3ee" strokeWidth="1.8" />
          <path d="M78 64 L92 64 M156 64 L170 64 M234 64 L248 64" stroke="#38bdf8" strokeWidth="2" />
          <text x="46" y="61" textAnchor="middle" fill="#cbd5e1" fontSize="8.5" fontWeight="bold">POS &amp;</text>
          <text x="46" y="74" textAnchor="middle" fill="#94a3b8" fontSize="8">Telegram</text>
          <text x="124" y="61" textAnchor="middle" fill="#bae6fd" fontSize="8.5" fontWeight="bold">RADIO &amp;</text>
          <text x="124" y="74" textAnchor="middle" fill="#bae6fd" fontSize="8">TV Satelit</text>
          <text x="202" y="61" textAnchor="middle" fill="#7dd3fc" fontSize="8.5" fontWeight="bold">SERAT</text>
          <text x="202" y="74" textAnchor="middle" fill="#bae6fd" fontSize="8">Optik/Surel</text>
          <text x="278" y="61" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="bold">MEDSOS</text>
          <text x="278" y="74" textAnchor="middle" fill="#a5f3fc" fontSize="8">Real-Time</text>
        </svg>
      );
    case 'identity':
      return (
        <svg viewBox="0 0 320 130" className="w-full h-32">
          <rect x="28" y="34" width="118" height="24" rx="6" fill="#0ea5e9" fillOpacity="0.28" stroke="#38bdf8" strokeWidth="1.5" />
          <rect x="28" y="74" width="76" height="24" rx="6" fill="#f59e0b" fillOpacity="0.28" stroke="#fbbf24" strokeWidth="1.5" />
          <line x1="104" y1="86" x2="180" y2="86" stroke="#f43f5e" strokeWidth="2" strokeDasharray="3 3" />
          <text x="87" y="50" textAnchor="middle" fill="#e0f2fe" fontSize="9">Teknologi (Cepat)</text>
          <text x="66" y="90" textAnchor="middle" fill="#fde68a" fontSize="9">Norma</text>
          <text x="235" y="68" textAnchor="middle" fill="#fda4af" fontSize="10" fontWeight="bold">CULTURAL LAG</text>
        </svg>
      );
    case 'inequality':
    default:
      return (
        <svg viewBox="0 0 320 130" className="w-full h-32">
          <polygon points="160,16 260,110 60,110" fill="#1e293b" stroke="#b91c1c" strokeWidth="2" />
          <line x1="126" y1="48" x2="194" y2="48" stroke="#fbbf24" strokeWidth="1.5" />
          <line x1="94" y1="78" x2="226" y2="78" stroke="#38bdf8" strokeWidth="1.5" />
          <text x="160" y="38" textAnchor="middle" fill="#fef08a" fontSize="9.5" fontWeight="bold">CORE</text>
          <text x="160" y="67" textAnchor="middle" fill="#bae6fd" fontSize="9.5" fontWeight="bold">SEMI-PERIPHERY</text>
          <text x="160" y="98" textAnchor="middle" fill="#fecaca" fontSize="9.5" fontWeight="bold">PERIPHERY</text>
        </svg>
      );
  }
};

export const TheoryBookModal: React.FC<TheoryBookModalProps> = ({
  bookId,
  alreadyRead,
  onMarkRead,
  onClose,
}) => {
  const book = THEORY_BOOK_MAP[bookId];
  if (!book) return null;

  const room = ROOMS[book.roomId];

  const handleConfirmRead = () => {
    soundEngine.playSuccess();
    onMarkRead?.(book.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 md:p-6">
      <div
        className="w-full max-w-2xl max-h-[90vh] bg-[#080f24] rounded-2xl shadow-2xl flex flex-col overflow-hidden border"
        style={{ borderColor: `${book.accentHex}70` }}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/75">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0"
              style={{
                backgroundColor: `${book.accentHex}20`,
                borderColor: `${book.accentHex}55`,
              }}
            >
              <BookOpen className="w-5 h-5" style={{ color: book.accentHex }} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: book.accentHex }}
                >
                  {book.topicLabel} · {book.chapterHint}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    alreadyRead
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                      : 'bg-sky-500/20 text-sky-200 border-sky-400/50'
                  }`}
                >
                  {alreadyRead ? 'Sudah Dibaca ✓' : 'Sedang Membaca'}
                </span>
              </div>
              <h2 className="font-display text-base md:text-lg font-bold text-white leading-tight truncate">
                {book.title}
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer shrink-0"
            aria-label="Tutup Sementara"
            title="Tutup sementara tanpa menandai selesai membaca"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mandatory Reading Requirement Banner */}
        <div
          className={`px-5 py-2.5 border-b flex items-center justify-between gap-2 text-xs shrink-0 ${
            alreadyRead
              ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-200'
              : 'bg-amber-950/50 border-amber-500/35 text-amber-100'
          }`}
        >
          <span className="flex items-center gap-2">
            {alreadyRead ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <LockOpen className="w-4 h-4 text-amber-300 shrink-0" />
            )}
            <span>
              {alreadyRead
                ? `Materi ini sudah selesai dibaca. Kuis di ${room?.name || 'ruangan ini'} dapat diakses melalui terminal misi.`
                : `Syarat Wajib Misi: Pelajari seluruh materi di bawah lalu tekan tombol "Selesai Membaca" untuk membuka kuis di ${room?.name || 'ruangan ini'}.`}
            </span>
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto sci-scroll p-5 space-y-4">
          {/* Diagram Card */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3">
            <TheoryDiagramSvg diagramType={book.diagramType} accentHex={book.accentHex} />
          </div>

          {/* Summary */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-sky-300 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Ringkasan Konsep Inti
            </h3>
            <p className="text-xs md:text-sm text-slate-100 leading-relaxed">{book.summary}</p>
          </div>

          {/* Key Points */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Materi Lengkap Sosiologi Kelas XII
            </h3>
            <ul className="space-y-2.5">
              {book.keyPoints.map((pt, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs md:text-sm text-slate-200 leading-relaxed">
                  <span
                    className="w-5 h-5 rounded-md text-[11px] font-mono-num font-bold flex items-center justify-center shrink-0 mt-0.5 text-slate-950"
                    style={{ backgroundColor: book.accentHex }}
                  >
                    {i + 1}
                  </span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Real Life Example */}
          <div className="bg-amber-500/10 border border-amber-400/35 rounded-xl p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-1 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5" />
              Contoh Nyata dalam Kehidupan
            </h3>
            <p className="text-xs md:text-sm text-amber-100 leading-relaxed">{book.exampleInLife}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-900/70 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-slate-300">
            {alreadyRead
              ? 'Status membaca tersimpan permanen untuk akun ini.'
              : 'Menutup jendela (X) tidak mencatat progres membaca — tekan Selesai Membaca.'}
          </span>
          <button
            onClick={handleConfirmRead}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-xs md:text-sm cursor-pointer whitespace-nowrap shrink-0 shadow-lg shadow-emerald-500/20"
          >
            <CheckCircle2 className="w-4 h-4" />
            {alreadyRead ? 'Tutup Buku' : 'Selesai Membaca'}
          </button>
        </div>
      </div>
    </div>
  );
};
