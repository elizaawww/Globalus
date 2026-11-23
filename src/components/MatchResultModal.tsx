import React, { useEffect } from 'react';
import { Award, Home, RotateCcw, ShieldCheck, Skull } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { MatchResultSummary } from '../types/game';

interface MatchResultModalProps {
  result: MatchResultSummary;
  myId: string;
  onReturnToLobby: () => void;
  onBackHome: () => void;
}

export const MatchResultModal: React.FC<MatchResultModalProps> = ({
  result,
  myId,
  onReturnToLobby,
  onBackHome,
}) => {
  const crewWon = result.winner === 'crewmate';
  const me = result.players.find((p) => p.id === myId);
  const didIWin = me ? (crewWon ? me.role !== 'impostor' : me.role === 'impostor') : crewWon;

  useEffect(() => {
    soundEngine.setMusicMode('none');
    if (didIWin) soundEngine.playVictory();
    else soundEngine.playDefeat();
  }, [didIWin]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/92 flex items-center justify-center p-4">
      <div
        className={`w-full max-w-2xl bg-[#080f24] border-2 rounded-2xl p-6 shadow-2xl space-y-5 ${
          crewWon ? 'border-sky-400/70' : 'border-rose-500/70'
        }`}
      >
        <div className="text-center space-y-2">
          <div
            className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center border ${
              crewWon
                ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                : 'bg-rose-500/20 border-rose-400 text-rose-300'
            }`}
          >
            {crewWon ? <ShieldCheck className="w-8 h-8" /> : <Skull className="w-8 h-8" />}
          </div>
          <p
            className={`text-xs font-bold uppercase tracking-widest ${
              crewWon ? 'text-sky-400' : 'text-rose-400'
            }`}
          >
            PERTANDINGAN MULTIPLAYER SELESAI
          </p>
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-white">
            {crewWon ? 'CREWMATE MENANG!' : 'IMPOSTOR MENANG!'}
          </h2>
          <p className="text-xs md:text-sm text-slate-300">{result.reason}</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-slate-400">Identitas Impostor: </span>
            <strong className="text-rose-400 font-display text-sm">
              {result.impostorNames && result.impostorNames.length > 0
                ? result.impostorNames.join(', ')
                : result.impostorName}
            </strong>
          </div>
          <div className="flex gap-4 font-mono-num text-slate-300">
            <span>Misi Kru: {result.crewMissionDone}/{result.crewMissionTotal}</span>
            <span>Sabotase Impostor: {result.impostorObjectiveDone}/{result.impostorObjectiveTotal}</span>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="space-y-2 max-h-56 overflow-y-auto sci-scroll pr-1">
          {result.players.map((p) => (
            <div
              key={p.id}
              className={`rounded-xl border px-4 py-2.5 flex items-center justify-between text-xs ${
                p.id === myId ? 'bg-sky-500/10 border-sky-400/60' : 'bg-slate-900/70 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                    p.role === 'impostor'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : p.role === 'peramal'
                        ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                        : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  }`}
                >
                  {p.role}
                </span>
                <span className="font-bold text-white">
                  {p.name} {p.id === myId ? '(Kamu)' : ''}
                </span>
                {!p.alive && <span className="text-slate-400">(Stasis)</span>}
              </div>

              <div className="flex items-center gap-4 font-mono-num">
                <span className="text-slate-300">Misi: {p.completedMissions}</span>
                <span className="text-amber-300 font-bold flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" />
                  {p.eduScore} Poin
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <button
            onClick={() => {
              soundEngine.playClick();
              onReturnToLobby();
            }}
            className="flex-1 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-display font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            KEMBALI KE LOBBY ROOM
          </button>
          <button
            onClick={() => {
              soundEngine.playClick();
              onBackHome();
            }}
            className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            MENU UTAMA
          </button>
        </div>
      </div>
    </div>
  );
};
