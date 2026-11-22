export type PlayerColorId =
  | 'merah'
  | 'biru'
  | 'hijau'
  | 'kuning'
  | 'ungu'
  | 'pink'
  | 'hitam'
  | 'putih'
  | 'orange'
  | 'maroon';

export type HelmetDesignId =
  | 'standard_visor'
  | 'commander_crest'
  | 'cyber_recon'
  | 'explorer_dome';

export type CostumeStyleId =
  | 'standard_crew'
  | 'tactical_armor'
  | 'nusantara_batik'
  | 'cyber_neon';

export type HeadAccessoryId =
  | 'none'
  | 'topi_astronaut'
  | 'helm_futuristik'
  | 'headset'
  | 'mahkota'
  | 'bunga'
  | 'topi_batik'
  | 'aksesori_antariksa'
  // Chapter 1 rewards (REX)
  | 'futuristic_blue_hat'
  | 'comm_headset'
  // Chapter 2 rewards (BIMA)
  | 'batik_flower'
  // Chapter 3 rewards (FUZZY)
  | 'fuzzy_signal_ears'
  | 'fuzzy_holo_visor'
  // Chapter 4 rewards (BOB)
  | 'bob_cargo_goggles'
  | 'bob_exo_helm'
  // Chapter 5 rewards (RATU LARAS)
  | 'golden_crown'
  | 'nusantara_flower';

export type BodyAccessoryId =
  | 'none'
  | 'backpack'
  | 'cape'
  | 'ornamen_batik'
  | 'jaket_astronaut'
  | 'aksesori_futuristik'
  // Chapter 1 rewards (REX)
  | 'tech_backpack'
  // Chapter 2 rewards (BIMA)
  | 'cultural_backpack'
  | 'modern_batik_cape'
  // Chapter 3 rewards (FUZZY)
  | 'fuzzy_transceiver_pack'
  // Chapter 4 rewards (BOB)
  | 'bob_hydraulic_frame'
  // Chapter 5 rewards (RATU LARAS)
  | 'royal_batik_cape';

export type NeckAccessoryId =
  | 'none'
  | 'kalung'
  | 'medali'
  | 'ornamen_khusus'
  // Chapter 1 rewards (REX)
  | 'chip_necklace'
  // Chapter 2 rewards (BIMA)
  | 'planet_necklace'
  // Chapter 3 rewards (FUZZY)
  | 'fuzzy_fiber_necklace'
  // Chapter 4 rewards (BOB)
  | 'bob_trade_medallion'
  // Chapter 5 rewards (RATU LARAS)
  | 'batik_necklace';

export type SpecialItemId =
  | 'medalion_hyperglobalis'
  | 'medalion_transformasionalis'
  | 'medalion_teknologi'
  | 'medalion_ekonomi'
  | 'medalion_skeptis';

export type ChapterId = 1 | 2 | 3 | 4 | 5;

export type InventoryCategory = 'head' | 'neck' | 'body' | 'special';

export interface InventoryItemDef {
  id: string;
  name: string;
  category: InventoryCategory;
  description: string;
  isDefault: boolean;
  rewardChapter?: ChapterId;
  accentHex: string;
  equipId?: HeadAccessoryId | BodyAccessoryId | NeckAccessoryId;
}

export interface HeadwearTransform {
  offsetY: number;
  offsetZ: number;
  tiltX: number;
  scale: number;
}

export interface CharacterConfig {
  name: string;
  color: PlayerColorId;
  helmet: HelmetDesignId;
  costume: CostumeStyleId;
  head: HeadAccessoryId;
  body: BodyAccessoryId;
  neck: NeckAccessoryId;
  headwearTransform?: HeadwearTransform;
}

export type CharacterAnimState =
  | 'idle'
  | 'walk'
  | 'run'
  | 'jump'
  | 'interact'
  | 'vent_in'
  | 'vent_out'
  | 'celebrate'
  | 'defeat';

export type EmoteId =
  | 'wave'
  | 'bow'
  | 'salute'
  | 'clap'
  | 'thumbs_up'
  | 'heart'
  | 'laugh'
  | 'sad'
  | 'surprised'
  | 'shrug'
  | 'think'
  | 'celebrate'
  | 'cheer'
  | 'flex'
  | 'spin'
  | 'dance'
  | 'kpop_groove'
  | 'star_hop';

export type EmoteCategory =
  | 'sapaan'
  | 'reaksi'
  | 'ekspresi'
  | 'selebrasi'
  | 'lucu'
  | 'dance';

export interface EmoteDef {
  id: EmoteId;
  emoji: string;
  label: string;
  category: EmoteCategory;
  durationMs: number;
  accentHex: string;
  isStarter?: boolean;
  requiredChapter?: ChapterId;
  unlockType?: 'starter' | 'chapter' | 'secret_tv';
  unlockLabel?: string;
}

export interface MusicSearchResult {
  id: string;
  title: string;
  artist: string;
  album?: string;
  artworkUrl?: string;
  previewUrl: string;
  durationMs: number;
  source: 'itunes';
}

export type RankingCategory = 'fastest' | 'most_items' | 'most_emotes';

export interface RankingEntry {
  playerId: string;
  playerName: string;
  avatarColor?: string;
  bestCompletionMs: number | null;
  itemCount: number;
  emoteCount: number;
  completedChapters: number;
  totalExp: number;
  updatedAt: number;
}

export interface RankingsResponse {
  available: boolean;
  fastest: RankingEntry[];
  mostItems: RankingEntry[];
  mostEmotes: RankingEntry[];
  updatedAt: number;
  error?: string;
}

export type GraphicsQuality = 'low' | 'medium' | 'high';

export type MusicTrackId =
  | 'cosmic_drift'
  | 'nusantara_gamelan'
  | 'seoul_neon'
  | 'western_sunset'
  | 'tension_protocol';

export interface GameSettings {
  musicVolume: number; // 0..1
  sfxVolume: number; // 0..1
  muted: boolean;
  musicTrack?: MusicTrackId;
  musicPaused?: boolean;
  musicMuted?: boolean;
  selectedExternalTrack?: MusicSearchResult | null;
  voiceEnabled?: boolean;
  voiceVolume?: number; // 0..1
  cameraSensitivity: number; // 0.3..2.0
  moveSensitivity: number; // 0.5..1.8
  showTouchControls: boolean;
  graphicsQuality: GraphicsQuality;
}

export interface CreatorInfo {
  creatorName: string;
  schoolOrInstitution: string;
  subjectInfo: string;
  year: string;
}

export type ScreenView =
  | 'home'
  | 'howtoplay'
  | 'customize'
  | 'settings'
  | 'about'
  | 'multiplayer_lobby'
  | 'playing'
  | 'ending';

export type GameMode = 'solo' | 'multiplayer';

export type RoomId =
  | 'central_lobby'
  | 'communication_room'
  | 'technology_lab'
  | 'navigation_room'
  | 'cultural_room'
  | 'economic_room'
  | 'global_exchange_room'
  | 'world_economy_room'
  | 'cultural_identity_room'
  | 'global_balance_room'
  | 'earth_observation_room';

export type MissionId =
  | 'ch1_m1'
  | 'ch1_m2'
  | 'ch2_m1'
  | 'ch2_m2'
  | 'ch3_m1'
  | 'ch3_m2'
  | 'ch4_m1'
  | 'ch4_m2'
  | 'ch5_m1'
  | 'ch5_m2';

export type RoomMissionStatus =
  | 'locked_chapter'
  | 'unread'
  | 'reading'
  | 'ready_quiz'
  | 'in_progress'
  | 'completed'
  | 'completed_locked';

export type CutsceneCharacterId =
  | 'prolog'
  | 'rex'
  | 'bima'
  | 'fuzzy'
  | 'bob'
  | 'ratu_laras'
  | 'all_final';

export type NpcCharacterId = 'rex' | 'bima' | 'fuzzy' | 'bob' | 'ratu_laras';

export interface CutsceneLine {
  speaker: string;
  roleTitle: string;
  speakerId: NpcCharacterId | 'player' | 'narrator' | 'companion';
  colorHex: string;
  text: string;
  emotion?: 'confident' | 'thoughtful' | 'inspiring' | 'serious' | 'curious' | 'panic';
  gesture?:
    | 'explain'
    | 'point'
    | 'nod'
    | 'ponder'
    | 'gearup'
    | 'scratch_head'
    | 'tilt_curious'
    | 'panic';
  cameraFocus?:
    | 'wide'
    | 'npc'
    | 'player'
    | 'companion'
    | 'hologram'
    | 'space'
    | 'shuttle'
    | 'sparkle_spot'
    | 'sparkle_follow'
    | 'sparkle_book';
  scenePhase?:
    | 'companion_panic'
    | 'companion_leave'
    | 'sparkle_spot'
    | 'sparkle_follow'
    | 'sparkle_book';
}

export interface CutsceneScript {
  id: CutsceneCharacterId;
  chapter?: ChapterId;
  title: string;
  subtitle: string;
  roomId: RoomId;
  themeColorHex: string;
  lines: CutsceneLine[];
}

// --- 7 QUESTION ARCHETYPES ---
export type QuestionModelType =
  | 'multiple_choice'
  | 'true_false'
  | 'case_study'
  | 'cause_effect'
  | 'statement_analysis'
  | 'concept_matching'
  | 'process_sequence';

export interface ChoiceOption {
  id: string;
  label: string;
}

export interface SingleChoiceQuestion {
  id: string;
  type:
    | 'multiple_choice'
    | 'true_false'
    | 'case_study'
    | 'cause_effect'
    | 'statement_analysis';
  topic: string;
  category?: 'Bentuk Globalisasi' | 'Proses Globalisasi';
  prompt: string;
  contextText?: string;
  statements?: string[];
  options: ChoiceOption[];
  correctOptionId: string;
  explanation: string;
}

export interface ConceptPair {
  id: string;
  term: string;
  match: string;
}

export interface ConceptMatchingQuestion {
  id: string;
  type: 'concept_matching';
  topic: string;
  category?: 'Bentuk Globalisasi' | 'Proses Globalisasi';
  prompt: string;
  contextText?: string;
  pairs: ConceptPair[];
  explanation: string;
}

export interface SequenceStep {
  id: string;
  label: string;
  order: number;
}

export interface ProcessSequenceQuestion {
  id: string;
  type: 'process_sequence';
  topic: string;
  category?: 'Bentuk Globalisasi' | 'Proses Globalisasi';
  prompt: string;
  contextText?: string;
  steps: SequenceStep[];
  explanation: string;
}

export type QuestionModel =
  | SingleChoiceQuestion
  | ConceptMatchingQuestion
  | ProcessSequenceQuestion;

export interface QuizQuestion {
  id: number;
  category: 'Bentuk Globalisasi' | 'Proses Globalisasi';
  model: QuestionModel;
}

export interface ImpostorChallenge {
  id: string;
  roomId: RoomId;
  title: string;
  topic: string;
  scenario: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
}

// --- INTERACTIVE 3D THEORY BOOKS ---
export type TheoryBookId =
  | 'book_1_pengertian'
  | 'book_2_karakteristik'
  | 'book_3_hyperglobalist'
  | 'book_4_transformasionalis'
  | 'book_5_skeptis'
  | 'book_6_glokalisasi'
  | 'book_7_dampak_ekonomi'
  | 'book_8_dampak_sosbud'
  | 'book_9_identitas_budaya'
  | 'book_10_ketimpangan'
  | 'book_11_komunikasi';

export interface TheoryBookDef {
  id: TheoryBookId;
  roomId: RoomId;
  title: string;
  topicLabel: string;
  chapterHint: string;
  accentHex: string;
  summary: string;
  keyPoints: string[];
  exampleInLife: string;
  diagramType:
    | 'interconnection'
    | 'characteristics'
    | 'hyperglobalist'
    | 'transformationalist'
    | 'skeptic'
    | 'glocalization'
    | 'economy'
    | 'sociocultural'
    | 'identity'
    | 'inequality'
    | 'communication';
  position: { x: number; y: number; z: number };
}

export type BadgeRank =
  | 'MASTER SOCIOLOGIST'
  | 'GLOBALIZATION EXPERT'
  | 'SOCIAL ANALYST'
  | 'JUNIOR SOCIOLOGIST'
  | 'GLOBALIZATION APPRENTICE';

export interface CutsceneCheckpoint {
  cutsceneId: CutsceneCharacterId;
  lineIndex: number;
}

export interface ChapterProgressState {
  missionsCompleted: boolean;
  cutsceneCompleted: boolean;
  chapterCompleted: boolean;
  rewardClaimed: boolean;
}

export interface SaveState {
  character: CharacterConfig;
  settings: GameSettings;
  creatorInfo: CreatorInfo;
  unlockedItems: string[];
  completedMissions: MissionId[];
  unlockedChapter: ChapterId;
  completedChapters: ChapterId[];
  completedCutscenes: CutsceneCharacterId[];
  missionScores: Partial<Record<MissionId, number>>;
  quizCompleted: boolean;
  quizScore: number; // 0..100
  quizCorrectCount: number;
  totalExp: number;
  endingSeen: boolean;
  prologSeen: boolean;
  tutorialSeen?: boolean;
  readBooks?: TheoryBookId[];
  readBooksByPlayer?: Record<string, TheoryBookId[]>;
  lockedCompletedRooms?: RoomId[];
  activeCutsceneCheckpoint?: CutsceneCheckpoint | null;
  pendingRewardChapter?: ChapterId | null;
  chapterProgress?: Record<ChapterId, ChapterProgressState>;
  metNpcs?: NpcCharacterId[];
  unlockedEmotes?: EmoteId[];
  secretTvCompleted?: boolean;
  replayMode?: boolean;
  runStartedAt?: number | null;
  bestCompletionMs?: number | null;
  pendingRankingSync?: boolean;
}

// --- MULTIPLAYER TYPES ---
export type MultiplayerRole = 'crewmate' | 'impostor';
export type MultiplayerPhase = 'lobby' | 'playing' | 'meeting' | 'ended';
export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'failed'
  | 'offline';

export interface VoicePeerState {
  micOn: boolean;
  muted: boolean;
  speaking: boolean;
}

export interface EliminationEvent {
  eventId: string;
  impostorId: string;
  impostorName: string;
  victimId: string;
  victimName: string;
  victimColor: PlayerColorId;
  x: number;
  z: number;
  roomName: string;
  timestamp: number;
}

export interface RemotePlayerPublic {
  id: string;
  name: string;
  character: CharacterConfig;
  ready: boolean;
  isHost: boolean;
  connected: boolean;
  alive: boolean;
  x: number;
  y?: number;
  z: number;
  yaw: number;
  animState: CharacterAnimState;
  activeEmote?: EmoteId | null;
  inVent: boolean;
  completedMissionCount: number;
  eduScore: number;
  voice?: VoicePeerState;
}

export interface StasisPodState {
  id: string;
  victimId: string;
  victimName: string;
  victimColor: PlayerColorId;
  x: number;
  z: number;
  roomName: string;
}

export interface MeetingChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderColor: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface MeetingState {
  reason: 'emergency' | 'report';
  callerName: string;
  subjectName?: string;
  locationName?: string;
  endsAt: number;
  votes: Record<string, string>; // voterId -> targetId | 'SKIP'
  messages: MeetingChatMessage[];
  resultBanner?: {
    ejectedId: string | null;
    ejectedName: string | null;
    wasImpostor: boolean | null;
    reasonText: string;
  };
}

export interface MatchResultSummary {
  winner: 'crewmate' | 'impostor';
  reason: string;
  impostorId: string;
  impostorName: string;
  crewMissionDone: number;
  crewMissionTotal: number;
  impostorObjectiveDone: number;
  impostorObjectiveTotal: number;
  players: Array<{
    id: string;
    name: string;
    role: MultiplayerRole;
    alive: boolean;
    completedMissions: number;
    eduScore: number;
  }>;
}

export interface RoomSnapshot {
  roomCode: string;
  phase: MultiplayerPhase;
  players: RemotePlayerPublic[];
  stasisPods: StasisPodState[];
  crewMissionTotal: number;
  crewMissionDone: number;
  impostorObjectiveTotal: number;
  impostorObjectiveDone: number;
  meeting: MeetingState | null;
  matchResult: MatchResultSummary | null;
  killCooldownEndsAt: number; // private to impostor, 0 for crewmate
}
