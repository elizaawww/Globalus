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
  const [done, setDone] = useState(alreadyCompleted);

  const q = SECRET_TV_QUESTIONS[idx] || SECRET_TV_QUESTIONS[0];

  const handleChoose = (optId: string) => {
    if (done) return;
    setSelected(optId);
    if (optId === q.correctOptionId) {
      soundEngine.playSuccess();
      setFeedback('correct');
    } else {
      soundEngine.playError();
      setFeedback('wrong');
    }
  };

  const handleNext = () => {
    soundEngine.playClick();
    if (feedback !== 'correct') return;
    if (idx < SECRET_TV_QUESTIONS.length - 1) {
      setIdx((i) => i + 1);
      setSelected(null);
      setFeedback(null);
    } else {
      soundEngine.playRewardFanfare();
      setDone(true);
      onComplete();
    }
  };

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
          ) : (
            <>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-pink-300">
                  Pertanyaan {idx + 1} / {SECRET_TV_QUESTIONS.length}
                </span>
                <span>Jawab benar untuk lanjut</span>
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
                  const isCorrect = feedback === 'correct' && isChosen;
                  const isWrong = feedback === 'wrong' && isChosen;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleChoose(opt.id)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm transition-colors cursor-pointer ${
                        isCorrect
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 font-semibold'
                          : isWrong
                            ? 'bg-rose-500/20 border-rose-400 text-rose-200'
                            : 'bg-slate-900/80 border-slate-700 hover:border-pink-400/60 text-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {feedback === 'wrong' && (
                <p className="text-xs text-rose-300 bg-rose-950/40 border border-rose-500/40 rounded-lg px-3 py-2">
                  Belum tepat! Coba perhatikan kembali petunjuk siaran dan pilih jawaban lain.
                </p>
              )}

              {feedback === 'correct' && (
                <div className="space-y-3">
                  <p className="text-xs text-emerald-200 bg-emerald-950/40 border border-emerald-500/40 rounded-lg px-3 py-2 leading-relaxed">
                    {q.explanation}
                  </p>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="w-full py-2.5 rounded-xl bg-pink-500 hover:bg-pink-400 text-slate-950 font-display font-bold text-xs sm:text-sm cursor-pointer"
                  >
                    {idx < SECRET_TV_QUESTIONS.length - 1 ? 'Pertanyaan Berikutnya' : 'Klaim 2 Emote Rahasia'}
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
