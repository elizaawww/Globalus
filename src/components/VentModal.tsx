import React, { useEffect } from 'react';
import { ArrowRightCircle, CheckCircle2, Lock, Wind, X } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { ROOMS, VENTS } from '../data/stationLayout';
import { RoomId } from '../types/game';

interface VentModalProps {
  currentVentId: string;
  canUseVent: boolean;
  lockedRooms?: RoomId[];
  chapterLockedRooms?: RoomId[];
  onSelectDestination: (toVentId: string) => void;
  onClose: () => void;
}

export const VentModal: React.FC<VentModalProps> = ({
  currentVentId,
  canUseVent,
  lockedRooms = [],
  chapterLockedRooms = [],
  onSelectDestination,
  onClose,
}) => {
  useEffect(() => {
    if (canUseVent) {
      soundEngine.playImpostorAction();
    }
  }, [canUseVent]);

  const currentVent = VENTS.find((v) => v.id === currentVentId);
  if (!currentVent) return null;

  const currentRoom = ROOMS[currentVent.roomId];
  const destinations = currentVent.connectedTo
    .map((id) => VENTS.find((v) => v.id === id))
    .filter((v): v is NonNullable<typeof v> => Boolean(v));
  const completedLockedSet = new Set(lockedRooms);
  const chapterLockedSet = new Set(chapterLockedRooms);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#080f24] border border-emerald-500/45 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center">
              <Wind className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-white">
                VENT SYSTEM NETWORK
              </h3>
              <p className="text-xs text-slate-400">
                Lokasi Saat Ini: <strong className="text-emerald-300">{currentRoom.name}</strong>
              </p>
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

        {!canUseVent ? (
          <div className="bg-slate-900/90 border border-slate-700 rounded-xl p-4 space-y-2 text-center">
            <Lock className="w-8 h-8 text-amber-400 mx-auto" />
            <p className="text-sm font-bold text-white">Akses Ventilasi Dibatasi (Protokol Kru)</p>
            <p className="text-xs text-slate-300 leading-relaxed">
              Sesuai aturan permainan, hanya <strong>Impostor</strong> yang dapat menyusup dan berpindah ruangan melalui saluran ventilasi. Gunakan pintu &amp; koridor utama untuk menjelajahi stasiun.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            <p className="text-xs text-slate-300">
              Pilih ruangan tujuan yang terhubung dengan saluran ventilasi ini:
            </p>
            {destinations.map((dest) => {
              const room = ROOMS[dest.roomId];
              const isCompletedLocked = !room.neverLock && completedLockedSet.has(dest.roomId);
              const isChapterLocked = chapterLockedSet.has(dest.roomId);
              const isBlocked = isCompletedLocked || isChapterLocked;
              return (
                <button
                  key={dest.id}
                  disabled={isBlocked}
                  onClick={() => {
                    if (isBlocked) {
                      soundEngine.playError();
                      return;
                    }
                    soundEngine.playVent();
                    onSelectDestination(dest.id);
                  }}
                  className={`w-full p-3.5 rounded-xl border flex items-center justify-between gap-3 text-left transition-all ${
                    isBlocked
                      ? 'bg-slate-950/80 border-slate-800 text-slate-400 cursor-not-allowed opacity-75'
                      : 'bg-slate-900/90 hover:bg-emerald-500/15 border-slate-700 hover:border-emerald-400 cursor-pointer'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: room.accentHex }}
                      />
                      <span className="truncate">{room.name}</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {isCompletedLocked
                        ? 'Ruangan selesai & terkunci otomatis'
                        : isChapterLocked
                          ? 'Complete the previous chapter to unlock this room.'
                          : dest.label}
                    </p>
                  </div>
                  {isCompletedLocked ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold shrink-0">
                      <Lock className="w-3.5 h-3.5" />
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                  ) : isChapterLocked ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 text-[10px] font-bold shrink-0">
                      <Lock className="w-3.5 h-3.5" />
                      Terkunci
                    </span>
                  ) : (
                    <ArrowRightCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        <button
          onClick={() => {
            soundEngine.playClick();
            onClose();
          }}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
        >
          {canUseVent ? 'KELUAR DARI VENT' : 'TUTUP'}
        </button>
      </div>
    </div>
  );
};
