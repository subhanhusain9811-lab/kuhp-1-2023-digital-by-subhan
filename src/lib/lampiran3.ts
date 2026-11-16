/* ============================================================
   LAMPIRAN III — METODE PENGHITUNGAN PIDANA PENJARA
   PENGGANTI PIDANA DENDA
   UU No. 1 Tahun 2026.

   Rumus ini BUKAN tafsiran: ia mereproduksi tabel resmi pada
   Lampiran III halaman 2–7 apa adanya, termasuk contoh yang
   diberikan undang-undang sendiri (denda Rp6.000.000.000 = 450 hari).
   ============================================================ */

/** Batas atas tiap kategori pidana denda — Pasal 79 ayat (1) KUHP */
export const KATEGORI_DENDA = [
  { kategori: 'I', batas: 1_000_000, label: 'Rp1.000.000' },
  { kategori: 'II', batas: 10_000_000, label: 'Rp10.000.000' },
  { kategori: 'III', batas: 50_000_000, label: 'Rp50.000.000' },
  { kategori: 'IV', batas: 200_000_000, label: 'Rp200.000.000' },
  { kategori: 'V', batas: 500_000_000, label: 'Rp500.000.000' },
  { kategori: 'VI', batas: 2_000_000_000, label: 'Rp2.000.000.000' },
  { kategori: 'VII', batas: 5_000_000_000, label: 'Rp5.000.000.000' },
  { kategori: 'VIII', batas: 50_000_000_000, label: 'Rp50.000.000.000' },
] as const

/** Tingkatan tarif harian — Lampiran III angka 1 */
export const TINGKATAN = [
  { sampai: 50_000_000, perHari: 1_000_000, teks: 'di bawah kategori I sampai dengan kategori III' },
  { sampai: 500_000_000, perHari: 5_000_000, teks: 'di atas kategori III sampai dengan kategori V' },
  { sampai: 2_000_000_000, perHari: 10_000_000, teks: 'di atas kategori V sampai dengan kategori VI' },
  { sampai: Infinity, perHari: 25_000_000, teks: 'di atas kategori VI sampai dengan kategori VIII' },
] as const

export interface RincianTingkat {
  teks: string
  perHari: number
  nominal: number
  hari: number
}

export interface HasilHitung {
  denda: number
  hari: number
  rincian: RincianTingkat[]
  kategori: string | null
}

/** Hitung pidana penjara pengganti pidana denda, progresif per tingkatan. */
export function hitungPengganti(denda: number): HasilHitung {
  const rincian: RincianTingkat[] = []
  let sisa = denda
  let batasBawah = 0

  for (const t of TINGKATAN) {
    if (sisa <= 0) break
    const lebar = t.sampai === Infinity ? sisa : Math.min(sisa, t.sampai - batasBawah)
    if (lebar <= 0) { batasBawah = t.sampai; continue }
    rincian.push({
      teks: t.teks,
      perHari: t.perHari,
      nominal: lebar,
      hari: lebar / t.perHari,
    })
    sisa -= lebar
    batasBawah = t.sampai
  }

  const hari = Math.round(rincian.reduce((n, r) => n + r.hari, 0))
  // kategori terkecil yang batasnya masih menampung denda
  const kat = KATEGORI_DENDA.find(k => denda <= k.batas)

  return { denda, hari, rincian, kategori: kat ? kat.kategori : null }
}

/** Format rupiah gaya Indonesia */
export function rupiah(n: number): string {
  return 'Rp' + Math.round(n).toLocaleString('id-ID')
}

/** Contoh resmi dari Lampiran III, dipakai sebagai uji mandiri */
export const CONTOH_RESMI = { denda: 6_000_000_000, hari: 450 }
