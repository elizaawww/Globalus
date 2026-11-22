import React, { useCallback, useEffect, useState } from 'react';
import { Clock, Package, RefreshCw, Smile, Trophy, WifiOff, X } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { PLAYER_COLORS } from '../data/gameData';
import { RankingCategory, RankingEntry, RankingsResponse } from '../types/game';

interface RankingModalProps {
  currentPlayerId: string;
  currentPlayerName: string;
  pendingSync: boolean;
  localBestMs: number | null;
  localItemCount: number;
  localEmoteCount: number;
  onSyncNow: () => Promise<boolean>;
  onClose: () => void;
}

export function getApiBaseUrl(): string {
  const custom = (import.meta.env.VITE_MP_SERVER_URL as string | undefined)?.trim();
  if (!custom) return '';
  return custom
    .replace(/^wss:\/\//i, 'https://')
    .replace(/^ws:\/\//i, 'http://')
    .replace(/\/ws\/?$/i, '')
    .replace(/\/+$/, '');
}

function formatDuration(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms) || ms <= 0) return '--:--';
  const totalSec = Math.floor(ms / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}m ${String(secs).padStart(2, '0')}d`;
}

export const RankingModal: React.FC<RankingModalProps> = ({
  currentPlayerId,
  currentPlayerName,
  pendingSync,
  localBestMs,
  localItemCount,
  localEmoteCount,
  onSyncNow,
  onClose,
}) => {
  const [category, setCategory] = useState<RankingCategory>('fastest');
  const [data, setData] = useState<RankingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const fetchRankings = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setLoading(false);
      setData(null);
      setErrorMsg('Perangkat sedang offline. Ranking Global memerlukan koneksi internet untuk memuat skor terbaru.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/rankings`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as RankingsResponse;
      if (!json.available) {
        setData(null);
        setErrorMsg(json.error || 'Ranking Global sedang tidak tersedia di server ini.');
      } else {
        setData(json);
      }
    } catch {
      setData(null);
      setErrorMsg('Server Ranking Global sedang tidak dapat dijangkau. Periksa koneksi internetmu atau coba lagi.');
    } finally {
      window.clearTimeout(timer);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  const handleManualSync = async () => {
    soundEngine.playClick();
    setSyncing(true);
    await onSyncNow();
    await fetchRankings();
    setSyncing(false);
  };

  const rows: RankingEntry[] = !data
    ? []
    : category === 'fastest'
      ? data.fastest
      : category === 'most_items'
        ? data.mostItems
        : data.mostEmotes;

  return (
    <div className="fixed inset-0 z-[75] bg-slate-950/90 flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-3xl max-h-[92dvh] bg-[#080f24] border border-amber-400/45 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-400/45 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-display text-base sm:text-lg font-extrabold text-white">
                RANKING GLOBAL STASIUN
              </h2>
              <p className="text-[11px] text-slate-400">
                Papan Peringkat Resmi Top 10 · Data Server Real-Time
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleManualSync}
              disabled={syncing || loading}
              className="min-h-[38px] px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing || loading ? 'animate-spin' : ''}`} />
              Sinkronkan
            </button>
            <button
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              aria-label="Tutup Ranking"
              className="min-w-[38px] min-h-[38px] p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Local Player Summary Strip */}
        <div className="px-5 py-2.5 bg-slate-950/75 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex flex-wrap items-center gap-3 text-slate-300">
            <span className="font-bold text-white">{currentPlayerName}</span>
            <span>
              Tercepat:{' '}
              <strong className="font-mono-num text-amber-300">{formatDuration(localBestMs)}</strong>
            </span>
            <span>
              Item Hadiah:{' '}
              <strong className="font-mono-num text-sky-300">{localItemCount}</strong>
            </span>
            <span>
              Emote:{' '}
              <strong className="font-mono-num text-emerald-300">{localEmoteCount}</strong>
            </span>
          </div>
          {pendingSync && (
            <span className="text-[11px] font-semibold text-amber-300">
              Menunggu koneksi untuk sinkronisasi skor lokal
            </span>
          )}
        </div>

        {/* Category Tabs */}
        <div className="px-5 pt-3.5 shrink-0">
          <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-xl">
            <button
              onClick={() => {
                soundEngine.playClick();
                setCategory('fastest');
              }}
              className={`py-2 px-2 rounded-lg text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                category === 'fastest' ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:bg-slate-800/70'
              }`}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Top 10 Tercepat</span>
            </button>
            <button
              onClick={() => {
                soundEngine.playClick();
                setCategory('most_items');
              }}
              className={`py-2 px-2 rounded-lg text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                category === 'most_items' ? 'bg-sky-400 text-slate-950' : 'text-slate-300 hover:bg-slate-800/70'
              }`}
            >
              <Package className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Top 10 Item</span>
            </button>
            <button
              onClick={() => {
                soundEngine.playClick();
                setCategory('most_emotes');
              }}
              className={`py-2 px-2 rounded-lg text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                category === 'most_emotes' ? 'bg-emerald-400 text-slate-950' : 'text-slate-300 hover:bg-slate-800/70'
              }`}
            >
              <Smile className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Top 10 Emote</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto sci-scroll p-5">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-400">
              Memuat peringkat global dari server...
            </div>
          ) : errorMsg ? (
            <div className="py-10 px-4 text-center space-y-3 bg-slate-900/60 border border-slate-800 rounded-xl">
              <WifiOff className="w-8 h-8 text-amber-400 mx-auto" />
              <p className="text-sm font-semibold text-white">Ranking Tidak Tersedia</p>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">{errorMsg}</p>
              <button
                onClick={fetchRankings}
                className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold cursor-pointer"
              >
                Coba Muat Ulang
              </button>
            </div>
          ) : rows.length === 0 ? (
            <div className="py-10 px-4 text-center space-y-2 bg-slate-900/60 border border-slate-800 rounded-xl">
              <Trophy className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-sm font-semibold text-white">Belum Ada Peringkat Tercatat</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {category === 'fastest'
                  ? 'Selesaikan Chapter 1 hingga Chapter 5 untuk mencatatkan waktu tamat pertamamu di papan peringkat.'
                  : 'Kumpulkan item hadiah Chapter dan buka emote untuk masuk ke Top 10 Global.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {rows.map((entry, idx) => {
                const isMe = entry.playerId === currentPlayerId;
                const col = PLAYER_COLORS.find((c) => c.id === entry.avatarColor)?.hex || '#38bdf8';
                return (
                  <div
                    key={`${entry.playerId}_${idx}`}
                    className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border ${
                      isMe
                        ? 'bg-sky-500/15 border-sky-400/60'
                        : 'bg-slate-900/75 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-7 h-7 rounded-lg font-mono-num font-extrabold text-xs flex items-center justify-center shrink-0 ${
                          idx === 0
                            ? 'bg-amber-400 text-slate-950'
                            : idx === 1
                              ? 'bg-slate-300 text-slate-950'
                              : idx === 2
                                ? 'bg-amber-700 text-white'
                                : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/30"
                        style={{ backgroundColor: col }}
                      />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-white truncate">
                          {entry.playerName}{' '}
                          {isMe && <span className="text-[10px] text-sky-300 font-semibold">(Kamu)</span>}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {entry.completedChapters}/5 Chapter · {entry.totalExp} EXP
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {category === 'fastest' && (
                        <p className="font-mono-num text-sm font-bold text-amber-300">
                          {formatDuration(entry.bestCompletionMs)}
                        </p>
                      )}
                      {category === 'most_items' && (
                        <p className="font-mono-num text-sm font-bold text-sky-300">
                          {entry.itemCount} Item
                        </p>
                      )}
                      {category === 'most_emotes' && (
                        <p className="font-mono-num text-sm font-bold text-emerald-300">
                          {entry.emoteCount} Emote
                        </p>
                      )}
                      <p className="text-[10px] text-slate-500">
                        {entry.itemCount} item · {entry.emoteCount} emote
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
