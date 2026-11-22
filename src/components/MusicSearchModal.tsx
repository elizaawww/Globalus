import React, { useState } from 'react';
import { Disc3, Music, Pause, Play, Search, Volume2, VolumeX, WifiOff, X } from 'lucide-react';
import { MUSIC_TRACKS, soundEngine } from '../audio/soundEngine';
import { GameSettings, MusicSearchResult, MusicTrackId } from '../types/game';
import { getApiBaseUrl } from './RankingModal';

interface MusicSearchModalProps {
  settings: GameSettings;
  onUpdateSettings: (next: GameSettings) => void;
  onClose: () => void;
}

export const MusicSearchModal: React.FC<MusicSearchModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MusicSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    soundEngine.playClick();

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setResults([]);
      setHasSearched(true);
      setSearchError('Perangkat sedang offline. Gunakan audio bawaan atau hubungkan internet untuk mencari lagu.');
      return;
    }

    setSearching(true);
    setSearchError(null);
    setHasSearched(true);

    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 5500);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/music/search?q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      const json = (await res.json()) as { ok?: boolean; results?: MusicSearchResult[]; error?: string };
      if (!res.ok || !json.ok) {
        setResults([]);
        setSearchError(json.error || 'Pencarian lagu tidak tersedia saat ini.');
      } else {
        setResults(Array.isArray(json.results) ? json.results : []);
      }
    } catch {
      setResults([]);
      setSearchError('Tidak dapat terhubung ke layanan pencarian musik saat ini.');
    } finally {
      window.clearTimeout(timer);
      setSearching(false);
    }
  };

  const selectBuiltInTrack = (trackId: MusicTrackId) => {
    soundEngine.playClick();
    soundEngine.unlock();
    onUpdateSettings({
      ...settings,
      musicTrack: trackId,
      selectedExternalTrack: null,
      musicPaused: false,
      musicMuted: false,
    });
  };

  const selectExternalTrack = (track: MusicSearchResult) => {
    soundEngine.playClick();
    soundEngine.unlock();
    onUpdateSettings({
      ...settings,
      selectedExternalTrack: track,
      musicPaused: false,
      musicMuted: false,
    });
  };

  const isPlaying = !settings.musicPaused && !settings.musicMuted && !settings.muted;
  const activeTitle = settings.selectedExternalTrack
    ? `${settings.selectedExternalTrack.title} — ${settings.selectedExternalTrack.artist}`
    : MUSIC_TRACKS.find((t) => t.id === settings.musicTrack)?.title || 'Station Hull Ambience';

  return (
    <div className="fixed inset-0 z-[75] bg-slate-950/90 flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-2xl max-h-[92dvh] bg-[#080f24] border border-sky-500/45 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-400/45 flex items-center justify-center shrink-0">
              <Music className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h2 className="font-display text-base sm:text-lg font-extrabold text-white">
                PEMUTAR MUSIK &amp; AMBIENCE
              </h2>
              <p className="text-[11px] text-slate-400 truncate max-w-[260px] sm:max-w-md">
                {isPlaying ? `Sedang diputar: ${activeTitle}` : `Dijeda · ${activeTitle}`}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            aria-label="Tutup Pemutar Musik"
            className="min-w-[38px] min-h-[38px] p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Transport & Volume Strip */}
        <div className="px-5 py-3 bg-slate-950/75 border-b border-slate-800/80 flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => {
              soundEngine.playClick();
              soundEngine.unlock();
              onUpdateSettings({
                ...settings,
                musicPaused: !settings.musicPaused,
              });
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
              settings.musicPaused
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
            }`}
          >
            {settings.musicPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
            {settings.musicPaused ? 'Putar Musik' : 'Jeda Musik'}
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              onUpdateSettings({
                ...settings,
                musicMuted: !settings.musicMuted,
              });
            }}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            {settings.musicMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-sky-400" />}
            {settings.musicMuted ? 'Buka Bisu' : 'Bisukan'}
          </button>

          <label className="flex items-center gap-2 flex-1 min-w-[140px] text-xs text-slate-300">
            <span className="shrink-0">Volume</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.musicVolume}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  musicVolume: parseFloat(e.target.value),
                })
              }
              className="w-full accent-sky-400 cursor-pointer"
            />
          </label>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto sci-scroll p-5 space-y-5">
          {/* Online Music Search */}
          <div className="space-y-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-sky-300">
                Cari Lagu Online (Pratinjau Resmi iTunes)
              </h3>
              <p className="text-[11px] text-slate-400">
                Volume musik otomatis mengecil saat dialog cutscene atau voice chat berlangsung.
              </p>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari judul lagu atau artis (mis. Lofi, BTS, Gamelan, Space)..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-sky-400 outline-none text-xs sm:text-sm text-white"
              />
              <button
                type="submit"
                disabled={searching || !query.trim()}
                className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-display font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Search className="w-4 h-4" />
                {searching ? 'Mencari...' : 'Cari'}
              </button>
            </form>

            {searchError && (
              <div className="p-3 rounded-xl bg-amber-950/35 border border-amber-500/40 flex items-center gap-2.5 text-xs text-amber-200">
                <WifiOff className="w-4 h-4 shrink-0 text-amber-400" />
                <span>{searchError}</span>
              </div>
            )}

            {hasSearched && !searching && !searchError && results.length === 0 && (
              <p className="text-xs text-slate-400 bg-slate-900/60 border border-slate-800 rounded-xl p-3">
                Tidak ada pratinjau lagu yang cocok dengan pencarian tersebut.
              </p>
            )}

            {results.length > 0 && (
              <div className="space-y-2 max-h-56 overflow-y-auto sci-scroll pr-1">
                {results.map((track) => {
                  const selected = settings.selectedExternalTrack?.id === track.id;
                  return (
                    <div
                      key={track.id}
                      className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border ${
                        selected ? 'bg-sky-500/15 border-sky-400' : 'bg-slate-900/80 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {track.artworkUrl ? (
                          <img
                            src={track.artworkUrl}
                            alt={track.title}
                            className="w-10 h-10 rounded-lg object-cover shrink-0 bg-slate-800"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                            <Disc3 className="w-5 h-5 text-sky-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{track.title}</p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {track.artist}
                            {track.album ? ` · ${track.album}` : ''}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => selectExternalTrack(track)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer shrink-0 ${
                          selected
                            ? 'bg-emerald-400 text-slate-950'
                            : 'bg-sky-500 hover:bg-sky-400 text-slate-950'
                        }`}
                      >
                        {selected ? 'Dipilih' : 'Putar'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Built-in Offline Station Ambience Tracks */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Audio Bawaan Stasiun (Bebas Royalti &amp; Offline)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MUSIC_TRACKS.map((t) => {
                const active = !settings.selectedExternalTrack && settings.musicTrack === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => selectBuiltInTrack(t.id)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-colors ${
                      active
                        ? 'bg-emerald-500/15 border-emerald-400'
                        : 'bg-slate-900/75 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <p className="text-xs font-bold text-white">{t.title}</p>
                    <p className="text-[11px] text-slate-400">{t.genre}</p>
                    <p className="text-[10px] text-emerald-300/90 mt-1">{t.licenseNote}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
