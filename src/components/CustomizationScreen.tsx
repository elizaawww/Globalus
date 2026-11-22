import React, { useState } from 'react';
import { ArrowLeft, Check, RotateCcw, Save, User } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import {
  COSTUME_STYLES,
  HELMET_DESIGNS,
  INVENTORY_ITEMS,
  PLAYER_COLORS,
} from '../data/gameData';
import {
  BodyAccessoryId,
  CharacterConfig,
  HeadAccessoryId,
  HeadwearTransform,
  NeckAccessoryId,
} from '../types/game';
import { CharacterPreview3D } from './CharacterPreview3D';

interface CustomizationScreenProps {
  initialConfig: CharacterConfig;
  unlockedItems: string[];
  onSave: (config: CharacterConfig) => void;
  onBack: () => void;
}

const DEFAULT_HEADWEAR_TRANSFORM: HeadwearTransform = {
  offsetY: 0,
  offsetZ: 0,
  tiltX: 0,
  scale: 1,
};

const DEFAULT_CONFIG: CharacterConfig = {
  name: 'Astronaut',
  color: 'biru',
  helmet: 'standard_visor',
  costume: 'standard_crew',
  head: 'none',
  body: 'backpack',
  neck: 'none',
  headwearTransform: { ...DEFAULT_HEADWEAR_TRANSFORM },
};

export const CustomizationScreen: React.FC<CustomizationScreenProps> = ({
  initialConfig,
  unlockedItems,
  onSave,
  onBack,
}) => {
  const [draft, setDraft] = useState<CharacterConfig>({ ...DEFAULT_CONFIG, ...initialConfig });
  const [tab, setTab] = useState<'color' | 'helmet' | 'costume' | 'head' | 'body' | 'neck'>('color');
  const [savedNotice, setSavedNotice] = useState(false);

  const unlockedSet = new Set(unlockedItems);

  const headItems = INVENTORY_ITEMS.filter(
    (item) => item.category === 'head' && (item.isDefault || unlockedSet.has(item.id))
  );
  const bodyItems = INVENTORY_ITEMS.filter(
    (item) => item.category === 'body' && (item.isDefault || unlockedSet.has(item.id))
  );
  const neckItems = INVENTORY_ITEMS.filter(
    (item) => item.category === 'neck' && (item.isDefault || unlockedSet.has(item.id))
  );

  const handleSave = () => {
    soundEngine.playSuccess();
    const cleaned: CharacterConfig = {
      ...draft,
      name: draft.name.trim() || 'Astronaut',
    };
    onSave(cleaned);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 1800);
  };

  const handleReset = () => {
    soundEngine.playClick();
    setDraft(DEFAULT_CONFIG);
  };

  return (
    <div className="w-full h-full bg-[#050918] overflow-y-auto sci-scroll touch-pan-y safe-hud-inset">
      <div className="min-h-full lg:h-full [@media(max-height:580px)]:!h-auto max-w-6xl mx-auto flex flex-col p-3 sm:p-4 md:p-5 gap-3 sm:gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 sm:pb-3 shrink-0 gap-2">
          <div className="min-w-0">
            <h2 className="font-display text-lg sm:text-xl md:text-2xl font-bold text-white truncate">
              KUSTOMISASI ASTRONAUT
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400 truncate">
              Rancang tampilan kostum, helm, dan aksesori astronaut untuk Solo &amp; Multiplayer
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                soundEngine.playClick();
                onBack();
              }}
              className="min-h-[42px] flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs md:text-sm font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              BACK
            </button>
          </div>
        </div>

        {/* Main Responsive Layout (scrolls vertically on compact/landscape phones; fixed split on tall desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 lg:flex-1 lg:min-h-0">
          {/* Left: Live 3D Preview */}
          <div className="lg:col-span-5 bg-[#0a1229] border border-sky-500/30 rounded-2xl flex flex-col overflow-hidden relative h-[210px] sm:h-[250px] lg:h-auto lg:min-h-[340px]">
            <div className="px-3.5 py-2 border-b border-slate-800/80 flex items-center justify-between shrink-0">
              <span className="text-[11px] sm:text-xs font-semibold text-sky-300">
                Geser Kiri/Kanan untuk Putar 3D
              </span>
              <span className="text-xs font-bold text-white truncate max-w-[140px]">
                {draft.name || 'Astronaut'}
              </span>
            </div>
            <div className="flex-1 min-h-0">
              <CharacterPreview3D config={draft} />
            </div>
            {savedNotice && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg">
                <Check className="w-4 h-4" />
                Karakter Disimpan!
              </div>
            )}
          </div>

          {/* Right: Controls (no inner clipping trap on mobile landscape) */}
          <div className="lg:col-span-7 bg-[#0a1229] border border-slate-800 rounded-2xl p-3.5 sm:p-4 md:p-5 flex flex-col lg:min-h-0">
            {/* Name Input */}
            <div className="mb-3 shrink-0">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Identitas / Nama Pemain
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={20}
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="Masukkan nama astronaut..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-sky-400 outline-none rounded-xl pl-9 pr-4 py-2 text-sm text-white"
                />
              </div>
            </div>

            {/* Category Tabs */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 bg-slate-950 p-1.5 rounded-xl mb-3.5 shrink-0">
              {(
                [
                  ['color', 'Warna'],
                  ['helmet', 'Helm'],
                  ['costume', 'Kostum'],
                  ['head', 'Kepala'],
                  ['body', 'Tubuh'],
                  ['neck', 'Leher'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => {
                    soundEngine.playClick();
                    setTab(id);
                  }}
                  className={`min-h-[38px] py-2 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    tab === id
                      ? 'bg-sky-500 text-slate-950'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Options Grid */}
            <div className="lg:flex-1 lg:overflow-y-auto [@media(max-height:580px)]:!overflow-visible sci-scroll lg:pr-1">
            {tab === 'color' && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {PLAYER_COLORS.map((c) => {
                  const selected = draft.color === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        soundEngine.playClick();
                        setDraft({ ...draft, color: c.id });
                      }}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer ${
                        selected
                          ? 'bg-sky-500/15 border-sky-400 text-white'
                          : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <span
                        className="w-8 h-8 rounded-full border-2 border-white/30 shadow"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span className="text-xs font-semibold">{c.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {tab === 'helmet' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {HELMET_DESIGNS.map((h) => {
                  const selected = draft.helmet === h.id;
                  return (
                    <button
                      key={h.id}
                      onClick={() => {
                        soundEngine.playClick();
                        setDraft({ ...draft, helmet: h.id });
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        selected
                          ? 'bg-sky-500/15 border-sky-400 text-white'
                          : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <p className="text-xs font-bold">{h.label}</p>
                      <p className="text-[11px] text-slate-400 mt-1">{h.desc}</p>
                    </button>
                  );
                })}
              </div>
            )}

            {tab === 'costume' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {COSTUME_STYLES.map((c) => {
                  const selected = draft.costume === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        soundEngine.playClick();
                        setDraft({ ...draft, costume: c.id });
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        selected
                          ? 'bg-sky-500/15 border-sky-400 text-white'
                          : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <p className="text-xs font-bold">{c.label}</p>
                      <p className="text-[11px] text-slate-400 mt-1">{c.desc}</p>
                    </button>
                  );
                })}
              </div>
            )}

            {tab === 'head' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <button
                    onClick={() => {
                      soundEngine.playClick();
                      setDraft({ ...draft, head: 'none' });
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      draft.head === 'none'
                        ? 'bg-sky-500/15 border-sky-400 text-white'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <p className="text-xs font-bold">Tanpa Aksesori</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Helm astronaut standar</p>
                  </button>
                  {headItems.map((item) => {
                    const selected = draft.head === item.equipId;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          soundEngine.playClick();
                          setDraft({ ...draft, head: item.equipId as HeadAccessoryId });
                        }}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          selected
                            ? 'bg-sky-500/15 border-sky-400 text-white'
                            : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <p className="text-xs font-bold truncate">{item.name}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{item.description}</p>
                      </button>
                    );
                  })}
                </div>

                {draft.head !== 'none' && (
                  <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-sky-300">
                        Penyesuaian Posisi Aksesori Kepala
                      </span>
                      <button
                        onClick={() => {
                          soundEngine.playClick();
                          setDraft({
                            ...draft,
                            headwearTransform: { ...DEFAULT_HEADWEAR_TRANSFORM },
                          });
                        }}
                        className="text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer"
                      >
                        Reset Posisi
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-slate-300">
                      <label className="space-y-1">
                        <div className="flex justify-between">
                          <span>Tinggi (Y)</span>
                          <span className="font-mono-num text-sky-300">
                            {((draft.headwearTransform?.offsetY ?? 0) * 100).toFixed(0)}mm
                          </span>
                        </div>
                        <input
                          type="range"
                          min={-0.12}
                          max={0.18}
                          step={0.01}
                          value={draft.headwearTransform?.offsetY ?? 0}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              headwearTransform: {
                                ...DEFAULT_HEADWEAR_TRANSFORM,
                                ...draft.headwearTransform,
                                offsetY: parseFloat(e.target.value),
                              },
                            })
                          }
                          className="w-full accent-sky-400 cursor-pointer"
                        />
                      </label>
                      <label className="space-y-1">
                        <div className="flex justify-between">
                          <span>Maju / Mundur (Z)</span>
                          <span className="font-mono-num text-sky-300">
                            {((draft.headwearTransform?.offsetZ ?? 0) * 100).toFixed(0)}mm
                          </span>
                        </div>
                        <input
                          type="range"
                          min={-0.12}
                          max={0.12}
                          step={0.01}
                          value={draft.headwearTransform?.offsetZ ?? 0}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              headwearTransform: {
                                ...DEFAULT_HEADWEAR_TRANSFORM,
                                ...draft.headwearTransform,
                                offsetZ: parseFloat(e.target.value),
                              },
                            })
                          }
                          className="w-full accent-sky-400 cursor-pointer"
                        />
                      </label>
                      <label className="space-y-1">
                        <div className="flex justify-between">
                          <span>Kemiringan</span>
                          <span className="font-mono-num text-sky-300">
                            {Math.round(((draft.headwearTransform?.tiltX ?? 0) * 180) / Math.PI)}°
                          </span>
                        </div>
                        <input
                          type="range"
                          min={-0.35}
                          max={0.35}
                          step={0.02}
                          value={draft.headwearTransform?.tiltX ?? 0}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              headwearTransform: {
                                ...DEFAULT_HEADWEAR_TRANSFORM,
                                ...draft.headwearTransform,
                                tiltX: parseFloat(e.target.value),
                              },
                            })
                          }
                          className="w-full accent-sky-400 cursor-pointer"
                        />
                      </label>
                      <label className="space-y-1">
                        <div className="flex justify-between">
                          <span>Ukuran</span>
                          <span className="font-mono-num text-sky-300">
                            {((draft.headwearTransform?.scale ?? 1) * 100).toFixed(0)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0.8}
                          max={1.28}
                          step={0.02}
                          value={draft.headwearTransform?.scale ?? 1}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              headwearTransform: {
                                ...DEFAULT_HEADWEAR_TRANSFORM,
                                ...draft.headwearTransform,
                                scale: parseFloat(e.target.value),
                              },
                            })
                          }
                          className="w-full accent-sky-400 cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === 'body' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    setDraft({ ...draft, body: 'none' });
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    draft.body === 'none'
                      ? 'bg-sky-500/15 border-sky-400 text-white'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <p className="text-xs font-bold">Polos</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Suit astronaut dasar</p>
                </button>
                {bodyItems.map((item) => {
                  const selected = draft.body === item.equipId;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        soundEngine.playClick();
                        setDraft({ ...draft, body: item.equipId as BodyAccessoryId });
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        selected
                          ? 'bg-sky-500/15 border-sky-400 text-white'
                          : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <p className="text-xs font-bold truncate">{item.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{item.description}</p>
                    </button>
                  );
                })}
              </div>
            )}

            {tab === 'neck' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    setDraft({ ...draft, neck: 'none' });
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    draft.neck === 'none'
                      ? 'bg-sky-500/15 border-sky-400 text-white'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <p className="text-xs font-bold">Tanpa Kalung</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Kerah standar</p>
                </button>
                {neckItems.map((item) => {
                  const selected = draft.neck === item.equipId;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        soundEngine.playClick();
                        setDraft({ ...draft, neck: item.equipId as NeckAccessoryId });
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        selected
                          ? 'bg-sky-500/15 border-sky-400 text-white'
                          : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <p className="text-xs font-bold truncate">{item.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{item.description}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between gap-3 pt-4 mt-4 pb-2 border-t border-slate-800 shrink-0">
              <button
                onClick={handleReset}
                className="min-h-[44px] flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                RESET
              </button>

              <button
                onClick={handleSave}
                className="min-h-[44px] flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs md:text-sm font-display font-bold tracking-wide cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                <Save className="w-4 h-4" />
                SAVE CHARACTER
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
