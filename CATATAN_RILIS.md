# CATATAN RILIS — KUHP DIGITAL v1.0.0

**Tanggal rilis:** 14 November 2026
**Dasar hukum:** Undang-Undang Nomor 1 Tahun 2023 tentang Kitab Undang-Undang Hukum Pidana
**Diundangkan:** 2 Januari 2023 · LN RI Tahun 2023 Nomor 1, TLN RI Nomor 6842

---

## 1. Ringkasan

Versi pertama yang dinyatakan siap pakai. Memuat **seluruh 624 pasal** KUHP beserta penjelasannya, dapat dipakai **sepenuhnya tanpa jaringan**, dengan redaksi yang telah diverifikasi terhadap naskah resmi dan setiap koreksinya dicatat terbuka.

| | |
|---|---|
| Pasal | 624 (Buku Kesatu 1–187 · Buku Kedua 188–624) |
| Bab · Bagian · Paragraf | 43 · 106 · 87 |
| Ayat · Huruf | 1.045 · 433 |
| Kata redaksi · penjelasan | 44.225 · 16.238 |
| Rujukan silang | 405 |
| Konsep hukum | 47 |
| Entri log koreksi | 472 |
| Pemeriksaan lulus | **157 / 157** |
| Galat runtime | **0** |

---

## 2. Yang tersedia pada versi ini

### Membaca
- Redaksi verbatim 624 pasal + penjelasan resmi
- Tipografi khusus dokumen hukum (ukuran, lebar kolom, jarak baris)
- Mode fokus, navigasi `←`/`→`, lompat ke ayat
- Badge koreksi dan panel rujukan antar-pasal

### Mencari
- Empat mesin: nomor pasal, BM25 kata kunci, toleransi salah ketik, kemiripan makna
- 47 konsep hukum terkurasi
- Alasan relevansi per hasil, dalam satu kalimat

### Menelusuri & memahami
- Daftar isi resmi (buku → bab → bagian → paragraf)
- Pemetaan hukum: topik resmi, unsur, ancaman, subjek hukum, pemberat/peringan
- Asisten Hukum dengan 8 tugas tetap

### Mencatat
- Bookmark, riwayat baca, catatan pribadi
- Ruang analisis 4 langkah (fakta → dasar hukum → matriks unsur → kesimpulan)

### Mengeluarkan data
- Ekspor teks (.txt) dan dokumen (.html)
- Cetak / simpan sebagai PDF dengan tata letak khusus
- Cadangan penuh data pengguna (JSON)

### Luring & aksesibilitas
- Service worker: seluruh aplikasi tersedia tanpa jaringan
- Dapat dipasang sebagai aplikasi (PWA) pada HTTPS
- Kontras WCAG AA: 163 elemen terang + 71 elemen gelap, **0 pelanggaran**

---

## 3. Berkas dalam paket

```
kuhp-digital/
├─ dist/                               ← SIAP UNGGAH (hosting statis)
│  ├─ index.html
│  ├─ assets/ (index-*.js, data-*.js, style-*.css)
│  ├─ icons/ (icon.svg, maskable.svg)
│  ├─ manifest.webmanifest
│  └─ sw.js
│
├─ dist-tunggal/
│  └─ KUHP-DIGITAL-luring.html         ← SIAP PAKAI (klik dua kali, tanpa server)
│
├─ src/                                 ← kode sumber lengkap
├─ public/                              ← aset PWA (manifest, sw, ikon)
├─ scripts/
│  ├─ validate_canonical.py            ← 39 pemeriksaan data
│  └─ build_tunggal.py                 ← pembuat berkas tunggal
│
├─ README.md                            ← mulai di sini
├─ DOKUMENTASI_TEKNIS.md                ← arsitektur & batasan
├─ PANDUAN_PENGGUNA.md                  ← cara memakai
├─ PANDUAN_DEPLOYMENT.md                ← cara memasang
├─ CATATAN_RILIS.md                     ← dokumen ini
├─ package.json · package-lock.json
├─ tsconfig.json
└─ vite.config.ts · vite.config.tunggal.ts
```

### Dua cara pakai tercepat

**Ingin langsung memakai?** Buka `dist-tunggal/KUHP-DIGITAL-luring.html` — satu berkas, 1,86 MB, tanpa server.

**Ingin memasang di server?** Unggah isi `dist/` ke akar situs. Tidak perlu aturan rewrite (hash router).

---

## 4. Angka verifikasi

Semua dijalankan ulang pada build final:

| Pemeriksaan | Hasil |
|---|---|
| Uji fungsional (e2e) | **57 / 57 lulus** · 0 galat runtime |
| Kesetiaan redaksi | **47 / 47 lulus** |
| Aksesibilitas & offline | **14 / 14 lulus** |
| Validasi data kanonik | **39 / 39 lulus** |
| Periksa tipe TypeScript | bersih (`tsc --noEmit`) |
| Build produksi | sukses, 3,3 detik |
| **Total** | **157 / 157** |

### Kinerja terukur

| Metrik | Nilai |
|---|---|
| First Contentful Paint | 375–488 ms |
| Pencarian — median | 26–40 ms |
| Pencarian — p95 | 34–56 ms |
| Berpindah pasal | 30–56 ms |
| Bundel produksi | 1.946 KB mentah · 284 KB gzip |

### Uji luring (build produksi)

Jaringan dimatikan total, lima halaman dibuka ulang — Beranda, Pasal 476, Pencarian, Daftar Isi, Pemetaan — **semuanya tampil penuh, 0 galat**.

### Uji berkas tunggal (`file://`)

Beranda, Pasal 476, Pencarian, Bookmark (bertahan setelah muat ulang), dan Ekspor TXT — **semuanya bekerja, 0 galat**.

---

## 5. Perubahan penting sejak draf awal

Bagian ini mencatat hal yang **berubah dari rencana semula**, agar riwayat keputusan tidak hilang.

| # | Hal | Keterangan |
|---|---|---|
| 1 | `teksPolos` & `penjelasanPolos` dihapus dari dataset | Menggandakan ukuran berkas ±25%; kini dihitung saat runtime dan di-cache |
| 2 | Router ditulis sendiri | Tanpa dependensi; `hashchange` + `pushState` agar tombol Back bekerja |
| 3 | Nomor konsep hukum: **47**, bukan 43 | Draf awal menyebut 43; dihitung ulang dari `concepts.ts` pada versi final |
| 4 | Statistik **Huruf 432 → 433** | Akibat perbaikan penomoran Pasal 212 (butir bertambah satu) |
| 5 | Log koreksi **32 → 472 entri** | 440 entri baru berasal dari perapian penanda butir; **tidak ada kata redaksi yang diubah** |
| 6 | Pasal bertanda dikoreksi **32 → 110** | Mengikuti pertambahan log di atas |
| 7 | Ditambahkan build **satu berkas** | Karena build biasa tidak dapat dibuka lewat `file://` (modul ES diblokir CORS) — diuji, bukan diasumsikan |
| 8 | Uji statistik beranda diperketat | Sebelumnya lolos secara kebetulan karena angka `432` juga muncul pada rentang bab “428–432”; kini menguji pasangan label↔angka |

---

## 6. Cacat yang diperbaiki pada siklus ini

Selengkapnya **17 temuan**; rincian penuh ada di `LAPORAN_PENGUJIAN_TAHAP4.md` §7. Tiga yang terakhir patut disebut karena ditemukan dengan cara yang tidak biasa:

| # | Temuan | Dampak |
|---|---|---|
| 14 | Konsep pencarian terpicu oleh kata umum lewat pencocokan stem (`perizinan` → `izin`) | Pasal 275/276/314 keliru muncul untuk fakta pencurian |
| 15 | Keluaran Asisten Hukum berulang & terlalu panjang | Kutipan dibatasi 2 pasal, alasan dijadikan satu kalimat, tabel markdown dihapus |
| 16 | **Label butir tercetak dua kali** (`a. a. pencurian …`) | **189 pasal** terkena; juga memengaruhi salin & ekspor |
| 17 | **Penomoran daftar bersarang salah** pada Pasal 115, 130, 195, 212 | 7 butir tanpa label; sub-butir bernomor dilabeli huruf |

Temuan **16** dan **17** tidak tertangkap oleh uji otomatis — teksnya "benar" secara karakter, hanya tergandakan. Keduanya ditemukan saat memeriksa tangkapan layar secara manual. Hal ini dicatat terbuka sebagai pelajaran: **uji teks tidak menggantikan pemeriksaan visual.**

---

## 7. Batasan v1.0.0

1. **"Pencarian semantik" bukan AI generatif** — pemetaan ke 47 konsep terkurasi, bukan model bahasa.
2. **Matriks unsur tidak membuktikan apa pun** — tanda "—" berarti penanda tidak ditemukan di redaksi, bukan bahwa unsur tidak ada.
3. **Kategori doktrin adalah tafsir**, diberi label demikian.
4. **Dataset statis** — perubahan UU setelah 14 November 2026 tidak tercermin; tidak ada pembaruan otomatis.
5. **`huruf[]` menyimpan 433 dari 750 butir** tingkat pertama di redaksi. Tidak memengaruhi tampilan (pembaca membaca daftar langsung dari HTML), tetapi relevan bila ada yang mengolah data mentah.
6. **Data hanya di peramban** — tidak ada sinkronisasi; membersihkan data situs menghapus bookmark dan catatan.
7. **Bukan nasihat hukum** — rujuk selalu naskah resmi.

---

## 8. Kebutuhan sistem

| | |
|---|---|
| Peramban | Chrome/Edge 100+, Firefox 100+, Safari 15.4+ |
| Untuk berkas tunggal | Peramban saja |
| Untuk build/pengembangan | Node.js 18+ (diuji 20.20.2), npm 9+ (diuji 10.8.2), Python 3.9+ |
| Untuk PWA | HTTPS (kecuali `localhost`) |
| Jaringan | Hanya saat pemuatan pertama |
| Hak istimewa | Tidak ada |

---

## 9. Pernyataan

Seluruh angka pada catatan rilis ini berasal dari perintah yang dijalankan ulang terhadap build final, bukan perkiraan atau salinan dari draf sebelumnya.

Aplikasi ini **bukan** pemberi nasihat hukum. Ia alat bantu baca yang berusaha jujur tentang apa yang diketahuinya dan apa yang tidak — termasuk menampilkan sendiri log koreksinya kepada pengguna.
