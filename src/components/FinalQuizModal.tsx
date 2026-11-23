import React, { useMemo, useState } from 'react';
import { Award, X } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { FINAL_QUIZ_QUESTIONS } from '../data/gameData';
import { shuffleArray } from '../utils/questionShuffle';
import { QuestionRenderer } from './QuestionRenderer';

interface FinalQuizModalProps {
  onFinishQuiz: (score: number, correctCount: number, totalCount: number) => void;
  onClose: () => void;
}

export const FinalQuizModal: React.FC<FinalQuizModalProps> = ({
  onFinishQuiz,
  onClose,
}) => {
  const questions = useMemo(() => shuffleArray(FINAL_QUIZ_QUESTIONS), []);
  const [idx, setIdx] = useState(0);
  const [resultsByIdx, setResultsByIdx] = useState<Record<number, boolean>>({});

  const q = questions[idx];
  const total = questions.length;

  const answeredCount = Object.keys(resultsByIdx).length;
  const correctCount = Object.values(resultsByIdx).filter(Boolean).length;

  const handleResult = (correct: boolean) => {
    setResultsByIdx((prev) => {
      if (prev[idx] !== undefined) return prev;
      return { ...prev, [idx]: correct };
    });
  };

  const handleNext = () => {
    if (idx < total - 1) {
      setIdx((i) => i + 1);
    } else {
      const finalCorrect = Object.values(resultsByIdx).filter(Boolean).length;
      const finalScore = Math.round((finalCorrect / total) * 100);
      onFinishQuiz(finalScore, finalCorrect, total);
    }
  };

  const progressPct = (answeredCount / total) * 100;
  const currentTempScore = Math.round((correctCount / total) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-3 md:p-6">
      <div className="w-full max-w-3xl max-h-[92vh] bg-[#080f24] border border-amber-400/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Award className="w-6 h-6 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <h2 className="font-display text-base md:text-xl font-bold text-white truncate">
                FINAL EVALUATION — STUDI KASUS HOTS
              </h2>
              <p className="text-xs text-slate-400 truncate">
                {q.subtopic || q.category}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <p className="text-xs font-mono-num text-slate-300">
                Kasus {idx + 1} / {total}
              </p>
              <p className="text-[11px] font-mono-num text-amber-300">
                Skor Sementara: {currentTempScore}
              </p>
            </div>
            <button
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
              aria-label="Tutup Quiz"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-slate-900 shrink-0">
          <div
            className="h-full bg-gradient-to-r from-sky-400 via-emerald-400 to-amber-400 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Question & Options */}
        <div className="flex-1 overflow-y-auto sci-scroll p-5 md:p-6">
          <QuestionRenderer
            key={q.model.id}
            question={q.model}
            onResult={handleResult}
            nextButtonLabel={idx < total - 1 ? 'LANJUT · SOAL BERIKUTNYA' : 'LANJUT · LIHAT HASIL & BADGE'}
            onNext={handleNext}
          />
        </div>
      </div>
    </div>
  );
};
