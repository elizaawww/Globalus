import { ChapterId, MissionId, RoomId } from '../types/game';

export interface Rect2D {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  roomId?: RoomId;
  floorColor?: number;
  trimColor?: number;
}

export interface DoorDef {
  id: string;
  x: number;
  z: number;
  orientation: 'horizontal' | 'vertical';
  width: number;
  accentHex: string;
  label: string;
  requiredChapter?: ChapterId;
  requiresAllChapters?: boolean;
  roomId?: RoomId;
}

export interface VentDef {
  id: string;
  roomId: RoomId;
  label: string;
  x: number;
  z: number;
  exitOffsetX: number;
  exitOffsetZ: number;
  network: 'west' | 'north' | 'east';
  connectedTo: string[];
}

export interface RoomDef {
  id: RoomId;
  name: string;
  shortName: string;
  chapter?: ChapterId;
  missionId?: MissionId;
  doorId?: string;
  neverLock?: boolean;
  center: { x: number; z: number };
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  accentHex: string;
  accentNum: number;
  description: string;
  terminalPos: { x: number; z: number };
  terminalLabel: string;
  hasSpaceWindow?: 'north' | 'west' | 'east' | 'south';
}

export interface PropCollider {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export const ROOMS: Record<RoomId, RoomDef> = {
  central_lobby: {
    id: 'central_lobby',
    name: 'Central Lobby',
    shortName: 'Lobby',
    chapter: 1,
    missionId: 'ch1_m2',
    neverLock: true,
    center: { x: 0, z: 0 },
    bounds: { minX: -9, maxX: 9, minZ: -8, maxZ: 8 },
    accentHex: '#38bdf8',
    accentNum: 0x38bdf8,
    description: 'Pusat kendali GLOBALUS Space Station dengan inti Global Network, Misi 1.2 (Hyperglobalist), & tombol Emergency Meeting.',
    terminalPos: { x: 0, z: -4.6 },
    terminalLabel: 'Pusat Kontrol & Misi 1.2: Perspektif Hyperglobalist',
  },
  communication_room: {
    id: 'communication_room',
    name: 'Communication Room',
    shortName: 'Comm Room',
    chapter: 3,
    missionId: 'ch3_m1',
    doorId: 'door_wn',
    center: { x: -18, z: -16 },
    bounds: { minX: -25, maxX: -11, minZ: -22, maxZ: -10 },
    accentHex: '#0ea5e9',
    accentNum: 0x0ea5e9,
    description: 'Modul jaringan komunikasi lintas benua, satelit, radar, dan ruang kerja operator.',
    terminalPos: { x: -18, z: -18.8 },
    terminalLabel: 'Misi 3.1: Revolusi Komunikasi & Media Global',
    hasSpaceWindow: 'north',
  },
  technology_lab: {
    id: 'technology_lab',
    name: 'Technology Laboratory',
    shortName: 'Tech Lab',
    chapter: 3,
    missionId: 'ch3_m2',
    doorId: 'door_ws',
    center: { x: -18, z: 16 },
    bounds: { minX: -25, maxX: -11, minZ: 10, maxZ: 22 },
    accentHex: '#6366f1',
    accentNum: 0x6366f1,
    description: 'Laboratorium inovasi IPTEK: AI, robotika, kapsul bio-medis, dan generator energi.',
    terminalPos: { x: -18, z: 18.8 },
    terminalLabel: 'Misi 3.2: IPTEK, AI & Interaksi Lintas Batas',
    hasSpaceWindow: 'south',
  },
  navigation_room: {
    id: 'navigation_room',
    name: 'Navigation Room',
    shortName: 'Navigation',
    chapter: 1,
    missionId: 'ch1_m1',
    doorId: 'door_wfar',
    center: { x: -37, z: 0 },
    bounds: { minX: -44, maxX: -30, minZ: -7, maxZ: 7 },
    accentHex: '#2563eb',
    accentNum: 0x2563eb,
    description: 'Ruang navigasi transportasi global, radar orbit, & fondasi konsep dasar globalisasi.',
    terminalPos: { x: -40.2, z: 0 },
    terminalLabel: 'Misi 1.1: Konsep Dasar & Ciri Globalisasi',
    hasSpaceWindow: 'west',
  },
  cultural_room: {
    id: 'cultural_room',
    name: 'Cultural Room',
    shortName: 'Cultural',
    chapter: 2,
    missionId: 'ch2_m1',
    doorId: 'door_en',
    center: { x: 18, z: -16 },
    bounds: { minX: 11, maxX: 25, minZ: -22, maxZ: -10 },
    accentHex: '#10b981',
    accentNum: 0x10b981,
    description: 'Galeri pertukaran budaya global, vitrin artefak Nusantara, dan area lounge.',
    terminalPos: { x: 18, z: -18.8 },
    terminalLabel: 'Misi 2.1: Transformasi Sosial & Akulturasi',
    hasSpaceWindow: 'north',
  },
  economic_room: {
    id: 'economic_room',
    name: 'Economic Room',
    shortName: 'Economic',
    chapter: 4,
    missionId: 'ch4_m1',
    doorId: 'door_es',
    center: { x: 18, z: 16 },
    bounds: { minX: 11, maxX: 25, minZ: 10, maxZ: 22 },
    accentHex: '#f59e0b',
    accentNum: 0xf59e0b,
    description: 'Pusat simulasi perdagangan, rak kargo ekspor-impor, MNC, dan bursa ekonomi global.',
    terminalPos: { x: 18, z: 18.8 },
    terminalLabel: 'Misi 4.1: Dampak Ekonomi, MNC & Pasar Bebas',
    hasSpaceWindow: 'south',
  },
  global_exchange_room: {
    id: 'global_exchange_room',
    name: 'Global Exchange Room',
    shortName: 'Exchange',
    chapter: 2,
    missionId: 'ch2_m2',
    doorId: 'door_efar',
    center: { x: 37, z: 0 },
    bounds: { minX: 30, maxX: 44, minZ: -7, maxZ: 7 },
    accentHex: '#14b8a6',
    accentNum: 0x14b8a6,
    description: 'Ruang diplomasi global, layar peta dunia besar, dan sintesis glokalisasi.',
    terminalPos: { x: 40.2, z: 0 },
    terminalLabel: 'Misi 2.2: Teori Transformasionalis & Glokalisasi',
    hasSpaceWindow: 'east',
  },
  global_balance_room: {
    id: 'global_balance_room',
    name: 'Global Balance Room',
    shortName: 'Balance',
    chapter: 5,
    missionId: 'ch5_m2',
    neverLock: true,
    center: { x: 0, z: -36 },
    bounds: { minX: -7, maxX: 7, minZ: -42, maxZ: -30 },
    accentHex: '#f43f5e',
    accentNum: 0xf43f5e,
    description: 'Pusat analisis kritis keseimbangan dampak globalisasi & persimpangan Sayap Utara.',
    terminalPos: { x: 4.3, z: -36 },
    terminalLabel: 'Misi 5.2: Perspektif Skeptis & Sikap Selektif',
  },
  world_economy_room: {
    id: 'world_economy_room',
    name: 'World Economy Room',
    shortName: 'World Econ',
    chapter: 4,
    missionId: 'ch4_m2',
    doorId: 'door_nw',
    center: { x: -20, z: -36 },
    bounds: { minX: -27, maxX: -13, minZ: -43, maxZ: -29 },
    accentHex: '#b91c1c',
    accentNum: 0xb91c1c,
    description: 'Ruang analisis Sistem Dunia Wallerstein: Core, Semi-Periphery, dan ketimpangan global.',
    terminalPos: { x: -23.2, z: -36 },
    terminalLabel: 'Misi 4.2: Ketimpangan Global & Sistem Dunia',
    hasSpaceWindow: 'west',
  },
  cultural_identity_room: {
    id: 'cultural_identity_room',
    name: 'Cultural Identity Room',
    shortName: 'Identity',
    chapter: 5,
    missionId: 'ch5_m1',
    doorId: 'door_ne',
    center: { x: 20, z: -36 },
    bounds: { minX: 13, maxX: 27, minZ: -43, maxZ: -29 },
    accentHex: '#d97706',
    accentNum: 0xd97706,
    description: 'Arsip ketahanan identitas budaya: westernisasi, neokolonialisme, cultural lag.',
    terminalPos: { x: 23.2, z: -36 },
    terminalLabel: 'Misi 5.1: Identitas Budaya & Cultural Lag',
    hasSpaceWindow: 'east',
  },
  earth_observation_room: {
    id: 'earth_observation_room',
    name: 'Earth Observation Room',
    shortName: 'Observation',
    neverLock: true,
    center: { x: 0, z: -57 },
    bounds: { minX: -12, maxX: 12, minZ: -66, maxZ: -48 },
    accentHex: '#eab308',
    accentNum: 0xeab308,
    description: 'Dek observasi panorama Bumi dengan area istirahat & Terminal Evaluasi Akhir.',
    terminalPos: { x: 0, z: -61.8 },
    terminalLabel: 'Terminal Final Quiz & Evaluasi',
    hasSpaceWindow: 'north',
  },
};

export interface RoomCornerChamfers {
  nw?: number;
  ne?: number;
  sw?: number;
  se?: number;
}

export interface Point2D {
  x: number;
  z: number;
}

export interface AngledWallDef {
  id: string;
  roomId: RoomId;
  x1: number;
  z1: number;
  x2: number;
  z2: number;
  length: number;
  cx: number;
  cz: number;
  outX: number;
  outZ: number;
  angleY: number;
  hasWindow: boolean;
}

// Non-rectangular chamfered/faceted sci-fi bay footprints carefully cleared of every prop, door, vent, and book
export const ROOM_CHAMFERS: Record<RoomId, RoomCornerChamfers> = {
  central_lobby: { nw: 1.8, ne: 1.8, sw: 1.8, se: 1.8 },
  communication_room: { nw: 1.5, ne: 1.8, sw: 1.4, se: 2.5 },
  technology_lab: { nw: 0.9, ne: 2.6, sw: 1.4, se: 1.8 },
  navigation_room: { nw: 2.1, ne: 2.8, sw: 2.1, se: 2.3 },
  cultural_room: { nw: 2.2, ne: 1.5, sw: 2.6, se: 0.8 },
  economic_room: { nw: 2.6, ne: 1.4, sw: 2.2, se: 1.1 },
  global_exchange_room: { nw: 2.8, ne: 2.2, sw: 2.4, se: 1.8 },
  global_balance_room: { nw: 2.4, ne: 1.4, sw: 1.0, se: 1.0 },
  world_economy_room: { nw: 2.2, ne: 1.9, sw: 2.4, se: 2.6 },
  cultural_identity_room: { nw: 2.6, ne: 2.1, sw: 2.6, se: 2.6 },
  earth_observation_room: { nw: 1.6, ne: 1.6, sw: 2.2, se: 2.2 },
};

export function buildRoomPolygon(roomId: RoomId): Point2D[] {
  const b = ROOMS[roomId].bounds;
  const c = ROOM_CHAMFERS[roomId] || {};
  const nw = c.nw || 0;
  const ne = c.ne || 0;
  const se = c.se || 0;
  const sw = c.sw || 0;
  const pts: Point2D[] = [];

  if (nw > 0) {
    pts.push({ x: b.minX, z: b.minZ + nw }, { x: b.minX + nw, z: b.minZ });
  } else {
    pts.push({ x: b.minX, z: b.minZ });
  }
  if (ne > 0) {
    pts.push({ x: b.maxX - ne, z: b.minZ }, { x: b.maxX, z: b.minZ + ne });
  } else {
    pts.push({ x: b.maxX, z: b.minZ });
  }
  if (se > 0) {
    pts.push({ x: b.maxX, z: b.maxZ - se }, { x: b.maxX - se, z: b.maxZ });
  } else {
    pts.push({ x: b.maxX, z: b.maxZ });
  }
  if (sw > 0) {
    pts.push({ x: b.minX + sw, z: b.maxZ }, { x: b.minX, z: b.maxZ - sw });
  } else {
    pts.push({ x: b.minX, z: b.maxZ });
  }
  return pts;
}

export const ROOM_POLYGONS: Record<RoomId, Point2D[]> = (Object.keys(ROOMS) as RoomId[]).reduce(
  (acc, roomId) => {
    acc[roomId] = buildRoomPolygon(roomId);
    return acc;
  },
  {} as Record<RoomId, Point2D[]>
);

export function getRoomSvgPoints(roomId: RoomId): string {
  return ROOM_POLYGONS[roomId].map((p) => `${p.x},${p.z}`).join(' ');
}

export const WALKABLE_RECTS: Rect2D[] = [
  ...Object.values(ROOMS).map((r) => ({
    id: `room_${r.id}`,
    minX: r.bounds.minX,
    maxX: r.bounds.maxX,
    minZ: r.bounds.minZ,
    maxZ: r.bounds.maxZ,
    roomId: r.id,
    trimColor: r.accentNum,
  })),
  // West Wing Corridors & Hub (flush seam bounds to prevent coplanar floor Z-fighting)
  { id: 'corr_w1', minX: -13.5, maxX: -9, minZ: -3.2, maxZ: 3.2, trimColor: 0x0ea5e9 },
  { id: 'hub_w', minX: -22.5, maxX: -13.5, minZ: -4.5, maxZ: 4.5, trimColor: 0x0ea5e9 },
  { id: 'corr_wn', minX: -21.2, maxX: -14.8, minZ: -10, maxZ: -4.5, trimColor: 0x0ea5e9 },
  { id: 'corr_ws', minX: -21.2, maxX: -14.8, minZ: 4.5, maxZ: 10, trimColor: 0x6366f1 },
  { id: 'corr_wfar', minX: -30, maxX: -22.5, minZ: -3.2, maxZ: 3.2, trimColor: 0x2563eb },

  // East Wing Corridors & Hub (flush seam bounds to prevent coplanar floor Z-fighting)
  { id: 'corr_e1', minX: 9, maxX: 13.5, minZ: -3.2, maxZ: 3.2, trimColor: 0x10b981 },
  { id: 'hub_e', minX: 13.5, maxX: 22.5, minZ: -4.5, maxZ: 4.5, trimColor: 0x10b981 },
  { id: 'corr_en', minX: 14.8, maxX: 21.2, minZ: -10, maxZ: -4.5, trimColor: 0x10b981 },
  { id: 'corr_es', minX: 14.8, maxX: 21.2, minZ: 4.5, maxZ: 10, trimColor: 0xf59e0b },
  { id: 'corr_efar', minX: 22.5, maxX: 30, minZ: -3.2, maxZ: 3.2, trimColor: 0x14b8a6 },

  // North Wing Corridors & Hub (Widened to 6.4m / 7m obs)
  { id: 'corr_n1', minX: -3.2, maxX: 3.2, minZ: -16, maxZ: -8, trimColor: 0xf43f5e },
  { id: 'hub_n', minX: -6, maxX: 6, minZ: -24, maxZ: -16, trimColor: 0xf43f5e },
  { id: 'corr_n2', minX: -3.2, maxX: 3.2, minZ: -30, maxZ: -24, trimColor: 0xf43f5e },
  { id: 'corr_nw', minX: -13, maxX: -7, minZ: -39.0, maxZ: -33.0, trimColor: 0xb91c1c },
  { id: 'corr_ne', minX: 7, maxX: 13, minZ: -39.0, maxZ: -33.0, trimColor: 0xd97706 },
  { id: 'corr_obs', minX: -3.5, maxX: 3.5, minZ: -48, maxZ: -42, trimColor: 0xeab308 },
];

export const DOORS: DoorDef[] = [
  { id: 'door_w1', x: -9, z: 0, orientation: 'vertical', width: 6.4, accentHex: '#38bdf8', label: 'Sayap Barat (Ch.1 & Ch.3)', requiredChapter: 1 },
  { id: 'door_wn', x: -18, z: -10, orientation: 'horizontal', width: 6.4, accentHex: '#0ea5e9', label: 'Communication Room', requiredChapter: 3, roomId: 'communication_room' },
  { id: 'door_ws', x: -18, z: 10, orientation: 'horizontal', width: 6.4, accentHex: '#6366f1', label: 'Technology Lab', requiredChapter: 3, roomId: 'technology_lab' },
  { id: 'door_wfar', x: -30, z: 0, orientation: 'vertical', width: 6.4, accentHex: '#2563eb', label: 'Navigation Room', requiredChapter: 1, roomId: 'navigation_room' },

  { id: 'door_e1', x: 9, z: 0, orientation: 'vertical', width: 6.4, accentHex: '#10b981', label: 'Sayap Timur (Ch.2 & Ch.4)', requiredChapter: 2 },
  { id: 'door_en', x: 18, z: -10, orientation: 'horizontal', width: 6.4, accentHex: '#10b981', label: 'Cultural Room', requiredChapter: 2, roomId: 'cultural_room' },
  { id: 'door_es', x: 18, z: 10, orientation: 'horizontal', width: 6.4, accentHex: '#f59e0b', label: 'Economic Room', requiredChapter: 4, roomId: 'economic_room' },
  { id: 'door_efar', x: 30, z: 0, orientation: 'vertical', width: 6.4, accentHex: '#14b8a6', label: 'Global Exchange', requiredChapter: 2, roomId: 'global_exchange_room' },

  { id: 'door_n1', x: 0, z: -8, orientation: 'horizontal', width: 6.4, accentHex: '#f43f5e', label: 'Sayap Utara (Ch.4 & Ch.5)', requiredChapter: 4 },
  { id: 'door_n2', x: 0, z: -30, orientation: 'horizontal', width: 6.4, accentHex: '#f43f5e', label: 'Global Balance Room', requiredChapter: 4, roomId: 'global_balance_room' },
  { id: 'door_nw', x: -13, z: -36, orientation: 'vertical', width: 6.0, accentHex: '#b91c1c', label: 'World Economy', requiredChapter: 4, roomId: 'world_economy_room' },
  { id: 'door_ne', x: 13, z: -36, orientation: 'vertical', width: 6.0, accentHex: '#d97706', label: 'Cultural Identity', requiredChapter: 5, roomId: 'cultural_identity_room' },
  { id: 'door_obs', x: 0, z: -48, orientation: 'horizontal', width: 7.0, accentHex: '#eab308', label: 'Earth Observation', requiresAllChapters: true, roomId: 'earth_observation_room' },
];

// Physical Vent Network (Strategically placed in clear floor corners away from furniture!)
export const VENTS: VentDef[] = [
  // West Wing Triangle
  {
    id: 'vent_comm',
    roomId: 'communication_room',
    label: 'Vent Communication',
    x: -13.2,
    z: -12.0,
    exitOffsetX: -1.4,
    exitOffsetZ: -1.0,
    network: 'west',
    connectedTo: ['vent_nav', 'vent_tech'],
  },
  {
    id: 'vent_nav',
    roomId: 'navigation_room',
    label: 'Vent Navigation',
    x: -32.2,
    z: -4.8,
    exitOffsetX: -1.2,
    exitOffsetZ: 1.4,
    network: 'west',
    connectedTo: ['vent_comm', 'vent_tech'],
  },
  {
    id: 'vent_tech',
    roomId: 'technology_lab',
    label: 'Vent Tech Lab',
    x: -13.2,
    z: 12.0,
    exitOffsetX: -1.4,
    exitOffsetZ: 1.0,
    network: 'west',
    connectedTo: ['vent_comm', 'vent_nav'],
  },

  // Central - North Network
  {
    id: 'vent_lobby',
    roomId: 'central_lobby',
    label: 'Vent Central Lobby',
    x: 6.5,
    z: 5.8,
    exitOffsetX: -1.5,
    exitOffsetZ: -1.0,
    network: 'north',
    connectedTo: ['vent_balance', 'vent_world_econ', 'vent_identity'],
  },
  {
    id: 'vent_balance',
    roomId: 'global_balance_room',
    label: 'Vent Global Balance',
    x: -4.8,
    z: -40.2,
    exitOffsetX: 1.4,
    exitOffsetZ: 1.2,
    network: 'north',
    connectedTo: ['vent_lobby', 'vent_world_econ', 'vent_identity'],
  },
  {
    id: 'vent_world_econ',
    roomId: 'world_economy_room',
    label: 'Vent World Economy',
    x: -15.2,
    z: -31.2,
    exitOffsetX: -1.4,
    exitOffsetZ: -1.2,
    network: 'north',
    connectedTo: ['vent_balance', 'vent_identity', 'vent_lobby'],
  },
  {
    id: 'vent_identity',
    roomId: 'cultural_identity_room',
    label: 'Vent Cultural Identity',
    x: 15.2,
    z: -31.2,
    exitOffsetX: 1.4,
    exitOffsetZ: -1.2,
    network: 'north',
    connectedTo: ['vent_balance', 'vent_world_econ', 'vent_lobby'],
  },

  // East Wing Triangle
  {
    id: 'vent_cultural',
    roomId: 'cultural_room',
    label: 'Vent Cultural',
    x: 13.2,
    z: -12.0,
    exitOffsetX: 1.4,
    exitOffsetZ: -1.0,
    network: 'east',
    connectedTo: ['vent_exchange', 'vent_economic'],
  },
  {
    id: 'vent_exchange',
    roomId: 'global_exchange_room',
    label: 'Vent Global Exchange',
    x: 32.2,
    z: -4.8,
    exitOffsetX: 1.2,
    exitOffsetZ: 1.4,
    network: 'east',
    connectedTo: ['vent_cultural', 'vent_economic'],
  },
  {
    id: 'vent_economic',
    roomId: 'economic_room',
    label: 'Vent Economic',
    x: 13.2,
    z: 12.0,
    exitOffsetX: 1.4,
    exitOffsetZ: 1.0,
    network: 'east',
    connectedTo: ['vent_cultural', 'vent_exchange'],
  },
];

// Solid Prop & Furniture Colliders — carefully placed out of door corridors, terminals, and vent exit paths
export const PROP_COLLIDERS: PropCollider[] = [
  // Central Lobby (tightened & clear of widened 6.4m doorways)
  { id: 'lobby_core', minX: -1.42, maxX: 1.42, minZ: -1.42, maxZ: 1.42 },
  { id: 'lobby_desk_nw', minX: -7.55, maxX: -4.65, minZ: -6.85, maxZ: -4.75 },
  { id: 'lobby_sofa_sw', minX: -7.65, maxX: -4.65, minZ: 4.15, maxZ: 6.95 },
  { id: 'lobby_info_sc', minX: -1.85, maxX: -0.75, minZ: 5.55, maxZ: 6.65 },
  { id: 'lobby_wait_se', minX: 1.55, maxX: 4.05, minZ: 4.95, maxZ: 6.5 },
  { id: 'lobby_rack_ne', minX: 5.1, maxX: 7.3, minZ: -6.75, maxZ: -5.85 },
  { id: 'lobby_kiosk_ne', minX: 3.7, maxX: 4.9, minZ: -7.1, maxZ: -5.9 },
  { id: 'lobby_plant_e', minX: 7.35, maxX: 8.25, minZ: -5.05, maxZ: -4.15 },
  { id: 'lobby_locker_nw', minX: 7.45, maxX: 8.35, minZ: 4.1, maxZ: 5.3 },
  { id: 'lobby_secret_tv', minX: -3.9, maxX: -2.6, minZ: 6.45, maxZ: 7.45 },
  { id: 'lobby_customize_term', minX: 4.55, maxX: 5.45, minZ: 3.15, maxZ: 4.05 },

  // Communication Room
  { id: 'comm_desk_w', minX: -23.9, maxX: -21.2, minZ: -18.0, maxZ: -14.8 },
  { id: 'comm_radar_nw', minX: -23.6, maxX: -21.9, minZ: -21.25, maxZ: -19.55 },
  { id: 'comm_racks_sw', minX: -24.1, maxX: -21.35, minZ: -12.15, maxZ: -11.05 },
  { id: 'comm_racks_e', minX: -13.0, maxX: -12.0, minZ: -20.5, maxZ: -16.8 },
  { id: 'comm_console_ce', minX: -16.1, maxX: -14.1, minZ: -17.4, maxZ: -14.8 },
  { id: 'comm_trans_n', minX: -18.6, maxX: -17.4, minZ: -21.55, maxZ: -20.4 },

  // Technology Lab
  { id: 'tech_bench_w', minX: -23.35, maxX: -21.0, minZ: 14.15, maxZ: 19.05 },
  { id: 'tech_spectro_nw', minX: -24.5, maxX: -21.6, minZ: 10.95, maxZ: 12.85 },
  { id: 'tech_cabinet_sw', minX: -23.85, maxX: -21.15, minZ: 20.25, maxZ: 21.15 },
  { id: 'tech_cryo_e', minX: -13.15, maxX: -11.85, minZ: 16.55, maxZ: 20.25 },
  { id: 'tech_bot_ce', minX: -15.5, maxX: -14.5, minZ: 14.7, maxZ: 15.7 },
  { id: 'tech_holo_c', minX: -18.65, maxX: -17.35, minZ: 13.55, maxZ: 14.85 },
  { id: 'tech_rack_se', minX: -15.65, maxX: -14.35, minZ: 20.2, maxZ: 21.2 },

  // Navigation Room
  { id: 'nav_table', minX: -37.12, maxX: -34.28, minZ: -1.42, maxZ: 1.42 },
  { id: 'nav_console_sw', minX: -42.2, maxX: -39.4, minZ: 3.7, maxZ: 5.9 },
  { id: 'nav_sat_nw', minX: -42.3, maxX: -39.5, minZ: -5.9, maxZ: -3.7 },
  { id: 'nav_rack_n', minX: -37.55, maxX: -34.85, minZ: -5.9, maxZ: -4.9 },
  { id: 'nav_co_s', minX: -37.7, maxX: -34.9, minZ: 4.1, maxZ: 6.2 },
  { id: 'nav_desk_se', minX: -33.65, maxX: -31.95, minZ: 3.95, maxZ: 5.65 },

  // Cultural Room
  { id: 'cult_vitrine_w', minX: 12.35, maxX: 13.65, minZ: -20.15, maxZ: -16.35 },
  { id: 'cult_sofa_e', minX: 20.9, maxX: 23.8, minZ: -16.6, maxZ: -13.4 },
  { id: 'cult_mannequin_ne', minX: 21.0, maxX: 24.2, minZ: -20.7, maxZ: -19.3 },
  { id: 'cult_holo_c', minX: 17.3, maxX: 18.7, minZ: -15.2, maxZ: -13.8 },
  { id: 'cult_books_se', minX: 21.85, maxX: 24.35, minZ: -11.55, maxZ: -10.65 },
  { id: 'cult_pedestal_n', minX: 15.1, maxX: 16.3, minZ: -21.2, maxZ: -20.0 },
  { id: 'cult_aulia_cabinet', minX: 18.65, maxX: 20.15, minZ: -21.75, maxZ: -20.75 },

  // Economic Room
  { id: 'econ_desk_w', minX: 12.1, maxX: 14.3, minZ: 17.0, maxZ: 19.8 },
  { id: 'econ_desk_nw', minX: 11.9, maxX: 14.1, minZ: 13.4, maxZ: 16.0 },
  { id: 'econ_cargo_e', minX: 22.0, maxX: 23.6, minZ: 14.0, maxZ: 18.8 },
  { id: 'econ_server_ne', minX: 21.55, maxX: 24.25, minZ: 11.2, maxZ: 12.2 },
  { id: 'econ_cart_se', minX: 21.45, maxX: 24.15, minZ: 20.35, maxZ: 21.25 },
  { id: 'econ_meeting_c', minX: 16.75, maxX: 19.25, minZ: 13.25, maxZ: 15.75 },

  // Global Exchange Room
  { id: 'exchange_table', minX: 34.28, maxX: 37.12, minZ: -1.42, maxZ: 1.42 },
  { id: 'exchange_lounge_se', minX: 39.15, maxX: 42.45, minZ: 3.45, maxZ: 5.95 },
  { id: 'exchange_expo_ne', minX: 39.15, maxX: 42.45, minZ: -5.15, maxZ: -4.25 },
  { id: 'exchange_showcase_n', minX: 34.95, maxX: 37.85, minZ: -5.95, maxZ: -4.65 },
  { id: 'exchange_media_s', minX: 34.8, maxX: 37.6, minZ: 4.1, maxZ: 6.2 },
  { id: 'exchange_kiosk_sw', minX: 32.0, maxX: 33.2, minZ: 4.2, maxZ: 5.4 },

  // Global Balance Room
  { id: 'balance_scale', minX: -1.42, maxX: 1.42, minZ: -37.42, maxZ: -34.58 },
  { id: 'balance_desk_sw', minX: -6.25, maxX: -3.75, minZ: -32.85, maxZ: -30.75 },
  { id: 'balance_ctrl_se', minX: 3.75, maxX: 6.25, minZ: -32.85, maxZ: -30.75 },
  { id: 'balance_kiosk_ne', minX: 3.9, maxX: 6.3, minZ: -40.8, maxZ: -39.5 },

  // World Economy Room
  { id: 'wecon_pyramid', minX: -20.2, maxX: -17.8, minZ: -37.2, maxZ: -34.8 },
  { id: 'wecon_desk_n', minX: -24.9, maxX: -22.1, minZ: -41.9, maxZ: -39.9 },
  { id: 'wecon_meet_sw', minX: -24.65, maxX: -22.15, minZ: -32.65, maxZ: -30.15 },
  { id: 'wecon_arch_ne', minX: -18.15, maxX: -14.65, minZ: -41.85, maxZ: -40.95 },
  { id: 'wecon_srv_nw', minX: -26.1, maxX: -25.1, minZ: -38.7, maxZ: -37.5 },
  { id: 'wecon_crates_s', minX: -20.15, maxX: -17.85, minZ: -31.45, maxZ: -30.55 },

  // Cultural Identity Room
  { id: 'ident_shelves_e', minX: 19.1, maxX: 20.1, minZ: -37.25, maxZ: -34.75 },
  { id: 'ident_lounge_n', minX: 22.35, maxX: 24.85, minZ: -42.15, maxZ: -39.65 },
  { id: 'ident_art_se', minX: 22.9, maxX: 24.3, minZ: -32.1, maxZ: -30.7 },
  { id: 'ident_heritage_s', minX: 18.85, maxX: 20.15, minZ: -31.7, maxZ: -30.3 },
  { id: 'ident_read_ne', minX: 25.15, maxX: 26.25, minZ: -38.75, maxZ: -37.65 },
  { id: 'ident_kiosk_nw', minX: 16.0, maxX: 17.2, minZ: -41.8, maxZ: -40.6 },

  // Earth Observation Room
  { id: 'obs_earth_holo', minX: -1.45, maxX: 1.45, minZ: -56.45, maxZ: -53.55 },
  { id: 'obs_sofa_w', minX: -9.85, maxX: -6.75, minZ: -59.5, maxZ: -56.1 },
  { id: 'obs_sofa_e', minX: 6.75, maxX: 9.85, minZ: -59.5, maxZ: -56.1 },
  { id: 'obs_scope_nw', minX: -7.95, maxX: -6.45, minZ: -64.45, maxZ: -62.65 },
  { id: 'obs_desk_nw', minX: -11.3, maxX: -8.9, minZ: -64.4, maxZ: -61.8 },
  { id: 'obs_mon_ne', minX: 5.8, maxX: 8.6, minZ: -64.6, maxZ: -62.2 },
  { id: 'obs_srv_ne', minX: 9.55, maxX: 10.65, minZ: -64.6, maxZ: -61.9 },
  { id: 'obs_lounge_sw', minX: -7.45, maxX: -4.95, minZ: -51.85, maxZ: -49.35 },
  { id: 'obs_lounge_se', minX: 4.95, maxX: 7.45, minZ: -51.85, maxZ: -49.35 },
  { id: 'obs_plant_sw', minX: -10.55, maxX: -9.45, minZ: -50.95, maxZ: -49.85 },
  { id: 'obs_plant_se', minX: 9.45, maxX: 10.55, minZ: -50.95, maxZ: -49.85 },
];

export const SECRET_TV_CONSOLE = {
  id: 'secret_tv_budaya',
  roomId: 'central_lobby' as RoomId,
  x: -3.25,
  z: 6.95,
  label: 'TV Siaran Budaya Global (Misi Rahasia)',
};

export const WALL_THICK = 0.38;
export const WALL_HEIGHT = 4.2;

export interface WallSegmentDef {
  id: string;
  side: 'north' | 'south' | 'west' | 'east';
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

function isPointInsideRectWithChamfers(x: number, z: number, r: Rect2D): boolean {
  if (x < r.minX || x > r.maxX || z < r.minZ || z > r.maxZ) return false;
  if (!r.roomId) return true;
  const ch = ROOM_CHAMFERS[r.roomId];
  if (!ch) return true;
  if (ch.nw && x - r.minX + (z - r.minZ) < ch.nw) return false;
  if (ch.ne && r.maxX - x + (z - r.minZ) < ch.ne) return false;
  if (ch.sw && x - r.minX + (r.maxZ - z) < ch.sw) return false;
  if (ch.se && r.maxX - x + (r.maxZ - z) < ch.se) return false;
  return true;
}

function isInsideWalkableUnion(x: number, z: number): boolean {
  for (let i = 0; i < WALKABLE_RECTS.length; i++) {
    if (isPointInsideRectWithChamfers(x, z, WALKABLE_RECTS[i])) {
      return true;
    }
  }
  return false;
}

function generateWallGeometryAndColliders(): {
  segments: WallSegmentDef[];
  wallColliders: PropCollider[];
  angledWalls: AngledWallDef[];
} {
  const xSplits = Array.from(
    new Set(WALKABLE_RECTS.flatMap((r) => [r.minX, r.maxX]))
  ).sort((a, b) => a - b);
  const zSplits = Array.from(
    new Set(WALKABLE_RECTS.flatMap((r) => [r.minZ, r.maxZ]))
  ).sort((a, b) => a - b);

  type RawSeg = { side: 'north' | 'south' | 'west' | 'east'; coord: number; a: number; b: number };
  const rawSegs: RawSeg[] = [];
  const angledWalls: AngledWallDef[] = [];
  const eps = 0.04;

  for (const r of WALKABLE_RECTS) {
    const ch = r.roomId ? ROOM_CHAMFERS[r.roomId] || {} : {};
    const nw = ch.nw || 0;
    const ne = ch.ne || 0;
    const sw = ch.sw || 0;
    const se = ch.se || 0;

    // Clipped North edge [minX + nw, maxX - ne]
    const nMin = r.minX + nw;
    const nMax = r.maxX - ne;
    const nxs = [nMin, ...xSplits.filter((v) => v > nMin && v < nMax), nMax];
    for (let i = 0; i < nxs.length - 1; i++) {
      const a = nxs[i];
      const b = nxs[i + 1];
      if (b - a < 0.05) continue;
      const xm = (a + b) / 2;
      if (isInsideWalkableUnion(xm, r.minZ + eps) && !isInsideWalkableUnion(xm, r.minZ - eps)) {
        rawSegs.push({ side: 'north', coord: r.minZ, a, b });
      }
    }

    // Clipped South edge [minX + sw, maxX - se]
    const sMin = r.minX + sw;
    const sMax = r.maxX - se;
    const sxs = [sMin, ...xSplits.filter((v) => v > sMin && v < sMax), sMax];
    for (let i = 0; i < sxs.length - 1; i++) {
      const a = sxs[i];
      const b = sxs[i + 1];
      if (b - a < 0.05) continue;
      const xm = (a + b) / 2;
      if (isInsideWalkableUnion(xm, r.maxZ - eps) && !isInsideWalkableUnion(xm, r.maxZ + eps)) {
        rawSegs.push({ side: 'south', coord: r.maxZ, a, b });
      }
    }

    // Clipped West edge [minZ + nw, maxZ - sw]
    const wMin = r.minZ + nw;
    const wMax = r.maxZ - sw;
    const wzs = [wMin, ...zSplits.filter((v) => v > wMin && v < wMax), wMax];
    for (let i = 0; i < wzs.length - 1; i++) {
      const a = wzs[i];
      const b = wzs[i + 1];
      if (b - a < 0.05) continue;
      const zm = (a + b) / 2;
      if (isInsideWalkableUnion(r.minX + eps, zm) && !isInsideWalkableUnion(r.minX - eps, zm)) {
        rawSegs.push({ side: 'west', coord: r.minX, a, b });
      }
    }

    // Clipped East edge [minZ + ne, maxZ - se]
    const eMin = r.minZ + ne;
    const eMax = r.maxZ - se;
    const ezs = [eMin, ...zSplits.filter((v) => v > eMin && v < eMax), eMax];
    for (let i = 0; i < ezs.length - 1; i++) {
      const a = ezs[i];
      const b = ezs[i + 1];
      if (b - a < 0.05) continue;
      const zm = (a + b) / 2;
      if (isInsideWalkableUnion(r.maxX - eps, zm) && !isInsideWalkableUnion(r.maxX + eps, zm)) {
        rawSegs.push({ side: 'east', coord: r.maxX, a, b });
      }
    }

    if (r.roomId) {
      const roomDef = ROOMS[r.roomId];
      const pushChamfer = (
        corner: 'nw' | 'ne' | 'sw' | 'se',
        x1: number,
        z1: number,
        x2: number,
        z2: number,
        outX: number,
        outZ: number
      ) => {
        const length = Math.hypot(x2 - x1, z2 - z1);
        const cx = (x1 + x2) / 2;
        const cz = (z1 + z2) / 2;
        const angleY = Math.atan2(-(z2 - z1), x2 - x1);
        const hasWindow =
          Boolean(roomDef.hasSpaceWindow) &&
          ((roomDef.hasSpaceWindow === 'north' && (corner === 'nw' || corner === 'ne')) ||
            (roomDef.hasSpaceWindow === 'south' && (corner === 'sw' || corner === 'se')) ||
            (roomDef.hasSpaceWindow === 'west' && (corner === 'nw' || corner === 'sw')) ||
            (roomDef.hasSpaceWindow === 'east' && (corner === 'ne' || corner === 'se')));
        angledWalls.push({
          id: `chamfer_${r.roomId}_${corner}`,
          roomId: r.roomId!,
          x1,
          z1,
          x2,
          z2,
          length,
          cx,
          cz,
          outX,
          outZ,
          angleY,
          hasWindow,
        });
      };

      const invSqrt2 = Math.SQRT1_2;
      if (nw > 0) {
        pushChamfer('nw', r.minX, r.minZ + nw, r.minX + nw, r.minZ, -invSqrt2, -invSqrt2);
      }
      if (ne > 0) {
        pushChamfer('ne', r.maxX - ne, r.minZ, r.maxX, r.minZ + ne, invSqrt2, -invSqrt2);
      }
      if (se > 0) {
        pushChamfer('se', r.maxX, r.maxZ - se, r.maxX - se, r.maxZ, invSqrt2, invSqrt2);
      }
      if (sw > 0) {
        pushChamfer('sw', r.minX + sw, r.maxZ, r.minX, r.maxZ - sw, -invSqrt2, invSqrt2);
      }
    }
  }

  // Merge collinear touching intervals
  const grouped = new Map<string, Array<{ a: number; b: number; side: RawSeg['side']; coord: number }>>();
  for (const s of rawSegs) {
    const key = `${s.side}:${s.coord}`;
    const list = grouped.get(key) || [];
    list.push(s);
    grouped.set(key, list);
  }

  const segments: WallSegmentDef[] = [];
  const wallColliders: PropCollider[] = [];
  const cornerKeys = new Set<string>();
  let idx = 0;

  grouped.forEach((list) => {
    list.sort((u, v) => u.a - v.a);
    const merged: typeof list = [];
    for (const item of list) {
      const last = merged[merged.length - 1];
      if (last && Math.abs(last.b - item.a) < 0.01) {
        last.b = Math.max(last.b, item.b);
      } else {
        merged.push({ ...item });
      }
    }

    for (const m of merged) {
      let minX = 0;
      let maxX = 0;
      let minZ = 0;
      let maxZ = 0;

      if (m.side === 'north') {
        minX = m.a;
        maxX = m.b;
        minZ = m.coord - WALL_THICK;
        maxZ = m.coord;
        cornerKeys.add(`${m.a}:${m.coord}`);
        cornerKeys.add(`${m.b}:${m.coord}`);
      } else if (m.side === 'south') {
        minX = m.a;
        maxX = m.b;
        minZ = m.coord;
        maxZ = m.coord + WALL_THICK;
        cornerKeys.add(`${m.a}:${m.coord}`);
        cornerKeys.add(`${m.b}:${m.coord}`);
      } else if (m.side === 'west') {
        minX = m.coord - WALL_THICK;
        maxX = m.coord;
        minZ = m.a;
        maxZ = m.b;
        cornerKeys.add(`${m.coord}:${m.a}`);
        cornerKeys.add(`${m.coord}:${m.b}`);
      } else {
        minX = m.coord;
        maxX = m.coord + WALL_THICK;
        minZ = m.a;
        maxZ = m.b;
        cornerKeys.add(`${m.coord}:${m.a}`);
        cornerKeys.add(`${m.coord}:${m.b}`);
      }

      const id = `wall_${idx++}`;
      segments.push({ id, side: m.side, minX, maxX, minZ, maxZ });
      wallColliders.push({ id, minX, maxX, minZ, maxZ });
    }
  });

  // Seal every exterior 90-degree corner quadrant with a flush WALL_THICK x WALL_THICK corner block
  let cornerIdx = 0;
  cornerKeys.forEach((key) => {
    const [cxStr, czStr] = key.split(':');
    const cx = Number(cxStr);
    const cz = Number(czStr);
    const quadrants: Array<[number, number]> = [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ];
    for (const [sx, sz] of quadrants) {
      if (!isInsideWalkableUnion(cx + sx * 0.05, cz + sz * 0.05)) {
        const qMinX = sx < 0 ? cx - WALL_THICK : cx;
        const qMaxX = sx < 0 ? cx : cx + WALL_THICK;
        const qMinZ = sz < 0 ? cz - WALL_THICK : cz;
        const qMaxZ = sz < 0 ? cz : cz + WALL_THICK;
        const hitsH = wallColliders.some(
          (w) =>
            w.minZ <= qMaxZ + 0.01 &&
            w.maxZ >= qMinZ - 0.01 &&
            ((sx < 0 && Math.abs(w.maxX - cx) < 0.05) || (sx > 0 && Math.abs(w.minX - cx) < 0.05) || (w.minX <= cx && w.maxX >= cx))
        );
        const hitsV = wallColliders.some(
          (w) =>
            w.minX <= qMaxX + 0.01 &&
            w.maxX >= qMinX - 0.01 &&
            ((sz < 0 && Math.abs(w.maxZ - cz) < 0.05) || (sz > 0 && Math.abs(w.minZ - cz) < 0.05) || (w.minZ <= cz && w.maxZ >= cz))
        );
        if (hitsH && hitsV) {
          wallColliders.push({
            id: `wall_corner_${cornerIdx++}`,
            minX: qMinX,
            maxX: qMaxX,
            minZ: qMinZ,
            maxZ: qMaxZ,
          });
        }
      }
    }
  });

  return { segments, wallColliders, angledWalls };
}

const GENERATED_WALLS = generateWallGeometryAndColliders();
export const WALL_SEGMENTS: WallSegmentDef[] = GENERATED_WALLS.segments;
export const WALL_COLLIDERS: PropCollider[] = GENERATED_WALLS.wallColliders;
export const ANGLED_WALL_SEGMENTS: AngledWallDef[] = GENERATED_WALLS.angledWalls;

// Door Frame Pillar Colliders matching stationBuilder.ts geometry (pillar 0.4 x 0.52 at ±(width/2 - 0.15))
export const DOOR_PILLAR_COLLIDERS: PropCollider[] = DOORS.flatMap((d) => {
  const offset = d.width / 2 - 0.15;
  if (d.orientation === 'horizontal') {
    return [
      { id: `${d.id}_pl`, minX: d.x - offset - 0.2, maxX: d.x - offset + 0.2, minZ: d.z - 0.26, maxZ: d.z + 0.26 },
      { id: `${d.id}_pr`, minX: d.x + offset - 0.2, maxX: d.x + offset + 0.2, minZ: d.z - 0.26, maxZ: d.z + 0.26 },
    ];
  }
  return [
    { id: `${d.id}_pl`, minX: d.x - 0.26, maxX: d.x + 0.26, minZ: d.z - offset - 0.2, maxZ: d.z - offset + 0.2 },
    { id: `${d.id}_pr`, minX: d.x - 0.26, maxX: d.x + 0.26, minZ: d.z + offset - 0.2, maxZ: d.z + offset + 0.2 },
  ];
});

// Terminal Pedestal Colliders (compact r ~ 0.45m so player can interact closely without passing through the solid 3D base)
export const TERMINAL_COLLIDERS: PropCollider[] = Object.values(ROOMS).map((r) => ({
  id: `term_${r.id}`,
  minX: r.terminalPos.x - 0.42,
  maxX: r.terminalPos.x + 0.42,
  minZ: r.terminalPos.z - 0.42,
  maxZ: r.terminalPos.z + 0.42,
}));

export const ALL_STATIC_COLLIDERS: PropCollider[] = [
  ...WALL_COLLIDERS,
  ...DOOR_PILLAR_COLLIDERS,
  ...PROP_COLLIDERS,
  ...TERMINAL_COLLIDERS,
];

export function circleIntersectsAABB(
  cx: number,
  cz: number,
  radius: number,
  box: PropCollider
): boolean {
  const closestX = Math.max(box.minX, Math.min(cx, box.maxX));
  const closestZ = Math.max(box.minZ, Math.min(cz, box.maxZ));
  const dx = cx - closestX;
  const dz = cz - closestZ;
  return dx * dx + dz * dz < radius * radius;
}

export function circleIntersectsSegment(
  cx: number,
  cz: number,
  radius: number,
  x1: number,
  z1: number,
  x2: number,
  z2: number
): boolean {
  const vx = x2 - x1;
  const vz = z2 - z1;
  const lenSq = vx * vx + vz * vz;
  if (lenSq <= 1e-8) {
    return (cx - x1) ** 2 + (cz - z1) ** 2 < radius * radius;
  }
  const t = Math.max(0, Math.min(1, ((cx - x1) * vx + (cz - z1) * vz) / lenSq));
  const px = x1 + t * vx;
  const pz = z1 + t * vz;
  const dx = cx - px;
  const dz = cz - pz;
  return dx * dx + dz * dz < radius * radius;
}

export function getRoomAtPosition(x: number, z: number): RoomDef | null {
  for (const room of Object.values(ROOMS)) {
    const b = room.bounds;
    if (x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ) {
      return room;
    }
  }
  return null;
}

export function isPointWalkable(
  x: number,
  z: number,
  radius = 0.48,
  extraBlockedBoxes?: PropCollider[]
): boolean {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return false;
  if (!isInsideWalkableUnion(x, z)) return false;

  for (let i = 0; i < ALL_STATIC_COLLIDERS.length; i++) {
    if (circleIntersectsAABB(x, z, radius, ALL_STATIC_COLLIDERS[i])) {
      return false;
    }
  }

  for (let i = 0; i < ANGLED_WALL_SEGMENTS.length; i++) {
    const aw = ANGLED_WALL_SEGMENTS[i];
    if (circleIntersectsSegment(x, z, radius, aw.x1, aw.z1, aw.x2, aw.z2)) {
      return false;
    }
  }

  if (extraBlockedBoxes && extraBlockedBoxes.length > 0) {
    for (let i = 0; i < extraBlockedBoxes.length; i++) {
      if (circleIntersectsAABB(x, z, radius, extraBlockedBoxes[i])) {
        return false;
      }
    }
  }

  // Secondary 8-point perimeter check (cardinal + diagonal) ensures player circle never clips corners outside station hull
  const rim = radius * 0.9;
  const diag = rim * 0.7071;
  const checks: Array<[number, number]> = [
    [x + rim, z],
    [x - rim, z],
    [x, z + rim],
    [x, z - rim],
    [x + diag, z + diag],
    [x - diag, z + diag],
    [x + diag, z - diag],
    [x - diag, z - diag],
  ];
  for (let i = 0; i < checks.length; i++) {
    if (!isInsideWalkableUnion(checks[i][0], checks[i][1])) {
      return false;
    }
  }

  return true;
}

export function getDoorCollider(doorId: string): PropCollider | null {
  const d = DOORS.find((item) => item.id === doorId);
  if (!d) return null;
  const halfSpan = d.width / 2;
  const halfThick = 0.24;
  if (d.orientation === 'horizontal') {
    return {
      id: `locked_${d.id}`,
      minX: d.x - halfSpan,
      maxX: d.x + halfSpan,
      minZ: d.z - halfThick,
      maxZ: d.z + halfThick,
    };
  }
  return {
    id: `locked_${d.id}`,
    minX: d.x - halfThick,
    maxX: d.x + halfThick,
    minZ: d.z - halfSpan,
    maxZ: d.z + halfSpan,
  };
}

export function getChapterLockedDoorIds(
  unlockedChapter: ChapterId,
  completedChaptersCount = 0
): string[] {
  const locked: string[] = [];
  for (const d of DOORS) {
    if (d.requiresAllChapters) {
      if (completedChaptersCount < 5) locked.push(d.id);
      continue;
    }
    if (d.requiredChapter && d.requiredChapter > unlockedChapter) {
      locked.push(d.id);
    }
  }
  return locked;
}

export function getChapterLockedRooms(
  unlockedChapter: ChapterId,
  completedChaptersCount = 0
): RoomId[] {
  const locked: RoomId[] = [];
  for (const room of Object.values(ROOMS)) {
    if (room.id === 'earth_observation_room') {
      if (completedChaptersCount < 5) locked.push(room.id);
      continue;
    }
    if (room.chapter && room.chapter > unlockedChapter) {
      locked.push(room.id);
    }
  }
  return locked;
}

export function getLockedDoorColliders(
  completedLockedRoomIds: RoomId[],
  chapterLockedDoorIds: string[] = []
): PropCollider[] {
  const doorIdSet = new Set<string>(chapterLockedDoorIds);
  for (const roomId of completedLockedRoomIds) {
    const room = ROOMS[roomId];
    if (!room || room.neverLock || !room.doorId) continue;
    doorIdSet.add(room.doorId);
  }
  const boxes: PropCollider[] = [];
  doorIdSet.forEach((doorId) => {
    const col = getDoorCollider(doorId);
    if (col) boxes.push(col);
  });
  return boxes;
}

export function detectBlockedDoorAttempt(
  nextX: number,
  nextZ: number,
  radius: number,
  completedLockedRooms: RoomId[],
  chapterLockedDoorIds: string[]
): { doorId: string; reason: 'chapter_locked' | 'completed_locked'; doorLabel: string } | null {
  const chapSet = new Set(chapterLockedDoorIds);
  const compDoorSet = new Set<string>();
  for (const rid of completedLockedRooms) {
    const rm = ROOMS[rid];
    if (rm && !rm.neverLock && rm.doorId) compDoorSet.add(rm.doorId);
  }

  for (const d of DOORS) {
    const isChap = chapSet.has(d.id);
    const isComp = compDoorSet.has(d.id);
    if (!isChap && !isComp) continue;
    const col = getDoorCollider(d.id);
    if (!col) continue;
    if (circleIntersectsAABB(nextX, nextZ, radius + 0.14, col)) {
      return {
        doorId: d.id,
        reason: isComp ? 'completed_locked' : 'chapter_locked',
        doorLabel: d.label,
      };
    }
  }
  return null;
}

export function isPlayerClearOfRoomAndDoor(x: number, z: number, roomId: RoomId, margin = 1.45): boolean {
  const room = ROOMS[roomId];
  if (!room) return true;
  const b = room.bounds;
  if (
    x >= b.minX - 0.15 &&
    x <= b.maxX + 0.15 &&
    z >= b.minZ - 0.15 &&
    z <= b.maxZ + 0.15
  ) {
    return false;
  }
  if (room.doorId) {
    const door = DOORS.find((d) => d.id === room.doorId);
    if (door) {
      const dist = Math.hypot(x - door.x, z - door.z);
      if (dist < margin + 1.0) return false;
    }
  }
  return true;
}

/**
 * Substepped, slide-aware continuous collision resolution so high speed or diagonal corner
 * contact never tunnels through walls, corners, door frames, or furniture.
 */
export function resolvePlayerMovement(
  fromX: number,
  fromZ: number,
  targetX: number,
  targetZ: number,
  radius = 0.48,
  extraBlockedBoxes?: PropCollider[]
): { x: number; z: number } {
  const dx = targetX - fromX;
  const dz = targetZ - fromZ;
  const dist = Math.hypot(dx, dz);
  if (dist < 1e-6) return { x: fromX, z: fromZ };

  const steps = Math.max(1, Math.ceil(dist / 0.1));
  const stepX = dx / steps;
  const stepZ = dz / steps;

  let curX = fromX;
  let curZ = fromZ;

  for (let s = 0; s < steps; s++) {
    const nextX = curX + stepX;
    const nextZ = curZ + stepZ;

    if (isPointWalkable(nextX, nextZ, radius, extraBlockedBoxes)) {
      curX = nextX;
      curZ = nextZ;
      continue;
    }

    let moved = false;
    if (Math.abs(stepX) > 1e-6 && isPointWalkable(curX + stepX, curZ, radius, extraBlockedBoxes)) {
      curX += stepX;
      moved = true;
    }
    if (!moved && Math.abs(stepZ) > 1e-6 && isPointWalkable(curX, curZ + stepZ, radius, extraBlockedBoxes)) {
      curZ += stepZ;
      moved = true;
    }
    if (!moved) {
      // Diagonal tangent slide for smooth movement along 45-degree chamfered walls
      const stepLen = Math.hypot(stepX, stepZ);
      const slideDirs: Array<[number, number]> = [
        [stepLen * 0.7071, stepLen * 0.7071],
        [-stepLen * 0.7071, stepLen * 0.7071],
        [stepLen * 0.7071, -stepLen * 0.7071],
        [-stepLen * 0.7071, -stepLen * 0.7071],
      ];
      for (let d = 0; d < slideDirs.length; d++) {
        const [sx, sz] = slideDirs[d];
        if (sx * stepX + sz * stepZ <= 0) continue;
        if (isPointWalkable(curX + sx, curZ + sz, radius, extraBlockedBoxes)) {
          curX += sx;
          curZ += sz;
          moved = true;
          break;
        }
      }
    }
    if (!moved) break;
  }

  return { x: curX, z: curZ };
}
