/* ============================================================
   LAPISAN UU NO. 1 TAHUN 2026 — PENYESUAIAN PIDANA
   Membaca berkas terpisah `kuhp-2026.json`. Naskah asli UU 1/2023
   TIDAK PERNAH diubah oleh modul ini; ia hanya menyediakan keterangan
   dan teks pembanding.
   ============================================================ */
import raw from '@/data/kuhp-2026.json'
import type { DataUU2026, Butir2026, SalinanPasal2026, JenisPerubahan } from './types'

const data = raw as unknown as DataUU2026

/* ---------- Indeks: nomor pasal -> butir yang menyentuhnya ---------- */
const butirPerPasal = new Map<string, Butir2026[]>()
for (const b of data.butir) {
  for (const p of b.pasal) {
    if (!butirPerPasal.has(p)) butirPerPasal.set(p, [])
    butirPerPasal.get(p)!.push(b)
  }
}

const dihapus = new Set(data.dihapus)
const disisipkan = new Map(data.disisipkan.map(s => [s.nomor, s]))

/* ---------- Klasifikasi jenis perubahan dari perintah verbatim ---------- */
function jenisDari(perintah: string): JenisPerubahan {
  const p = perintah.toLowerCase()
  if (p.startsWith('pasal') && p.includes('dihapus')) return 'dihapus'
  if (p.includes('disisipkan')) return 'disisipkan'
  if (p.includes('penjelasan pasal')) return 'penjelasan'
  if (p.includes('ditambahkan')) return 'ditambah_ayat'
  return 'diubah'
}

export interface Status2026 {
  /** Nomor pasal dalam bentuk teks, mis. "3" atau "599A" */
  nomor: string
  /** true bila pasal ini disentuh UU 1/2026 */
  tersentuh: boolean
  /** true bila pasal dihapus seluruhnya */
  dihapus: boolean
  /** true bila pasal ini baru (disisipkan) */
  baru: boolean
  jenis: JenisPerubahan[]
  /** Perintah perubahan verbatim */
  perintah: string[]
  /** Teks salinan UU 1/2026, bila ada */
  salinan?: SalinanPasal2026
  /** Pasal ini hanya diubah Penjelasannya (batang tubuh tetap) */
  hanyaPenjelasan: boolean
}

const KOSONG = (nomor: string): Status2026 => ({
  nomor, tersentuh: false, dihapus: false, baru: false,
  jenis: [], perintah: [], hanyaPenjelasan: false,
})

export function statusPasal(nomor: number | string): Status2026 {
  const n = String(nomor)
  const butir = butirPerPasal.get(n)
  if (!butir) return KOSONG(n)

  const jenis = butir.map(b => jenisDari(b.perintah))
  const salinan = data.salinanLengkap[n]
  const hanyaPenjelasan =
    jenis.every(j => j === 'penjelasan') && !salinan

  return {
    nomor: n,
    tersentuh: true,
    dihapus: dihapus.has(n),
    baru: disisipkan.has(n),
    jenis: [...new Set(jenis)],
    perintah: butir.map(b => b.perintah),
    salinan,
    hanyaPenjelasan,
  }
}

/* ---------- Label ramah untuk UI ---------- */
export const LABEL_JENIS_2026: Record<JenisPerubahan, string> = {
  diubah: 'Diubah',
  dihapus: 'Dihapus',
  ditambah_ayat: 'Ditambah ayat',
  disisipkan: 'Pasal baru',
  penjelasan: 'Penjelasan diubah',
}

export function labelRingkas(s: Status2026): string {
  if (!s.tersentuh) return ''
  if (s.dihapus) return 'Dihapus oleh UU 1/2026'
  if (s.baru) return 'Pasal baru dari UU 1/2026'
  if (s.hanyaPenjelasan) return 'Penjelasan diubah UU 1/2026'
  return 'Diubah oleh UU 1/2026'
}

/* ---------- Akses umum ---------- */
export const meta2026 = data.meta
export const semuaButir2026 = data.butir
export const pasalBersalinan2026 = data.salinanLengkap
export const pasalDihapus2026 = data.dihapus
export const pasalBaru2026 = data.disisipkan
export const petaLamaBaru = data.petaLamaBaru
export const lampiranII = data.lampiran.II

/** Penjelasan pasal menurut UU 1/2026 (verbatim), per nomor pasal */
export function penjelasan2026(nomor: number | string): string | undefined {
  return data.penjelasan2026[String(nomor)]
}

/** Indeks balik: nomor pasal KUHP -> daftar rujukan lama yang dipetakan ke sana */
const balikPeta = new Map<string, { huruf: string; dari: string; uuLama: string }[]>()
for (const e of data.petaLamaBaru.entri) {
  for (const p of e.pasangan ?? []) {
    for (const k of p.ke) {
      const nomor = k.match(/^(\d+)/)?.[1]
      if (!nomor) continue
      if (!balikPeta.has(nomor)) balikPeta.set(nomor, [])
      balikPeta.get(nomor)!.push({ huruf: e.huruf, dari: p.dari, uuLama: e.isi })
    }
  }
}

/** Rujukan UU lama yang kini diarahkan ke pasal ini (dari Pasal 622) */
export function rujukanLamaKe(nomor: number | string) {
  return balikPeta.get(String(nomor)) ?? []
}

/** Jumlah pasal yang benar-benar berubah batang tubuhnya (bukan hanya Penjelasan) */
export const jumlahPasalBatangTubuh = data.butir
  .filter(b => jenisDari(b.perintah) !== 'penjelasan')
  .reduce((n, b) => n + b.pasal.length, 0)

export function cariPasal2026(kueri: string): string[] {
  const q = kueri.trim().toLowerCase()
  if (!q) return []
  return Object.keys(data.salinanLengkap).filter(n => n.toLowerCase().includes(q))
}
