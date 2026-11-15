/* ============================================================
   M2 · HYBRID SEARCH ENGINE
   4 rute: presisi nomor · BM25 redaksional · fuzzy · semantik konsep
   Digabung dengan Reciprocal Rank Fusion, setiap hasil diberi label
   jenis kecocokan + alasan relevansi yang dapat dibaca.
   ============================================================ */
import { db, htmlKeTeks } from '@/lib/data'
import type { Pasal, HasilCari, JenisCocok } from '@/lib/types'
import { bangunIndeks } from './index'
import { norm, stem, dice, lev, STOPWORDS, trigramSet } from './normalize'
import { SEMUA_PEMICU } from './concepts'

const K1 = 1.5
const B = 0.75

export interface KueriTerurai {
  mentah: string
  nomorPasal: number | null
  nomorAyat: number | null
  huruf: string | null
  tokens: string[]
  frasa: string
  konsep: { id: string; nama: string; pasal: number[]; skor: number; keterangan: string }[]
}

/* ---------- 1. Urai kueri ---------- */
export function uraiKueri(q: string): KueriTerurai {
  const mentah = q.trim()
  const n = norm(mentah)
  let nomorPasal: number | null = null
  let nomorAyat: number | null = null
  let huruf: string | null = null

  // "pasal 476 ayat 2 huruf b" | "476 ayat (2)" | "476" | "pasal476"
  const mPasal = n.match(/(?:pasal\s*)?(\d{1,3})(?!\d)/)
  if (mPasal) {
    const v = parseInt(mPasal[1], 10)
    if (v >= 1 && v <= 624) nomorPasal = v
  }
  const mAyat = n.match(/ayat\s*(\d{1,2})/)
  if (mAyat) nomorAyat = parseInt(mAyat[1], 10)
  const mHuruf = n.match(/huruf\s*([a-z]{1,2})\b/)
  if (mHuruf) huruf = mHuruf[1]

  const tokens = n.split(' ').filter(t => t.length > 0)
  let tokensBermakna = tokens.filter(t => !STOPWORDS.has(t) || /^\d+$/.test(t))
  // bila seluruh kata termasuk stopword (mis. "orang"), jangan kembalikan kosong:
  // pakai kata aslinya agar pengguna tetap mendapat hasil untuk dipersempit.
  if (tokensBermakna.length === 0) tokensBermakna = tokens.filter(t => t.length >= 3)

  // deteksi konsep
  const konsep = deteksiKonsep(n)

  return { mentah, nomorPasal, nomorAyat, huruf, tokens: tokensBermakna, frasa: n, konsep }
}

/* ---------- 2. Deteksi konsep semantik ---------- */
/** Kata tunggal yang terlalu umum: tidak boleh memicu konsep sendirian. */
const PEMICU_TERLALU_UMUM = new Set([
  'izin', 'orang', 'barang', 'tempat', 'waktu', 'kerja', 'kapal', 'anak',
  'darah', 'tenaga', 'tubuh', 'nyawa', 'umum', 'negara', 'surat', 'pidana',
])

function deteksiKonsep(t: string) {
  const hasil: KueriTerurai['konsep'] = []
  const kataKueri = new Set(t.split(' '))
  const stemKueri = new Set([...kataKueri].map(stem))
  const tokenSet = new Set(t.split(' '))

  for (const { frasa, konsep } of SEMUA_PEMICU) {
    const f = norm(frasa)
    const ft = f.split(' ')
    let skor = 0

    // pemicu satu kata: harus cocok sebagai kata utuh, cukup panjang, dan tidak generik
    if (ft.length === 1) {
      if (PEMICU_TERLALU_UMUM.has(ft[0]) || ft[0].length < 5) continue
      // harus cocok sebagai kata UTUH — pencocokan batang kata membuat
      // "perizinan" memicu "izin" dan menyeret pasal yang tidak relevan.
      if (!tokenSet.has(ft[0])) continue
      skor = 0.62
    } else if (t.includes(f)) {
      skor = Math.min(1, 0.55 + 0.1 * ft.length) // frasa utuh
    } else {
      // irisan kata bermakna
      let cocok = 0
      let total = 0
      for (const w of ft) {
        if (STOPWORDS.has(w)) continue
        total++
        if (kataKueri.has(w) || stemKueri.has(stem(w))) cocok++
      }
      if (total > 0) skor = (cocok / total) * 0.75
      // bonus bila kata kunci konsep juga muncul
      if (cocok >= 2) skor += 0.1
    }

    if (skor >= 0.5) {
      const ada = hasil.find(h => h.id === konsep.id)
      if (ada) ada.skor = Math.max(ada.skor, skor)
      else hasil.push({
        id: konsep.id, nama: konsep.nama, pasal: konsep.pasal,
        skor: Math.min(1, skor), keterangan: konsep.keterangan,
      })
    }
  }
  return hasil.sort((a, b) => b.skor - a.skor).slice(0, 4)
}

/* ---------- 3. BM25 redaksional ---------- */
function skorBM25(tokens: string[]): Map<number, number> {
  const idx = bangunIndeks()
  const skor = new Map<number, number>()
  const N = db.total
  const stems = tokens.map(stem).filter(s => s.length >= 2)

  for (const s of stems) {
    const postings = idx.kata.get(s)
    if (!postings) continue
    const df = new Set(postings.map(p => p.nomor)).size
    const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5))
    for (const p of postings) {
      const dl = idx.panjang.get(p.nomor) ?? 1
      const denom = p.tf + K1 * (1 - B + B * (dl / idx.rataPanjang))
      let v = idf * ((p.tf * (K1 + 1)) / denom)
      if (p.bagian === 0) v *= 1.35        // redaksi pasal lebih relevan
      skor.set(p.nomor, (skor.get(p.nomor) ?? 0) + v)
    }
  }

  // bonus frasa eksak
  const frasa = stems.length >= 2 ? stem(frasaJoin(tokens)) : null
  if (frasa) {
    for (const [k, arr] of idx.frasa) {
      if (k === frasa) {
        for (const nomor of arr) skor.set(nomor, (skor.get(nomor) ?? 0) + 12)
        break
      }
    }
  }
  return skor
}

const frasaJoin = (t: string[]) => t.join(' ')

/* ---------- 4. Fuzzy (salah ketik / variasi) ---------- */
function skorFuzzy(tokens: string[]): Map<number, number> {
  const idx = bangunIndeks()
  const hasil = new Map<number, number>()
  for (const t of tokens) {
    if (t.length < 4 || /^\d+$/.test(t)) continue
    const ts = stem(t)
    if (idx.kata.has(ts)) continue // sudah tertangani BM25
    const tg = trigramSet(ts)
    let terbaik = { skor: 0, kata: '' }
    // pencarian kandidat: cocokkan lewat trigram vocab
    for (const v of idx.vocab) {
      if (Math.abs(v.length - ts.length) > 3) continue
      const d = dice(tg, idx.trigramKata.get(v)!)
      if (d > terbaik.skor) terbaik = { skor: d, kata: v }
    }
    if (terbaik.skor < 0.45) continue
    const lv = lev(ts, terbaik.kata, 3)
    const kemiripan = lv <= 1 ? 1 : lv === 2 ? 0.78 : terbaik.skor
    if (kemiripan < 0.5) continue
    for (const p of idx.kata.get(terbaik.kata) ?? []) {
      const v = 6 * kemiripan * (p.bagian === 0 ? 1.2 : 1)
      hasil.set(p.nomor, Math.max(hasil.get(p.nomor) ?? 0, v))
    }
  }
  return hasil
}

/* ---------- 5. Semantik berbasis konsep ---------- */
function skorSemantik(konsep: KueriTerurai['konsep']): Map<number, number> {
  const hasil = new Map<number, number>()
  for (const k of konsep) {
    k.pasal.forEach((nomor, i) => {
      if (!db.get(nomor)) return
      // pasal yang disebut lebih awal dalam konsep = lebih inti (degradasi halus)
      const bobot = 14 * k.skor * Math.max(0.6, 1 - i * 0.012)
      hasil.set(nomor, Math.max(hasil.get(nomor) ?? 0, bobot))
    })
  }
  return hasil
}

/* ---------- 6. Pembuatan kutipan + sorotan ---------- */
function buatKutipan(p: Pasal, q: KueriTerurai): { kutipan: string; sorotan: string[]; ayat: number | null; huruf: string | null } {
  const kataKunci = q.tokens.filter(t => t.length >= 3)

  // bila ada nomor ayat, prioritaskan ayat tersebut
  if (q.nomorAyat != null) {
    const ay = p.ayat.find(a => a.nomor === q.nomorAyat)
    if (ay) {
      const teks = htmlKeTeks(ay.teks)
      return { kutipan: ringkas(teks, kataKunci), sorotan: cocokkanSorot(teks, kataKunci), ayat: q.nomorAyat, huruf: null }
    }
  }

  const penuh = htmlKeTeks(p.teks)
  // cari bagian paling relevan
  if (kataKunci.length === 0) {
    return { kutipan: ringkas(penuh, []), sorotan: [], ayat: null, huruf: null }
  }

  // cari ayat dengan kepadatan kata kunci tertinggi
  let terbaik = { skor: -1, teks: penuh, no: null as number | null }
  for (const a of p.ayat) {
    if (a.nomor == null) continue
    const t = htmlKeTeks(a.teks).toLowerCase()
    let s = 0
    for (const k of kataKunci) if (t.includes(k)) s += 1
    if (s > terbaik.skor) terbaik = { skor: s, teks: t, no: a.nomor }
  }
  const sumber = terbaik.skor > 0 ? terbaik.teks : penuh
  return {
    kutipan: ringkas(sumber, kataKunci),
    sorotan: cocokkanSorot(sumber, kataKunci),
    ayat: terbaik.skor > 0 ? terbaik.no : null,
    huruf: null,
  }
}

function cocokkanSorot(teks: string, kata: string[]): string[] {
  const out: string[] = []
  const low = teks.toLowerCase()
  for (const k of kata) {
    if (k.length < 3) continue
    if (low.includes(k) && !out.includes(k)) out.push(k)
  }
  return out.slice(0, 6)
}

/** Ambil jendela teks di sekitar kemunculan kata kunci pertama. */
function ringkas(teks: string, kata: string[], panjang = 300): string {
  if (teks.length <= panjang) return teks
  const low = teks.toLowerCase()
  let pos = -1
  for (const k of kata) {
    const i = low.indexOf(k)
    if (i >= 0 && (pos < 0 || i < pos)) pos = i
  }
  if (pos < 0) return teks.slice(0, panjang).trim() + '…'
  const mulai = Math.max(0, pos - Math.floor(panjang * 0.35))
  const akhir = Math.min(teks.length, mulai + panjang)
  return (mulai > 0 ? '…' : '') + teks.slice(mulai, akhir).trim() + (akhir < teks.length ? '…' : '')
}

/* ---------- 7. Gabungan (RRF) ---------- */
export interface OpsiCari {
  batas?: number
  hanyaBuku?: string
  hanyaBab?: string
  hanyaKategoriAncaman?: string
}

export function cari(q: string, opsi: OpsiCari = {}): HasilCari[] {
  const batas = opsi.batas ?? 40
  const kueri = uraiKueri(q)
  if (!kueri.mentah) return []

  const skor = new Map<number, number>()
  const jenis = new Map<number, Set<JenisCocok>>()

  const tandai = (nomor: number, v: number, j: JenisCocok) => {
    skor.set(nomor, (skor.get(nomor) ?? 0) + v)
    if (!jenis.has(nomor)) jenis.set(nomor, new Set())
    jenis.get(nomor)!.add(j)
  }

  /* Rute A — presisi nomor pasal */
  if (kueri.nomorPasal != null) {
    const p = db.get(kueri.nomorPasal)
    if (p) {
      tandai(p.nomor, 100, 'nomor')
    }
    // tetangga sebagai saran bila tidak ada kata kunci lain
    if (kueri.tokens.length === 0 && kueri.konsep.length === 0) {
      for (const d of [-1, 1]) {
        const n = kueri.nomorPasal + d
        if (n >= 1 && n <= 624) tandai(n, 6, 'nomor')
      }
    }
  }

  /* Rute B — BM25 */
  if (kueri.tokens.length > 0) {
    for (const [n, v] of skorBM25(kueri.tokens)) {
      if (v > 0.4) tandai(n, v, 'redaksional')
    }
  }

  /* Rute C — fuzzy */
  if (kueri.tokens.length > 0) {
    for (const [n, v] of skorFuzzy(kueri.tokens)) {
      tandai(n, v, 'fuzzy')
    }
  }

  /* Rute D — semantik konsep */
  for (const k of kueri.konsep) {
    for (const [n, v] of skorSemantik([k])) {
      tandai(n, v, 'semantik')
    }
  }

  /* filter */
  let kandidat = [...skor.entries()]
  if (opsi.hanyaBuku || opsi.hanyaBab) {
    kandidat = kandidat.filter(([n]) => {
      const p = db.get(n)!
      if (opsi.hanyaBuku && p.buku !== opsi.hanyaBuku) return false
      if (opsi.hanyaBab && p.bab !== opsi.hanyaBab) return false
      return true
    })
  }

  /* urut + bangun hasil */
  kandidat.sort((a, b) => b[1] - a[1])

  // ambang relatif: buang hasil yang jauh di bawah skor tertinggi agar daftar
  // tidak dipenuhi kecocokan lemah (mis. hanya kata "barang" yang sama).
  if (kandidat.length > 1) {
    const tertinggi = kandidat[0][1]
    const ambang = tertinggi >= 100 ? 0.14 * tertinggi : 0.20 * tertinggi
    kandidat = kandidat.filter(([, v]) => v >= ambang)
  }

  const hasil: HasilCari[] = []

  for (const [nomor, v] of kandidat.slice(0, batas)) {
    const p = db.get(nomor)
    if (!p) continue
    const kut = buatKutipan(p, kueri)
    const j = jenis.get(nomor) ?? new Set<JenisCocok>(['redaksional'])

    // Alasan relevansi: satu kalimat pendek yang menjelaskan MENGAPA hasil ini muncul.
    const bagian: string[] = []
    if (j.has('nomor')) {
      bagian.push(kueri.nomorAyat ? `Nomor pasal ${p.nomor} ayat (${kueri.nomorAyat}) cocok tepat`
        : `Nomor pasal ${p.nomor} cocok tepat`)
    }
    if (j.has('redaksional')) {
      bagian.push(kut.sorotan.length
        ? `Redaksi memuat ${kut.sorotan.slice(0, 3).map(k => `"${k}"`).join(', ')}`
        : 'Kata kunci ditemukan dalam redaksi')
    }
    if (j.has('fuzzy')) {
      bagian.push('Ada kata dalam redaksi yang mirip (toleransi salah ketik)')
    }
    if (j.has('semantik')) {
      const k = kueri.konsep.find(x => x.pasal.includes(nomor))
      bagian.push(k ? `Masuk konsep hukum "${k.nama}"` : 'Relevan secara makna')
    }

    hasil.push({
      pasal: p,
      skor: Math.round(v * 100) / 100,
      jenis: [...j],
      kutipan: kut.kutipan,
      sorotan: kut.sorotan,
      alasan: bagian.join(' · ') || 'Kecocokan redaksional',
      ayatNomor: kut.ayat,
      hurufLabel: kut.huruf,
    })
  }

  return hasil
}

/* ---------- 8. Saran saat kueri kosong / tidak ada hasil ---------- */
export function saranKueri(q: string): string[] {
  const t = norm(q)
  if (!t) return []
  const idx = bangunIndeks()
  const out: string[] = []
  for (const kata of t.split(' ')) {
    if (kata.length < 3 || idx.kata.has(stem(kata))) continue
    const tg = trigramSet(stem(kata))
    let terbaik = { s: 0, k: '' }
    for (const v of idx.vocab) {
      if (Math.abs(v.length - kata.length) > 3) continue
      const d = dice(tg, idx.trigramKata.get(v)!)
      if (d > terbaik.s) terbaik = { s: d, k: v }
    }
    if (terbaik.s > 0.5) out.push(terbaik.k)
  }
  return [...new Set(out)].slice(0, 4)
}

/** Saran konsep populer untuk dashboard. */
export const SARAN_POPULER = [
  'pencurian', 'pembunuhan', 'penganiayaan', 'penipuan', 'penggelapan',
  'pemalsuan surat', 'penghinaan', 'perzinaan', 'korupsi', 'narkotika',
  'alasan pembenar', 'alasan pemaaf', 'percobaan', 'penyertaan', 'perbarengan',
]
