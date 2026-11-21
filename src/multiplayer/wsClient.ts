import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CharacterAnimState,
  CharacterConfig,
  ConnectionStatus,
  EliminationEvent,
  EmoteId,
  MultiplayerRole,
  RoomSnapshot,
  VoicePeerState,
} from '../types/game';

const SESSION_KEY = 'globalus_mp_session_v1';
const MAX_RECONNECT_ATTEMPTS = 3;
const CONNECT_TIMEOUT_MS = 7500;

export interface MultiplayerClientState {
  status: ConnectionStatus;
  isOnline: boolean;
  reconnectAttempt: number;
  maxReconnectAttempts: number;
  playerId: string | null;
  roomCode: string | null;
  role: MultiplayerRole | null;
  snapshot: RoomSnapshot | null;
  lastError: string | null;
  ventTeleportTick: { x: number; z: number; tick: number } | null;
  eliminatedNotice: string | null;
}

type PendingAction =
  | { type: 'create_room'; character: CharacterConfig }
  | { type: 'join_room'; roomCode: string; character: CharacterConfig };

export function useMultiplayerClient(
  onRemoteMove?: (msg: {
    playerId: string;
    x: number;
    y?: number;
    z: number;
    yaw: number;
    animState: CharacterAnimState;
    inVent: boolean;
    activeEmote?: EmoteId | null;
  }) => void,
  onRemoteEmote?: (msg: { playerId: string; emoteId: EmoteId | null }) => void,
  onRtcSignal?: (msg: { fromId: string; signalType: 'offer' | 'answer' | 'ice'; data: unknown }) => void,
  onEliminationEvent?: (event: EliminationEvent) => void
) {
  const initialOnline = typeof navigator !== 'undefined' ? navigator.onLine !== false : true;

  const [state, setState] = useState<MultiplayerClientState>({
    status: initialOnline ? 'disconnected' : 'offline',
    isOnline: initialOnline,
    reconnectAttempt: 0,
    maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS,
    playerId: null,
    roomCode: null,
    role: null,
    snapshot: null,
    lastError: null,
    ventTeleportTick: null,
    eliminatedNotice: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const connectTimeoutRef = useRef<number | null>(null);
  const pingTimerRef = useRef<number | null>(null);
  const manualDisconnectRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const pendingActionRef = useRef<PendingAction | null>(null);

  const onRemoteMoveRef = useRef(onRemoteMove);
  onRemoteMoveRef.current = onRemoteMove;
  const onRemoteEmoteRef = useRef(onRemoteEmote);
  onRemoteEmoteRef.current = onRemoteEmote;
  const onRtcSignalRef = useRef(onRtcSignal);
  onRtcSignalRef.current = onRtcSignal;
  const onEliminationEventRef = useRef(onEliminationEvent);
  onEliminationEventRef.current = onEliminationEvent;

  const sessionRef = useRef<{ roomCode: string; playerId: string; reconnectToken: string } | null>(null);

  const clearTimers = useCallback(() => {
    if (reconnectTimerRef.current) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (connectTimeoutRef.current) {
      window.clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
    if (pingTimerRef.current) {
      window.clearInterval(pingTimerRef.current);
      pingTimerRef.current = null;
    }
  }, []);

  const clearStoredSession = useCallback(() => {
    sessionRef.current = null;
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore storage failure
    }
  }, []);

  const connect = useCallback(
    (isReconnect = false) => {
      if (typeof window === 'undefined') return;

      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        clearTimers();
        pendingActionRef.current = null;
        setState((s) => ({
          ...s,
          isOnline: false,
          status: 'offline',
          reconnectAttempt: 0,
          lastError: 'Perangkat sedang offline. Sambungkan internet untuk bermain Multiplayer Online.',
        }));
        return;
      }

      const existing = wsRef.current;
      if (existing && (existing.readyState === WebSocket.OPEN || existing.readyState === WebSocket.CONNECTING)) {
        return;
      }

      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (connectTimeoutRef.current) {
        window.clearTimeout(connectTimeoutRef.current);
        connectTimeoutRef.current = null;
      }

      manualDisconnectRef.current = false;
      if (!isReconnect) {
        reconnectAttemptsRef.current = 0;
      }

      setState((s) => ({
        ...s,
        isOnline: true,
        status: isReconnect ? 'reconnecting' : 'connecting',
        reconnectAttempt: reconnectAttemptsRef.current,
        lastError: null,
      }));

      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      let ws: WebSocket;
      try {
        ws = new WebSocket(`${proto}//${window.location.host}/ws`);
      } catch {
        setState((s) => ({
          ...s,
          status: 'failed',
          lastError: 'Gagal membuka koneksi ke server Multiplayer.',
        }));
        return;
      }
      wsRef.current = ws;

      connectTimeoutRef.current = window.setTimeout(() => {
        if (wsRef.current === ws && ws.readyState === WebSocket.CONNECTING) {
          try {
            ws.close();
          } catch {
            // ignore
          }
        }
      }, CONNECT_TIMEOUT_MS);

      ws.onopen = () => {
        if (connectTimeoutRef.current) {
          window.clearTimeout(connectTimeoutRef.current);
          connectTimeoutRef.current = null;
        }
        reconnectAttemptsRef.current = 0;
        setState((s) => ({
          ...s,
          isOnline: true,
          status: 'connected',
          reconnectAttempt: 0,
          lastError: null,
        }));

        if (pingTimerRef.current) window.clearInterval(pingTimerRef.current);
        pingTimerRef.current = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 12000);

        if (pendingActionRef.current) {
          const action = pendingActionRef.current;
          pendingActionRef.current = null;
          if (action.type === 'create_room') {
            ws.send(JSON.stringify({ type: 'create_room', character: action.character }));
          } else {
            ws.send(JSON.stringify({ type: 'join_room', roomCode: action.roomCode, character: action.character }));
          }
          return;
        }

        if (isReconnect && sessionRef.current) {
          ws.send(
            JSON.stringify({
              type: 'join_room',
              roomCode: sessionRef.current.roomCode,
              playerId: sessionRef.current.playerId,
              reconnectToken: sessionRef.current.reconnectToken,
            })
          );
        }
      };

      ws.onmessage = (ev) => {
        let msg: Record<string, unknown>;
        try {
          msg = JSON.parse(ev.data) as Record<string, unknown>;
        } catch {
          return;
        }

        const type = String(msg.type || '');
        if (type === 'pong') return;

        if (type === 'session_expired') {
          clearStoredSession();
          setState((s) => ({
            ...s,
            roomCode: null,
            playerId: null,
            role: null,
            snapshot: null,
            lastError: String(msg.message || 'Sesi room sebelumnya telah berakhir.'),
          }));
          return;
        }

        if (type === 'error') {
          setState((s) => ({ ...s, lastError: String(msg.message || 'Terjadi kesalahan koneksi.') }));
          return;
        }

        if (type === 'joined') {
          const roomCode = String(msg.roomCode || '');
          const playerId = String(msg.playerId || '');
          const reconnectToken = String(msg.reconnectToken || '');
          const role = (msg.role as MultiplayerRole | null) ?? null;

          sessionRef.current = { roomCode, playerId, reconnectToken };
          try {
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionRef.current));
          } catch {
            // ignore
          }

          setState((s) => ({
            ...s,
            roomCode,
            playerId,
            role,
            lastError: null,
            eliminatedNotice: null,
          }));
          return;
        }

        if (type === 'role_assigned') {
          const role = msg.role as MultiplayerRole;
          setState((s) => ({ ...s, role, eliminatedNotice: null }));
          return;
        }

        if (type === 'room_state') {
          const snapshot = msg.snapshot as RoomSnapshot;
          setState((s) => ({
            ...s,
            snapshot,
            role: snapshot.phase === 'lobby' ? null : s.role,
          }));
          return;
        }

        if (type === 'player_moved') {
          onRemoteMoveRef.current?.({
            playerId: String(msg.playerId),
            x: Number(msg.x),
            y: Number.isFinite(Number(msg.y)) ? Number(msg.y) : 0,
            z: Number(msg.z),
            yaw: Number(msg.yaw),
            animState: msg.animState as CharacterAnimState,
            inVent: Boolean(msg.inVent),
            activeEmote: (msg.activeEmote as EmoteId | null | undefined) ?? undefined,
          });
          return;
        }

        if (type === 'player_emote_broadcast') {
          onRemoteEmoteRef.current?.({
            playerId: String(msg.playerId),
            emoteId: (msg.emoteId as EmoteId | null) ?? null,
          });
          return;
        }

        if (type === 'voice_state_update') {
          const pid = String(msg.playerId || '');
          const rawVoice =
            (msg.voice && typeof msg.voice === 'object' ? (msg.voice as Partial<VoicePeerState>) : undefined) ||
            (msg as Partial<VoicePeerState>);
          const micOn = Boolean(rawVoice.micOn);
          const muted = Boolean(rawVoice.muted);
          const voice: VoicePeerState = {
            micOn,
            muted,
            speaking: micOn && !muted ? Boolean(rawVoice.speaking) : false,
          };
          setState((s) => {
            if (!s.snapshot) return s;
            return {
              ...s,
              snapshot: {
                ...s.snapshot,
                players: s.snapshot.players.map((p) => (p.id === pid ? { ...p, voice } : p)),
              },
            };
          });
          return;
        }

        if (type === 'rtc_signal') {
          const signalType = msg.signalType as 'offer' | 'answer' | 'ice';
          if (signalType === 'offer' || signalType === 'answer' || signalType === 'ice') {
            onRtcSignalRef.current?.({
              fromId: String(msg.fromId || ''),
              signalType,
              data: msg.data,
            });
          }
          return;
        }

        if (type === 'elimination_event') {
          const raw =
            (msg.event && typeof msg.event === 'object' ? (msg.event as Partial<EliminationEvent>) : undefined) ||
            (msg as unknown as Partial<EliminationEvent>);
          if (raw && typeof raw.eventId === 'string' && raw.eventId) {
            onEliminationEventRef.current?.({
              eventId: raw.eventId,
              impostorId: String(raw.impostorId || ''),
              impostorName: String(raw.impostorName || ''),
              victimId: String(raw.victimId || ''),
              victimName: String(raw.victimName || ''),
              victimColor: (raw.victimColor || 'biru') as EliminationEvent['victimColor'],
              x: Number(raw.x) || 0,
              z: Number(raw.z) || 0,
              roomName: String(raw.roomName || 'Central Lobby'),
              timestamp: Number(raw.timestamp) || Date.now(),
            });
          }
          return;
        }

        if (type === 'vent_teleported') {
          setState((s) => ({
            ...s,
            ventTeleportTick: {
              x: Number(msg.x),
              z: Number(msg.z),
              tick: Date.now(),
            },
          }));
          return;
        }

        if (type === 'you_were_eliminated') {
          setState((s) => ({
            ...s,
            eliminatedNotice: 'Kamu masuk ke Kapsul Stasis! Kamu sekarang berada dalam Mode Penonton (Spectator).',
          }));
        }
      };

      ws.onerror = () => {
        // Error detail handled consistently in onclose retry/failure transition
      };

      ws.onclose = () => {
        if (connectTimeoutRef.current) {
          window.clearTimeout(connectTimeoutRef.current);
          connectTimeoutRef.current = null;
        }
        if (pingTimerRef.current) {
          window.clearInterval(pingTimerRef.current);
          pingTimerRef.current = null;
        }
        if (wsRef.current === ws) {
          wsRef.current = null;
        }

        if (manualDisconnectRef.current) {
          setState((s) => ({ ...s, status: 'disconnected', reconnectAttempt: 0 }));
          return;
        }

        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
          pendingActionRef.current = null;
          setState((s) => ({
            ...s,
            isOnline: false,
            status: 'offline',
            reconnectAttempt: 0,
            lastError: 'Koneksi internet terputus. Kamu dapat mencoba ulang atau keluar ke Mode Solo.',
          }));
          return;
        }

        // Only auto-retry when user has an active session or was explicitly connecting/reconnecting
        const nextAttempt = reconnectAttemptsRef.current + 1;
        if (nextAttempt > MAX_RECONNECT_ATTEMPTS) {
          pendingActionRef.current = null;
          reconnectAttemptsRef.current = 0;
          setState((s) => ({
            ...s,
            status: 'failed',
            reconnectAttempt: MAX_RECONNECT_ATTEMPTS,
            lastError: 'Tidak dapat tersambung ke server Multiplayer. Periksa koneksi internet atau kembali ke Mode Solo.',
          }));
          return;
        }

        reconnectAttemptsRef.current = nextAttempt;
        const backoffMs = nextAttempt === 1 ? 1000 : nextAttempt === 2 ? 2000 : 3200;
        setState((s) => ({
          ...s,
          status: 'reconnecting',
          reconnectAttempt: nextAttempt,
        }));
        reconnectTimerRef.current = window.setTimeout(() => {
          connect(true);
        }, backoffMs);
      };
    },
    [clearStoredSession, clearTimers]
  );

  // Listen to browser online/offline transitions cleanly
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => {
      setState((s) => ({
        ...s,
        isOnline: true,
        status: s.status === 'offline' ? 'disconnected' : s.status,
        lastError: s.status === 'offline' ? null : s.lastError,
      }));
    };
    const handleOffline = () => {
      clearTimers();
      pendingActionRef.current = null;
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {
          // ignore
        }
        wsRef.current = null;
      }
      setState((s) => ({
        ...s,
        isOnline: false,
        status: 'offline',
        reconnectAttempt: 0,
        lastError: 'Koneksi internet terputus. Mode Solo tetap dapat dimainkan tanpa kuota.',
      }));
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [clearTimers]);

  const disconnect = useCallback(() => {
    manualDisconnectRef.current = true;
    reconnectAttemptsRef.current = 0;
    pendingActionRef.current = null;
    clearStoredSession();
    clearTimers();
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {
        // ignore
      }
      wsRef.current = null;
    }
    const onlineNow = typeof navigator !== 'undefined' ? navigator.onLine !== false : true;
    setState({
      status: onlineNow ? 'disconnected' : 'offline',
      isOnline: onlineNow,
      reconnectAttempt: 0,
      maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS,
      playerId: null,
      roomCode: null,
      role: null,
      snapshot: null,
      lastError: null,
      ventTeleportTick: null,
      eliminatedNotice: null,
    });
  }, [clearStoredSession, clearTimers]);

  const retryConnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    connect(Boolean(sessionRef.current));
  }, [connect]);

  useEffect(() => {
    return () => {
      manualDisconnectRef.current = true;
      clearTimers();
      try {
        wsRef.current?.close();
      } catch {
        // ignore
      }
    };
  }, [clearTimers]);

  const send = useCallback((payload: Record<string, unknown>) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    ws.send(JSON.stringify(payload));
    return true;
  }, []);

  const createRoom = useCallback(
    (character: CharacterConfig) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        send({ type: 'create_room', character });
      } else {
        pendingActionRef.current = { type: 'create_room', character };
        reconnectAttemptsRef.current = 0;
        connect(false);
      }
    },
    [connect, send]
  );

  const joinRoom = useCallback(
    (roomCode: string, character: CharacterConfig) => {
      const code = roomCode.trim().toUpperCase();
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        send({ type: 'join_room', roomCode: code, character });
      } else {
        pendingActionRef.current = { type: 'join_room', roomCode: code, character };
        reconnectAttemptsRef.current = 0;
        connect(false);
      }
    },
    [connect, send]
  );

  const leaveRoom = useCallback(() => {
    send({ type: 'leave_room' });
    clearStoredSession();
    pendingActionRef.current = null;
    setState((s) => ({
      ...s,
      roomCode: null,
      playerId: null,
      role: null,
      snapshot: null,
      lastError: null,
      eliminatedNotice: null,
    }));
  }, [clearStoredSession, send]);

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, lastError: null }));
  }, []);

  const clearEliminatedNotice = useCallback(() => {
    setState((s) => ({ ...s, eliminatedNotice: null }));
  }, []);

  const sendVoiceState = useCallback(
    (micOn: boolean, muted: boolean, speaking: boolean) =>
      send({ type: 'voice_state', micOn, muted, speaking }),
    [send]
  );

  const sendRtcSignal = useCallback(
    (targetId: string, signalType: 'offer' | 'answer' | 'ice', data: unknown) =>
      send({ type: 'rtc_signal', targetId, signalType, data }),
    [send]
  );

  return {
    ...state,
    connect,
    retryConnect,
    disconnect,
    createRoom,
    joinRoom,
    leaveRoom,
    clearError,
    clearEliminatedNotice,
    toggleReady: () => send({ type: 'toggle_ready' }),
    updateCharacter: (character: CharacterConfig) => send({ type: 'update_character', character }),
    startGame: () => send({ type: 'start_game' }),
    returnToLobby: () => send({ type: 'return_to_lobby' }),
    sendMove: (x: number, y: number, z: number, yaw: number, animState: CharacterAnimState, activeEmote?: EmoteId | null) =>
      send({ type: 'player_move', x, y, z, yaw, animState, activeEmote }),
    sendEmote: (emoteId: EmoteId | null) => send({ type: 'player_emote', emoteId }),
    setVentState: (inVent: boolean) => send({ type: 'vent_state', inVent }),
    useVent: (fromVentId: string, toVentId: string) =>
      send({ type: 'use_vent', fromVentId, toVentId }),
    eliminatePlayer: (targetId: string) => send({ type: 'eliminate_player', targetId }),
    completeMission: (missionId: string, score: number) =>
      send({ type: 'complete_mission', missionId, score }),
    completeImpostorChallenge: (challengeId: string, score: number) =>
      send({ type: 'complete_impostor_challenge', challengeId, score }),
    callMeeting: (reason: 'emergency' | 'report', podId?: string) =>
      send({ type: 'call_meeting', reason, podId }),
    sendMeetingChat: (text: string) => send({ type: 'meeting_chat', text }),
    castVote: (targetId: string) => send({ type: 'cast_vote', targetId }),
    sendVoiceState,
    sendRtcSignal,
  };
}
