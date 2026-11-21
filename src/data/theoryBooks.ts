import {
  ChapterId,
  MissionId,
  RoomId,
  RoomMissionStatus,
  TheoryBookDef,
  TheoryBookId,
} from '../types/game';

export const THEORY_BOOKS: TheoryBookDef[] = [
  {
    id: 'book_1_pengertian',
    roomId: 'central_lobby',
    title: 'Konsep Dasar, Global Village & Pengertian Globalisasi',
    topicLabel: '1. Pengertian & Konsep Global',
    chapterHint: 'Chapter 1 — Central Lobby',
    accentHex: '#38bdf8',
    summary:
      'Globalisasi adalah proses mendunianya gagasan, informasi, barang, modal, nilai budaya, dan pola interaksi manusia sehingga batas geografis negara semakin cair dan melahirkan dunia yang saling bergantung (interdependensi global).',
    keyPoints: [
      'Menurut Anthony Giddens: globalisasi adalah intensifikasi hubungan sosial mendunia yang menghubungkan kejadian lokal dengan peristiwa di belahan dunia lain yang berjarak jauh.',
      'Menurut Selo Soemardjan: terbentuknya sistem organisasi dan komunikasi antar masyarakat di seluruh dunia untuk mengikuti sistem dan kaidah yang sama.',
      'Marshall McLuhan mengenalkan konsep Global Village (Desa Global): metafora bahwa dunia terasa seperti satu desa kecil berkat pesatnya media komunikasi elektronik.',
      'Interdependensi Global: kondisi saling ketergantungan antarnegara dalam rantai pasok produksi, perdagangan, energi, dan pertukaran informasi.',
      'Borderless World: terbukanya arus informasi, modal, dan ekonomi menembus batas-batas administratif negara.',
    ],
    exampleInLife:
      'Pelajar di Indonesia mengikuti olimpiade sains internasional secara daring, memesan referensi luar negeri secara instan, atau menyaksikan siaran dunia pada detik yang sama seolah berada di satu desa global.',
    diagramType: 'interconnection',
    position: { x: 3.75, y: 0.48, z: 5.25 },
  },
  {
    id: 'book_2_karakteristik',
    roomId: 'navigation_room',
    title: 'Karakteristik Utama & Kronologi Proses Globalisasi',
    topicLabel: '2. Karakteristik & Proses Globalisasi',
    chapterHint: 'Chapter 1 — Navigation Room',
    accentHex: '#2563eb',
    summary:
      'Menurut Anthony Giddens, globalisasi adalah intensifikasi hubungan sosial mendunia yang menghubungkan kejadian lokal dengan peristiwa berjarak jauh. Globalisasi berlangsung bertahap sepanjang sejarah dan ditandai penyusutan ruang dan waktu, integrasi ekonomi, serta masalah bersama global.',
    keyPoints: [
      'Definisi Anthony Giddens: intensifikasi hubungan sosial mendunia yang membuat kejadian di tempat jauh memengaruhi kehidupan lokal (bukan isolasi perdagangan atau perpindahan provinsi semata).',
      'Penyusutan ruang dan waktu (time-space compression): teknologi transportasi & komunikasi memangkas hambatan jarak geografis dan waktu tempuh sehingga arus informasi berlangsung cepat.',
      'Tiga ciri utama globalisasi modern: (1) meningkatnya interaksi budaya melalui media, film, musik, dan pariwisata internasional; (2) meningkatnya saling ketergantungan ekonomi dan produksi lintas negara; (3) munculnya masalah bersama global seperti krisis iklim dan keamanan siber (sementara interaksi tatap muka keluarga tetap berlangsung).',
      'Kronologi 4 tahapan proses terjadinya globalisasi: (1) Perdagangan Kuno Jalur Sutra & Jalur Rempah Maritim -> (2) Ekspansi Pelayaran Samudra & Kolonialisme Awal -> (3) Revolusi Industri Mesin Uap & Transportasi Massal -> (4) Era Internet Global, Satelit & Kecerdasan Buatan.',
    ],
    exampleInLife:
      'Satu unit ponsel pintar dirancang di Amerika Serikat, chip diproduksi di Taiwan, dirakit di Asia Tenggara, dan dipasarkan ke seluruh dunia dalam hitungan minggu.',
    diagramType: 'characteristics',
    position: { x: -35.4, y: 0.87, z: 4.95 },
  },
  {
    id: 'book_3_hyperglobalist',
    roomId: 'central_lobby',
    title: 'Teori Hiperglobalis (Hyperglobalist Perspective)',
    topicLabel: '3. Teori Hyperglobalist',
    chapterHint: 'Chapter 1 — Perspektif REX',
    accentHex: '#0ea5e9',
    summary:
      'Kaum Hiperglobalis memandang globalisasi sebagai fenomena nyata dan era baru sejarah manusia ketika pasar bebas, logistik modern, dan teknologi digital melahirkan masyarakat jaringan tanpa batas (borderless world).',
    keyPoints: [
      'Logika sebab-akibat Hyperglobalist: pesatnya internet berkecepatan tinggi, logistik kontainer modern, serta liberalisasi pasar dan arus modal global menyebabkan peran batas administratif negara-bangsa melemah dibanding kekuatan pasar dan jaringan global.',
      'Dunia dipandang bergerak menuju satu masyarakat jaringan tanpa batas geografis (borderless world) dan terintegrasi dalam satu pasar global.',
      'Startup dan organisasi digital dapat beroperasi melayani belasan negara dengan pembayaran lintas mata uang instan serta tim lintas benua tanpa kantor pusat fisik tunggal.',
      'Evaluasi kritis terhadap Hyperglobalist: perspektif ini mengakui realitas melemahnya sekat negara secara optimistis, namun sering dikritik karena terlalu optimistis dan kurang menyoroti ketimpangan struktural antarnegara (Utara–Selatan).',
    ],
    exampleInLife:
      'Sebuah startup aplikasi belajar dari Jakarta melayani siswa di 18 negara dengan pembayaran lintas mata uang instan dan tim pengembang yang tersebar di Asia serta Eropa.',
    diagramType: 'hyperglobalist',
    position: { x: -6.25, y: 0.87, z: -5.28 },
  },
  {
    id: 'book_4_transformasionalis',
    roomId: 'cultural_room',
    title: 'Teori Transformasionalis, Akulturasi & Asimilasi Budaya',
    topicLabel: '4. Teori Transformasionalis',
    chapterHint: 'Chapter 2 — Cultural Room (BIMA)',
    accentHex: '#10b981',
    summary:
      'Kaum Transformasionalis menilai globalisasi sebagai proses perubahan sosial dinamis dengan hasil berbeda di tiap daerah. Budaya lokal dan negara tidak otomatis punah atau lenyap, melainkan beradaptasi dan menata ulang perannya.',
    keyPoints: [
      'Akulturasi Budaya: perpaduan budaya asing dan lokal tanpa menghilangkan ciri khas budaya asli—misalnya pementasan sendratari wayang orang dengan tata panggung proyeksi hologram 3D dan musik orkestra digital.',
      'Asimilasi Budaya: peleburan dua budaya atau lebih yang melahirkan budaya baru dan memudarkan ciri khas budaya lama.',
      'Tiga pandangan utama kaum Transformasionalis: (1) Globalisasi tidak memiliki satu arah tunggal dan berdampak berbeda di tiap masyarakat; (2) Negara tidak lenyap, melainkan menata ulang perannya menghadapi tantangan lintas batas; (3) Masyarakat memiliki daya agensi untuk menyaring, menafsirkan ulang, dan memodifikasi arus global sesuai nilai lokal.',
      'Menolak determinisme homogenisasi: globalisasi budaya tidak semata-mata menghasilkan penyeragaman tunggal karena komunitas lokal melakukan resepsi aktif dan hibridisasi kreatif.',
    ],
    exampleInLife:
      'Kesenian tradisional wayang orang atau angklung dipadukan dengan teknologi panggung hologram digital sehingga digemari generasi muda tanpa menghapus cerita aslinya.',
    diagramType: 'transformationalist',
    position: { x: 21.38, y: 0.46, z: -15.2 },
  },
  {
    id: 'book_5_skeptis',
    roomId: 'global_balance_room',
    title: 'Teori Skeptis, Sikap Selektif & Sintesis Perspektif Globalisasi',
    topicLabel: '5. Teori Skeptic & Sikap Kritis',
    chapterHint: 'Chapter 5 — Balance Room (RATU LARAS)',
    accentHex: '#f43f5e',
    summary:
      'Perspektif Skeptis mengajak kita bersikap kritis terhadap ketimpangan ekonomi serta krisis identitas di balik arus globalisasi. Sikap kritis Skeptis bukanlah anti-kemajuan atau isolasi total, melainkan menuntut keadilan, perlindungan lokal, dan penyaringan nilai.',
    keyPoints: [
      'Hakikat sikap Skeptis: bukan berarti menolak seluruh teknologi modern atau memutus hubungan diplomatik, melainkan menuntut analisis kritis atas ketimpangan global dan penyaringan pengaruh asing agar sesuai jati diri bangsa.',
      'Kebijakan selektif: masyarakat dan pemerintah menerapkan literasi kritis, memilih teknologi produktif untuk riset dan pendidikan, serta melindungi produk kreatif dalam negeri dari praktik dumping agar kemajuan IPTEK terserap tanpa merusak ekonomi dan budaya lokal.',
      'Sintesis 3 perspektif sosiologi sebagai lensa yang saling melengkapi: (1) Hyperglobalist menyoroti kekuatan konektivitas teknologi & pasar tanpa batas; (2) Transformasionalis melihat perubahan dinamis serta peluang akulturasi dan glokalisasi; (3) Skeptis mengingatkan kewaspadaan atas ketimpangan ekonomi & krisis identitas.',
      'Empat langkah berpikir kritis menghadapi tren atau teknologi global baru: (1) Mengenali tren/teknologi beserta asal-usul informasinya -> (2) Menganalisis dampak positif dan risiko sosial-ekonominya -> (3) Menyaring & menyesuaikannya dengan norma etika serta budaya Nusantara -> (4) Memanfaatkannya secara produktif untuk karya dan kemajuan masyarakat.',
    ],
    exampleInLife:
      'Siswa memanfaatkan kecerdasan buatan dan jurnal daring untuk riset sekolah, sambil kritis memeriksa kebenaran sumber, menjaga etika budaya Nusantara, dan mendukung karya produk dalam negeri.',
    diagramType: 'skeptic',
    position: { x: -4.6, y: 0.87, z: -32.45 },
  },
  {
    id: 'book_6_glokalisasi',
    roomId: 'global_exchange_room',
    title: 'Glokalisasi & Spektrum Interaksi Lokal-Global',
    topicLabel: '6. Glokalisasi',
    chapterHint: 'Chapter 2 — Global Exchange Room',
    accentHex: '#14b8a6',
    summary:
      'Glokalisasi (think globally, act locally) adalah proses memadukan standar produk atau gagasan global dengan identitas budaya lokal yang khas agar tetap relevan dan berdaya saing tanpa kehilangan jati diri.',
    keyPoints: [
      'Perbedaan Glokalisasi vs Westernisasi: Glokalisasi tetap menempatkan budaya lokal sebagai unsur penting yang memberi warna unik pada produk/gagasan global; sebaliknya Westernisasi meniru gaya hidup Barat secara mutlak dan kerap meremehkan bahasa atau budaya daerah.',
      'Dampak positif glokalisasi: ketika pelaku ekonomi kreatif daerah memadukan pemasaran digital modern dengan kearifan lokal (kuliner, tenun, batik), daya saing budaya lokal meningkat di pasar global sekaligus memperluas ekonomi masyarakat setempat.',
      'Spektrum contoh interaksi lokal-global yang perlu dibedakan: (a) Kafe internasional menjual kopi tubruk gula aren atau merek sepatu internasional berkolaborasi motif batik Parang & Mega Mendung = Glokalisasi; (b) Arsitektur masjid beratap tumpang seperti pendopo Jawa = Akulturasi; (c) Menganggap bahasa daerah memalukan dibanding bahasa asing = Westernisasi.',
    ],
    exampleInLife:
      'Merek sepatu internasional berkolaborasi dengan pembatik Cirebon meluncurkan edisi motif Parang dan Mega Mendung untuk pasar dunia, serta kedai kopi global menyajikan kopi tubruk gula aren.',
    diagramType: 'glocalization',
    position: { x: 40.0, y: 0.83, z: 4.35 },
  },
  {
    id: 'book_7_dampak_ekonomi',
    roomId: 'economic_room',
    title: 'Dampak Ekonomi Globalisasi, MNC & Pasar Bebas',
    topicLabel: '7. Dampak Ekonomi',
    chapterHint: 'Chapter 4 — Economic Room',
    accentHex: '#f59e0b',
    summary:
      'Globalisasi ekonomi memperluas pasar ekspor dan investasi Perusahaan Multinasional (MNC), tetapi juga menciptakan sifat ambivalen, persaingan ketat bagi UMKM, serta risiko efek domino krisis finansial antarnegara.',
    keyPoints: [
      'Sifat ambivalen Perusahaan Multinasional (MNC): pabrik MNC di dalam negeri menyerap ribuan tenaga kerja lokal dan memberi pelatihan teknik (transfer keterampilan awal), tetapi sebagian besar keuntungan bersih dan hak paten desain dikirim kembali ke kantor pusat di negara asal.',
      'Peluang & tantangan UMKM di era perdagangan bebas: (1) membanjirnya produk impor berbiaya murah yang bersaing ketat dengan pengrajin lokal; (2) peluang memperluas pasar ekspor langsung ke luar negeri melalui marketplace digital; (3) tuntutan memenuhi standar mutu internasional, sertifikasi, dan efisiensi distribusi (tidak ada sukses otomatis tanpa inovasi).',
      'Interdependensi finansial global: sistem perbankan, nilai tukar mata uang, dan rantai pasok manufaktur dunia terhubung erat sehingga krisis ekonomi atau gangguan pasokan di satu negara pusat dapat memicu efek domino (contagion effect) kenaikan harga di negara lain.',
      'Strategi ekonomi berdaya saing: melakukan hilirisasi industri bernilai tambah, pendampingan digitalisasi UMKM, dan penguatan kualitas SDM agar tidak terus bergantung menjual bahan mentah.',
    ],
    exampleInLife:
      'Petani kopi Gayo dan pengrajin rotan menembus pasar ekspor lewat e-commerce dengan sertifikasi mutu internasional, sementara industri nasional mengembangkan hilirisasi agar nilai tambah tetap tinggal di dalam negeri.',
    diagramType: 'economy',
    position: { x: 17.55, y: 0.82, z: 14.9 },
  },
  {
    id: 'book_8_dampak_sosbud',
    roomId: 'technology_lab',
    title: 'Globalisasi IPTEK, AI & Kesenjangan Digital',
    topicLabel: '8. IPTEK, AI & Interaksi Sosial',
    chapterHint: 'Chapter 3 — Tech Lab',
    accentHex: '#6366f1',
    summary:
      'Kemajuan IPTEK—mulai dari AI penerjemah, MOOC, telemedisin, hingga open-source IoT—mempercepat demokratisasi sains dan kolaborasi lintas benua, sekaligus memunculkan kesenjangan digital (digital divide) dan tuntutan upskilling tenaga kerja.',
    keyPoints: [
      'Tiga terobosan IPTEK dan fungsinya: (1) Penerjemah Neural AI Real-Time -> mengatasi hambatan bahasa dalam kolaborasi lintas negara; (2) Platform Pembelajaran Terbuka (MOOC) -> memperluas akses kuliah dan riset internasional bagi siswa di daerah; (3) Telemedisin & Robotika Medis -> memungkinkan konsultasi dokter spesialis dan layanan kesehatan jarak jauh.',
      'Kesenjangan Digital (Digital Divide): meskipun IPTEK maju pesat, ketimpangan akses internet cepat dan perangkat komputasi antara kota besar dan wilayah terpencil masih menciptakan kesenjangan peluang pendidikan dan ekonomi.',
      'Demokratisasi sains & kolaborasi terbuka: perangkat open-source IoT dan data satelit publik memungkinkan pelajar lintas benua (misal Indonesia, Jepang, Kenya) berkolaborasi memecahkan isu lingkungan global.',
      'Otomatisasi AI & perubahan struktur kerja: adopsi kecerdasan buatan dan robotika industri menggantikan pekerjaan rutin sehingga tenaga kerja dituntut meningkatkan kompetensi (upskilling) berupa literasi digital dan keterampilan kreatif.',
    ],
    exampleInLife:
      'Pelajar di daerah mengikuti kuliah terbuka MOOC dengan bantuan penerjemah AI, sementara tim riset lintas negara memantau kualitas udara lewat sensor open-source IoT.',
    diagramType: 'sociocultural',
    position: { x: -21.85, y: 0.97, z: 15.2 },
  },
  {
    id: 'book_9_identitas_budaya',
    roomId: 'cultural_identity_room',
    title: 'Identitas Budaya, Cultural Lag, Cultural Shock & Westernisasi',
    topicLabel: '9. Identitas Budaya & Cultural Lag',
    chapterHint: 'Chapter 5 — Cultural Identity Room',
    accentHex: '#d97706',
    summary:
      'Globalisasi menguji ketahanan jati diri bangsa. Tanpa literasi budaya kritis, masyarakat berisiko mengalami westernisasi, culture shock, maupun ketertinggalan budaya (cultural lag) ketika teknologi melaju jauh lebih cepat daripada etika.',
    keyPoints: [
      'Gejala negatif terhadap identitas budaya nasional: generasi muda merasa malu mempelajari bahasa daerah dan seni tradisional karena dianggap kuno, meniru gaya hidup konsumtif luar negeri secara mentah, serta memudarnya gotong royong tergantikan sikap individualistis (sebaliknya mempromosikan batik & tari lewat konten kreatif merupakan pelestarian adaptif).',
      'Cultural Lag (William Ogburn): ketimpangan ketika budaya materiil (teknologi digital seperti AI generatif & media sosial siaran langsung) berkembang jauh lebih cepat daripada budaya nonmateriil (norma, aturan etika privasi data, dan anti-plagiarisme).',
      'Cultural Shock: guncangan psikologis-sosial ketika seseorang atau kelompok berhadapan mendadak dengan budaya baru yang sangat berbeda.',
      'Westernisasi: meniru gaya hidup dan nilai Barat secara tidak kritis sambil meremehkan budaya sendiri.',
      'Strategi penguatan ketahanan identitas budaya: mengintegrasikan pendidikan kearifan lokal, literasi budaya kritis, dan mendukung ekosistem kreator muda Nusantara agar identitas bangsa tetap kokoh sekaligus mampu bersanding setara di panggung global.',
    ],
    exampleInLife:
      'Ketika AI generatif dan siaran langsung sudah dipakai hampir seluruh siswa tetapi aturan etika privasi dan kejujuran akademik tertinggal, terjadilah cultural lag yang perlu diatasi lewat literasi etika digital dan kearifan lokal.',
    diagramType: 'identity',
    position: { x: 23.2, y: 0.82, z: -40.4 },
  },
  {
    id: 'book_10_ketimpangan',
    roomId: 'world_economy_room',
    title: 'Ketimpangan Global & Teori Sistem Dunia Wallerstein',
    topicLabel: '10. Ketimpangan Sistem Dunia',
    chapterHint: 'Chapter 4 — World Economy Room',
    accentHex: '#b91c1c',
    summary:
      'Teori Sistem Dunia Immanuel Wallerstein membagi ekonomi global menjadi negara Core, Semi-Periphery, dan Periphery. Tanpa hilirisasi dan penguasaan IPTEK, pembagian kerja timpang melahirkan ketergantungan dan neokolonialisme ekonomi.',
    keyPoints: [
      'Tiga zona Sistem Dunia Wallerstein: (1) Negara Core (Pusat): menguasai modal finansial, hak paten teknologi tinggi & industri jasa dominan; (2) Negara Semi-Periphery: negara industri baru penengah yang mulai memproduksi barang manufaktur; (3) Negara Periphery (Pinggiran): bergantung pada ekspor bahan mentah murah & tenaga kerja berbiaya rendah.',
      'Empat tahap alur pertukaran timpang (Unequal Exchange): (1) Negara Periphery mengekspor komoditas mentah berharga dasar rendah -> (2) Negara Core mengolahnya menjadi produk berteknologi dan bermerek mahal -> (3) Produk jadi bernilai tinggi diekspor kembali ke negara Periphery -> (4) Surplus keuntungan dan modal menumpuk lebih besar di negara Core.',
      'Risiko Neokolonialisme Ekonomi: sekalipun negara berkembang memiliki cadangan mineral strategis melimpah (seperti nikel dan lithium), jika seluruh lisensi teknologi baterai, paten perangkat lunak, dan kendali harga dipegang korporasi negara maju, ketergantungan ekonomi tetap terjadi.',
      'Evaluasi kritis: globalisasi TIDAK otomatis membuat negara berkembang langsung sejajar kekayaannya dengan negara maju; tanpa kebijakan hilirisasi, penguasaan teknologi, dan penguatan SDM, ketimpangan justru dapat melebar.',
    ],
    exampleInLife:
      'Negara penghasil nikel dan lithium mendorong hilirisasi industri baterai dan pengembangan paten riset lokal agar tidak terus mengekspor bijih mentah murah lalu mengimpor kendaraan listrik mahal.',
    diagramType: 'inequality',
    position: { x: -22.95, y: 0.82, z: -31.7 },
  },
  {
    id: 'book_11_komunikasi',
    roomId: 'communication_room',
    title: 'Revolusi Komunikasi Global, Media Digital & Interaksi Sosial',
    topicLabel: '11. Globalisasi Komunikasi & Media',
    chapterHint: 'Chapter 3 — Communication Room',
    accentHex: '#0ea5e9',
    summary:
      'Revolusi infrastruktur komunikasi—dari pos dan telegram bawah laut hingga kabel serat optik, 5G, satelit orbit rendah, dan media sosial real-time—mengubah cara manusia bertukar informasi serta membentuk interaksi sosial baru.',
    keyPoints: [
      'Empat tahapan evolusi teknologi komunikasi global: (1) Kurir Pos & Telegram Kabel Bawah Laut Awal -> (2) Siaran Radio & Televisi Satelit Satu Arah -> (3) Jaringan Internet Kabel Serat Optik & Surel -> (4) Media Sosial Real-Time & Telekonferensi AI Lintas Bahasa.',
      'Dampak infrastruktur modern: pembangunan kabel serat optik bawah laut, jaringan 5G, dan konstelasi satelit orbit rendah membuat pertukaran berita, informasi, dan kolaborasi kerja jarak jauh (remote work) lintas benua berlangsung dalam hitungan milidetik.',
      'Tantangan sosial arus informasi cepat tanpa literasi memadai: cepatnya penyebaran disinformasi (hoaks), polarisasi opini publik, dan terjebaknya pengguna dalam gelembung informasi (echo chamber).',
      'Perubahan interaksi sosial di era digital: interaksi primer tatap muka tetap penting sementara interaksi sekunder virtual meluas secara global; solidaritas sosial lintas negara tumbuh melalui kampanye digital kemanusiaan & lingkungan; muncul profesi digital baru (kreator konten lintas budaya, analis data jarak jauh)—namun kesenjangan akses internet (digital divide) antarwilayah masih tetap ada.',
    ],
    exampleInLife:
      'Tim relawan lintas negara mengoordinasikan bantuan kemanusiaan lewat rapat video real-time dalam hitungan detik, sembari menerapkan verifikasi fakta agar terhindar dari hoaks dan echo chamber.',
    diagramType: 'communication',
    position: { x: -15.2, y: 0.87, z: -16.65 },
  },
];

export const THEORY_BOOK_MAP: Record<TheoryBookId, TheoryBookDef> = THEORY_BOOKS.reduce(
  (acc, book) => {
    acc[book.id] = book;
    return acc;
  },
  {} as Record<TheoryBookId, TheoryBookDef>
);

/**
 * Mandatory mapping between each mission (10 missions across 10 mission rooms)
 * and the Theory Book(s) that MUST be read and confirmed via "Selesai Membaca"
 * before accessing or completing that mission's quiz.
 */
export const MISSION_REQUIRED_BOOKS: Record<MissionId, TheoryBookId[]> = {
  ch1_m1: ['book_2_karakteristik'], // navigation_room
  ch1_m2: ['book_1_pengertian', 'book_3_hyperglobalist'], // central_lobby
  ch2_m1: ['book_4_transformasionalis'], // cultural_room
  ch2_m2: ['book_6_glokalisasi'], // global_exchange_room
  ch3_m1: ['book_11_komunikasi'], // communication_room
  ch3_m2: ['book_8_dampak_sosbud'], // technology_lab
  ch4_m1: ['book_7_dampak_ekonomi'], // economic_room
  ch4_m2: ['book_10_ketimpangan'], // world_economy_room
  ch5_m1: ['book_9_identitas_budaya'], // cultural_identity_room
  ch5_m2: ['book_5_skeptis'], // global_balance_room
};

export function getRequiredBookIdsForMission(missionId: MissionId): TheoryBookId[] {
  return MISSION_REQUIRED_BOOKS[missionId] || [];
}

export function getBooksForMission(missionId: MissionId): TheoryBookDef[] {
  return getRequiredBookIdsForMission(missionId)
    .map((id) => THEORY_BOOK_MAP[id])
    .filter(Boolean);
}

export function getBooksForRoom(roomId: RoomId): TheoryBookDef[] {
  return THEORY_BOOKS.filter((b) => b.roomId === roomId);
}

export function areRequiredBooksRead(
  missionId: MissionId,
  readBooks: readonly TheoryBookId[] = []
): boolean {
  const required = getRequiredBookIdsForMission(missionId);
  if (required.length === 0) return true;
  const readSet = new Set(readBooks);
  return required.every((bookId) => readSet.has(bookId));
}

export function getUnreadBooksForMission(
  missionId: MissionId,
  readBooks: readonly TheoryBookId[] = []
): TheoryBookDef[] {
  const readSet = new Set(readBooks);
  return getBooksForMission(missionId).filter((b) => !readSet.has(b.id));
}

export function getMissionBookProgress(
  missionId: MissionId,
  readBooks: readonly TheoryBookId[] = []
): { readCount: number; totalCount: number; allRead: boolean } {
  const required = getRequiredBookIdsForMission(missionId);
  const readSet = new Set(readBooks);
  const readCount = required.filter((id) => readSet.has(id)).length;
  return {
    readCount,
    totalCount: required.length,
    allRead: required.length === 0 || readCount >= required.length,
  };
}

export function computeRoomLearningStatus(params: {
  roomId: RoomId;
  missionId?: MissionId;
  missionChapter?: ChapterId;
  isMultiplayer: boolean;
  unlockedChapter: ChapterId;
  completedMissions: readonly string[];
  lockedRooms: readonly RoomId[];
  activeMissionRoomId: RoomId | null;
  activeTheoryBookId: TheoryBookId | null;
  readBooks: readonly TheoryBookId[];
  allChaptersDone?: boolean;
  quizCompleted?: boolean;
}): RoomMissionStatus {
  const {
    roomId,
    missionId,
    missionChapter,
    isMultiplayer,
    unlockedChapter,
    completedMissions,
    lockedRooms,
    activeMissionRoomId,
    activeTheoryBookId,
    readBooks,
    allChaptersDone = false,
    quizCompleted = false,
  } = params;

  if (roomId === 'earth_observation_room' && !isMultiplayer) {
    if (quizCompleted) return 'completed';
    return allChaptersDone ? 'ready_quiz' : 'locked_chapter';
  }

  if (!missionId) {
    return 'ready_quiz';
  }

  if (activeMissionRoomId === roomId) {
    return 'in_progress';
  }

  if (completedMissions.includes(missionId)) {
    if (!isMultiplayer && lockedRooms.includes(roomId)) {
      return 'completed_locked';
    }
    return 'completed';
  }

  if (!isMultiplayer && missionChapter && missionChapter > unlockedChapter) {
    return 'locked_chapter';
  }

  const requiredIds = getRequiredBookIdsForMission(missionId);
  if (activeTheoryBookId && requiredIds.includes(activeTheoryBookId)) {
    return 'reading';
  }

  if (areRequiredBooksRead(missionId, readBooks)) {
    return 'ready_quiz';
  }

  return 'unread';
}
