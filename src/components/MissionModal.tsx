import React, { useMemo, useState } from 'react';
import { Award, BookOpen, CheckCircle2, Lock, RotateCcw, Sparkles, X } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { CHAPTER_INFO, MISSION_META, MISSION_QUESTIONS } from '../data/gameData';
import { ROOMS } from '../data/stationLayout';
import {
  areRequiredBooksRead,
  getBooksForMission,
  getUnreadBooksForMission,
} from '../data/theoryBooks';
import { MissionId, TheoryBookId } from '../types/game';
import { QuestionRenderer } from './QuestionRenderer';

interface MissionModalProps {
  missionId: MissionId;
  alreadyCompleted: boolean;
  readBooks?: TheoryBookId[];
  onOpenBook?: (bookId: TheoryBookId) => void;
  onComplete: (missionId: MissionId, score: number) => void;
  onClose: () => void;
}

export const MissionModal: React.FC<MissionModalProps> = ({
  missionId,
  alreadyCompleted,
  readBooks = [],
  onOpenBook,
  onComplete,
  onClose,
}) => {
  const meta = MISSION_META[missionId];
  const chapInfo = CHAPTER_INFO[meta.chapter];
  const room = ROOMS[meta.roomId];
  const questions = useMemo(() => MISSION_QUESTIONS[missionId] || [], [missionId]);

  const booksRequired = useMemo(() => getBooksForMission(missionId), [missionId]);
  const unreadBooks = useMemo(
    () => getUnreadBooksForMission(missionId, readBooks),
    [missionId, readBooks]
  );
  const canAccessQuiz = useMemo(
    () => areRequiredBooksRead(missionId, readBooks),
    [missionId, readBooks]
  );

  const [qIdx, setQIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [attemptKey, setAttemptKey] = useState(0);

  const total = questions.length;
  const currentQ = questions[qIdx];

  const handleResult = (isCorrect: boolean) => {
    if (!canAccessQuiz) return;
    setAnsweredCount((a) => a + 1);
    if (isCorrect) {
      setCorrectCount((c) => c + 1);
    }
  };

  const handleNext = () => {
    if (!canAccessQuiz) return;
    if (qIdx < total - 1) {
      setQIdx((i) => i + 1);
    } else {
      setFinished(true);
    }
  };

  const finalScore = total > 0 ? Math.round((correctCount / total) * 100) : 100;
  const passed = finalScore >= 50;

  const handleRetry = () => {
    soundEngine.playClick();
    setQIdx(0);
    setCorrectCount(0);
    setAnsweredCount(0);
    setFinished(false);
    setAttemptKey((k) => k + 1);
  };

  const handleConfirmFinish = () => {
    if (!canAccessQuiz) {
      soundEngine.playError();
      return;
    }
    soundEngine.playTaskComplete();
    onComplete(missionId, Math.max(60, finalScore));
  };

  const progressPct = total > 0 ? (answeredCount / total) * 100 : 100;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 md:p-6">
      <div
        className="w-full max-w-3xl max-h-[90vh] bg-[#080f24] rounded-2xl shadow-2xl flex flex-col overflow-hidden border"
        style={{ borderColor: `${chapInfo.accentHex}70` }}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/75">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-slate-950"
                style={{ backgroundColor: chapInfo.accentHex }}
              >
                Chapter {meta.chapter}
              </span>
              <span className="text-[11px] text-slate-300 font-semibold">{meta.topic}</span>
              {canAccessQuiz ? (
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 font-bold">
                  Buku Teori Selesai ✓
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold">
                  Terkunci — Wajib Baca Buku
                </span>
              )}
              {alreadyCompleted && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold">
                  Selesai
                </span>
              )}
            </div>
            <h2 className="font-display text-base md:text-lg font-bold text-white mt-0.5">
              {meta.title}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {canAccessQuiz && !finished && (
              <span className="text-xs font-mono-num text-slate-300">
                Tahap {qIdx + 1} / {total}
              </span>
            )}
            <button
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
              aria-label="Tutup Misi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-slate-900 shrink-0">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${canAccessQuiz ? progressPct : 0}%`,
              backgroundColor: canAccessQuiz ? chapInfo.accentHex : '#f59e0b',
            }}
          />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto sci-scroll p-5 md:p-6">
          {!canAccessQuiz ? (
            <div className="bg-slate-900/90 border border-amber-500/40 rounded-2xl p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center bg-amber-500/15 border border-amber-400/40">
                <Lock className="w-7 h-7 text-amber-300" />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-display text-lg md:text-xl font-bold text-white">
                  Kuis Misi Terkunci — Baca Buku Teori Terlebih Dahulu
                </h3>
                <p className="text-xs md:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
                  Sebelum mengerjakan kuis di <span className="text-sky-300 font-semibold">{room?.name}</span>, kamu wajib membaca seluruh Buku Teori di ruangan ini dan menekan tombol{' '}
                  <span className="text-emerald-300 font-bold">Selesai Membaca</span>.
                </p>
              </div>

              <div className="max-w-lg mx-auto space-y-2 text-left">
                {booksRequired.map((book) => {
                  const isDone = !unreadBooks.some((u) => u.id === book.id);
                  return (
                    <div
                      key={book.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                        isDone
                          ? 'bg-emerald-950/35 border-emerald-500/40 text-emerald-200'
                          : 'bg-amber-950/35 border-amber-500/40 text-amber-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <BookOpen className="w-4 h-4 shrink-0" style={{ color: book.accentHex }} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{book.title}</p>
                          <p className="text-[11px] opacity-80">
                            {isDone ? 'Sudah Dibaca ✓' : 'Belum Dibaca (!)'}
                          </p>
                        </div>
                      </div>
                      {!isDone && onOpenBook && (
                        <button
                          onClick={() => {
                            soundEngine.playInteract();
                            onClose();
                            onOpenBook(book.id);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-bold text-[11px] shrink-0 cursor-pointer"
                        >
                          Buka Buku
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="text-[11px] text-slate-400">
                Dekati meja buku teori di {room?.name} dan tekan tombol <span className="font-bold text-amber-300">[E]</span>, lalu tekan <span className="font-bold text-emerald-300">Selesai Membaca</span>.
              </p>
            </div>
          ) : !finished && currentQ ? (
            <QuestionRenderer
              key={`${missionId}_${currentQ.id}_${attemptKey}`}
              question={currentQ}
              onResult={handleResult}
              nextButtonLabel={qIdx < total - 1 ? 'TAHAP BERIKUTNYA' : 'SELESAIKAN MISI'}
              onNext={handleNext}
            />
          ) : (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center bg-slate-950 border border-slate-700">
                {passed ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                ) : (
                  <Sparkles className="w-8 h-8 text-amber-400" />
                )}
              </div>

              <div>
                <h3 className="font-display text-xl font-bold text-white">
                  {passed ? 'KALIBRASI MODUL BERHASIL!' : 'ULANGI KALIBRASI MODUL'}
                </h3>
                <p className="text-xs md:text-sm text-slate-300 mt-1">
                  Kamu menjawab benar{' '}
                  <span className="font-mono-num font-bold text-sky-300">
                    {correctCount} dari {total}
                  </span>{' '}
                  tantangan ({finalScore}%).
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs md:text-sm font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Coba Lagi
                </button>
                {passed && (
                  <button
                    onClick={handleConfirmFinish}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-xs md:text-sm cursor-pointer shadow-lg shadow-emerald-500/20"
                  >
                    <Award className="w-4 h-4" />
                    SIMPAN &amp; PULIHKAN MODUL
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
