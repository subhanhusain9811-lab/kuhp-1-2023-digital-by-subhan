/* ============================================================
   Utilitas format, teks, dan sanitasi ringan
   ============================================================ */
import { htmlKeTeks } from './data'
export { htmlKeTeks }
import type { Pasal, Ancaman, DendaItem } from './types'

/* ---------- Angka & tanggal ---------- */
export function angkaId(n: number): string {
  return new Intl.NumberFormat('id-ID').format(n)
}

export function tanggalId(iso: string | number): string {
  const d = new Date(iso)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function waktuRelatif(ts: number): string {
  const sel = Date.now() - ts
  const m = Math.floor(sel / 60000)
  if (m < 1) return 'baru saja'
  if (m < 60) return `${m} menit lalu`
  const j = Math.floor(m / 60)
  if (j < 24) return `${j} jam lalu`
  const h = Math.floor(j / 24)
  if (h < 7) return `${h} hari lalu`
  return tanggalId(ts)
}

/* ---------- Rupiah dari kategori denda ---------- */
export const DENDA_KATEGORI: Record<string, number> = {
  I: 1_000_000, II: 10_000_000, III: 50_000_000, IV: 200_000_000,
  V: 500_000_000, VI: 2_000_000_000, VII: 5_000_000_000, VIII: 50_000_000_000,
}

export function rupiah(n: number): string {
  return 'Rp' + angkaId(n)
}

/** Ambil kategori denda romawi dari teks ancaman; kembalikan nilai rupiah. */
export function dendaDariTeks(teks: string | null): number | null {
  if (!teks) return null
  const m = teks.match(/kategori\s+(VIII|VII|VI|IV|V|III|II|I)\b/i)
  if (m) return DENDA_KATEGORI[m[1].toUpperCase()] ?? null
  return null
}

export function labelDenda(teks: string | null): string | null {
  if (!teks) return null
  const cat = teks.match(/kategori\s+(VIII|VII|VI|IV|V|III|II|I)\b/i)
  if (cat) {
    const k = cat[1].toUpperCase()
    const v = DENDA_KATEGORI[k]
    return `Kategori ${k} — ${rupiah(v)}`
  }
  const rp = teks.match(/Rp\s?([\d.]+)/i)
  if (rp) return 'Rp' + rp[1]
  if (/paling banyak|paling sedikit|denda/i.test(teks)) return teks.trim()
  return null
}

/* ---------- Ancaman ringkas ---------- */
function labelDendaItem(item: DendaItem): string {
  const [, kategori, rupiahTeks] = item
  if (kategori && DENDA_KATEGORI[kategori]) {
    return `Kategori ${kategori} (${rupiah(DENDA_KATEGORI[kategori])})`
  }
  if (rupiahTeks) return rupiahTeks
  return '—'
}

/** Ringkasan ancaman pidana dalam bahasa yang mudah dibaca (bukan pengganti redaksi). */
export function ringkasAncaman(p: Pasal): string {
  const a = p.ancaman
  const bagian: string[] = []

  if (a.mati) bagian.push('pidana mati')
  if (a.seumurHidup) bagian.push('penjara seumur hidup')

  for (const [jenis, nilai] of a.penjara ?? []) {
    bagian.push(`penjara paling ${jenis === 'lama' ? 'lama' : 'singkat'} ${nilai} tahun`)
  }
  for (const item of a.denda ?? []) {
    const arah = item[0] === 'banyak' ? 'paling banyak' : 'paling sedikit'
    bagian.push(`denda ${arah} ${labelDendaItem(item)}`)
  }
  if (a.pengawasan) bagian.push('pidana pengawasan')
  if (a.kerjaSosial) bagian.push('pidana kerja sosial')
  if (a.tutupan) bagian.push('pidana tutupan')
  if (a.pencabutanHak) bagian.push('pencabutan hak')
  if (a.perampasan) bagian.push('perampasan barang')

  return bagian.length ? bagian.join(' · ') : 'Tidak dirumuskan ancaman pidana pada pasal ini'
}

export function adaAncaman(a: Ancaman): boolean {
  return Boolean(
    a.mati || a.seumurHidup ||
    (a.penjara && a.penjara.length) || (a.denda && a.denda.length) ||
    a.pengawasan || a.kerjaSosial || a.tutupan || a.pencabutanHak || a.perampasan
  )
}

/* ---------- Label pasal ---------- */
export function judulPasal(p: Pasal): string {
  return `Pasal ${p.nomor}`
}

export function lokasiPasal(p: Pasal): string {
  const b = p.buku === 'BUKU KESATU' ? 'Buku Kesatu' : 'Buku Kedua'
  const bgn = p.bagianJudul ? ` › Bagian ${p.bagianJudul}` : ''
  return `${b} · Bab ${p.bab} — ${p.babJudul}${bgn}`
}

/* ---------- Kutipan ---------- */
export function kutipPasal(p: Pasal): string {
  const baris: string[] = [`Pasal ${p.nomor}`, p.babJudul ? `(${p.babJudul})` : '', '']
  if (p.ayat.length === 0) {
    baris.push(htmlKeTeks(p.teks))
  } else {
    for (const a of p.ayat) {
      const t = htmlKeTeks(a.teks)
      if (a.nomor != null) baris.push(`(${a.nomor}) ${t}`)
      else baris.push(t)
      // Bila teks ayat sudah memuat daftar butir, jangan disalin dua kali.
      if (!/<li[\s>]/i.test(a.teks)) {
        for (const h of a.huruf) baris.push(`   ${h.label}. ${htmlKeTeks(h.teks)}`)
      }
    }
  }
  baris.push('', '— Kutipan dari UU No. 1 Tahun 2023 tentang KUHP')
  return baris.filter((b, i, arr) => !(b === '' && arr[i - 1] === '')).join('\n')
}

export function kutipAyat(p: Pasal, nomorAyat: number): string {
  const a = p.ayat.find(x => x.nomor === nomorAyat)
  if (!a) return kutipPasal(p)
  const baris = [`Pasal ${p.nomor} ayat (${nomorAyat})`, `(${nomorAyat}) ${htmlKeTeks(a.teks)}`]
  if (!/<li[\s>]/i.test(a.teks)) {
    for (const h of a.huruf) baris.push(`   ${h.label}. ${htmlKeTeks(h.teks)}`)
  }
  baris.push('', '— Kutipan dari UU No. 1 Tahun 2023 tentang KUHP')
  return baris.join('\n')
}

/* ---------- Sanitasi HTML dari data ---------- */
const IZIN_TAG = new Set(['P', 'LI', 'STRONG', 'EM', 'B', 'I', 'BR', 'UL', 'OL', 'SPAN'])

/**
 * Data sudah bersih dari sumber, tetapi sebelum dirender sebagai HTML kita
 * saring tag/atribut agar tidak ada skrip atau atribut event yang lolos.
 */
export function sanitasiHtml(html: string): string {
  return html.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)((?:\s[^>]*)?)>/g, (m, nama: string, attrs: string) => {
    const tag = nama.toUpperCase()
    if (!IZIN_TAG.has(tag)) return ''
    // buang semua atribut kecuali class/data-huruf yang dipakai sendiri
    const aman = (attrs ?? '').replace(/\s(on\w+|style|href|src)\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, '')
      .replace(/\s(class|data-huruf)\s*=\s*("([^"]*)"|'([^']*)')/gi, (_mm, at: string, _q: string, d1?: string, d2?: string) => {
        const val = (d1 ?? d2 ?? '').replace(/[<>"']/g, '')
        return ` ${at.toLowerCase()}="${val}"`
      })
    return m.startsWith('</') ? `</${tag.toLowerCase()}>` : `<${tag.toLowerCase()}${aman}>`
  })
}

/* ---------- Sorotan kata kunci ---------- */
export function sorotKata(teks: string, kata: string[]): string {
  if (kata.length === 0) return escapeHtml(teks)
  const pola = kata
    .filter(k => k.length >= 3)
    .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .sort((a, b) => b.length - a.length)
  if (pola.length === 0) return escapeHtml(teks)
  const re = new RegExp(`(${pola.join('|')})`, 'gi')
  return escapeHtml(teks).replace(re, '<mark>$1</mark>')
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/* ---------- Unduh berkas ---------- */
export function unduh(nama: string, isi: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([isi], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nama
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

/* ---------- Ukuran baca ---------- */
export const LEVEL_FONT = [
  { id: 0, label: 'Kecil', px: 15, lh: 1.65 },
  { id: 1, label: 'Normal', px: 17, lh: 1.7 },
  { id: 2, label: 'Besar', px: 19, lh: 1.75 },
  { id: 3, label: 'Sangat Besar', px: 22, lh: 1.8 },
] as const

export function estimasiBaca(kata: number): string {
  const menit = Math.max(1, Math.round(kata / 200))
  return `± ${menit} menit baca`
}

export function hitungKata(s: string): number {
  return (s.match(/[A-Za-zÀ-ÿ0-9]+/g) ?? []).length
}
