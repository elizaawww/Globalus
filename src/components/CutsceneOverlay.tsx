import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, FastForward, Gift, Sparkles } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { CUTSCENES } from '../data/gameData';
import {
  BodyAccessoryId,
  ChapterId,
  CharacterConfig,
  CostumeStyleId,
  CutsceneCharacterId,
  CutsceneLine,
  HeadAccessoryId,
  InventoryItemDef,
  NeckAccessoryId,
} from '../types/game';
import { CharacterPreview3D } from './CharacterPreview3D';

interface CutsceneOverlayProps {
  cutsceneId: CutsceneCharacterId;
  initialLineIndex?: number;
  prependedLines?: CutsceneLine[];
  onLineChange?: (line: CutsceneLine, index: number) => void;
  onFinish: () => void;
}

export const CutsceneOverlay: React.FC<CutsceneOverlayProps> = ({
  cutsceneId,
  initialLineIndex = 0,
  prependedLines,
  onLineChange,
  onFinish,
}) => {
  const script = CUTSCENES[cutsceneId];
  const lines = useMemo(
    () => (prependedLines && prependedLines.length > 0 ? [...prependedLines, ...script.lines] : script.lines),
    [prependedLines, script.lines]
  );
  const clampedInitial = Math.max(0, Math.min(lines.length - 1, initialLineIndex));
  const [lineIdx, setLineIdx] = useState(clampedInitial);
  const [displayedChars, setDisplayedChars] = useState(0);

  const currentLine = lines[lineIdx] || lines[0];
  const isTypingDone = displayedChars >= currentLine.text.length;
  const isProlog = cutsceneId === 'prolog';

  useEffect(() => {
    soundEngine.playCharacterAppear();
    soundEngine.setMusicMode('cutscene');
    const safeStart = Math.max(0, Math.min(lines.length - 1, initialLineIndex));
    setLineIdx(safeStart);
    setDisplayedChars(0);
    return () => {
      soundEngine.setMusicMode('gameplay');
    };
  }, [cutsceneId, initialLineIndex, lines.length]);

  useEffect(() => {
    onLineChange?.(currentLine, lineIdx);
  }, [currentLine, lineIdx, onLineChange]);

  useEffect(() => {
    setDisplayedChars(0);
    const fullLen = currentLine.text.length;
    let count = 0;
    const timer = window.setInterval(() => {
      count += 2;
      setDisplayedChars(Math.min(fullLen, count));
      if (count % 6 === 0 && count < fullLen) {
        const pitch =
          currentLine.speakerId === 'fuzzy'
            ? 120
            : currentLine.speakerId === 'rex'
              ? 90
              : currentLine.speakerId === 'player'
                ? 40
                : currentLine.speakerId === 'bima'
                  ? 0
                  : currentLine.speakerId === 'bob'
                    ? -35
                    : -60;
        soundEngine.playDialogueBlip(pitch);
      }
      if (count >= fullLen) {
        window.clearInterval(timer);
      }
    }, 22);
    return () => window.clearInterval(timer);
  }, [lineIdx, currentLine]);

  const handleNext = () => {
    soundEngine.playClick();
    if (!isTypingDone) {
      setDisplayedChars(currentLine.text.length);
      return;
    }
    if (lineIdx < lines.length - 1) {
      setLineIdx((i) => i + 1);
    } else {
      onFinish();
    }
  };

  const handleSkip = () => {
    soundEngine.playClick();
    onFinish();
  };

  return (
    <div className="fixed inset-0 z-40 pointer-events-none flex flex-col justify-between p-2 sm:p-4 md:p-6">
      {/* Compact top cinematic header bar so characters & faces stay unobstructed */}
      <div className="pointer-events-auto flex items-center justify-between gap-2 sm:gap-3 bg-[#060b1c]/88 backdrop-blur-sm border border-slate-700/80 rounded-xl px-3 py-1.5 sm:px-4 sm:py-2.5 max-w-4xl w-full mx-auto">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest truncate" style={{ color: script.themeColorHex }}>
            {isProlog ? 'Prolog Petualangan 3D' : 'Cutscene Interaktif'}
          </p>
          <h3 className="font-display text-xs sm:text-sm md:text-base font-bold text-white truncate">{script.title}</h3>
        </div>
        <button
          onClick={handleSkip}
          className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] sm:text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
        >
          <FastForward className="w-3.5 h-3.5" />
          {isProlog ? 'SKIP INTRO' : 'SKIP CUTSCENE'}
        </button>
      </div>

      {/* Bottom Visual Novel Dialogue Box — docked cleanly at bottom, responsive on mobile landscape */}
      <div
        className="pointer-events-auto max-w-4xl w-full mx-auto bg-[#050a1a]/92 backdrop-blur-md border-2 rounded-xl sm:rounded-2xl px-3.5 py-2.5 sm:p-5 md:p-6 shadow-2xl max-h-[42dvh] overflow-y-auto sci-scroll"
        style={{ borderColor: `${currentLine.colorHex}aa` }}
      >
        <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
          {currentLine.speakerId !== 'narrator' && currentLine.speaker !== 'NARATOR' ? (
            <div className="flex items-center gap-2">
              <span
                className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-lg font-display font-bold text-[11px] sm:text-xs md:text-sm text-slate-950 whitespace-nowrap"
                style={{ backgroundColor: currentLine.colorHex }}
              >
                {currentLine.speaker}
              </span>
              <span className="text-[11px] sm:text-xs font-medium text-slate-300 truncate max-w-[180px] sm:max-w-none">
                {currentLine.roleTitle}
              </span>
            </div>
          ) : (
            <div />
          )}
          <span className="text-[11px] font-mono-num text-slate-400">
            {lineIdx + 1} / {lines.length}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-4">
          <p className="text-xs sm:text-sm md:text-base text-slate-100 leading-snug sm:leading-relaxed min-h-[34px] sm:min-h-[52px] flex-1">
            {currentLine.text.slice(0, displayedChars)}
          </p>

          <button
            onClick={handleNext}
            className="self-end sm:self-auto flex items-center gap-1.5 px-4 py-1.5 sm:px-5 sm:py-2.5 rounded-xl font-display font-bold text-[11px] sm:text-xs md:text-sm text-slate-950 cursor-pointer transition-transform active:scale-95 whitespace-nowrap shrink-0"
            style={{ backgroundColor: currentLine.colorHex }}
          >
            {!isTypingDone
              ? 'SEMUA'
              : lineIdx < lines.length - 1
                ? 'NEXT'
                : isProlog
                  ? 'MULAI MISI'
                  : 'SELESAI'}
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

interface RewardModalProps {
  chapter: ChapterId;
  character: CharacterConfig;
  rewardItem: InventoryItemDef;
  specialItem?: InventoryItemDef;
  titleLabel?: string;
  subtitleLabel?: string;
  continueLabel?: string;
  onEquipAndContinue: () => void;
  onContinue: () => void;
}

export const RewardModal: React.FC<RewardModalProps> = ({
  chapter,
  character,
  rewardItem,
  specialItem,
  titleLabel,
  subtitleLabel,
  continueLabel,
  onEquipAndContinue,
  onContinue,
}) => {
  const [wearReward, setWearReward] = useState(true);

  useEffect(() => {
    soundEngine.playRewardFanfare();
    setWearReward(true);
  }, [rewardItem.id]);

  const hasEquippableReward = Boolean(rewardItem.equipId || rewardItem.costumeId);

  // Build explicit with-item vs without-item character comparison (#15 & Batik SMADA costumes)
  const previewConfig = useMemo<CharacterConfig>(() => {
    if (!hasEquippableReward) return character;
    if (!wearReward) {
      if (rewardItem.category === 'costume' && rewardItem.costumeId) {
        return {
          ...character,
          costume: character.costume === rewardItem.costumeId ? 'standard_crew' : character.costume,
        };
      }
      if (rewardItem.category === 'head') {
        return { ...character, head: character.head === rewardItem.equipId ? 'none' : character.head };
      }
      if (rewardItem.category === 'body') {
        return { ...character, body: character.body === rewardItem.equipId ? 'none' : character.body };
      }
      if (rewardItem.category === 'neck') {
        return { ...character, neck: character.neck === rewardItem.equipId ? 'none' : character.neck };
      }
      return character;
    }
    if (rewardItem.category === 'costume' && rewardItem.costumeId) {
      return { ...character, costume: rewardItem.costumeId as CostumeStyleId };
    }
    if (rewardItem.category === 'head' && rewardItem.equipId) {
      return { ...character, head: rewardItem.equipId as HeadAccessoryId };
    }
    if (rewardItem.category === 'body' && rewardItem.equipId) {
      return { ...character, body: rewardItem.equipId as BodyAccessoryId };
    }
    if (rewardItem.category === 'neck' && rewardItem.equipId) {
      return { ...character, neck: rewardItem.equipId as NeckAccessoryId };
    }
    return character;
  }, [character, hasEquippableReward, rewardItem, wearReward]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-xl bg-[#080f24] border border-amber-400/50 rounded-2xl p-4 sm:p-6 text-center shadow-2xl space-y-3.5 max-h-[94dvh] overflow-y-auto sci-scroll">
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-400/50 flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-left">
            <p className="text-[11px] font-bold uppercase tracking-widest text-amber-300">
              {subtitleLabel || `Chapter ${chapter} Selesai!`}
            </p>
            <h2 className="font-display text-lg md:text-2xl font-extrabold text-white leading-tight">
              {titleLabel || 'HADIAH BARU TERBUKA'}
            </h2>
          </div>
        </div>

        {/* Clean 3D Comparison Stage with simple "Pakai" / "Lepas" buttons */}
        {hasEquippableReward && (
          <div className="relative h-48 sm:h-52 w-full rounded-xl overflow-hidden border border-amber-400/35 bg-[#050a18]">
            <CharacterPreview3D config={previewConfig} />
            <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md bg-slate-950/85 border border-amber-400/40 text-xs font-bold text-amber-200 pointer-events-none">
              {wearReward ? rewardItem.name : 'Tanpa Hadiah'}
            </div>
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-slate-950/90 border border-slate-700 rounded-lg p-1">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setWearReward(true);
                }}
                className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer transition-colors ${
                  wearReward
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                Pakai
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setWearReward(false);
                }}
                className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer transition-colors ${
                  !wearReward
                    ? 'bg-sky-400 text-slate-950'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                Lepas
              </button>
            </div>
          </div>
        )}

        <div className="bg-slate-900/90 border border-slate-700 rounded-xl p-3.5 text-left space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-display font-bold text-sm md:text-base text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              {rewardItem.name}
            </span>
            <span className="text-[11px] text-sky-300 font-semibold uppercase">{rewardItem.category}</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{rewardItem.description}</p>
        </div>

        {specialItem && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-left flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-300">Artefak Khusus: {specialItem.name}</p>
              <p className="text-[11px] text-slate-400">{specialItem.description}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          {hasEquippableReward && (
            <button
              onClick={() => {
                soundEngine.playClick();
                if (wearReward) {
                  onEquipAndContinue();
                } else {
                  onContinue();
                }
              }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-bold text-xs md:text-sm cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {wearReward ? 'PAKAI & LANJUTKAN' : 'LEPAS & LANJUTKAN'}
            </button>
          )}
          <button
            onClick={() => {
              soundEngine.playClick();
              onContinue();
            }}
            className="flex-1 py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-display font-bold text-xs md:text-sm cursor-pointer whitespace-nowrap"
          >
            {continueLabel || (chapter < 5 ? `BUKA CHAPTER ${chapter + 1}` : 'BUKA FINAL QUIZ')}
          </button>
        </div>
      </div>
    </div>
  );
};
