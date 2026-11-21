import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocket, WebSocketServer } from 'ws';
import type {
  CharacterAnimState,
  CharacterConfig,
  EmoteId,
  MatchResultSummary,
  MeetingChatMessage,
  MeetingState,
  MultiplayerPhase,
  MultiplayerRole,
  RemotePlayerPublic,
  RoomSnapshot,
  StasisPodState,
  VoicePeerState,
} from './src/types/game.js';

const VALID_EMOTES = new Set<EmoteId>([
  'wave',
  'clap',
  'thumbs_up',
  'heart',
  'laugh',
  'sad',
  'surprised',
  'dance',
  'celebrate',
  'think',
]);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3000);
const IS_PROD = process.env.NODE_ENV === 'production';

// Authoritative Vent & Room Metadata (synchronized with src/data/stationLayout.ts)
interface ServerVent {
  id: string;
  x: number;
  z: number;
  exitOffsetX: number;
  exitOffsetZ: number;
  connectedTo: string[];
}

const VENTS_SERVER: Record<string, ServerVent> = {
  vent_comm: { id: 'vent_comm', x: -13.2, z: -12.0, exitOffsetX: -1.4, exitOffsetZ: -1.0, connectedTo: ['vent_nav', 'vent_tech'] },
  vent_nav: { id: 'vent_nav', x: -32.2, z: -4.8, exitOffsetX: -1.2, exitOffsetZ: 1.4, connectedTo: ['vent_comm', 'vent_tech'] },
  vent_tech: { id: 'vent_tech', x: -13.2, z: 12.0, exitOffsetX: -1.4, exitOffsetZ: 1.0, connectedTo: ['vent_comm', 'vent_nav'] },
  vent_lobby: { id: 'vent_lobby', x: 6.5, z: 5.8, exitOffsetX: -1.5, exitOffsetZ: -1.0, connectedTo: ['vent_balance', 'vent_world_econ', 'vent_identity'] },
  vent_balance: { id: 'vent_balance', x: -4.8, z: -40.2, exitOffsetX: 1.4, exitOffsetZ: 1.2, connectedTo: ['vent_lobby', 'vent_world_econ', 'vent_identity'] },
  vent_world_econ: { id: 'vent_world_econ', x: -15.2, z: -31.2, exitOffsetX: -1.4, exitOffsetZ: -1.2, connectedTo: ['vent_balance', 'vent_identity', 'vent_lobby'] },
  vent_identity: { id: 'vent_identity', x: 15.2, z: -31.2, exitOffsetX: 1.4, exitOffsetZ: -1.2, connectedTo: ['vent_balance', 'vent_world_econ', 'vent_lobby'] },
  vent_cultural: { id: 'vent_cultural', x: 13.2, z: -12.0, exitOffsetX: 1.4, exitOffsetZ: -1.0, connectedTo: ['vent_exchange', 'vent_economic'] },
  vent_exchange: { id: 'vent_exchange', x: 32.2, z: -4.8, exitOffsetX: 1.2, exitOffsetZ: 1.4, connectedTo: ['vent_cultural', 'vent_economic'] },
  vent_economic: { id: 'vent_economic', x: 13.2, z: 12.0, exitOffsetX: 1.4, exitOffsetZ: 1.0, connectedTo: ['vent_cultural', 'vent_exchange'] },
};

const ROOM_BOUNDS: Array<{ name: string; minX: number; maxX: number; minZ: number; maxZ: number }> = [
  { name: 'Central Lobby', minX: -9, maxX: 9, minZ: -8, maxZ: 8 },
  { name: 'Communication Room', minX: -25, maxX: -11, minZ: -22, maxZ: -10 },
  { name: 'Technology Laboratory', minX: -25, maxX: -11, minZ: 10, maxZ: 22 },
  { name: 'Navigation Room', minX: -44, maxX: -30, minZ: -7, maxZ: 7 },
  { name: 'Cultural Room', minX: 11, maxX: 25, minZ: -22, maxZ: -10 },
  { name: 'Economic Room', minX: 11, maxX: 25, minZ: 10, maxZ: 22 },
  { name: 'Global Exchange Room', minX: 30, maxX: 44, minZ: -7, maxZ: 7 },
  { name: 'Global Balance Room', minX: -7, maxX: 7, minZ: -42, maxZ: -30 },
  { name: 'World Economy Room', minX: -27, maxX: -13, minZ: -43, maxZ: -29 },
  { name: 'Cultural Identity Room', minX: 13, maxX: 27, minZ: -43, maxZ: -29 },
  { name: 'Earth Observation Room', minX: -12, maxX: 12, minZ: -66, maxZ: -48 },
];

function getServerRoomName(x: number, z: number): string {
  for (const r of ROOM_BOUNDS) {
    if (x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ) return r.name;
  }
  return 'Koridor Stasiun';
}

interface ServerPlayer {
  id: string;
  reconnectToken: string;
  name: string;
  character: CharacterConfig;
  ready: boolean;
  isHost: boolean;
  connected: boolean;
  alive: boolean;
  x: number;
  y: number;
  z: number;
  yaw: number;
  animState: CharacterAnimState;
  activeEmote: EmoteId | null;
  inVent: boolean;
  role: MultiplayerRole;
  completedMissions: Set<string>;
  completedImpostorChallenges: Set<string>;
  eduScore: number;
  voiceState: VoicePeerState;
  ws: WebSocket | null;
  disconnectTimer: ReturnType<typeof setTimeout> | null;
}

/**
 * Deterministic Central Lobby spawn ring around the Central Core (radius 3.25m).
 * Keeps >= 1.24m clearance from lobby_core, >= 1.35m from Central Terminal, >= 1.7m from perimeter furniture,
 * and >= 2.04m spacing between players for up to 10 simultaneous astronauts.
 */
function getCentralLobbySpawn(index: number, total: number): { x: number; z: number; yaw: number } {
  const count = Math.max(1, total);
  const angle = (index / count) * Math.PI * 2;
  const radius = 3.25;
  const x = Number((Math.cos(angle) * radius).toFixed(3));
  const z = Number((Math.sin(angle) * radius).toFixed(3));
  const yaw = Math.atan2(-x, -z);
  return { x, z, yaw };
}

interface ServerRoom {
  code: string;
  phase: MultiplayerPhase;
  players: Map<string, ServerPlayer>;
  stasisPods: StasisPodState[];
  crewMissionTotal: number;
  impostorObjectiveTotal: number;
  meeting: MeetingState | null;
  meetingTimer: ReturnType<typeof setTimeout> | null;
  meetingBannerTimer: ReturnType<typeof setTimeout> | null;
  matchResult: MatchResultSummary | null;
  killCooldownEndsAt: number;
  emergencyCooldownEndsAt: number;
}

const rooms = new Map<string, ServerRoom>();

function generateId(len = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let attempt = 0; attempt < 30; attempt++) {
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    if (!rooms.has(code)) return code;
  }
  return `G${Math.floor(10000 + Math.random() * 89999)}`;
}

function sanitizeCharacter(raw: Partial<CharacterConfig> | undefined, fallbackName = 'Astronaut'): CharacterConfig {
  const name = typeof raw?.name === 'string' && raw.name.trim() ? raw.name.trim().slice(0, 20) : fallbackName;
  const clamp = (v: unknown, min: number, max: number, fallback: number) =>
    typeof v === 'number' && Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : fallback;
  const hw = raw?.headwearTransform;
  const headwearTransform =
    hw && typeof hw === 'object'
      ? {
          offsetY: clamp(hw.offsetY, -0.25, 0.25, 0),
          offsetZ: clamp(hw.offsetZ, -0.25, 0.25, 0),
          tiltX: clamp(hw.tiltX, -0.4, 0.4, 0),
          scale: clamp(hw.scale, 0.75, 1.35, 1),
        }
      : undefined;

  return {
    name,
    color: raw?.color || 'biru',
    helmet: raw?.helmet || 'standard_visor',
    costume: raw?.costume || 'standard_crew',
    head: raw?.head || 'none',
    body: raw?.body || 'backpack',
    neck: raw?.neck || 'none',
    ...(headwearTransform ? { headwearTransform } : {}),
  };
}

function getColorHex(colorId: string): string {
  const map: Record<string, string> = {
    merah: '#ef4444',
    biru: '#3b82f6',
    hijau: '#10b981',
    kuning: '#eab308',
    ungu: '#8b5cf6',
    pink: '#ec4899',
    hitam: '#64748b',
    putih: '#e2e8f0',
    orange: '#f97316',
    maroon: '#be123c',
  };
  return map[colorId] || '#38bdf8';
}

function sendJson(ws: WebSocket | null, payload: unknown) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify(payload));
}

function buildSnapshotForPlayer(room: ServerRoom, recipient: ServerPlayer): RoomSnapshot {
  const allPlayers = Array.from(room.players.values());
  let crewDone = 0;
  let impDone = 0;
  allPlayers.forEach((p) => {
    if (p.role === 'crewmate') crewDone += p.completedMissions.size;
    if (p.role === 'impostor') impDone += p.completedImpostorChallenges.size;
  });

  const publicPlayers: RemotePlayerPublic[] = allPlayers.map((p) => ({
    id: p.id,
    name: p.name,
    character: p.character,
    ready: p.ready,
    isHost: p.isHost,
    connected: p.connected,
    alive: p.alive,
    x: p.x,
    y: p.y,
    z: p.z,
    yaw: p.yaw,
    animState: p.animState,
    activeEmote: p.activeEmote,
    inVent: p.inVent,
    completedMissionCount: p.role === 'impostor' ? p.completedImpostorChallenges.size : p.completedMissions.size,
    eduScore: p.eduScore,
    voice: p.voiceState,
  }));

  return {
    roomCode: room.code,
    phase: room.phase,
    players: publicPlayers,
    stasisPods: room.stasisPods,
    crewMissionTotal: room.crewMissionTotal,
    crewMissionDone: Math.min(crewDone, room.crewMissionTotal),
    impostorObjectiveTotal: room.impostorObjectiveTotal,
    impostorObjectiveDone: Math.min(impDone, room.impostorObjectiveTotal),
    meeting: room.meeting,
    matchResult: room.matchResult,
    killCooldownEndsAt: recipient.role === 'impostor' && room.phase === 'playing' ? room.killCooldownEndsAt : 0,
  };
}

function broadcastRoomState(room: ServerRoom) {
  room.players.forEach((p) => {
    sendJson(p.ws, {
      type: 'room_state',
      snapshot: buildSnapshotForPlayer(room, p),
    });
  });
}

function clearMeetingTimers(room: ServerRoom) {
  if (room.meetingTimer) {
    clearTimeout(room.meetingTimer);
    room.meetingTimer = null;
  }
  if (room.meetingBannerTimer) {
    clearTimeout(room.meetingBannerTimer);
    room.meetingBannerTimer = null;
  }
}

function endMatch(room: ServerRoom, winner: 'crewmate' | 'impostor', reason: string) {
  clearMeetingTimers(room);
  room.phase = 'ended';
  room.meeting = null;

  const allPlayers = Array.from(room.players.values());
  const impostor = allPlayers.find((p) => p.role === 'impostor') || allPlayers[0];
  let crewDone = 0;
  let impDone = 0;
  allPlayers.forEach((p) => {
    if (p.role === 'crewmate') crewDone += p.completedMissions.size;
    if (p.role === 'impostor') impDone += p.completedImpostorChallenges.size;
  });

  room.matchResult = {
    winner,
    reason,
    impostorId: impostor?.id || '',
    impostorName: impostor?.name || 'Unknown',
    crewMissionDone: Math.min(crewDone, room.crewMissionTotal),
    crewMissionTotal: room.crewMissionTotal,
    impostorObjectiveDone: Math.min(impDone, room.impostorObjectiveTotal),
    impostorObjectiveTotal: room.impostorObjectiveTotal,
    players: allPlayers.map((p) => ({
      id: p.id,
      name: p.name,
      role: p.role,
      alive: p.alive,
      completedMissions: p.role === 'impostor' ? p.completedImpostorChallenges.size : p.completedMissions.size,
      eduScore: p.eduScore,
    })),
  };

  broadcastRoomState(room);
}

function checkWinConditions(room: ServerRoom): boolean {
  if (room.phase !== 'playing' && room.phase !== 'meeting') return false;
  const players = Array.from(room.players.values());
  const aliveImpostor = players.find((p) => p.role === 'impostor' && p.alive);
  if (!aliveImpostor) {
    endMatch(room, 'crewmate', 'Impostor telah diejeksi dari stasiun GLOBALUS!');
    return true;
  }

  const aliveCrew = players.filter((p) => p.role === 'crewmate' && p.alive);
  if (aliveCrew.length <= 1 && players.length >= 2) {
    endMatch(room, 'impostor', 'Jumlah Crewmate aktif tidak lagi cukup untuk menghentikan Impostor!');
    return true;
  }

  let crewDone = 0;
  let impDone = 0;
  players.forEach((p) => {
    if (p.role === 'crewmate') crewDone += p.completedMissions.size;
    if (p.role === 'impostor') impDone += p.completedImpostorChallenges.size;
  });

  if (room.crewMissionTotal > 0 && crewDone >= room.crewMissionTotal) {
    endMatch(room, 'crewmate', 'Seluruh misi Global Network berhasil diselesaikan oleh Crewmate!');
    return true;
  }

  if (room.impostorObjectiveTotal > 0 && impDone >= room.impostorObjectiveTotal) {
    endMatch(room, 'impostor', 'Impostor berhasil menyelesaikan seluruh sabotase rahasia Global Network!');
    return true;
  }

  return false;
}

function resolveMeetingVotes(room: ServerRoom) {
  if (room.phase !== 'meeting' || !room.meeting) return;
  if (room.meeting.resultBanner) return;

  clearMeetingTimers(room);

  const tally = new Map<string, number>();
  Object.values(room.meeting.votes).forEach((target) => {
    tally.set(target, (tally.get(target) || 0) + 1);
  });

  let topTarget: string | null = null;
  let topCount = 0;
  let isTie = false;

  tally.forEach((count, target) => {
    if (count > topCount) {
      topCount = count;
      topTarget = target;
      isTie = false;
    } else if (count === topCount && count > 0) {
      isTie = true;
    }
  });

  let ejectedPlayer: ServerPlayer | undefined;
  let reasonText = 'Tidak ada yang diejeksi (Suara Seri atau Lewati).';

  if (!isTie && topTarget && topTarget !== 'SKIP' && topCount > 0) {
    ejectedPlayer = room.players.get(topTarget);
    if (ejectedPlayer && ejectedPlayer.alive) {
      ejectedPlayer.alive = false;
      ejectedPlayer.inVent = false;
      reasonText =
        ejectedPlayer.role === 'impostor'
          ? `${ejectedPlayer.name} dikeluarkan ke kapsul orbit... Dia adalah IMPOSTOR!`
          : `${ejectedPlayer.name} dikeluarkan ke kapsul orbit... Dia bukan Impostor.`;
    }
  } else if (topTarget === 'SKIP' && !isTie && topCount > 0) {
    reasonText = 'Mayoritas memilih Lewati Voting. Tidak ada kru yang dikeluarkan.';
  }

  room.meeting.resultBanner = {
    ejectedId: ejectedPlayer?.id || null,
    ejectedName: ejectedPlayer?.name || null,
    wasImpostor: ejectedPlayer ? ejectedPlayer.role === 'impostor' : null,
    reasonText,
  };
  broadcastRoomState(room);

  room.meetingBannerTimer = setTimeout(() => {
    if (!rooms.has(room.code)) return;
    if (checkWinConditions(room)) return;

    // Resume playing from Central Lobby
    room.phase = 'playing';
    room.meeting = null;
    room.killCooldownEndsAt = Date.now() + 15000;
    room.emergencyCooldownEndsAt = Date.now() + 20000;

    const all = Array.from(room.players.values());
    all.forEach((p, idx) => {
      const slot = getCentralLobbySpawn(idx, all.length);
      p.x = slot.x;
      p.y = 0;
      p.z = slot.z;
      p.yaw = slot.yaw;
      p.inVent = false;
      p.animState = 'idle';
      p.activeEmote = null;
    });

    broadcastRoomState(room);
  }, 4200);
}

function removePlayerFromRoom(room: ServerRoom, playerId: string) {
  const player = room.players.get(playerId);
  if (!player) return;
  if (player.disconnectTimer) clearTimeout(player.disconnectTimer);
  room.players.delete(playerId);

  if (room.players.size === 0) {
    clearMeetingTimers(room);
    rooms.delete(room.code);
    return;
  }

  if (player.isHost) {
    const nextHost = Array.from(room.players.values())[0];
    if (nextHost) nextHost.isHost = true;
  }

  if (room.phase === 'playing' || room.phase === 'meeting') {
    if (!checkWinConditions(room)) {
      broadcastRoomState(room);
    }
  } else {
    broadcastRoomState(room);
  }
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, rooms: rooms.size });
  });

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  interface AliveWebSocket extends WebSocket {
    isAlive?: boolean;
  }

  const hbInterval = setInterval(() => {
    wss.clients.forEach((client) => {
      const sock = client as AliveWebSocket;
      if (sock.isAlive === false) {
        sock.terminate();
        return;
      }
      sock.isAlive = false;
      try {
        sock.ping();
      } catch {
        // ignore ping failure
      }
    });
  }, 25000);

  wss.on('close', () => {
    clearInterval(hbInterval);
  });

  wss.on('connection', (rawWs) => {
    const ws = rawWs as AliveWebSocket;
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });
    ws.on('error', () => {
      // prevent unhandled socket error crash
    });
    let boundRoomCode: string | null = null;
    let boundPlayerId: string | null = null;

    ws.on('message', (raw) => {
      ws.isAlive = true;
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(raw.toString()) as Record<string, unknown>;
      } catch {
        return;
      }

      const type = String(msg.type || '');

      if (type === 'ping') {
        sendJson(ws, { type: 'pong', ts: Date.now() });
        return;
      }

      if (type === 'create_room') {
        if (boundRoomCode && boundPlayerId) {
          const oldRoom = rooms.get(boundRoomCode);
          if (oldRoom) removePlayerFromRoom(oldRoom, boundPlayerId);
        }

        const code = generateRoomCode();
        const playerId = generateId(10);
        const reconnectToken = generateId(16);
        const char = sanitizeCharacter(msg.character as Partial<CharacterConfig>);

        const player: ServerPlayer = {
          id: playerId,
          reconnectToken,
          name: char.name,
          character: char,
          ready: true,
          isHost: true,
          connected: true,
          alive: true,
          x: 0,
          y: 0,
          z: 3.2,
          yaw: Math.PI,
          animState: 'idle',
          activeEmote: null,
          inVent: false,
          role: 'crewmate',
          completedMissions: new Set(),
          completedImpostorChallenges: new Set(),
          eduScore: 0,
          voiceState: { micOn: false, muted: false, speaking: false },
          ws,
          disconnectTimer: null,
        };

        const room: ServerRoom = {
          code,
          phase: 'lobby',
          players: new Map([[playerId, player]]),
          stasisPods: [],
          crewMissionTotal: 6,
          impostorObjectiveTotal: 4,
          meeting: null,
          meetingTimer: null,
          meetingBannerTimer: null,
          matchResult: null,
          killCooldownEndsAt: 0,
          emergencyCooldownEndsAt: 0,
        };
        rooms.set(code, room);

        boundRoomCode = code;
        boundPlayerId = playerId;

        sendJson(ws, {
          type: 'joined',
          roomCode: code,
          playerId,
          reconnectToken,
          role: null,
        });
        broadcastRoomState(room);
        return;
      }

      if (type === 'join_room') {
        const roomCode = String(msg.roomCode || '').trim().toUpperCase();
        const reqPid = typeof msg.playerId === 'string' ? msg.playerId : '';
        const reqToken = typeof msg.reconnectToken === 'string' ? msg.reconnectToken : '';
        const room = rooms.get(roomCode);
        if (!room) {
          if (reqPid && reqToken) {
            sendJson(ws, {
              type: 'session_expired',
              message: `Sesi room "${roomCode}" sudah berakhir atau tidak tersedia.`,
            });
          } else {
            sendJson(ws, { type: 'error', message: `Room "${roomCode}" tidak ditemukan.` });
          }
          return;
        }

        // Check reconnect token first
        if (reqPid && reqToken) {
          const existing = room.players.get(reqPid);
          if (existing && existing.reconnectToken === reqToken) {
            if (existing.disconnectTimer) {
              clearTimeout(existing.disconnectTimer);
              existing.disconnectTimer = null;
            }
            existing.ws = ws;
            existing.connected = true;
            boundRoomCode = room.code;
            boundPlayerId = existing.id;

            sendJson(ws, {
              type: 'joined',
              roomCode: room.code,
              playerId: existing.id,
              reconnectToken: existing.reconnectToken,
              role: room.phase === 'lobby' ? null : existing.role,
            });
            broadcastRoomState(room);
            return;
          }
          sendJson(ws, {
            type: 'session_expired',
            message: 'Sesi pemain sebelumnya sudah kadaluarsa. Silakan gabung ulang.',
          });
          return;
        }

        if (room.phase !== 'lobby') {
          sendJson(ws, { type: 'error', message: 'Permainan di room ini sedang berlangsung.' });
          return;
        }
        if (room.players.size >= 10) {
          sendJson(ws, { type: 'error', message: 'Room sudah penuh (maksimal 10 pemain).' });
          return;
        }

        const char = sanitizeCharacter(msg.character as Partial<CharacterConfig>);
        const playerId = generateId(10);
        const reconnectToken = generateId(16);
        const joinSlot = getCentralLobbySpawn(room.players.size, Math.max(2, room.players.size + 1));
        const player: ServerPlayer = {
          id: playerId,
          reconnectToken,
          name: char.name,
          character: char,
          ready: false,
          isHost: false,
          connected: true,
          alive: true,
          x: joinSlot.x,
          y: 0,
          z: joinSlot.z,
          yaw: joinSlot.yaw,
          animState: 'idle',
          activeEmote: null,
          inVent: false,
          role: 'crewmate',
          completedMissions: new Set(),
          completedImpostorChallenges: new Set(),
          eduScore: 0,
          voiceState: { micOn: false, muted: false, speaking: false },
          ws,
          disconnectTimer: null,
        };
        room.players.set(playerId, player);
        boundRoomCode = room.code;
        boundPlayerId = playerId;

        sendJson(ws, {
          type: 'joined',
          roomCode: room.code,
          playerId,
          reconnectToken,
          role: null,
        });
        broadcastRoomState(room);
        return;
      }

      // Authenticated room actions
      if (!boundRoomCode || !boundPlayerId) return;
      const room = rooms.get(boundRoomCode);
      const player = room?.players.get(boundPlayerId);
      if (!room || !player) return;

      if (type === 'leave_room') {
        removePlayerFromRoom(room, player.id);
        boundRoomCode = null;
        boundPlayerId = null;
        return;
      }

      if (type === 'toggle_ready') {
        if (room.phase !== 'lobby') return;
        player.ready = !player.ready;
        broadcastRoomState(room);
        return;
      }

      if (type === 'update_character') {
        if (room.phase !== 'lobby') return;
        const char = sanitizeCharacter(msg.character as Partial<CharacterConfig>, player.name);
        player.character = char;
        player.name = char.name;
        broadcastRoomState(room);
        return;
      }

      if (type === 'start_game') {
        if (room.phase !== 'lobby' || !player.isHost) return;
        const all = Array.from(room.players.values());
        if (all.length < 2) {
          sendJson(ws, { type: 'error', message: 'Minimal 2 pemain diperlukan untuk memulai Multiplayer.' });
          return;
        }
        const notReady = all.filter((p) => !p.isHost && !p.ready);
        if (notReady.length > 0) {
          sendJson(ws, { type: 'error', message: 'Semua pemain harus menekan SIAP (Ready) sebelum mulai.' });
          return;
        }

        const impIndex = Math.floor(Math.random() * all.length);
        const crewCount = all.length - 1;

        room.phase = 'playing';
        room.stasisPods = [];
        room.meeting = null;
        room.matchResult = null;
        room.crewMissionTotal = Math.min(9, Math.max(3, crewCount * 3));
        room.impostorObjectiveTotal = 4;
        room.killCooldownEndsAt = Date.now() + 18000;
        room.emergencyCooldownEndsAt = Date.now() + 15000;

        all.forEach((p, idx) => {
          p.role = idx === impIndex ? 'impostor' : 'crewmate';
          p.alive = true;
          p.inVent = false;
          p.activeEmote = null;
          p.completedMissions.clear();
          p.completedImpostorChallenges.clear();
          p.eduScore = 0;
          const slot = getCentralLobbySpawn(idx, all.length);
          p.x = slot.x;
          p.y = 0;
          p.z = slot.z;
          p.yaw = slot.yaw;
          p.animState = 'idle';

          // Strictly private role notification!
          sendJson(p.ws, {
            type: 'role_assigned',
            role: p.role,
            playerCount: all.length,
          });
        });

        broadcastRoomState(room);
        return;
      }

      if (type === 'return_to_lobby') {
        if (room.phase !== 'ended') return;
        clearMeetingTimers(room);
        room.phase = 'lobby';
        room.stasisPods = [];
        room.meeting = null;
        room.matchResult = null;
        room.players.forEach((p) => {
          p.alive = true;
          p.inVent = false;
          p.activeEmote = null;
          p.ready = p.isHost;
          p.role = 'crewmate';
          p.completedMissions.clear();
          p.completedImpostorChallenges.clear();
          p.eduScore = 0;
          p.x = 0;
          p.y = 0;
          p.z = 3.2;
        });
        broadcastRoomState(room);
        return;
      }

      if (type === 'player_move') {
        if (room.phase !== 'playing') return;
        const x = Number(msg.x);
        const y = Number.isFinite(Number(msg.y)) ? Number(msg.y) : 0;
        const z = Number(msg.z);
        const yaw = Number(msg.yaw);
        const animState = String(msg.animState || 'idle') as CharacterAnimState;
        if (!Number.isFinite(x) || !Number.isFinite(z) || !Number.isFinite(yaw)) return;

        player.x = Math.max(-45, Math.min(45, x));
        player.y = Math.max(0, Math.min(2.2, y));
        player.z = Math.max(-67, Math.min(23, z));
        player.yaw = yaw;
        player.animState = animState;
        if (msg.activeEmote === null) {
          player.activeEmote = null;
        } else if (typeof msg.activeEmote === 'string' && VALID_EMOTES.has(msg.activeEmote as EmoteId)) {
          player.activeEmote = msg.activeEmote as EmoteId;
        }

        const movePayload = JSON.stringify({
          type: 'player_moved',
          playerId: player.id,
          x: player.x,
          y: player.y,
          z: player.z,
          yaw: player.yaw,
          animState: player.animState,
          activeEmote: player.activeEmote,
          inVent: player.inVent,
        });
        room.players.forEach((other) => {
          if (other.id !== player.id && other.ws && other.ws.readyState === WebSocket.OPEN) {
            other.ws.send(movePayload);
          }
        });
        return;
      }

      if (type === 'player_emote') {
        if (room.phase !== 'playing') return;
        const rawEmote = msg.emoteId;
        const emoteId =
          typeof rawEmote === 'string' && VALID_EMOTES.has(rawEmote as EmoteId)
            ? (rawEmote as EmoteId)
            : null;
        player.activeEmote = emoteId;
        const emotePayload = JSON.stringify({
          type: 'player_emote_broadcast',
          playerId: player.id,
          emoteId,
        });
        room.players.forEach((other) => {
          if (other.id !== player.id && other.ws && other.ws.readyState === WebSocket.OPEN) {
            other.ws.send(emotePayload);
          }
        });
        return;
      }

      if (type === 'vent_state') {
        if (room.phase !== 'playing' || !player.alive || player.role !== 'impostor') return;
        player.inVent = Boolean(msg.inVent);
        broadcastRoomState(room);
        return;
      }

      if (type === 'use_vent') {
        if (room.phase !== 'playing' || !player.alive || player.role !== 'impostor') return;
        const fromId = String(msg.fromVentId || '');
        const toId = String(msg.toVentId || '');
        const fromVent = VENTS_SERVER[fromId];
        const toVent = VENTS_SERVER[toId];
        if (!fromVent || !toVent || !fromVent.connectedTo.includes(toId)) return;

        const dist = Math.hypot(player.x - fromVent.x, player.z - fromVent.z);
        if (!player.inVent && dist > 4.5) return;

        player.x = toVent.x + toVent.exitOffsetX;
        player.z = toVent.z + toVent.exitOffsetZ;
        player.inVent = false;
        player.animState = 'vent_out';

        sendJson(ws, {
          type: 'vent_teleported',
          x: player.x,
          z: player.z,
          ventId: toId,
        });
        broadcastRoomState(room);
        return;
      }

      if (type === 'voice_state') {
        const micOn = Boolean(msg.micOn);
        const muted = Boolean(msg.muted);
        const speaking = micOn && !muted ? Boolean(msg.speaking) : false;
        player.voiceState = { micOn, muted, speaking };
        const voicePayload = JSON.stringify({
          type: 'voice_state_update',
          playerId: player.id,
          voice: player.voiceState,
        });
        room.players.forEach((other) => {
          if (other.ws && other.ws.readyState === WebSocket.OPEN) {
            other.ws.send(voicePayload);
          }
        });
        return;
      }

      if (type === 'rtc_signal') {
        const targetId = String(msg.targetId || '');
        const signalType = String(msg.signalType || '');
        if (!targetId || (signalType !== 'offer' && signalType !== 'answer' && signalType !== 'ice')) {
          return;
        }
        const target = room.players.get(targetId);
        if (!target || target.id === player.id || !target.ws || target.ws.readyState !== WebSocket.OPEN) {
          return;
        }
        sendJson(target.ws, {
          type: 'rtc_signal',
          fromId: player.id,
          signalType,
          data: msg.data,
        });
        return;
      }

      if (type === 'eliminate_player') {
        if (room.phase !== 'playing' || !player.alive || player.role !== 'impostor' || player.inVent) return;
        if (Date.now() < room.killCooldownEndsAt) return;

        const targetId = String(msg.targetId || '');
        const target = room.players.get(targetId);
        if (!target || !target.alive || target.role !== 'crewmate') return;

        const dist = Math.hypot(player.x - target.x, player.z - target.z);
        if (dist > 4.2) return;

        // Mark eliminated & lock cooldown atomically first to prevent double-trigger from lag/double input
        target.alive = false;
        target.inVent = false;
        room.killCooldownEndsAt = Date.now() + 20000;

        const elimX = target.x;
        const elimZ = target.z;
        const roomName = getServerRoomName(elimX, elimZ);
        player.x = elimX;
        player.z = elimZ;

        room.stasisPods.push({
          id: generateId(8),
          victimId: target.id,
          victimName: target.name,
          victimColor: target.character.color,
          x: elimX,
          z: elimZ,
          roomName,
        });

        const elimPayload = JSON.stringify({
          type: 'elimination_event',
          eventId: `elim_${target.id}_${Date.now()}`,
          impostorId: player.id,
          impostorName: player.name,
          victimId: target.id,
          victimName: target.name,
          victimColor: target.character.color,
          x: elimX,
          z: elimZ,
          roomName,
          timestamp: Date.now(),
        });
        room.players.forEach((p) => {
          if (p.ws && p.ws.readyState === WebSocket.OPEN) {
            p.ws.send(elimPayload);
          }
        });

        sendJson(target.ws, { type: 'you_were_eliminated', by: 'Impostor' });
        if (!checkWinConditions(room)) {
          broadcastRoomState(room);
        }
        return;
      }

      if (type === 'complete_mission') {
        if (room.phase !== 'playing' || player.role !== 'crewmate') return;
        const missionId = String(msg.missionId || '');
        const score = Math.max(0, Math.min(100, Number(msg.score) || 80));
        if (!missionId) return;

        if (!player.completedMissions.has(missionId)) {
          player.completedMissions.add(missionId);
          player.eduScore += score;
        }
        if (!checkWinConditions(room)) {
          broadcastRoomState(room);
        }
        return;
      }

      if (type === 'complete_impostor_challenge') {
        if (room.phase !== 'playing' || player.role !== 'impostor' || !player.alive) return;
        const challengeId = String(msg.challengeId || '');
        const score = Math.max(0, Math.min(100, Number(msg.score) || 80));
        if (!challengeId) return;

        if (!player.completedImpostorChallenges.has(challengeId)) {
          player.completedImpostorChallenges.add(challengeId);
          player.eduScore += score;
          // Sabotage bonus: trims 3s off cooldown
          room.killCooldownEndsAt = Math.max(Date.now(), room.killCooldownEndsAt - 3000);
        }
        if (!checkWinConditions(room)) {
          broadcastRoomState(room);
        }
        return;
      }

      if (type === 'call_meeting') {
        if (room.phase !== 'playing' || !player.alive) return;
        const reason = msg.reason === 'report' ? 'report' : 'emergency';
        let subjectName: string | undefined;
        let locationName = getServerRoomName(player.x, player.z);

        if (reason === 'emergency') {
          if (Date.now() < room.emergencyCooldownEndsAt) {
            sendJson(ws, { type: 'error', message: 'Tombol Emergency Meeting masih dalam cooldown.' });
            return;
          }
          if (Math.hypot(player.x, player.z) > 6.5) return;
        } else {
          const podId = String(msg.podId || '');
          const pod = room.stasisPods.find((s) => s.id === podId);
          if (!pod || Math.hypot(player.x - pod.x, player.z - pod.z) > 6.0) return;
          subjectName = pod.victimName;
          locationName = pod.roomName;
        }

        clearMeetingTimers(room);
        room.phase = 'meeting';
        room.stasisPods = [];
        room.players.forEach((p) => {
          p.inVent = false;
        });

        const sysMsg: MeetingChatMessage = {
          id: generateId(8),
          senderId: 'system',
          senderName: 'SISTEM GLOBALUS',
          senderColor: '#f59e0b',
          text:
            reason === 'report'
              ? `${player.name} melaporkan Stasis Pod milik ${subjectName} di ${locationName}!`
              : `${player.name} memanggil Rapat Darurat di Central Lobby!`,
          timestamp: Date.now(),
          isSystem: true,
        };

        room.meeting = {
          reason,
          callerName: player.name,
          subjectName,
          locationName,
          endsAt: Date.now() + 45000,
          votes: {},
          messages: [sysMsg],
        };

        room.meetingTimer = setTimeout(() => {
          resolveMeetingVotes(room);
        }, 45000);

        broadcastRoomState(room);
        return;
      }

      if (type === 'meeting_chat') {
        if (room.phase !== 'meeting' || !room.meeting || !player.alive) return;
        const text = String(msg.text || '').trim().slice(0, 220);
        if (!text) return;

        room.meeting.messages.push({
          id: generateId(8),
          senderId: player.id,
          senderName: player.name,
          senderColor: getColorHex(player.character.color),
          text,
          timestamp: Date.now(),
        });
        if (room.meeting.messages.length > 60) {
          room.meeting.messages = room.meeting.messages.slice(-60);
        }
        broadcastRoomState(room);
        return;
      }

      if (type === 'cast_vote') {
        if (room.phase !== 'meeting' || !room.meeting || !player.alive || room.meeting.resultBanner) return;
        if (room.meeting.votes[player.id]) return;

        const targetId = String(msg.targetId || '');
        if (targetId !== 'SKIP') {
          const target = room.players.get(targetId);
          if (!target || !target.alive) return;
        }

        room.meeting.votes[player.id] = targetId;

        const aliveCount = Array.from(room.players.values()).filter((p) => p.alive).length;
        const voteCount = Object.keys(room.meeting.votes).length;

        if (voteCount >= aliveCount) {
          resolveMeetingVotes(room);
        } else {
          broadcastRoomState(room);
        }
      }
    });

    ws.on('close', () => {
      if (!boundRoomCode || !boundPlayerId) return;
      const room = rooms.get(boundRoomCode);
      const player = room?.players.get(boundPlayerId);
      if (!room || !player) return;

      player.connected = false;
      player.ws = null;
      broadcastRoomState(room);

      // Allow 20 seconds grace period for automatic reconnect before removing player
      const pid = player.id;
      player.disconnectTimer = setTimeout(() => {
        const curRoom = rooms.get(room.code);
        if (!curRoom) return;
        const curPlayer = curRoom.players.get(pid);
        if (curPlayer && !curPlayer.connected) {
          removePlayerFromRoom(curRoom, pid);
        }
      }, 20000);
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[GLOBALUS Server] Listening on http://0.0.0.0:${PORT} (WebSocket /ws ready)`);
  });
}

startServer().catch((err) => {
  console.error('[GLOBALUS Server] Fatal startup error:', err);
  process.exit(1);
});
