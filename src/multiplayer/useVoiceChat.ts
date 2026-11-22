import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { soundEngine } from '../audio/soundEngine';
import { MultiplayerPhase, RemotePlayerPublic } from '../types/game';

interface UseVoiceChatOptions {
  enabled: boolean;
  voiceFeatureEnabled: boolean;
  voiceVolume: number;
  myId: string | null;
  players: RemotePlayerPublic[];
  mpPhase?: MultiplayerPhase;
  amAlive: boolean;
  sendVoiceState: (micOn: boolean, muted: boolean, speaking: boolean) => void;
  sendRtcSignal: (targetId: string, signalType: 'offer' | 'answer' | 'ice', data: unknown) => void;
}

interface PeerEntry {
  pc: RTCPeerConnection;
  audioEl: HTMLAudioElement;
  makingOffer: boolean;
  ignoreOffer: boolean;
  pendingIce: RTCIceCandidateInit[];
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function useVoiceChat({
  enabled,
  voiceFeatureEnabled,
  voiceVolume,
  myId,
  players,
  mpPhase,
  amAlive,
  sendVoiceState,
  sendRtcSignal,
}: UseVoiceChatOptions) {
  const [micOn, setMicOn] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [connectedPeerIds, setConnectedPeerIds] = useState<string[]>([]);
  const [locallyMutedIds, setLocallyMutedIds] = useState<string[]>([]);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, PeerEntry>>(new Map());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const vadTimerRef = useRef<number | null>(null);

  const micOnRef = useRef(micOn);
  micOnRef.current = micOn;
  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  const speakingRef = useRef(speaking);
  speakingRef.current = speaking;
  const voiceVolumeRef = useRef(voiceVolume);
  voiceVolumeRef.current = voiceVolume;
  const voiceFeatureRef = useRef(voiceFeatureEnabled);
  voiceFeatureRef.current = voiceFeatureEnabled;
  const myIdRef = useRef(myId);
  myIdRef.current = myId;
  const playersRef = useRef(players);
  playersRef.current = players;
  const mpPhaseRef = useRef(mpPhase);
  mpPhaseRef.current = mpPhase;
  const amAliveRef = useRef(amAlive);
  amAliveRef.current = amAlive;
  const locallyMutedSet = useMemo(() => new Set(locallyMutedIds), [locallyMutedIds]);
  const locallyMutedSetRef = useRef(locallyMutedSet);
  locallyMutedSetRef.current = locallyMutedSet;

  const sendVoiceStateRef = useRef(sendVoiceState);
  sendVoiceStateRef.current = sendVoiceState;
  const sendRtcSignalRef = useRef(sendRtcSignal);
  sendRtcSignalRef.current = sendRtcSignal;

  const canHearPeer = useCallback((peer: RemotePlayerPublic): boolean => {
    if (!voiceFeatureRef.current) return false;
    if (locallyMutedSetRef.current.has(peer.id)) return false;
    const phase = mpPhaseRef.current;
    if (phase === 'playing' || phase === 'meeting') {
      // Spectators only talk/hear spectators; living players only talk/hear living players
      if (amAliveRef.current !== peer.alive) return false;
    }
    return true;
  }, []);

  const refreshConnectedList = useCallback(() => {
    const connected: string[] = [];
    peersRef.current.forEach((entry, pid) => {
      if (
        entry.pc.connectionState === 'connected' ||
        entry.pc.iceConnectionState === 'connected' ||
        entry.pc.iceConnectionState === 'completed'
      ) {
        connected.push(pid);
      }
    });
    setConnectedPeerIds(connected);
  }, []);

  const syncAllAudioElements = useCallback(() => {
    const vol = Math.max(0, Math.min(1, voiceVolumeRef.current));
    const pMap = new Map(playersRef.current.map((p) => [p.id, p]));
    peersRef.current.forEach((entry, pid) => {
      const peer = pMap.get(pid);
      const audible = peer ? canHearPeer(peer) : false;
      entry.audioEl.volume = vol;
      entry.audioEl.muted = !audible;
    });
  }, [canHearPeer]);

  const destroyPeer = useCallback(
    (peerId: string) => {
      const entry = peersRef.current.get(peerId);
      if (!entry) return;
      try {
        entry.pc.onicecandidate = null;
        entry.pc.ontrack = null;
        entry.pc.onconnectionstatechange = null;
        entry.pc.onnegotiationneeded = null;
        entry.pc.close();
      } catch {
        // ignore
      }
      try {
        entry.audioEl.srcObject = null;
        entry.audioEl.remove();
      } catch {
        // ignore
      }
      peersRef.current.delete(peerId);
      refreshConnectedList();
    },
    [refreshConnectedList]
  );

  const stopMicHardware = useCallback(() => {
    if (vadTimerRef.current !== null) {
      window.clearInterval(vadTimerRef.current);
      vadTimerRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
      analyserRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {
          // ignore
        }
      });
      localStreamRef.current = null;
    }
    // Remove local senders from existing peer connections
    peersRef.current.forEach((entry) => {
      entry.pc.getSenders().forEach((sender) => {
        if (sender.track) {
          try {
            entry.pc.removeTrack(sender);
          } catch {
            // ignore
          }
        }
      });
    });
    setMicOn(false);
    setMuted(false);
    setSpeaking(false);
    sendVoiceStateRef.current(false, false, false);
  }, []);

  const getOrCreatePeer = useCallback(
    (peerId: string): PeerEntry | null => {
      const existing = peersRef.current.get(peerId);
      if (existing) return existing;
      if (typeof RTCPeerConnection === 'undefined') return null;

      const pc = new RTCPeerConnection(RTC_CONFIG);
      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      audioEl.setAttribute('playsinline', 'true');
      audioEl.volume = Math.max(0, Math.min(1, voiceVolumeRef.current));
      audioEl.style.display = 'none';
      document.body.appendChild(audioEl);

      const entry: PeerEntry = {
        pc,
        audioEl,
        makingOffer: false,
        ignoreOffer: false,
        pendingIce: [],
      };
      peersRef.current.set(peerId, entry);

      // Attach local audio tracks if mic is active, otherwise receive-only transceiver
      if (localStreamRef.current) {
        const tracks = localStreamRef.current.getAudioTracks();
        tracks.forEach((track) => {
          track.enabled = micOnRef.current && !mutedRef.current;
          pc.addTrack(track, localStreamRef.current!);
        });
      } else {
        try {
          pc.addTransceiver('audio', { direction: 'recvonly' });
        } catch {
          // ignore fallback
        }
      }

      pc.onicecandidate = (ev) => {
        if (ev.candidate) {
          sendRtcSignalRef.current(peerId, 'ice', ev.candidate.toJSON());
        }
      };

      pc.ontrack = (ev) => {
        const stream = ev.streams[0] || new MediaStream([ev.track]);
        entry.audioEl.srcObject = stream;
        syncAllAudioElements();
        entry.audioEl.play().catch(() => {});
      };

      pc.onconnectionstatechange = () => {
        refreshConnectedList();
        if (pc.connectionState === 'failed') {
          try {
            pc.restartIce();
          } catch {
            // ignore
          }
        }
      };

      pc.onnegotiationneeded = async () => {
        try {
          entry.makingOffer = true;
          await pc.setLocalDescription();
          if (pc.localDescription) {
            sendRtcSignalRef.current(peerId, 'offer', pc.localDescription);
          }
        } catch {
          // ignore
        } finally {
          entry.makingOffer = false;
        }
      };

      return entry;
    },
    [refreshConnectedList, syncAllAudioElements]
  );

  // Sync peer mesh against active connected room players
  useEffect(() => {
    if (!enabled || !voiceFeatureEnabled || !myId) {
      Array.from(peersRef.current.keys()).forEach(destroyPeer);
      if (micOnRef.current) stopMicHardware();
      soundEngine.setVoiceDucking(false);
      return;
    }

    const activeOtherIds = new Set(
      players
        .filter((p) => p.id !== myId && p.connected)
        .map((p) => p.id)
    );

    // Tear down disconnected / left peers
    Array.from(peersRef.current.keys()).forEach((pid) => {
      if (!activeOtherIds.has(pid)) {
        destroyPeer(pid);
      }
    });

    // Deterministic initiator creates peer connection proactively so 1-way & 2-way voice works
    activeOtherIds.forEach((pid) => {
      if (!peersRef.current.has(pid) && myId < pid) {
        getOrCreatePeer(pid);
      }
    });

    syncAllAudioElements();
  }, [
    enabled,
    voiceFeatureEnabled,
    myId,
    players,
    mpPhase,
    amAlive,
    locallyMutedIds,
    destroyPeer,
    stopMicHardware,
    getOrCreatePeer,
    syncAllAudioElements,
  ]);

  // Keep volume synced live
  useEffect(() => {
    syncAllAudioElements();
  }, [voiceVolume, syncAllAudioElements]);

  // Auto-duck music when local user or any audible peer is actively speaking
  useEffect(() => {
    if (!enabled || !voiceFeatureEnabled) {
      soundEngine.setVoiceDucking(false);
      return;
    }
    const localSpeaking = micOn && !muted && speaking;
    const peerSpeaking = players.some(
      (p) =>
        p.id !== myId &&
        p.voice?.micOn &&
        !p.voice.muted &&
        p.voice.speaking &&
        canHearPeer(p)
    );
    soundEngine.setVoiceDucking(localSpeaking || peerSpeaking);
  }, [enabled, voiceFeatureEnabled, micOn, muted, speaking, players, myId, canHearPeer]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      Array.from(peersRef.current.keys()).forEach(destroyPeer);
      stopMicHardware();
      soundEngine.setVoiceDucking(false);
    };
  }, [destroyPeer, stopMicHardware]);

  // Handle incoming WebRTC signals from WS relay
  const handleRtcSignal = useCallback(
    async (msg: { fromId: string; signalType: 'offer' | 'answer' | 'ice'; data: unknown }) => {
      if (!enabled || !voiceFeatureRef.current || !myIdRef.current) return;
      const { fromId, signalType, data } = msg;
      if (!fromId || fromId === myIdRef.current) return;

      const entry = getOrCreatePeer(fromId);
      if (!entry) return;
      const { pc } = entry;
      const polite = myIdRef.current > fromId;

      try {
        if (signalType === 'offer' || signalType === 'answer') {
          const desc = data as RTCSessionDescriptionInit;
          const offerCollision =
            signalType === 'offer' && (entry.makingOffer || pc.signalingState !== 'stable');
          entry.ignoreOffer = !polite && offerCollision;
          if (entry.ignoreOffer) return;

          await pc.setRemoteDescription(desc);
          if (signalType === 'offer') {
            await pc.setLocalDescription();
            if (pc.localDescription) {
              sendRtcSignalRef.current(fromId, 'answer', pc.localDescription);
            }
          }
          // Flush queued ICE candidates
          while (entry.pendingIce.length > 0) {
            const cand = entry.pendingIce.shift()!;
            await pc.addIceCandidate(cand).catch(() => {});
          }
        } else if (signalType === 'ice' && data) {
          const cand = data as RTCIceCandidateInit;
          if (pc.remoteDescription) {
            await pc.addIceCandidate(cand).catch(() => {});
          } else {
            entry.pendingIce.push(cand);
          }
        }
      } catch {
        // Ignore transient WebRTC negotiation errors so gameplay never crashes
      }
    },
    [enabled, getOrCreatePeer]
  );

  const pauseMicSoft = useCallback(() => {
    if (vadTimerRef.current !== null) {
      window.clearInterval(vadTimerRef.current);
      vadTimerRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = false;
      });
    }
    micOnRef.current = false;
    mutedRef.current = false;
    speakingRef.current = false;
    setMicOn(false);
    setMuted(false);
    setSpeaking(false);
    sendVoiceStateRef.current(false, false, false);
  }, []);

  const startVadLoop = useCallback((stream: MediaStream) => {
    if (vadTimerRef.current !== null) {
      window.clearInterval(vadTimerRef.current);
      vadTimerRef.current = null;
    }
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
    } else {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        src.connect(analyser);
        audioCtxRef.current = ctx;
        analyserRef.current = analyser;
      }
    }

    if (!analyserRef.current) return;
    const buf = new Uint8Array(analyserRef.current.fftSize);
    vadTimerRef.current = window.setInterval(() => {
      if (!micOnRef.current || mutedRef.current || !analyserRef.current) {
        if (speakingRef.current) {
          speakingRef.current = false;
          setSpeaking(false);
          sendVoiceStateRef.current(micOnRef.current, mutedRef.current, false);
        }
        return;
      }
      analyserRef.current.getByteTimeDomainData(buf);
      let sumSq = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128;
        sumSq += v * v;
      }
      const rms = Math.sqrt(sumSq / buf.length);
      const nowSpeaking = rms > 0.024;
      if (nowSpeaking !== speakingRef.current) {
        speakingRef.current = nowSpeaking;
        setSpeaking(nowSpeaking);
        sendVoiceStateRef.current(true, mutedRef.current, nowSpeaking);
      }
    }, 130);
  }, []);

  // Explicit user-triggered On Mic / Off Mic
  const toggleMic = useCallback(async () => {
    if (!voiceFeatureRef.current) {
      setMicError('Voice Chat sedang dinonaktifkan di pengaturan.');
      return;
    }
    if (micOnRef.current) {
      pauseMicSoft();
      return;
    }

    setMicError(null);

    // Reuse existing live stream across Off -> On toggles (avoids redundant permission prompts)
    const existingLiveTracks = localStreamRef.current?.getAudioTracks().filter((t) => t.readyState === 'live') ?? [];
    if (localStreamRef.current && existingLiveTracks.length > 0) {
      existingLiveTracks.forEach((t) => {
        t.enabled = true;
      });
      startVadLoop(localStreamRef.current);
      micOnRef.current = true;
      mutedRef.current = false;
      speakingRef.current = false;
      setMicOn(true);
      setMuted(false);
      setSpeaking(false);
      sendVoiceStateRef.current(true, false, false);
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicError('Browser atau perangkat tidak mendukung akses mikrofon.');
      return;
    }

    // Pre-check Permissions API if supported to surface clear message when denied
    try {
      if (navigator.permissions?.query) {
        const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (status.state === 'denied') {
          setMicError(
            'Izin mikrofon diblokir browser. Aktifkan izin mikrofon di ikon gembok/alamat situs lalu klik On Mic lagi.'
          );
          return;
        }
      }
    } catch {
      // Permissions API for microphone is not supported in all browsers; continue to getUserMedia
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      localStreamRef.current = stream;
      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach((t) => {
        t.enabled = true;
      });

      // Attach audio track to every existing peer connection & renegotiate
      peersRef.current.forEach((entry, pid) => {
        const senders = entry.pc.getSenders();
        audioTracks.forEach((track) => {
          const existingAudioSender = senders.find((s) => s.track?.kind === 'audio');
          if (existingAudioSender) {
            existingAudioSender.replaceTrack(track).catch(() => {});
          } else {
            entry.pc.addTrack(track, stream);
          }
        });
        entry.pc.getTransceivers().forEach((tr) => {
          if (tr.receiver.track?.kind === 'audio' && tr.direction === 'recvonly') {
            tr.direction = 'sendrecv';
          }
        });
        if (myIdRef.current && myIdRef.current < pid && entry.pc.signalingState === 'stable') {
          entry.pc
            .setLocalDescription()
            .then(() => {
              if (entry.pc.localDescription) {
                sendRtcSignalRef.current(pid, 'offer', entry.pc.localDescription);
              }
            })
            .catch(() => {});
        }
      });

      startVadLoop(stream);

      micOnRef.current = true;
      mutedRef.current = false;
      speakingRef.current = false;
      setMicOn(true);
      setMuted(false);
      setSpeaking(false);
      sendVoiceStateRef.current(true, false, false);
    } catch (err) {
      const name = err instanceof Error ? err.name : '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setMicError(
          'Izin mikrofon ditolak browser. Aktifkan izin mikrofon di pengaturan situs jika ingin berbicara.'
        );
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setMicError('Mikrofon tidak ditemukan di perangkat ini. Game tetap berjalan normal.');
      } else {
        setMicError('Mikrofon gagal diaktifkan. Pastikan tidak dipakai aplikasi lain.');
      }
      stopMicHardware();
    }
  }, [pauseMicSoft, startVadLoop, stopMicHardware]);

  // Quick Mute / Unmute (immediately silences track to peers)
  const toggleMute = useCallback(() => {
    if (!micOnRef.current) return;
    const nextMuted = !mutedRef.current;
    mutedRef.current = nextMuted;
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      });
    }
    setMuted(nextMuted);
    if (nextMuted) {
      speakingRef.current = false;
      setSpeaking(false);
    }
    sendVoiceStateRef.current(true, nextMuted, nextMuted ? false : speakingRef.current);
  }, []);

  const toggleLocalMutePeer = useCallback((peerId: string) => {
    setLocallyMutedIds((prev) =>
      prev.includes(peerId) ? prev.filter((id) => id !== peerId) : [...prev, peerId]
    );
  }, []);

  const clearMicError = useCallback(() => setMicError(null), []);

  return {
    micOn,
    muted,
    speaking,
    micError,
    connectedPeerIds,
    locallyMutedIds,
    toggleMic,
    toggleMute,
    toggleLocalMutePeer,
    clearMicError,
    handleRtcSignal,
  };
}
