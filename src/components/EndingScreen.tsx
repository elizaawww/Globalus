import React, { useEffect, useState } from 'react';
import { Award, Clock, Home, Package, RefreshCw, RotateCcw, Trophy, UserCheck, BarChart3 } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { getBadgeFromScore, INVENTORY_ITEMS, MISSION_META } from '../data/gameData';
import { MissionId, SaveState } from '../types/game';
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

function formatBestTime(ms: number | null | undefined): string {
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

  return (
    <div className="relative w-full h-full overflow-hidden">
      <SpaceBackdrop3D />
      <div className="fixed inset-0 z-[1] bg-slate-950/75 pointer-events-none" />

      <div className="relative z-10 w-full h-full flex items-center justify-center p-4 md:p-8 overflow-y-auto sci-scroll">
        <div className="w-full max-w-4xl bg-[#080f24]/95 border border-amber-400/40 rounded-2xl p-5 md:p-7 shadow-2xl space-y-5">
          {/* Top Badge & Quote */}
          <div className="text-center space-y-2 border-b border-slate-800 pb-5">
            <div
              className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center border-2 animate-float-slow"
              style={{
                backgroundColor: `${badge.colorHex}22`,
                borderColor: badge.colorHex,
              }}
            >
              <Award className="w-9 h-9" style={{ color: badge.colorHex }} />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-300">
              MISI GLOBALUS SELESAI · {saveState.character.name}
            </p>
            <h1 className="font-display text-2xl md:text-3xl font-extrabold" style={{ color: badge.colorHex }}>
              {badge.rank}
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-xl mx-auto">{badge.summary}</p>
            {saveState.bestCompletionMs ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-xs font-semibold text-amber-200">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Catatan Waktu Tamat Terbaik:{' '}
                <span className="font-mono-num font-bold text-amber-300">
                  {formatBestTime(saveState.bestCompletionMs)}
                </span>
              </div>
            ) : null}
            <blockquote className="mt-3 px-4 py-2.5 rounded-xl bg-slate-900/90 border border-sky-500/30 text-xs md:text-sm font-display font-semibold text-sky-200 tracking-wide">
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
              <p className="text-[11px] text-slate-400">Skor Final Quiz</p>
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
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2 max-h-44 overflow-y-auto sci-scroll">
              <p className="text-xs font-bold text-sky-300 mb-2">Rincian Skor Setiap Misi</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(Object.keys(MISSION_META) as MissionId[]).map((mId) => {
                  const meta = MISSION_META[mId];
                  const sc = saveState.missionScores[mId];
                  return (
                    <div
                      key={mId}
                      className="flex items-center justify-between bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-xs"
                    >
                      <span className="truncate text-slate-200 pr-2">{meta.title}</span>
                      <span className="font-mono-num font-bold text-emerald-400 shrink-0">
                        {sc ?? 0}
                      </span>
                    </div>
                  );
                })}
              </div>
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
