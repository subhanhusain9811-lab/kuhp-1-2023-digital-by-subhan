/* ============================================================
   STATUS BERLAKU KUHP
   Naskah asli menyebut "3 tahun sejak tanggal diundangkan" (Pasal 624).
   Diundangkan 2 Januari 2023  ->  berlaku 2 Januari 2026.
   Dihitung di sini, BUKAN dengan menyunting kuhp-data.json, agar
   redaksi asli tetap utuh satu karakter pun.
   ============================================================ */

export const TANGGAL_DIUNDANGKAN = new Date('2023-01-02T00:00:00+07:00')
export const TANGGAL_BERLAKU = new Date('2026-01-02T00:00:00+07:00')

const HARI = 86_400_000

/** Jumlah hari sejak KUHP mulai berlaku (0 bila belum berlaku) */
export function hariSejakBerlaku(kini: Date = new Date()): number {
  const selisih = Math.floor((kini.getTime() - TANGGAL_BERLAKU.getTime()) / HARI)
  return selisih > 0 ? selisih : 0
}

export function sudahBerlaku(kini: Date = new Date()): boolean {
  return kini.getTime() >= TANGGAL_BERLAKU.getTime()
}

/** "Berlaku sejak 2 Januari 2026" */
export const LABEL_BERLAKU = 'Berlaku sejak 2 Januari 2026'

/** "Berlaku sejak 2 Januari 2026 · 318 hari" */
export function labelBerlakuLengkap(kini: Date = new Date()): string {
  const n = hariSejakBerlaku(kini)
  if (n === 0) return LABEL_BERLAKU
  const bulan = Math.floor(n / 30.44)
  const sisaHari = Math.round(n - bulan * 30.44)
  const rincian = bulan >= 1
    ? `${n} hari (${bulan} bulan${sisaHari > 0 ? ` ${sisaHari} hari` : ''})`
    : `${n} hari`
  return `${LABEL_BERLAKU} · ${rincian}`
}

/** Keterangan hukumnya, apa adanya dari Pasal 624 */
export const DASAR_BERLAKU =
  'Pasal 624: KUHP mulai berlaku 3 (tiga) tahun terhitung sejak tanggal diundangkan, yaitu 2 Januari 2023 — sehingga berlaku 2 Januari 2026.'
