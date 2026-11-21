import React, { useMemo, useState } from 'react';
import { Check, Eye, Lock, Package, RotateCcw, Sparkles, X } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { INVENTORY_ITEMS } from '../data/gameData';
import {
  BodyAccessoryId,
  CharacterConfig,
  HeadAccessoryId,
  InventoryCategory,
  NeckAccessoryId,
} from '../types/game';
import { CharacterPreview3D } from './CharacterPreview3D';

interface InventoryModalProps {
  character: CharacterConfig;
  unlockedItems: string[];
  onEquipChange: (next: CharacterConfig) => void;
  onClose: () => void;
}

const CATEGORIES: Array<{ id: InventoryCategory; label: string }> = [
  { id: 'head', label: 'Head Accessories' },
  { id: 'neck', label: 'Neck Accessories' },
  { id: 'body', label: 'Body Accessories' },
  { id: 'special', label: 'Special Items' },
];

export const InventoryModal: React.FC<InventoryModalProps> = ({
  character,
  unlockedItems,
  onEquipChange,
  onClose,
}) => {
  const [cat, setCat] = useState<InventoryCategory>('head');
  const [previewItemId, setPreviewItemId] = useState<string | null>(null);
  const unlockedSet = new Set(unlockedItems);

  const items = INVENTORY_ITEMS.filter((i) => i.category === cat);
  const totalRewardCount = INVENTORY_ITEMS.filter((i) => !i.isDefault).length;
  const collectedRewardCount = INVENTORY_ITEMS.filter(
    (i) => !i.isDefault && unlockedSet.has(i.id)
  ).length;

  const previewItem = useMemo(
    () => INVENTORY_ITEMS.find((i) => i.id === previewItemId) || null,
    [previewItemId]
  );

  const previewCharacter = useMemo<CharacterConfig>(() => {
    if (!previewItem || !previewItem.equipId) return character;
    if (previewItem.category === 'head') {
      return { ...character, head: previewItem.equipId as HeadAccessoryId };
    }
    if (previewItem.category === 'body') {
      return { ...character, body: previewItem.equipId as BodyAccessoryId };
    }
    if (previewItem.category === 'neck') {
      return { ...character, neck: previewItem.equipId as NeckAccessoryId };
    }
    return character;
  }, [character, previewItem]);

  const isEquipped = (item: (typeof INVENTORY_ITEMS)[number]) => {
    if (!item.equipId) return false;
    if (item.category === 'head') return character.head === item.equipId;
    if (item.category === 'body') return character.body === item.equipId;
    if (item.category === 'neck') return character.neck === item.equipId;
    return false;
  };

  const handleToggleEquip = (item: (typeof INVENTORY_ITEMS)[number]) => {
    if (!item.equipId) return;
    soundEngine.playClick();
    setPreviewItemId(null);
    const currentlyEquipped = isEquipped(item);
    if (item.category === 'head') {
      onEquipChange({
        ...character,
        head: currentlyEquipped ? 'none' : (item.equipId as HeadAccessoryId),
      });
    } else if (item.category === 'body') {
      onEquipChange({
        ...character,
        body: currentlyEquipped ? 'none' : (item.equipId as BodyAccessoryId),
      });
    } else if (item.category === 'neck') {
      onEquipChange({
        ...character,
        neck: currentlyEquipped ? 'none' : (item.equipId as NeckAccessoryId),
      });
    }
  };

  const handleTogglePreview = (itemId: string) => {
    soundEngine.playClick();
    setPreviewItemId((curr) => (curr === itemId ? null : itemId));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 flex items-center justify-center p-3 md:p-6">
      <div className="w-full max-w-5xl h-[90vh] max-h-[640px] bg-[#080f24] border border-sky-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-sky-400" />
            <div>
              <h2 className="font-display text-lg md:text-xl font-bold text-white">
                INVENTARIS & HADIAH
              </h2>
              <p className="text-xs text-slate-400">
                Koleksi Hadiah Terbuka:{' '}
                <span className="font-mono-num text-amber-300 font-semibold">
                  {collectedRewardCount} / {totalRewardCount}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
            aria-label="Tutup Inventaris"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 min-h-0">
          {/* Left: Live 3D Equipped / Preview Character */}
          <div className="md:col-span-4 bg-[#060b1a] border-b md:border-b-0 md:border-r border-slate-800 flex flex-col min-h-[190px]">
            <div className="px-4 py-2 text-xs text-slate-400 border-b border-slate-800/60 flex items-center justify-between gap-2">
              <span className="truncate">
                {previewItem ? `Preview: ${previewItem.name}` : `Karakter · ${character.name}`}
              </span>
              {previewItem ? (
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    setPreviewItemId(null);
                  }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-amber-200 text-[11px] font-semibold cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              ) : (
                <span className="text-sky-300 font-semibold shrink-0">Live 3D</span>
              )}
            </div>
            <div className="flex-1 min-h-0 relative">
              <CharacterPreview3D config={previewCharacter} />
            </div>
            {cat === 'head' && previewCharacter.head !== 'none' && (
              <div className="px-3.5 py-2.5 border-t border-slate-800 bg-slate-950/90 space-y-1.5 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-sky-300">Atur Posisi Topi</span>
                  <button
                    onClick={() => {
                      soundEngine.playClick();
                      onEquipChange({
                        ...character,
                        headwearTransform: { offsetY: 0, offsetZ: 0, tiltX: 0, scale: 1 },
                      });
                    }}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300">
                  <label className="space-y-0.5">
                    <span>Tinggi (Y)</span>
                    <input
                      type="range"
                      min={-0.12}
                      max={0.18}
                      step={0.01}
                      value={character.headwearTransform?.offsetY ?? 0}
                      onChange={(e) =>
                        onEquipChange({
                          ...character,
                          headwearTransform: {
                            offsetY: parseFloat(e.target.value),
                            offsetZ: character.headwearTransform?.offsetZ ?? 0,
                            tiltX: character.headwearTransform?.tiltX ?? 0,
                            scale: character.headwearTransform?.scale ?? 1,
                          },
                        })
                      }
                      className="w-full accent-sky-400 cursor-pointer"
                    />
                  </label>
                  <label className="space-y-0.5">
                    <span>Ukuran</span>
                    <input
                      type="range"
                      min={0.8}
                      max={1.28}
                      step={0.02}
                      value={character.headwearTransform?.scale ?? 1}
                      onChange={(e) =>
                        onEquipChange({
                          ...character,
                          headwearTransform: {
                            offsetY: character.headwearTransform?.offsetY ?? 0,
                            offsetZ: character.headwearTransform?.offsetZ ?? 0,
                            tiltX: character.headwearTransform?.tiltX ?? 0,
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

          {/* Right: Categories + Items */}
          <div className="md:col-span-8 flex flex-col p-4 min-h-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-950 p-1 rounded-xl mb-4 shrink-0">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    soundEngine.playClick();
                    setCat(c.id);
                  }}
                  className={`py-2 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    cat === c.id
                      ? 'bg-sky-500 text-slate-950'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto sci-scroll pr-1 flex-1 content-start">
              {items.map((item) => {
                const isUnlocked = item.isDefault || unlockedSet.has(item.id);
                const equipped = isEquipped(item);
                const isPreviewing = previewItemId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-3.5 flex flex-col justify-between gap-2.5 transition-colors ${
                      isPreviewing
                        ? 'bg-amber-500/10 border-amber-400'
                        : !isUnlocked
                          ? 'bg-slate-950/60 border-slate-800/70 opacity-85'
                          : equipped
                            ? 'bg-sky-500/10 border-sky-400'
                            : 'bg-slate-900/75 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border"
                          style={{
                            backgroundColor: isUnlocked ? `${item.accentHex}22` : '#0f172a',
                            borderColor: isUnlocked ? `${item.accentHex}66` : '#1e293b',
                          }}
                        >
                          {isUnlocked ? (
                            <Sparkles className="w-4 h-4" style={{ color: item.accentHex }} />
                          ) : (
                            <Lock className="w-4 h-4 text-slate-500" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white leading-tight">{item.name}</h4>
                          <span className="text-[11px] text-slate-400">
                            {item.isDefault
                              ? 'Item Dasar'
                              : item.rewardChapter
                                ? `Hadiah Chapter ${item.rewardChapter}`
                                : 'Hadiah Khusus'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {isUnlocked
                        ? item.description
                        : `Terkunci. Selesaikan Chapter ${item.rewardChapter} dan cutscene-nya untuk membuka item ini.`}
                    </p>

                    {item.equipId && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTogglePreview(item.id)}
                          className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                            isPreviewing
                              ? 'bg-amber-400 text-slate-950 font-bold'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                          } ${!isUnlocked ? 'w-full' : ''}`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {isPreviewing ? 'Sedang Preview' : 'Preview 3D'}
                        </button>

                        {isUnlocked && (
                          <button
                            onClick={() => handleToggleEquip(item)}
                            className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                              equipped
                                ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-300 hover:bg-emerald-500/30'
                                : 'bg-sky-500 hover:bg-sky-400 text-slate-950'
                            }`}
                          >
                            {equipped ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                Dipakai (Lepas)
                              </>
                            ) : (
                              'Pasang'
                            )}
                          </button>
                        )}
                      </div>
                    )}

                    {isUnlocked && !item.equipId && (
                      <div className="text-[11px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-2.5 py-1.5 text-center">
                        Artefak Koleksi Permanen
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
