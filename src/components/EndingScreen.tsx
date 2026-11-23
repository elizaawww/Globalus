import React, { useEffect, useState } from 'react';
import {
  Award,
  BarChart3,
  CheckCircle2,
  Clock,
  Home,
  Medal,
  Package,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Trophy,
  UserCheck,
} from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import {
  getBadgeFromScore,
  INVENTORY_ITEMS,
  MISSION_META,
  SOLO_BADGE_CRITERIA,
  SOLO_BADGE_TIER_META,
} from '../data/gameData';
import { MissionId, SaveState, SoloBadgeTier } from '../types/game';
import { SpaceBackdrop3D } from './SpaceBackdrop3D';

interface EndingScreenProps {
  saveState: SaveState;
  onOpenInventory: () => void;
  onOpenCustomize: () => void;
  onOpenRanking?: () => void;
  onReplayChapters?: () => void;
  onPlayAgain: () => void;
  onBackHome: () => void;
}

function formatDurationText(ms: number | null | undefined): string {
  if (!ms || !Number.isFinite(ms) || ms <= 0) return '--:--';
  const totalSec = Math.floor(ms / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}m ${String(secs).padStart(2, '0')}d`;
}

export const EndingScreen: React.FC<EndingScreenProps> = ({
  saveState,
  onOpenInventory,
  onOpenCustomize,
  onOpenRanking,
  onReplayChapters,
  onPlayAgain,
  onBackHome,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    soundEngine.playVictory();
  }, []);

  const badge = getBadgeFromScore(saveState.quizScore);
  const unlockedSet = new Set(saveState.unlockedItems);
  const rewardCollected = INVENTORY_ITEMS.filter(
    (i) => !i.isDefault && unlockedSet.has(i.id)
  ).length;

  const isSoloFullyCompleted =
    saveState.completedChapters.length >= 5 &&
    saveState.completedMissions.length >= 10 &&
    Boolean(saveState.quizCompleted);

  const soloRecord = isSoloFullyCompleted ? saveState.lastSoloBadgeRecord || null : null;
  const soloTierMeta = soloRecord ? SOLO_BADGE_TIER_META[soloRecord.tier] : null;
  const badgeHistory = saveState.soloBadgeHistory || [];

  const tierCounts: Record<SoloBadgeTier, number> = {
    gold: badgeHistory.filter((b) => b.tier === 'gold').length,
    silver: badgeHistory.filter((b) => b.tier === 'silver').length,
    bronze: badgeHistory.filter((b) => b.tier === 'bronze').length,
  };
  const bestTierMeta = saveState.bestSoloBadge
    ? SOLO_BADGE_TIER_META[saveState.bestSoloBadge]
    : null;

  return (
    <div className="relative w-full h-full overflow-hidden">
      <SpaceBackdrop3D />
      <div className="fixed inset-0 z-[1] bg-slate-950/75 pointer-events-none" />

      <div className="relative z-10 w-full h-full flex items-center justify-center p-4 md:p-8 overflow-y-auto sci-scroll">
        <div className="w-full max-w-4xl bg-[#080f24]/95 border border-amber-400/40 rounded-2xl p-5 md:p-7 shadow-2xl space-y-5 my-auto">
          {/* Top Sociological Rank & Solo Achievement Badge */}
          <div className="text-center space-y-2.5 border-b border-slate-800 pb-5">
            <div
              className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center border-2 animate-float-slow"
              style={{
                backgroundColor: `${(soloTierMeta ? soloTierMeta.colorHex : badge.colorHex)}22`,
                borderColor: soloTierMeta ? soloTierMeta.colorHex : badge.colorHex,
              }}
            >
              {soloRecord ? (
                <Medal className="w-9 h-9" style={{ color: soloTierMeta?.colorHex }} />
              ) : (
                <Award className="w-9 h-9" style={{ color: badge.colorHex }} />
              )}
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-300">
              MISI GLOBALUS SELESAI · {saveState.character.name}
            </p>
            <h1
              className="font-display text-2xl md:text-3xl font-extrabold"
              style={{ color: badge.colorHex }}
            >
              {badge.rank}
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-xl mx-auto">{badge.summary}</p>

            {/* Solo Achievement Badge Showcase (#53) */}
            {soloRecord && soloTierMeta ? (
              <div
                className={`mt-3 mx-auto max-w-2xl rounded-2xl border-2 p-4 text-left space-y-3 ${soloTierMeta.borderClass} ${soloTierMeta.bgClass}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0"
                      style={{
                        backgroundColor: `${soloTierMeta.colorHex}26`,
                        borderColor: soloTierMeta.colorHex,
                      }}
                    >
                      <Trophy className="w-5 h-5" style={{ color: soloTierMeta.colorHex }} />
                    </div>
                    <div>
                      <p
                        className="font-display text-xs md:text-sm font-extrabold tracking-wide"
                        style={{ color: soloTierMeta.colorHex }}
                      >
                        {soloTierMeta.title}
                      </p>
                      <p className="text-[11px] text-slate-200 leading-snug">
                        {soloTierMeta.summary}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">
                      Skor Gabungan
                    </p>
                    <p
                      className="font-mono-num text-xl font-extrabold"
                      style={{ color: soloTierMeta.colorHex }}
                    >
                      {soloRecord.compositeScore} / 100
                    </p>
                  </div>
                </div>

                {/* 4-Factor Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="bg-slate-950/75 border border-slate-800 rounded-lg px-2.5 py-2">
                    <p className="text-slate-400">Akurasi Final Quiz (50%)</p>
                    <p className="font-mono-num font-bold text-white mt-0.5">
                      {soloRecord.quizCorrectCount}/{soloRecord.quizTotalCount} ·{' '}
                      {soloRecord.breakdown.quizAccuracyPct}%
                    </p>
                  </div>
                  <div className="bg-slate-950/75 border border-slate-800 rounded-lg px-2.5 py-2">
                    <p className="text-slate-400">Misi &amp; Buku Teori (25%)</p>
                    <p className="font-mono-num font-bold text-emerald-300 mt-0.5">
                      {soloRecord.breakdown.missionMasteryPct}% ({soloRecord.breakdown.booksReadCount}/
                      {soloRecord.breakdown.booksTotalCount} buku)
                    </p>
                  </div>
                  <div className="bg-slate-950/75 border border-slate-800 rounded-lg px-2.5 py-2">
                    <p className="text-slate-400">Konsistensi Awal (15%)</p>
                    <p className="font-mono-num font-bold text-sky-300 mt-0.5">
                      {soloRecord.breakdown.consistencyPct}%
                    </p>
                  </div>
                  <div className="bg-slate-950/75 border border-slate-800 rounded-lg px-2.5 py-2">
                    <p className="text-slate-400">Durasi Terukur (10%)</p>
                    <p className="font-mono-num font-bold text-amber-300 mt-0.5">
                      {formatDurationText(soloRecord.durationMs)} · {soloRecord.breakdown.durationScorePct}%
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300 pt-1 border-t border-slate-800/80">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Kriteria Badge: Gold (≥{SOLO_BADGE_CRITERIA.thresholds.gold.minComposite} &amp; Akurasi ≥
                    {SOLO_BADGE_CRITERIA.thresholds.gold.minQuizAccuracy}%), Silver (≥
                    {SOLO_BADGE_CRITERIA.thresholds.silver.minComposite} &amp; Akurasi ≥
                    {SOLO_BADGE_CRITERIA.thresholds.silver.minQuizAccuracy}%), Bronze (Selesai Penuh).
                    Durasi ≤45 menit bernilai penuh agar membaca cermat tetap adil.
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-2 mx-auto max-w-xl rounded-xl bg-slate-900/85 border border-slate-700 px-3.5 py-2.5 text-xs text-slate-300">
                Badge Pencapaian Mode Solo (Gold / Silver / Bronze) diberikan setelah menyelesaikan seluruh 5 Chapter, 10 Misi, dan Final Quiz secara penuh.
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {saveState.bestCompletionMs ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-xs font-semibold text-amber-200">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Waktu Terbaik:{' '}
                  <span className="font-mono-num font-bold text-amber-300">
                    {formatDurationText(saveState.bestCompletionMs)}
                  </span>
                </div>
              ) : null}
              {bestTierMeta && badgeHistory.length > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700 text-xs text-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Badge Terbaik:{' '}
                  <strong style={{ color: bestTierMeta.colorHex }}>{bestTierMeta.shortLabel}</strong>
                  <span className="text-slate-400">·</span>
                  <span className="font-mono-num text-[11px] text-slate-300">
                    G:{tierCounts.gold} · S:{tierCounts.silver} · B:{tierCounts.bronze}
                  </span>
                </div>
              )}
            </div>

            <blockquote className="mt-2 px-4 py-2.5 rounded-xl bg-slate-900/90 border border-sky-500/30 text-xs md:text-sm font-display font-semibold text-sky-200 tracking-wide">
              "GLOBALIZATION IS NOT JUST ABOUT A CONNECTED WORLD, BUT HOW WE CHOOSE TO LIVE IN IT."
            </blockquote>
          </div>

          {/* Summary Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-center">
              <p className="text-[11px] text-slate-400">Misi Selesai</p>
              <p className="font-mono-num text-lg font-bold text-white">
                {saveState.completedMissions.length} / 10
              </p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-center">
              <p className="text-[11px] text-slate-400">Chapter Selesai</p>
              <p className="font-mono-num text-lg font-bold text-emerald-400">
                {saveState.completedChapters.length} / 5
              </p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-center">
              <p className="text-[11px] text-slate-400">Akurasi Final Quiz</p>
              <p className="font-mono-num text-lg font-bold text-amber-300">
                {saveState.quizScore} / 100
              </p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-center">
              <p className="text-[11px] text-slate-400">Total EXP</p>
              <p className="font-mono-num text-lg font-bold text-sky-400">
                {saveState.totalExp}
              </p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-center col-span-2 sm:col-span-1">
              <p className="text-[11px] text-slate-400">Item Hadiah</p>
              <p className="font-mono-num text-lg font-bold text-purple-300">
                {rewardCollected}
              </p>
            </div>
          </div>

          {/* Detailed Results Toggle */}
          {showDetails && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-4 max-h-60 overflow-y-auto sci-scroll">
              <div>
                <p className="text-xs font-bold text-sky-300 mb-2">Rincian Skor Setiap Misi</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(Object.keys(MISSION_META) as MissionId[]).map((mId) => {
                    const meta = MISSION_META[mId];
                    const sc = saveState.missionScores[mId];
                    const firstSc = saveState.missionFirstScores?.[mId];
                    return (
                      <div
                        key={mId}
                        className="flex items-center justify-between bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-xs gap-2"
                      >
                        <span className="truncate text-slate-200">{meta.title}</span>
                        <span className="font-mono-num font-bold text-emerald-400 shrink-0">
                          {sc ?? 0}
                          {typeof firstSc === 'number' && firstSc < (sc ?? 0) ? (
                            <span className="text-[10px] text-slate-400 font-normal ml-1">
                              (awal {firstSc})
                            </span>
                          ) : null}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {badgeHistory.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-amber-300 mb-2">
                    Riwayat Badge Pencapaian Solo ({badgeHistory.length} Sesi Selesai)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[...badgeHistory]
                      .reverse()
                      .slice(0, 6)
                      .map((rec) => {
                        const meta = SOLO_BADGE_TIER_META[rec.tier];
                        return (
                          <div
                            key={rec.runId}
                            className="flex items-center justify-between bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-xs"
                          >
                            <div className="min-w-0 pr-2">
                              <span className="font-bold" style={{ color: meta.colorHex }}>
                                {meta.shortLabel}
                              </span>{' '}
                              <span className="text-slate-300 font-mono-num">
                                · Skor {rec.compositeScore}/100 · Quiz {rec.quizCorrectCount}/
                                {rec.quizTotalCount}
                              </span>
                            </div>
                            <span className="text-[11px] font-mono-num text-slate-400 shrink-0">
                              {formatDurationText(rec.durationMs)}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Menu */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5 pt-1">
            <button
              onClick={() => {
                soundEngine.playClick();
                setShowDetails((v) => !v);
              }}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold cursor-pointer"
            >
              <BarChart3 className="w-4 h-4 text-sky-400 shrink-0" />
              VIEW RESULTS
            </button>
            <button
              onClick={() => {
                soundEngine.playClick();
                onOpenInventory();
              }}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold cursor-pointer"
            >
              <Package className="w-4 h-4 text-emerald-400 shrink-0" />
              VIEW INVENTORY
            </button>
            <button
              onClick={() => {
                soundEngine.playClick();
                onOpenCustomize();
              }}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-purple-400 shrink-0" />
              CUSTOMIZATION
            </button>
            {onOpenRanking && (
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onOpenRanking();
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 text-xs font-display font-bold cursor-pointer"
              >
                <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                RANKING
              </button>
            )}
            {onReplayChapters && (
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onReplayChapters();
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 border border-violet-400/50 text-violet-200 text-xs font-display font-bold cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-violet-300 shrink-0" />
                ULANGI CHAPTER
              </button>
            )}
            <button
              onClick={() => {
                soundEngine.playClick();
                onPlayAgain();
              }}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-display font-bold cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 shrink-0" />
              PLAY AGAIN
            </button>
            <button
              onClick={() => {
                soundEngine.playClick();
                onBackHome();
              }}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-display font-bold cursor-pointer col-span-2 sm:col-span-1"
            >
              <Home className="w-4 h-4 shrink-0" />
              BACK TO HOME
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
