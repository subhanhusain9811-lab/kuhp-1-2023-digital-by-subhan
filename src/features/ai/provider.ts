/* ============================================================
   M7 · ASISTEN HUKUM — Penyedia Lokal (LocalHeuristicProvider)
   ------------------------------------------------------------------
   Tidak memakai API berbayar atau model eksternal. Seluruh keluaran
   dihitung dari dataset resmi dengan aturan yang dapat diaudit:

   · Setiap pernyataan tentang hukum WAJIB menyebut nomor pasal.
   · Kutipan selalu verbatim dari dataset; tidak ada paragraf karangan.
   · Fakta, hukum, dan analisis dipisah menjadi blok berbeda.
   · Bila tidak ada dasar dalam KUHP, jawaban menyatakan hal itu
     secara eksplisit, bukan mengarang.

   Antarmuka `PenyediaAI` disiapkan agar kelak dapat diganti model
   lain tanpa mengubah UI.
   ============================================================ */
import { db, htmlKeTeks } from '@/lib/data'
import { cari, uraiKueri } from '@/search/query'
import { KONSEP, konsepById } from '@/search/concepts'
import { klasifikasi, pasalTerkait } from '@/features/mapping/relasi'
import { ringkasAncaman, adaAncaman } from '@/lib/format'
import type { Pasal } from '@/lib/types'

export type PeranBlok = 'fakta' | 'hukum' | 'analisis' | 'peringatan' | 'catatan'

export interface Blok {
  peran: PeranBlok
  judul: string
  /** teks biasa; kutipan resmi dipisah ke `kutipan` */
  isi: string
  kutipan?: { pasal: number; ayat: number | null; teks: string }[]
  pasal?: number[]
}

export interface JawabanAI {
  jenis: TugasAI
  judul: string
  blok: Blok[]
  dasarKosong: boolean
  waktu: number
}

export type TugasAI =
  | 'jelaskan-pasal'
  | 'cari-dasar-hukum'
  | 'matriks-unsur'
  | 'bandingkan'
  | 'ancaman'
  | 'terkait'
  | 'ringkas-bab'
  | 'alasan-penghapus'

export interface PenyediaAI {
  nama: string
  deskripsi: string
  lakukan: (tugas: TugasAI, input: string) => JawabanAI
}

const LABEL_PERAN: Record<PeranBlok, string> = {
  fakta: 'Fakta / Input',
  hukum: 'Dasar Hukum (redaksi resmi)',
  analisis: 'Analisis',
  peringatan: 'Peringatan',
  catatan: 'Catatan Metode',
}

export { LABEL_PERAN }

/* ---------- Utilitas ---------- */
function potonganPasal(p: Pasal, maksAyat = 3): { pasal: number; ayat: number | null; teks: string }[] {
  const out: { pasal: number; ayat: number | null; teks: string }[] = []
  const berayat = p.ayat.filter(a => a.nomor != null)
  if (berayat.length === 0) {
    out.push({ pasal: p.nomor, ayat: null, teks: htmlKeTeks(p.teks) })
  } else {
    for (const a of berayat.slice(0, maksAyat)) {
      out.push({ pasal: p.nomor, ayat: a.nomor, teks: htmlKeTeks(a.teks) })
    }
    if (berayat.length > maksAyat) {
      out.push({
        pasal: p.nomor, ayat: null,
        teks: `…pasal ini memuat ${berayat.length} ayat; buka pasal untuk membaca seluruhnya.`,
      })
    }
  }
  return out
}

/** Susun alasan relevansi tanpa pengulangan membosankan. */
function alasanRingkas(
  hasil: { pasal: Pasal; sorotan: string[]; jenis: string[] }[],
  konsep?: { nama: string; keterangan: string },
): string {
  const baris: string[] = []

  for (const h of hasil) {
    const jenis: string[] = []
    if (h.jenis.includes('nomor')) jenis.push('nomor pasal cocok tepat')
    if (h.jenis.includes('redaksional')) {
      const kata = h.sorotan.slice(0, 3).map(k => `"${k}"`).join(', ')
      jenis.push(kata ? `redaksi memuat ${kata}` : 'kata kunci ada dalam redaksi')
    }
    if (h.jenis.includes('fuzzy')) jenis.push('ada kata serupa (toleransi salah ketik)')
    if (h.jenis.includes('semantik')) jenis.push('masuk konsep hukum yang sama')

    baris.push(`• Pasal ${h.pasal.nomor} (${h.pasal.babJudul}): ${jenis.join('; ') || 'kecocokan redaksional'}.`)
  }

  if (konsep) {
    baris.push('', `Konsep hukum terdeteksi: ${konsep.nama}.`)
    const nama = konsep.nama.toLowerCase()
    const ket = konsep.keterangan.toLowerCase()
    const informatif = ket.length > 28
      && !ket.startsWith(nama.replace('tindak pidana ', ''))
      && !ket.includes('bab v')
    if (informatif) baris.push(konsep.keterangan)
  }

  return baris.join('\n')
}

function daftarNomor(nomor: number[]): string {
  if (nomor.length === 0) return '—'
  return nomor.map(n => `Pasal ${n}`).join(', ')
}

/* ---------- Tentukan tugas dari kalimat bebas ---------- */
export function deteksiTugas(teks: string): TugasAI {
  const t = teks.toLowerCase()
  if (/\bjelaskan\b|\barti\b|\bmakna\b|\bapa isi\b|\buraikan pasal\b/.test(t)) return 'jelaskan-pasal'
  if (/\bbandingkan\b|\bperbedaan\b|\bbedanya\b|\bversus\b|\bvs\b/.test(t)) return 'bandingkan'
  if (/\bunsur\b|\bmatriks\b/.test(t)) return 'matriks-unsur'
  if (/\bancaman\b|\bhukuman\b|\bpidana apa\b|\bberapa lama\b|\bdenda\b/.test(t)) return 'ancaman'
  if (/\bterkait\b|\brelevan\b|\bpasal lain\b/.test(t)) return 'terkait'
  if (/\bringkas(an)? bab\b|\bbab\b.*\bringkas/.test(t)) return 'ringkas-bab'
  if (/\balasan pembenar\b|\balasan pemaaf\b|\bpenghapus pidana\b|\btidak dipidana\b/.test(t)) return 'alasan-penghapus'
  return 'cari-dasar-hukum'
}

/* ---------- 4. Bandingkan pasal ---------- */
function bandingkan(input: string): JawabanAI {
  const nomor = ambilSemuaNomor(input)
  if (nomor.length < 2) {
    return tidakDitemukan('bandingkan', input,
      'Sebutkan dua nomor pasal, misalnya "bandingkan pasal 476 dan 486" (pencurian vs penggelapan).')
  }

  const [a, b] = nomor.map(n => db.get(n))
  if (!a || !b) return tidakDitemukan('bandingkan', input, 'Salah satu nomor pasal tidak ditemukan.')

  const ka = klasifikasi(a)
  const kb = klasifikasi(b)

  const hanyaA = (x: string[], y: string[]) => x.filter(v => !y.includes(v))
  const sama = (x: string[], y: string[]) => x.filter(v => y.includes(v))

  const blok: Blok[] = [
    {
      peran: 'hukum', judul: `Pasal ${a.nomor}`, isi: `${a.babJudul}`,
      pasal: [a.nomor], kutipan: potonganPasal(a, 2),
    },
    {
      peran: 'hukum', judul: `Pasal ${b.nomor}`, isi: `${b.babJudul}`,
      pasal: [b.nomor], kutipan: potonganPasal(b, 2),
    },
    {
      peran: 'analisis', judul: 'Titik temu',
      isi: [
        `Unsur subjektif sama: ${sama(ka.subjektif, kb.subjektif).join(', ') || 'tidak ada'}.`,
        `Unsur objektif sama: ${sama(ka.objektif, kb.objektif).join(', ') || 'tidak ada'}.`,
        `Subjek sama: ${sama(ka.subjek, kb.subjek).join(', ') || 'tidak ada'}.`,
        `Ancaman sama: ${sama(ka.ancaman, kb.ancaman).join('; ') || 'tidak ada'}.`,
      ].join('\n'),
    },
    {
      peran: 'analisis', judul: 'Titik pembeda',
      isi: [
        `Unsur subjektif hanya pada Pasal ${a.nomor}: ${hanyaA(ka.subjektif, kb.subjektif).join(', ') || 'tidak ada'}.`,
        `Unsur subjektif hanya pada Pasal ${b.nomor}: ${hanyaA(kb.subjektif, ka.subjektif).join(', ') || 'tidak ada'}.`,
        `Unsur objektif hanya pada Pasal ${a.nomor}: ${hanyaA(ka.objektif, kb.objektif).join(', ') || 'tidak ada'}.`,
        `Unsur objektif hanya pada Pasal ${b.nomor}: ${hanyaA(kb.objektif, ka.objektif).join(', ') || 'tidak ada'}.`,
        `Ancaman Pasal ${a.nomor}: ${ringkasAncaman(a)}.`,
        `Ancaman Pasal ${b.nomor}: ${ringkasAncaman(b)}.`,
      ].join('\n'),
    },
    {
      peran: 'peringatan', judul: 'Batas penggunaan',
      isi: 'Perbedaan yang ditampilkan berasal dari penanda frasa pada masing-masing pasal. '
        + 'Perbedaan makna yang sesungguhnya tetap harus disimpulkan dari pembacaan utuh kedua redaksi dan penjelasannya.',
    },
  ]

  return { jenis: 'bandingkan', judul: `Perbandingan Pasal ${a.nomor} dan Pasal ${b.nomor}`, blok, dasarKosong: false, waktu: 0 }
}

/* ---------- 5. Ancaman ---------- */
function ancamanPasal(input: string): JawabanAI {
  const nomor = ambilSemuaNomor(input)
  const pasalList = nomor.length
    ? nomor.map(n => db.get(n)).filter((p): p is Pasal => !!p)
    : cari(input, { batas: 4 }).map(h => h.pasal)

  if (pasalList.length === 0) {
    return tidakDitemukan('ancaman', input, 'Sebutkan nomor pasal untuk melihat ancaman pidananya.')
  }

  const blok: Blok[] = [{
    peran: 'hukum',
    judul: 'Ancaman pidana dari redaksi',
    isi: pasalList.map(p => `${p.nomor}. Pasal ${p.nomor} (${p.babJudul}): ${ringkasAncaman(p)}`).join('\n\n'),
    pasal: pasalList.map(p => p.nomor),
    kutipan: pasalList.flatMap(p => potonganPasal(p, 2)),
  }, {
    peran: 'catatan', judul: 'Kategori denda',
    isi: 'Kategori denda I–VIII ditetapkan dalam Pasal 79 KUHP: I Rp1 juta; II Rp10 juta; III Rp50 juta; IV Rp200 juta; '
      + 'V Rp500 juta; VI Rp2 miliar; VII Rp5 miliar; VIII Rp50 miliar.',
  }, {
    peran: 'peringatan', judul: 'Batas penggunaan',
    isi: 'Pidana yang dijatuhkan hakim memperhitungkan aturan umum (pemberatan, peringanan, perbarengan, percobaan) '
      + 'sehingga dapat berbeda dari ancaman maksimum yang tercantum pada pasal.',
  }]

  return { jenis: 'ancaman', judul: 'Ancaman Pidana', blok, dasarKosong: false, waktu: 0 }
}

/* ---------- 6. Pasal terkait ---------- */
function pasalTerkaitAI(input: string): JawabanAI {
  const n = ambilNomorPasal(input)
  if (!n || !db.get(n)) {
    return tidakDitemukan('terkait', input, 'Sebutkan nomor pasal, mis. "pasal terkait dengan pasal 476".')
  }
  const rel = pasalTerkait(n, 8)
  const p = db.get(n)!

  return {
    jenis: 'terkait',
    judul: `Pasal yang berkaitan dengan Pasal ${n}`,
    dasarKosong: rel.length === 0,
    waktu: 0,
    blok: [
      {
        peran: 'hukum', judul: 'Rujukan resmi',
        isi: (() => {
          const unik = [...new Set(p.rujukan.map(r => r.pasal))]
          if (unik.length === 0) return `Pasal ${n} tidak memuat rujukan eksplisit ke pasal lain.`
          return `Pasal ${n} menyebut ${p.rujukan.length} rujukan ke ${unik.length} pasal lain: `
            + `${daftarNomor(unik.slice(0, 15))}`
            + `${unik.length > 15 ? `, dan ${unik.length - 15} pasal lainnya` : ''}.`
        })(),
        pasal: [...new Set(p.rujukan.map(r => r.pasal))],
      },
      {
        peran: 'analisis', judul: 'Saran berdasarkan kemiripan kata kunci',
        isi: rel.length
          ? rel.map(r => `• Pasal ${r.pasal.nomor} (${r.pasal.babJudul}) — kemiripan ${Math.round(r.skor * 100)}%`).join('\n')
          : 'Tidak ada pasal lain dengan kemiripan kata kunci yang cukup.',
        pasal: rel.map(r => r.pasal.nomor),
      },
      {
        peran: 'peringatan', judul: 'Pemisahan sumber',
        isi: 'Blok "Rujukan resmi" berasal dari teks undang-undang. Blok "Saran" dihitung dari kemiripan kata '
          + 'dan bukan bagian dari teks resmi, sehingga tidak boleh dikutip sebagai rujukan hukum.',
      },
    ],
  }
}

/* ---------- 7. Ringkas bab ---------- */
function ringkasBab(input: string): JawabanAI {
  const t = input.toLowerCase()
  const angka = t.match(/(?:bab\s*)([ivxlcdm]+|\d{1,2})/i)
  let bab: typeof db.hierarki[number] | undefined

  if (angka) {
    const kode = angka[1].toUpperCase()
    bab = db.hierarki.find(b => b.kode === kode || String(b.nomor) === kode)
  }
  if (!bab) {
    // cari lewat judul
    const n = ambilNomorPasal(input)
    if (n) {
      const p = db.get(n)
      if (p) bab = db.hierarki.find(b => b.buku === p.buku && b.kode === p.bab)
    }
  }
  if (!bab) {
    const kata = t.replace(/ringkas(an)?|bab|tentang|jelaskan/g, '').trim()
    if (kata.length > 3) {
      bab = db.hierarki.find(b => b.judul.toLowerCase().includes(kata))
    }
  }

  if (!bab) {
    return tidakDitemukan('ringkas-bab', input,
      'Sebutkan nomor bab (mis. "ringkas bab XXIV") atau nomor pasal di dalamnya.')
  }

  const pasalBab = db.pasalDiBab(bab.buku, bab.kode)
  const denganAncaman = pasalBab.filter(p => adaAncaman(p.ancaman))
  const mati = pasalBab.filter(p => p.ancaman.mati)

  return {
    jenis: 'ringkas-bab',
    judul: `Bab ${bab.kode} — ${bab.judul}`,
    dasarKosong: false,
    waktu: 0,
    blok: [
      {
        peran: 'hukum', judul: 'Cakupan bab',
        isi: `Bab ${bab.kode} berjudul "${bab.judul}" dan mencakup Pasal ${bab.mulai}–${bab.selesai} `
          + `(${bab.jumlahPasal} pasal) pada ${bab.buku === 'BUKU KESATU' ? 'Buku Kesatu' : 'Buku Kedua'}. `
          + `${bab.bagian.filter(b => b.judul).length} bagian dan `
          + `${bab.bagian.reduce((n, b) => n + b.paragraf.length, 0)} paragraf.`,
        pasal: [bab.mulai, bab.selesai],
      },
      {
        peran: 'analisis', judul: 'Sekilas isi',
        isi: pasalBab.slice(0, 8).map(p => {
          const teks = htmlKeTeks(p.teks)
          return `• Pasal ${p.nomor}: ${teks.slice(0, 150)}${teks.length > 150 ? '…' : ''}`
        }).join('\n'),
        pasal: pasalBab.slice(0, 8).map(p => p.nomor),
      },
      {
        peran: 'analisis', judul: 'Sebaran ancaman',
        isi: `${denganAncaman.length} dari ${pasalBab.length} pasal merumuskan ancaman pidana eksplisit`
          + `${mati.length ? `; ${mati.length} pasal memuat ancaman pidana mati (Pasal ${mati.map(p => p.nomor).join(', ')})` : ''}.`,
      },
      {
        peran: 'peringatan', judul: 'Batas penggunaan',
        isi: 'Ringkasan ini hanya menunjuk pasal dan kutipan awal; bukan uraian normatif bab. '
          + 'Buka pasal untuk membaca redaksi lengkap.',
      },
    ],
  }
}

/* ---------- 8. Alasan penghapus pidana ---------- */
function alasanPenghapus(): JawabanAI {
  const pasalPembenar = [30, 31, 32, 33, 34, 35].map(n => db.get(n)).filter((p): p is Pasal => !!p)
  const pasalPemaaf = [36, 37, 38, 39, 40, 41, 42, 43, 44].map(n => db.get(n)).filter((p): p is Pasal => !!p)

  return {
    jenis: 'alasan-penghapus',
    judul: 'Alasan Pembenar & Alasan Pemaaf',
    dasarKosong: false,
    waktu: 0,
    blok: [
      {
        peran: 'hukum', judul: 'Rentang pasal dalam Buku Kesatu',
        isi: 'KUHP mengatur keadaan yang menghapus sifat melawan hukum (alasan pembenar) dan yang menghapus '
          + 'kesalahan pelaku (alasan pemaaf) pada Buku Kesatu Bab II.',
        pasal: [...pasalPembenar, ...pasalPemaaf].map(p => p.nomor),
      },
      {
        peran: 'hukum', judul: 'Pasal yang lazim dibahas sebagai alasan pembenar',
        isi: 'Periksa redaksi berikut untuk keadaan seperti pembelaan terpaksa, keadaan darurat, dan perintah jabatan:',
        kutipan: pasalPembenar.flatMap(p => potonganPasal(p, 1)),
        pasal: pasalPembenar.map(p => p.nomor),
      },
      {
        peran: 'hukum', judul: 'Pasal yang lazim dibahas sebagai alasan pemaaf',
        isi: 'Periksa redaksi berikut untuk keadaan seperti ketidakmampuan bertanggung jawab dan daya paksa:',
        kutipan: pasalPemaaf.slice(0, 6).flatMap(p => potonganPasal(p, 1)),
        pasal: pasalPemaaf.map(p => p.nomor),
      },
      {
        peran: 'peringatan', judul: 'Hati-hati',
        isi: 'Penggolongan suatu pasal sebagai "alasan pembenar" atau "alasan pemaaf" adalah kategori doktrin, '
          + 'bukan judul resmi dalam undang-undang. Kategori tersebut tidak boleh dikutip sebagai bunyi pasal. '
          + 'Yang mengikat tetap redaksi pasal yang bersangkutan.',
      },
    ],
  }
}

/* ---------- Bantuan nomor pasal ---------- */
export function ambilNomorPasal(teks: string): number | null {
  const m = teks.match(/(?:pasal\s*)?(\d{1,3})(?!\d)/i)
  if (!m) return null
  const n = parseInt(m[1], 10)
  return n >= 1 && n <= 624 ? n : null
}

export function ambilSemuaNomor(teks: string): number[] {
  const out: number[] = []
  const re = /(\d{1,3})(?!\d)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(teks)) !== null) {
    const n = parseInt(m[1], 10)
    if (n >= 1 && n <= 624 && !out.includes(n)) out.push(n)
  }
  return out
}

/* ---------- Penyedia lokal ---------- */
export const penyediaLokal: PenyediaAI = {
  nama: 'Local Heuristic Provider',
  deskripsi: 'Berjalan sepenuhnya di perangkat tanpa API eksternal. Semua rujukan berasal dari dataset KUHP yang terverifikasi.',

  lakukan(tugas, input) {
    const mulai = performance.now()
    let jawaban: JawabanAI

    switch (tugas) {
      case 'jelaskan-pasal': jawaban = jelaskanPasal(input); break
      case 'matriks-unsur': jawaban = matriksUnsur(input); break
      case 'bandingkan': jawaban = bandingkan(input); break
      case 'ancaman': jawaban = ancamanPasal(input); break
      case 'terkait': jawaban = pasalTerkaitAI(input); break
      case 'ringkas-bab': jawaban = ringkasBab(input); break
      case 'alasan-penghapus': jawaban = alasanPenghapus(); break
      default: jawaban = cariDasarHukum(input)
    }

    jawaban.waktu = Math.round(performance.now() - mulai)
    return jawaban
  },
}

/* ---------- 1. Cari dasar hukum dari fakta ---------- */
function cariDasarHukum(fakta: string): JawabanAI {
  const hasil = cari(fakta, { batas: 8 })
  const urai = uraiKueri(fakta)

  if (hasil.length === 0) {
    return {
      jenis: 'cari-dasar-hukum',
      judul: 'Dasar hukum tidak ditemukan',
      dasarKosong: true,
      waktu: 0,
      blok: [
        { peran: 'fakta', judul: 'Fakta yang Anda sampaikan', isi: fakta.trim() },
        {
          peran: 'peringatan',
          judul: 'Tidak ada dasar dalam KUHP yang cocok',
          isi: 'Pencarian tidak menemukan pasal yang memuat unsur perbuatan tersebut dalam KUHP (UU No. 1 Tahun 2023). '
            + 'Ini BUKAN berarti perbuatan itu tidak dapat dipidana — bisa jadi diatur pada undang-undang lain di luar KUHP, '
            + 'atau uraian fakta perlu dirumuskan ulang dengan istilah yang dipakai undang-undang.',
        },
        {
          peran: 'catatan', judul: 'Saran',
          isi: 'Coba gunakan kata kerja yang lazim dalam redaksi: mengambil, memiliki, menyerahkan, memaksa, mengancam, '
            + 'menyesatkan, memalsu, merusak, merampas nyawa, atau sebut langsung nama tindak pidana (mis. pencurian).',
        },
      ],
    }
  }

  // Ambang lebih ketat daripada daftar pencarian. Bila ada kecocokan konsep
  // yang kuat, pasal di luar konsep itu tidak diikutkan sebagai dasar hukum.
  const puncak = hasil[0].skor
  const konsepKuat = urai.konsep.find(k => k.skor >= 0.7)
  const teratas = hasil
    .filter(h => h.skor >= Math.max(8, 0.5 * puncak))
    .filter(h => !konsepKuat || konsepKuat.pasal.includes(h.pasal.nomor))
    .slice(0, 4)

  const konsep = urai.konsep[0]

  const blok: Blok[] = [
    { peran: 'fakta', judul: 'Fakta yang Anda sampaikan', isi: fakta.trim() },
    {
      peran: 'hukum',
      judul: 'Pasal yang relevan',
      isi: `Berdasarkan pencocokan unsur perbuatan dengan redaksi KUHP, pasal berikut paling relevan: ${daftarNomor(teratas.map(h => h.pasal.nomor))}.`
        + `\n\nKutipan lengkap ditampilkan untuk ${Math.min(2, teratas.length)} pasal teratas; `
        + 'pasal lainnya dapat dibuka lewat tombol nomor di bawah.',
      pasal: teratas.map(h => h.pasal.nomor),
      kutipan: teratas.slice(0, 2).flatMap(h => potonganPasal(h.pasal, 1)),
    },
    {
      peran: 'analisis',
      judul: 'Mengapa pasal tersebut relevan',
      isi: alasanRingkas(teratas, konsep),
    },
    {
      peran: 'peringatan',
      judul: 'Batas penggunaan',
      isi: 'Hasil ini adalah titik awal penelusuran, bukan kesimpulan hukum. Untuk menentukan pasal yang tepat, '
        + 'seluruh unsur pasal (subjektif dan objektif) harus terpenuhi dan harus dinilai bersama aturan umum '
        + 'Buku Kesatu (mis. percobaan, penyertaan, alasan penghapus pidana).',
    },
  ]

  if (konsep) {
    const k = konsepById(konsep.id)
    if (k) {
      blok.push({
        peran: 'catatan',
        judul: `Rentang pasal dalam konsep "${k.nama}"`,
        isi: `${k.keterangan} Berdasarkan sistematika resmi, konsep ini mencakup ${daftarNomor(k.pasal.slice(0, 12))}${k.pasal.length > 12 ? ` dan ${k.pasal.length - 12} pasal lain` : ''}.`,
        pasal: k.pasal,
      })
    }
  }

  return { jenis: 'cari-dasar-hukum', judul: 'Analisis Dasar Hukum', blok, dasarKosong: false, waktu: 0 }
}

/* ---------- 2. Jelaskan pasal ---------- */
function jelaskanPasal(input: string): JawabanAI {
  const n = ambilNomorPasal(input)
  const p = n ? db.get(n) : undefined

  if (!p) {
    return tidakDitemukan('jelaskan-pasal', input,
      'Sebutkan nomor pasal yang ingin dijelaskan, misalnya "jelaskan pasal 476".')
  }

  const k = klasifikasi(p)
  const blok: Blok[] = [
    {
      peran: 'hukum',
      judul: `Pasal ${p.nomor} — ${p.babJudul}`,
      isi: `Pasal ini berada pada ${p.buku === 'BUKU KESATU' ? 'Buku Kesatu' : 'Buku Kedua'}, Bab ${p.bab}`
        + `${p.bagianJudul ? `, Bagian ${p.bagian} (${p.bagianJudul})` : ''}`
        + `${p.paragraf ? `, Paragraf ${p.paragraf} (${p.paragrafJudul})` : ''}.`,
      pasal: [p.nomor],
      kutipan: potonganPasal(p, 4),
    },
  ]

  const penj = htmlKeTeks(p.penjelasan)
  if (penj && !/^cukup jelas\.?$/i.test(penj.trim())) {
    blok.push({
      peran: 'hukum',
      judul: 'Penjelasan resmi pasal',
      isi: 'Kutipan dari lampiran penjelasan undang-undang:',
      kutipan: [{ pasal: p.nomor, ayat: null, teks: penj }],
    })
  } else if (penj) {
    blok.push({
      peran: 'catatan', judul: 'Penjelasan resmi',
      isi: 'Lampiran penjelasan menyatakan "Cukup jelas", sehingga tidak ada uraian tambahan dari pembentuk undang-undang.',
    })
  }

  if (k.subjektif.length || k.objektif.length) {
    blok.push({
      peran: 'analisis',
      judul: 'Penanda unsur yang terbaca dari redaksi',
      isi: [
        k.subjektif.length ? `Unsur subjektif: ${k.subjektif.join(', ')}.` : 'Tidak ditemukan penanda unsur subjektif eksplisit.',
        k.objektif.length ? `Unsur objektif: ${k.objektif.join(', ')}.` : 'Tidak ditemukan penanda unsur objektif eksplisit.',
        '',
        'Daftar ini dihasilkan dari frasa yang benar-benar tertulis pada pasal/penjelasan, bukan rumusan unsur yang dikarang. '
        + 'Rumusan unsur yang mengikat tetap harus disusun dari pembacaan utuh redaksi.',
      ].join('\n'),
    })
  }

  if (adaAncaman(p.ancaman)) {
    blok.push({
      peran: 'analisis', judul: 'Ancaman pidana (ringkasan otomatis)',
      isi: ringkasAncaman(p) + '\n\nKategori denda mengacu pada Pasal 79 KUHP. Angka ini dibaca dari ketentuan pidana pada pasal yang sama.',
    })
  }

  if (p.rujukan.length) {
    blok.push({
      peran: 'hukum', judul: 'Rujukan resmi dalam pasal ini',
      isi: `Pasal ini menyebut ${daftarNomor(p.rujukan.slice(0, 20).map(r => r.pasal))}${p.rujukan.length > 20 ? ' dan lainnya' : ''}. Penyebutan tersebut diambil dari redaksi/penjelasan, bukan tambahan dari aplikasi.`,
      pasal: p.rujukan.map(r => r.pasal),
    })
  }

  blok.push({
    peran: 'peringatan', judul: 'Batas penggunaan',
    isi: 'Penjelasan di atas membantu memahami struktur pasal, tetapi bukan nasihat hukum. '
      + 'Penerapan pasal pada kasus konkret memerlukan pemeriksaan seluruh unsur, aturan umum Buku Kesatu, dan bukti.',
  })

  return { jenis: 'jelaskan-pasal', judul: `Penjelasan Pasal ${p.nomor}`, blok, dasarKosong: false, waktu: 0 }
}

/* ---------- 3. Matriks unsur ---------- */
function matriksUnsur(input: string): JawabanAI {
  const nomor = ambilSemuaNomor(input)
  if (nomor.length === 0) {
    const hasil = cari(input, { batas: 3 })
    nomor.push(...hasil.map(h => h.pasal.nomor))
  }

  if (nomor.length === 0) {
    return tidakDitemukan('matriks-unsur', input,
      'Sebutkan nomor pasal (mis. "matriks unsur pasal 476 dan 477") atau uraikan perbuatannya.')
  }

  const pasalList = nomor.map(n => db.get(n)).filter((p): p is Pasal => !!p)
  const baris: string[] = []
  for (const p of pasalList) {
    const k = klasifikasi(p)
    baris.push(
      `Pasal ${p.nomor} — ${p.babJudul}`,
      `    Unsur subjektif : ${k.subjektif.join(', ') || '—'}`,
      `    Unsur objektif  : ${k.objektif.join(', ') || '—'}`,
      `    Subjek hukum    : ${k.subjek.join(', ') || '—'}`,
      `    Ancaman         : ${k.ancaman.join('; ') || '—'}`,
      '',
    )
  }

  return {
    jenis: 'matriks-unsur',
    judul: 'Matriks Unsur Perbandingan',
    dasarKosong: false,
    waktu: 0,
    blok: [
      {
        peran: 'hukum', judul: 'Matriks per pasal', isi: baris.join('\n').trim(),
        pasal: pasalList.map(p => p.nomor),
        kutipan: pasalList.flatMap(p => potonganPasal(p, 1)),
      },
      {
        peran: 'catatan', judul: 'Cara membaca matriks',
        isi: 'Kolom unsur diisi hanya jika penanda frasanya ditemukan pada redaksi/penjelasan pasal terkait. '
          + 'Tanda "—" berarti aplikasi tidak menemukan penanda, bukan berarti unsur tersebut tidak ada; '
          + 'selalu periksa redaksi lengkap sebelum menyimpulkan.',
      },
      {
        peran: 'peringatan', judul: 'Batas penggunaan',
        isi: 'Matriks ini alat bantu penyusunan analisis, bukan rumusan resmi unsur tindak pidana.',
      },
    ],
  }
}

function tidakDitemukan(jenis: TugasAI, input: string, saran: string): JawabanAI {
  return {
    jenis, judul: 'Dasar tidak ditemukan', dasarKosong: true, waktu: 0,
    blok: [
      { peran: 'fakta', judul: 'Input', isi: input },
      {
        peran: 'peringatan', judul: 'Tidak ada dasar dalam KUHP yang dapat dikutip',
        isi: 'Permintaan ini tidak dapat dipetakan ke pasal mana pun dalam dataset KUHP. '
          + 'Aplikasi tidak akan menyusun uraian hukum tanpa dasar pasal yang jelas.',
      },
      { peran: 'catatan', judul: 'Saran', isi: saran },
    ],
  }
}

/* ---------- Ringkasan konsep untuk UI ---------- */
export const CONTOH_TUGAS: { label: string; tugas: TugasAI; input: string }[] = [
  { label: 'Fakta → dasar hukum', tugas: 'cari-dasar-hukum', input: 'Mengambil barang milik orang lain tanpa izin dengan maksud memiliki' },
  { label: 'Jelaskan pasal', tugas: 'jelaskan-pasal', input: 'Jelaskan pasal 476' },
  { label: 'Matriks unsur', tugas: 'matriks-unsur', input: 'Matriks unsur pasal 476 dan 486' },
  { label: 'Bandingkan pasal', tugas: 'bandingkan', input: 'Bandingkan pasal 476 dan 486' },
  { label: 'Cek ancaman', tugas: 'ancaman', input: 'Ancaman pidana pasal 459' },
  { label: 'Pasal terkait', tugas: 'terkait', input: 'Pasal terkait dengan pasal 372' },
  { label: 'Ringkas bab', tugas: 'ringkas-bab', input: 'Ringkas bab XXIV' },
  { label: 'Alasan penghapus', tugas: 'alasan-penghapus', input: 'alasan pembenar dan pemaaf' },
]

export const DAFTAR_KONSEP = KONSEP.map(k => ({ id: k.id, nama: k.nama }))
