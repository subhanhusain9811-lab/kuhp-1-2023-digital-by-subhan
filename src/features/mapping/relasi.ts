/* ============================================================
   M7 · PEMETAAN HUKUM
   - pasalTerkait(): kemiripan kata kunci (SARAN, bukan rujukan resmi)
   - kelompok topik: berdasarkan nomenklatur bab resmi
   - klasifikasi unsur & ancaman: hanya dari penanda yang ADA di redaksi
   Tidak ada unsur atau ancaman yang dikarang.
   ============================================================ */
import { db, htmlKeTeks } from '@/lib/data'
import { norm, stem, STOPWORDS } from '@/search/normalize'
import type { Pasal } from '@/lib/types'

/* ---------- Kemiripan kata kunci ---------- */
let cache: Map<number, { pasal: Pasal; skor: number }[]> | null = null

export function pasalTerkait(nomor: number, batas = 6): { pasal: Pasal; skor: number }[] {
  if (!cache) bangunCache()
  return (cache!.get(nomor) ?? []).slice(0, batas)
}

function bangunCache() {
  cache = new Map()

  /* Kemiripan kosinus tf-idf atas kata isi redaksi (stopwords dibuang,
     imbuhan dinormalkan). Vektor dinormalkan agar pasal panjang tidak
     otomatis mirip dengan semua pasal lain. */

  const vektor = new Map<number, Map<string, number>>()
  const df = new Map<string, number>()

  for (const p of db.pasal) {
    const teks = norm(`${htmlKeTeks(p.teks)} ${p.babJudul}`)
    const tf = new Map<string, number>()
    for (const t of teks.split(' ')) {
      if (t.length < 4 || STOPWORDS.has(t) || /^\d+$/.test(t)) continue
      const s = stem(t)
      if (s.length < 4) continue
      tf.set(s, (tf.get(s) ?? 0) + 1)
    }
    vektor.set(p.nomor, tf)
    for (const k of tf.keys()) df.set(k, (df.get(k) ?? 0) + 1)
  }

  const idf = (k: string) => Math.log(1 + db.total / (df.get(k) ?? 1))

  // indeks terbalik kata -> pasal
  const pos = new Map<string, number[]>()
  for (const [nomor, tf] of vektor) {
    for (const k of tf.keys()) {
      if (!pos.has(k)) pos.set(k, [])
      pos.get(k)!.push(nomor)
    }
  }

  // vektor bobot + norma
  const bobot = new Map<number, Map<string, number>>()
  const norma = new Map<number, number>()
  for (const [nomor, tf] of vektor) {
    const w = new Map<string, number>()
    let n2 = 0
    for (const [k, f] of tf) {
      const nilai = (1 + Math.log(f)) * idf(k)
      w.set(k, nilai)
      n2 += nilai * nilai
    }
    bobot.set(nomor, w)
    norma.set(nomor, Math.sqrt(n2) || 1)
  }

  for (const p of db.pasal) {
    const titik = new Map<number, number>()
    for (const [k, wp] of bobot.get(p.nomor)!) {
      if ((df.get(k) ?? db.total) < 3) continue // kata yang terlalu khas tidak menolong
      for (const nomor of pos.get(k) ?? []) {
        if (nomor === p.nomor) continue
        titik.set(nomor, (titik.get(nomor) ?? 0) + wp * bobot.get(nomor)!.get(k)!)
      }
    }

    const kandidat: { pasal: Pasal; skor: number }[] = []
    for (const [nomor, dot] of titik) {
      const q = db.get(nomor)!
      let kos = dot / (norma.get(p.nomor)! * norma.get(nomor)!)
      if (q.bab === p.bab) kos = Math.min(1, kos * 1.08)
      if (kos >= 0.18) kandidat.push({ pasal: q, skor: kos })
    }

    kandidat.sort((a, b) => b.skor - a.skor)
    cache.set(p.nomor, kandidat.slice(0, 12))
  }
}

/* ---------- Kelompok topik berdasarkan bab resmi ---------- */
export interface Topik {
  id: string
  nama: string
  buku: string
  bab: string[]
  pasal: number[]
  keterangan: string
}

export const TOPIK: Topik[] = [
  { id: 'asas', nama: 'Asas & Ruang Lingkup', buku: 'Buku Kesatu', bab: ['I'], pasal: [], keterangan: 'Legalitas, wilayah, dan waktu berlakunya ketentuan pidana.' },
  { id: 'pertanggungjawaban', nama: 'Pertanggungjawaban Pidana', buku: 'Buku Kesatu', bab: ['II'], pasal: [], keterangan: 'Percobaan, penyertaan, alasan penghapus pidana.' },
  { id: 'pemidanaan', nama: 'Pemidanaan', buku: 'Buku Kesatu', bab: ['III'], pasal: [], keterangan: 'Jenis pidana, pedoman pemidanaan, perbarengan.' },
  { id: 'gugur', nama: 'Gugurnya Kewenangan Menuntut', buku: 'Buku Kesatu', bab: ['IV'], pasal: [], keterangan: 'Kedaluwarsa dan sebab hapusnya penuntutan/pemidanaan.' },
  { id: 'istilah', nama: 'Pengertian Istilah', buku: 'Buku Kesatu', bab: ['V'], pasal: [], keterangan: 'Definisi istilah yang berlaku di seluruh KUHP.' },
  { id: 'negara', nama: 'Keamanan Negara', buku: 'Buku Kedua', bab: ['I', 'II', 'III', 'IV'], pasal: [], keterangan: 'Makar, keamanan negara, martabat presiden, negara sahabat.' },
  { id: 'ketertiban', nama: 'Ketertiban Umum', buku: 'Buku Kedua', bab: ['V'], pasal: [], keterangan: 'Simbol negara, penghasutan, perizinan, ketertiban.' },
  { id: 'peradilan', nama: 'Proses Peradilan', buku: 'Buku Kedua', bab: ['VI'], pasal: [], keterangan: 'Menghalangi peradilan, saksi, korban.' },
  { id: 'agama', nama: 'Agama & Kepercayaan', buku: 'Buku Kedua', bab: ['VII'], pasal: [], keterangan: 'Penodaan agama dan kehidupan beragama.' },
  { id: 'keamanan-umum', nama: 'Keamanan Umum', buku: 'Buku Kedua', bab: ['VIII'], pasal: [], keterangan: 'Kebakaran, ledakan, senjata, informatika, organ tubuh.' },
  { id: 'pemerintahan', nama: 'Kekuasaan Pemerintahan', buku: 'Buku Kedua', bab: ['IX'], pasal: [], keterangan: 'Perbuatan terhadap pejabat dan kekuasaan pemerintahan.' },
  { id: 'keterangan-palsu', nama: 'Keterangan Palsu', buku: 'Buku Kedua', bab: ['X'], pasal: [], keterangan: 'Keterangan palsu di bawah sumpah.' },
  { id: 'mata-uang', nama: 'Mata Uang', buku: 'Buku Kedua', bab: ['XI', 'XII'], pasal: [], keterangan: 'Pemalsuan mata uang dan bahan cetak.' },
  { id: 'dokumen', nama: 'Dokumen & Meterai', buku: 'Buku Kedua', bab: ['XIII', 'XIV'], pasal: [], keterangan: 'Pemalsuan surat, akta, dan meterai.' },
  { id: 'kesusilaan', nama: 'Kesusilaan', buku: 'Buku Kedua', bab: ['XV'], pasal: [], keterangan: 'Perzinaan, pornografi, dan perbuatan cabul.' },
  { id: 'nama-baik', nama: 'Nama Baik & Kehormatan', buku: 'Buku Kedua', bab: ['XVI', 'XVII'], pasal: [], keterangan: 'Pencemaran nama baik, fitnah, penghinaan.' },
  { id: 'rahasia', nama: 'Rahasia & Kemerdekaan', buku: 'Buku Kedua', bab: ['XVIII', 'XIX'], pasal: [], keterangan: 'Rahasia orang, perampasan kemerdekaan, penyanderaan.' },
  { id: 'nyawa-tubuh', nama: 'Nyawa, Tubuh, Kesehatan', buku: 'Buku Kedua', bab: ['XX', 'XXI', 'XXII', 'XXIII'], pasal: [], keterangan: 'Pembunuhan, aborsi, penganiayaan, kealpaan.' },
  { id: 'harta', nama: 'Harta Benda', buku: 'Buku Kedua', bab: ['XXIV', 'XXV', 'XXVI', 'XXVII', 'XXVIII', 'XXIX'], pasal: [], keterangan: 'Pencurian, pemerasan, penggelapan, penipuan, perusakan.' },
  { id: 'jabatan', nama: 'Tindak Pidana Jabatan', buku: 'Buku Kedua', bab: ['XXX'], pasal: [], keterangan: 'Penyalahgunaan jabatan dan kewenangan.' },
  { id: 'transportasi', nama: 'Pelayaran & Penerbangan', buku: 'Buku Kedua', bab: ['XXXI', 'XXXII'], pasal: [], keterangan: 'Tindak pidana di bidang pelayaran dan penerbangan.' },
  { id: 'penadahan', nama: 'Penadahan', buku: 'Buku Kedua', bab: ['XXXIII'], pasal: [], keterangan: 'Menyimpan/membeli barang hasil tindak pidana.' },
  { id: 'adat', nama: 'Hukum yang Hidup', buku: 'Buku Kedua', bab: ['XXXIV'], pasal: [], keterangan: 'Perbuatan terlarang menurut hukum dalam masyarakat.' },
  { id: 'khusus', nama: 'Tindak Pidana Khusus', buku: 'Buku Kedua', bab: ['XXXV'], pasal: [], keterangan: 'HAM berat, terorisme, korupsi, pencucian uang, narkotika.' },
]

for (const t of TOPIK) {
  const babSet = new Set(t.bab)
  t.pasal = db.pasal
    .filter(p => (t.buku === 'Buku Kesatu' ? p.buku === 'BUKU KESATU' : p.buku === 'BUKU KEDUA') && babSet.has(p.bab))
    .map(p => p.nomor)
}

/* ---------- Klasifikasi berdasarkan penanda redaksi ---------- */

/** Unsur subjektif ditandai frasa yang benar-benar ada di redaksi. */
const PENANDA_SUBJEKTIF = [
  { id: 'sengaja', label: 'Kesengajaan', pola: /\bdengan sengaja\b/i },
  { id: 'maksud', label: 'Maksud / niat', pola: /\bdengan maksud\b/i },
  { id: 'rencana', label: 'Rencana terlebih dahulu', pola: /\brencana terlebih dahulu\b/i },
  { id: 'mengetahui', label: 'Mengetahui', pola: /\bmengetahui\b/i },
  { id: 'menyadari', label: 'Menyadari', pola: /\bmenyadari\b/i },
  { id: 'tujuan', label: 'Tujuan tertentu', pola: /\bbertujuan\b/i },
  { id: 'kealpaan', label: 'Kealpaan / kelalaian', pola: /\bkealpaan\b|\bkelalaian\b|\bkarena kealpaan\b/i },
  { id: 'takut', label: 'Motif takut diketahui', pola: /\bkarena takut\b/i },
]

/** Unsur objektif: struktur perbuatan yang dinyatakan pasal. */
const PENANDA_OBJEKTIF = [
  { id: 'mengambil', label: 'Perbuatan mengambil', pola: /\bmengambil\b/i },
  { id: 'merampas', label: 'Perbuatan merampas', pola: /\bmerampas\b/i },
  { id: 'merusak', label: 'Perbuatan merusak', pola: /\bmerusak\b|\bmenghancurkan\b/i },
  { id: 'memalsu', label: 'Perbuatan memalsu', pola: /\bmemalsu\b|\bdipalsukan\b/i },
  { id: 'memaksa', label: 'Perbuatan memaksa', pola: /\bmemaksa\b/i },
  { id: 'mengancam', label: 'Ancaman', pola: /\bmengancam\b|\bancaman\b/i },
  { id: 'kekerasan', label: 'Kekerasan', pola: /\bkekerasan\b/i },
  { id: 'menyerahkan', label: 'Penyerahan barang', pola: /\bmenyerahkan\b/i },
  { id: 'memiliki', label: 'Maksud memiliki', pola: /\buntuk dimiliki\b|\bseolah-olah\b|\bmilik sendiri\b/i },
  { id: 'melawan-hukum', label: 'Melawan hukum', pola: /\bmelawan hukum\b/i },
  { id: 'menyesatkan', label: 'Menyesatkan', pola: /\bmenyesatkan\b|\btipu\b|\bcurang\b/i },
  { id: 'barang', label: 'Objek berupa barang', pola: /\bBarang\b/i },
  { id: 'nyawa', label: 'Objek nyawa orang', pola: /\bnyawa\b/i },
  { id: 'tubuh', label: 'Objek tubuh/pesehatan', pola: /\btubuh\b|\bluka\b|\bpenganiayaan\b/i },
  { id: 'pegawai', label: 'Objek pejabat', pola: /\bPejabat\b/i },
  { id: 'dokumen', label: 'Objek surat/akta', pola: /\bSurat\b|\bAkta\b/i },
]

/** Subjek hukum yang disebut eksplisit. */
const PENANDA_SUBJEK = [
  { id: 'setiap-orang', label: 'Setiap Orang', pola: /\bSetiap Orang\b/ },
  { id: 'pejabat', label: 'Pejabat', pola: /\bPejabat\b/ },
  { id: 'korporasi', label: 'Korporasi', pola: /\bKorporasi\b/ },
  { id: 'nakhoda', label: 'Nakhoda', pola: /\bNakhoda\b/ },
  { id: 'ibu', label: 'Ibu', pola: /\b(seorang )?ibu\b/i },
  { id: 'anak', label: 'Anak', pola: /\banak\b/i },
  { id: 'saksi', label: 'Saksi / ahli', pola: /\bsaksi\b|\bahli\b/i },
  { id: 'pengurus', label: 'Pengurus / komisaris', pola: /\bpengurus\b|\bkomisaris\b/i },
]

export interface Klasifikasi {
  subjektif: string[]
  objektif: string[]
  subjek: string[]
  ancaman: string[]
}

export function klasifikasi(p: Pasal): Klasifikasi {
  const teks = htmlKeTeks(p.teks) + ' ' + htmlKeTeks(p.penjelasan)
  const ambil = (daftar: { id: string; label: string; pola: RegExp }[]) =>
    daftar.filter(x => x.pola.test(teks)).map(x => x.label)

  const ancaman: string[] = []
  if (p.ancaman.mati) ancaman.push('Pidana mati')
  if (p.ancaman.seumurHidup) ancaman.push('Penjara seumur hidup')
  for (const [jenis, nilai] of p.ancaman.penjara ?? []) {
    ancaman.push(`Penjara ${jenis === 'lama' ? 'paling lama' : 'paling singkat'} ${nilai} tahun`)
  }
  for (const item of p.ancaman.denda ?? []) {
    const arah = item[0] === 'banyak' ? 'paling banyak' : 'paling sedikit'
    ancaman.push(`Denda ${arah} kategori ${item[1] ?? '—'}`)
  }
  if (p.ancaman.pengawasan) ancaman.push('Pidana pengawasan')
  if (p.ancaman.kerjaSosial) ancaman.push('Pidana kerja sosial')
  if (p.ancaman.tutupan) ancaman.push('Pidana tutupan')
  if (p.ancaman.pencabutanHak) ancaman.push('Pencabutan hak tertentu')
  if (p.ancaman.perampasan) ancaman.push('Perampasan barang')

  return {
    subjektif: ambil(PENANDA_SUBJEKTIF),
    objektif: ambil(PENANDA_OBJEKTIF),
    subjek: ambil(PENANDA_SUBJEK),
    ancaman,
  }
}

/* ---------- Pemberatan & peringanan: hanya penanda eksplisit ---------- */
const PENANDA_BERAT = [
  { label: 'Dilakukan terhadap keluarga/kerabat', pola: /\bibu, Ayah, istri, suami, atau anaknya\b/i },
  { label: 'Dilakukan oleh/terhadap pejabat', pola: /\bPejabat\b/ },
  { label: 'Dilakukan dengan kekerasan', pola: /\bkekerasan\b/i },
  { label: 'Mengakibatkan luka berat', pola: /\bluka berat\b/i },
  { label: 'Mengakibatkan mati', pola: /\bmengakibatkan (kematian|mati)\b/i },
  { label: 'Pengulangan (diperberat)', pola: /\bdilakukan lagi\b|\bpengulangan\b/i },
  { label: 'Dilakukan dalam jabatan', pola: /\bdalam jabatan\b|\bkarena jabatannya\b/i },
]

const PENANDA_RINGAN = [
  { label: 'Harga barang tidak lebih dari Rp500.000', pola: /\btidak lebih dari Rp500\.000\b/i },
  { label: 'Pencurian ringan', pola: /\bpencurian ringan\b/i },
  { label: 'Penganiayaan ringan', pola: /\bpenganiayaan ringan\b/i },
  { label: 'Percobaan (pidana dikurangi)', pola: /\bpercobaan\b/i },
  { label: 'Pembantuan (pidana dikurangi)', pola: /\bpembantuan\b/i },
]

export function faktorPidana(p: Pasal): { memberatkan: string[]; meringankan: string[] } {
  const teks = htmlKeTeks(p.teks) + ' ' + htmlKeTeks(p.penjelasan)
  return {
    memberatkan: PENANDA_BERAT.filter(x => x.pola.test(teks)).map(x => x.label),
    meringankan: PENANDA_RINGAN.filter(x => x.pola.test(teks)).map(x => x.label),
  }
}
