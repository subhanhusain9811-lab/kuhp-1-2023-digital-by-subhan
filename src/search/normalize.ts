/* ============================================================
   M2 · Pencarian — Normalisasi & Stemmer Bahasa Indonesia ringan
   ============================================================ */

const DIACRITICS = /[\u0300-\u036f]/g

/** Normalisasi dasar: huruf kecil, tanpa diakritik, tanda baca -> spasi. */
export function norm(teks: string): string {
  return teks
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function tokenize(teks: string): string[] {
  const n = norm(teks)
  return n ? n.split(' ') : []
}

/* ---------- Stopwords (kata umum yang tidak informatif untuk kueri) ---------- */
export const STOPWORDS = new Set([
  'yang', 'dan', 'atau', 'untuk', 'dengan', 'pada', 'dari', 'dalam', 'terhadap',
  'oleh', 'sebagai', 'tidak', 'dapat', 'dilakukan', 'karena', 'telah', 'juga',
  'akan', 'bila', 'jika', 'apabila', 'setiap', 'orang', 'itu', 'ini', 'tersebut',
  'adalah', 'merupakan', 'secara', 'suatu', 'satu', 'dua', 'paling', 'lama',
  'singkat', 'tahun', 'bulan', 'pidana', 'denda', 'kategori', 'barang', 'ayat',
  'huruf', 'pasal', 'sebagaimana', 'dimaksud', 'para', 'bagi', 'saat', 'ketika',
  'maka', 'sudah', 'sedang', 'masih', 'hanya', 'saja', 'agar', 'supaya', 'oleh',
  'kepada', 'mengenai', 'tentang', 'antara', 'lain', 'lainnya', 'hal', 'cara',
])

/* ---------- Stemmer ringan (pemangkasan imbuhan) ----------
   Bukan stemmer Sastrawi penuh; cukup untuk menyatukan variasi bentuk
   yang lazim dalam teks hukum: meN-, di-, ter-, ber-, peN-, -kan, -an, -nya. */

const AWALAN = [
  // di-/ter-/ber- dulu agar tidak bertabrakan dengan meN-/peN-
  'memper', 'diper', 'pember',
  'menge', 'meng', 'meny', 'mem', 'men',
  'peng', 'peny', 'pem', 'pen',
  'berke', 'ber', 'ter', 'di', 'per', 'ke', 'se',
]

const AKHIRAN = ['kannya', 'annya', 'nya', 'kan', 'an']

/**
 * Stemmer ringan bahasa Indonesia untuk teks hukum.
 * Hanya melepas imbuhan yang lazim dan aman; sisa kata minimum 4 huruf
 * agar tidak merusak kata dasar pendek.
 */
export function stem(kata: string): string {
  let w = kata
  if (w.length <= 4) return w

  // 1. akhiran (satu lapis)
  for (const a of AKHIRAN) {
    if (w.length - a.length >= 4 && w.endsWith(a)) {
      w = w.slice(0, -a.length)
      break
    }
  }

  // 2. awalan (satu lapis, dengan cadangan satu lapis untuk ber-ke/se-)
  let terpakai = ''
  for (const a of AWALAN) {
    if (w.length - a.length >= 4 && w.startsWith(a)) {
      w = w.slice(a.length)
      terpakai = a
      break
    }
  }

  // 3. normalisasi sisa nasal: meN-/peN- + huruf awal s -> meny-/peny-
  if (terpakai === 'meny' || terpakai === 'peny') {
    if (w.startsWith('y')) w = 's' + w.slice(1)        // "yakit" -> "sakit"
    else if (/^[aiueo]/.test(w)) w = 's' + w            // "erta" -> "serta"
  }
  // Catatan: pemulihan huruf "k" (meng- + kirim) sengaja TIDAK dilakukan
  // karena merusak kata yang memang berawalan vokal (mengambil -> kambil).
  // Kasus sisa ditangani rute fuzzy + sinonim.

  return w
}

/* ---------- Alih-kata (sinonim) untuk memperluas recall ---------- */
export const SINONIM: Record<string, string[]> = {
  curi: ['ambil', 'gelap', 'rampas'],
  tipu: ['bohong', 'palsu', 'muslihat', 'curang'],
  nipu: ['tipu', 'bohong'],
  palsu: ['tipu', 'palsu', 'laku'],
  bunuh: ['nyawa', 'rampas'],
  aniaya: ['luka', 'tubuh', 'kekerasan'],
  hina: ['cemar', 'fitnah', 'nama', 'hormat'],
  zina: ['susila', 'cabul', 'setubuh'],
  korupsi: ['suap', 'gratifikasi', 'jabatan', 'rugi'],
  narkotika: ['narkoba', 'psikotropika', 'zat'],
  sertifikat: ['surat', 'akta'],
  utang: ['piutang', 'kredit'],
  kendaraan: ['kapal', 'pesawat', 'barang'],
  anak: ['belum', 'dewasa'],
  mayat: ['jenazah', 'makam'],
}

export function stemTokens(tokens: string[]): string[] {
  return tokens.map(stem)
}

/* ---------- Trigram untuk pencarian fuzzy ---------- */
export function trigram(kata: string): string[] {
  const s = ` ${kata} `
  const out: string[] = []
  for (let i = 0; i < s.length - 2; i++) out.push(s.slice(i, i + 3))
  return out
}

export function trigramSet(kata: string): Set<string> {
  return new Set(trigram(kata))
}

/** Dice coefficient antara dua himpunan trigram (0..1). */
export function dice(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let inter = 0
  for (const t of a) if (b.has(t)) inter++
  return (2 * inter) / (a.size + b.size)
}

/** Jarak Levenshtein dengan pemotongan lebih awal. */
export function lev(a: string, b: string, maks = 3): number {
  if (a === b) return 0
  const la = a.length, lb = b.length
  if (Math.abs(la - lb) > maks) return maks + 1
  let prev = new Array(lb + 1)
  let cur = new Array(lb + 1)
  for (let j = 0; j <= lb; j++) prev[j] = j
  for (let i = 1; i <= la; i++) {
    cur[0] = i
    let baris = Infinity
    for (let j = 1; j <= lb; j++) {
      const biaya = a[i - 1] === b[j - 1] ? 0 : 1
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + biaya)
      if (cur[j] < baris) baris = cur[j]
    }
    if (baris > maks) return maks + 1
    ;[prev, cur] = [cur, prev]
  }
  return prev[lb]
}
