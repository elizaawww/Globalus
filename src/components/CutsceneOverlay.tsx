import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Eye, FastForward, Gift, Sparkles } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { CUTSCENES } from '../data/gameData';
import {
  BodyAccessoryId,
  ChapterId,
  CharacterConfig,
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
  onLineChange?: (line: CutsceneLine, index: number) => void;
  onFinish: () => void;
}

export const CutsceneOverlay: React.FC<CutsceneOverlayProps> = ({
  cutsceneId,
  initialLineIndex = 0,
  onLineChange,
  onFinish,
}) => {
  const script = CUTSCENES[cutsceneId];
  const clampedInitial = Math.max(0, Math.min(script.lines.length - 1, initialLineIndex));
  const [lineIdx, setLineIdx] = useState(clampedInitial);
  const [displayedChars, setDisplayedChars] = useState(0);

  const currentLine = script.lines[lineIdx] || script.lines[0];
  const isTypingDone = displayedChars >= currentLine.text.length;
  const isProlog = cutsceneId === 'prolog';

  useEffect(() => {
    soundEngine.playCharacterAppear();
    soundEngine.setMusicMode('cutscene');
    const safeStart = Math.max(0, Math.min(CUTSCENES[cutsceneId].lines.length - 1, initialLineIndex));
    setLineIdx(safeStart);
    setDisplayedChars(0);
    return () => {
      soundEngine.setMusicMode('gameplay');
    };
  }, [cutsceneId, initialLineIndex]);

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
    if (lineIdx < script.lines.length - 1) {
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
    <div className="fixed inset-0 z-40 pointer-events-none flex flex-col justify-between p-4 md:p-6">
      {/* Top cinematic bar */}
      <div className="pointer-events-auto flex items-center justify-between gap-3 bg-[#060b1c]/90 border border-slate-700/80 rounded-xl px-4 py-2.5 max-w-4xl w-full mx-auto">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest truncate" style={{ color: script.themeColorHex }}>
            {isProlog ? 'Prolog Petualangan 3D' : 'Cutscene Interaktif'}
          </p>
          <h3 className="font-display text-sm md:text-base font-bold text-white truncate">{script.title}</h3>
        </div>
        <button
          onClick={handleSkip}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
        >
          <FastForward className="w-3.5 h-3.5" />
          {isProlog ? 'SKIP INTRO' : 'SKIP CUTSCENE'}
        </button>
      </div>

      {/* Bottom Visual Novel Dialogue Box */}
      <div
        className="pointer-events-auto max-w-4xl w-full mx-auto bg-[#070d20]/95 border-2 rounded-2xl p-4 md:p-6 shadow-2xl"
        style={{ borderColor: `${currentLine.colorHex}99` }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2.5">
            <span
              className="px-3 py-1 rounded-lg font-display font-bold text-xs md:text-sm text-slate-950 whitespace-nowrap"
              style={{ backgroundColor: currentLine.colorHex }}
            >
              {currentLine.speaker}
            </span>
            <span className="text-xs font-medium text-slate-300">{currentLine.roleTitle}</span>
          </div>
          <span className="text-xs font-mono-num text-slate-400">
            Dialog {lineIdx + 1} / {script.lines.length}
          </span>
        </div>

        <p className="text-sm md:text-base text-slate-100 leading-relaxed min-h-[56px]">
          {currentLine.text.slice(0, displayedChars)}
        </p>

        <div className="flex justify-end mt-3">
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-display font-bold text-xs md:text-sm text-slate-950 cursor-pointer transition-transform active:scale-95 whitespace-nowrap"
            style={{ backgroundColor: currentLine.colorHex }}
          >
            {!isTypingDone
              ? 'TAMPILKAN SEMUA'
              : lineIdx < script.lines.length - 1
                ? 'NEXT'
                : isProlog
                  ? 'MULAI MISI'
                  : 'SELESAI'}
            <ArrowRight className="w-4 h-4" />
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
  specialItem: InventoryItemDef;
  onEquipAndContinue: () => void;
  onContinue: () => void;
}

export const RewardModal: React.FC<RewardModalProps> = ({
  chapter,
  character,
  rewardItem,
  specialItem,
  onEquipAndContinue,
  onContinue,
}) => {
  const [showCurrentLook, setShowCurrentLook] = useState(false);

  useEffect(() => {
    soundEngine.playRewardFanfare();
    setShowCurrentLook(false);
  }, [rewardItem.id]);

  const previewConfig = useMemo<CharacterConfig>(() => {
    if (showCurrentLook || !rewardItem.equipId) return character;
    if (rewardItem.category === 'head') {
      return { ...character, head: rewardItem.equipId as HeadAccessoryId };
    }
    if (rewardItem.category === 'body') {
      return { ...character, body: rewardItem.equipId as BodyAccessoryId };
    }
    if (rewardItem.category === 'neck') {
      return { ...character, neck: rewardItem.equipId as NeckAccessoryId };
    }
    return character;
  }, [character, rewardItem, showCurrentLook]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#080f24] border border-amber-400/50 rounded-2xl p-5 md:p-6 text-center shadow-2xl space-y-4 max-h-[94vh] overflow-y-auto sci-scroll">
        <div className="flex items-center justify-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-400/50 flex items-center justify-center shrink-0">
            <Gift className="w-6 h-6 text-amber-400" />
          </div>
          <div className="text-left">
            <p className="text-[11px] font-bold uppercase tracking-widest text-amber-300">
              Chapter {chapter} Selesai!
            </p>
            <h2 className="font-display text-xl md:text-2xl font-extrabold text-white leading-tight">
              HADIAH BARU TERBUKA
            </h2>
          </div>
        </div>

        {/* Interactive 3D Reward Preview Before Equipping */}
        {rewardItem.equipId && (
          <div className="relative h-48 sm:h-52 w-full rounded-xl overflow-hidden border border-amber-400/35 bg-[#050a18]">
            <CharacterPreview3D config={previewConfig} />
            <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md bg-slate-950/85 border border-amber-400/40 text-[11px] font-semibold text-amber-200 pointer-events-none">
              {showCurrentLook ? 'Tampilan Saat Ini' : `Preview 3D: ${rewardItem.name}`}
            </div>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setShowCurrentLook((v) => !v);
              }}
              className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-[11px] font-semibold text-sky-200 cursor-pointer whitespace-nowrap"
            >
              <Eye className="w-3.5 h-3.5" />
              {showCurrentLook ? 'Lihat Hadiah' : 'Bandingkan Asli'}
            </button>
          </div>
        )}

        <div className="bg-slate-900/90 border border-slate-700 rounded-xl p-3.5 text-left space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-display font-bold text-sm md:text-base text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              {rewardItem.name}
            </span>
            <span className="text-[11px] text-sky-300 font-semibold uppercase">{rewardItem.category}</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{rewardItem.description}</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-left flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="text-xs font-bold text-emerald-300">Artefak Khusus: {specialItem.name}</p>
            <p className="text-[11px] text-slate-400">{specialItem.description}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          {rewardItem.equipId && (
            <button
              onClick={() => {
                soundEngine.playClick();
                onEquipAndContinue();
              }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-bold text-xs md:text-sm cursor-pointer whitespace-nowrap"
            >
              PASANG &amp; LANJUTKAN
            </button>
          )}
          <button
            onClick={() => {
              soundEngine.playClick();
              onContinue();
            }}
            className="flex-1 py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-display font-bold text-xs md:text-sm cursor-pointer whitespace-nowrap"
          >
            {chapter < 5 ? `BUKA CHAPTER ${chapter + 1}` : 'BUKA FINAL QUIZ'}
          </button>
        </div>
      </div>
    </div>
  );
};
