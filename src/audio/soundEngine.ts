import { GameSettings, MusicTrackId } from '../types/game';

export type MusicMode = 'none' | 'home' | 'gameplay' | 'cutscene' | 'discussion';

export interface MusicTrackDef {
  id: MusicTrackId;
  title: string;
  genre: string;
  stepSec: number;
  licenseNote: string;
}

export const MUSIC_TRACKS: MusicTrackDef[] = [
  {
    id: 'cosmic_drift',
    title: 'Cosmic Drift',
    genre: 'Space Ambient',
    stepSec: 0.56,
    licenseNote: 'Audio Bebas Royalti · Offline',
  },
  {
    id: 'nusantara_gamelan',
    title: 'Nusantara Harmoni',
    genre: 'Indonesia · Pentatonis Synth',
    stepSec: 0.42,
    licenseNote: 'Audio Bebas Royalti · Offline',
  },
  {
    id: 'seoul_neon',
    title: 'Seoul Neon Groove',
    genre: 'K-Pop Vibe · Synth-Pop',
    stepSec: 0.34,
    licenseNote: 'Audio Bebas Royalti · Offline',
  },
  {
    id: 'western_sunset',
    title: 'Western Sunset Lo-Fi',
    genre: 'Western Vibe · Chill Beats',
    stepSec: 0.48,
    licenseNote: 'Audio Bebas Royalti · Offline',
  },
  {
    id: 'tension_protocol',
    title: 'Starlight Protocol',
    genre: 'Electronic · Stasis Pulse',
    stepSec: 0.38,
    licenseNote: 'Audio Bebas Royalti · Offline',
  },
];

export function normalizeMusicTrackId(track?: string): MusicTrackId {
  if (track === 'nebula_pulse') return 'seoul_neon';
  if (track === 'orbit_lofi') return 'western_sunset';
  if (track === 'starlight_house') return 'nusantara_gamelan';
  if (track && MUSIC_TRACKS.some((t) => t.id === track)) {
    return track as MusicTrackId;
  }
  return 'cosmic_drift';
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicDuckGain: GainNode | null = null;
  private musicFilter: BiquadFilterNode | null = null;
  private musicCompressor: DynamicsCompressorNode | null = null;
  private sfxGain: GainNode | null = null;

  private musicVolume = 0.45;
  private sfxVolume = 0.7;
  private muted = false;
  private musicMuted = false;
  private musicPaused = false;
  private currentTrack: MusicTrackId = 'cosmic_drift';
  private cutsceneDuckActive = false;
  private voiceDuckActive = false;
  private currentMode: MusicMode = 'none';

  // Sample-accurate Web Audio Lookahead Scheduler (prevents interval jitter & static)
  private schedulerTimer: number | null = null;
  private nextStepTime = 0;
  private stepIndex = 0;
  private musicDuckUntil = 0;
  private lastSfxTime = new Map<string, number>();

  private nowMs(): number {
    return typeof performance !== 'undefined' ? performance.now() : Date.now();
  }

  private canPlay(key: string, cooldownMs: number): boolean {
    const now = this.nowMs();
    const prev = this.lastSfxTime.get(key) ?? -Infinity;
    if (now - prev < cooldownMs) return false;
    this.lastSfxTime.set(key, now);
    return true;
  }

  private duckMusic(durationMs: number) {
    this.musicDuckUntil = Math.max(this.musicDuckUntil, this.nowMs() + durationMs);
    this.applyDuckLevel();
  }

  public setCutsceneDucking(active: boolean) {
    if (this.cutsceneDuckActive === active) return;
    this.cutsceneDuckActive = active;
    this.applyDuckLevel();
  }

  public setVoiceDucking(active: boolean) {
    if (this.voiceDuckActive === active) return;
    this.voiceDuckActive = active;
    this.applyDuckLevel();
  }

  private applyDuckLevel() {
    if (!this.ctx || !this.musicDuckGain) return;
    const now = this.ctx.currentTime;
    let duck = 1.0;
    if (this.voiceDuckActive) {
      duck = Math.min(duck, 0.2);
    }
    if (this.cutsceneDuckActive) {
      duck = Math.min(duck, 0.32);
    }
    if (this.nowMs() < this.musicDuckUntil) {
      duck = Math.min(duck, 0.3);
    }
    this.musicDuckGain.gain.setTargetAtTime(duck, now, 0.14);
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.musicDuckGain = this.ctx.createGain();

      this.musicFilter = this.ctx.createBiquadFilter();
      this.musicFilter.type = 'lowpass';
      this.musicFilter.frequency.value = 2400;
      this.musicFilter.Q.value = 0.5;

      this.musicCompressor = this.ctx.createDynamicsCompressor();
      this.musicCompressor.threshold.value = -16;
      this.musicCompressor.knee.value = 18;
      this.musicCompressor.ratio.value = 6;
      this.musicCompressor.attack.value = 0.008;
      this.musicCompressor.release.value = 0.18;

      this.sfxGain = this.ctx.createGain();

      this.musicFilter.connect(this.musicCompressor);
      this.musicCompressor.connect(this.musicDuckGain);
      this.musicDuckGain.connect(this.musicGain);
      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
      this.applyVolumes();
      this.applyDuckLevel();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlock() {
    this.ensureContext();
  }

  public updateSettings(
    settings: Pick<GameSettings, 'musicVolume' | 'sfxVolume' | 'muted' | 'musicTrack' | 'musicPaused' | 'musicMuted'>
  ) {
    const prevTrack = this.currentTrack;
    const prevPaused = this.musicPaused;
    this.musicVolume = settings.musicVolume;
    this.sfxVolume = settings.sfxVolume;
    this.muted = settings.muted;
    this.musicMuted = Boolean(settings.musicMuted);
    this.musicPaused = Boolean(settings.musicPaused);
    this.currentTrack = normalizeMusicTrackId(settings.musicTrack);
    this.applyVolumes();
    if (prevTrack !== this.currentTrack || prevPaused !== this.musicPaused) {
      const m = this.currentMode;
      this.currentMode = 'none';
      this.setMusicMode(m);
    }
  }

  private applyVolumes() {
    if (!this.ctx || !this.masterGain || !this.musicGain || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 1, now, 0.04);
    const effectiveMusic = this.muted || this.musicMuted || this.musicPaused ? 0 : this.musicVolume * 0.28;
    this.musicGain.gain.setTargetAtTime(effectiveMusic, now, 0.09);
    this.sfxGain.gain.setTargetAtTime(this.sfxVolume * 0.6, now, 0.04);
  }

  private scheduleToneAt(
    freq: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    target: 'sfx' | 'music',
    startTime: number,
    slideToFreq?: number
  ) {
    const ctx = this.ctx;
    if (!ctx || !this.sfxGain || !this.musicFilter) return;
    if (this.muted) return;
    if (target === 'sfx' && this.sfxVolume <= 0.01) return;
    if (target === 'music' && (this.musicMuted || this.musicPaused || this.musicVolume <= 0.01)) return;

    const safeStart = Math.max(ctx.currentTime + 0.005, startTime);
    const safeDur = Math.max(0.05, duration);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Never use harsh unfiltered sawtooth in background music
    osc.type = target === 'music' && type === 'sawtooth' ? 'triangle' : type;
    osc.frequency.setValueAtTime(Math.max(24, freq), safeStart);
    if (slideToFreq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(24, slideToFreq), safeStart + safeDur);
    }

    const attack = target === 'music' ? Math.min(0.045, safeDur * 0.25) : Math.min(0.018, safeDur * 0.2);
    const release = target === 'music' ? Math.min(0.09, safeDur * 0.35) : Math.min(0.04, safeDur * 0.3);
    const peakTime = safeStart + attack;
    const sustainEnd = Math.max(peakTime + 0.005, safeStart + safeDur - release);
    const endTime = safeStart + safeDur;

    gain.gain.setValueAtTime(0.0001, safeStart);
    gain.gain.linearRampToValueAtTime(Math.max(0.0004, volume), peakTime);
    gain.gain.setValueAtTime(Math.max(0.0004, volume * 0.92), sustainEnd);
    gain.gain.linearRampToValueAtTime(0.0001, endTime);

    osc.connect(gain);
    gain.connect(target === 'sfx' ? this.sfxGain : this.musicFilter);

    osc.start(safeStart);
    osc.stop(endTime + 0.02);
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    target: 'sfx' | 'music',
    delay = 0,
    slideToFreq?: number
  ) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.scheduleToneAt(freq, duration, type, volume, target, ctx.currentTime + delay, slideToFreq);
  }

  private playNoise(duration: number, volume: number, filterFreq: number, delay = 0, bandPass = false) {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.muted || this.sfxVolume <= 0.01) return;

    const sampleCount = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sampleCount; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = bandPass ? 'bandpass' : 'lowpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = bandPass ? 1.8 : 0.8;

    const gain = ctx.createGain();
    const startTime = ctx.currentTime + delay;
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + Math.min(0.018, duration * 0.2));
    gain.gain.linearRampToValueAtTime(0.0001, startTime + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    src.start(startTime);
    src.stop(startTime + duration + 0.02);
  }

  public playHover() {
    if (!this.canPlay('hover', 75)) return;
    this.playTone(620, 0.05, 'sine', 0.11, 'sfx', 0, 740);
  }

  public playClick() {
    if (!this.canPlay('click', 65)) return;
    this.playTone(540, 0.065, 'triangle', 0.2, 'sfx', 0, 860);
  }

  public playGameStart() {
    if (!this.canPlay('gameStart', 1200)) return;
    this.duckMusic(1400);
    this.playNoise(0.32, 0.14, 900, 0, true);
    this.playTone(110, 0.55, 'sine', 0.25, 'sfx', 0, 55);
    this.playTone(220, 0.45, 'triangle', 0.2, 'sfx', 0.05);
    this.playTone(329.63, 0.45, 'sine', 0.18, 'sfx', 0.12);
    this.playTone(440, 0.52, 'triangle', 0.2, 'sfx', 0.2);
    this.playTone(659.25, 0.65, 'sine', 0.18, 'sfx', 0.28);
  }

  public playDoorOpen() {
    if (!this.canPlay('doorOpen', 650)) return;
    this.playNoise(0.14, 0.07, 1200, 0, true);
    this.playTone(175, 0.22, 'sine', 0.16, 'sfx', 0, 310);
    this.playTone(330, 0.17, 'triangle', 0.09, 'sfx', 0.06, 510);
  }

  public playInteract() {
    if (!this.canPlay('interact', 140)) return;
    this.playTone(460, 0.085, 'sine', 0.2, 'sfx', 0);
    this.playTone(690, 0.11, 'sine', 0.18, 'sfx', 0.065);
  }

  public playMissionStart() {
    if (!this.canPlay('missionStart', 300)) return;
    this.playTone(392, 0.11, 'triangle', 0.19, 'sfx', 0);
    this.playTone(523.25, 0.13, 'triangle', 0.2, 'sfx', 0.085);
    this.playTone(783.99, 0.19, 'sine', 0.2, 'sfx', 0.17);
  }

  public playTaskComplete() {
    if (!this.canPlay('taskComplete', 700)) return;
    this.playTone(659.25, 0.12, 'triangle', 0.22, 'sfx', 0);
    this.playTone(880.0, 0.16, 'triangle', 0.23, 'sfx', 0.085);
    this.playTone(1318.51, 0.28, 'sine', 0.2, 'sfx', 0.17);
    this.playTone(1760.0, 0.24, 'sine', 0.1, 'sfx', 0.21);
  }

  public playSuccess() {
    if (!this.canPlay('success', 260)) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.2, 'triangle', 0.2, 'sfx', idx * 0.075);
    });
  }

  public playError() {
    if (!this.canPlay('error', 260)) return;
    this.playTone(225, 0.15, 'triangle', 0.16, 'sfx', 0, 155);
    this.playTone(165, 0.21, 'triangle', 0.16, 'sfx', 0.11, 118);
  }

  public playDialogueBlip(pitchOffset = 0) {
    if (!this.canPlay('blip', 45)) return;
    this.playTone(460 + pitchOffset, 0.045, 'sine', 0.1, 'sfx', 0, 500 + pitchOffset);
  }

  public playCharacterAppear() {
    if (!this.canPlay('charAppear', 500)) return;
    this.playTone(220, 0.5, 'sine', 0.2, 'sfx', 0, 440);
    this.playTone(330, 0.5, 'triangle', 0.16, 'sfx', 0.12, 660);
    this.playTone(880, 0.42, 'sine', 0.14, 'sfx', 0.28);
  }

  public playRewardFanfare() {
    if (!this.canPlay('rewardFanfare', 800)) return;
    this.duckMusic(1100);
    const arp = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    arp.forEach((freq, i) => {
      this.playTone(freq, 0.34, 'triangle', 0.21, 'sfx', i * 0.085);
    });
  }

  public playFootstep(isSprinting = false) {
    const cooldown = isSprinting ? 210 : 300;
    if (!this.canPlay('footstep', cooldown)) return;
    const base = isSprinting ? 128 : 108;
    const jitter = (Math.random() - 0.5) * 16;
    this.playNoise(0.04, isSprinting ? 0.045 : 0.032, 650, 0, true);
    this.playTone(base + jitter, 0.05, 'triangle', isSprinting ? 0.1 : 0.08, 'sfx', 0, 62);
  }

  public playJump() {
    if (!this.canPlay('jump', 160)) return;
    this.playTone(230, 0.14, 'sine', 0.18, 'sfx', 0, 520);
    this.playTone(360, 0.1, 'triangle', 0.1, 'sfx', 0.03, 640);
  }

  public playEmote() {
    if (!this.canPlay('emote', 220)) return;
    this.playTone(523.25, 0.09, 'sine', 0.15, 'sfx', 0);
    this.playTone(659.25, 0.12, 'triangle', 0.15, 'sfx', 0.06);
  }

  public playVent() {
    if (!this.canPlay('vent', 450)) return;
    this.playNoise(0.24, 0.13, 1400, 0, true);
    this.playTone(135, 0.17, 'triangle', 0.16, 'sfx', 0, 295);
    this.playTone(320, 0.22, 'triangle', 0.14, 'sfx', 0.075, 110);
  }

  public playImpostorAction() {
    if (!this.canPlay('impostorAction', 450)) return;
    this.playTone(146.83, 0.22, 'triangle', 0.16, 'sfx', 0, 110);
    this.playTone(207.65, 0.26, 'triangle', 0.15, 'sfx', 0.06, 155.56);
    this.playTone(92.5, 0.34, 'sine', 0.2, 'sfx', 0.12, 65);
  }

  public playMeetingAlarm(reason: 'emergency' | 'report' = 'emergency') {
    if (!this.canPlay('meetingAlarm', 1600)) return;
    this.duckMusic(1400);
    if (reason === 'report') {
      [0, 0.21, 0.42].forEach((delay) => {
        this.playTone(740, 0.15, 'triangle', 0.2, 'sfx', delay, 520);
        this.playTone(987.77, 0.14, 'sine', 0.15, 'sfx', delay + 0.03, 740);
      });
    } else {
      [0, 0.26, 0.52].forEach((delay) => {
        this.playTone(620, 0.19, 'triangle', 0.2, 'sfx', delay, 460);
        this.playTone(880, 0.17, 'sine', 0.15, 'sfx', delay + 0.04, 650);
      });
    }
  }

  public playVoteLock() {
    if (!this.canPlay('voteLock', 300)) return;
    this.playTone(587.33, 0.08, 'triangle', 0.2, 'sfx', 0);
    this.playTone(880, 0.14, 'sine', 0.18, 'sfx', 0.065);
  }

  public playVoteEject(wasEjected = true) {
    if (!this.canPlay('voteEject', 1200)) return;
    this.duckMusic(1200);
    if (wasEjected) {
      this.playNoise(0.55, 0.15, 950, 0, true);
      this.playTone(440, 0.55, 'triangle', 0.18, 'sfx', 0, 110);
      this.playTone(130.81, 0.65, 'sine', 0.22, 'sfx', 0.18, 55);
    } else {
      this.playTone(392, 0.18, 'sine', 0.16, 'sfx', 0);
      this.playTone(349.23, 0.26, 'triangle', 0.15, 'sfx', 0.14);
    }
  }

  public playEliminate() {
    if (!this.canPlay('eliminate', 650)) return;
    this.duckMusic(900);
    this.playNoise(0.18, 0.18, 600, 0, false);
    this.playTone(190, 0.34, 'triangle', 0.2, 'sfx', 0, 62);
    this.playTone(430, 0.26, 'sine', 0.2, 'sfx', 0.02, 130);
    this.playTone(110, 0.45, 'sine', 0.22, 'sfx', 0.08, 55);
  }

  public playVictory() {
    if (!this.canPlay('victory', 1800)) return;
    this.duckMusic(2400);
    const melody = [
      { f: 523.25, d: 0.18, t: 0 },
      { f: 659.25, d: 0.18, t: 0.14 },
      { f: 783.99, d: 0.2, t: 0.28 },
      { f: 1046.5, d: 0.55, t: 0.44 },
      { f: 987.77, d: 0.18, t: 0.85 },
      { f: 1046.5, d: 0.72, t: 1.02 },
    ];
    melody.forEach((n) => {
      this.playTone(n.f, n.d, 'triangle', 0.21, 'sfx', n.t);
      this.playTone(n.f * 0.5, n.d, 'sine', 0.13, 'sfx', n.t);
    });
  }

  public playDefeat() {
    if (!this.canPlay('defeat', 1800)) return;
    this.duckMusic(2400);
    const notes = [
      { f: 392.0, d: 0.28, t: 0 },
      { f: 349.23, d: 0.28, t: 0.26 },
      { f: 311.13, d: 0.32, t: 0.52 },
      { f: 261.63, d: 0.85, t: 0.82 },
    ];
    notes.forEach((n) => {
      this.playTone(n.f, n.d, 'triangle', 0.14, 'sfx', n.t);
      this.playTone(n.f * 0.5, n.d + 0.1, 'sine', 0.2, 'sfx', n.t);
    });
  }

  private scheduleMusicStep(mode: MusicMode, time: number, stepIdx: number) {
    if (this.muted || this.musicMuted || this.musicPaused || this.musicVolume <= 0.01) return;
    if (this.nowMs() < this.musicDuckUntil) return;

    if (mode === 'home') {
      const chords = [
        [130.81, 196.0, 246.94, 293.66],
        [110.0, 164.81, 220.0, 261.63],
        [174.61, 220.0, 261.63, 329.63],
        [146.83, 220.0, 261.63, 329.63],
      ];
      const chord = chords[stepIdx % chords.length];
      chord.forEach((f, idx) => {
        this.scheduleToneAt(f, 1.1, 'sine', 0.07, 'music', time + idx * 0.055);
      });
      return;
    }

    if (mode === 'discussion') {
      const pulseBass = [110.0, 110.0, 103.83, 110.0, 116.54, 110.0, 103.83, 98.0];
      const tensionHigh = [329.63, 0, 311.13, 0, 349.23, 0, 466.16, 0];
      const idx = stepIdx % pulseBass.length;
      this.scheduleToneAt(pulseBass[idx] * 0.5, 0.2, 'triangle', 0.11, 'music', time);
      const high = tensionHigh[idx];
      if (high > 0) {
        this.scheduleToneAt(high, 0.38, 'sine', 0.055, 'music', time + 0.04);
      }
      return;
    }

    if (mode === 'cutscene') {
      const cinematic = [
        [110.0, 220.0, 329.63],
        [130.81, 261.63, 392.0],
        [146.83, 293.66, 440.0],
        [123.47, 246.94, 369.99],
      ];
      const c = cinematic[stepIdx % cinematic.length];
      c.forEach((f, idx) => {
        this.scheduleToneAt(f, 0.92, 'sine', 0.065, 'music', time + idx * 0.04);
      });
      return;
    }

    // Gameplay tracks — clean filtered oscillators with zero static/clipping
    const track = this.currentTrack;
    if (track === 'nusantara_gamelan') {
      // Indonesia · Pelog pentatonic warm chime + steady gong root
      const pelogLead = [293.66, 329.63, 440.0, 493.88, 587.33, 493.88, 440.0, 329.63];
      const gongBass = [146.83, 0, 146.83, 0, 110.0, 0, 130.81, 0];
      const idx = stepIdx % pelogLead.length;
      if (gongBass[idx] > 0) {
        this.scheduleToneAt(gongBass[idx] * 0.5, 0.72, 'sine', 0.12, 'music', time);
      }
      this.scheduleToneAt(pelogLead[idx], 0.38, 'sine', 0.085, 'music', time);
      if (idx % 2 === 0) {
        this.scheduleToneAt(pelogLead[idx] * 2, 0.24, 'triangle', 0.032, 'music', time + 0.04);
      }
    } else if (track === 'seoul_neon') {
      // K-Pop Vibe · Bright upbeat synth-pop major-7th groove
      const bass = [87.31, 87.31, 98.0, 110.0, 130.81, 130.81, 98.0, 87.31];
      const lead = [349.23, 440.0, 523.25, 659.25, 587.33, 523.25, 493.88, 440.0];
      const idx = stepIdx % bass.length;
      this.scheduleToneAt(bass[idx], 0.28, 'triangle', 0.1, 'music', time);
      this.scheduleToneAt(lead[idx], 0.25, 'sine', 0.075, 'music', time + 0.01);
      if (stepIdx % 2 === 1) {
        this.scheduleToneAt(lead[(idx + 2) % lead.length], 0.19, 'triangle', 0.04, 'music', time + 0.09);
      }
    } else if (track === 'western_sunset') {
      // Western Vibe · Mellow warm Rhodes 7th chords + chill bell motif
      const chords = [
        [174.61, 220.0, 261.63, 329.63], // Fmaj7
        [164.81, 196.0, 246.94, 293.66], // Em7
        [146.83, 174.61, 220.0, 261.63], // Dm7
        [130.81, 164.81, 196.0, 246.94], // Cmaj7
      ];
      const step = stepIdx % 8;
      if (step % 2 === 0) {
        const c = chords[(stepIdx >> 1) % chords.length];
        c.forEach((f, i) => this.scheduleToneAt(f, 0.85, 'sine', 0.055, 'music', time + i * 0.03));
      } else {
        const bell = [523.25, 493.88, 440.0, 392.0];
        this.scheduleToneAt(bell[step % bell.length], 0.34, 'triangle', 0.042, 'music', time + 0.04);
      }
    } else if (track === 'tension_protocol') {
      // Electronic · Clean Starlight Pulse
      const pulse = [110.0, 110.0, 103.83, 110.0, 130.81, 110.0, 98.0, 103.83];
      const idx = stepIdx % pulse.length;
      this.scheduleToneAt(pulse[idx] * 0.5, 0.24, 'triangle', 0.11, 'music', time);
      if (stepIdx % 2 === 1) {
        this.scheduleToneAt(pulse[idx] * 2, 0.22, 'sine', 0.05, 'music', time + 0.03);
      }
      if (stepIdx % 4 === 2) {
        this.scheduleToneAt(pulse[idx] * 3, 0.32, 'sine', 0.042, 'music', time + 0.06);
      }
    } else {
      // Cosmic Drift · Space Ambient warm pads & crystal shimmer
      const roots = [130.81, 130.81, 116.54, 116.54, 98.0, 98.0, 103.83, 123.47];
      const shimmer = [261.63, 311.13, 392.0, 466.16, 392.0, 311.13, 349.23, 293.66];
      const idx = stepIdx % roots.length;
      if (stepIdx % 4 === 0) {
        this.scheduleToneAt(roots[idx] * 0.5, 1.8, 'sine', 0.11, 'music', time);
        this.scheduleToneAt(roots[idx] * 1.5, 1.4, 'sine', 0.05, 'music', time + 0.06);
      }
      if (stepIdx % 2 === 0) {
        this.scheduleToneAt(shimmer[idx], 0.48, 'sine', 0.068, 'music', time + 0.03);
      } else if (stepIdx % 8 === 3 || stepIdx % 8 === 7) {
        this.scheduleToneAt(shimmer[idx] * 2, 0.36, 'triangle', 0.036, 'music', time + 0.08);
      }
    }
  }

  public setMusicMode(mode: MusicMode) {
    if (this.currentMode === mode && this.schedulerTimer !== null) return;
    this.currentMode = mode;
    if (this.schedulerTimer !== null) {
      window.clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    this.stepIndex = 0;
    this.setCutsceneDucking(mode === 'cutscene');
    if (mode === 'none' || this.musicPaused) return;

    const trackDef = MUSIC_TRACKS.find((t) => t.id === this.currentTrack) || MUSIC_TRACKS[0];
    const stepSec =
      mode === 'home'
        ? 0.95
        : mode === 'gameplay'
          ? trackDef.stepSec
          : mode === 'discussion'
            ? 0.38
            : 0.85;

    const scheduleAheadSec = 0.16;
    const lookaheadMs = 35;

    this.schedulerTimer = window.setInterval(() => {
      this.applyDuckLevel();
      if (!this.ctx || this.ctx.state !== 'running') return;
      if (this.nextStepTime < this.ctx.currentTime) {
        this.nextStepTime = this.ctx.currentTime + 0.04;
      }
      let guard = 0;
      while (this.nextStepTime < this.ctx.currentTime + scheduleAheadSec && guard < 4) {
        this.scheduleMusicStep(mode, this.nextStepTime, this.stepIndex);
        this.nextStepTime += stepSec;
        this.stepIndex++;
        guard++;
      }
    }, lookaheadMs);
  }
}

export const soundEngine = new SoundEngine();
