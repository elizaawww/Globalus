import { GameSettings, MusicTrackId } from '../types/game';

export type MusicMode = 'none' | 'home' | 'gameplay' | 'cutscene' | 'discussion';

export interface MusicTrackDef {
  id: MusicTrackId;
  title: string;
  genre: string;
  tempoMs: number;
  licenseNote: string;
}

export const MUSIC_TRACKS: MusicTrackDef[] = [
  {
    id: 'cosmic_drift',
    title: 'Cosmic Drift',
    genre: 'Space Ambient',
    tempoMs: 640,
    licenseNote: 'Original Royalty-Free Audio',
  },
  {
    id: 'nebula_pulse',
    title: 'Nebula Pulse',
    genre: 'Trending Synthwave',
    tempoMs: 420,
    licenseNote: 'Original Royalty-Free Audio',
  },
  {
    id: 'orbit_lofi',
    title: 'Orbit Lo-Fi',
    genre: 'Chill Space Beats',
    tempoMs: 540,
    licenseNote: 'Original Royalty-Free Audio',
  },
  {
    id: 'starlight_house',
    title: 'Starlight Horizon',
    genre: 'Upbeat Cosmic House',
    tempoMs: 440,
    licenseNote: 'Original Royalty-Free Audio',
  },
  {
    id: 'tension_protocol',
    title: 'Stasis Protocol',
    genre: 'Multiplayer Electronic',
    tempoMs: 390,
    licenseNote: 'Original Royalty-Free Audio',
  },
];

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicDuckGain: GainNode | null = null;
  private musicFilter: BiquadFilterNode | null = null;
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
  private musicTimer: number | null = null;
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
      duck = Math.min(duck, 0.22);
    }
    if (this.cutsceneDuckActive) {
      duck = Math.min(duck, 0.34);
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
      this.musicFilter.frequency.value = 1650;
      this.musicFilter.Q.value = 0.65;

      this.sfxGain = this.ctx.createGain();

      this.musicFilter.connect(this.musicDuckGain);
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
    if (settings.musicTrack && MUSIC_TRACKS.some((t) => t.id === settings.musicTrack)) {
      this.currentTrack = settings.musicTrack;
    }
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
    this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 1, now, 0.035);
    const effectiveMusic = this.muted || this.musicMuted || this.musicPaused ? 0 : this.musicVolume * 0.24;
    this.musicGain.gain.setTargetAtTime(effectiveMusic, now, 0.08);
    this.sfxGain.gain.setTargetAtTime(this.sfxVolume * 0.62, now, 0.035);
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
    if (!ctx || !this.sfxGain || !this.musicGain || !this.musicFilter) return;
    if (this.muted) return;
    if (target === 'sfx' && this.sfxVolume <= 0.01) return;
    if (target === 'music' && (this.musicMuted || this.musicPaused || this.musicVolume <= 0.01)) return;

    const startTime = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, freq), startTime);
    if (slideToFreq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideToFreq), startTime + duration);
    }

    const attack = Math.min(0.03, duration * 0.22);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(Math.max(0.0002, volume), startTime + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(target === 'sfx' ? this.sfxGain : this.musicFilter);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.03);
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
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

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
    // Signature Among Us-style dramatic space shimmer & bass thud
    this.playNoise(0.32, 0.16, 900, 0, true);
    this.playTone(110, 0.55, 'sine', 0.28, 'sfx', 0, 55);
    this.playTone(220, 0.45, 'triangle', 0.22, 'sfx', 0.05);
    this.playTone(329.63, 0.45, 'sine', 0.19, 'sfx', 0.12);
    this.playTone(440, 0.52, 'triangle', 0.22, 'sfx', 0.2);
    this.playTone(659.25, 0.65, 'sine', 0.2, 'sfx', 0.28);
  }

  public playDoorOpen() {
    if (!this.canPlay('doorOpen', 650)) return;
    this.playNoise(0.14, 0.08, 1200, 0, true);
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
    // Crisp Among Us "Task Completed" two-step sparkle chime
    this.playTone(659.25, 0.12, 'triangle', 0.24, 'sfx', 0);
    this.playTone(880.0, 0.16, 'triangle', 0.25, 'sfx', 0.085);
    this.playTone(1318.51, 0.28, 'sine', 0.22, 'sfx', 0.17);
    this.playTone(1760.0, 0.24, 'sine', 0.11, 'sfx', 0.21);
  }

  public playSuccess() {
    if (!this.canPlay('success', 260)) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.2, 'triangle', 0.22, 'sfx', idx * 0.075);
    });
  }

  public playError() {
    if (!this.canPlay('error', 260)) return;
    this.playTone(225, 0.15, 'sawtooth', 0.14, 'sfx', 0, 155);
    this.playTone(165, 0.21, 'sawtooth', 0.14, 'sfx', 0.11, 118);
  }

  public playDialogueBlip(pitchOffset = 0) {
    if (!this.canPlay('blip', 40)) return;
    this.playTone(460 + pitchOffset, 0.04, 'sine', 0.11, 'sfx', 0, 500 + pitchOffset);
  }

  public playCharacterAppear() {
    if (!this.canPlay('charAppear', 500)) return;
    this.playTone(220, 0.5, 'sine', 0.22, 'sfx', 0, 440);
    this.playTone(330, 0.5, 'triangle', 0.18, 'sfx', 0.12, 660);
    this.playTone(880, 0.42, 'sine', 0.16, 'sfx', 0.28);
  }

  public playRewardFanfare() {
    if (!this.canPlay('rewardFanfare', 800)) return;
    this.duckMusic(1100);
    const arp = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    arp.forEach((freq, i) => {
      this.playTone(freq, 0.34, 'triangle', 0.23, 'sfx', i * 0.085);
    });
  }

  public playFootstep(isSprinting = false) {
    const cooldown = isSprinting ? 205 : 295;
    if (!this.canPlay('footstep', cooldown)) return;
    const base = isSprinting ? 128 : 108;
    const jitter = (Math.random() - 0.5) * 18;
    this.playNoise(0.04, isSprinting ? 0.055 : 0.04, 650, 0, true);
    this.playTone(base + jitter, 0.05, 'triangle', isSprinting ? 0.11 : 0.085, 'sfx', 0, 62);
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
    // Metallic clank + pressurized vent air whoosh
    this.playNoise(0.24, 0.16, 1400, 0, true);
    this.playTone(135, 0.17, 'sawtooth', 0.15, 'sfx', 0, 295);
    this.playTone(320, 0.22, 'triangle', 0.15, 'sfx', 0.075, 110);
  }

  public playImpostorAction() {
    if (!this.canPlay('impostorAction', 450)) return;
    // Sinister dark cyber pulse for Impostor sabotage / vent / stealth actions
    this.playTone(146.83, 0.22, 'sawtooth', 0.15, 'sfx', 0, 110);
    this.playTone(207.65, 0.26, 'triangle', 0.16, 'sfx', 0.06, 155.56);
    this.playTone(92.5, 0.34, 'sine', 0.22, 'sfx', 0.12, 65);
  }

  public playMeetingAlarm(reason: 'emergency' | 'report' = 'emergency') {
    if (!this.canPlay('meetingAlarm', 1600)) return;
    this.duckMusic(1400);
    if (reason === 'report') {
      // Urgent Stasis Pod report triple-klaxon
      [0, 0.21, 0.42].forEach((delay) => {
        this.playTone(740, 0.15, 'sawtooth', 0.2, 'sfx', delay, 520);
        this.playTone(987.77, 0.14, 'triangle', 0.15, 'sfx', delay + 0.03, 740);
      });
    } else {
      // Classic Emergency Meeting red-alert siren
      [0, 0.26, 0.52].forEach((delay) => {
        this.playTone(620, 0.19, 'sawtooth', 0.21, 'sfx', delay, 460);
        this.playTone(880, 0.17, 'triangle', 0.15, 'sfx', delay + 0.04, 650);
      });
    }
  }

  public playVoteLock() {
    if (!this.canPlay('voteLock', 300)) return;
    // Tactile vote confirmation beep + lock click
    this.playTone(587.33, 0.08, 'triangle', 0.22, 'sfx', 0);
    this.playTone(880, 0.14, 'sine', 0.2, 'sfx', 0.065);
  }

  public playVoteEject(wasEjected = true) {
    if (!this.canPlay('voteEject', 1200)) return;
    this.duckMusic(1200);
    if (wasEjected) {
      // Airlock ejection sweep + deep dramatic space thud
      this.playNoise(0.55, 0.18, 950, 0, true);
      this.playTone(440, 0.55, 'triangle', 0.2, 'sfx', 0, 110);
      this.playTone(130.81, 0.65, 'sine', 0.26, 'sfx', 0.18, 55);
    } else {
      // Neutral skip/tie reveal chord
      this.playTone(392, 0.18, 'sine', 0.18, 'sfx', 0);
      this.playTone(349.23, 0.26, 'triangle', 0.16, 'sfx', 0.14);
    }
  }

  public playEliminate() {
    if (!this.canPlay('eliminate', 650)) return;
    this.duckMusic(900);
    // Heavy impact + ominous stasis drop
    this.playNoise(0.18, 0.22, 600, 0, false);
    this.playTone(190, 0.34, 'sawtooth', 0.2, 'sfx', 0, 62);
    this.playTone(430, 0.26, 'sine', 0.22, 'sfx', 0.02, 130);
    this.playTone(110, 0.45, 'triangle', 0.24, 'sfx', 0.08, 55);
  }

  public playVictory() {
    if (!this.canPlay('victory', 1800)) return;
    this.duckMusic(2400);
    // Heroic Crewmate / Solo Victory fanfare
    const melody = [
      { f: 523.25, d: 0.18, t: 0 },
      { f: 659.25, d: 0.18, t: 0.14 },
      { f: 783.99, d: 0.2, t: 0.28 },
      { f: 1046.5, d: 0.55, t: 0.44 },
      { f: 987.77, d: 0.18, t: 0.85 },
      { f: 1046.5, d: 0.72, t: 1.02 },
    ];
    melody.forEach((n) => {
      this.playTone(n.f, n.d, 'triangle', 0.24, 'sfx', n.t);
      this.playTone(n.f * 0.5, n.d, 'sine', 0.14, 'sfx', n.t);
    });
  }

  public playDefeat() {
    if (!this.canPlay('defeat', 1800)) return;
    this.duckMusic(2400);
    // Sombre minor descending Defeat motif + ominous sub-bass
    const notes = [
      { f: 392.0, d: 0.28, t: 0 },
      { f: 349.23, d: 0.28, t: 0.26 },
      { f: 311.13, d: 0.32, t: 0.52 },
      { f: 261.63, d: 0.85, t: 0.82 },
    ];
    notes.forEach((n) => {
      this.playTone(n.f, n.d, 'sawtooth', 0.12, 'sfx', n.t);
      this.playTone(n.f * 0.5, n.d + 0.1, 'sine', 0.22, 'sfx', n.t);
    });
  }

  public setMusicMode(mode: MusicMode) {
    if (this.currentMode === mode && this.musicTimer !== null) return;
    this.currentMode = mode;
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    this.stepIndex = 0;
    this.setCutsceneDucking(mode === 'cutscene');
    if (mode === 'none' || this.musicPaused) return;

    const trackDef = MUSIC_TRACKS.find((t) => t.id === this.currentTrack) || MUSIC_TRACKS[0];
    const intervalMs =
      mode === 'home'
        ? 1050
        : mode === 'gameplay'
          ? trackDef.tempoMs
          : mode === 'discussion'
            ? 380
            : 880;

    const tickMusic = () => {
      this.applyDuckLevel();
      if (this.muted || this.musicMuted || this.musicPaused || this.musicVolume <= 0.01) return;
      if (!this.ctx || this.ctx.state !== 'running') return;
      if (this.nowMs() < this.musicDuckUntil) return;

      if (mode === 'home') {
        const chords = [
          [130.81, 196.0, 246.94, 293.66],
          [110.0, 164.81, 220.0, 261.63],
          [174.61, 220.0, 261.63, 329.63],
          [146.83, 220.0, 261.63, 329.63],
        ];
        const chord = chords[this.stepIndex % chords.length];
        chord.forEach((f, idx) => {
          this.playTone(f, 1.35, 'sine', 0.1, 'music', idx * 0.06);
        });
      } else if (mode === 'gameplay') {
        const track = this.currentTrack;
        if (track === 'nebula_pulse') {
          // Trending Synthwave arpeggio + warm analog bassline
          const bass = [65.41, 65.41, 87.31, 87.31, 98.0, 98.0, 73.42, 73.42];
          const lead = [261.63, 329.63, 392.0, 523.25, 440.0, 392.0, 349.23, 329.63];
          const idx = this.stepIndex % bass.length;
          this.playTone(bass[idx], 0.34, 'sawtooth', 0.09, 'music', 0);
          this.playTone(lead[idx], 0.28, 'triangle', 0.075, 'music', 0.03);
          if (this.stepIndex % 4 === 0) {
            this.playTone(lead[idx] * 1.5, 0.45, 'sine', 0.045, 'music', 0.08);
          }
        } else if (track === 'orbit_lofi') {
          // Chill Lo-Fi Space Beats (warm Rhodes-like seventh chords + soft bell)
          const chords = [
            [174.61, 220.0, 261.63, 329.63], // Fmaj7
            [164.81, 196.0, 246.94, 293.66], // Em7
            [146.83, 174.61, 220.0, 261.63], // Dm7
            [130.81, 164.81, 196.0, 246.94], // Cmaj7
          ];
          const step = this.stepIndex % 8;
          if (step % 2 === 0) {
            const c = chords[(this.stepIndex >> 1) % chords.length];
            c.forEach((f, i) => this.playTone(f, 0.95, 'sine', 0.065, 'music', i * 0.035));
          } else {
            const bell = [523.25, 493.88, 440.0, 392.0];
            this.playTone(bell[step % bell.length], 0.36, 'triangle', 0.045, 'music', 0.05);
          }
        } else if (track === 'starlight_house') {
          // Upbeat Deep Cosmic House groove for energetic Multiplayer
          const bass = [110.0, 110.0, 146.83, 130.81, 98.0, 98.0, 123.47, 130.81];
          const stab = [329.63, 392.0, 440.0, 523.25];
          const idx = this.stepIndex % bass.length;
          this.playTone(bass[idx] * 0.5, 0.28, 'triangle', 0.13, 'music', 0);
          if (this.stepIndex % 2 === 1) {
            this.playTone(stab[idx % stab.length], 0.22, 'sine', 0.08, 'music', 0.02);
            this.playTone(stab[(idx + 1) % stab.length], 0.22, 'sine', 0.06, 'music', 0.04);
          }
        } else if (track === 'tension_protocol') {
          // Sleek Among-Us-style electronic station pulse
          const pulse = [110.0, 110.0, 103.83, 110.0, 116.54, 110.0, 98.0, 103.83];
          const idx = this.stepIndex % pulse.length;
          this.playTone(pulse[idx] * 0.5, 0.2, 'triangle', 0.14, 'music', 0);
          if (this.stepIndex % 4 === 2) {
            this.playTone(pulse[idx] * 3, 0.38, 'sine', 0.055, 'music', 0.04);
          }
        } else {
          // Default: Cosmic Drift (ambient outer-space pad & sparse shimmer)
          const roots = [130.81, 130.81, 116.54, 116.54, 98.0, 98.0, 103.83, 123.47];
          const shimmer = [261.63, 311.13, 392.0, 466.16, 392.0, 311.13, 349.23, 293.66];
          const idx = this.stepIndex % roots.length;
          if (this.stepIndex % 4 === 0) {
            this.playTone(roots[idx] * 0.5, 2.1, 'sine', 0.13, 'music', 0);
            this.playTone(roots[idx] * 1.5, 1.7, 'sine', 0.06, 'music', 0.08);
          }
          if (this.stepIndex % 2 === 0) {
            this.playTone(shimmer[idx], 0.52, 'sine', 0.075, 'music', 0.04);
          } else if (this.stepIndex % 8 === 3 || this.stepIndex % 8 === 7) {
            this.playTone(shimmer[idx] * 2, 0.4, 'triangle', 0.042, 'music', 0.1);
          }
        }
      } else if (mode === 'discussion') {
        const pulseBass = [110.0, 110.0, 103.83, 110.0, 116.54, 110.0, 103.83, 98.0];
        const tensionHigh = [329.63, 0, 311.13, 0, 349.23, 0, 466.16, 0];
        const idx = this.stepIndex % pulseBass.length;
        this.playTone(pulseBass[idx] * 0.5, 0.18, 'triangle', 0.14, 'music', 0);
        if (this.stepIndex % 2 === 1) {
          this.playTone(880, 0.035, 'triangle', 0.045, 'music', 0);
        }
        const high = tensionHigh[idx];
        if (high > 0) {
          this.playTone(high, 0.48, 'sine', 0.065, 'music', 0.04);
        }
      } else if (mode === 'cutscene') {
        const cinematic = [
          [110.0, 220.0, 329.63],
          [130.81, 261.63, 392.0],
          [146.83, 293.66, 440.0],
          [123.47, 246.94, 369.99],
        ];
        const c = cinematic[this.stepIndex % cinematic.length];
        c.forEach((f, idx) => {
          this.playTone(f, 1.0, 'sine', 0.08, 'music', idx * 0.04);
        });
      }
      this.stepIndex++;
    };

    this.musicTimer = window.setInterval(tickMusic, intervalMs);
  }
}

export const soundEngine = new SoundEngine();

