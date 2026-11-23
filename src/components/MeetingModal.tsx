import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Clock,
  Eye,
  Headphones,
  MessageSquare,
  Mic,
  MicOff,
  Send,
  ShieldAlert,
  SkipForward,
  Sparkles,
  UserX,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { PLAYER_COLORS } from '../data/gameData';
import { MeetingState, MultiplayerRole, PeramalInspectResult, RemotePlayerPublic } from '../types/game';
import { HudVoiceControls } from './HUD';

interface MeetingModalProps {
  meeting: MeetingState;
  players: RemotePlayerPublic[];
  myId: string;
  myRole?: MultiplayerRole | null;
  myPeramalUsed?: boolean;
  peramalResult?: PeramalInspectResult | null;
  onInspectRole?: (targetId: string) => void;
  onClearPeramalResult?: () => void;
  voiceControls?: HudVoiceControls;
  voiceEnabled?: boolean;
  voiceVolume?: number;
  onToggleVoiceFeature?: () => void;
  onChangeVoiceVolume?: (v: number) => void;
  onSendChat: (text: string) => void;
  onCastVote: (targetId: string) => void;
}

export const MeetingModal: React.FC<MeetingModalProps> = ({
  meeting,
  players,
  myId,
  myRole,
  myPeramalUsed = false,
  peramalResult,
  onInspectRole,
  onClearPeramalResult,
  voiceControls,
  voiceEnabled = true,
  voiceVolume = 0.9,
  onToggleVoiceFeature,
  onChangeVoiceVolume,
  onSendChat,
  onCastVote,
}) => {
  const [chatInput, setChatInput] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(45);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const me = players.find((p) => p.id === myId);
  const amAlive = Boolean(me?.alive);
  const myVote = meeting.votes[myId];

  const resultPlayedRef = useRef(false);

  useEffect(() => {
    soundEngine.playMeetingAlarm(meeting.reason);
    soundEngine.setMusicMode('discussion');
    return () => {
      soundEngine.setMusicMode('gameplay');
    };
  }, [meeting.reason]);

  useEffect(() => {
    if (meeting.resultBanner && !resultPlayedRef.current) {
      resultPlayedRef.current = true;
      soundEngine.playVoteEject(Boolean(meeting.resultBanner.ejectedId));
    }
  }, [meeting.resultBanner]);

  useEffect(() => {
    const updateTimer = () => {
      const rem = Math.max(0, Math.ceil((meeting.endsAt - Date.now()) / 1000));
      setSecondsLeft(rem);
    };
    updateTimer();
    const id = window.setInterval(updateTimer, 300);
    return () => window.clearInterval(id);
  }, [meeting.endsAt]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [meeting.messages.length]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amAlive || !chatInput.trim()) return;
    soundEngine.playClick();
    onSendChat(chatInput.trim());
    setChatInput('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-3 md:p-5">
      <div className="w-full max-w-5xl h-[90vh] max-h-[660px] bg-[#080f24] border-2 border-amber-400/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-amber-500/10 border-b border-amber-500/30 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center">
              {meeting.reason === 'report' ? (
                <ShieldAlert className="w-5 h-5 text-rose-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-base md:text-lg font-extrabold text-white">
                  {meeting.reason === 'report'
                    ? `LAPORAN KAPSUL STASIS: ${meeting.subjectName}`
                    : 'EMERGENCY MEETING — CENTRAL LOBBY'}
                </h2>
                {myRole && (
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      myRole === 'impostor'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : myRole === 'peramal'
                          ? 'bg-violet-500/20 text-violet-300 border-violet-500/40'
                          : 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                    }`}
                  >
                    {myRole}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300">
                Dipanggil oleh <strong className="text-amber-300">{meeting.callerName}</strong> · Lokasi: {meeting.locationName || 'Stasiun'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {voiceControls && (
              <div className="flex items-center gap-1.5 bg-slate-950/90 border border-slate-700 rounded-xl px-2.5 py-1.5">
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    voiceControls.onToggleMic();
                  }}
                  disabled={!voiceEnabled}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                    !voiceEnabled
                      ? 'bg-slate-900 text-slate-500 cursor-not-allowed'
                      : voiceControls.micOn
                        ? voiceControls.muted
                          ? 'bg-amber-500/20 text-amber-200 border border-amber-400/50'
                          : voiceControls.speaking
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/50'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  {voiceControls.micOn && !voiceControls.muted ? (
                    <Mic className="w-3.5 h-3.5" />
                  ) : (
                    <MicOff className="w-3.5 h-3.5" />
                  )}
                  <span>{voiceControls.micOn ? 'Mic On' : 'On Mic'}</span>
                </button>

                {voiceControls.micOn && (
                  <button
                    onClick={() => {
                      soundEngine.playClick();
                      voiceControls.onToggleMute();
                    }}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                      voiceControls.muted
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    {voiceControls.muted ? 'Unmute' : 'Mute'}
                  </button>
                )}

                {onToggleVoiceFeature && (
                  <button
                    onClick={onToggleVoiceFeature}
                    title={voiceEnabled ? 'Matikan Voice Chat' : 'Aktifkan Voice Chat'}
                    className={`p-1 rounded-lg cursor-pointer ${
                      voiceEnabled ? 'text-sky-300 hover:bg-slate-800' : 'text-rose-400 hover:bg-slate-800'
                    }`}
                  >
                    <Headphones className="w-3.5 h-3.5" />
                  </button>
                )}

                {onChangeVoiceVolume && (
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={voiceVolume}
                    onChange={(e) => onChangeVoiceVolume(parseFloat(e.target.value))}
                    title="Volume Voice Chat"
                    className="w-14 accent-sky-400 cursor-pointer hidden sm:block"
                  />
                )}
              </div>
            )}

            <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2">
              <Clock className="w-4 h-4 text-sky-400" />
              <span className="font-mono-num text-base font-bold text-white">{secondsLeft}s</span>
            </div>
          </div>
        </div>

        {voiceControls?.micError && (
          <div className="px-5 py-2 bg-rose-950/90 border-b border-rose-500/40 text-xs text-rose-200 flex items-center justify-between gap-2 shrink-0">
            <span>{voiceControls.micError}</span>
            <button onClick={voiceControls.onClearMicError} className="underline cursor-pointer">
              Tutup
            </button>
          </div>
        )}

        {/* Private Peramal Inspection Result (#51) */}
        {peramalResult && (
          <div className="px-5 py-2.5 bg-violet-950/90 border-b border-violet-400/50 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 text-xs text-violet-100">
              <Sparkles className="w-4 h-4 text-violet-300 shrink-0" />
              <span>
                Hasil Terawangan Rahasia (Hanya Kamu):{' '}
                <strong className="text-white">{peramalResult.targetName}</strong> adalah{' '}
                <strong
                  className={
                    peramalResult.revealedRole === 'impostor'
                      ? 'text-rose-300 uppercase'
                      : peramalResult.revealedRole === 'peramal'
                        ? 'text-violet-300 uppercase'
                        : 'text-sky-300 uppercase'
                  }
                >
                  {peramalResult.revealedRole}
                </strong>
                !
              </span>
            </div>
            {onClearPeramalResult && (
              <button
                type="button"
                onClick={onClearPeramalResult}
                className="text-[11px] text-violet-300 underline cursor-pointer"
              >
                Tutup
              </button>
            )}
          </div>
        )}

        {/* Result Banner if voting just finished */}
        {meeting.resultBanner && (
          <div className="px-5 py-4 bg-sky-500/15 border-b border-sky-400/40 text-center">
            <p className="font-display text-base md:text-lg font-bold text-white">
              {meeting.resultBanner.reasonText}
            </p>
            <p className="text-xs text-sky-300 mt-1">Kembali ke Central Lobby sebentar lagi...</p>
          </div>
        )}

        {/* Body: Left Players Voting, Right Live Chat */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 min-h-0">
          {/* Player Vote Cards */}
          <div className="md:col-span-7 p-4 flex flex-col gap-3 border-b md:border-b-0 md:border-r border-slate-800 min-h-0">
            <div className="flex items-center justify-between text-xs text-slate-400 shrink-0">
              <span>Pilih pemain yang dicurigai sebagai Impostor:</span>
              <span className="font-mono-num">
                Suara masuk: {Object.keys(meeting.votes).length} / {players.filter((p) => p.alive).length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 overflow-y-auto sci-scroll pr-1 flex-1 content-start">
              {players.map((p) => {
                const col = PLAYER_COLORS.find((c) => c.id === p.character.color) || PLAYER_COLORS[1];
                const hasVoted = Boolean(meeting.votes[p.id]);
                const isSelectedByMe = myVote === p.id;
                const votesForThis = Object.values(meeting.votes).filter((v) => v === p.id).length;
                const isMe = p.id === myId;
                const pMicOn = isMe ? Boolean(voiceControls?.micOn) : Boolean(p.voice?.micOn);
                const pMuted = isMe ? Boolean(voiceControls?.muted) : Boolean(p.voice?.muted);
                const pSpeaking = isMe
                  ? Boolean(voiceControls?.micOn && !voiceControls?.muted && voiceControls?.speaking)
                  : Boolean(p.voice?.micOn && !p.voice?.muted && p.voice?.speaking);
                const locallyMuted = Boolean(voiceControls?.locallyMutedIds.includes(p.id));

                return (
                  <div
                    key={p.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                      !p.alive
                        ? 'bg-slate-950/60 border-slate-800/60 opacity-50'
                        : isSelectedByMe
                          ? 'bg-rose-500/15 border-rose-400 text-white'
                          : 'bg-slate-900/80 border-slate-800 hover:border-sky-400/60 text-slate-100'
                    }`}
                  >
                    <button
                      disabled={!amAlive || !p.alive || Boolean(myVote) || Boolean(meeting.resultBanner)}
                      onClick={() => {
                        soundEngine.playVoteLock();
                        onCastVote(p.id);
                      }}
                      className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer disabled:cursor-default"
                    >
                      <span
                        className={`w-8 h-8 rounded-full border-2 shrink-0 ${
                          pSpeaking ? 'border-emerald-400 ring-2 ring-emerald-400/50' : 'border-white/25'
                        }`}
                        style={{ backgroundColor: col.hex }}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate flex items-center gap-1.5">
                          <span>{p.name} {isMe ? '(Kamu)' : ''}</span>
                          {pSpeaking && (
                            <Mic className="w-3 h-3 text-emerald-400 animate-pulse shrink-0" />
                          )}
                          {pMicOn && pMuted && (
                            <MicOff className="w-3 h-3 text-amber-400 shrink-0" />
                          )}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {!p.alive ? 'Dalam Kapsul Stasis' : hasVoted ? 'Sudah Memilih' : 'Menunggu'}
                        </p>
                      </div>
                    </button>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {myRole === 'peramal' &&
                        amAlive &&
                        !isMe &&
                        p.alive &&
                        !myPeramalUsed &&
                        !meeting.resultBanner &&
                        onInspectRole && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              soundEngine.playClick();
                              onInspectRole(p.id);
                            }}
                            title="Terawang Peran Pemain (1x per Match)"
                            className="px-2 py-1 rounded-lg bg-violet-500/20 hover:bg-violet-500/35 border border-violet-400/50 text-violet-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            Terawang
                          </button>
                        )}
                      {!isMe && voiceControls && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            voiceControls.onToggleLocalMutePeer(p.id);
                          }}
                          title={locallyMuted ? 'Buka Suara Pemain' : 'Bisukan Pemain'}
                          className={`p-1.5 rounded-lg cursor-pointer ${
                            locallyMuted
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          {locallyMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      {hasVoted && p.alive && (
                        <Check className="w-4 h-4 text-emerald-400" />
                      )}
                      {!p.alive && <UserX className="w-4 h-4 text-rose-400" />}
                      {meeting.resultBanner && votesForThis > 0 && (
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono-num text-xs font-bold">
                          {votesForThis}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Skip Vote Bar */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
              {!amAlive ? (
                <p className="text-xs text-rose-300">
                  Mode Penonton: Kamu tidak dapat memberikan suara atau mengirim chat diskusi.
                </p>
              ) : myVote ? (
                <p className="text-xs text-emerald-300 font-semibold">
                  Suaramu telah tercatat. Menunggu kru lain selesai memilih...
                </p>
              ) : (
                <button
                  disabled={Boolean(meeting.resultBanner)}
                  onClick={() => {
                    soundEngine.playVoteLock();
                    onCastVote('SKIP');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-bold flex items-center gap-2 cursor-pointer"
                >
                  <SkipForward className="w-4 h-4" />
                  LEWATI VOTING (SKIP)
                </button>
              )}

              {meeting.resultBanner && (
                <span className="text-xs text-slate-400 font-mono-num">
                  Skip: {Object.values(meeting.votes).filter((v) => v === 'SKIP').length}
                </span>
              )}
            </div>
          </div>

          {/* Discussion Chat */}
          <div className="md:col-span-5 p-4 flex flex-col min-h-0 bg-[#060b1c]">
            <p className="text-xs font-bold text-sky-300 flex items-center gap-1.5 mb-2.5 shrink-0">
              <MessageSquare className="w-4 h-4" />
              Diskusi Stasiun Real-Time
            </p>

            <div className="flex-1 overflow-y-auto sci-scroll space-y-2 pr-1">
              {meeting.messages.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-xl px-3 py-2 text-xs ${
                    m.isSystem
                      ? 'bg-amber-500/10 border border-amber-500/30 text-amber-200'
                      : 'bg-slate-900/90 border border-slate-800 text-slate-200'
                  }`}
                >
                  <p className="font-bold text-[11px] mb-0.5" style={{ color: m.senderColor }}>
                    {m.senderName}
                  </p>
                  <p className="leading-relaxed break-words">{m.text}</p>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSend} className="mt-3 flex gap-2 shrink-0">
              <input
                type="text"
                disabled={!amAlive || Boolean(meeting.resultBanner)}
                value={chatInput}
                maxLength={200}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={amAlive ? 'Ketik pesan diskusi...' : 'Mode Penonton'}
                className="flex-1 bg-slate-950 border border-slate-700 focus:border-sky-400 outline-none rounded-xl px-3 py-2 text-xs text-white disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!amAlive || !chatInput.trim() || Boolean(meeting.resultBanner)}
                className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
