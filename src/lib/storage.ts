/* ============================================================
   Penyimpanan lokal: preferensi (localStorage) + riwayat & cache (IndexedDB)
   Semua data pengguna tetap di perangkat. Tidak ada pengiriman ke server.
   ============================================================ */

const PREFIX = 'kuhp:'

export const ls = {
  get<T>(kunci: string, bawaan: T): T {
    try {
      const raw = localStorage.getItem(PREFIX + kunci)
      if (raw == null) return bawaan
      return JSON.parse(raw) as T
    } catch {
      return bawaan
    }
  },
  set<T>(kunci: string, nilai: T): void {
    try {
      localStorage.setItem(PREFIX + kunci, JSON.stringify(nilai))
    } catch {
      /* kuota penuh atau mode privat — abaikan */
    }
  },
  hapus(kunci: string): void {
    try { localStorage.removeItem(PREFIX + kunci) } catch { /* noop */ }
  },
  semuaKunci(): string[] {
    const out: string[] = []
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k?.startsWith(PREFIX)) out.push(k.slice(PREFIX.length))
      }
    } catch { /* noop */ }
    return out
  },
  hapusSemua(): void {
    for (const k of this.semuaKunci()) this.hapus(k)
  },
}

/* ---------- IndexedDB minimal (untuk riwayat besar & cache penjelasan) ---------- */
const DB_NAMA = 'kuhp-digital'
const DB_VERSI = 1
const OBJ = ['riwayat', 'catatanArsip'] as const

let dbPromise: Promise<IDBDatabase> | null = null

function bukaDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB tidak tersedia'))
      return
    }
    const req = indexedDB.open(DB_NAMA, DB_VERSI)
    req.onupgradeneeded = () => {
      const d = req.result
      for (const nama of OBJ) {
        if (!d.objectStoreNames.contains(nama)) d.createObjectStore(nama, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

export async function idbPut(toko: string, nilai: { id: string }): Promise<void> {
  try {
    const d = await bukaDb()
    await new Promise<void>((res, rej) => {
      const tx = d.transaction(toko, 'readwrite')
      tx.objectStore(toko).put(nilai)
      tx.oncomplete = () => res()
      tx.onerror = () => rej(tx.error)
    })
  } catch { /* diamkan */ }
}

export async function idbGetAll<T>(toko: string): Promise<T[]> {
  try {
    const d = await bukaDb()
    return await new Promise<T[]>((res, rej) => {
      const tx = d.transaction(toko, 'readonly')
      const req = tx.objectStore(toko).getAll()
      req.onsuccess = () => res(req.result as T[])
      req.onerror = () => rej(req.error)
    })
  } catch {
    return []
  }
}

export async function idbHapus(toko: string, id: string): Promise<void> {
  try {
    const d = await bukaDb()
    await new Promise<void>((res, rej) => {
      const tx = d.transaction(toko, 'readwrite')
      tx.objectStore(toko).delete(id)
      tx.oncomplete = () => res()
      tx.onerror = () => rej(tx.error)
    })
  } catch { /* diamkan */ }
}

export async function idbKosongkan(toko: string): Promise<void> {
  try {
    const d = await bukaDb()
    await new Promise<void>((res, rej) => {
      const tx = d.transaction(toko, 'readwrite')
      tx.objectStore(toko).clear()
      tx.oncomplete = () => res()
      tx.onerror = () => rej(tx.error)
    })
  } catch { /* diamkan */ }
}

/* ---------- Clipboard dengan fallback ---------- */
export async function salin(teks: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(teks)
      return true
    }
  } catch { /* lanjut ke fallback */ }
  try {
    const ta = document.createElement('textarea')
    ta.value = teks
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}
