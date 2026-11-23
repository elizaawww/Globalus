import React, { useState } from 'react';
import { CheckCircle2, Sparkles, Tv, X } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { SECRET_TV_QUESTIONS } from '../data/gameData';

interface SecretTvModalProps {
  alreadyCompleted: boolean;
  onComplete: () => void;
  onClose: () => void;
}

export const SecretTvModal: React.FC<SecretTvModalProps> = ({
  alreadyCompleted,
  onComplete,
  onClose,
}) => {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [resultsByIdx, setResultsByIdx] = useState<Record<number, boolean>>({});
  const [summaryMode, setSummaryMode] = useState(false);
  const [done, setDone] = useState(alreadyCompleted);

  const q = SECRET_TV_QUESTIONS[idx] || SECRET_TV_QUESTIONS[0];
  const correctOpt = q.options.find((o) => o.id === q.correctOptionId);

  const handleChoose = (optId: string) => {
    if (done || feedback !== null) return;
    setSelected(optId);
    const ok = optId === q.correctOptionId;
    setResultsByIdx((prev) => ({ ...prev, [idx]: ok }));
    if (ok) {
      soundEngine.playSuccess();
      setFeedback('correct');
    } else {
      soundEngine.playError();
      setFeedback('wrong');
    }
  };

  const handleNext = () => {
    soundEngine.playClick();
    if (feedback === null) return;
    if (idx < SECRET_TV_QUESTIONS.length - 1) {
      setIdx((i) => i + 1);
      setSelected(null);
      setFeedback(null);
    } else {
      const correctTotal = Object.values(resultsByIdx).filter(Boolean).length;
      if (correctTotal >= SECRET_TV_QUESTIONS.length) {
        soundEngine.playRewardFanfare();
        setDone(true);
        onComplete();
      } else {
        setSummaryMode(true);
      }
    }
  };

  const handleRetryAll = () => {
    soundEngine.playClick();
    setIdx(0);
    setSelected(null);
    setFeedback(null);
    setResultsByIdx({});
    setSummaryMode(false);
  };

  const correctTotal = Object.values(resultsByIdx).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-[75] bg-slate-950/90 flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-xl max-h-[92dvh] bg-[#080f24] border border-pink-400/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/15 border border-pink-400/45 flex items-center justify-center shrink-0">
              <Tv className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <h2 className="font-display text-base sm:text-lg font-extrabold text-white">
                TV BUDAYA GLOBAL (RAHASIA)
              </h2>
              <p className="text-[11px] text-slate-400">
                Tantangan Budaya Pop &amp; Glokalisasi · Berhadiah 2 Emote Spesial
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            aria-label="Tutup TV Rahasia"
            className="min-w-[38px] min-h-[38px] p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto sci-scroll">
          {done ? (
            <div className="text-center space-y-4 py-3">
              <div className="w-14 h-14 rounded-2xl mx-auto bg-emerald-500/15 border border-emerald-400/50 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-display text-lg font-extrabold text-white">
                  Emote Rahasia Terbuka!
                </h3>
                <p className="text-xs sm:text-sm text-slate-300">
                  Kamu berhasil memecahkan kuis TV Budaya Global dan membuka dua emote spesial:
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2.5 max-w-sm mx-auto text-xs">
                <div className="p-3 rounded-xl bg-pink-500/15 border border-pink-400/50 text-pink-200 font-bold flex items-center justify-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Cosmic Idol
                </div>
                <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-400/50 text-amber-200 font-bold flex items-center justify-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Starlight Pop
                </div>
              </div>
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onClose();
                }}
                className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-display font-bold text-xs sm:text-sm cursor-pointer"
              >
                Tutup &amp; Coba Emote
              </button>
            </div>
          ) : summaryMode ? (
            <div className="text-center space-y-4 py-3">
              <h3 className="font-display text-lg font-bold text-white">
                Belum Tuntas ({correctTotal} / {SECRET_TV_QUESTIONS.length} Benar)
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Jawab seluruh siaran rahasia dengan benar berdasarkan pembahasan yang sudah dipelajari untuk membuka 2 emote spesial.
              </p>
              <button
                type="button"
                onClick={handleRetryAll}
                className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-bold text-xs sm:text-sm cursor-pointer"
              >
                Ulangi Tantangan TV Budaya
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-pink-300">
                  Pertanyaan {idx + 1} / {SECRET_TV_QUESTIONS.length}
                </span>
                <span>Simak pembahasan sebelum lanjut</span>
              </div>

              <div className="bg-slate-900/80 border border-pink-500/30 rounded-xl p-3 space-y-1.5">
                <p className="text-xs font-bold text-pink-300">{q.clueTitle}</p>
                {q.clues.map((clue, cIdx) => (
                  <p key={cIdx} className="text-xs text-slate-300 leading-relaxed">
                    {clue}
                  </p>
                ))}
              </div>

              <p className="text-sm sm:text-base font-semibold text-white leading-relaxed">
                {q.question}
              </p>

              <div className="space-y-2">
                {q.options.map((opt) => {
                  const isChosen = selected === opt.id;
                  const isAnswer = opt.id === q.correctOptionId;
                  const submitted = feedback !== null;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={submitted}
                      onClick={() => handleChoose(opt.id)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm transition-colors ${
                        submitted
                          ? isAnswer
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-100 font-semibold'
                            : isChosen
                              ? 'bg-rose-500/20 border-rose-400 text-rose-100'
                              : 'bg-slate-950/60 border-slate-800 text-slate-500'
                          : 'bg-slate-900/80 border-slate-700 hover:border-pink-400/60 text-slate-200 cursor-pointer'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {feedback !== null && (
                <div
                  className={`rounded-xl p-3.5 border space-y-2 text-xs ${
                    feedback === 'correct'
                      ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-100'
                      : 'bg-rose-500/15 border-rose-400/50 text-rose-100'
                  }`}
                >
                  <p className={`font-bold text-sm ${feedback === 'correct' ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {feedback === 'correct' ? 'Status: BENAR!' : 'Status: SALAH — Jawaban Belum Tepat'}
                  </p>
                  {correctOpt && (
                    <div className="bg-slate-950/75 border border-emerald-500/35 rounded-lg px-3 py-2">
                      <span className="font-bold text-emerald-300">Jawaban yang Benar: </span>
                      <span className="text-slate-100">{correctOpt.label}</span>
                    </div>
                  )}
                  {feedback === 'wrong' && (
                    <p className="text-rose-200 leading-relaxed">
                      <span className="font-bold text-rose-300">Letak Kekeliruan: </span>
                      Pilihan tersebut bertentangan dengan bukti keterbukaan budaya dan kreativitas lokal pada siaran.
                    </p>
                  )}
                  <p className="text-slate-200 leading-relaxed">
                    <span className="font-bold text-sky-300 block mb-0.5">Pembahasan Sosiologi:</span>
                    {q.explanation}
                  </p>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-bold text-xs sm:text-sm cursor-pointer"
                  >
                    {idx < SECRET_TV_QUESTIONS.length - 1
                      ? 'LANJUT · PERTANYAAN BERIKUTNYA'
                      : 'LANJUT · PERIKSA HASIL'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
