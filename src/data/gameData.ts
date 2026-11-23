import {
  BadgeRank,
  BodyAccessoryId,
  ChapterId,
  CostumeStyleId,
  CutsceneCharacterId,
  CutsceneLine,
  CutsceneScript,
  EmoteCategory,
  EmoteDef,
  EmoteId,
  HeadAccessoryId,
  HelmetDesignId,
  ImpostorChallenge,
  InventoryItemDef,
  MissionId,
  NeckAccessoryId,
  NpcCharacterId,
  PlayerColorId,
  QuestionModel,
  QuizQuestion,
  RoomId,
  SaveState,
  SoloBadgeBreakdown,
  SoloBadgeRecord,
  SoloBadgeTier,
} from '../types/game';

export const HELMET_DESIGNS: Array<{ id: HelmetDesignId; label: string; desc: string }> = [
  { id: 'standard_visor', label: 'Standard Visor', desc: 'Helm klasik kru stasiun dengan kaca lengkung panorama' },
  { id: 'commander_crest', label: 'Commander Crest', desc: 'Helm taktis dengan sirip komando & pelindung dahi metalik' },
  { id: 'cyber_recon', label: 'Cyber Recon', desc: 'Helm pengintai dengan visor HUD ganda & lampu samping' },
  { id: 'explorer_dome', label: 'Explorer Dome', desc: 'Kubah kaca lebar berbingkai cincin penguat orbit' },
];

export const COSTUME_STYLES: Array<{
  id: CostumeStyleId;
  label: string;
  desc: string;
  inventoryId?: string;
  unlockHint?: string;
}> = [
  { id: 'standard_crew', label: 'Standard Crew', desc: 'Seragam antariksa standar GLOBALUS dengan panel dada' },
  { id: 'tactical_armor', label: 'Tactical Armor', desc: 'Pelindung bahu & pelat dada berlapis baja karbon' },
  { id: 'nusantara_batik', label: 'Nusantara Batik', desc: 'Setelan kosmik berornamen batik emas khas Nusantara' },
  { id: 'cyber_neon', label: 'Cyber Neon', desc: 'Seragam berjalur sirkuit neon menyala di sambungan lengan' },
  {
    id: 'batik_smada_biru',
    label: 'Batik SMADA Biru',
    desc: 'Baju berkerah lengan pendek motif Batik SMADA biru-emas eksklusif dari Aulia',
    inventoryId: 'batik_smada_biru',
    unlockHint: 'Selesaikan Misi Rahasia Aulia di Chapter 4 (Solo)',
  },
  {
    id: 'batik_smada_ungu',
    label: 'Batik SMADA Ungu',
    desc: 'Baju berkerah lengan pendek motif Batik SMADA ungu megah penakluk Chapter 5',
    inventoryId: 'batik_smada_ungu',
    unlockHint: 'Selesaikan seluruh Chapter 5 (cutscene Ratu Laras)',
  },
  {
    id: 'batik_smada_merah',
    label: 'Batik SMADA Merah',
    desc: 'Baju berkerah lengan pendek motif Batik SMADA merah-emas edisi Master Kolektor',
    inventoryId: 'batik_smada_merah',
    unlockHint: 'Capai 5 syarat prestasi kumulatif GLOBALUS (Solo 10x, MP 5x, Ch1–5, semua Emote & Item)',
  },
];

export const PLAYER_COLORS: Array<{
  id: PlayerColorId;
  label: string;
  hex: string;
  num: number;
  darkNum: number;
}> = [
  { id: 'merah', label: 'Merah', hex: '#ef4444', num: 0xef4444, darkNum: 0x991b1b },
  { id: 'biru', label: 'Biru', hex: '#3b82f6', num: 0x3b82f6, darkNum: 0x1e40af },
  { id: 'hijau', label: 'Hijau', hex: '#10b981', num: 0x10b981, darkNum: 0x065f46 },
  { id: 'kuning', label: 'Kuning', hex: '#eab308', num: 0xeab308, darkNum: 0xa16207 },
  { id: 'ungu', label: 'Ungu', hex: '#8b5cf6', num: 0x8b5cf6, darkNum: 0x5b21b6 },
  { id: 'pink', label: 'Pink', hex: '#ec4899', num: 0xec4899, darkNum: 0x9d174d },
  { id: 'hitam', label: 'Hitam', hex: '#1e293b', num: 0x263244, darkNum: 0x0f172a },
  { id: 'putih', label: 'Putih', hex: '#e2e8f0', num: 0xe2e8f0, darkNum: 0x94a3b8 },
  { id: 'orange', label: 'Orange', hex: '#f97316', num: 0xf97316, darkNum: 0x9a3412 },
  { id: 'maroon', label: 'Maroon', hex: '#881337', num: 0x881337, darkNum: 0x4c0519 },
];

export const INVENTORY_ITEMS: InventoryItemDef[] = [
  // Default Head Accessories
  {
    id: 'topi_astronaut',
    equipId: 'topi_astronaut' as HeadAccessoryId,
    name: 'Topi Astronaut',
    category: 'head',
    description: 'Topi kru komando GLOBALUS dengan emblem orbit perak.',
    isDefault: true,
    accentHex: '#38bdf8',
  },
  {
    id: 'helm_futuristik',
    equipId: 'helm_futuristik' as HeadAccessoryId,
    name: 'Helm Futuristik',
    category: 'head',
    description: 'Pelindung kepala berteknologi antena sensor jarak jauh.',
    isDefault: true,
    accentHex: '#6366f1',
  },
  {
    id: 'headset',
    equipId: 'headset' as HeadAccessoryId,
    name: 'Headset Kru',
    category: 'head',
    description: 'Headset audio standar untuk komunikasi antarsektor di stasiun.',
    isDefault: true,
    accentHex: '#0ea5e9',
  },
  {
    id: 'mahkota',
    equipId: 'mahkota' as HeadAccessoryId,
    name: 'Mahkota Bintang',
    category: 'head',
    description: 'Mahkota perak ringan simbol kepemimpinan misi antariksa.',
    isDefault: true,
    accentHex: '#f59e0b',
  },
  {
    id: 'bunga',
    equipId: 'bunga' as HeadAccessoryId,
    name: 'Bunga Kosmik',
    category: 'head',
    description: 'Aksesori flora bio-luminisens yang mekar di helm astronaut.',
    isDefault: true,
    accentHex: '#ec4899',
  },
  {
    id: 'topi_batik',
    equipId: 'topi_batik' as HeadAccessoryId,
    name: 'Topi Batik',
    category: 'head',
    description: 'Topi bermotif batik Nusantara yang memadukan tradisi dan futurisme.',
    isDefault: true,
    accentHex: '#d97706',
  },
  {
    id: 'aksesori_antariksa',
    equipId: 'aksesori_antariksa' as HeadAccessoryId,
    name: 'Antena Antariksa',
    category: 'head',
    description: 'Antena pemancar ganda untuk mendeteksi sinyal jaringan global.',
    isDefault: true,
    accentHex: '#22d3ee',
  },

  // Default Body Accessories
  {
    id: 'backpack',
    equipId: 'backpack' as BodyAccessoryId,
    name: 'Backpack Standar',
    category: 'body',
    description: 'Tas oksigen dan daya dorong mikro untuk eksplorasi stasiun.',
    isDefault: true,
    accentHex: '#64748b',
  },
  {
    id: 'cape',
    equipId: 'cape' as BodyAccessoryId,
    name: 'Cape Penjelajah',
    category: 'body',
    description: 'Jubah astronaut dinamis yang berkibar saat bergerak cepat.',
    isDefault: true,
    accentHex: '#3b82f6',
  },
  {
    id: 'ornamen_batik',
    equipId: 'ornamen_batik' as BodyAccessoryId,
    name: 'Ornamen Batik',
    category: 'body',
    description: 'Selendang dan panel dada bermotif batik emas Nusantara.',
    isDefault: true,
    accentHex: '#d97706',
  },
  {
    id: 'jaket_astronaut',
    equipId: 'jaket_astronaut' as BodyAccessoryId,
    name: 'Jaket Astronaut',
    category: 'body',
    description: 'Rompi pelindung termal berkerah tinggi untuk misi luar angkasa.',
    isDefault: true,
    accentHex: '#0ea5e9',
  },
  {
    id: 'aksesori_futuristik',
    equipId: 'aksesori_futuristik' as BodyAccessoryId,
    name: 'Sayap Holo-Fin',
    category: 'body',
    description: 'Sirip energi bercahaya di punggung untuk stabilisasi gravitasi nol.',
    isDefault: true,
    accentHex: '#a855f7',
  },

  // Default Neck Accessories
  {
    id: 'kalung',
    equipId: 'kalung' as NeckAccessoryId,
    name: 'Kalung Orbit',
    category: 'neck',
    description: 'Kalung metalik dengan liontin cincin planet mini.',
    isDefault: true,
    accentHex: '#38bdf8',
  },
  {
    id: 'medali',
    equipId: 'medali' as NeckAccessoryId,
    name: 'Medali Akademi',
    category: 'neck',
    description: 'Medali kehormatan taruna sosiologi GLOBALUS.',
    isDefault: true,
    accentHex: '#eab308',
  },
  {
    id: 'ornamen_khusus',
    equipId: 'ornamen_khusus' as NeckAccessoryId,
    name: 'Kerah Kristal',
    category: 'neck',
    description: 'Ornamen leher bercahaya dengan modul kristal energi.',
    isDefault: true,
    accentHex: '#10b981',
  },

  // Chapter 1 Rewards (REX — Hyperglobalist)
  {
    id: 'comm_headset',
    equipId: 'comm_headset' as HeadAccessoryId,
    name: 'Cosmic Neural Interface',
    category: 'head',
    description: 'Hadiah Chapter 1 dari REX. Perangkat neural-visor holografik dengan cincin orbital kosmik & antena energi.',
    isDefault: false,
    rewardChapter: 1,
    accentHex: '#38bdf8',
  },
  {
    id: 'futuristic_blue_hat',
    equipId: 'futuristic_blue_hat' as HeadAccessoryId,
    name: 'Futuristic Blue Hat',
    category: 'head',
    description: 'Hadiah Chapter 1 dari REX. Topi visor biru elektrik bertenaga hiper-jaringan.',
    isDefault: false,
    rewardChapter: 1,
    accentHex: '#0ea5e9',
  },
  {
    id: 'chip_necklace',
    equipId: 'chip_necklace' as NeckAccessoryId,
    name: 'Chip Necklace',
    category: 'neck',
    description: 'Hadiah Chapter 1 dari REX. Liontin prosesor kuantum penguat sinyal global.',
    isDefault: false,
    rewardChapter: 1,
    accentHex: '#2563eb',
  },
  {
    id: 'tech_backpack',
    equipId: 'tech_backpack' as BodyAccessoryId,
    name: 'Tech Backpack',
    category: 'body',
    description: 'Hadiah Chapter 1 dari REX. Ransel server mini dengan lampu indikator biru.',
    isDefault: false,
    rewardChapter: 1,
    accentHex: '#0ea5e9',
  },

  // Chapter 2 Rewards (BIMA — Transformationalist)
  {
    id: 'modern_batik_cape',
    equipId: 'modern_batik_cape' as BodyAccessoryId,
    name: 'Nusantara Tech Mantle',
    category: 'body',
    description: 'Hadiah Chapter 2 dari BIMA. Mantel armor futuristik asimetris dengan ukiran batik emas & serat energi zamrud.',
    isDefault: false,
    rewardChapter: 2,
    accentHex: '#10b981',
  },
  {
    id: 'batik_flower',
    equipId: 'batik_flower' as HeadAccessoryId,
    name: 'Batik Flower Accessory',
    category: 'head',
    description: 'Hadiah Chapter 2 dari BIMA. Hiasan bunga melati-batik simbol akulturasi harmonis.',
    isDefault: false,
    rewardChapter: 2,
    accentHex: '#10b981',
  },
  {
    id: 'planet_necklace',
    equipId: 'planet_necklace' as NeckAccessoryId,
    name: 'Planet Necklace',
    category: 'neck',
    description: 'Hadiah Chapter 2 dari BIMA. Kalung bola dunia bercahaya lambang glokalisasi.',
    isDefault: false,
    rewardChapter: 2,
    accentHex: '#14b8a6',
  },
  {
    id: 'cultural_backpack',
    equipId: 'cultural_backpack' as BodyAccessoryId,
    name: 'Cultural Backpack',
    category: 'body',
    description: 'Hadiah Chapter 2 dari BIMA. Ransel hijau zamrud dengan ukiran batik emas.',
    isDefault: false,
    rewardChapter: 2,
    accentHex: '#059669',
  },

  // Chapter 3 Rewards (FUZZY — Teknologi, Komunikasi & Interaksi Global)
  {
    id: 'fuzzy_signal_ears',
    equipId: 'fuzzy_signal_ears' as HeadAccessoryId,
    name: 'Cyber Signal Fox-Ears',
    category: 'head',
    description: 'Hadiah Chapter 3 dari FUZZY. Sepasang antena penerima sinyal gelombang-milimeter neon magenta-cyan.',
    isDefault: false,
    rewardChapter: 3,
    accentHex: '#ec4899',
  },
  {
    id: 'fuzzy_holo_visor',
    equipId: 'fuzzy_holo_visor' as HeadAccessoryId,
    name: 'Holo-Wave Visor',
    category: 'head',
    description: 'Hadiah Chapter 3 dari FUZZY. Visor holografik tipis dengan sirip pemancar optik di pelipis.',
    isDefault: false,
    rewardChapter: 3,
    accentHex: '#a855f7',
  },
  {
    id: 'fuzzy_transceiver_pack',
    equipId: 'fuzzy_transceiver_pack' as BodyAccessoryId,
    name: 'Quantum Transceiver Pack',
    category: 'body',
    description: 'Hadiah Chapter 3 dari FUZZY. Ransel pemancar parabola kembar dengan saluran serat optik menyala.',
    isDefault: false,
    rewardChapter: 3,
    accentHex: '#ec4899',
  },
  {
    id: 'fuzzy_fiber_necklace',
    equipId: 'fuzzy_fiber_necklace' as NeckAccessoryId,
    name: 'Fiber-Optic Relay Collar',
    category: 'neck',
    description: 'Hadiah Chapter 3 dari FUZZY. Kerah cincin fotonik pemancar sinyal lintas benua.',
    isDefault: false,
    rewardChapter: 3,
    accentHex: '#d946ef',
  },

  // Chapter 4 Rewards (BOB — Dampak Ekonomi, Ketimpangan & Tantangan)
  {
    id: 'bob_cargo_goggles',
    equipId: 'bob_cargo_goggles' as HeadAccessoryId,
    name: 'Industrial Cargo Goggles',
    category: 'head',
    description: 'Hadiah Chapter 4 dari BOB. Kacamata pemindai rantai pasok ganda dengan bingkai titanium-amber.',
    isDefault: false,
    rewardChapter: 4,
    accentHex: '#f59e0b',
  },
  {
    id: 'bob_exo_helm',
    equipId: 'bob_exo_helm' as HeadAccessoryId,
    name: 'Logistics Exo-Crest',
    category: 'head',
    description: 'Hadiah Chapter 4 dari BOB. Pelindung kepala teknik industri berat dengan lampu kerja sorot.',
    isDefault: false,
    rewardChapter: 4,
    accentHex: '#ea580c',
  },
  {
    id: 'bob_hydraulic_frame',
    equipId: 'bob_hydraulic_frame' as BodyAccessoryId,
    name: 'Cargo Exo-Stabilizer',
    category: 'body',
    description: 'Hadiah Chapter 4 dari BOB. Rangka eksoskeleton hidraulik penyeimbang beban perdagangan global.',
    isDefault: false,
    rewardChapter: 4,
    accentHex: '#f59e0b',
  },
  {
    id: 'bob_trade_medallion',
    equipId: 'bob_trade_medallion' as NeckAccessoryId,
    name: 'Medali Neraca Global',
    category: 'neck',
    description: 'Hadiah Chapter 4 dari BOB. Medali oktagonal perunggu-emas simbol perdagangan yang berkeadilan.',
    isDefault: false,
    rewardChapter: 4,
    accentHex: '#d97706',
  },

  // Chapter 5 Rewards (RATU LARAS — Skeptic, Identitas Budaya & Analisis Kritis)
  {
    id: 'golden_crown',
    equipId: 'golden_crown' as HeadAccessoryId,
    name: 'Sovereign Heritage Crown',
    category: 'head',
    description: 'Hadiah Chapter 5 dari RATU LARAS. Mahkota Siger futuristik emas-maroon berlapis permata kedaulatan budaya.',
    isDefault: false,
    rewardChapter: 5,
    accentHex: '#f59e0b',
  },
  {
    id: 'nusantara_flower',
    equipId: 'nusantara_flower' as HeadAccessoryId,
    name: 'Nusantara Flower Accessory',
    category: 'head',
    description: 'Hadiah Chapter 5 dari RATU LARAS. Sumping bunga emas berwibawa.',
    isDefault: false,
    rewardChapter: 5,
    accentHex: '#b91c1c',
  },
  {
    id: 'batik_necklace',
    equipId: 'batik_necklace' as NeckAccessoryId,
    name: 'Batik Necklace',
    category: 'neck',
    description: 'Hadiah Chapter 5 dari RATU LARAS. Kalung emas bermotif kawung Nusantara.',
    isDefault: false,
    rewardChapter: 5,
    accentHex: '#d97706',
  },
  {
    id: 'royal_batik_cape',
    equipId: 'royal_batik_cape' as BodyAccessoryId,
    name: 'Royal Batik Cape',
    category: 'body',
    description: 'Hadiah Chapter 5 dari RATU LARAS. Jubah kerajaan maroon & emas berlapis batik.',
    isDefault: false,
    rewardChapter: 5,
    accentHex: '#9f1239',
  },

  // Special Chapter Artifacts
  {
    id: 'medalion_hyperglobalis',
    name: 'Kunci Jaringan Hiperglobalis',
    category: 'special',
    description: 'Artefak Chapter 1 dari REX yang menandai pemahaman fondasi & teori Hiperglobalis.',
    isDefault: false,
    rewardChapter: 1,
    accentHex: '#0ea5e9',
  },
  {
    id: 'medalion_transformasionalis',
    name: 'Segel Harmoni Transformasionalis',
    category: 'special',
    description: 'Artefak Chapter 2 dari BIMA sebagai bukti penguasaan perubahan sosial & glokalisasi.',
    isDefault: false,
    rewardChapter: 2,
    accentHex: '#10b981',
  },
  {
    id: 'medalion_teknologi',
    name: 'Inti Relai Digital FUZZY',
    category: 'special',
    description: 'Artefak Chapter 3 dari FUZZY atas keberhasilan memulihkan jaringan komunikasi & IPTEK.',
    isDefault: false,
    rewardChapter: 3,
    accentHex: '#ec4899',
  },
  {
    id: 'medalion_ekonomi',
    name: 'Neraca Ekonomi Global BOB',
    category: 'special',
    description: 'Artefak Chapter 4 dari BOB atas keberhasilan memetakan dampak ekonomi & ketimpangan dunia.',
    isDefault: false,
    rewardChapter: 4,
    accentHex: '#f59e0b',
  },
  {
    id: 'medalion_skeptis',
    name: 'Kompas Kritis Ratu Laras',
    category: 'special',
    description: 'Artefak Chapter 5 dari RATU LARAS untuk membaca identitas budaya & dinamika global secara kritis.',
    isDefault: false,
    rewardChapter: 5,
    accentHex: '#f43f5e',
  },

  // Exclusive Batik SMADA Collared Costumes (#38, #39, #40, #41)
  {
    id: 'batik_smada_biru',
    costumeId: 'batik_smada_biru',
    name: 'Batik SMADA Biru',
    category: 'costume',
    description: 'Kemeja berkerah lengan pendek bermotif Batik SMADA biru-emas. Hadiah terima kasih dari Aulia setelah misi rahasia Chapter 4.',
    unlockHint: 'Selesaikan Misi Rahasia Aulia di Chapter 4 (Solo).',
    isDefault: false,
    rewardChapter: 4,
    accentHex: '#2563eb',
  },
  {
    id: 'batik_smada_ungu',
    costumeId: 'batik_smada_ungu',
    name: 'Batik SMADA Ungu',
    category: 'costume',
    description: 'Kemeja berkerah lengan pendek bermotif Batik SMADA ungu-emas yang terbuka setelah menuntaskan Chapter 5.',
    unlockHint: 'Selesaikan Chapter 5 dan cutscene penutupnya.',
    isDefault: false,
    rewardChapter: 5,
    accentHex: '#9333ea',
  },
  {
    id: 'batik_smada_merah',
    costumeId: 'batik_smada_merah',
    name: 'Batik SMADA Merah',
    category: 'costume',
    description: 'Kemeja berkerah lengan pendek bermotif Batik SMADA merah-emas prestisius untuk Master Kolektor GLOBALUS.',
    unlockHint: 'Selesaikan 5 syarat prestasi kumulatif (10x Solo, 5x Multiplayer, Ch1–5 & Quiz, semua Emote & Item).',
    isDefault: false,
    accentHex: '#dc2626',
  },
];

export const CHAPTER_INFO: Record<
  ChapterId,
  {
    title: string;
    subtitle: string;
    characterName: string;
    perspective: string;
    openingStory: string;
    missions: MissionId[];
    accentHex: string;
    rewardPool: string[];
    specialItemId: string;
  }
> = {
  1: {
    title: 'CHAPTER 1 — THE CONNECTED WORLD',
    subtitle: 'Konsep Dasar Globalisasi & Perspektif Hyperglobalist',
    characterName: 'REX: The Hyperglobalist',
    perspective: 'Perspektif Hiperglobalis',
    openingStory:
      'GLOBALUS Space Station mengalami gangguan awal pada simpul navigasi dasar! Kalibrasi modul fondasi globalisasi di Navigation Room dan panel Hyperglobalist di Central Lobby.',
    missions: ['ch1_m1', 'ch1_m2'],
    accentHex: '#0ea5e9',
    rewardPool: ['comm_headset', 'futuristic_blue_hat', 'chip_necklace', 'tech_backpack'],
    specialItemId: 'medalion_hyperglobalis',
  },
  2: {
    title: 'CHAPTER 2 — THE CHANGING WORLD',
    subtitle: 'Teori Transformasionalis, Perubahan Sosial & Glokalisasi',
    characterName: 'BIMA: The Transformationalist',
    perspective: 'Perspektif Transformasionalis',
    openingStory:
      'Konektivitas dasar mulai pulih, tetapi arus pertukaran budaya di Sayap Timur tidak sinkron! Seimbangkan akulturasi budaya di Cultural Room dan sintesis glokalisasi di Global Exchange Room.',
    missions: ['ch2_m1', 'ch2_m2'],
    accentHex: '#10b981',
    rewardPool: ['modern_batik_cape', 'batik_flower', 'planet_necklace', 'cultural_backpack'],
    specialItemId: 'medalion_transformasionalis',
  },
  3: {
    title: 'CHAPTER 3 — DIGITAL PULSE',
    subtitle: 'Perkembangan Teknologi, Komunikasi & Interaksi Global',
    characterName: 'FUZZY: The Signal Weaver',
    perspective: 'Revolusi Komunikasi & IPTEK',
    openingStory:
      'Sinyal data antariksa terganggu badai ion! Bantu FUZZY memulihkan jaringan komunikasi lintas benua di Communication Room serta kalibrasi AI dan IPTEK di Technology Laboratory.',
    missions: ['ch3_m1', 'ch3_m2'],
    accentHex: '#ec4899',
    rewardPool: ['fuzzy_signal_ears', 'fuzzy_holo_visor', 'fuzzy_transceiver_pack', 'fuzzy_fiber_necklace'],
    specialItemId: 'medalion_teknologi',
  },
  4: {
    title: 'CHAPTER 4 — THE UNEQUAL GRID',
    subtitle: 'Dampak Ekonomi, Sistem Dunia, Ketimpangan & Tantangan Globalisasi',
    characterName: 'BOB: The Global Architect',
    perspective: 'Ekonomi Global & Ketimpangan Struktural',
    openingStory:
      'Data logistik memperlihatkan kesenjangan tajam antara negara pusat dan pinggiran! Temui tantangan perdagangan di Economic Room dan petakan Sistem Dunia Wallerstein di World Economy Room.',
    missions: ['ch4_m1', 'ch4_m2'],
    accentHex: '#f59e0b',
    rewardPool: ['bob_cargo_goggles', 'bob_exo_helm', 'bob_hydraulic_frame', 'bob_trade_medallion'],
    specialItemId: 'medalion_ekonomi',
  },
  5: {
    title: 'CHAPTER 5 — CRITICAL SOVEREIGNTY',
    subtitle: 'Perspektif Skeptis, Identitas Budaya & Analisis Kritis Globalisasi',
    characterName: 'RATU LARAS: The Skeptic',
    perspective: 'Perspektif Skeptis Kritis',
    openingStory:
      'Tahap puncak misi GLOBALUS! Di Sayap Utara, Ratu Laras menantangmu menguji ketahanan identitas budaya melawan westernisasi & cultural lag serta mengambil kebijakan kritis di Global Balance Room.',
    missions: ['ch5_m1', 'ch5_m2'],
    accentHex: '#f43f5e',
    rewardPool: ['golden_crown', 'batik_necklace', 'nusantara_flower', 'royal_batik_cape'],
    specialItemId: 'medalion_skeptis',
  },
};

export const MISSION_META: Record<
  MissionId,
  {
    id: MissionId;
    chapter: ChapterId;
    roomId: RoomId;
    title: string;
    topic: string;
    shortObjective: string;
  }
> = {
  ch1_m1: {
    id: 'ch1_m1',
    chapter: 1,
    roomId: 'navigation_room',
    title: 'Fondasi & Karakteristik Globalisasi',
    topic: 'Konsep Dasar & Proses Globalisasi',
    shortObjective: 'Selesaikan analisis konsep dasar, ciri globalisasi, & kronologi era di Navigation Room',
  },
  ch1_m2: {
    id: 'ch1_m2',
    chapter: 1,
    roomId: 'central_lobby',
    title: 'Kalibrasi Perspektif Hyperglobalist',
    topic: 'Teori Hyperglobalist & Dunia Tanpa Batas',
    shortObjective: 'Analisis studi kasus & relasi sebab-akibat perspektif Hyperglobalist di Central Lobby',
  },
  ch2_m1: {
    id: 'ch2_m1',
    chapter: 2,
    roomId: 'cultural_room',
    title: 'Dinamika Perubahan Sosial & Akulturasi',
    topic: 'Transformasionalis & Perubahan Budaya',
    shortObjective: 'Uji pemahaman akulturasi, asimilasi & teori Transformasionalis di Cultural Room',
  },
  ch2_m2: {
    id: 'ch2_m2',
    chapter: 2,
    roomId: 'global_exchange_room',
    title: 'Sintesis Glokalisasi Adaptif',
    topic: 'Glokalisasi & Interaksi Lokal-Global',
    shortObjective: 'Pecahkan studi kasus & pencocokan konsep glokalisasi di Global Exchange Room',
  },
  ch3_m1: {
    id: 'ch3_m1',
    chapter: 3,
    roomId: 'communication_room',
    title: 'Revolusi Komunikasi & Media Dunia',
    topic: 'Globalisasi Komunikasi & Media',
    shortObjective: 'Urutkan evolusi komunikasi & analisis dampak arus informasi di Communication Room',
  },
  ch3_m2: {
    id: 'ch3_m2',
    chapter: 3,
    roomId: 'technology_lab',
    title: 'Kalibrasi Reaktor IPTEK & AI',
    topic: 'Globalisasi IPTEK & Interaksi Global',
    shortObjective: 'Pasangkan inovasi IPTEK dengan dampaknya & uji studi kasus digital di Technology Lab',
  },
  ch4_m1: {
    id: 'ch4_m1',
    chapter: 4,
    roomId: 'economic_room',
    title: 'Arus Perdagangan, MNC & Pasar Bebas',
    topic: 'Dampak Ekonomi Globalisasi',
    shortObjective: 'Analisis peran MNC, ekspor UMKM & tantangan pasar bebas di Economic Room',
  },
  ch4_m2: {
    id: 'ch4_m2',
    chapter: 4,
    roomId: 'world_economy_room',
    title: 'Pemetaan Ketimpangan Sistem Dunia',
    topic: 'Sistem Dunia Wallerstein & Ketimpangan',
    shortObjective: 'Petakan Core–Semi-Periphery–Periphery & alur ketergantungan ekonomi di World Economy Room',
  },
  ch5_m1: {
    id: 'ch5_m1',
    chapter: 5,
    roomId: 'cultural_identity_room',
    title: 'Benteng Identitas & Cultural Lag',
    topic: 'Westernisasi, Neokolonialisme & Cultural Lag',
    shortObjective: 'Evaluasi tantangan identitas budaya & fenomena cultural lag di Cultural Identity Room',
  },
  ch5_m2: {
    id: 'ch5_m2',
    chapter: 5,
    roomId: 'global_balance_room',
    title: 'Doktrin Skeptis & Sikap Selektif',
    topic: 'Perspektif Skeptis & Analisis Kritis',
    shortObjective: 'Rumuskan sikap kritis selektif terhadap globalisasi di Global Balance Room',
  },
};

export const MISSION_QUESTIONS: Record<MissionId, QuestionModel[]> = {
  ch1_m1: [
    {
      id: 'ch1_m1_q1',
      type: 'multiple_choice',
      topic: 'Pengertian Globalisasi',
      prompt: 'Menurut sosiolog Anthony Giddens, manakah definisi yang paling tepat menggambarkan hakikat globalisasi?',
      options: [
        { id: 'a', label: 'Intensifikasi hubungan sosial mendunia yang menghubungkan kejadian lokal dengan peristiwa berjarak jauh' },
        { id: 'b', label: 'Kebijakan menutup perdagangan luar negeri demi kemandirian ekonomi total' },
        { id: 'c', label: 'Proses mengganti seluruh bahasa daerah dengan satu bahasa tunggal secara hukum' },
        { id: 'd', label: 'Perpindahan penduduk desa ke kota dalam batas wilayah provinsi yang sama' },
      ],
      correctOptionId: 'a',
      explanation: 'Anthony Giddens mendefinisikan globalisasi sebagai intensifikasi relasi sosial lintas batas yang membuat kejadian di tempat jauh memengaruhi kehidupan lokal.',
    },
    {
      id: 'ch1_m1_q2',
      type: 'true_false',
      topic: 'Karakteristik Globalisasi',
      prompt: 'Tentukan apakah pernyataan sosiologis tentang karakteristik globalisasi berikut Benar atau Salah.',
      contextText: '“Salah satu ciri utama globalisasi adalah penyusutan ruang dan waktu (time-space compression), yaitu jarak geografis yang jauh dapat ditempuh dan dihubungkan jauh lebih cepat.”',
      options: [
        { id: 'true', label: 'Benar — Teknologi transportasi & komunikasi memangkas hambatan jarak dan waktu' },
        { id: 'false', label: 'Salah — Globalisasi hanya berkaitan dengan politik tanpa mengubah persepsi ruang dan waktu' },
      ],
      correctOptionId: 'true',
      explanation: 'Tepat! Penyusutan ruang dan waktu membuat arus manusia, barang, dan informasi antarbenua berlangsung cepat dan hampir instan.',
    },
    {
      id: 'ch1_m1_q3',
      type: 'statement_analysis',
      topic: 'Ciri-Ciri Globalisasi',
      prompt: 'Perhatikan pernyataan-pernyataan berikut, lalu pilih kombinasi yang BENAR menunjukkan ciri globalisasi:',
      statements: [
        '1. Meningkatnya interaksi budaya melalui media, film, musik, dan pariwisata internasional',
        '2. Meningkatnya saling ketergantungan ekonomi dan produksi lintas negara',
        '3. Hilangnya seluruh bentuk interaksi tatap muka di lingkungan keluarga',
        '4. Munculnya masalah bersama global seperti krisis iklim dan keamanan siber',
      ],
      options: [
        { id: 'a', label: 'Pernyataan 1, 2, dan 4' },
        { id: 'b', label: 'Pernyataan 1, 2, dan 3' },
        { id: 'c', label: 'Pernyataan 2 dan 3 saja' },
        { id: 'd', label: 'Pernyataan 3 dan 4 saja' },
      ],
      correctOptionId: 'a',
      explanation: 'Globalisasi ditandai integrasi budaya (1), interdependensi ekonomi (2), dan masalah bersama lintas batas (4). Interaksi keluarga tatap muka tidak hilang total.',
    },
    {
      id: 'ch1_m1_q4',
      type: 'process_sequence',
      topic: 'Kronologi Proses Globalisasi',
      prompt: 'Susun 4 tahapan sejarah proses terjadinya globalisasi berikut dari yang paling awal hingga era mutakhir:',
      steps: [
        { id: 's1', label: 'Perdagangan Kuno Jalur Sutra & Jalur Rempah Maritim', order: 1 },
        { id: 's2', label: 'Ekspansi Pelayaran Samudra & Kolonialisme Awal', order: 2 },
        { id: 's3', label: 'Revolusi Industri Mesin Uap & Transportasi Massal', order: 3 },
        { id: 's4', label: 'Era Internet Global, Satelit & Kecerdasan Buatan', order: 4 },
      ],
      explanation: 'Globalisasi berkembang bertahap dari perdagangan kuno, pelayaran samudra/kolonial, mekanisasi Revolusi Industri, hingga jaringan digital global.',
    },
  ],

  ch1_m2: [
    {
      id: 'ch1_m2_q1',
      type: 'case_study',
      topic: 'Teori Hyperglobalist',
      prompt: 'Analisis studi kasus berikut berdasarkan tiga perspektif teori globalisasi:',
      contextText: 'Sebuah startup aplikasi belajar dari Jakarta melayani siswa di 18 negara dengan pembayaran lintas mata uang instan dan tim pengembang yang tersebar di Asia serta Eropa tanpa kantor pusat fisik tunggal.',
      options: [
        { id: 'a', label: 'Perspektif Hyperglobalist — Dunia menuju masyarakat jaringan tanpa batas (borderless world)' },
        { id: 'b', label: 'Perspektif Skeptis ekstrem — Perdagangan lintas negara mustahil melampaui batas wilayah' },
        { id: 'c', label: 'Isolasionisme agraris — Produksi hanya bergantung pada pasar lokal tradisional' },
        { id: 'd', label: 'Cultural lag — Penolakan total masyarakat terhadap sistem pembayaran elektronik' },
      ],
      correctOptionId: 'a',
      explanation: 'Kaum Hyperglobalist menekankan lahirnya ekonomi dan jejaring sosial tanpa batas geografis akibat teknologi dan integrasi pasar global.',
    },
    {
      id: 'ch1_m2_q2',
      type: 'cause_effect',
      topic: 'Logika Teori Hyperglobalist',
      prompt: 'Tentukan hubungan SEBAB dan AKIBAT yang paling sesuai dengan gagasan utama perspektif Hyperglobalist:',
      contextText: 'SEBAB: Pesatnya internet berkecepatan tinggi, logistik kontainer modern, serta liberalisasi pasar dan arus modal global.',
      options: [
        { id: 'a', label: 'AKIBAT: Peran batas administratif negara-bangsa melemah dibanding kekuatan pasar dan jaringan global' },
        { id: 'b', label: 'AKIBAT: Seluruh negara menutup pelabuhan internasional dan memutus kabel internet bawah laut' },
        { id: 'c', label: 'AKIBAT: Pertukaran informasi dan teknologi kembali membutuhkan waktu berbulan-bulan' },
        { id: 'd', label: 'AKIBAT: Masyarakat global berhenti menggunakan bahasa dan standar perdagangan bersama' },
      ],
      correctOptionId: 'a',
      explanation: 'Hyperglobalist berargumen bahwa teknologi dan pasar global membuat batas tradisional negara semakin kabur dan terintegrasi dalam satu sistem dunia.',
    },
    {
      id: 'ch1_m2_q3',
      type: 'concept_matching',
      topic: 'Pemetaan Tokoh & Konsep Dasar',
      prompt: 'Pasangkan setiap istilah globalisasi di sebelah kiri dengan konsep yang paling tepat di sebelah kanan:',
      pairs: [
        { id: 'p1', term: 'Borderless World', match: 'Terbukanya arus informasi & ekonomi menembus batas negara' },
        { id: 'p2', term: 'Interdependensi Global', match: 'Kondisi saling ketergantungan antarnegara dalam rantai pasok' },
        { id: 'p3', term: 'Global Village', match: 'Metafora dunia terasa seperti satu desa kecil berkat media elektronik' },
      ],
      explanation: 'Marshall McLuhan mengenalkan Global Village, sementara Hyperglobalist populer dengan gagasan Borderless World dan interdependensi global.',
    },
    {
      id: 'ch1_m2_q4',
      type: 'true_false',
      topic: 'Evaluasi Pandangan Hyperglobalist',
      prompt: 'Nilai ketepatan pernyataan berikut mengenai teori Hyperglobalist:',
      contextText: '“Teori Hyperglobalist menganggap globalisasi sebagai fenomena nyata yang melemahkan sekat negara, tetapi sering dikritik karena terlalu optimistis dan kurang menyoroti ketimpangan antarnegara.”',
      options: [
        { id: 'true', label: 'Benar — Hyperglobalist mengakui era baru global tetapi kerap mengabaikan ketimpangan struktural' },
        { id: 'false', label: 'Salah — Hyperglobalist justru menolak bahwa globalisasi benar-benar terjadi' },
      ],
      correctOptionId: 'true',
      explanation: 'Benar! Berbeda dengan Skeptic, kaum Hyperglobalist optimistis terhadap dunia tanpa batas namun sering dikritik karena mengabaikan ketimpangan Utara–Selatan.',
    },
  ],

  ch2_m1: [
    {
      id: 'ch2_m1_q1',
      type: 'concept_matching',
      topic: 'Akulturasi, Asimilasi & Transformasi',
      prompt: 'Cocokkan konsep perubahan sosial-budaya dengan definisi sosiologisnya:',
      pairs: [
        { id: 'p1', term: 'Akulturasi Budaya', match: 'Perpaduan budaya asing dan lokal tanpa menghilangkan ciri khas budaya asli' },
        { id: 'p2', term: 'Asimilasi Budaya', match: 'Peleburan dua budaya atau lebih yang melahirkan budaya baru & memudarkan ciri lama' },
        { id: 'p3', term: 'Teori Transformasionalis', match: 'Globalisasi mengubah masyarakat secara dinamis dengan hasil berbeda di tiap daerah' },
      ],
      explanation: 'Transformasionalis menyoroti bagaimana budaya dan institusi lokal berubah secara kreatif melalui proses seperti akulturasi alih-alih punah seragam.',
    },
    {
      id: 'ch2_m1_q2',
      type: 'case_study',
      topic: 'Transformasi Budaya Nusantara',
      prompt: 'Bacalah fenomena budaya berikut, lalu tentukan konsep sosiologi yang paling tepat:',
      contextText: 'Sekolah menengah di Solo mementaskan sendratari wayang orang dengan tata panggung proyeksi hologram 3D dan musik orkestra digital sehingga menarik minat penonton muda mancanegara.',
      options: [
        { id: 'a', label: 'Akulturasi adaptif yang selaras dengan teori Transformasionalis' },
        { id: 'b', label: 'Westernisasi murni karena menggunakan peralatan audio panggung modern' },
        { id: 'c', label: 'Etnosentrisme tertutup terhadap pengaruh teknologi baru' },
        { id: 'd', label: 'Asimilasi total yang menghapus cerita wayang Nusantara' },
      ],
      correctOptionId: 'a',
      explanation: 'Mengolah teknologi visual modern tanpa menghapus nilai dan kisah wayang merupakan contoh nyata akulturasi adaptif dan transformasi budaya.',
    },
    {
      id: 'ch2_m1_q3',
      type: 'statement_analysis',
      topic: 'Pandangan Transformasionalis',
      prompt: 'Identifikasi pernyataan yang MENCERMINKAN pandangan kaum Transformasionalis (seperti tokoh BIMA):',
      statements: [
        '1. Globalisasi tidak memiliki satu arah tunggal dan dapat berdampak berbeda di tiap masyarakat',
        '2. Negara tidak lenyap, melainkan menata ulang perannya menghadapi tantangan lintas batas',
        '3. Budaya lokal pasti hancur total menjadi satu budaya tunggal yang seragam',
        '4. Masyarakat memiliki daya agensi untuk memodifikasi arus global sesuai nilai lokal',
      ],
      options: [
        { id: 'a', label: 'Pernyataan 1, 2, dan 4' },
        { id: 'b', label: 'Pernyataan 1 dan 3 saja' },
        { id: 'c', label: 'Pernyataan 2 dan 3 saja' },
        { id: 'd', label: 'Semua pernyataan 1, 2, 3, dan 4' },
      ],
      correctOptionId: 'a',
      explanation: 'Transformasionalis menolak determinisme penyeragaman total (3) dan menekankan transformasi negara serta kreativitas adaptif lokal (1, 2, 4).',
    },
    {
      id: 'ch2_m1_q4',
      type: 'multiple_choice',
      topic: 'Dampak Interaksi Budaya Global',
      prompt: 'Mengapa pendekatan Transformasionalis menilai globalisasi budaya tidak semata-mata menghasilkan homogenisasi?',
      options: [
        { id: 'a', label: 'Karena masyarakat lokal menafsirkan ulang, menyaring, dan memadukan unsur global dengan konteks setempat' },
        { id: 'b', label: 'Karena seluruh negara melarang masuknya film dan musik dari luar negeri' },
        { id: 'c', label: 'Karena bahasa dan media digital hanya dipahami oleh generasi tua' },
        { id: 'd', label: 'Karena perdagangan internasional sudah dihentikan sejak abad ke-20' },
      ],
      correctOptionId: 'a',
      explanation: 'Dalam kenyataan sosial, unsur budaya global mengalami resepsi aktif dan hibridisasi di tangan komunitas lokal.',
    },
  ],

  ch2_m2: [
    {
      id: 'ch2_m2_q1',
      type: 'case_study',
      topic: 'Glokalisasi Kuliner & Desain',
      prompt: 'Amati kasus bisnis berikut dan tentukan strategi interaksi global-lokal yang digunakan:',
      contextText: 'Sebuah merek sepatu olahraga internasional merilis edisi khusus bertema motif Parang dan Mega Mendung hasil kolaborasi dengan pembatik Cirebon, lalu memasarkannya ke seluruh dunia.',
      options: [
        { id: 'a', label: 'Glokalisasi — memadukan standar produk global dengan identitas budaya lokal yang khas' },
        { id: 'b', label: 'Neokolonialisme — merampas hak cipta daerah secara paksa tanpa pengakuan' },
        { id: 'c', label: 'Isolasi ekonomi — menutup produk lokal dari konsumen mancanegara' },
        { id: 'd', label: 'Cultural shock — ketidaksiapan konsumen menerima produk tradisional' },
      ],
      correctOptionId: 'a',
      explanation: 'Kolaborasi produk global dengan motif tradisional bernilai budaya lokal merupakan wujud klasik glokalisasi (think globally, act locally).',
    },
    {
      id: 'ch2_m2_q2',
      type: 'cause_effect',
      topic: 'Efek Glokalisasi Bagi Komunitas',
      prompt: 'Pilih pasangan SEBAB dan AKIBAT yang menunjukkan dampak positif glokalisasi:',
      contextText: 'SEBAB: Pelaku ekonomi kreatif daerah memadukan manajemen pemasaran digital modern dengan kearifan lokal (kuliner, tenun, dan seni pertunjukan).',
      options: [
        { id: 'a', label: 'AKIBAT: Daya saing budaya lokal meningkat di pasar global sekaligus memperluas ekonomi masyarakat setempat' },
        { id: 'b', label: 'AKIBAT: Identitas budaya daerah langsung menghilang dan diganti budaya asing sepenuhnya' },
        { id: 'c', label: 'AKIBAT: Konsumen luar negeri tidak diizinkan membeli kerajinan daerah' },
        { id: 'd', label: 'AKIBAT: Teknologi digital tidak lagi dibutuhkan dalam promosi budaya' },
      ],
      correctOptionId: 'a',
      explanation: 'Glokalisasi menjadikan warisan lokal relevan dengan pasar modern dan membuka sumber penghidupan baru bagi komunitas kreatif.',
    },
    {
      id: 'ch2_m2_q3',
      type: 'true_false',
      topic: 'Perbedaan Glokalisasi vs Westernisasi',
      prompt: 'Tentukan kebenaran perbandingan konsep budaya berikut:',
      contextText: '“Glokalisasi berbeda dari westernisasi karena glokalisasi tetap menempatkan budaya lokal sebagai unsur penting yang memberi warna unik pada produk atau gagasan global.”',
      options: [
        { id: 'true', label: 'Benar — Glokalisasi menjaga keunikan lokal di dalam jaringan global' },
        { id: 'false', label: 'Salah — Glokalisasi berarti meniru gaya hidup Barat secara mutlak' },
      ],
      correctOptionId: 'true',
      explanation: 'Westernisasi cenderung meniru mentah-mentah gaya hidup Barat sambil meremehkan budaya sendiri, sedangkan glokalisasi mengawinkan standar global dengan jati diri lokal.',
    },
    {
      id: 'ch2_m2_q4',
      type: 'concept_matching',
      topic: 'Spektrum Interaksi Lokal-Global',
      prompt: 'Pasangkan contoh nyata interaksi budaya berikut dengan istilah yang sesuai:',
      pairs: [
        { id: 'p1', term: 'Kafe internasional menjual kopi tubruk gula aren', match: 'Glokalisasi' },
        { id: 'p2', term: 'Arsitektur masjid beratap tumpang seperti pendopo Jawa', match: 'Akulturasi' },
        { id: 'p3', term: 'Menganggap bahasa daerah memalukan dibanding bahasa asing', match: 'Westernisasi' },
      ],
      explanation:
        'Glokalisasi memadukan produk global dengan selera lokal (kopi gula aren), akulturasi menyatukan dua tradisi tanpa menghapus ciri asli (atap pendopo pada masjid), sedangkan westernisasi meniru budaya Barat secara tidak kritis hingga meremehkan bahasa daerah.',
    },
  ],

  ch3_m1: [
    {
      id: 'ch3_m1_q1',
      type: 'process_sequence',
      topic: 'Evolusi Media Komunikasi Global',
      prompt: 'Urutkan perkembangan teknologi komunikasi global berikut dari era awal hingga komunikasi digital interaktif:',
      steps: [
        { id: 's1', label: 'Kurir Pos & Telegram Kabel Bawah Laut Awal', order: 1 },
        { id: 's2', label: 'Siaran Radio & Televisi Satelit Satu Arah', order: 2 },
        { id: 's3', label: 'Jaringan Internet Kabel Serat Optik & Surel', order: 3 },
        { id: 's4', label: 'Media Sosial Real-Time & Telekonferensi AI Lintas Bahasa', order: 4 },
      ],
      explanation: 'Evolusi media komunikasi bertransformasi dari transmisi teks terbatas, siaran massa satu arah, internet serat optik, menuju interaksi real-time multi-arah.',
    },
    {
      id: 'ch3_m1_q2',
      type: 'cause_effect',
      topic: 'Globalisasi Komunikasi',
      prompt: 'Analisis hubungan SEBAB dan AKIBAT dalam jaringan komunikasi dunia berikut:',
      contextText: 'SEBAB: Pembangunan infrastruktur kabel serat optik bawah laut, jaringan 5G, dan konstelasi satelit orbit rendah.',
      options: [
        { id: 'a', label: 'AKIBAT: Pertukaran informasi, berita, dan kolaborasi kerja jarak jauh lintas benua terjadi dalam hitungan milidetik' },
        { id: 'b', label: 'AKIBAT: Surat pos fisik menjadi satu-satunya media pengiriman informasi antarnegara' },
        { id: 'c', label: 'AKIBAT: Komunikasi antarwilayah hanya dapat dilakukan oleh lembaga pemerintah pusat' },
        { id: 'd', label: 'AKIBAT: Latensi jaringan bertambah lama sehingga berita dunia terlambat beberapa bulan' },
      ],
      correctOptionId: 'a',
      explanation: 'Serat optik dan satelit memangkas latensi informasi sehingga kerja jarak jauh (remote work) dan arus berita global berlangsung seketika.',
    },
    {
      id: 'ch3_m1_q3',
      type: 'multiple_choice',
      topic: 'Dampak Komunikasi Digital',
      prompt: 'Manakah tantangan sosial paling nyata akibat arus informasi media digital yang berlangsung terlalu cepat tanpa literasi memadai?',
      options: [
        { id: 'a', label: 'Cepatnya penyebaran disinformasi (hoaks), polarisasi opini, dan gelembung informasi (echo chamber)' },
        { id: 'b', label: 'Penurunan total jumlah pengguna telepon pintar di seluruh dunia' },
        { id: 'c', label: 'Hilangnya seluruh akses terhadap ilmu pengetahuan terbuka' },
        { id: 'd', label: 'Berhentinya seluruh aktivitas perdagangan elektronik lintas batas' },
      ],
      correctOptionId: 'a',
      explanation: 'Kecepatan penyebaran berita tanpa verifikasi memicu hoaks dan polarisasi sosial, menuntut literasi digital yang kuat.',
    },
    {
      id: 'ch3_m1_q4',
      type: 'statement_analysis',
      topic: 'Interaksi Sosial Era Digital',
      prompt: 'Tentukan pernyataan yang TEPAT mengenai perubahan interaksi sosial akibat globalisasi komunikasi:',
      statements: [
        '1. Interaksi primer tetap penting, sementara interaksi sekunder virtual meluas secara global',
        '2. Solidaritas sosial dapat terbentuk lintas negara melalui kampanye digital kemanusiaan & lingkungan',
        '3. Penggunaan gawai selalu menjamin hilangnya kesenjangan akses internet antarwilayah',
        '4. Muncul profesi digital baru seperti kreator konten lintas budaya dan analis data jarak jauh',
      ],
      options: [
        { id: 'a', label: 'Pernyataan 1, 2, dan 4' },
        { id: 'b', label: 'Pernyataan 1 dan 3 saja' },
        { id: 'c', label: 'Pernyataan 2 dan 3 saja' },
        { id: 'd', label: 'Pernyataan 3 dan 4 saja' },
      ],
      correctOptionId: 'a',
      explanation: 'Teknologi memperluas interaksi virtual (1), solidaritas digital (2), dan kerja digital (4), namun kesenjangan digital (digital divide) masih ada (sehingga 3 salah).',
    },
  ],

  ch3_m2: [
    {
      id: 'ch3_m2_q1',
      type: 'concept_matching',
      topic: 'Inovasi IPTEK & Dampaknya',
      prompt: 'Pasangkan terobosan IPTEK global berikut dengan fungsi utamanya dalam interaksi masyarakat dunia:',
      pairs: [
        { id: 'p1', term: 'Penerjemah Neural AI Real-Time', match: 'Mengatasi hambatan bahasa dalam kolaborasi lintas negara' },
        { id: 'p2', term: 'Platform Pembelajaran Terbuka (MOOC)', match: 'Memperluas akses kuliah dan riset internasional bagi siswa di daerah' },
        { id: 'p3', term: 'Telemedisin & Robotika Medis', match: 'Memungkinkan konsultasi dokter spesialis dan layanan kesehatan jarak jauh' },
      ],
      explanation: 'Globalisasi IPTEK mempermudah transfer pengetahuan lintas batas di bidang pendidikan, bahasa, dan kesehatan.',
    },
    {
      id: 'ch3_m2_q2',
      type: 'true_false',
      topic: 'Kesenjangan Digital (Digital Divide)',
      prompt: 'Evaluasi pernyataan mengenai dampak IPTEK dalam masyarakat global berikut:',
      contextText: '“Meskipun IPTEK berkembang pesat, ketimpangan akses internet cepat dan perangkat komputasi antara kota besar dan wilayah terpencil masih menciptakan kesenjangan digital (digital divide).”',
      options: [
        { id: 'true', label: 'Benar — Tidak semua lapisan masyarakat memiliki akses teknologi dan infrastruktur yang setara' },
        { id: 'false', label: 'Salah — Sejak internet ditemukan, seluruh desa dan kota memiliki kecepatan akses yang sama persis' },
      ],
      correctOptionId: 'true',
      explanation: 'Digital divide merupakan tantangan sosiologis nyata yang memperlebar jarak peluang pendidikan dan ekonomi antara wilayah terjangkau infrastruktur dan wilayah tertinggal.',
    },
    {
      id: 'ch3_m2_q3',
      type: 'case_study',
      topic: 'Kolaborasi Riset & Etika IPTEK',
      prompt: 'Baca kasus berikut dan tentukan analisis sosiologis yang paling tepat:',
      contextText: 'Tim siswa SMA dari Indonesia, Jepang, dan Kenya berkolaborasi membangun sensor kualitas udara berbasis open-source IoT menggunakan data satelit publik untuk dipublikasikan bersama.',
      options: [
        { id: 'a', label: 'Globalisasi IPTEK mempercepat demokratisasi sains dan kolaborasi pemecahan masalah lingkungan global' },
        { id: 'b', label: 'Westernisasi yang menghapus kemampuan meneliti pelajar Indonesia' },
        { id: 'c', label: 'Isolasi ilmu pengetahuan yang hanya boleh diakses oleh negara kaya' },
        { id: 'd', label: 'Bukti bahwa sensor fisik tidak membutuhkan dukungan teknologi komunikasi' },
      ],
      correctOptionId: 'a',
      explanation: 'Teknologi terbuka (open-source) dan jejaring digital memungkinkan generasi muda lintas benua berkolaborasi memecahkan isu bersama.',
    },
    {
      id: 'ch3_m2_q4',
      type: 'cause_effect',
      topic: 'Otomatisasi & Perubahan Struktur Kerja',
      prompt: 'Pilih pasangan SEBAB dan AKIBAT sosiologis dari masuknya otomasi dan kecerdasan buatan (AI):',
      contextText: 'SEBAB: Adopsi kecerdasan buatan (AI) dan robotika industri di berbagai sektor produksi serta layanan.',
      options: [
        { id: 'a', label: 'AKIBAT: Pekerjaan rutin tergantikan otomatisasi sehingga tenaga kerja dituntut meningkatkan literasi digital dan keterampilan kreatif' },
        { id: 'b', label: 'AKIBAT: Kebutuhan pendidikan dan pelatihan keterampilan kerja menjadi tidak lagi diperlukan' },
        { id: 'c', label: 'AKIBAT: Seluruh pabrik dunia kembali menggunakan tenaga hewan dan alat manual' },
        { id: 'd', label: 'AKIBAT: Ketergantungan masyarakat pada jaringan data dan listrik berkurang drastis' },
      ],
      correctOptionId: 'a',
      explanation: 'Disrupsi IPTEK mengubah struktur pekerjaan; peningkatan kapasitas SDM (upskilling) menjadi kunci agar masyarakat tidak tersingkir.',
    },
  ],

  ch4_m1: [
    {
      id: 'ch4_m1_q1',
      type: 'case_study',
      topic: 'Peran Perusahaan Multinasional (MNC)',
      prompt: 'Analisis dampak ekonomi dari situasi berikut:',
      contextText: 'Sebuah perusahaan elektronik multinasional membuka pabrik komponen di Indonesia dengan menyerap ribuan tenaga kerja lokal dan memberi pelatihan teknik, namun sebagian besar keuntungan bersih dan hak paten desain dikirim kembali ke kantor pusat di negara asal.',
      options: [
        { id: 'a', label: 'Menunjukkan sifat ambivalen globalisasi ekonomi: ada serapan kerja & alih keterampilan, tetapi disertai ketergantungan modal & paten asing' },
        { id: 'b', label: 'Membuktikan bahwa investasi asing tidak pernah menciptakan satu pun lapangan pekerjaan' },
        { id: 'c', label: 'Merupakan contoh pure glocalization tanpa campur tangan modal asing' },
        { id: 'd', label: 'Menandakan penghapusan seluruh pasar domestik Indonesia dalam semalam' },
      ],
      correctOptionId: 'a',
      explanation: 'MNC memang membuka lapangan kerja dan transfer teknologi awal, namun negara tuan rumah perlu memperkuat riset & industri lokal agar tidak sekadar menjadi basis perakitan murah.',
    },
    {
      id: 'ch4_m1_q2',
      type: 'statement_analysis',
      topic: 'Peluang & Tantangan Pasar Bebas',
      prompt: 'Pilih kombinasi pernyataan yang BENAR menggambarkan tantangan ekonomi bagi pelaku UMKM di era perdagangan bebas:',
      statements: [
        '1. Membanjirnya produk impor berbiaya murah yang bersaing ketat dengan barang pengrajin lokal',
        '2. Peluang memperluas pasar ekspor langsung ke luar negeri melalui platform marketplace digital',
        '3. Tuntutan memenuhi standar mutu internasional, sertifikasi, dan efisiensi distribusi',
        '4. Jaminan otomatis bahwa seluruh usaha tradisional pasti menang tanpa inovasi produk',
      ],
      options: [
        { id: 'a', label: 'Pernyataan 1, 2, dan 3' },
        { id: 'b', label: 'Pernyataan 1 dan 4 saja' },
        { id: 'c', label: 'Pernyataan 2 dan 4 saja' },
        { id: 'd', label: 'Pernyataan 3 dan 4 saja' },
      ],
      correctOptionId: 'a',
      explanation: 'Globalisasi ekonomi menghadirkan peluang e-commerce (2) sekaligus tekanan persaingan impor (1) dan standar global (3); tidak ada jaminan sukses tanpa inovasi.',
    },
    {
      id: 'ch4_m1_q3',
      type: 'cause_effect',
      topic: 'Interdependensi Finansial Global',
      prompt: 'Tentukan hubungan SEBAB dan AKIBAT dari integrasi pasar modal dan rantai pasok global:',
      contextText: 'SEBAB: Sistem perbankan, nilai tukar, dan rantai pasok manufaktur dunia terhubung erat dalam satu jaringan ekonomi global.',
      options: [
        { id: 'a', label: 'AKIBAT: Krisis ekonomi atau gangguan pasokan di satu negara pusat dapat memicu efek domino kenaikan harga di berbagai negara lain' },
        { id: 'b', label: 'AKIBAT: Harga komoditas dalam negeri selamanya kebal terhadap gejolak ekonomi internasional' },
        { id: 'c', label: 'AKIBAT: Ekspor dan impor antarnegara tidak lagi dipengaruhi nilai tukar mata uang' },
        { id: 'd', label: 'AKIBAT: Seluruh negara memiliki tingkat inflasi dan pendapatan per kapita yang identik' },
      ],
      correctOptionId: 'a',
      explanation: 'Interdependensi ekonomi menciptakan efisiensi ketika stabil, tetapi mempercepat penularan krisis (contagion effect) saat terjadi guncangan.',
    },
    {
      id: 'ch4_m1_q4',
      type: 'multiple_choice',
      topic: 'Strategi Ekonomi Berdaya Saing',
      prompt: 'Kebijakan manakah yang paling tepat untuk memperkuat posisi ekonomi nasional di tengah persaingan pasar global?',
      options: [
        { id: 'a', label: 'Hilirisasi industri bernilai tambah, pendampingan digitalisasi UMKM, dan penguatan kualitas SDM' },
        { id: 'b', label: 'Terus menjual bahan mentah tanpa pengolahan sambil mengimpor seluruh barang konsumsi' },
        { id: 'c', label: 'Menghapus kewajiban standar kualitas agar biaya produksi rendah dengan mutu seadanya' },
        { id: 'd', label: 'Melarang seluruh pelaku UMKM mempelajari pemasaran daring internasional' },
      ],
      correctOptionId: 'a',
      explanation: 'Hilirisasi, peningkatan mutu produk lokal, dan penguatan SDM menggeser posisi ekonomi dari sekadar pemasok bahan mentah menjadi produsen bernilai tinggi.',
    },
  ],

  ch4_m2: [
    {
      id: 'ch4_m2_q1',
      type: 'concept_matching',
      topic: 'Teori Sistem Dunia Immanuel Wallerstein',
      prompt: 'Pasangkan ketiga zona ekonomi dalam Teori Sistem Dunia Wallerstein dengan karakteristiknya:',
      pairs: [
        { id: 'p1', term: 'Negara Core (Pusat)', match: 'Menguasai modal finansial, hak paten teknologi tinggi & industri jasa dominan' },
        { id: 'p2', term: 'Negara Semi-Periphery', match: 'Negara industri baru penengah yang mulai memproduksi barang manufaktur' },
        { id: 'p3', term: 'Negara Periphery (Pinggiran)', match: 'Bergantung pada ekspor bahan mentah murah & tenaga kerja berbiaya rendah' },
      ],
      explanation: 'Wallerstein menjelaskan ketimpangan global berakar dari pembagian kerja internasional yang tidak seimbang antara Core, Semi-Periphery, dan Periphery.',
    },
    {
      id: 'ch4_m2_q2',
      type: 'process_sequence',
      topic: 'Mekanisme Ketimpangan Nilai Tambah Global',
      prompt: 'Urutkan alur pertukaran timpang antara negara Periphery dan negara Core berikut ini:',
      steps: [
        { id: 's1', label: 'Negara Periphery mengekspor komoditas mentah dengan harga dasar rendah', order: 1 },
        { id: 's2', label: 'Negara Core mengolahnya menjadi produk berteknologi dan bermerek mahal', order: 2 },
        { id: 's3', label: 'Produk jadi bernilai tinggi diekspor kembali ke negara Periphery', order: 3 },
        { id: 's4', label: 'Surplus keuntungan dan modal menumpuk lebih besar di negara Core', order: 4 },
      ],
      explanation: 'Selisih nilai tambah antara bahan mentah dan barang berteknologi tinggi menjelaskan mengapa kesenjangan kekayaan global terus melebar tanpa hilirisasi.',
    },
    {
      id: 'ch4_m2_q3',
      type: 'case_study',
      topic: 'Ketergantungan & Neokolonialisme Ekonomi',
      prompt: 'Identifikasi masalah ketimpangan global dari studi kasus berikut:',
      contextText: 'Sebuah negara berkembang memiliki cadangan nikel dan lithium melimpah, tetapi hampir seluruh lisensi teknologi baterai, paten perangkat lunak kendaraan listrik, dan kendali harganya dipegang korporasi negara maju.',
      options: [
        { id: 'a', label: 'Risiko neokolonialisme ekonomi akibat ketimpangan penguasaan paten dan nilai tambah teknologi' },
        { id: 'b', label: 'Bukti bahwa negara pinggiran mengendalikan penuh sistem keuangan negara Core' },
        { id: 'c', label: 'Fenomena akulturasi budaya tradisional di sektor seni musik' },
        { id: 'd', label: 'Keberhasilan pemerataan pendapatan absolut di seluruh negara' },
      ],
      correctOptionId: 'a',
      explanation: 'Ketergantungan pada utang, modal, dan lisensi teknologi asing merupakan bentuk dominasi ekonomi modern yang kerap disebut neokolonialisme.',
    },
    {
      id: 'ch4_m2_q4',
      type: 'true_false',
      topic: 'Evaluasi Kritis Ketimpangan Global',
      prompt: 'Tentukan benar atau salahnya kesimpulan sosiologis tentang ketimpangan global berikut:',
      contextText: '“Globalisasi otomatis membuat seluruh negara berkembang langsung sejajar kekayaannya dengan negara maju dalam waktu singkat tanpa kebijakan hilirisasi maupun pendidikan.”',
      options: [
        { id: 'true', label: 'Benar — Keterbukaan pasar langsung menyamakan kekayaan semua negara' },
        { id: 'false', label: 'Salah — Tanpa inovasi teknologi, SDM, dan kebijakan adil, ketimpangan justru dapat melebar' },
      ],
      correctOptionId: 'false',
      explanation: 'Fakta sosiologis menunjukkan globalisasi dapat memperlebar ketimpangan bila negara berkembang hanya mengandalkan bahan mentah dan tidak membangun kapasitas IPTEK.',
    },
  ],

  ch5_m1: [
    {
      id: 'ch5_m1_q1',
      type: 'statement_analysis',
      topic: 'Ancaman Identitas Budaya di Era Global',
      prompt: 'Perhatikan gejala-gejala sosial budaya berikut, lalu pilih kelompok yang merupakan DAMPAK NEGATIF terhadap identitas budaya nasional:',
      statements: [
        '1. Generasi muda merasa malu mempelajari bahasa daerah & seni tradisional karena dianggap kuno',
        '2. Peniruan gaya hidup konsumtif luar negeri secara mentah tanpa menyesuaikan nilai masyarakat',
        '3. Pelajar mempromosikan batik dan tari daerah melalui konten kreatif lintas bahasa',
        '4. Hilangnya nilai gotong royong tergantikan sikap individualistis berlebihan',
      ],
      options: [
        { id: 'a', label: 'Pernyataan 1, 2, dan 4' },
        { id: 'b', label: 'Pernyataan 1, 2, dan 3' },
        { id: 'c', label: 'Pernyataan 2 dan 3 saja' },
        { id: 'd', label: 'Pernyataan 3 dan 4 saja' },
      ],
      correctOptionId: 'a',
      explanation: 'Pernyataan 1 dan 2 menunjukkan westernisasi dan erosi kebanggaan lokal, sedangkan 4 menunjukkan pemudaran solidaritas. Pernyataan 3 justru merupakan pelestarian adaptif.',
    },
    {
      id: 'ch5_m1_q2',
      type: 'concept_matching',
      topic: 'Konsep Kritis Budaya Global',
      prompt: 'Cocokkan istilah krisis budaya berikut dengan pengertiannya yang akurat:',
      pairs: [
        { id: 'p1', term: 'Cultural Lag', match: 'Ketimpangan saat teknologi maju cepat tetapi norma & etika masyarakat tertinggal' },
        { id: 'p2', term: 'Cultural Shock', match: 'Guncangan psikologis-sosial saat berhadapan mendadak dengan budaya baru yang sangat berbeda' },
        { id: 'p3', term: 'Westernisasi', match: 'Meniru gaya hidup dan nilai Barat secara tidak kritis serta meremehkan budaya sendiri' },
      ],
      explanation: 'William Ogburn merumuskan Cultural Lag (ketertinggalan budaya nonmateriil dari budaya materiil), berbeda dari Cultural Shock maupun Westernisasi.',
    },
    {
      id: 'ch5_m1_q3',
      type: 'case_study',
      topic: 'Diagnosis Fenomena Cultural Lag',
      prompt: 'Diagnosis gejala sosial di lingkungan pelajar SMA berikut ini:',
      contextText: 'Platform kecerdasan buatan generatif dan media sosial berfitur siaran langsung telah digunakan oleh 95% siswa, namun masih sering dipakai untuk menyebar data pribadi teman tanpa izin dan plagiarisme tugas karena aturan etika digital sekolah belum dipahami.',
      options: [
        { id: 'a', label: 'Cultural lag — budaya materiil (teknologi digital) melaju lebih cepat daripada budaya nonmateriil (norma & etika)' },
        { id: 'b', label: 'Glokalisasi ekonomi dalam pemasaran kerajinan tradisional' },
        { id: 'c', label: 'Akulturasi harmonis antara budaya lokal dan teknologi asing' },
        { id: 'd', label: 'Mobilitas geografis antarprovinsi yang menurunkan angka urbanisasi' },
      ],
      correctOptionId: 'a',
      explanation: 'Ketika perangkat teknologi sudah dikuasai secara fisik tetapi kesadaran etika, aturan hukum, dan norma digital tertinggal, itulah cultural lag.',
    },
    {
      id: 'ch5_m1_q4',
      type: 'cause_effect',
      topic: 'Penguatan Ketahanan Identitas Budaya',
      prompt: 'Tentukan SEBAB dan AKIBAT paling tepat untuk menjaga jati diri bangsa di tengah arus budaya global:',
      contextText: 'SEBAB: Pengintegrasian pendidikan kearifan lokal, literasi budaya kritis, serta dukungan ekosistem kreator muda Nusantara.',
      options: [
        { id: 'a', label: 'AKIBAT: Identitas budaya nasional tetap kokoh, relevan bagi generasi muda, dan mampu bersanding setara dengan budaya global' },
        { id: 'b', label: 'AKIBAT: Generasi muda kehilangan seluruh kemampuan berbahasa asing dan ilmu sains modern' },
        { id: 'c', label: 'AKIBAT: Masyarakat tertutup total dari kerja sama internasional' },
        { id: 'd', label: 'AKIBAT: Kesenian tradisional hanya boleh dipelajari di museum tertutup' },
      ],
      correctOptionId: 'a',
      explanation: 'Pelestarian budaya yang hidup dan kreatif menjaga akar identitas sekaligus terbuka berinteraksi sehat di dunia global.',
    },
  ],

  ch5_m2: [
    {
      id: 'ch5_m2_q1',
      type: 'true_false',
      topic: 'Perspektif Skeptis (RATU LARAS)',
      prompt: 'Evaluasi pernyataan mengenai sikap kaum Skeptis terhadap globalisasi berikut ini:',
      contextText: '“Sikap kritis Skeptis bukan berarti anti-kemajuan dan menolak seluruh teknologi, melainkan menuntut keadilan ekonomi serta penyaringan pengaruh asing agar sesuai jati diri bangsa.”',
      options: [
        { id: 'true', label: 'Benar — Skeptis menuntut analisis kritis atas ketimpangan dan dampak sosial globalisasi' },
        { id: 'false', label: 'Salah — Skeptis mewajibkan pemutusan total hubungan diplomatik dengan semua negara' },
      ],
      correctOptionId: 'true',
      explanation: 'Perspektif Skeptis mengajak warga dunia tidak menerima mitos globalisasi secara polos, melainkan aktif menuntut keadilan dan kedaulatan.',
    },
    {
      id: 'ch5_m2_q2',
      type: 'cause_effect',
      topic: 'Kebijakan Kritis Keseimbangan Global',
      prompt: 'Pilih pasangan SEBAB dan AKIBAT yang mencerminkan sikap selektif dalam menghadapi globalisasi:',
      contextText: 'SEBAB: Masyarakat dan pemerintah menerapkan literasi kritis, memilih teknologi produktif untuk riset & pendidikan, serta melindungi produk kreatif dalam negeri dari praktik dumping.',
      options: [
        { id: 'a', label: 'AKIBAT: Manfaat kemajuan IPTEK dan pasar global tetap terserap, sementara ketimpangan sosial serta degradasi budaya dapat ditekan' },
        { id: 'b', label: 'AKIBAT: Seluruh inovasi teknologi modern berhenti masuk dan UMKM kehilangan akses internet' },
        { id: 'c', label: 'AKIBAT: Gaya hidup konsumtif impor meningkat dua kali lipat tanpa kontrol nilai' },
        { id: 'd', label: 'AKIBAT: Negara kehilangan seluruh kedaulatan regulasi ekonomi' },
      ],
      correctOptionId: 'a',
      explanation: 'Sikap selektif mengambil sisi produktif globalisasi (ilmu, kolaborasi, teknologi) sambil memitigasi risiko ketimpangan dan westernisasi.',
    },
    {
      id: 'ch5_m2_q3',
      type: 'statement_analysis',
      topic: 'Sintesis 3 Perspektif Globalisasi',
      prompt: 'Berdasarkan perjalanan dari REX, BIMA, hingga RATU LARAS, tentukan pernyataan sintesis yang BENAR:',
      statements: [
        '1. Hyperglobalist menyoroti kekuatan konektivitas teknologi dan pasar tanpa batas',
        '2. Transformasionalis melihat perubahan dinamis serta peluang akulturasi dan glokalisasi',
        '3. Skeptis mengingatkan pentingnya kewaspadaan atas ketimpangan ekonomi & krisis identitas',
        '4. Hanya satu perspektif saja yang boleh digunakan untuk membaca semua masalah sosial modern',
      ],
      options: [
        { id: 'a', label: 'Pernyataan 1, 2, dan 3' },
        { id: 'b', label: 'Pernyataan 1 dan 4 saja' },
        { id: 'c', label: 'Pernyataan 2 dan 4 saja' },
        { id: 'd', label: 'Pernyataan 3 dan 4 saja' },
      ],
      correctOptionId: 'a',
      explanation: 'Sosiologi memandang ketiga teori (Hyperglobalist, Transformasionalis, Skeptis) sebagai lensa saling melengkapi untuk membaca fenomena global secara utuh.',
    },
    {
      id: 'ch5_m2_q4',
      type: 'process_sequence',
      topic: 'Langkah Berpikir Kritis Menghadapi Arus Global',
      prompt: 'Urutkan tahapan tindakan sosiologis yang paling bijak saat menerima tren atau teknologi global baru di sekolahmu:',
      steps: [
        { id: 's1', label: 'Mengenali tren atau teknologi baru beserta asal-usul informasinya', order: 1 },
        { id: 's2', label: 'Menganalisis dampak positif dan risiko sosial-ekonominya secara kritis', order: 2 },
        { id: 's3', label: 'Menyaring & menyesuaikannya dengan norma etika serta budaya Nusantara', order: 3 },
        { id: 's4', label: 'Memanfaatkannya secara produktif untuk karya dan kemajuan masyarakat', order: 4 },
      ],
      explanation: 'Langkah berurutan—kenali, analisis dampak, saring secara etis/budaya, lalu manfaatkan produktif—merupakan penerapan nyata literasi globalisasi.',
    },
  ],
};

export const CUTSCENES: Record<CutsceneCharacterId, CutsceneScript> = {
  prolog: {
    id: 'prolog',
    title: 'PROLOG — MISI PENYELAMATAN GLOBALUS',
    subtitle: 'Orbit Bumi · Pesawat Ulang-Alik Menuju Stasiun GLOBALUS',
    roomId: 'central_lobby',
    themeColorHex: '#38bdf8',
    lines: [
      {
        speaker: 'NARATOR',
        roleTitle: 'Arsip Sistem GLOBALUS',
        speakerId: 'narrator',
        colorHex: '#38bdf8',
        text: 'Tahun 2035. Di orbit tinggi Bumi, GLOBALUS Space Station berdiri sebagai pusat sinkronisasi jaringan komunikasi, teknologi, ekonomi, dan pertukaran budaya antarbangsa.',
        cameraFocus: 'space',
      },
      {
        speaker: 'NARATOR',
        roleTitle: 'Arsip Sistem GLOBALUS',
        speakerId: 'narrator',
        colorHex: '#38bdf8',
        text: 'Sebagai taruna Sosiologi terpilih, kamu meluncur menuju dek kendali untuk mengkalibrasi ulang lima sektor utama stasiun dalam lima chapter petualangan.',
        cameraFocus: 'shuttle',
      },
      {
        speaker: 'KAMU (ASTRONAUT)',
        roleTitle: 'Komandan Misi',
        speakerId: 'player',
        colorHex: '#38bdf8',
        text: 'Helm terpasang, oksigen stabil, dan buku saku teori siap dipelajari di meja-meja stasiun. Aku siap memasuki ruang kendali utama GLOBALUS!',
        gesture: 'gearup',
        cameraFocus: 'player',
      },
      {
        speaker: 'SISTEM PERINGATAN',
        roleTitle: 'Global Network Alert',
        speakerId: 'narrator',
        colorHex: '#f43f5e',
        text: 'PERINGATAN! Anomali terdeteksi pada Global Network! Jelajahi setiap sayap stasiun, baca Buku Teori Interaktif di meja riset, dan selesaikan misi dari Chapter 1 hingga Chapter 5!',
        cameraFocus: 'hologram',
      },
      {
        speaker: 'TEMAN KRU',
        roleTitle: 'Rekan Astronaut GLOBALUS',
        speakerId: 'companion',
        colorHex: '#22d3ee',
        text: 'Hah? Hah? Kenapa ini?',
        emotion: 'panic',
        gesture: 'panic',
        cameraFocus: 'companion',
        scenePhase: 'companion_panic',
      },
      {
        speaker: 'TEMAN KRU',
        roleTitle: 'Rekan Astronaut GLOBALUS',
        speakerId: 'companion',
        colorHex: '#22d3ee',
        text: 'Eh, eh, sepertinya aku harus memperbaiki sesuatu di ruangan ini. Kamu perbaiki yang lainnya dulu, ya!',
        emotion: 'panic',
        gesture: 'point',
        cameraFocus: 'companion',
        scenePhase: 'companion_panic',
      },
      {
        speaker: 'KAMU (ASTRONAUT)',
        roleTitle: 'Komandan Misi',
        speakerId: 'player',
        colorHex: '#38bdf8',
        text: 'Hah? Hah? Mau ke mana kamu?',
        emotion: 'curious',
        gesture: 'tilt_curious',
        cameraFocus: 'player',
        scenePhase: 'companion_leave',
      },
      {
        speaker: 'TEMAN KRU',
        roleTitle: 'Rekan Astronaut GLOBALUS',
        speakerId: 'companion',
        colorHex: '#22d3ee',
        text: 'Bentarrr!',
        emotion: 'panic',
        gesture: 'panic',
        cameraFocus: 'companion',
        scenePhase: 'companion_leave',
      },
      {
        speaker: 'KAMU (ASTRONAUT)',
        roleTitle: 'Komandan Misi',
        speakerId: 'player',
        colorHex: '#38bdf8',
        text: 'Eh, cahaya apa itu? Sepertinya menarik. Coba aku ikuti, deh!',
        emotion: 'curious',
        gesture: 'scratch_head',
        cameraFocus: 'sparkle_spot',
        scenePhase: 'sparkle_spot',
      },
      {
        speaker: 'NARATOR',
        roleTitle: 'Penjelajahan Stasiun',
        speakerId: 'narrator',
        colorHex: '#fde047',
        text: 'Kamu melangkah menyusuri koridor Sayap Barat mengikuti cahaya sparkle itu hingga memasuki Navigation Room. Cahaya tersebut berhenti di atas sebuah buku di meja riset, lalu perlahan meredup.',
        emotion: 'curious',
        cameraFocus: 'sparkle_follow',
        scenePhase: 'sparkle_follow',
      },
      {
        speaker: 'KAMU (ASTRONAUT)',
        roleTitle: 'Komandan Misi',
        speakerId: 'player',
        colorHex: '#38bdf8',
        text: 'Buku apa ini, ya? Isinya tentang apa, sih? Apa aku buka saja?',
        emotion: 'curious',
        gesture: 'tilt_curious',
        cameraFocus: 'sparkle_book',
        scenePhase: 'sparkle_book',
      },
    ],
  },
  rex: {
    id: 'rex',
    chapter: 1,
    title: 'CHAPTER 1 SELESAI — BERTEMU REX',
    subtitle: 'The Hyperglobalist — Navigation Chamber',
    roomId: 'navigation_room',
    themeColorHex: '#0ea5e9',
    lines: [
      {
        speaker: 'REX',
        roleTitle: 'The Hyperglobalist',
        speakerId: 'rex',
        colorHex: '#0ea5e9',
        text: 'Selamat! Kamu baru saja menyalakan kembali fondasi navigasi dan memahami bagaimana konsep globalisasi menghubungkan manusia melampaui batas geografis.',
        emotion: 'confident',
        gesture: 'explain',
        cameraFocus: 'npc',
      },
      {
        speaker: 'KAMU (ASTRONAUT)',
        roleTitle: 'Penjelajah Stasiun',
        speakerId: 'player',
        colorHex: '#38bdf8',
        text: 'Ya, REX! Penyusutan ruang dan waktu membuat informasi dan ekonomi lintas negara terasa menyatu—seperti teori Hiperglobalis tentang dunia tanpa batas.',
        emotion: 'curious',
        gesture: 'point',
        cameraFocus: 'player',
      },
      {
        speaker: 'REX',
        roleTitle: 'The Hyperglobalist',
        speakerId: 'rex',
        colorHex: '#0ea5e9',
        text: 'Benar! Bagi kami kaum Hiperglobalis, teknologi dan jaringan pasar global melahirkan satu masyarakat dunia yang terhubung erat.',
        emotion: 'inspiring',
        gesture: 'explain',
        cameraFocus: 'hologram',
      },
      {
        speaker: 'REX',
        roleTitle: 'The Hyperglobalist',
        speakerId: 'rex',
        colorHex: '#0ea5e9',
        text: 'Namun, apakah terhubung berarti semua budaya langsung seragam? Pergilah ke Sayap Timur dan temui BIMA untuk melihat bagaimana budaya bertransformasi!',
        emotion: 'thoughtful',
        gesture: 'point',
        cameraFocus: 'wide',
      },
    ],
  },
  bima: {
    id: 'bima',
    chapter: 2,
    title: 'CHAPTER 2 SELESAI — BERTEMU BIMA',
    subtitle: 'The Transformationalist — Global Exchange Chamber',
    roomId: 'global_exchange_room',
    themeColorHex: '#10b981',
    lines: [
      {
        speaker: 'BIMA',
        roleTitle: 'The Transformationalist',
        speakerId: 'bima',
        colorHex: '#10b981',
        text: 'Luar biasa! Kamu berhasil memulihkan Sayap Timur dan memahami bahwa pertemuan budaya global dengan tradisi lokal tidak otomatis memusnahkan jati diri daerah.',
        emotion: 'inspiring',
        gesture: 'nod',
        cameraFocus: 'npc',
      },
      {
        speaker: 'KAMU (ASTRONAUT)',
        roleTitle: 'Penjelajah Stasiun',
        speakerId: 'player',
        colorHex: '#38bdf8',
        text: 'Betul, BIMA! Lewat akulturasi dan glokalisasi, unsur global justru bisa berpadu kreatif dengan kekayaan budaya Nusantara tanpa menghapus ciri aslinya.',
        emotion: 'confident',
        gesture: 'explain',
        cameraFocus: 'player',
      },
      {
        speaker: 'BIMA',
        roleTitle: 'The Transformationalist',
        speakerId: 'bima',
        colorHex: '#10b981',
        text: 'Itulah inti perspektif Transformasionalis: globalisasi adalah proses perubahan sosial yang dinamis, dua arah, dan hasilnya berbeda di tiap masyarakat.',
        emotion: 'thoughtful',
        gesture: 'explain',
        cameraFocus: 'hologram',
      },
      {
        speaker: 'BIMA',
        roleTitle: 'The Transformationalist',
        speakerId: 'bima',
        colorHex: '#10b981',
        text: 'Sekarang kembalilah ke sektor teknis di Sayap Barat! FUZZY sedang membutuhkan bantuanmu memulihkan jaringan komunikasi dan laboratorium IPTEK.',
        emotion: 'confident',
        gesture: 'point',
        cameraFocus: 'wide',
      },
    ],
  },
  fuzzy: {
    id: 'fuzzy',
    chapter: 3,
    title: 'CHAPTER 3 SELESAI — BERTEMU FUZZY',
    subtitle: 'The Signal Weaver — Communication Chamber',
    roomId: 'communication_room',
    themeColorHex: '#ec4899',
    lines: [
      {
        speaker: 'FUZZY',
        roleTitle: 'The Signal Weaver',
        speakerId: 'fuzzy',
        colorHex: '#ec4899',
        text: 'Sinyal satelit kembali jernih 100%! Terima kasih sudah menyinkronkan jaringan serat optik dan laboratorium IPTEK bersama aku!',
        emotion: 'inspiring',
        gesture: 'gearup',
        cameraFocus: 'npc',
      },
      {
        speaker: 'KAMU (ASTRONAUT)',
        roleTitle: 'Penjelajah Stasiun',
        speakerId: 'player',
        colorHex: '#38bdf8',
        text: 'Aku jadi paham, FUZZY: kemajuan komunikasi digital, AI, dan telekomunikasi memang mempercepat kolaborasi ilmiah global, tapi kita juga harus mengatasi kesenjangan digital dan hoaks.',
        emotion: 'thoughtful',
        gesture: 'explain',
        cameraFocus: 'player',
      },
      {
        speaker: 'FUZZY',
        roleTitle: 'The Signal Weaver',
        speakerId: 'fuzzy',
        colorHex: '#ec4899',
        text: 'Tepat sekali! Teknologi hanyalah saluran—literasi digital dan etika penggunanyalah yang menentukan apakah koneksi global menjadi manfaat bagi semua orang.',
        emotion: 'confident',
        gesture: 'nod',
        cameraFocus: 'hologram',
      },
      {
        speaker: 'FUZZY',
        roleTitle: 'The Signal Weaver',
        speakerId: 'fuzzy',
        colorHex: '#ec4899',
        text: 'Selanjutnya, sistem ekonomi global mengalami ketimpangan arus! Temui BOB di Economic Room dan World Economy Room pada Chapter 4.',
        emotion: 'serious',
        gesture: 'point',
        cameraFocus: 'wide',
      },
    ],
  },
  bob: {
    id: 'bob',
    chapter: 4,
    title: 'CHAPTER 4 SELESAI — BERTEMU BOB',
    subtitle: 'The Global Architect — World Economy Chamber',
    roomId: 'world_economy_room',
    themeColorHex: '#f59e0b',
    lines: [
      {
        speaker: 'BOB',
        roleTitle: 'The Global Architect',
        speakerId: 'bob',
        colorHex: '#f59e0b',
        text: 'Kerja solid, Komandan! Piramida Sistem Dunia Wallerstein kini kembali terbaca jelas: kita bisa melihat bagaimana modal dan teknologi terkonsentrasi di negara Core.',
        emotion: 'confident',
        gesture: 'explain',
        cameraFocus: 'npc',
      },
      {
        speaker: 'KAMU (ASTRONAUT)',
        roleTitle: 'Penjelajah Stasiun',
        speakerId: 'player',
        colorHex: '#38bdf8',
        text: 'Benar, BOB. Perdagangan bebas dan perusahaan multinasional membuka peluang lapangan kerja dan ekspor UMKM, tetapi tanpa hilirisasi, negara berkembang rentan terjebak ketergantungan ekonomi.',
        emotion: 'thoughtful',
        gesture: 'ponder',
        cameraFocus: 'player',
      },
      {
        speaker: 'BOB',
        roleTitle: 'The Global Architect',
        speakerId: 'bob',
        colorHex: '#f59e0b',
        text: 'Sebab itulah tantangan terbesar ekonomi global bukan sekadar memperbanyak ekspor mentah, melainkan membangun keadilan nilai tambah dan daya saing SDM!',
        emotion: 'serious',
        gesture: 'explain',
        cameraFocus: 'hologram',
      },
      {
        speaker: 'BOB',
        roleTitle: 'The Global Architect',
        speakerId: 'bob',
        colorHex: '#f59e0b',
        text: 'Pintu ujian terakhir telah terbuka! Lanjutkan ke Chapter 5 bersama RATU LARAS untuk menguji ketahanan identitas budaya dan analisis kritis globalisasi.',
        emotion: 'inspiring',
        gesture: 'point',
        cameraFocus: 'wide',
      },
    ],
  },
  ratu_laras: {
    id: 'ratu_laras',
    chapter: 5,
    title: 'CHAPTER 5 SELESAI — BERTEMU RATU LARAS',
    subtitle: 'The Skeptic — Earth Observation Chamber',
    roomId: 'earth_observation_room',
    themeColorHex: '#f43f5e',
    lines: [
      {
        speaker: 'RATU LARAS',
        roleTitle: 'The Skeptic',
        speakerId: 'ratu_laras',
        colorHex: '#f43f5e',
        text: 'Akhirnya kamu tiba di puncak observasi ini setelah menaklukkan keempat sektor sebelumnya. Tataplah Bumi—menurutmu apakah semua bangsa kini berdiri pada pijakan yang setara?',
        emotion: 'serious',
        gesture: 'point',
        cameraFocus: 'hologram',
      },
      {
        speaker: 'KAMU (ASTRONAUT)',
        roleTitle: 'Penjelajah Stasiun',
        speakerId: 'player',
        colorHex: '#38bdf8',
        text: 'Tidak otomatis setara, Ratu Laras! Di balik kemegahan konektivitas global masih ada ancaman westernisasi, neokolonialisme ekonomi, dan cultural lag ketika norma kita tertinggal dari laju teknologi.',
        emotion: 'thoughtful',
        gesture: 'explain',
        cameraFocus: 'player',
      },
      {
        speaker: 'RATU LARAS',
        roleTitle: 'The Skeptic',
        speakerId: 'ratu_laras',
        colorHex: '#f43f5e',
        text: 'Itulah mengapa perspektif Skeptis hadir sebagai kompas penyeimbang: bukan untuk menutup diri dari dunia, melainkan bersikap kritis dan selektif demi menjaga kedaulatan budaya dan bangsa.',
        emotion: 'inspiring',
        gesture: 'explain',
        cameraFocus: 'npc',
      },
      {
        speaker: 'RATU LARAS',
        roleTitle: 'The Skeptic',
        speakerId: 'ratu_laras',
        colorHex: '#f43f5e',
        text: 'Semua lima modul stasiun kini siap! Dekati Terminal Evaluasi Akhir di depanmu dan buktikan penguasaan Sosiologimu pada Final Quiz!',
        emotion: 'confident',
        gesture: 'point',
        cameraFocus: 'wide',
      },
    ],
  },
  all_final: {
    id: 'all_final',
    title: 'KONVERGENSI GLOBALUS — 5 CHAPTER TUNTAS',
    subtitle: 'Earth Observation Room — Pesan Penutup Lima Tokoh',
    roomId: 'earth_observation_room',
    themeColorHex: '#eab308',
    lines: [
      {
        speaker: 'REX',
        roleTitle: 'The Hyperglobalist',
        speakerId: 'rex',
        colorHex: '#0ea5e9',
        text: 'Dunia semakin menyatu oleh konektivitas cepat, jaringan pasar, dan pertukaran gagasan lintas batas.',
        emotion: 'inspiring',
        gesture: 'explain',
        cameraFocus: 'npc',
      },
      {
        speaker: 'BIMA',
        roleTitle: 'The Transformationalist',
        speakerId: 'bima',
        colorHex: '#10b981',
        text: 'Budaya lokal tidak harus tenggelam; lewat akulturasi dan glokalisasi, kita bertransformasi kreatif tanpa kehilangan jati diri.',
        emotion: 'confident',
        gesture: 'point',
        cameraFocus: 'wide',
      },
      {
        speaker: 'FUZZY & BOB',
        roleTitle: 'Teknologi & Ekonomi Global',
        speakerId: 'fuzzy',
        colorHex: '#ec4899',
        text: 'FUZZY: Kuasai inovasi IPTEK dengan etika digital! BOB: Bangun keadilan ekonomi dan hilirisasi agar kemakmuran tidak hanya dimiliki negara Core!',
        emotion: 'inspiring',
        gesture: 'explain',
        cameraFocus: 'wide',
      },
      {
        speaker: 'RATU LARAS',
        roleTitle: 'The Skeptic',
        speakerId: 'ratu_laras',
        colorHex: '#f43f5e',
        text: 'Dan jaga selalu nalar kritis serta selektivitas budaya agar kemajuan global berjalan seiring dengan keadilan dan kedaulatan bangsa.',
        emotion: 'serious',
        gesture: 'explain',
        cameraFocus: 'npc',
      },
      {
        speaker: 'KAMU (ASTRONAUT)',
        roleTitle: 'Master Sociologist GLOBALUS',
        speakerId: 'player',
        colorHex: '#38bdf8',
        text: 'Seluruh perspektif—Hiperglobalis, Transformasionalis, Teknologi, Ekonomi, hingga Skeptis—membentuk pemahaman utuh untuk hidup bijak di era globalisasi!',
        emotion: 'inspiring',
        gesture: 'nod',
        cameraFocus: 'player',
      },
      {
        speaker: 'TIM GLOBALUS',
        roleTitle: 'Kesimpulan Globalisasi',
        speakerId: 'bima',
        colorHex: '#eab308',
        text: '"GLOBALIZATION IS NOT JUST ABOUT A CONNECTED WORLD, BUT HOW CRITICALLY AND WISELY WE CHOOSE TO LIVE IN IT."',
        emotion: 'inspiring',
        cameraFocus: 'hologram',
      },
    ],
  },
  aulia_collapse: {
    id: 'aulia_collapse',
    chapter: 4,
    title: 'INSIDEN CENTRAL LOBBY — MISI RAHASIA AULIA',
    subtitle: 'Central Lobby — Pertolongan Darurat Rekan Kru',
    roomId: 'central_lobby',
    themeColorHex: '#38bdf8',
    lines: [
      {
        speaker: 'AULIA',
        roleTitle: 'Analis Budaya Stasiun',
        speakerId: 'aulia',
        colorHex: '#60a5fa',
        text: 'Ughhh... kepalaku mendadak berputar dan napasku berat sekali...',
        emotion: 'panic',
        gesture: 'panic',
        cameraFocus: 'aulia_group',
        scenePhase: 'aulia_collapsed',
      },
      {
        speaker: 'DANI',
        roleTitle: 'Teknisi Medis Kru',
        speakerId: 'dani',
        colorHex: '#34d399',
        text: 'Aulia! Tahan sebentar—kamu pingsan! Ayo kita cek kondisi dan denyut nadinya sekarang!',
        emotion: 'panic',
        gesture: 'crouch_check',
        cameraFocus: 'aulia_group',
        scenePhase: 'aulia_collapsed',
      },
      {
        speaker: 'SARI',
        roleTitle: 'Kru Observasi',
        speakerId: 'sari',
        colorHex: '#f472b6',
        text: 'Ya ampun, kondisi Aulia lemah sekali! Di mana kotak bio-stabilizer darurat yang biasa dia simpan?',
        emotion: 'panic',
        gesture: 'shock_cover',
        cameraFocus: 'aulia_group',
        scenePhase: 'aulia_collapsed',
      },
      {
        speaker: 'RAKA',
        roleTitle: 'Navigasi Sektor',
        speakerId: 'raka',
        colorHex: '#fbbf24',
        text: 'Tenang semua, jaga ruang napasnya tetap lega! Terakhir Aulia sempat menyimpannya di Sayap Timur.',
        emotion: 'serious',
        gesture: 'point',
        cameraFocus: 'aulia_group',
        scenePhase: 'aulia_collapsed',
      },
      {
        speaker: 'KAMU (ASTRONAUT)',
        roleTitle: 'Komandan Misi',
        speakerId: 'player',
        colorHex: '#38bdf8',
        text: 'Eh, cahaya keemasan apa itu di dekat koridor Sayap Timur?! Kilaunya seperti memanggil ke arah Cultural Room!',
        emotion: 'curious',
        gesture: 'tilt_curious',
        cameraFocus: 'sparkle_spot',
        scenePhase: 'aulia_sparkle_spot',
      },
      {
        speaker: 'NARATOR',
        roleTitle: 'Petunjuk Stasiun',
        speakerId: 'narrator',
        colorHex: '#fde047',
        text: 'Cahaya sparkle berputar cepat meluncur melewati koridor timur dan masuk menuju Cultural Room...',
        emotion: 'curious',
        cameraFocus: 'sparkle_follow',
        scenePhase: 'aulia_sparkle_follow',
      },
      {
        speaker: 'NARATOR',
        roleTitle: 'Cultural Room',
        speakerId: 'narrator',
        colorHex: '#fde047',
        text: 'Cahaya berhenti tepat di atas lemari tinggi di sudut Cultural Room. Di ruangan itu juga ada tangga lipat yang dapat dipindahkan untuk memanjat!',
        emotion: 'curious',
        cameraFocus: 'cabinet_top',
        scenePhase: 'aulia_sparkle_cabinet',
      },
      {
        speaker: 'KAMU (ASTRONAUT)',
        roleTitle: 'Komandan Misi',
        speakerId: 'player',
        colorHex: '#38bdf8',
        text: 'Baik! Aku harus bergegas ke Cultural Room, memindahkan tangga ke lemari tinggi itu, memanjat, dan mengambil kotak rahasianya untuk menolong Aulia!',
        emotion: 'confident',
        gesture: 'nod',
        cameraFocus: 'player',
        scenePhase: 'aulia_sparkle_cabinet',
      },
    ],
  },
  aulia_febriyani: {
    id: 'aulia_febriyani',
    chapter: 4,
    title: 'KOTAK RAHASIA DI ATAS LEMARI',
    subtitle: 'Cultural Room — Penemuan Kotak Bersegel',
    roomId: 'cultural_room',
    themeColorHex: '#60a5fa',
    lines: [
      {
        speaker: 'NARATOR',
        roleTitle: 'Cultural Room',
        speakerId: 'narrator',
        colorHex: '#fde047',
        text: 'Dari puncak tangga, kamu meraih kotak perak bersegel yang tersimpan rapi di atas lemari tinggi itu.',
        cameraFocus: 'cabinet_top',
        scenePhase: 'aulia_febriyani_inspect',
      },
      {
        speaker: 'KAMU (ASTRONAUT)',
        roleTitle: 'Komandan Misi',
        speakerId: 'player',
        colorHex: '#38bdf8',
        text: 'Di tutupnya terukir tulisan "Febriyani"... Kotak ini masih terkunci kode pribadi dan tidak bisa dibuka paksa.',
        emotion: 'curious',
        gesture: 'tilt_curious',
        cameraFocus: 'cabinet_top',
        scenePhase: 'aulia_febriyani_inspect',
      },
      {
        speaker: 'KAMU (ASTRONAUT)',
        roleTitle: 'Komandan Misi',
        speakerId: 'player',
        colorHex: '#38bdf8',
        text: 'Aku harus segera membawa kotak "Febriyani" ini kembali kepada Aulia di Central Lobby!',
        emotion: 'confident',
        gesture: 'nod',
        cameraFocus: 'player',
        scenePhase: 'aulia_febriyani_inspect',
      },
    ],
  },
  aulia_open: {
    id: 'aulia_open',
    chapter: 4,
    title: 'KOTAK TERBUKA — HADIAH BATIK SMADA BIRU',
    subtitle: 'Central Lobby — Aulia Kembali Pulih',
    roomId: 'central_lobby',
    themeColorHex: '#2563eb',
    lines: [
      {
        speaker: 'KAMU (ASTRONAUT)',
        roleTitle: 'Komandan Misi',
        speakerId: 'player',
        colorHex: '#38bdf8',
        text: 'Aulia! Ini kotak bertuliskan "Febriyani" yang ditemukan di atas lemari Cultural Room!',
        emotion: 'confident',
        gesture: 'point',
        cameraFocus: 'aulia_group',
        scenePhase: 'aulia_open_box',
      },
      {
        speaker: 'AULIA',
        roleTitle: 'Analis Budaya Stasiun',
        speakerId: 'aulia',
        colorHex: '#60a5fa',
        text: 'Akhirnya ketemu! Itu kotak bio-stabilizer pribadiku—Febriyani adalah nama keluarga yang kujadikan sandi pengunci.',
        emotion: 'inspiring',
        gesture: 'nod',
        cameraFocus: 'aulia_group',
        scenePhase: 'aulia_open_box',
      },
      {
        speaker: 'NARATOR',
        roleTitle: 'Central Lobby',
        speakerId: 'narrator',
        colorHex: '#34d399',
        text: 'Segel kotak "Febriyani" terbuka dengan halus. Aulia menghirup penstabil oksigennya dan segera berdiri pulih berkat kesigapanmu!',
        cameraFocus: 'aulia_group',
        scenePhase: 'aulia_open_box',
      },
      {
        speaker: 'AULIA',
        roleTitle: 'Analis Budaya Stasiun',
        speakerId: 'aulia',
        colorHex: '#60a5fa',
        text: 'Terima kasih banyak sudah sigap mencarinya! Sebagai tanda terima kasih, terimalah seragam spesial Batik SMADA Biru ini untukmu!',
        emotion: 'inspiring',
        gesture: 'explain',
        cameraFocus: 'aulia_group',
        scenePhase: 'aulia_open_box',
      },
    ],
  },
};

export const IMPOSTOR_CHALLENGES: ImpostorChallenge[] = [
  {
    id: 'imp_1',
    roomId: 'communication_room',
    title: 'Dekripsi Sinyal Rahasia: Komunikasi Global',
    topic: 'Bentuk Globalisasi Komunikasi',
    scenario:
      'Untuk mengalihkan sistem pemantauan Crewmate di Communication Room, analisis pernyataan berikut: Mengapa satelit orbit dan kabel serat optik bawah laut menjadi fondasi utama globalisasi komunikasi?',
    options: [
      'Keduanya memangkas hambatan jarak dan waktu sehingga pertukaran informasi lintas benua terjadi real-time',
      'Keduanya membatasi akses internet hanya untuk satu negara saja',
      'Keduanya menghapus kebutuhan bahasa manusia sepenuhnya',
      'Keduanya hanya digunakan pada masa Jalur Sutra kuno',
    ],
    correctIndex: 0,
    explanation:
      'Kabel serat optik dan satelit memungkinkan transmisi data lintas benua secara instan, mendorong integrasi informasi global.',
  },
  {
    id: 'imp_2',
    roomId: 'navigation_room',
    title: 'Sabotase Jalur Kronologi Globalisasi',
    topic: 'Proses Terjadinya Globalisasi',
    scenario:
      'Sebelum mengakses kontrol navigasi rahasia, urutkan logika sejarah globalisasi: Peristiwa manakah yang menandai transisi dari dominasi kolonial menuju produksi massal dan transportasi mesin uap?',
    options: [
      'Masa Perdagangan Kuno Jalur Sutra',
      'Revolusi Industri abad ke-18 hingga ke-19',
      'Era Media Sosial dan Komputasi Awan',
      'Era Penjelajahan Antariksa Modern',
    ],
    correctIndex: 1,
    explanation:
      'Revolusi Industri menghadirkan mesin pabrik, kereta api, dan kapal uap yang melipatgandakan kapasitas produksi dan transportasi dunia.',
  },
  {
    id: 'imp_3',
    roomId: 'global_exchange_room',
    title: 'Operasi Bayangan: Glokalisasi vs Westernisasi',
    topic: 'Bentuk Globalisasi Budaya',
    scenario:
      'Untuk menyusup ke protokol pertukaran global, bedakan konsep ini: Manakah yang menggambarkan GLOKALISASI dan bukan Westernisasi?',
    options: [
      'Meninggalkan seluruh musik tradisional karena dianggap ketinggalan zaman',
      'Menganggap budaya Barat selalu lebih unggul daripada budaya lokal',
      'Produk makanan internasional menyesuaikan rasa dan kemasan dengan kearifan budaya lokal Indonesia',
      'Meniru gaya hidup konsumtif negara lain tanpa mempertimbangkan kondisi ekonomi lokal',
    ],
    correctIndex: 2,
    explanation:
      'Glokalisasi menggabungkan standar atau produk global dengan adaptasi budaya lokal tanpa menghapus identitas setempat.',
  },
  {
    id: 'imp_4',
    roomId: 'world_economy_room',
    title: 'Manipulasi Data Sistem Dunia Wallerstein',
    topic: 'Proses & Ketimpangan Globalisasi',
    scenario:
      'Dalam Teori Sistem Dunia Immanuel Wallerstein, negara yang menjadi pusat penguasaan paten teknologi tinggi, perbankan global, dan industri bernilai tambah tinggi dikategorikan sebagai...',
    options: [
      'Negara Periphery',
      'Negara Semi-Periphery',
      'Negara Core',
      'Negara Non-Ekonomi',
    ],
    correctIndex: 2,
    explanation:
      'Negara Core berada di puncak sistem ekonomi dunia karena menguasai modal, riset teknologi tinggi, dan industri strategis.',
  },
];

export const FINAL_QUIZ_QUESTIONS: QuizQuestion[] = [
  // SUBTOPIK 1: PENGERTIAN GLOBALISASI (2 Studi Kasus)
  {
    id: 1,
    category: 'Proses Globalisasi',
    subtopic: '1. Pengertian Globalisasi',
    conceptTag: 'Intensifikasi Relasi Sosial & Sistem Dunia (Giddens & Selo Soemardjan)',
    model: {
      id: 'fq_1',
      type: 'case_study',
      topic: 'Pengertian Globalisasi · Studi Kasus 1',
      subtopic: '1. Pengertian Globalisasi',
      conceptTag: 'Intensifikasi Relasi Sosial & Sistem Dunia (Giddens & Selo Soemardjan)',
      category: 'Proses Globalisasi',
      prompt: 'Analisis dinamika hubungan lokal-global pada kasus industri elektronik berikut:',
      contextText:
        'Gangguan pasokan cip semikonduktor di Taiwan akibat gempa bumi dalam hitungan hari langsung menunda jadwal produksi perakit perangkat pintar di Batam. Pada saat yang sama, seluruh pemasok lokal di Batam juga diwajibkan mengikuti standar audit mutu dan sistem pelaporan digital internasional yang sama agar tetap terhubung dalam rantai industri global.',
      options: [
        {
          id: 'giddens_soemardjan',
          label:
            'Intensifikasi hubungan sosial mendunia (Anthony Giddens) disertai terbentuknya sistem organisasi dan kaidah komunikasi global yang seragam (Selo Soemardjan)',
        },
        {
          id: 'isolasi_nasional',
          label:
            'Kemandirian produksi lokal murni di mana gangguan dari wilayah luar negeri tidak memiliki dampak terhadap standar industri dalam negeri',
        },
        {
          id: 'asimilasi_bahasa',
          label:
            'Peleburan budaya daerah menjadi satu tradisi tunggal sehingga perusahaan lokal melepaskan seluruh identitas hukum negaranya',
        },
        {
          id: 'urbanisasi_regional',
          label:
            'Perpindahan tenaga kerja dari desa ke kota industri dalam satu provinsi yang disebabkan oleh perbedaan upah regional',
        },
      ],
      correctOptionId: 'giddens_soemardjan',
      explanation:
        'Konsep utama yang diuji adalah pengertian globalisasi. Peristiwa di Taiwan memengaruhi operasi lokal di Batam menunjukkan intensifikasi hubungan sosial mendunia (Anthony Giddens), sementara tuntutan mengikuti standar pelaporan digital global mencerminkan terbentuknya sistem organisasi dan kaidah yang sama antarmasyarakat dunia (Selo Soemardjan).',
      wrongExplanation:
        'Kekeliruan konsep sering terjadi dengan menyamakan globalisasi sekadar perpindahan penduduk atau hilangnya identitas hukum negara. Padahal, inti kasus ini adalah keterkaitan peristiwa berjarak jauh dengan aktivitas lokal serta penyamaan sistem organisasi kerja lintas negara.',
    },
  },
  {
    id: 2,
    category: 'Proses Globalisasi',
    subtopic: '1. Pengertian Globalisasi',
    conceptTag: 'Masyarakat Dunia Tunggal & Keterkaitan Lintas Bangsa (Martin Albrow, Cochrane & Pain)',
    model: {
      id: 'fq_2',
      type: 'case_study',
      topic: 'Pengertian Globalisasi · Studi Kasus 2',
      subtopic: '1. Pengertian Globalisasi',
      conceptTag: 'Masyarakat Dunia Tunggal & Keterkaitan Lintas Bangsa (Martin Albrow, Cochrane & Pain)',
      category: 'Proses Globalisasi',
      prompt: 'Tentukan interpretasi sosiologis paling tepat atas kolaborasi komunitas lintas benua berikut:',
      contextText:
        'Komunitas pelajar di Makassar, Nairobi, dan Helsinki serentak meluncurkan gerakan pengurangan sampah plastik pesisir melalui platform kolaborasi daring. Mereka bertukar modul daur ulang, menggalang donasi lintas mata uang untuk proyek restorasi mangrove, dan menyusun petisi lingkungan bersama sebagai warga bumi.',
      options: [
        {
          id: 'albrow_cochrane',
          label:
            'Inkorporasi masyarakat ke dalam satu masyarakat dunia tunggal (Martin Albrow) melalui pertambahan keterkaitan dan ketergantungan lintas batas (Cochrane & Pain)',
        },
        {
          id: 'monopoli_periphery',
          label:
            'Eksploitasi sepihak negara maju terhadap sumber daya alam negara pinggiran melalui penguasaan utang luar negeri dan paten industri',
        },
        {
          id: 'cultural_shock_lokal',
          label:
            'Kegoncangan psikologis masyarakat lokal akibat masuknya norma pergaulan asing yang bertentangan dengan adat setempat secara mendadak',
        },
        {
          id: 'westernisasi_konsumtif',
          label:
            'Peniruan gaya hidup konsumtif negara Barat secara tidak kritis sehingga pelajar meninggalkan kesadaran atas masalah lingkungannya sendiri',
        },
      ],
      correctOptionId: 'albrow_cochrane',
      explanation:
        'Konsep utama yang diuji adalah pengertian globalisasi menurut Martin Albrow serta Cochrane & Pain. Aksi serentak pelajar dari tiga benua menunjukkan terintegrasinya manusia ke dalam satu masyarakat global (Albrow) lewat pertambahan keterkaitan komunikasi, aksi sosial, dan aliran dana lintas bangsa (Cochrane & Pain).',
      wrongExplanation:
        'Kasus ini menggambarkan kerja sama setara lintas benua untuk tujuan ekologis, bukan dominasi ekonomi sepihak, gegar budaya, ataupun peniruan gaya hidup konsumtif.',
    },
  },

  // SUBTOPIK 2: CIRI-CIRI GLOBALISASI (2 Studi Kasus)
  {
    id: 3,
    category: 'Bentuk Globalisasi',
    subtopic: '2. Ciri-Ciri Globalisasi',
    conceptTag: 'Penyusutan Ruang-Waktu (Time-Space Compression) & Ketergantungan Ekonomi',
    model: {
      id: 'fq_3',
      type: 'case_study',
      topic: 'Ciri-Ciri Globalisasi · Studi Kasus 3',
      subtopic: '2. Ciri-Ciri Globalisasi',
      conceptTag: 'Penyusutan Ruang-Waktu (Time-Space Compression) & Ketergantungan Ekonomi',
      category: 'Bentuk Globalisasi',
      prompt: 'Identifikasi pasangan ciri globalisasi yang tampak langsung dalam aktivitas pelaku usaha berikut:',
      contextText:
        'Seorang ilustrator di Yogyakarta mengirimkan revisi buku anak ke penerbit di London melalui penyimpanan awan dan menerima honorarium lintas negara dalam waktu 15 menit. Namun, keesokan harinya usahanya ikut terdampak karena harga kertas cetak lokal melonjak akibat tersendatnya jalur kapal kargo internasional di Terusan Suez.',
      options: [
        {
          id: 'ruang_waktu_ekonomi',
          label:
            'Perubahan konsep ruang dan waktu (penyampaian kerja instan lintas benua) serta meningkatnya ketergantungan ekonomi dalam rantai pasok global',
        },
        {
          id: 'isolasi_kultural',
          label:
            'Pembatasan ketat interaksi kerja jarak jauh dan terputusnya ketergantungan bahan baku antarnegara dalam sistem perdagangan modern',
        },
        {
          id: 'hedonisme_budaya',
          label:
            'Pergeseran orientasi kerja menjadi gaya hidup mengejar kemewahan sesaat tanpa keterkaitan dengan perubahan sistem distribusi barang',
        },
        {
          id: 'hilirisasi_otonom',
          label:
            'Kemandirian penuh industri percetakan lokal yang membuat harga bahan baku dalam negeri kebal terhadap gangguan jalur laut dunia',
        },
      ],
      correctOptionId: 'ruang_waktu_ekonomi',
      explanation:
        'Konsep utama yang diuji adalah ciri-ciri globalisasi: pertama, perubahan konsep ruang dan waktu (time-space compression) terlihat dari transaksi kerja Yogyakarta–London dalam hitungan menit; kedua, ketergantungan ekonomi tampak saat gangguan jalur maritim global langsung mengerek harga bahan baku percetakan lokal.',
      wrongExplanation:
        'Keliru jika melihat kasus ini sebagai keterpisahan ekonomi lokal atau sekadar gaya hidup konsumtif. Bukti paling kuat di teks adalah kecepatan interaksi lintas jarak dan keterikatan harga lokal pada logistik dunia.',
    },
  },
  {
    id: 4,
    category: 'Bentuk Globalisasi',
    subtopic: '2. Ciri-Ciri Globalisasi',
    conceptTag: 'Interaksi Kultural Media Massa & Masalah Bersama Global',
    model: {
      id: 'fq_4',
      type: 'case_study',
      topic: 'Ciri-Ciri Globalisasi · Studi Kasus 4',
      subtopic: '2. Ciri-Ciri Globalisasi',
      conceptTag: 'Interaksi Kultural Media Massa & Masalah Bersama Global',
      category: 'Bentuk Globalisasi',
      prompt: 'Analisis ciri globalisasi apa yang paling menonjol dalam fenomena media dan ekologi berikut:',
      contextText:
        'Sebuah film dokumenter tentang mencairnya gletser dan kebakaran hutan tropis ditayangkan serentak di platform streaming global dan memicu jutaan diskusi lintas bahasa di media sosial. Warganet dari berbagai negara mendesak adanya kesepakatan iklim bersama karena dampak anomali cuaca dan krisis pangan tidak mengenal batas wilayah negara.',
      options: [
        {
          id: 'media_masalah_bersama',
          label:
            'Meningkatnya interaksi kultural melalui media massa dan meningkatnya kesadaran terhadap masalah bersama global (krisis iklim lintas batas)',
        },
        {
          id: 'monokultur_dagang',
          label:
            'Penyeragaman mata uang perdagangan di kawasan regional tanpa melibatkan pertukaran gagasan melalui media massa maupun isu ekologis',
        },
        {
          id: 'sekat_komunikasi',
          label:
            'Melemahnya daya jangkau media informasi digital sehingga masyarakat hanya memedulikan masalah lingkungan di desa masing-masing',
        },
        {
          id: 'asimilasi_paksa',
          label:
            'Penghapusan seluruh bahasa nasional oleh lembaga penyiaran internasional demi menciptakan satu sistem pemerintahan tunggal dunia',
        },
      ],
      correctOptionId: 'media_masalah_bersama',
      explanation:
        'Konsep utama yang diuji adalah ciri globalisasi berupa interaksi kultural lewat media massa (film dokumenter dan media sosial lintas negara) serta munculnya masalah bersama global—yakni krisis iklim dan ketahanan pangan—yang menuntut solusi kolektif antarnegara.',
      wrongExplanation:
        'Diskusi lintas bahasa di platform streaming dan desakan kerja sama iklim tidak berarti penghapusan bahasa atau penyeragaman mata uang, melainkan ciri keterhubungan media dan isu global bersama.',
    },
  },

  // SUBTOPIK 3: BENTUK-BENTUK GLOBALISASI (2 Studi Kasus)
  {
    id: 5,
    category: 'Bentuk Globalisasi',
    subtopic: '3. Bentuk-Bentuk Globalisasi',
    conceptTag: 'Sinergi Globalisasi Budaya, Komunikasi, dan Transportasi',
    model: {
      id: 'fq_5',
      type: 'case_study',
      topic: 'Bentuk-Bentuk Globalisasi · Studi Kasus 5',
      subtopic: '3. Bentuk-Bentuk Globalisasi',
      conceptTag: 'Sinergi Globalisasi Budaya, Komunikasi, dan Transportasi',
      category: 'Bentuk Globalisasi',
      prompt: 'Tentukan kombinasi bentuk globalisasi yang bekerja secara terpadu pada peristiwa seni berikut:',
      contextText:
        'Kelompok musik pelajar asal Banyuwangi memadukan instrumen gamelan dan kendang dengan aransemen musik elektronik, menyiarkan latihan kolaborasi secara langsung kepada penonton di Tokyo melalui konferensi video berdefinisi tinggi, lalu terbang membawa instrumen mereka dengan pesawat kargo langsung menuju festival seni di Osaka dalam tujuh jam.',
      options: [
        {
          id: 'budaya_kom_trans',
          label:
            'Globalisasi budaya (akulturasi musik), globalisasi komunikasi (siaran video real-time), dan globalisasi transportasi (penerbangan kargo cepat)',
        },
        {
          id: 'ekonomi_politik_hukum',
          label:
            'Globalisasi politik antarparlemen, penggabungan bank sentral internasional, dan harmonisasi undang-undang pidana antarbenua',
        },
        {
          id: 'agraris_barter_tradisi',
          label:
            'Ekonomi barter lokal, komunikasi pos tertulis konvensional, serta pengangkutan komoditas tradisional menggunakan jalur darat lokal',
        },
        {
          id: 'westernisasi_eksklusif',
          label:
            'Penghapusan alat musik daerah demi meniru orkestra Barat secara penuh tanpa pemanfaatan media komunikasi maupun transportasi modern',
        },
      ],
      correctOptionId: 'budaya_kom_trans',
      explanation:
        'Konsep utama yang diuji adalah bentuk-bentuk globalisasi: perpaduan gamelan dan musik elektronik merupakan globalisasi budaya, konferensi video real-time merupakan globalisasi komunikasi, dan mobilitas pesawat kargo 7 jam ke Osaka merupakan globalisasi transportasi.',
      wrongExplanation:
        'Perhatikan bukti spesifik pada kasus: instrumen musik menunjukkan ranah budaya, siaran video langsung menunjukkan komunikasi, dan pesawat kargo jarak jauh menunjukkan transportasi—bukan penyatuan hukum atau penghapusan musik tradisi.',
    },
  },
  {
    id: 6,
    category: 'Bentuk Globalisasi',
    subtopic: '3. Bentuk-Bentuk Globalisasi',
    conceptTag: 'Globalisasi Ekonomi (TNC & E-Commerce) dan Globalisasi IPTEK (AI & Otomatisasi)',
    model: {
      id: 'fq_6',
      type: 'case_study',
      topic: 'Bentuk-Bentuk Globalisasi · Studi Kasus 6',
      subtopic: '3. Bentuk-Bentuk Globalisasi',
      conceptTag: 'Globalisasi Ekonomi (TNC & E-Commerce) dan Globalisasi IPTEK (AI & Otomatisasi)',
      category: 'Bentuk Globalisasi',
      prompt: 'Evaluasi bentuk globalisasi beserta tantangan sosiologis utamanya dalam kasus korporasi berikut:',
      contextText:
        'Sebuah perusahaan transnasional (TNC) memperluas jaringan marketplace lintas negaranya di Asia Tenggara dengan menerapkan kecerdasan buatan (AI) untuk memetakan pola belanja pelanggan sekaligus mengoperasikan gudang sortir robotik otomatis. Pekerja gudang tradisional yang belum menguasai pengoperasian perangkat lunak logistik mulai kesulitan bersaing.',
      options: [
        {
          id: 'ekonomi_iptek_upskill',
          label:
            'Perpaduan globalisasi ekonomi (TNC dan e-commerce lintas negara) serta globalisasi IPTEK (AI dan otomatisasi) yang menuntut peningkatan keterampilan SDM',
        },
        {
          id: 'transportasi_klasik',
          label:
            'Globalisasi transportasi pelayaran uap abad ke-19 yang memperlambat distribusi barang sekaligus menambah kebutuhan tenaga angkut manual',
        },
        {
          id: 'cultural_shock_wisata',
          label:
            'Globalisasi pariwisata budaya semata yang terjadi karena wisatawan asing tidak memahami tata krama berpakaian di wilayah setempat',
        },
        {
          id: 'skeptis_autarki',
          label:
            'Bukti keberhasilan kebijakan ekonomi tertutup (autarki) yang memutus peran perusahaan multinasional dan teknologi otomatisasi dari pasar domestik',
        },
      ],
      correctOptionId: 'ekonomi_iptek_upskill',
      explanation:
        'Konsep utama yang diuji adalah globalisasi ekonomi dan IPTEK. Operasi TNC dan e-commerce lintas negara mencerminkan globalisasi ekonomi, sementara AI dan robotika gudang merupakan wujud globalisasi IPTEK yang menggeser struktur kerja menuju keterampilan digital.',
      wrongExplanation:
        'Kasus ini berfokus pada sistem perdagangan lintas batas berbasis perusahaan transnasional dan otomatisasi AI—bukan pariwisata budaya ataupun ekonomi tertutup.',
    },
  },

  // SUBTOPIK 4: TEORI-TEORI GLOBALISASI (2 Studi Kasus)
  {
    id: 7,
    category: 'Proses Globalisasi',
    subtopic: '4. Teori-Teori Globalisasi',
    conceptTag: 'Hiperglobalis vs Skeptis vs Transformasionalis (David Held & Anthony McGrew)',
    model: {
      id: 'fq_7',
      type: 'case_study',
      topic: 'Teori-Teori Globalisasi · Studi Kasus 7',
      subtopic: '4. Teori-Teori Globalisasi',
      conceptTag: 'Hiperglobalis vs Skeptis vs Transformasionalis (David Held & Anthony McGrew)',
      category: 'Proses Globalisasi',
      prompt: 'Analisis tiga respons pengamat terhadap masuknya platform transportasi digital global berikut:',
      contextText:
        'Saat platform transportasi daring internasional masuk ke suatu kota, Pengamat 1 menyatakan batas regulasi negara kini kalah oleh kekuatan pasar digital global; Pengamat 2 menilai kekuatan modal tetap terpusat pada segelintir negara maju dan regulasi nasional masih sangat dominan; sementara Pengamat 3 berpendapat pemerintah menata ulang regulasinya dan melahirkan model kemitraan lokal-global yang dinamis.',
      options: [
        {
          id: 'held_mcgrew_triad',
          label:
            'Pengamat 1 berperspektif Hiperglobalis, Pengamat 2 Skeptis, dan Pengamat 3 Transformasionalis (David Held & Anthony McGrew)',
        },
        {
          id: 'semua_hiperglobalis',
          label:
            'Pengamat 1 dan 2 sama-sama mewakili kaum Hiperglobalis, sedangkan Pengamat 3 menolak terjadinya perubahan institusi negara',
        },
        {
          id: 'periphery_core_reverse',
          label:
            'Pengamat 1 berperspektif Skeptis ekstrem, Pengamat 2 Transformasionalis, dan Pengamat 3 menganggap negara sudah lenyap total',
        },
        {
          id: 'wallerstein_only',
          label:
            'Ketiga pengamat tersebut hanya membahas pembagian kelas tenaga kerja feodal sebelum Revolusi Industri di Eropa terjadi',
        },
      ],
      correctOptionId: 'held_mcgrew_triad',
      explanation:
        'Konsep utama yang diuji adalah tiga teori globalisasi (David Held & Anthony McGrew). Hiperglobalis melihat melemahnya batas negara oleh pasar global (Pengamat 1); Skeptis menekankan ketimpangan dan bertahannya peran negara kuat (Pengamat 2); Transformasionalis menekankan restrukturisasi peran negara dan arah perubahan yang dinamis (Pengamat 3).',
      wrongExplanation:
        'Hati-hati membedakan Skeptis dan Transformasionalis: Skeptis meragukan pemerataan globalisasi dan menyoroti dominasi negara besar, sedangkan Transformasionalis melihat globalisasi menata ulang peran negara dan menghasilkan bentuk sosial hibrida baru.',
    },
  },
  {
    id: 8,
    category: 'Proses Globalisasi',
    subtopic: '4. Teori-Teori Globalisasi',
    conceptTag: 'Teori Sistem Dunia Immanuel Wallerstein (Core, Semi-Periphery, Periphery)',
    model: {
      id: 'fq_8',
      type: 'case_study',
      topic: 'Teori-Teori Globalisasi · Studi Kasus 8',
      subtopic: '4. Teori-Teori Globalisasi',
      conceptTag: 'Teori Sistem Dunia Immanuel Wallerstein (Core, Semi-Periphery, Periphery)',
      category: 'Proses Globalisasi',
      prompt: 'Tentukan klasifikasi posisi negara dalam rantai produksi global berikut menurut Immanuel Wallerstein:',
      contextText:
        'Negara P mengekspor bijih nikel dan karet mentah berharga rendah tanpa pabrik pengolahan; Negara Q mengoperasikan kawasan manufaktur perakitan komponen berbiaya menengah serta mulai mengekspor barang jadi ke kawasan sekitar; sedangkan Negara R menguasai paten chip, riset baterai generasi baru, perbankan internasional, dan meraih margin keuntungan terbesar.',
      options: [
        {
          id: 'wallerstein_hierarchy',
          label:
            'Negara P adalah Periphery, Negara Q adalah Semi-Periphery, dan Negara R adalah Core yang menguasai modal serta paten teknologi tinggi',
        },
        {
          id: 'wallerstein_flipped',
          label:
            'Negara P adalah Core karena memiliki bahan tambang mentah, sedangkan Negara R adalah Periphery karena bergantung pada hak paten',
        },
        {
          id: 'wallerstein_flat',
          label:
            'Ketiga negara menempati posisi Core yang setara karena seluruh transaksi ekspor-impor otomatis membagi keuntungan sama rata',
        },
        {
          id: 'wallerstein_semi_all',
          label:
            'Negara P dan Negara R sama-sama berstatus Semi-Periphery yang terisolasi dari rantai pasok sistem kapitalis dunia modern',
        },
      ],
      correctOptionId: 'wallerstein_hierarchy',
      explanation:
        'Konsep utama yang diuji adalah Teori Sistem Dunia Immanuel Wallerstein. Negara Periphery (P) memasok bahan mentah murah, Negara Semi-Periphery (Q) berperan sebagai penengah manufaktur/perakitan, dan Negara Core (R) menguasai riset, paten, serta modal sehingga mengakumulasi nilai tambah terbesar.',
      wrongExplanation:
        'Memiliki kekayaan sumber daya alam mentah saja tidak menjadikan suatu negara berstatus Core; dalam teori Wallerstein, status Core ditentukan oleh penguasaan modal, teknologi tinggi, dan nilai tambah industri.',
    },
  },

  // SUBTOPIK 5: PROSES TERJADINYA GLOBALISASI (2 Studi Kasus)
  {
    id: 9,
    category: 'Proses Globalisasi',
    subtopic: '5. Proses Terjadinya Globalisasi',
    conceptTag: 'Perdagangan Kuno (Jalur Sutra & Rempah) Menuju Kolonialisme & Revolusi Industri',
    model: {
      id: 'fq_9',
      type: 'case_study',
      topic: 'Proses Terjadinya Globalisasi · Studi Kasus 9',
      subtopic: '5. Proses Terjadinya Globalisasi',
      conceptTag: 'Perdagangan Kuno (Jalur Sutra & Rempah) Menuju Kolonialisme & Revolusi Industri',
      category: 'Proses Globalisasi',
      prompt: 'Analisis pergeseran tahap historis globalisasi dari temuan arkeologis dan arsip dagang berikut:',
      contextText:
        'Ekskavasi pelabuhan kuno di Nusantara menemukan koin perak Arab, porselen Tiongkok, dan catatan niaga cengkih Maluku dari abad ke-14 yang bertukar secara lintas budaya. Namun pada abad ke-18 hingga ke-19, pola itu bergeser drastis saat jaringan kapal uap, rel kereta, dan pabrik tekstil Eropa memonopoli jalur rempah serta bahan mentah secara terpusat.',
      options: [
        {
          id: 'historis_kuno_industri',
          label:
            'Transisi dari fase perdagangan kuno (Jalur Sutra & Jalur Rempah) menuju ekspansi kolonialisme dan mekanisasi Revolusi Industri',
        },
        {
          id: 'digital_ai_kuno',
          label:
            'Loncatan langsung dari era komputasi awan modern menuju sistem perdagangan barter lokal tanpa teknologi mesin atau pelayaran',
        },
        {
          id: 'pasca_digital_monopoli',
          label:
            'Fase informasi dan digital abad ke-21 yang ditandai oleh pertukaran data serat optik bawah laut tanpa melibatkan jalur rempah maritim',
        },
        {
          id: 'deglobalisasi_total',
          label:
            'Berhentinya seluruh interaksi niaga antarbenua sejak abad ke-15 hingga terciptanya pasar bebas digital pada awal abad ke-21',
        },
      ],
      correctOptionId: 'historis_kuno_industri',
      explanation:
        'Konsep utama yang diuji adalah proses historis terjadinya globalisasi. Interaksi niaga abad ke-14 berakar pada Jalur Sutra dan Jalur Rempah Maritim (perdagangan kuno), lalu bertransformasi melalui kolonialisme dan Revolusi Industri (kapal uap, kereta, pabrik produksi massal) yang mempercepat integrasi sekaligus dominasi pasar global.',
      wrongExplanation:
        'Globalisasi tidak baru lahir saat ada internet; ia berakar dari jaringan niaga Jalur Sutra dan Jalur Rempah, lalu dipercepat oleh kolonialisme dan mesin uap Revolusi Industri.',
    },
  },
  {
    id: 10,
    category: 'Proses Globalisasi',
    subtopic: '5. Proses Terjadinya Globalisasi',
    conceptTag: 'Karakteristik Fase Informasi & Digital Modern dalam Proses Globalisasi',
    model: {
      id: 'fq_10',
      type: 'case_study',
      topic: 'Proses Terjadinya Globalisasi · Studi Kasus 10',
      subtopic: '5. Proses Terjadinya Globalisasi',
      conceptTag: 'Karakteristik Fase Informasi & Digital Modern dalam Proses Globalisasi',
      category: 'Proses Globalisasi',
      prompt: 'Tentukan pembeda utama fase informasi dan digital modern dari era industri sebelumnya pada kasus berikut:',
      contextText:
        'Berbeda dari perusahaan manufaktur abad ke-19 yang harus mengirim jutaan ton barang fisik memakai armada kapal uap dan mendirikan gudang kolonial di banyak pelabuhan, sebuah tim rintisan berisi 25 insinyur di lima negara kini mengelola platform layanan komputasi awan bagi jutaan pengguna dunia dalam hitungan detik melalui kabel serat optik dan satelit.',
      options: [
        {
          id: 'fase_digital_modern',
          label:
            'Pertukaran nilai ekonomi dan informasi berlangsung seketika berbasis jaringan data digital, komputasi awan, dan kolaborasi kerja lintas benua',
        },
        {
          id: 'fase_jalur_sutra',
          label:
            'Ketergantungan mutlak pada karavan darat dan kapal layar musiman agar pesan serta produk dapat berpindah antarpusat perdagangan',
        },
        {
          id: 'fase_ekstraksi_uap',
          label:
            'Dominasi mesin uap batu bara sebagai satu-satunya penggerak konektivitas ekonomi dan komunikasi antarpulau di tingkat dunia',
        },
        {
          id: 'fase_isolasi_informasi',
          label:
            'Melemahnya akses pengetahuan lintas negara karena pekerja perangkat lunak hanya boleh berkolaborasi di satu ruang kantor fisik',
        },
      ],
      correctOptionId: 'fase_digital_modern',
      explanation:
        'Konsep utama yang diuji adalah fase informasi dan digital modern dalam proses globalisasi. Berbeda dengan fase Revolusi Industri yang bertumpu pada mesin mekanik dan barang fisik, fase digital bertumpu pada arus data instan, infrastruktur internet/satelit, serta organisasi kerja virtual lintas batas.',
      wrongExplanation:
        'Perubahan utama fase modern bukan kembali ke pelayaran musiman atau mesin batu bara, melainkan perpindahan pusat konektivitas ke infrastruktur informasi digital real-time.',
    },
  },

  // SUBTOPIK 6: CONTOH NYATA & DAMPAK GLOBALISASI (2 Studi Kasus)
  {
    id: 11,
    category: 'Bentuk Globalisasi',
    subtopic: '6. Contoh Nyata & Dampak Globalisasi',
    conceptTag: 'Glokalisasi & Efisiensi IPTEK vs Culture Shock & Cultural Lag',
    model: {
      id: 'fq_11',
      type: 'case_study',
      topic: 'Contoh & Dampak Globalisasi · Studi Kasus 11',
      subtopic: '6. Contoh Nyata & Dampak Globalisasi',
      conceptTag: 'Glokalisasi & Efisiensi IPTEK vs Culture Shock & Cultural Lag',
      category: 'Bentuk Globalisasi',
      prompt: 'Pilah dampak positif dan negatif globalisasi yang muncul bersamaan di desa wisata berikut:',
      contextText:
        'Perajin tenun di sebuah desa wisata memakai pembayaran QRIS lintas negara untuk mengefisienkan transaksi wisatawan asing dan merancang motif modern berakar filosofi adat (langkah A). Namun, beberapa warga lanjut usia merasa terkejut dan canggung menghadapi cara berpakaian wisatawan yang sangat berbeda dari norma desa (gejala B), sementara sejumlah remaja mengunggah foto pribadi tamu ke media sosial tanpa izin karena belum memahami etika privasi digital (gejala C).',
      options: [
        {
          id: 'glokalisasi_shock_lag',
          label:
            'Langkah A adalah glokalisasi & efisiensi IPTEK (positif), gejala B adalah culture shock, dan gejala C adalah cultural lag',
        },
        {
          id: 'westernisasi_semua',
          label:
            'Langkah A adalah westernisasi total, gejala B adalah demokratisasi informasi, dan gejala C adalah keberhasilan akulturasi budaya',
        },
        {
          id: 'lag_dan_shock_terbalik',
          label:
            'Gejala B adalah cultural lag akibat kemajuan aplikasi foto, sedangkan gejala C adalah glokalisasi karena memakai media sosial',
        },
        {
          id: 'asimilasi_monopoli',
          label:
            'Langkah A membuktikan hilangnya budaya tenun asli desa, sedangkan gejala B dan C merupakan contoh kesuksesan literasi etika digital',
        },
      ],
      correctOptionId: 'glokalisasi_shock_lag',
      explanation:
        'Konsep utama yang diuji adalah dampak globalisasi: inovasi tenun bernilai adat dengan transaksi digital adalah glokalisasi dan efisiensi IPTEK; keterkejutan warga menghadapi nilai budaya baru adalah culture shock; dan penggunaan media sosial tanpa kesiapan norma privasi adalah cultural lag (ketimpangan antara teknologi materiil dan etika nonmateriil).',
      wrongExplanation:
        'Jangan tertukar antara culture shock dan cultural lag: culture shock ialah kegamangan saat bertemu budaya asing yang berbeda, sedangkan cultural lag ialah tertinggalnya norma/aturan etika di belakang kemajuan teknologi.',
    },
  },
  {
    id: 12,
    category: 'Proses Globalisasi',
    subtopic: '6. Contoh Nyata & Dampak Globalisasi',
    conceptTag: 'Westernisasi, Konsumerisme, Hedonisme & Kesenjangan Sosial-Ekonomi',
    model: {
      id: 'fq_12',
      type: 'case_study',
      topic: 'Contoh & Dampak Globalisasi · Studi Kasus 12',
      subtopic: '6. Contoh Nyata & Dampak Globalisasi',
      conceptTag: 'Westernisasi, Konsumerisme, Hedonisme & Kesenjangan Sosial-Ekonomi',
      category: 'Proses Globalisasi',
      prompt: 'Diagnosis kombinasi dampak negatif globalisasi yang tergambar dalam fenomena perkotaan berikut:',
      contextText:
        'Promosi gaya hidup mewah luar negeri lewat siaran langsung e-commerce mendorong sebagian pelajar kota besar berutang memakai layanan paylater demi membeli produk bermerek Barat agar dianggap paling modern dan mengejar kesenangan sesaat, meski sebenarnya melampaui kemampuan ekonomi mereka. Di sisi lain, buruh harian di pinggiran kota kian sulit mengejar kenaikan harga hunian dan kalah bersaing karena tidak memiliki akses modal maupun literasi digital.',
      options: [
        {
          id: 'negatif_lengkap',
          label:
            'Munculnya westernisasi, konsumerisme, hedonisme pada kelompok konsumen digital, sekaligus melebarnya kesenjangan sosial-ekonomi akibat ketimpangan akses modal',
        },
        {
          id: 'dampak_positif_merata',
          label:
            'Terwujudnya demokratisasi kesejahteraan yang merata dan glokalisasi ekonomi produktif bagi seluruh lapisan warga kota tanpa efek samping',
        },
        {
          id: 'akulturasi_harmonis',
          label:
            'Proses akulturasi budaya Nusantara yang menyaring perilaku belanja berlebihan sehingga kesenjangan sosial otomatis menghilang di perkotaan',
        },
        {
          id: 'isolasi_ekonomi_kota',
          label:
            'Terhentinya arus barang impor dan teknologi finansial yang menyebabkan masyarakat perkotaan kembali pada pola konsumsi tradisional',
        },
      ],
      correctOptionId: 'negatif_lengkap',
      explanation:
        'Konsep utama yang diuji adalah dampak negatif globalisasi. Mengagungkan label Barat mencerminkan westernisasi; membeli di luar kebutuhan lewat paylater mencerminkan konsumerisme; mengejar kepuasan sesaat mencerminkan hedonisme; dan tertinggalnya pekerja tanpa akses modal/digital menunjukkan kesenjangan sosial-ekonomi.',
      wrongExplanation:
        'Berutang demi gengsi merek Barat dan kesenangan sesaat bukanlah akulturasi ataupun glokalisasi produktif, melainkan gabungan westernisasi, konsumerisme, hedonisme, yang berdampingan dengan ketimpangan sosial.',
    },
  },
];

export const SOLO_BADGE_CRITERIA = {
  weights: {
    quizAccuracy: 50,
    missionMastery: 25,
    consistency: 15,
    duration: 10,
  },
  thresholds: {
    gold: { minComposite: 85, minQuizAccuracy: 80, label: 'GOLD' },
    silver: { minComposite: 68, minQuizAccuracy: 58, label: 'SILVER' },
    bronze: { minComposite: 0, minQuizAccuracy: 0, label: 'BRONZE' },
  },
  generousDurationCapMs: 45 * 60 * 1000, // <= 45 menit mendapat 100% poin waktu agar ketelitian membaca tidak dirugikan
  maxTimedWindowMs: 90 * 60 * 1000,
} as const;

export const SOLO_BADGE_TIER_META: Record<
  SoloBadgeTier,
  {
    title: string;
    shortLabel: string;
    colorHex: string;
    borderClass: string;
    bgClass: string;
    summary: string;
  }
> = {
  gold: {
    title: 'SOLO ACHIEVEMENT BADGE — GOLD',
    shortLabel: 'GOLD',
    colorHex: '#f59e0b',
    borderClass: 'border-amber-400/75',
    bgClass: 'bg-amber-500/15',
    summary:
      'Pencapaian tertinggi! Ketepatan analisis studi kasus, ketuntasan misi & buku teori, konsistensi, serta ritme bermainmu seimbang dan cermat.',
  },
  silver: {
    title: 'SOLO ACHIEVEMENT BADGE — SILVER',
    shortLabel: 'SILVER',
    colorHex: '#cbd5e1',
    borderClass: 'border-slate-300/70',
    bgClass: 'bg-slate-400/15',
    summary:
      'Pencapaian sangat baik! Pemahaman konsep globalisasi sudah kuat dan konsisten. Tingkatkan ketelitian studi kasus untuk meraih Gold.',
  },
  bronze: {
    title: 'SOLO ACHIEVEMENT BADGE — BRONZE',
    shortLabel: 'BRONZE',
    colorHex: '#d97706',
    borderClass: 'border-orange-400/70',
    bgClass: 'bg-orange-500/15',
    summary:
      'Petualangan Solo berhasil dituntaskan! Tinjau kembali pembahasan studi kasus dan baca seluruh buku teori untuk meningkatkan badge-mu.',
  },
};

const SOLO_TIER_RANK: Record<SoloBadgeTier, number> = {
  bronze: 1,
  silver: 2,
  gold: 3,
};

export function pickHigherSoloBadge(
  a: SoloBadgeTier | null | undefined,
  b: SoloBadgeTier | null | undefined
): SoloBadgeTier | null {
  if (!a) return b ?? null;
  if (!b) return a;
  return SOLO_TIER_RANK[a] >= SOLO_TIER_RANK[b] ? a : b;
}

export function evaluateSoloAchievementBadge(params: {
  state: Pick<
    SaveState,
    | 'completedChapters'
    | 'completedMissions'
    | 'missionScores'
    | 'missionFirstScores'
    | 'readBooks'
  >;
  quizCorrectCount: number;
  quizTotalCount: number;
  durationMs: number | null;
  runId: string;
  now?: number;
}): {
  eligible: boolean;
  reasonIfIneligible?: string;
  record: SoloBadgeRecord | null;
} {
  const { state, quizCorrectCount, quizTotalCount, durationMs, runId, now = Date.now() } = params;
  const chaptersCompleted = new Set(state.completedChapters || []).size;
  const missionsCompleted = new Set(state.completedMissions || []).size;

  if (!runId || chaptersCompleted < 5 || missionsCompleted < 10 || quizTotalCount <= 0) {
    return {
      eligible: false,
      reasonIfIneligible:
        'Mode Solo belum tuntas sepenuhnya (memerlukan 5 Chapter, 10 Misi, dan Final Quiz).',
      record: null,
    };
  }

  const clampedCorrect = Math.max(0, Math.min(quizTotalCount, Math.round(quizCorrectCount)));
  const quizAccuracyPct = Math.round((clampedCorrect / quizTotalCount) * 100);

  const allMissionIds: MissionId[] = [
    'ch1_m1',
    'ch1_m2',
    'ch2_m1',
    'ch2_m2',
    'ch3_m1',
    'ch3_m2',
    'ch4_m1',
    'ch4_m2',
    'ch5_m1',
    'ch5_m2',
  ];

  const missionAvgPct =
    allMissionIds.reduce((sum, mId) => sum + Math.max(0, Math.min(100, state.missionScores?.[mId] ?? 0)), 0) /
    allMissionIds.length;

  const totalBooks = 11;
  const booksReadCount = Math.min(totalBooks, new Set(state.readBooks || []).size);
  const bookPct = (booksReadCount / totalBooks) * 100;
  const missionMasteryPct = Math.round(missionAvgPct * 0.7 + bookPct * 0.3);

  const consistencyPct = Math.round(
    allMissionIds.reduce((sum, mId) => {
      const firstScore = state.missionFirstScores?.[mId];
      const fallback = state.missionScores?.[mId] ?? 0;
      const val = typeof firstScore === 'number' && Number.isFinite(firstScore) ? firstScore : fallback;
      return sum + Math.max(0, Math.min(100, val));
    }, 0) / allMissionIds.length
  );

  // Normalized duration: any playthrough <= 45 min gets 100% (no penalty for careful reading!),
  // 45..90 min scales gently 100% -> 60%, > 90 min = 50% (never makes accurate player drop unfairly).
  let durationScorePct = 85;
  if (typeof durationMs === 'number' && Number.isFinite(durationMs) && durationMs > 0) {
    const cap = SOLO_BADGE_CRITERIA.generousDurationCapMs;
    const maxW = SOLO_BADGE_CRITERIA.maxTimedWindowMs;
    if (durationMs <= cap) {
      durationScorePct = 100;
    } else if (durationMs >= maxW) {
      durationScorePct = 50;
    } else {
      const ratio = (durationMs - cap) / (maxW - cap);
      durationScorePct = Math.round(100 - ratio * 40);
    }
  }

  const compositeScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        quizAccuracyPct * 0.5 +
          missionMasteryPct * 0.25 +
          consistencyPct * 0.15 +
          durationScorePct * 0.1
      )
    )
  );

  let tier: SoloBadgeTier = 'bronze';
  if (
    compositeScore >= SOLO_BADGE_CRITERIA.thresholds.gold.minComposite &&
    quizAccuracyPct >= SOLO_BADGE_CRITERIA.thresholds.gold.minQuizAccuracy
  ) {
    tier = 'gold';
  } else if (
    compositeScore >= SOLO_BADGE_CRITERIA.thresholds.silver.minComposite &&
    quizAccuracyPct >= SOLO_BADGE_CRITERIA.thresholds.silver.minQuizAccuracy
  ) {
    tier = 'silver';
  }

  const breakdown: SoloBadgeBreakdown = {
    quizAccuracyPct,
    missionMasteryPct,
    consistencyPct,
    durationScorePct,
    booksReadCount,
    booksTotalCount: totalBooks,
  };

  return {
    eligible: true,
    record: {
      runId,
      tier,
      compositeScore,
      quizScore: quizAccuracyPct,
      quizCorrectCount: clampedCorrect,
      quizTotalCount,
      missionsCompleted,
      chaptersCompleted,
      consistencyScore: consistencyPct,
      durationMs: durationMs && durationMs > 0 ? durationMs : null,
      breakdown,
      earnedAt: now,
    },
  };
}

export function getBadgeFromScore(score: number): {
  rank: BadgeRank;
  colorHex: string;
  summary: string;
} {
  if (score >= 90) {
    return {
      rank: 'MASTER SOCIOLOGIST',
      colorHex: '#eab308',
      summary: 'Penguasaan luar biasa atas bentuk, proses, dan analisis kritis globalisasi di kelima chapter!',
    };
  }
  if (score >= 80) {
    return {
      rank: 'GLOBALIZATION EXPERT',
      colorHex: '#10b981',
      summary: 'Pemahaman sangat kuat dalam menghubungkan teori dan fenomena nyata globalisasi.',
    };
  }
  if (score >= 70) {
    return {
      rank: 'SOCIAL ANALYST',
      colorHex: '#0ea5e9',
      summary: 'Analisis sosiologis baik! Terus asah kepekaan kritis terhadap dinamika global.',
    };
  }
  if (score >= 60) {
    return {
      rank: 'JUNIOR SOCIOLOGIST',
      colorHex: '#8b5cf6',
      summary: 'Dasar pemahaman globalisasi sudah terbentuk. Tinjau kembali studi kasus kritis.',
    };
  }
  return {
    rank: 'GLOBALIZATION APPRENTICE',
    colorHex: '#f43f5e',
    summary: 'Awal yang bagus! Jelajahi ulang buku teori dan misi di stasiun untuk memperdalam konsep sosiologi.',
  };
}

export const FIRST_MEETING_REACTIONS: Record<NpcCharacterId, CutsceneLine> = {
  rex: {
    speaker: 'KAMU (ASTRONAUT)',
    roleTitle: 'Komandan Misi',
    speakerId: 'player',
    colorHex: '#38bdf8',
    text: 'Hah?! Kamu siapa? Sejak kapan ada orang lain di ruang navigasi ini?!',
    emotion: 'curious',
    gesture: 'tilt_curious',
    cameraFocus: 'player',
  },
  bima: {
    speaker: 'KAMU (ASTRONAUT)',
    roleTitle: 'Komandan Misi',
    speakerId: 'player',
    colorHex: '#38bdf8',
    text: 'Eh, tunggu! Kamu siapa, ya? Tiba-tiba muncul di Sayap Timur!',
    emotion: 'curious',
    gesture: 'scratch_head',
    cameraFocus: 'player',
  },
  fuzzy: {
    speaker: 'KAMU (ASTRONAUT)',
    roleTitle: 'Komandan Misi',
    speakerId: 'player',
    colorHex: '#38bdf8',
    text: 'Loh?! Ada kru lain lagi di sini? Kamu siapa, nih?',
    emotion: 'curious',
    gesture: 'tilt_curious',
    cameraFocus: 'player',
  },
  bob: {
    speaker: 'KAMU (ASTRONAUT)',
    roleTitle: 'Komandan Misi',
    speakerId: 'player',
    colorHex: '#38bdf8',
    text: 'Hah? Kamu siapa? Kok tahu-tahu berdiri di ruang ekonomi?',
    emotion: 'curious',
    gesture: 'scratch_head',
    cameraFocus: 'player',
  },
  ratu_laras: {
    speaker: 'KAMU (ASTRONAUT)',
    roleTitle: 'Komandan Misi',
    speakerId: 'player',
    colorHex: '#38bdf8',
    text: 'Whoa! Siapa kamu?! Aura di dek observasi ini langsung terasa berbeda!',
    emotion: 'curious',
    gesture: 'tilt_curious',
    cameraFocus: 'player',
  },
};

export interface SecretTvChallenge {
  id: string;
  clueTitle: string;
  clues: string[];
  question: string;
  options: Array<{ id: string; label: string }>;
  correctOptionId: string;
  explanation: string;
}

export const SECRET_TV_QUESTIONS: SecretTvChallenge[] = [
  {
    id: 'tv_1',
    clueTitle: 'Siaran Rahasia #1 — Gelombang Budaya Pop Asia',
    clues: [
      'Clue 1: Muncul sebagai fenomena lintas negara lewat musik pop, koreografi sinkron, dan video musik global.',
      'Clue 2: Penggemarnya di Indonesia memadukan budaya lokal seperti batik atau bahasa daerah dalam konten cover mereka.',
    ],
    question: 'Fenomena pertukaran tren budaya pop lintas batas yang diterima kreatif oleh masyarakat lokal tersebut mencerminkan proses...',
    options: [
      { id: 'hallyu_glokal', label: 'Globalisasi budaya & akulturasi kreatif lintas generasi' },
      { id: 'isolasi', label: 'Isolasi budaya total tanpa akses media digital' },
      { id: 'autarki', label: 'Penutupan pasar ekonomi antarnegara secara mutlak' },
    ],
    correctOptionId: 'hallyu_glokal',
    explanation: 'Musik, tarian, dan media digital mempercepat interaksi budaya global sekaligus membuka ruang akulturasi kreatif di berbagai negara.',
  },
  {
    id: 'tv_2',
    clueTitle: 'Siaran Rahasia #2 — Panggung Kolaborasi Lokal–Global',
    clues: [
      'Clue 1: Penampilan panggung internasional memakai teknologi tata cahaya hologram modern.',
      'Clue 2: Kostum dan irama gamelan tetap tampil sebagai identitas khas Nusantara di hadapan penonton dunia.',
    ],
    question: 'Strategi menggabungkan standar panggung global dengan kekayaan budaya lokal agar berdaya saing dunia disebut...',
    options: [
      { id: 'westernisasi', label: 'Westernisasi yang menghapus unsur tradisi' },
      { id: 'glokalisasi', label: 'Glokalisasi (berpikir global, berakar pada keunikan lokal)' },
      { id: 'ethnocentrism', label: 'Penolakan mutlak terhadap teknologi pertunjukan modern' },
    ],
    correctOptionId: 'glokalisasi',
    explanation: 'Glokalisasi menjaga keunikan budaya Nusantara tetap hidup dan relevan saat bersanding di panggung dunia!',
  },
  {
    id: 'tv_3',
    clueTitle: 'Siaran Rahasia #3 — Etika Warga Digital Global',
    clues: [
      'Clue 1: Viral di media sosial memungkinkan siapa saja meniru gerakan dance dari belahan dunia lain dalam hitungan jam.',
      'Clue 2: Diperlukan sikap menghargai hak cipta koreografer dan tidak merendahkan budaya sendiri.',
    ],
    question: 'Sikap sosiologis paling bijak saat mengikuti tren dance dan hiburan global di media sosial adalah...',
    options: [
      { id: 'kritis_kreatif', label: 'Menikmati tren secara kreatif, menghargai karya kreator, dan tetap bangga pada budaya lokal' },
      { id: 'lupa_lokal', label: 'Menganggap budaya daerah selalu kuno dibanding tren luar negeri' },
      { id: 'sebar_hoaks', label: 'Membagikan konten tanpa memperhatikan etika dan sumbernya' },
    ],
    correctOptionId: 'kritis_kreatif',
    explanation: 'Sinyal TV Rahasia terpecahkan! Kamu berhasil memadukan keterbukaan global, etika digital, dan kebanggaan budaya Nusantara.',
  },
];

export const EMOTE_CATEGORY_LABELS: Record<EmoteCategory, string> = {
  sapaan: 'Sapaan',
  reaksi: 'Reaksi',
  ekspresi: 'Ekspresi',
  selebrasi: 'Selebrasi',
  lucu: 'Gerakan Lucu',
  dance: 'Dance',
};

export const EMOTES: EmoteDef[] = [
  // Starter Emotes (11)
  { id: 'wave', emoji: '👋', label: 'Wave', category: 'sapaan', durationMs: 2800, accentHex: '#38bdf8', isStarter: true, unlockType: 'starter', unlockLabel: 'Tersedia sejak awal' },
  { id: 'bow', emoji: '🙇', label: 'Hormat', category: 'sapaan', durationMs: 2600, accentHex: '#0ea5e9', isStarter: true, unlockType: 'starter', unlockLabel: 'Tersedia sejak awal' },
  { id: 'thumbs_up', emoji: '👍', label: 'Thumbs Up', category: 'reaksi', durationMs: 2600, accentHex: '#0ea5e9', isStarter: true, unlockType: 'starter', unlockLabel: 'Tersedia sejak awal' },
  { id: 'surprised', emoji: '😮', label: 'Surprised', category: 'reaksi', durationMs: 2400, accentHex: '#eab308', isStarter: true, unlockType: 'starter', unlockLabel: 'Tersedia sejak awal' },
  { id: 'heart', emoji: '❤️', label: 'Heart', category: 'ekspresi', durationMs: 3000, accentHex: '#f43f5e', isStarter: true, unlockType: 'starter', unlockLabel: 'Tersedia sejak awal' },
  { id: 'laugh', emoji: '😂', label: 'Laugh', category: 'ekspresi', durationMs: 2800, accentHex: '#f59e0b', isStarter: true, unlockType: 'starter', unlockLabel: 'Tersedia sejak awal' },
  { id: 'sad', emoji: '😢', label: 'Sad', category: 'ekspresi', durationMs: 3000, accentHex: '#64748b', isStarter: true, unlockType: 'starter', unlockLabel: 'Tersedia sejak awal' },
  { id: 'think', emoji: '🤔', label: 'Think', category: 'ekspresi', durationMs: 3000, accentHex: '#8b5cf6', isStarter: true, unlockType: 'starter', unlockLabel: 'Tersedia sejak awal' },
  { id: 'clap', emoji: '👏', label: 'Clap', category: 'selebrasi', durationMs: 2800, accentHex: '#10b981', isStarter: true, unlockType: 'starter', unlockLabel: 'Tersedia sejak awal' },
  { id: 'celebrate', emoji: '🙌', label: 'Celebrate', category: 'selebrasi', durationMs: 3000, accentHex: '#14b8a6', isStarter: true, unlockType: 'starter', unlockLabel: 'Tersedia sejak awal' },
  { id: 'dance', emoji: '💃', label: 'Orbit Dance', category: 'dance', durationMs: 3600, accentHex: '#ec4899', isStarter: true, unlockType: 'starter', unlockLabel: 'Tersedia sejak awal' },

  // Chapter & Secret TV Unlockable Emotes (7)
  { id: 'salute', emoji: '🫡', label: 'Komandan', category: 'sapaan', durationMs: 2600, accentHex: '#38bdf8', isStarter: false, requiredChapter: 1, unlockType: 'chapter', unlockLabel: 'Selesaikan Chapter 1' },
  { id: 'shrug', emoji: '🤷', label: 'Bingung', category: 'reaksi', durationMs: 2800, accentHex: '#10b981', isStarter: false, requiredChapter: 2, unlockType: 'chapter', unlockLabel: 'Selesaikan Chapter 2' },
  { id: 'flex', emoji: '💪', label: 'Flex Energi', category: 'lucu', durationMs: 3000, accentHex: '#ec4899', isStarter: false, requiredChapter: 3, unlockType: 'chapter', unlockLabel: 'Selesaikan Chapter 3' },
  { id: 'cheer', emoji: '🎉', label: 'Sorak Misi', category: 'selebrasi', durationMs: 3000, accentHex: '#f59e0b', isStarter: false, requiredChapter: 4, unlockType: 'chapter', unlockLabel: 'Selesaikan Chapter 4' },
  { id: 'spin', emoji: '🌀', label: 'Gaya Orbit', category: 'lucu', durationMs: 3200, accentHex: '#f43f5e', isStarter: false, requiredChapter: 5, unlockType: 'chapter', unlockLabel: 'Selesaikan Chapter 5' },
  { id: 'kpop_groove', emoji: '✨', label: 'Cosmic Idol', category: 'dance', durationMs: 4400, accentHex: '#a855f7', isStarter: false, unlockType: 'secret_tv', unlockLabel: 'Misi Rahasia TV Budaya' },
  { id: 'star_hop', emoji: '🌟', label: 'Starlight Pop', category: 'dance', durationMs: 4200, accentHex: '#f472b6', isStarter: false, unlockType: 'secret_tv', unlockLabel: 'Misi Rahasia TV Budaya' },
];

export const EMOTE_MAP: Record<EmoteId, EmoteDef> = EMOTES.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<EmoteId, EmoteDef>
);

export interface BatikMerahRequirementStatus {
  id: string;
  label: string;
  currentText: string;
  met: boolean;
}

export function getBatikMerahRequirements(state: SaveState): {
  allMet: boolean;
  items: BatikMerahRequirementStatus[];
} {
  const soloCount = Math.max(0, Number(state.soloCompletions || 0));
  const mpCount = Math.max(0, Number(state.multiplayerCompletions || 0));
  const ch5AndQuiz = Boolean(state.completedChapters?.includes(5) && state.quizCompleted);

  const ownedEmotes = new Set(state.unlockedEmotes || []);
  const totalEmotes = EMOTES.length;
  const unlockedEmoteCount = EMOTES.filter((e) => ownedEmotes.has(e.id)).length;
  const allEmotesMet = unlockedEmoteCount >= totalEmotes;

  const ownedItems = new Set(state.unlockedItems || []);
  const requiredRewardItems = INVENTORY_ITEMS.filter(
    (item) => !item.isDefault && item.id !== 'batik_smada_merah'
  );
  const unlockedRewardCount = requiredRewardItems.filter((item) => ownedItems.has(item.id)).length;
  const allItemsMet = unlockedRewardCount >= requiredRewardItems.length;

  const items: BatikMerahRequirementStatus[] = [
    {
      id: 'solo_10',
      label: 'Tamatkan Mode Solo 10 kali',
      currentText: `${Math.min(soloCount, 10)} / 10`,
      met: soloCount >= 10,
    },
    {
      id: 'mp_5',
      label: 'Selesaikan Mode Multiplayer 5 kali',
      currentText: `${Math.min(mpCount, 5)} / 5`,
      met: mpCount >= 5,
    },
    {
      id: 'ch5_quiz',
      label: 'Tamatkan Chapter 1–5 & Final Quiz',
      currentText: ch5AndQuiz ? 'Selesai' : 'Belum',
      met: ch5AndQuiz,
    },
    {
      id: 'all_emotes',
      label: 'Kumpulkan seluruh Emote',
      currentText: `${unlockedEmoteCount} / ${totalEmotes}`,
      met: allEmotesMet,
    },
    {
      id: 'all_items',
      label: 'Buka seluruh Item & Hadiah lainnya',
      currentText: `${unlockedRewardCount} / ${requiredRewardItems.length}`,
      met: allItemsMet,
    },
  ];

  return {
    allMet: items.every((i) => i.met),
    items,
  };
}

