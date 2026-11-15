# DOKUMENTASI TEKNIS — KUHP DIGITAL v1.0.0

Dokumen ini menjelaskan **bagaimana** aplikasi dibangun, bukan sekadar apa fiturnya. Setiap angka di sini dapat diperiksa ulang dengan perintah pada §9.

**Dasar hukum:** Undang-Undang Nomor 1 Tahun 2023 tentang Kitab Undang-Undang Hukum Pidana — LN RI Tahun 2023 Nomor 1, TLN RI Nomor 6842.

---

## 1. Prinsip perancangan

Empat keputusan yang membentuk seluruh arsitektur:

| # | Prinsip | Konsekuensi teknis |
|---|---|---|
| 1 | **Offline penuh** | Seluruh data dibundel ke dalam build; tidak ada `fetch` ke domain luar; service worker mem-precache shell + dataset |
| 2 | **Redaksi tidak boleh berubah** | Teks pasal disimpan verbatim; setiap penyimpangan dari naskah resmi dicatat di `koreksi.json` dan dapat dilihat pengguna |
| 3 | **Bedakan fakta dan tafsir** | Keluaran otomatis selalu berlabel ("saran", "bukan kutipan resmi", "label otomatis"); unsur hanya ditandai bila frasa benar-benar ada di redaksi |
| 4 | **Tanpa dependensi berat** | Tanpa router pihak ketiga, tanpa UI kit, tanpa mesin pencari eksternal. Runtime hanya React + Zustand |

---

## 2. Tumpukan teknologi

| Lapisan | Pilihan | Catatan |
|---|---|---|
| Build | Vite 5.4 | `cssCodeSplit: false`, `manualChunks` memisahkan dataset |
| UI | React 18.3 | fungsi komponen + hook |
| Bahasa | TypeScript 5.6 | `strict`, `noUnusedLocals`, `noUnusedParameters` |
| State | Zustand 4.5 | `persist` ke `localStorage`, nama kunci `kuhp:store` |
| Routing | **hash router buatan sendiri** | `src/lib/router.ts`, tanpa dependensi |
| Pencarian | BM25 + fuzzy + konsep, buatan sendiri | `src/search/` |
| Penyimpanan | `localStorage` + IndexedDB | IDB untuk riwayat/arsip besar |
| PWA | `manifest.webmanifest` + `sw.js` | service worker hanya aktif pada build produksi |

**Ukuran build produksi (terukur):**

```
dist/index.html                 0,87 kB │ gzip   0,48 kB
dist/assets/style-*.css        16,64 kB │ gzip   4,75 kB
dist/assets/index-*.js        575,14 kB │ gzip 124,02 kB
dist/assets/data-*.js       1.353,29 kB │ gzip 154,80 kB
─────────────────────────────────────────────────────────
total                       1.946 kB  │ gzip 284 kB
```

---

## 3. Peta modul

```
src/
├─ main.tsx                 titik masuk, memasang <App/>
├─ App.tsx                  tata letak, sidebar, palet, pintasan tombol, pemasangan SW
├─ lib/
│  ├─ types.ts              seluruh tipe domain (Pasal, Ayat, Huruf, Ancaman, Rute, …)
│  ├─ data.ts               pemuat dataset + indeks (byNomor, hierarki, statistik)
│  ├─ format.ts             format angka/tanggal, kutipan, sanitasi HTML, ringkas ancaman
│  ├─ router.ts             ruteKeHash() / hashKeRute() — dua arah
│  └─ storage.ts            pembungkus localStorage + IndexedDB
├─ search/
│  ├─ normalize.ts          normalisasi, stemmer, stopwords, dice, Levenshtein, trigram
│  ├─ concepts.ts           47 konsep hukum (pemicu, istilah, rentang pasal)
│  ├─ index.ts              bangun indeks sekali saat boot (posting, frasa, trigram, BM25)
│  └─ query.ts              pengurai kueri + fusi empat rute + penyusunan hasil
├─ store/useStore.ts        Zustand + persist (tema, preferensi, bookmark, riwayat, catatan)
├─ styles/
│  ├─ tokens.css            variabel warna, jarak, tipografi (terang & gelap)
│  ├─ base.css              reset & utilitas
│  ├─ app.css               tata letak aplikasi
│  ├─ reader.css            tipografi dokumen hukum
│  └─ print.css             aturan cetak
├─ components/              Ikon, ui (Chip/Kartu/Modal/Toast), Sidebar, CommandPalette
└─ features/                satu folder per modul
   ├─ dashboard/            beranda
   ├─ reader/               pembaca pasal
   ├─ search/               halaman pencarian
   ├─ nav/                  daftar isi
   ├─ mapping/              pemetaan hukum + relasi.ts
   ├─ library/              bookmark & riwayat
   ├─ notes/                catatan pribadi
   ├─ ai/                   asisten hukum + provider.ts
   ├─ export/               ekspor & cetak
   ├─ settings/             pengaturan
   └─ about/                sumber & integritas
```

Total **8.861 baris** TypeScript/TSX/CSS.

---

## 4. Model data kanonik

Berkas: `src/data/kuhp-data.json` (1,4 MB, JSON termampat satu baris).

```jsonc
{
  "meta": {
    "produk": "KUHP DIGITAL",
    "nomor": "UU No. 1 Tahun 2023",
    "statistik": { /* lihat §4.1 */ },
    "bukuDaftar": [ { "kode": "BUKU KESATU", "mulai": 1, "selesai": 187 }, … ],
    "sumber": { "utama": …, "verifikasi": …, "metode": … }
  },
  "hierarki": [ /* buku → bab → bagian → paragraf → daftar nomor pasal */ ],
  "pasal": [
    {
      "nomor": 476,
      "buku": "BUKU KEDUA",
      "bab": "XXIV", "babJudul": "TINDAK PIDANA PENCURIAN",
      "bagian": "…", "bagianJudul": "…",
      "paragraf": "…", "paragrafJudul": "…",
      "teks": "<p>Setiap Orang yang mengambil …</p>",
      "penjelasan": "Cukup jelas.",
      "ayat": [
        {
          "nomor": 1,                      // null bila pasal tanpa penomoran ayat
          "teks": "…<ol type=\"a\" class=\"daftar-huruf\"><li …>…</li></ol>",
          "huruf": [ { "label": "a", "teks": "pencurian benda suci …" } ]
        }
      ],
      "ancaman": { "penjara": [["lama","5 (lima)"]], "denda": [["banyak","V","Rp500.000.000"]], … },
      "rujukan": [ 477, 478 ],
      "kataKunci": ["mengambil", "milik", "pencurian", …],
      "adaKoreksi": false,
      "jumlahKoreksi": 0
    }
  ]
}
```

### 4.1 Statistik terverifikasi

| Bidang | Nilai | Cara diperiksa |
|---|---:|---|
| `buku` | 2 | Buku Kesatu 1–187, Buku Kedua 188–624 |
| `bab` | 43 | jumlah bab pada `hierarki` |
| `bagian` | 106 | jumlah bagian |
| `paragraf` | 87 | jumlah paragraf |
| `pasal` | 624 | panjang array `pasal` |
| `ayat` | 1.045 | ayat bernomor |
| `huruf` | 433 | butir berlabel huruf yang tersimpan di `huruf[]` |
| `penjelasanCukupJelas` | 336 | penjelasan berbunyi "Cukup jelas." |
| `kataRedaksi` | 44.225 | kata pada seluruh redaksi |
| `kataPenjelasan` | 16.238 | kata pada seluruh penjelasan |
| `rujukanSilang` | 405 | panjang total `rujukan` |
| `pasalDikoreksi` | 110 | pasal dengan `adaKoreksi: true` |

> **Catatan kejujuran angka `huruf` (433 vs 750).** Korpus memuat **750 butir tingkat pertama** di dalam HTML ayat, tetapi larik `huruf[]` hanya menyimpan **433**. Selisih ini berasal dari ekstraksi tahap awal yang tidak menyalin seluruh butir ke struktur terpisah. **Ini tidak memengaruhi pembaca, pencarian, salin, maupun ekspor**, karena keempatnya membaca daftar langsung dari HTML ayat (sumber tunggal — lihat §7). `huruf[]` kini hanya dipakai sebagai cadangan untuk ayat yang teksnya tidak memuat `<li>` (saat ini: nihil). Angka 433 dipertahankan apa adanya alih-alih dibulatkan menjadi 750, agar statistik tetap dapat diaudit terhadap isi berkas.

### 4.2 Log koreksi

Berkas: `src/data/koreksi.json` — 3 kunci: `meta`, `log`, `integritas`.

Setiap entri log berbentuk:

```jsonc
{
  "pasal": 342,
  "field": "teks" | "penjelasan" | "huruf.teks" | "huruf",
  "jenis": "kata_hilang" | "label_ganda" | "penomoran_daftar" | …,
  "tingkat": "tinggi" | "sedang" | "rendah",
  "catatan": "Penjelasan apa yang salah dan apa yang dilakukan",
  "redaksiFile": "…isi sebelum…",
  "redaksiResmi": "…isi sesudah…",
  "dikoreksiPenuh": true | false
}
```

**472 entri**, terbagi dua kelompok besar:

- **32 koreksi redaksi** (13 pada teks, 19 pada penjelasan) — kata hilang, klausul terpotong, salah ketik OCR. Dibandingkan tiga arah terhadap PDF resmi.
- **440 entri penanda** — pembersihan label butir ganda dan penomoran daftar bersarang (Pasal 115, 130, 195, 212). **Tidak mengubah satu kata pun redaksi.**

Log ini ditampilkan kepada pengguna pada halaman *Sumber & Integritas* → *Log Koreksi*.

---

## 5. Lapisan data (`src/lib/data.ts`)

Dimuat **sinkron saat modul diimpor** karena dataset ikut ter-bundle — tidak ada status "memuat" yang perlu ditangani UI.

```ts
export const db = {
  pasal,        // Pasal[] berurutan
  byNomor,      // Map<number, Pasal> — O(1)
  hierarki,
  meta,
  total,        // 624
  get(n),       // byNomor.get(n)
}
```

Fungsi bantu penting:

- `htmlKeTeks(html)` — membuang tag, mengubah `</p>` dan `</li>` menjadi spasi, mendekode entitas. Dipakai pencarian, salin, dan ekspor.
- `teksPolos(nomor)` / `penjelasanPolos(nomor)` — cache `Map` agar teks polos tidak dihitung berulang.

> **Catatan rancangan.** Versi awal menyimpan `teksPolos` dan `penjelasanPolos` di dalam JSON. Keduanya dihapus karena menggandakan ukuran berkas (±25%), lalu dihitung saat runtime dan di-cache.

---

## 6. Mesin pencarian hibrida

Empat rute berjalan atas kueri yang sama, lalu hasilnya difusikan. Berkas: `src/search/`.

### 6.1 Penguraian kueri (`query.ts`)

Satu kueri dipecah menjadi:

```
"pasal 476 ayat 2 huruf b pencurian"
   → nomorPasal 476 · nomorAyat 2 · huruf "b" · tokens ["pencurian"] · konsep [Pencurian]
```

Pola yang dikenali: `pasal 476`, `476`, `pasal476`, `476 ayat (2)`, `huruf b`.

### 6.2 Rute A — nomor pasal

Bila kueri memuat nomor, pasal tersebut diberi skor tetap **6**; pasal tetangga (`n±1`) diberi skor lebih kecil agar navigasi tetap terasa.

### 6.3 Rute B — BM25 redaksional

Parameter **k1 = 1,5**, **b = 0,75**. IDF dihitung `ln(1 + (N − df + 0,5)/(df + 0,5))`.

Bobot tambahan:

- kemunculan di **redaksi** dikali **1,35** dibanding penjelasan;
- **bonus frasa eksak** bila dua kata atau lebih muncul berurutan.

Ambang masuk: skor **> 0,4**.

### 6.4 Rute C — fuzzy (salah ketik)

Kata yang tidak ada di kosakata dicocokkan lewat **trigram + Dice** dan **Levenshtein**. Pemetaan jarak → kemiripan: `0 → 1,0`, `1 → 1,0`, `2 → 0,78`. Ambang **≥ 0,5**. Ditambah pencocokan nomor pasal.

### 6.5 Rute D — semantik konsep

`concepts.ts` memuat **47 konsep hukum**. Setiap konsep punya:

```ts
{
  id: 'pencurian', nama: 'Pencurian', kategori: 'harta-kekayaan',
  pemicu: ['mencuri', 'mengambil barang', '…'],   // frasa pemicu
  istilah: ['curi', 'mengambil', '…'],            // istilah pendukung
  pasal: [476, 477, …, 481],                      // rentang pasal konsep
  keterangan: '…', bab: 'Buku Kedua BAB XXIV'
}
```

Pemicu dicocokkan sebagai **kata utuh**. Kata generik (`izin`, `orang`, `barang`, `tempat`, `waktu`, …) **dilarang** menjadi pemicu tunggal, dan pencocokan tidak memakai stem — keduanya untuk mencegah pemicu palsu seperti "perizinan" → konsep *Izin*.

### 6.6 Fusi dan penyaringan

1. Semua rute menumpuk skor ke satu `Map<nomor, skor>` sambil mencatat **jenis** kecocokan.
2. Ambang relatif: bila skor tertinggi ≥ 100, buang hasil < **14%**; bila < 100, buang hasil < **20%**. Ini mencegah daftar dipenuhi kecocokan lemah.
3. Alasan relevansi disusun **setelah** penyaringan, satu kalimat per hasil, misalnya:
   `Redaksi memuat "mengambil", "milik", "maksud" · Masuk konsep hukum "Pencurian"`.

### 6.7 Kinerja terukur

| Metrik | Hasil |
|---|---|
| Median | 26–40 ms |
| p95 | 34–56 ms |
| Anggaran uji | ≤ 60 ms |

Indeks dibangun **sekali saat boot** lalu di-cache (`let cached`), sehingga biaya per kueri hanya penelusuran posting.

---

## 7. Pembaca pasal (`features/reader/Reader.tsx`)

Bagian paling sensitif. Aturan yang mengikat:

**Satu sumber untuk daftar butir.** Bila `ayat.teks` sudah memuat `<li>`, daftar dirender **dari HTML itu**. Larik `ayat.huruf` hanya dipakai sebagai cadangan ketika teks tidak memuat daftar. Tanpa aturan ini, butir tercetak dua kali — cacat #16 pada laporan pengujian.

**Label disimpan sekali.** Label butir hanya ada di `huruf.label` dan di `<span class="huruf">` dalam HTML. `huruf.teks` **tidak** memuat label. CSS menyembunyikan marker peramban (`list-style: none`) karena labelnya sudah ada di dalam teks.

**Hierarki penomoran.** `<ol>` tingkat pertama memakai huruf (a, b, c…), `<ol>` bersarang memakai angka (1, 2, 3…) — sesuai naskah resmi.

**Sanitasi.** `sanitasiHtml()` menyaring tag menjadi `p, li, strong, em, b, i, br, ul, ol, span` dan membuang atribut `on*`, `style`, `href`, `src`.

Fitur pembaca: ukuran huruf, lebar baca, jarak baris, mode fokus, panel penjelasan, ringkasan ancaman, badge koreksi, daftar rujukan, navigasi `←`/`→`, salin ayat/pasal, dan lompat ke ayat.

---

## 8. Asisten Hukum (`features/ai/provider.ts`)

**Ini bukan model bahasa generatif.** Seluruhnya fungsi deterministik di atas korpus, tanpa jaringan.

Antarmuka:

```ts
export type TugasAI =
  | 'jelaskan-pasal' | 'cari-dasar-hukum' | 'matriks-unsur' | 'bandingkan'
  | 'ancaman' | 'terkait' | 'ringkas-bab' | 'alasan-penghapus'

export interface PenyediaAI {
  nama: string
  deskripsi: string
  lakukan: (tugas: TugasAI, input: string) => JawabanAI
}
```

Jawaban disusun sebagai **blok berperan**, sehingga UI dapat menandai mana fakta, mana kutipan hukum, mana analisis:

```ts
type PeranBlok = 'fakta' | 'hukum' | 'analisis' | 'peringatan' | 'catatan'
```

`deteksiTugas()` memilih tugas dari kata kunci (`jelaskan`, `bandingkan`, `unsur`, `ancaman`, `terkait`, `ringkas bab`, `alasan pembenar`). Bila tidak ada yang cocok, jatuh ke `cari-dasar-hukum`.

**Batas yang ditegakkan:**

- Kutipan penuh dibatasi **2 pasal teratas**; sisanya berupa rujukan.
- Matriks unsur hanya menandai frasa yang **benar-benar ada** di redaksi. Tanda "—" berarti "tidak ditemukan dalam redaksi", **bukan** "tidak ada dalam hukum".
- Kategori doktrin diberi label sebagai tafsir, bukan kutipan.

---

## 9. Penyimpanan lokal

| Kunci | Isi | Media |
|---|---|---|
| `kuhp:store` | tema, preferensi, bookmark, riwayat, riwayatCari, catatan, analisis | `localStorage` (Zustand persist, versi 1) |
| `kuhp:riwayat` / `kuhp:catatanArsip` | arsip besar | IndexedDB `kuhp-digital` v1 |
| berkas cadangan | 10 kunci data | diunduh pengguna (JSON) |

Preferensi yang disimpan: `ukuranHuruf`, `lebarBaca`, `jarakBaris`, `modeFokus`, `tampilkanPenjelasan`, `tampilkanAncaman`, `tampilkanKoreksi`, `tampilkanRujukan`, `simpanRiwayat`, serta `tema` (`terang` | `gelap` | `sistem`).

Tidak ada data yang dikirim ke mana pun.

---

## 10. Rute URL

| Hash | Halaman |
|---|---|
| `#/` | Beranda |
| `#/pasal/476` · `#/pasal/476/ayat/2` | Pembaca |
| `#/cari?q=pencurian` | Pencarian |
| `#/daftar-isi` | Daftar isi |
| `#/pemetaan` | Pemetaan hukum |
| `#/pustaka` | Bookmark & riwayat |
| `#/catatan` | Catatan pribadi |
| `#/analisis[/id]` | Ruang analisis |
| `#/asisten` | Asisten hukum |
| `#/ekspor` | Ekspor & cetak |
| `#/pengaturan` | Pengaturan |
| `#/tentang[/koreksi\|/sumber]` | Sumber & integritas |

Router memakai `hashchange` + `pushState`, sehingga tombol Back peramban berfungsi. Nomor pasal dijepit ke rentang 1–624.

---

## 11. PWA dan mode luring

`public/sw.js` — versi cache `kuhp-v1.0.0`:

- **Precache** saat instalasi: `/`, `/index.html`, `/manifest.webmanifest`, kedua ikon.
- **Navigasi**: network-first, fallback ke cache (aplikasi tetap terbuka tanpa jaringan).
- **Aset ber-hash**: cache-first (immutable).

Service worker **hanya** terdaftar pada build produksi.

**Diuji nyata:** build produksi dimuat, jaringan dimatikan total (`context.setOffline(true)`), lalu lima halaman dibuka ulang — Beranda, Pasal 476, Pencarian, Daftar Isi, Pemetaan — **semuanya tampil penuh, 0 galat runtime**.

---

## 12. Aksesibilitas

| Aspek | Keadaan |
|---|---|
| Bahasa | `<html lang="id">` |
| Landmark | `main`, `nav`, `aside` masing-masing satu |
| Judul | tepat satu `<h1>` per halaman |
| Ikon dekoratif | `aria-hidden` (0 svg tanpa penanda) |
| Nama tombol | seluruh tombol punya nama aksesibel |
| Fokus | outline terlihat pada seluruh perhentian tab |
| Kontras | **163 elemen terang + 71 elemen gelap, 0 pelanggaran WCAG AA** |
| Gerak | menghormati `prefers-reduced-motion` |
| Target sentuh | nav-item 42 px pada 390 px |

---

## 13. Batasan yang dinyatakan

Dinyatakan terbuka, juga di dalam aplikasi:

1. **"Pencarian semantik" bukan AI generatif.** Ia memetakan kueri ke 47 konsep terkurasi. Fakta di luar daftar konsep tidak akan dikenali.
2. **Matriks unsur tidak membuktikan apa pun.** Tanda "—" berarti frasa tidak ditemukan di redaksi, bukan bahwa unsur itu tidak ada.
3. **Kategori doktrin adalah tafsir**, diberi label demikian.
4. **Dataset statis v1.0.0.** Perubahan UU setelah tanggal build tidak tercermin; tidak ada pembaruan otomatis.
5. **`huruf[]` hanya 433 dari 750 butir** (§4.1) — tidak memengaruhi tampilan, tetapi harus diketahui bila ada yang mengolah data mentah.
6. **Bukan nasihat hukum.** Aplikasi tidak menggantikan naskah resmi pada Lembaran Negara/JDIH.
7. **Data pengguna hanya di peramban.** Membersihkan data situs akan menghapus bookmark dan catatan; pengguna harus mengekspor cadangan.

---

## 14. Cara memverifikasi ulang

```bash
# tipe
cd kuhp-digital && npx tsc --noEmit

# build produksi
npm run build

# aplikasi
npm run dev            # port 5173
npm run preview        # port 4173

# pengujian (aplikasi harus berjalan di 5173)
cd /home/user
node tests/verify_membaca.mjs      # 47/47 kesetiaan redaksi
node tests/e2e.mjs                 # 57/57 fungsional
node tests/aksesibilitas.mjs       # 14/14 a11y + offline
python3 scripts/validate_canonical.py   # 39/39 validasi data
```

**Jumlah: 154 pemeriksaan, semuanya lulus, 0 galat runtime.**
