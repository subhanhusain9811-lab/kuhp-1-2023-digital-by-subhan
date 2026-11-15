/* ============================================================
   M2 · Indeks Pencarian (dibangun sekali saat boot)
   - postings kata (stem) -> pasal, dengan frekuensi & posisi
   - indeks frasa 2-gram
   - trigram per kata untuk fuzzy
   - rata-rata panjang dokumen untuk BM25
   ============================================================ */
import { db, htmlKeTeks } from '@/lib/data'
import { norm, stem, trigramSet } from './normalize'

export interface Posting {
  nomor: number
  tf: number
  /** 0 = teks pasal, 1 = penjelasan */
  bagian: number
}

export interface IndeksPencarian {
  kata: Map<string, Posting[]>
  frasa: Map<string, number[]>
  vocab: string[]
  trigramKata: Map<string, Set<string>>
  panjang: Map<number, number>
  rataPanjang: number
  judulMap: Map<number, string>
}

let cached: IndeksPencarian | null = null

export function bangunIndeks(): IndeksPencarian {
  if (cached) return cached

  const kata = new Map<string, Posting[]>()
  const frasa = new Map<string, number[]>()
  const panjang = new Map<number, number>()
  const judulMap = new Map<number, string>()
  let totalPanjang = 0

  for (const p of db.pasal) {
    const teksPasal = htmlKeTeks(p.teks)
    const teksPenj = htmlKeTeks(p.penjelasan)
    const semua = `${teksPasal} ${teksPenj}`
    const tokens = norm(semua).split(' ').filter(Boolean)

    panjang.set(p.nomor, tokens.length)
    totalPanjang += tokens.length
    judulMap.set(p.nomor, `${p.babJudul}${p.bagianJudul ? ' — ' + p.bagianJudul : ''}`)

    const tfPasal = new Map<string, number>()
    const tfPenj = new Map<string, number>()
    // buat penanda bagian dengan memetakan token mentah ke bagian
    const tokensPasal = new Set(norm(teksPasal).split(' '))
    for (const t of tokens) {
      const s = stem(t)
      if (s.length < 2) continue
      const diPasal = tokensPasal.has(t)
      const map = diPasal ? tfPasal : tfPenj
      map.set(s, (map.get(s) ?? 0) + 1)
    }
    for (const [s, n] of tfPasal) {
      if (!kata.has(s)) kata.set(s, [])
      kata.get(s)!.push({ nomor: p.nomor, tf: n, bagian: 0 })
    }
    for (const [s, n] of tfPenj) {
      if (!kata.has(s)) kata.set(s, [])
      kata.get(s)!.push({ nomor: p.nomor, tf: n, bagian: 1 })
    }

    // frasa 2-gram dari teks pasal (bobot lebih) + penjelasan
    const frTokens = norm(semua).split(' ')
    for (let i = 0; i < frTokens.length - 1; i++) {
      const key = `${frTokens[i]} ${frTokens[i + 1]}`
      if (!frasa.has(key)) frasa.set(key, [])
      const arr = frasa.get(key)!
      if (arr[arr.length - 1] !== p.nomor) arr.push(p.nomor)
    }
  }

  const vocab = [...kata.keys()]
  const trigramKata = new Map<string, Set<string>>()
  for (const k of vocab) trigramKata.set(k, trigramSet(k))

  cached = {
    kata, frasa, vocab, trigramKata, panjang,
    rataPanjang: totalPanjang / db.pasal.length,
    judulMap,
  }
  return cached
}

export function resetIndeks() { cached = null }
