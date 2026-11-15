# KUHP DIGITAL

**Pusat Referensi Hukum Pidana dalam Satu Genggaman**

[![Verifikasi](https://github.com/subhanhusain981-lab/kuhp-1-2023-digital-by-subhan/actions/workflows/verifikasi.yml/badge.svg)](https://github.com/subhanhusain981-lab/kuhp-1-2023-digital-by-subhan/actions/workflows/verifikasi.yml)
![Lisensi](https://img.shields.io/badge/lisensi-MIT-blue.svg)
![Versi](https://img.shields.io/badge/versi-1.0.0-informational.svg)
![Luring](https://img.shields.io/badge/100%25-luring-success.svg)

Aplikasi referensi luring (offline-first) untuk **Undang-Undang Nomor 1 Tahun 2023 tentang Kitab Undang-Undang Hukum Pidana** — 624 pasal, redaksi verbatim, pencarian hibrida, dan catatan pribadi. Seluruh data tersimpan di dalam aplikasi; tidak ada permintaan jaringan setelah pemuatan pertama.

| | |
|---|---|
| **Versi** | 1.0.0 |
| **Dasar hukum** | UU No. 1 Tahun 2023 tentang KUHP |
| **Diundangkan** | 2 Januari 2023 — LN RI Tahun 2023 Nomor 1, TLN RI Nomor 6842 |
| **Cakupan** | Pasal 1–624 · 2 buku · 43 bab · 106 bagian · 87 paragraf |
| **Teknologi** | Vite 5 · React 18 · TypeScript 5 (strict) · Zustand |
| **Status uji** | 157/157 pemeriksaan lulus · 0 galat runtime |
| **Lisensi data** | Teks undang-undang adalah dokumen publik Pemerintah RI |

---

## 1. Apa yang bisa dilakukan

- **Membaca** redaksi resmi 624 pasal beserta penjelasannya, dengan tipografi khusus dokumen hukum.
- **Mencari** dengan tiga lapis sekaligus: kata kunci (BM25), salah ketik (fuzzy), dan kemiripan makna lewat 47 konsep hukum terkurasi.
- **Menelusuri** struktur resmi: buku → bab → bagian → paragraf → pasal.
- **Memetakan** tindak pidana populer ke rentang pasalnya (pencurian, pembunuhan, penipuan, dst.).
- **Bertanya** ke Asisten Hukum: 8 tugas (fakta → dasar hukum, matriks unsur, perbandingan pasal, dst.).
- **Mencatat**: bookmark, riwayat baca, catatan pribadi, dan ruang analisis unsur.
- **Mengekspor**: teks (.txt), dokumen (.html), atau cetak/PDF.

## 2. Prasyarat

- **Node.js 18 atau lebih baru** (diuji pada Node 20.20.2) — hanya untuk menjalankan atau membangun dari sumber.
- Peramban modern: Chrome/Edge 100+, Firefox 100+, Safari 15.4+.
- Untuk memakai aplikasi saja (tanpa build), cukup peramban — lihat [PANDUAN_DEPLOYMENT.md](PANDUAN_DEPLOYMENT.md).

## 3. Menjalankan cepat

```bash
cd kuhp-digital
npm install
npm run dev
```

Buka `http://localhost:5173`.

## 4. Membangun versi produksi

```bash
npm run build      # keluaran di dist/
npm run preview    # uji hasil build di http://localhost:4173
```

Hasil build berukuran **±1,9 MB** (266 KB gzip) dan sepenuhnya statis — dapat dilayani server apa pun, termasuk dari berkas lokal.

## 5. Menjalankan pengujian

```bash
npx playwright install chromium   # sekali saja
npm test                          # 47 + 57 + 14 pemeriksaan
npm run test:verifikasi           # 39 pemeriksaan data kanonik
```

Butuh aplikasi berjalan di port 5173 (`npm run dev`). Untuk uji mode luring,
jalankan juga `npm run preview` di port 4173.

| Suite | Jumlah | Isi |
|---|---:|---|
| `test:redaksi` | 47 | Teks yang dirender dibandingkan dengan dataset kanonik |
| `test:e2e` | 57 | 10 modul, termasuk performa & responsif |
| `test:a11y` | 14 | Aksesibilitas, kontras WCAG, dan mode luring sungguhan |
| `test:verifikasi` | 39 | Integritas data: kelengkapan pasal, ayat, koreksi |

## 6. Dokumentasi

| Dokumen | Isi |
|---|---|
| [DOKUMENTASI_TEKNIS.md](DOKUMENTASI_TEKNIS.md) | Arsitektur, model data, mesin pencari, batasan yang dinyatakan |
| [PANDUAN_PENGGUNA.md](PANDUAN_PENGGUNA.md) | Cara memakai setiap fitur, langkah demi langkah |
| [PANDUAN_DEPLOYMENT.md](PANDUAN_DEPLOYMENT.md) | Cara memasang di server, hosting statis, atau intranet |
| [CATATAN_RILIS.md](CATATAN_RILIS.md) | Isi versi 1.0.0, angka verifikasi, berkas paket |
| [LAPORAN_AUDIT_TAHAP1.md](../LAPORAN_AUDIT_TAHAP1.md) | Audit sumber data |
| [LAPORAN_PENGUJIAN_TAHAP4.md](../LAPORAN_PENGUJIAN_TAHAP4.md) | Hasil pengujian lengkap |

## 7. Susunan berkas

```
kuhp-digital/
├─ index.html                 # kerangka HTML
├─ vite.config.ts             # konfigurasi build & server
├─ public/
│  ├─ manifest.webmanifest    # metadata PWA
│  ├─ sw.js                   # service worker (precache + offline)
│  └─ icons/                  # ikon SVG
├─ tests/                     # 4 rangkaian uji (Playwright + Python)
├─ scripts/                   # validator data & pembuat berkas tunggal
├─ .github/workflows/         # CI: tipe → build → uji
└─ src/
   ├─ main.tsx                # titik masuk
   ├─ App.tsx                 # kerangka tata letak & pintasan papan tombol
   ├─ data/                   # ← SELURUH TEKS UNDANG-UNDANG
   │  ├─ kuhp-data.json       # korpus kanonik (1,4 MB)
   │  └─ koreksi.json         # log 472 koreksi + ringkasan integritas
   ├─ lib/                    # data, tipe, format, router, penyimpanan
   ├─ search/                 # normalisasi, konsep, indeks, kueri
   ├─ store/                  # Zustand + persistensi
   ├─ styles/                 # token, dasar, aplikasi, pembaca, cetak
   ├─ components/             # Ikon, ui, Sidebar, CommandPalette
   └─ features/               # satu folder per modul
```

## 8. Pintasan papan tombol

| Tombol | Fungsi |
|---|---|
| `Ctrl/⌘ + K` atau `/` | Buka palet perintah |
| `Ctrl/⌘ + B` | Tampilkan/sembunyikan sidebar |
| `←` / `→` | Pasal sebelumnya / berikutnya (saat membaca) |
| `Esc` | Tutup palet atau dialog |

## 9. Etika dan batas penggunaan

Aplikasi ini adalah **alat bantu baca**, bukan pemberi nasihat hukum dan bukan pengganti naskah resmi.

- Redaksi pasal disalin verbatim; **32 pasal** pernah dikoreksi dan setiap koreksi tercatat terbuka di `koreksi.json`.
- Ringkasan ancaman pidana, label kategori, dan seluruh keluaran Asisten Hukum **dihasilkan otomatis** — selalu ditandai "saran" atau "bukan kutipan resmi".
- Pencarian "semantik" memakai **47 konsep hukum terkurasi**, bukan model bahasa generatif; ia tidak memahami fakta di luar daftar konsep itu.
- Untuk keperluan resmi, rujuk selalu salinan resmi pada Lembaran Negara atau JDIH.

## 10. Lisensi dan status

Seluruh angka pada dokumentasi ini berasal dari pengujian yang dijalankan ulang, bukan perkiraan. Bila ada yang tidak dapat diverifikasi, hal itu dinyatakan apa adanya — lihat bagian "Batasan yang dinyatakan" pada [DOKUMENTASI_TEKNIS.md](DOKUMENTASI_TEKNIS.md).

**Lisensi kode:** MIT — lihat [LICENSE](LICENSE).
**Teks undang-undang:** dokumen publik Pemerintah RI; aplikasi ini tidak mengklaim hak cipta atasnya.

Kontribusi dipersilakan — baca [CONTRIBUTING.md](CONTRIBUTING.md) lebih dahulu, terutama tiga aturan yang tidak bisa ditawar.
