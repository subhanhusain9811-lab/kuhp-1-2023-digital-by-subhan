/* ============================================================
   Tipe data kanonik KUHP DIGITAL
   Bentuk ini mengikuti keluaran scripts/build_canonical.py
   ============================================================ */

export type BukuKode = 'BUKU KESATU' | 'BUKU KEDUA'

export interface Huruf {
  label: string
  teks: string
}

export interface Ayat {
  nomor: number | null
  teks: string
  huruf: Huruf[]
}

/** ['lama'|'singkat', "5 (lima)"] */
export type PenjaraItem = ['lama' | 'singkat', string]
/** ['banyak'|'sedikit', "V", "Rp500.000.000"] */
export type DendaItem = ['banyak' | 'sedikit', string | null, string | null]

export interface Ancaman {
  penjara: PenjaraItem[] | null
  denda: DendaItem[] | null
  mati: boolean
  seumurHidup: boolean
  pengawasan: boolean
  kerjaSosial: boolean
  tutupan: boolean
  pencabutanHak: boolean
  perampasan: boolean
  raw?: string[]
}

export interface Rujukan {
  pasal: number
  ayat: number | null
  sumber: ('teks' | 'penjelasan')[]
  jenis: 'rujukan_resmi'
}

export interface Pasal {
  nomor: number
  buku: BukuKode
  bab: string
  babJudul: string
  bagian: string | null
  bagianJudul: string | null
  paragraf: number | null
  paragrafJudul: string | null
  teks: string
  penjelasan: string
  ayat: Ayat[]
  ancaman: Ancaman
  rujukan: Rujukan[]
  kataKunci: string[]
  adaKoreksi: boolean
  jumlahKoreksi: number
}

export interface ParagrafNode {
  no: number
  judul: string
  pasal: number[]
}

export interface BagianNode {
  nama: string | null
  judul: string | null
  mulai: number | null
  selesai: number | null
  paragraf: ParagrafNode[]
}

export interface BabNode {
  kode: string
  nomor: number
  judul: string
  buku: BukuKode
  mulai: number
  selesai: number
  jumlahPasal: number
  bagian: BagianNode[]
}

export interface Statistik {
  buku: number
  bab: number
  bagian: number
  paragraf: number
  pasal: number
  ayat: number
  huruf: number
  penjelasanCukupJelas: number
  kataRedaksi: number
  kataPenjelasan: number
  rujukanSilang: number
  pasalDikoreksi: number
}

export interface BukuInfo {
  kode: BukuKode
  judul: string
  mulai: number
  selesai: number
  jumlahBab: number
}

export interface MetaKUHP {
  produk: string
  tagline: string
  dasarHukum: string
  nomor: string
  diundangkan: string
  lembaranNegara: string
  mulaiBerlaku: string
  versiData: string
  tanggalBangun: string
  statistik: Statistik
  bukuDaftar: BukuInfo[]
  sumber: { utama: string; verifikasi: string; metode: string }
}

export interface KuhpData {
  meta: MetaKUHP
  hierarki: BabNode[]
  pasal: Pasal[]
}

/* ---------- Log koreksi audit ---------- */
export interface KoreksiEntri {
  pasal: number
  field: 'teks' | 'penjelasan'
  jenis: string
  tingkat: 'kritis' | 'tinggi' | 'sedang' | 'rendah'
  catatan: string
  redaksiFile: string
  redaksiResmi: string
  dikoreksiPenuh: boolean
}

export interface KoreksiData {
  meta: MetaKUHP
  log: KoreksiEntri[]
  integritas?: {
    ringkasan?: Record<string, number>
    temuanAudit?: Record<string, unknown>
  }
}

/* ---------- Pencarian ---------- */
export type JenisCocok = 'nomor' | 'redaksional' | 'fuzzy' | 'semantik'

export interface HasilCari {
  pasal: Pasal
  skor: number
  jenis: JenisCocok[]
  kutipan: string
  sorotan: string[]
  alasan: string
  ayatNomor: number | null
  hurufLabel: string | null
}

/* ---------- Data pengguna (lokal) ---------- */
export interface Bookmark {
  id: string
  pasal: number
  ayat: number | null
  catatan: string
  dibuat: number
  tag: string[]
}

export interface RiwayatBaca {
  pasal: number
  ayat: number | null
  dibaca: number
}

export interface CatatanPribadi {
  id: string
  pasal: number
  ayat: number | null
  huruf: string | null
  isi: string
  label: string[]
  dibuat: number
  diubah: number
}

export interface AnalisisUnsur {
  label: string
  uraian: string
  /** 'redaksi' bila kutipan langsung; 'analisis' bila tafsir pengguna */
  dasar: 'redaksi' | 'analisis'
}

export interface AnalisisHukum {
  id: string
  judul: string
  fakta: string
  pasalTerkait: number[]
  unsur: AnalisisUnsur[]
  catatan: string
  dibuat: number
  diubah: number
}

export type Tema = 'terang' | 'gelap' | 'sistem'

export interface Preferensi {
  ukuranHuruf: number
  lebarBaca: number
  jarakBaris: number
  modeFokus: boolean
  tampilkanPenjelasan: boolean
  tampilkanAncaman: boolean
  tampilkanKoreksi: boolean
  tampilkanRujukan: boolean
  simpanRiwayat: boolean
}

/* ---------- Navigasi internal (hash router) ---------- */
export type Rute =
  | { nama: 'dashboard' }
  | { nama: 'baca'; pasal: number; ayat?: number | null }
  | { nama: 'daftar-isi' }
  | { nama: 'cari'; q?: string }
  | { nama: 'pustaka' }
  | { nama: 'pemetaan' }
  | { nama: 'catatan' }
  | { nama: 'analisis'; id?: string }
  | { nama: 'asisten' }
  | { nama: 'ekspor' }
  | { nama: 'pengaturan' }
  | { nama: 'tentang'; sub?: 'koreksi' | 'sumber' }
