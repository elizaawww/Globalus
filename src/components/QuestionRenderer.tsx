import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  GitBranch,
  Link2,
  ListChecks,
  Scale,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { QuestionModel, QuestionModelType } from '../types/game';
import { gradeQuestionResponse, prepareShuffledQuestion } from '../utils/questionShuffle';

interface QuestionRendererProps {
  question: QuestionModel;
  onResult: (isCorrect: boolean) => void;
  nextButtonLabel: string;
  onNext: () => void;
}

const QUESTION_TYPE_LABELS: Record<QuestionModelType, { label: string; colorClass: string }> = {
  multiple_choice: { label: 'Pilihan Ganda', colorClass: 'bg-sky-500/15 border-sky-400/50 text-sky-300' },
  true_false: { label: 'Benar / Salah', colorClass: 'bg-emerald-500/15 border-emerald-400/50 text-emerald-300' },
  case_study: { label: 'Studi Kasus', colorClass: 'bg-amber-500/15 border-amber-400/50 text-amber-300' },
  cause_effect: { label: 'Sebab & Akibat', colorClass: 'bg-purple-500/15 border-purple-400/50 text-purple-300' },
  statement_analysis: { label: 'Analisis Pernyataan', colorClass: 'bg-cyan-500/15 border-cyan-400/50 text-cyan-300' },
  concept_matching: { label: 'Pencocokan Konsep', colorClass: 'bg-pink-500/15 border-pink-400/50 text-pink-300' },
  process_sequence: { label: 'Urutan Proses', colorClass: 'bg-indigo-500/15 border-indigo-400/50 text-indigo-300' },
};

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  onResult,
  nextButtonLabel,
  onNext,
}) => {
  const prepared = useMemo(() => prepareShuffledQuestion(question), [question]);

  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // State for single choice
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  // State for concept_matching
  const [activeLeftId, setActiveLeftId] = useState<string | null>(null);
  const [matchMap, setMatchMap] = useState<Record<string, string>>({});

  // State for process_sequence
  const [orderedSteps, setOrderedSteps] = useState(
    prepared.kind === 'sequence' ? prepared.initialSteps : []
  );

  useEffect(() => {
    setAnswered(false);
    setIsCorrect(false);
    setSelectedOptionId(null);
    setActiveLeftId(null);
    setMatchMap({});
    if (prepared.kind === 'sequence') {
      setOrderedSteps(prepared.initialSteps);
    }
  }, [prepared]);

  const badgeInfo = QUESTION_TYPE_LABELS[question.type];

  const handleSelectSingle = (optId: string) => {
    if (answered) return;
    const correct = gradeQuestionResponse(question, { kind: 'single', selectedOptionId: optId });
    setSelectedOptionId(optId);
    setAnswered(true);
    setIsCorrect(correct);
    if (correct) soundEngine.playSuccess();
    else soundEngine.playError();
    onResult(correct);
  };

  const handleSelectMatchRight = (rightId: string) => {
    if (answered || !activeLeftId) return;
    soundEngine.playClick();
    setMatchMap((prev) => {
      const next = { ...prev };
      // Ensure rightId is not duplicated elsewhere cleanly
      for (const k of Object.keys(next)) {
        if (next[k] === rightId) delete next[k];
      }
      next[activeLeftId] = rightId;
      return next;
    });
    setActiveLeftId(null);
  };

  const handleSubmitMatching = () => {
    if (answered || prepared.kind !== 'matching') return;
    const correct = gradeQuestionResponse(question, { kind: 'matching', mapping: matchMap });
    setAnswered(true);
    setIsCorrect(correct);
    if (correct) soundEngine.playSuccess();
    else soundEngine.playError();
    onResult(correct);
  };

  const moveStep = (idx: number, dir: -1 | 1) => {
    if (answered) return;
    const target = idx + dir;
    if (target < 0 || target >= orderedSteps.length) return;
    soundEngine.playClick();
    const next = [...orderedSteps];
    const tmp = next[idx];
    next[idx] = next[target];
    next[target] = tmp;
    setOrderedSteps(next);
  };

  const handleSubmitSequence = () => {
    if (answered || prepared.kind !== 'sequence') return;
    const correct = gradeQuestionResponse(question, {
      kind: 'sequence',
      orderedIds: orderedSteps.map((s) => s.id),
    });
    setAnswered(true);
    setIsCorrect(correct);
    if (correct) soundEngine.playSuccess();
    else soundEngine.playError();
    onResult(correct);
  };

  const correctSingleInfo = useMemo(() => {
    if (prepared.kind !== 'single') return null;
    const idx = prepared.shuffledOptions.findIndex(
      (opt) => opt.id === prepared.question.correctOptionId
    );
    if (idx < 0) return null;
    const letter = ['A', 'B', 'C', 'D'][idx] || String(idx + 1);
    return { letter, opt: prepared.shuffledOptions[idx] };
  }, [prepared]);

  const chosenSingleOption = useMemo(() => {
    if (prepared.kind !== 'single' || !selectedOptionId) return null;
    return prepared.shuffledOptions.find((opt) => opt.id === selectedOptionId) || null;
  }, [prepared, selectedOptionId]);

  const canonicalSequence = useMemo(() => {
    if (prepared.kind !== 'sequence') return [];
    return [...prepared.question.steps].sort((a, b) => a.order - b.order);
  }, [prepared]);

  return (
    <div className="space-y-4">
      {/* Top Question Type & Topic Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-bold ${badgeInfo.colorClass}`}
          >
            {question.type === 'concept_matching' && <Link2 className="w-3.5 h-3.5" />}
            {question.type === 'process_sequence' && <ListChecks className="w-3.5 h-3.5" />}
            {question.type === 'cause_effect' && <GitBranch className="w-3.5 h-3.5" />}
            {question.type === 'statement_analysis' && <Scale className="w-3.5 h-3.5" />}
            {(question.type === 'multiple_choice' ||
              question.type === 'true_false' ||
              question.type === 'case_study') && <Sparkles className="w-3.5 h-3.5" />}
            {badgeInfo.label}
          </span>
          {question.subtopic && (
            <span className="px-2 py-0.5 rounded-md bg-slate-800/90 border border-slate-700 text-[10px] font-semibold text-amber-200">
              {question.subtopic}
            </span>
          )}
        </div>
        <span className="text-[11px] text-slate-400 font-semibold">{question.topic}</span>
      </div>

      {/* Prompt & Context */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2.5">
        <p className="text-sm md:text-base text-white leading-relaxed font-medium">{question.prompt}</p>

        {question.type !== 'concept_matching' &&
          question.type !== 'process_sequence' &&
          question.contextText && (
            <div className="bg-slate-950/85 border-l-2 border-sky-400 rounded-r-lg px-3.5 py-2.5 text-xs md:text-sm text-sky-100 leading-relaxed">
              {question.contextText}
            </div>
          )}

        {question.type === 'statement_analysis' && question.statements && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-1.5">
            {question.statements.map((st, sIdx) => (
              <p key={sIdx} className="text-xs md:text-sm text-slate-200 leading-relaxed">
                {st}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Area by Type */}
      {prepared.kind === 'single' && (
        <div className="space-y-2.5">
          {prepared.shuffledOptions.map((opt, oIdx) => {
            const letter = ['A', 'B', 'C', 'D'][oIdx] || String(oIdx + 1);
            const isChosen = selectedOptionId === opt.id;
            const isAnswer = opt.id === prepared.question.correctOptionId;

            let styleClass =
              'bg-slate-900/75 border-slate-800 text-slate-200 hover:border-sky-400/60 cursor-pointer';
            if (answered) {
              if (isAnswer) {
                styleClass = 'bg-emerald-500/20 border-emerald-400 text-white';
              } else if (isChosen) {
                styleClass = 'bg-rose-500/20 border-rose-400 text-rose-100';
              } else {
                styleClass = 'bg-slate-950/60 border-slate-800/60 text-slate-500';
              }
            }

            return (
              <button
                key={opt.id}
                disabled={answered}
                onClick={() => handleSelectSingle(opt.id)}
                className={`w-full p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${styleClass}`}
              >
                <span className="w-6 h-6 rounded-lg bg-slate-800 text-xs font-mono-num font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {letter}
                </span>
                <span className="text-xs md:text-sm leading-relaxed">{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {prepared.kind === 'matching' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-400">
            Klik satu konsep di kolom kiri, lalu klik pasangan definisi/contoh yang sesuai di kolom kanan.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              {prepared.shuffledTerms.map((t, i) => {
                const chosenRightId = matchMap[t.id];
                const isActive = activeLeftId === t.id;
                const correctPair = answered && chosenRightId === t.id;
                const wrongPair = answered && chosenRightId !== t.id;
                return (
                  <button
                    key={t.id}
                    disabled={answered}
                    onClick={() => {
                      soundEngine.playClick();
                      setActiveLeftId(isActive ? null : t.id);
                    }}
                    className={`w-full p-3 rounded-xl border text-left text-xs md:text-sm transition-all cursor-pointer ${
                      answered
                        ? correctPair
                          ? 'bg-emerald-500/20 border-emerald-400 text-white'
                          : wrongPair
                            ? 'bg-rose-500/20 border-rose-400 text-rose-100'
                            : 'bg-slate-900 border-slate-800'
                        : isActive
                          ? 'bg-sky-500/20 border-sky-400 text-white'
                          : chosenRightId
                            ? 'bg-slate-900 border-emerald-500/50 text-slate-100'
                            : 'bg-slate-900/80 border-slate-800 text-slate-200 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold">
                        {i + 1}. {t.term}
                      </span>
                      {chosenRightId && (
                        <span className="text-[11px] font-mono-num px-1.5 py-0.5 rounded bg-slate-800 text-sky-300 shrink-0">
                          Terpasang
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              {prepared.shuffledMatches.map((m) => {
                const pairedTerm = prepared.shuffledTerms.find((t) => matchMap[t.id] === m.id);
                const pairedIdx = pairedTerm
                  ? prepared.shuffledTerms.findIndex((t) => t.id === pairedTerm.id) + 1
                  : null;
                return (
                  <button
                    key={m.id}
                    disabled={answered || !activeLeftId}
                    onClick={() => handleSelectMatchRight(m.id)}
                    className={`w-full p-3 rounded-xl border text-left text-xs md:text-sm transition-all ${
                      answered
                        ? 'bg-slate-900/70 border-slate-800 text-slate-300'
                        : activeLeftId
                          ? 'bg-slate-900 border-sky-400/60 hover:bg-sky-500/15 text-white cursor-pointer'
                          : pairedIdx
                            ? 'bg-slate-900 border-emerald-500/50 text-slate-200'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="leading-relaxed">{m.match}</span>
                      {pairedIdx !== null && (
                        <span className="w-6 h-6 rounded-md bg-sky-500 text-slate-950 font-mono-num font-bold text-xs flex items-center justify-center shrink-0">
                          {pairedIdx}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {!answered && (
            <div className="flex justify-end">
              <button
                disabled={Object.keys(matchMap).length < prepared.question.pairs.length}
                onClick={handleSubmitMatching}
                className={`px-5 py-2.5 rounded-xl font-display font-bold text-xs md:text-sm transition-colors ${
                  Object.keys(matchMap).length < prepared.question.pairs.length
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-sky-500 hover:bg-sky-400 text-slate-950 cursor-pointer'
                }`}
              >
                PERIKSA PASANGAN ({Object.keys(matchMap).length}/{prepared.question.pairs.length})
              </button>
            </div>
          )}
        </div>
      )}

      {prepared.kind === 'sequence' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-400">
            Gunakan tombol panah atas/bawah untuk menyusun urutan tahapan dari nomor 1 (paling awal) hingga selesai.
          </p>
          <div className="space-y-2">
            {orderedSteps.map((step, idx) => {
              const isPosCorrect = answered && step.order === idx + 1;
              return (
                <div
                  key={step.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                    answered
                      ? isPosCorrect
                        ? 'bg-emerald-500/20 border-emerald-400 text-white'
                        : 'bg-rose-500/15 border-rose-400 text-rose-100'
                      : 'bg-slate-900/85 border-slate-800 text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-xs font-mono-num font-bold flex items-center justify-center shrink-0 text-sky-300">
                      {idx + 1}
                    </span>
                    <span className="text-xs md:text-sm">{step.label}</span>
                  </div>

                  {!answered ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        disabled={idx === 0}
                        onClick={() => moveStep(idx, -1)}
                        className={`p-1.5 rounded-lg border ${
                          idx === 0
                            ? 'bg-slate-950 border-slate-800 text-slate-600 cursor-not-allowed'
                            : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white cursor-pointer'
                        }`}
                        aria-label="Naikkan urutan"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        disabled={idx === orderedSteps.length - 1}
                        onClick={() => moveStep(idx, 1)}
                        className={`p-1.5 rounded-lg border ${
                          idx === orderedSteps.length - 1
                            ? 'bg-slate-950 border-slate-800 text-slate-600 cursor-not-allowed'
                            : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white cursor-pointer'
                        }`}
                        aria-label="Turunkan urutan"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] font-mono-num text-slate-300 shrink-0">
                      Urutan benar: #{step.order}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {!answered && (
            <div className="flex justify-end">
              <button
                onClick={handleSubmitSequence}
                className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-display font-bold text-xs md:text-sm cursor-pointer"
              >
                KONFIRMASI URUTAN
              </button>
            </div>
          )}
        </div>
      )}

      {/* Feedback & Pembahasan Sosiologi (#52) */}
      {answered && (
        <div
          className={`rounded-xl p-4 border space-y-3 ${
            isCorrect
              ? 'bg-emerald-500/15 border-emerald-400/55'
              : 'bg-rose-500/15 border-rose-400/55'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-emerald-300">Status: BENAR — Jawaban Tepat!</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="text-rose-300">Status: SALAH — Perhatikan Pembahasan</span>
                </>
              )}
            </div>
            {question.conceptTag && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-sky-300">
                Konsep: {question.conceptTag}
              </span>
            )}
          </div>

          {/* Jawaban Benar */}
          {prepared.kind === 'single' && correctSingleInfo && (
            <div className="bg-slate-950/75 border border-emerald-500/35 rounded-lg px-3 py-2 text-xs md:text-sm">
              <span className="font-bold text-emerald-300">Jawaban yang Benar: </span>
              <span className="text-slate-100 font-medium">
                {correctSingleInfo.letter}. {correctSingleInfo.opt.label}
              </span>
            </div>
          )}

          {prepared.kind === 'matching' && !isCorrect && (
            <div className="bg-slate-950/75 border border-emerald-500/35 rounded-lg px-3 py-2 text-xs space-y-1">
              <p className="font-bold text-emerald-300">Pasangan Konsep yang Benar:</p>
              {prepared.question.pairs.map((p) => (
                <p key={p.id} className="text-slate-200 leading-relaxed">
                  • <span className="font-semibold text-white">{p.term}</span> → {p.match}
                </p>
              ))}
            </div>
          )}

          {prepared.kind === 'sequence' && !isCorrect && canonicalSequence.length > 0 && (
            <div className="bg-slate-950/75 border border-emerald-500/35 rounded-lg px-3 py-2 text-xs space-y-1">
              <p className="font-bold text-emerald-300">Urutan Tahapan yang Benar:</p>
              {canonicalSequence.map((step, i) => (
                <p key={step.id} className="text-slate-200 leading-relaxed">
                  {i + 1}. {step.label}
                </p>
              ))}
            </div>
          )}

          {/* Letak Kekeliruan (jika salah) */}
          {!isCorrect && (
            <div className="bg-rose-950/45 border border-rose-500/35 rounded-lg px-3 py-2 text-xs md:text-sm text-rose-100 leading-relaxed">
              <span className="font-bold text-rose-300 block mb-0.5">Letak Kekeliruan Konsep:</span>
              {question.wrongExplanation
                ? question.wrongExplanation
                : prepared.kind === 'single' && chosenSingleOption
                  ? `Pilihan yang kamu pilih belum tepat untuk membaca konteks "${question.topic}" karena mengarah pada kategori/ciri sosial yang berbeda.`
                  : prepared.kind === 'matching'
                    ? `Masih ada pasangan konsep pada "${question.topic}" yang tertukar definisi atau contoh penerapannya.`
                    : `Susunan tahapan pada "${question.topic}" belum urut dari fase awal hingga fase lanjutannya.`}
            </div>
          )}

          {/* Pembahasan Sosiologi (selalu tampil baik benar maupun salah) */}
          <div className="text-xs md:text-sm text-slate-200 leading-relaxed">
            <span className="font-bold text-sky-300 block mb-0.5">
              {isCorrect ? 'Penguatan Pemahaman Sosiologi:' : 'Pembahasan Sosiologi:'}
            </span>
            {question.explanation}
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={() => {
                soundEngine.playClick();
                onNext();
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-bold text-xs md:text-sm cursor-pointer whitespace-nowrap"
            >
              {nextButtonLabel}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
