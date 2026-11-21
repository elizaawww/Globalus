import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  Crown,
  LogOut,
  Mic,
  MicOff,
  Play,
  Plus,
  ShieldAlert,
  Sparkles,
  UserCheck,
  Users,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { PLAYER_COLORS } from '../data/gameData';
import { CharacterConfig, ConnectionStatus, RoomSnapshot } from '../types/game';
import { HudVoiceControls } from './HUD';
import { SpaceBackdrop3D } from './SpaceBackdrop3D';

interface MultiplayerLobbyProps {
  character: CharacterConfig;
  status: ConnectionStatus;
  playerId: string | null;
  roomCode: string | null;
  snapshot: RoomSnapshot | null;
  lastError: string | null;
  voiceControls?: HudVoiceControls;
  voiceEnabled?: boolean;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onLeaveRoom: () => void;
  onToggleReady: () => void;
  onStartGame: () => void;
  onOpenCustomize: () => void;
  onBackHome: () => void;
  onClearError: () => void;
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
  character,
  status,
  playerId,
  roomCode,
  snapshot,
  lastError,
  voiceControls,
  voiceEnabled = true,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  onToggleReady,
  onStartGame,
  onOpenCustomize,
  onBackHome,
  onClearError,
}) => {
  const [joinInput, setJoinInput] = useState('');
  const [copied, setCopied] = useState(false);

  const players = snapshot?.players || [];
  const me = players.find((p) => p.id === playerId);
  const isHost = Boolean(me?.isHost);
  const allNonHostReady = players.filter((p) => !p.isHost).every((p) => p.ready);
  const canStart = isHost && players.length >= 2 && allNonHostReady;

  const handleCopyCode = () => {
    if (!roomCode) return;
    soundEngine.playClick();
    navigator.clipboard?.writeText(roomCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const statusBadge = () => {
    if (status === 'connected') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
          <Wifi className="w-3.5 h-3.5" />
          Server Terhubung
        </span>
      );
    }
    if (status === 'connecting' || status === 'reconnecting') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-semibold">
          <Wifi className="w-3.5 h-3.5" />
          {status === 'reconnecting' ? 'Menyambung Ulang...' : 'Menghubungkan...'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold">
        <WifiOff className="w-3.5 h-3.5" />
        Belum Terhubung
      </span>
    );
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <SpaceBackdrop3D />
      <div className="fixed inset-0 z-[1] bg-[#040714]/82 pointer-events-none" />

      <div className="relative z-10 w-full h-full flex flex-col p-4 md:p-7 max-w-6xl mx-auto">
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-5 shrink-0">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-sky-400">
              Mode Online Real-Time · Social Deduction Sosiologi
            </p>
            <h1 className="font-display text-2xl md:text-3xl font-extrabold text-white">
              MULTIPLAYER LOBBY GLOBALUS
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            {statusBadge()}
            <button
              onClick={() => {
                soundEngine.playClick();
                if (roomCode) onLeaveRoom();
                onBackHome();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              MENU UTAMA
            </button>
          </div>
        </div>

        {lastError && (
          <div className="mb-4 bg-rose-500/15 border border-rose-500/50 text-rose-200 px-4 py-2.5 rounded-xl text-xs md:text-sm flex items-center justify-between">
            <span>{lastError}</span>
            <button
              onClick={onClearError}
              className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-xs font-bold cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}

        {!roomCode ? (
          /* CREATE OR JOIN VIEW */
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 flex-1 min-h-0 items-center">
            <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Create Room Card */}
              <div className="bg-[#091229]/95 border border-sky-500/40 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-xl">
                <div>
                  <div className="w-11 h-11 rounded-xl bg-sky-500/15 border border-sky-400/40 flex items-center justify-center mb-3">
                    <Plus className="w-6 h-6 text-sky-400" />
                  </div>
                  <h2 className="font-display text-lg font-bold text-white">Buat Room Baru</h2>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    Buat ruang misi privat, bagikan kode 6 huruf ke teman sekelas, dan jadilah Host yang memulai permainan.
                  </p>
                </div>
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    onCreateRoom();
                  }}
                  className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-display font-bold text-sm cursor-pointer shadow-lg shadow-sky-500/25"
                >
                  CREATE ROOM
                </button>
              </div>

              {/* Join Room Card */}
              <div className="bg-[#091229]/95 border border-emerald-500/40 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-xl">
                <div>
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center mb-3">
                    <Users className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h2 className="font-display text-lg font-bold text-white">Gabung Room</h2>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    Masukkan kode Room dari Host untuk bergabung ke lobi stasiun yang sama secara real-time.
                  </p>
                </div>
                <div className="space-y-2.5">
                  <input
                    type="text"
                    maxLength={6}
                    value={joinInput}
                    onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
                    placeholder="KODE ROOM (CONTOH: AB12CD)"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-400 outline-none rounded-xl px-3.5 py-2.5 text-sm font-mono-num font-bold tracking-widest text-white uppercase text-center"
                  />
                  <button
                    disabled={joinInput.trim().length < 4}
                    onClick={() => {
                      soundEngine.playClick();
                      onJoinRoom(joinInput);
                    }}
                    className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-display font-bold text-sm cursor-pointer"
                  >
                    JOIN ROOM
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Profile & Rules */}
            <div className="md:col-span-5 bg-[#091229]/95 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <p className="text-xs text-slate-400">Astronaut Kamu</p>
                  <h3 className="font-display text-lg font-bold text-white">{character.name}</h3>
                </div>
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    onOpenCustomize();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-semibold cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Ubah Tampilan
                </button>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300">
                <p className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  Aturan Social Deduction Edukatif:
                </p>
                <p>• <strong className="text-sky-300">Crewmate</strong> menjelajahi 11 ruangan dan menyelesaikan misi Sosiologi untuk memulihkan Global Network.</p>
                <p>• <strong className="text-rose-300">1 Impostor</strong> dipilih acak secara rahasia. Impostor dapat memakai <strong>Vent System</strong>, menyelesaikan tantangan sabotase Sosiologi, dan mengirim kru ke Kapsul Stasis.</p>
                <p>• Gunakan tombol <strong>Emergency Meeting</strong> di Central Lobby atau laporkan Kapsul Stasis untuk berdiskusi dan voting!</p>
              </div>
            </div>
          </div>
        ) : (
          /* INSIDE ROOM LOBBY */
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 flex-1 min-h-0">
            {/* Left: Player Roster */}
            <div className="md:col-span-8 bg-[#091229]/95 border border-sky-500/35 rounded-2xl p-5 flex flex-col min-h-0">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-950 border border-sky-500/40 rounded-xl px-4 py-2 flex items-center gap-2.5">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">KODE ROOM</p>
                      <p className="font-mono-num text-xl font-extrabold text-sky-300 tracking-widest">
                        {roomCode}
                      </p>
                    </div>
                    <button
                      onClick={handleCopyCode}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                      title="Salin Kode Room"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-sky-400" />
                      {players.length} / 10 Pemain di Lobby
                    </p>
                    <p className="text-xs text-slate-400">Minimal 2 pemain untuk memulai misi multiplayer</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {voiceControls && (
                    <>
                      <button
                        onClick={() => {
                          soundEngine.playClick();
                          voiceControls.onToggleMic();
                        }}
                        disabled={!voiceEnabled}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer ${
                          !voiceEnabled
                            ? 'bg-slate-900 border-slate-700 text-slate-500 cursor-not-allowed'
                            : voiceControls.micOn
                              ? voiceControls.muted
                                ? 'bg-amber-500/20 border-amber-400/60 text-amber-200'
                                : voiceControls.speaking
                                  ? 'bg-emerald-500 border-emerald-200 text-slate-950'
                                  : 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200'
                              : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-200'
                        }`}
                      >
                        {voiceControls.micOn && !voiceControls.muted ? (
                          <Mic className="w-3.5 h-3.5" />
                        ) : (
                          <MicOff className="w-3.5 h-3.5" />
                        )}
                        {voiceControls.micOn ? (voiceControls.speaking && !voiceControls.muted ? 'Bicara' : 'Mic On') : 'On Mic'}
                      </button>

                      {voiceControls.micOn && (
                        <button
                          onClick={() => {
                            soundEngine.playClick();
                            voiceControls.onToggleMute();
                          }}
                          className={`px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer ${
                            voiceControls.muted
                              ? 'bg-rose-600 border-rose-300 text-white'
                              : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-200'
                          }`}
                        >
                          {voiceControls.muted ? 'Unmute' : 'Mute'}
                        </button>
                      )}
                    </>
                  )}

                  <button
                    onClick={() => {
                      soundEngine.playClick();
                      onLeaveRoom();
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-xs font-semibold cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Leave Room
                  </button>
                </div>
              </div>

              {voiceControls?.micError && (
                <div className="mb-3 bg-rose-950/90 border border-rose-500/50 text-rose-200 px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 shrink-0">
                  <span>{voiceControls.micError}</span>
                  <button onClick={voiceControls.onClearMicError} className="underline cursor-pointer">
                    Tutup
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto sci-scroll pr-1 flex-1 content-start">
                {players.map((p) => {
                  const col = PLAYER_COLORS.find((c) => c.id === p.character.color) || PLAYER_COLORS[1];
                  const isMe = p.id === playerId;
                  const pMicOn = isMe ? Boolean(voiceControls?.micOn) : Boolean(p.voice?.micOn);
                  const pMuted = isMe ? Boolean(voiceControls?.muted) : Boolean(p.voice?.muted);
                  const pSpeaking = isMe
                    ? Boolean(voiceControls?.micOn && !voiceControls?.muted && voiceControls?.speaking)
                    : Boolean(p.voice?.micOn && !p.voice?.muted && p.voice?.speaking);
                  const locallyMuted = Boolean(voiceControls?.locallyMutedIds.includes(p.id));
                  return (
                    <div
                      key={p.id}
                      className={`rounded-xl border p-3.5 flex items-center justify-between gap-3 ${
                        isMe ? 'bg-sky-500/10 border-sky-400' : 'bg-slate-900/80 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-9 h-9 rounded-full border-2 shrink-0 shadow ${
                            pSpeaking ? 'border-emerald-400 ring-2 ring-emerald-400/50' : 'border-white/30'
                          }`}
                          style={{ backgroundColor: col.hex }}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                            {p.name}
                            {isMe && <span className="text-[11px] text-sky-300">(Kamu)</span>}
                            {p.isHost && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                            {pSpeaking && <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />}
                            {pMicOn && pMuted && <MicOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {col.label} · {p.character.costume.replace('_', ' ')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {!isMe && voiceControls && (
                          <button
                            onClick={() => voiceControls.onToggleLocalMutePeer(p.id)}
                            title={locallyMuted ? 'Buka Suara' : 'Bisukan Pemain'}
                            className={`p-1.5 rounded-lg cursor-pointer ${
                              locallyMuted
                                ? 'bg-rose-500/20 text-rose-300'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                            }`}
                          >
                            {locallyMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                          </button>
                        )}
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 ${
                            p.isHost
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
                              : p.ready
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {p.isHost ? 'HOST' : p.ready ? 'SIAP' : 'MENUNGGU'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Controls */}
            <div className="md:col-span-4 bg-[#091229]/95 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  Persiapan Misi
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Pastikan seluruh pemain di room menekan tombol <strong>SIAP</strong>. Saat permainan dimulai, server akan mengacak secara rahasia 1 pemain sebagai <strong>Impostor</strong> dan lainnya sebagai <strong>Crewmate</strong>.
                </p>
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 space-y-1">
                  <p><span className="text-slate-400">Nama Kru:</span> <strong className="text-white">{character.name}</strong></p>
                  <p><span className="text-slate-400">Kostum:</span> {character.costume}</p>
                  <button
                    onClick={() => {
                      soundEngine.playClick();
                      onOpenCustomize();
                    }}
                    className="mt-2 w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-semibold cursor-pointer"
                  >
                    Kustomisasi Karakter
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                {!isHost && (
                  <button
                    onClick={() => {
                      soundEngine.playClick();
                      onToggleReady();
                    }}
                    className={`w-full py-3.5 rounded-xl font-display font-bold text-sm cursor-pointer ${
                      me?.ready
                        ? 'bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                    }`}
                  >
                    {me?.ready ? 'SUDAH SIAP (BATALKAN)' : 'TANDAI SIAP'}
                  </button>
                )}

                {isHost && (
                  <button
                    disabled={!canStart}
                    onClick={() => {
                      soundEngine.playClick();
                      onStartGame();
                    }}
                    className="w-full py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-display font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-sky-500/20"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    {players.length < 2
                      ? 'BUTUH MIN. 2 PEMAIN'
                      : !allNonHostReady
                        ? 'TUNGGU SEMUA SIAP'
                        : 'MULAI PERMAINAN'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
