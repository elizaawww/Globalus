import { GameSettings, MusicSearchResult, MusicTrackId } from '../types/game';

export type MusicMode = 'none' | 'home' | 'gameplay' | 'cutscene' | 'discussion';

export interface MusicTrackDef {
  id: MusicTrackId;
  title: string;
  genre: string;
  stepSec: number;
  licenseNote: string;
  cycleSteps: number;
}

export interface MusicPlaybackState {
  isExternal: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  isMuted: boolean;
  loading: boolean;
  ended: boolean;
  currentTimeSec: number;
  durationSec: number;
  progress: number;
  error: string | null;
  isPreview: boolean;
  fullDurationSec: number;
}

export const MUSIC_TRACKS: MusicTrackDef[] = [
  {
    id: 'cosmic_drift',
    title: 'Station Hull Ambience',
    genre: 'Space Ambient · Calm Hum',
    stepSec: 1.25,
    licenseNote: 'Audio Bebas Royalti · Offline',
    cycleSteps: 48,
  },
  {
    id: 'nusantara_gamelan',
    title: 'Nusantara Harmoni',
    genre: 'Indonesia · Pentatonis Synth',
    stepSec: 0.46,
    licenseNote: 'Audio Bebas Royalti · Offline',
    cycleSteps: 96,
  },
  {
    id: 'seoul_neon',
    title: 'Seoul Neon Groove',
    genre: 'K-Pop Vibe · Synth-Pop',
    stepSec: 0.38,
    licenseNote: 'Audio Bebas Royalti · Offline',
    cycleSteps: 112,
  },
  {
    id: 'western_sunset',
    title: 'Western Sunset Lo-Fi',
    genre: 'Western Vibe · Chill Beats',
    stepSec: 0.52,
    licenseNote: 'Audio Bebas Royalti · Offline',
    cycleSteps: 84,
  },
  {
    id: 'tension_protocol',
    title: 'Starlight Protocol',
    genre: 'Electronic · Stasis Pulse',
    stepSec: 0.42,
    licenseNote: 'Audio Bebas Royalti · Offline',
    cycleSteps: 96,
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
  private selectedExternalTrack: MusicSearchResult | null = null;
  private externalAudio: HTMLAudioElement | null = null;
  private externalAudioUrl: string | null = null;
  private externalLoading = false;
  private externalEnded = false;
  private externalError: string | null = null;
  private externalCurrentTime = 0;
  private externalDuration = 0;

  private cutsceneDuckActive = false;
  private voiceDuckActive = false;
  private currentMode: MusicMode = 'none';

  // Sample-accurate Web Audio Lookahead Scheduler
  private schedulerTimer: number | null = null;
  private nextStepTime = 0;
  private stepIndex = 0;
  private musicDuckUntil = 0;
  private lastSfxTime = new Map<string, number>();
  private playbackListeners = new Set<(state: MusicPlaybackState) => void>();

  private nowMs(): number {
    return typeof performance !== 'undefined' ? performance.now() : Date.now();
  }

  private emitPlaybackState() {
    if (this.playbackListeners.size === 0) return;
    const snap = this.getPlaybackState();
    this.playbackListeners.forEach((cb) => cb(snap));
  }

  public getPlaybackState(): MusicPlaybackState {
    const isExternal = Boolean(this.selectedExternalTrack?.previewUrl);
    const activeBuiltIn = MUSIC_TRACKS.find((t) => t.id === this.currentTrack) || MUSIC_TRACKS[0];
    const builtInDuration = activeBuiltIn.stepSec * activeBuiltIn.cycleSteps;
    const builtInCurrent =
      ((this.stepIndex % activeBuiltIn.cycleSteps) * activeBuiltIn.stepSec) || 0;

    const currentTimeSec = isExternal ? this.externalCurrentTime : builtInCurrent;
    const durationSec = isExternal
      ? this.externalDuration > 0
        ? this.externalDuration
        : (this.selectedExternalTrack?.previewDurationMs || 30000) / 1000
      : builtInDuration;
    const progress =
      durationSec > 0 ? Math.max(0, Math.min(1, currentTimeSec / durationSec)) : 0;

    const isPlaying =
      this.currentMode !== 'none' &&
      !this.muted &&
      !this.musicMuted &&
      !this.musicPaused &&
      this.musicVolume > 0.01 &&
      (!isExternal || (!this.externalEnded && !this.externalError));

    return {
      isExternal,
      isPlaying,
      isPaused: this.musicPaused,
      isMuted: this.muted || this.musicMuted,
      loading: isExternal ? this.externalLoading : false,
      ended: isExternal ? this.externalEnded : false,
      currentTimeSec,
      durationSec,
      progress,
      error: isExternal ? this.externalError : null,
      isPreview: Boolean(this.selectedExternalTrack?.isPreview ?? isExternal),
      fullDurationSec:
        isExternal && this.selectedExternalTrack?.durationMs
          ? this.selectedExternalTrack.durationMs / 1000
          : durationSec,
    };
  }

  public subscribePlayback(listener: (state: MusicPlaybackState) => void): () => void {
    this.playbackListeners.add(listener);
    listener(this.getPlaybackState());
    return () => {
      this.playbackListeners.delete(listener);
    };
  }

  public seekPlayback(seconds: number) {
    if (!this.externalAudio || !this.selectedExternalTrack?.previewUrl) return;
    const dur =
      Number.isFinite(this.externalAudio.duration) && this.externalAudio.duration > 0
        ? this.externalAudio.duration
        : (this.selectedExternalTrack.previewDurationMs || 30000) / 1000;
    const clamped = Math.max(0, Math.min(dur, seconds));
    try {
      this.externalAudio.currentTime = clamped;
      this.externalCurrentTime = clamped;
      if (clamped < dur - 0.15) {
        this.externalEnded = false;
      }
      this.emitPlaybackState();
    } catch {
      // Ignore seek failures before metadata load
    }
  }

  public replayCurrentTrack() {
    this.externalEnded = false;
    this.externalError = null;
    if (this.externalAudio && this.selectedExternalTrack?.previewUrl) {
      try {
        this.externalAudio.currentTime = 0;
        this.externalCurrentTime = 0;
      } catch {
        // ignore
      }
      this.musicPaused = false;
      this.syncExternalAudioVolume();
    } else {
      this.stepIndex = 0;
      this.nextStepTime = 0;
      this.musicPaused = false;
      const m = this.currentMode;
      this.currentMode = 'none';
      this.setMusicMode(m);
    }
    this.emitPlaybackState();
  }

  private canPlay(key: string, cooldownMs: number): boolean {
    const now = this.nowMs();
    const prev = this.lastSfxTime.get(key) ?? -Infinity;
    if (now - prev < cooldownMs) return false;
    this.lastSfxTime.set(key, now);
    return true;
  }

  private getDuckMultiplier(): number {
    let duck = 1.0;
    if (this.voiceDuckActive) {
      duck = Math.min(duck, 0.22);
    }
    if (this.cutsceneDuckActive) {
      duck = Math.min(duck, 0.34);
    }
    if (this.nowMs() < this.musicDuckUntil) {
      duck = Math.min(duck, 0.32);
    }
    return duck;
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
    const duck = this.getDuckMultiplier();
    if (this.ctx && this.musicDuckGain) {
      this.musicDuckGain.gain.setTargetAtTime(duck, this.ctx.currentTime, 0.16);
    }
    this.syncExternalAudioVolume();
  }

  private ensureExternalAudioElement(): HTMLAudioElement | null {
    if (typeof Audio === 'undefined') return null;
    if (this.externalAudio) return this.externalAudio;

    const audio = new Audio();
    // Never force loop=true (play track from start to finish cleanly)
    audio.loop = false;
    audio.preload = 'auto';
    audio.setAttribute('playsinline', 'true');
    audio.setAttribute('webkit-playsinline', 'true');

    audio.addEventListener('loadstart', () => {
      this.externalLoading = true;
      this.externalError = null;
      this.emitPlaybackState();
    });
    audio.addEventListener('loadedmetadata', () => {
      this.externalLoading = false;
      this.externalDuration =
        Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
      this.emitPlaybackState();
    });
    audio.addEventListener('canplay', () => {
      this.externalLoading = false;
      this.emitPlaybackState();
    });
    audio.addEventListener('timeupdate', () => {
      this.externalCurrentTime = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        this.externalDuration = audio.duration;
      }
      this.emitPlaybackState();
    });
    audio.addEventListener('ended', () => {
      this.externalEnded = true;
      this.externalLoading = false;
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        this.externalCurrentTime = audio.duration;
      }
      this.emitPlaybackState();
    });
    audio.addEventListener('error', () => {
      this.externalLoading = false;
      this.externalError = 'Audio lagu gagal dimuat dari sumber. Coba lagu lain atau pakai audio bawaan.';
      this.emitPlaybackState();
    });

    this.externalAudio = audio;
    return audio;
  }

  private syncExternalAudioVolume() {
    if (!this.externalAudio) return;
    const shouldPlay =
      Boolean(this.selectedExternalTrack?.previewUrl) &&
      this.currentMode !== 'none' &&
      !this.muted &&
      !this.musicMuted &&
      !this.musicPaused &&
      !this.externalEnded &&
      this.musicVolume > 0.01;
    const targetVol = shouldPlay
      ? Math.max(0, Math.min(1, this.musicVolume * 0.68 * this.getDuckMultiplier()))
      : 0;
    this.externalAudio.volume = targetVol;
    if (!shouldPlay) {
      if (!this.externalAudio.paused) this.externalAudio.pause();
    } else if (this.externalAudio.paused && this.externalAudioUrl) {
      this.externalAudio.play().catch(() => {});
    }
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

      // Warm lowpass prevents bright harsh harmonics / speaker buzz on mobile speakers
      this.musicFilter = this.ctx.createBiquadFilter();
      this.musicFilter.type = 'lowpass';
      this.musicFilter.frequency.value = 1120;
      this.musicFilter.Q.value = 0.35;

      // Gentle headroom limiter instead of heavy compression (eliminates rhythmic pumping/"static TV")
      this.musicCompressor = this.ctx.createDynamicsCompressor();
      this.musicCompressor.threshold.value = -14;
      this.musicCompressor.knee.value = 20;
      this.musicCompressor.ratio.value = 2.2;
      this.musicCompressor.attack.value = 0.02;
      this.musicCompressor.release.value = 0.25;

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
    this.syncExternalAudioVolume();
    this.emitPlaybackState();
  }

  public updateSettings(
    settings: Pick<
      GameSettings,
      'musicVolume' | 'sfxVolume' | 'muted' | 'musicTrack' | 'musicPaused' | 'musicMuted' | 'selectedExternalTrack'
    >
  ) {
    const prevTrack = this.currentTrack;
    const prevPaused = this.musicPaused;
    const prevMuted = this.musicMuted || this.muted;
    const prevExtUrl = this.externalAudioUrl;

    this.musicVolume = settings.musicVolume;
    this.sfxVolume = settings.sfxVolume;
    this.muted = settings.muted;
    this.musicMuted = Boolean(settings.musicMuted);
    this.musicPaused = Boolean(settings.musicPaused);
    this.currentTrack = normalizeMusicTrackId(settings.musicTrack);
    this.selectedExternalTrack = settings.selectedExternalTrack ?? null;

    const nextExtUrl = this.selectedExternalTrack?.previewUrl || null;
    if (nextExtUrl !== prevExtUrl) {
      this.externalAudioUrl = nextExtUrl;
      this.externalCurrentTime = 0;
      this.externalDuration = 0;
      this.externalEnded = false;
      this.externalError = null;
      if (this.externalAudio) {
        this.externalAudio.pause();
        this.externalAudio.removeAttribute('src');
        this.externalAudio.load();
      }
      if (nextExtUrl) {
        const audio = this.ensureExternalAudioElement();
        if (audio) {
          this.externalLoading = true;
          audio.src = nextExtUrl;
          audio.load();
        }
      }
    } else if (prevPaused && !this.musicPaused && this.externalEnded && this.externalAudio) {
      // Pressing Play after track finished restarts from 0:00
      try {
        this.externalAudio.currentTime = 0;
        this.externalCurrentTime = 0;
      } catch {
        // ignore
      }
      this.externalEnded = false;
    }

    this.applyVolumes();
    this.syncExternalAudioVolume();

    const nowMuted = this.musicMuted || this.muted;
    if (
      prevTrack !== this.currentTrack ||
      prevPaused !== this.musicPaused ||
      prevMuted !== nowMuted ||
      nextExtUrl !== prevExtUrl
    ) {
      const m = this.currentMode;
      this.currentMode = 'none';
      this.setMusicMode(m);
    }
    this.emitPlaybackState();
  }

  private applyVolumes() {
    if (!this.ctx || !this.masterGain || !this.musicGain || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 1, now, 0.05);
    const hasExt = Boolean(this.selectedExternalTrack?.previewUrl);
    const effectiveMusic =
      this.muted || this.musicMuted || this.musicPaused || hasExt ? 0 : this.musicVolume * 0.16;
    this.musicGain.gain.setTargetAtTime(effectiveMusic, now, 0.1);
    this.sfxGain.gain.setTargetAtTime(this.sfxVolume * 0.58, now, 0.04);
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

    const safeStart = Math.max(ctx.currentTime + 0.008, startTime);
    const safeDur = Math.max(0.05, duration);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Pure sine/triangle for background music eliminates intermodulation buzz
    osc.type = target === 'music' ? (type === 'triangle' ? 'triangle' : 'sine') : type;
    osc.frequency.setValueAtTime(Math.max(40, freq), safeStart);
    if (slideToFreq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideToFreq), safeStart + safeDur);
    }

    const attack = target === 'music' ? Math.min(0.08, safeDur * 0.25) : Math.min(0.018, safeDur * 0.2);
    const release = target === 'music' ? Math.min(0.18, safeDur * 0.4) : Math.min(0.04, safeDur * 0.3);
    const peakTime = safeStart + attack;
    const sustainEnd = Math.max(peakTime + 0.005, safeStart + safeDur - release);
    const endTime = safeStart + safeDur;

    gain.gain.setValueAtTime(0.0001, safeStart);
    gain.gain.linearRampToValueAtTime(Math.max(0.0004, volume), peakTime);
    gain.gain.setValueAtTime(Math.max(0.0004, volume * 0.9), sustainEnd);
    gain.gain.linearRampToValueAtTime(0.0001, endTime);

    osc.connect(gain);
    gain.connect(target === 'sfx' ? this.sfxGain : this.musicFilter);

    osc.start(safeStart);
    osc.stop(endTime + 0.025);
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

  private playNoise(duration: number, volume: number, filterFreq: number, delay = 0, bandPass = true) {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.muted || this.sfxVolume <= 0.01) return;

    const sampleCount = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    // Slightly smoothed noise prevents harsh "TV static" crackle on tiny speakers
    let prev = 0;
    for (let i = 0; i < sampleCount; i++) {
      const white = Math.random() * 2 - 1;
      prev = prev * 0.45 + white * 0.55;
      data[i] = prev;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = bandPass ? 'bandpass' : 'lowpass';
    filter.frequency.value = Math.min(1400, filterFreq);
    filter.Q.value = bandPass ? 1.5 : 0.7;

    const gain = ctx.createGain();
    const startTime = ctx.currentTime + delay;
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(volume * 0.75, startTime + Math.min(0.02, duration * 0.22));
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
    this.playNoise(0.28, 0.1, 820, 0, true);
    this.playTone(110, 0.55, 'sine', 0.25, 'sfx', 0, 55);
    this.playTone(220, 0.45, 'triangle', 0.2, 'sfx', 0.05);
    this.playTone(329.63, 0.45, 'sine', 0.18, 'sfx', 0.12);
    this.playTone(440, 0.52, 'triangle', 0.2, 'sfx', 0.2);
    this.playTone(659.25, 0.65, 'sine', 0.18, 'sfx', 0.28);
  }

  public playDoorOpen() {
    if (!this.canPlay('doorOpen', 650)) return;
    this.playNoise(0.12, 0.05, 950, 0, true);
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
    this.playNoise(0.036, isSprinting ? 0.038 : 0.028, 600, 0, true);
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
    this.playNoise(0.2, 0.09, 1050, 0, true);
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
      this.playNoise(0.45, 0.1, 820, 0, true);
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
    this.playNoise(0.16, 0.11, 520, 0, true);
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
    if (this.selectedExternalTrack?.previewUrl) return;
    if (this.nowMs() < this.musicDuckUntil) return;

    // Non-overlapping warm notes (duration <= 0.86 * stepSec) eliminate beating/buzz on mobile speakers
    if (mode === 'home') {
      const chords: Array<[number, number]> = [
        [130.81, 196.0],
        [146.83, 220.0],
        [130.81, 196.0],
        [123.47, 185.0],
      ];
      const [root, fifth] = chords[stepIdx % chords.length];
      this.scheduleToneAt(root, 1.04, 'sine', 0.065, 'music', time);
      this.scheduleToneAt(fifth, 0.96, 'sine', 0.032, 'music', time + 0.06);
      if (stepIdx % 2 === 1) {
        this.scheduleToneAt(fifth * 2, 0.65, 'sine', 0.018, 'music', time + 0.18);
      }
      return;
    }

    if (mode === 'discussion') {
      const pulseBass = [110.0, 110.0, 103.83, 110.0];
      const idx = stepIdx % pulseBass.length;
      this.scheduleToneAt(pulseBass[idx], 0.32, 'sine', 0.065, 'music', time);
      if (stepIdx % 2 === 0) {
        this.scheduleToneAt(293.66, 0.28, 'sine', 0.024, 'music', time + 0.05);
      }
      return;
    }

    if (mode === 'cutscene') {
      const cinematic = [
        [130.81, 196.0, 261.63],
        [146.83, 220.0, 293.66],
        [164.81, 246.94, 329.63],
        [146.83, 220.0, 293.66],
      ];
      const c = cinematic[stepIdx % cinematic.length];
      c.forEach((f, idx) => {
        this.scheduleToneAt(f, 0.86, 'sine', 0.04, 'music', time + idx * 0.05);
      });
      return;
    }

    const track = this.currentTrack;
    if (track === 'nusantara_gamelan') {
      const pelogLead = [293.66, 329.63, 440.0, 493.88, 440.0, 329.63];
      const idx = stepIdx % pelogLead.length;
      if (idx % 2 === 0) {
        this.scheduleToneAt(146.83, 0.38, 'sine', 0.055, 'music', time);
      }
      this.scheduleToneAt(pelogLead[idx], 0.38, 'sine', 0.045, 'music', time);
    } else if (track === 'seoul_neon') {
      const bass = [130.81, 146.83, 164.81, 146.83];
      const lead = [329.63, 392.0, 440.0, 392.0];
      const idx = stepIdx % bass.length;
      this.scheduleToneAt(bass[idx], 0.3, 'sine', 0.058, 'music', time);
      this.scheduleToneAt(lead[idx], 0.28, 'sine', 0.04, 'music', time + 0.02);
    } else if (track === 'western_sunset') {
      const chords = [
        [174.61, 220.0, 261.63],
        [164.81, 196.0, 246.94],
        [146.83, 174.61, 220.0],
        [130.81, 164.81, 196.0],
      ];
      const c = chords[stepIdx % chords.length];
      c.forEach((f, i) => this.scheduleToneAt(f, 0.44, 'sine', 0.036, 'music', time + i * 0.03));
    } else if (track === 'tension_protocol') {
      const pulse = [110.0, 110.0, 103.83, 110.0];
      const idx = stepIdx % pulse.length;
      this.scheduleToneAt(pulse[idx], 0.3, 'sine', 0.06, 'music', time);
      if (stepIdx % 2 === 1) {
        this.scheduleToneAt(pulse[idx] * 2.5, 0.24, 'sine', 0.024, 'music', time + 0.04);
      }
    } else {
      // Warm non-overlapping deep ambient drone (zero beating artifacts on phone speakers)
      const roots: Array<[number, number]> = [
        [110.0, 164.81],
        [110.0, 164.81],
        [98.0, 146.83],
        [103.83, 155.56],
      ];
      const [r, fifth] = roots[stepIdx % roots.length];
      this.scheduleToneAt(r, 1.06, 'sine', 0.065, 'music', time);
      this.scheduleToneAt(fifth, 0.96, 'sine', 0.032, 'music', time + 0.07);
      if (stepIdx % 3 === 1) {
        this.scheduleToneAt(r * 3, 0.72, 'sine', 0.018, 'music', time + 0.2);
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
    this.nextStepTime = 0;
    this.setCutsceneDucking(mode === 'cutscene');
    this.syncExternalAudioVolume();
    this.emitPlaybackState();
    if (mode === 'none' || this.musicPaused || this.musicMuted || this.muted || this.selectedExternalTrack?.previewUrl) {
      return;
    }

    const trackDef = MUSIC_TRACKS.find((t) => t.id === this.currentTrack) || MUSIC_TRACKS[0];
    const stepSec =
      mode === 'home'
        ? 1.25
        : mode === 'gameplay'
          ? trackDef.stepSec
          : mode === 'discussion'
            ? 0.44
            : 1.05;

    const scheduleAheadSec = 0.16;
    const lookaheadMs = 55;

    this.schedulerTimer = window.setInterval(() => {
      this.applyDuckLevel();
      if (!this.ctx || this.ctx.state !== 'running') return;
      if (this.nextStepTime < this.ctx.currentTime) {
        this.nextStepTime = this.ctx.currentTime + 0.05;
      }
      let guard = 0;
      while (this.nextStepTime < this.ctx.currentTime + scheduleAheadSec && guard < 2) {
        this.scheduleMusicStep(mode, this.nextStepTime, this.stepIndex);
        this.nextStepTime += stepSec;
        this.stepIndex++;
        guard++;
      }
      if (guard > 0) {
        this.emitPlaybackState();
      }
    }, lookaheadMs);
  }
}

export const soundEngine = new SoundEngine();
