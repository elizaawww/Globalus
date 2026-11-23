import React, { useEffect, useState } from 'react';
import { CheckCircle2, ShieldAlert, X } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { ImpostorChallenge } from '../types/game';

interface ImpostorChallengeModalProps {
  challenge: ImpostorChallenge;
  alreadyDone: boolean;
  onComplete: (challengeId: string, score: number) => void;
  onClose: () => void;
}

export const ImpostorChallengeModal: React.FC<ImpostorChallengeModalProps> = ({
  challenge,
  alreadyDone,
  onComplete,
  onClose,
}) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!alreadyDone) {
      soundEngine.playImpostorAction();
    }
  }, [alreadyDone, challenge.id]);

  const isCorrect = selected === challenge.correctIndex;

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
    if (selected === challenge.correctIndex) {
      soundEngine.playSuccess();
    } else {
      soundEngine.playError();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#080f24] border-2 border-rose-500/50 rounded-2xl p-5 md:p-6 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-400/50 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
                Misi Rahasia Impostor · {challenge.topic}
              </p>
              <h3 className="font-display text-base md:text-lg font-bold text-white">
                {challenge.title}
              </h3>
            </div>
          </div>
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {alreadyDone ? (
          <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-xl p-4 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-sm font-bold text-white">Protokol Sabotase Ruangan Ini Sudah Selesai</p>
            <p className="text-xs text-slate-300">
              Cari ruangan misi rahasia Impostor lainnya atau awasi pergerakan Crewmate.
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs md:text-sm text-slate-200 leading-relaxed bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              {challenge.scenario}
            </p>

            <div className="space-y-2">
              {challenge.options.map((opt, idx) => {
                const chosen = selected === idx;
                const correctOpt = idx === challenge.correctIndex;
                const letter = ['A', 'B', 'C', 'D'][idx] || String(idx + 1);
                let cls = 'bg-slate-900/80 border-slate-700 text-slate-200 hover:border-rose-400/60';
                if (submitted) {
                  if (correctOpt) cls = 'bg-emerald-500/15 border-emerald-400 text-emerald-200';
                  else if (chosen) cls = 'bg-rose-500/15 border-rose-400 text-rose-200';
                  else cls = 'bg-slate-950/60 border-slate-800 text-slate-500';
                } else if (chosen) {
                  cls = 'bg-rose-500/20 border-rose-400 text-white';
                }
                return (
                  <button
                    key={idx}
                    disabled={submitted}
                    onClick={() => {
                      soundEngine.playClick();
                      setSelected(idx);
                    }}
                    className={`w-full p-3 rounded-xl border text-left text-xs md:text-sm transition-all flex items-start gap-2.5 cursor-pointer ${cls}`}
                  >
                    <span className="w-6 h-6 rounded-md bg-slate-800 text-xs font-mono-num font-bold flex items-center justify-center shrink-0">
                      {letter}
                    </span>
                    <span className="leading-relaxed">{opt}</span>
                  </button>
                );
              })}
            </div>

            {submitted && (
              <div
                className={`rounded-xl p-3.5 text-xs border space-y-2 ${
                  isCorrect
                    ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-100'
                    : 'bg-rose-500/15 border-rose-400/50 text-rose-100'
                }`}
              >
                <p className={`font-bold text-sm ${isCorrect ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {isCorrect
                    ? 'Status: BENAR (+100 Skor Edukasi & Sabotase Aktif)'
                    : 'Status: SALAH — Jawaban Belum Tepat'}
                </p>
                <div className="bg-slate-950/75 border border-emerald-500/35 rounded-lg px-3 py-2">
                  <span className="font-bold text-emerald-300">Jawaban yang Benar: </span>
                  <span className="text-slate-100">
                    {(['A', 'B', 'C', 'D'][challenge.correctIndex] || '')}. {challenge.options[challenge.correctIndex]}
                  </span>
                </div>
                {!isCorrect && (
                  <p className="text-rose-200 leading-relaxed">
                    <span className="font-bold text-rose-300">Letak Kekeliruan: </span>
                    Pilihan sebelumnya keliru membaca konsep utama pada topik {challenge.topic}.
                  </p>
                )}
                <p className="text-slate-200 leading-relaxed">
                  <span className="font-bold text-sky-300 block mb-0.5">
                    {isCorrect ? 'Penguatan Pemahaman Sosiologi:' : 'Pembahasan Sosiologi:'}
                  </span>
                  {challenge.explanation}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              {!submitted ? (
                <button
                  disabled={selected === null}
                  onClick={handleSubmit}
                  className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 disabled:bg-slate-800 disabled:text-slate-500 text-white font-display font-bold text-xs cursor-pointer"
                >
                  EKSEKUSI DEKRIPSI
                </button>
              ) : (
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    if (isCorrect) {
                      onComplete(challenge.id, 100);
                    } else {
                      setSubmitted(false);
                      setSelected(null);
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-bold text-xs cursor-pointer"
                >
                  {isCorrect ? 'LANJUT · SELESAIKAN MISI RAHASIA' : 'LANJUT · COBA LAGI'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
