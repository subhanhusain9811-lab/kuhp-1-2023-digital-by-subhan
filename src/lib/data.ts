/* ============================================================
   M1 · DATABASE KUHP
   Loader + indeks turunan. Data bersifat READ-ONLY.
   ============================================================ */
import rawData from '@/data/kuhp-data.json'
import rawKoreksi from '@/data/koreksi.json'
import type {
  KuhpData, Pasal, BabNode, KoreksiData, KoreksiEntri, BukuKode,
} from './types'

const data = rawData as unknown as KuhpData
const koreksiData = rawKoreksi as unknown as KoreksiData

/* ---------- Indeks dasar ---------- */
const byNomor = new Map<number, Pasal>()
const byBab = new Map<string, Pasal[]>()
const byBuku = new Map<BukuKode, Pasal[]>()
const byBagian = new Map<string, Pasal[]>()
const byParagraf = new Map<string, Pasal[]>()

for (const p of data.pasal) {
  byNomor.set(p.nomor, p)

  const babKey = `${p.buku}|${p.bab}`
  if (!byBab.has(babKey)) byBab.set(babKey, [])
  byBab.get(babKey)!.push(p)

  if (!byBuku.has(p.buku)) byBuku.set(p.buku, [])
  byBuku.get(p.buku)!.push(p)

  if (p.bagian) {
    const key = `${p.buku}|${p.bab}|${p.bagian}`
    if (!byBagian.has(key)) byBagian.set(key, [])
    byBagian.get(key)!.push(p)
  }
  if (p.paragraf != null && p.bagian) {
    const key = `${p.buku}|${p.bab}|${p.bagian}|${p.paragraf}`
    if (!byParagraf.has(key)) byParagraf.set(key, [])
    byParagraf.get(key)!.push(p)
  }
}

/* ---------- Log koreksi per pasal ---------- */
const koreksiByPasal = new Map<number, KoreksiEntri[]>()
for (const k of koreksiData.log) {
  if (!koreksiByPasal.has(k.pasal)) koreksiByPasal.set(k.pasal, [])
  koreksiByPasal.get(k.pasal)!.push(k)
}

/* ---------- Teks polos (dimemo) ---------- */
const TAG = /<[^>]+>/g

export function htmlKeTeks(html: string): string {
  const withBreaks = html
    .replace(/<\/p>/gi, ' ')
    .replace(/<\/li>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
  return withBreaks.replace(TAG, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim()
}

const teksPolosCache = new Map<number, string>()
const penjelasanPolosCache = new Map<number, string>()

export function teksPolos(nomor: number): string {
  let v = teksPolosCache.get(nomor)
  if (v === undefined) {
    const p = byNomor.get(nomor)
    v = p ? htmlKeTeks(p.teks) : ''
    teksPolosCache.set(nomor, v)
  }
  return v
}

export function penjelasanPolos(nomor: number): string {
  let v = penjelasanPolosCache.get(nomor)
  if (v === undefined) {
    const p = byNomor.get(nomor)
    v = p ? htmlKeTeks(p.penjelasan) : ''
    penjelasanPolosCache.set(nomor, v)
  }
  return v
}

/* ---------- API publik ---------- */
export const db = {
  meta: data.meta,
  hierarki: data.hierarki,
  pasal: data.pasal,
  total: data.pasal.length,

  get(nomor: number): Pasal | undefined {
    return byNomor.get(nomor)
  },

  /** Pasal terdekat yang tersedia (untuk lompat nomor di luar rentang). */
  getAman(nomor: number): Pasal | undefined {
    if (byNomor.has(nomor)) return byNomor.get(nomor)
    return undefined
  },

  pasalDiBab(buku: BukuKode, bab: string): Pasal[] {
    return byBab.get(`${buku}|${bab}`) ?? []
  },

  pasalDiBuku(buku: BukuKode): Pasal[] {
    return byBuku.get(buku) ?? []
  },

  pasalDiBagian(buku: BukuKode, bab: string, bagian: string): Pasal[] {
    return byBagian.get(`${buku}|${bab}|${bagian}`) ?? []
  },

  pasalDiParagraf(buku: BukuKode, bab: string, bagian: string, paragraf: number): Pasal[] {
    return byParagraf.get(`${buku}|${bab}|${bagian}|${paragraf}`) ?? []
  },

  babDariPasal(p: Pasal): BabNode | undefined {
    return data.hierarki.find(b => b.buku === p.buku && b.kode === p.bab)
  },

  /** Nomor pasal sebelumnya/berikutnya, atau null di ujung. */
  tetangga(nomor: number): { sebelum: number | null; sesudah: number | null } {
    return {
      sebelum: nomor > 1 ? nomor - 1 : null,
      sesudah: nomor < 624 ? nomor + 1 : null,
    }
  },

  /** Semua pasal yang merujuk ke nomor tertentu (kebalikan dari rujukan). */
  perujuk(nomor: number): Pasal[] {
    if (!perujukIndex) {
      perujukIndex = new Map()
      for (const p of data.pasal) {
        for (const r of p.rujukan) {
          if (!perujukIndex.has(r.pasal)) perujukIndex.set(r.pasal, [])
          const arr = perujukIndex.get(r.pasal)!
          if (!arr.includes(p)) arr.push(p)
        }
      }
    }
    return perujukIndex.get(nomor) ?? []
  },

  koreksiPasal(nomor: number): KoreksiEntri[] {
    return koreksiByPasal.get(nomor) ?? []
  },

  koreksi: koreksiData,
}

let perujukIndex: Map<number, Pasal[]> | null = null

/* ---------- Katalog kategori denda (Pasal 79 KUHP) ---------- */
export const KATEGORI_DENDA: Record<string, string> = {
  I: 'Rp1.000.000',
  II: 'Rp10.000.000',
  III: 'Rp50.000.000',
  IV: 'Rp200.000.000',
  V: 'Rp500.000.000',
  VI: 'Rp2.000.000.000',
  VII: 'Rp5.000.000.000',
  VIII: 'Rp50.000.000.000',
}

/* ---------- Label Buku ---------- */
export const BUKU_LABEL: Record<BukuKode, string> = {
  'BUKU KESATU': 'Buku Kesatu — Aturan Umum',
  'BUKU KEDUA': 'Buku Kedua — Tindak Pidana',
}

export const ROMAN_LABEL: Record<string, string> = {
  I: 'I', II: 'II', III: 'III', IV: 'IV', V: 'V', VI: 'VI', VII: 'VII',
  VIII: 'VIII', IX: 'IX', X: 'X', XI: 'XI', XII: 'XII', XIII: 'XIII',
  XIV: 'XIV', XV: 'XV', XVI: 'XVI', XVII: 'XVII', XVIII: 'XVIII', XIX: 'XIX',
  XX: 'XX', XXI: 'XXI', XXII: 'XXII', XXIII: 'XXIII', XXIV: 'XXIV',
  XXV: 'XXV', XXVI: 'XXVI', XXVII: 'XXVII', XXVIII: 'XXVIII', XXIX: 'XXIX',
  XXX: 'XXX', XXXI: 'XXXI', XXXII: 'XXXII', XXXIII: 'XXXIII', XXXIV: 'XXXIV',
  XXXV: 'XXXV', XXXVI: 'XXXVI', XXXVII: 'XXXVII',
}
