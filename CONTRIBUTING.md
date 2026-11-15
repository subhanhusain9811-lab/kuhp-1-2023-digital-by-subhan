# Panduan Kontribusi

Terima kasih atas minat Anda. Proyek ini menyangkut teks undang-undang, sehingga aturannya lebih ketat daripada proyek biasa.

---

## 1. Tiga aturan yang tidak bisa ditawar

### 1.1 Redaksi tidak boleh diubah tanpa bukti

Jangan pernah menyunting `src/data/kuhp-data.json` secara langsung untuk "memperbaiki" kalimat yang tampak janggal. Teks itu mungkin memang begitu dalam naskah resmi.

Bila menemukan perbedaan dengan naskah resmi:

1. Sebutkan **pasal, ayat/huruf, dan kutipan persis**.
2. Sertakan **sumber pembanding** (halaman PDF resmi atau tautan JDIH).
3. Tambahkan entri ke `src/data/koreksi.json` dengan bentuk:

```jsonc
{
  "pasal": 342,
  "field": "teks",              // atau "penjelasan"
  "jenis": "kata_hilang",
  "tingkat": "tinggi",          // tinggi | sedang | rendah
  "catatan": "Mengapa diubah",
  "redaksiFile": "…sebelum…",
  "redaksiSesudah": "…sesudah…",
  "dikoreksiPenuh": true
}
```

Setiap koreksi **wajib tercatat**. Koreksi tanpa catatan akan ditolak.

### 1.2 Jangan menyamarkan ketidakpastian

Jangan menambahkan label yang mengesankan kepastian hukum pada keluaran otomatis. Semua hasil analisis harus tetap ditandai sebagai *saran* atau *bukan kutipan resmi*.

### 1.3 Jangan menambah dependensi jaringan

Aplikasi harus tetap berjalan **tanpa internet**. Jangan menambahkan CDN, font eksternal, telemetri, atau API daring.

---

## 2. Menyiapkan lingkungan

```bash
git clone <url-repo>
cd kuhp-digital
npm install
npx playwright install chromium   # sekali, untuk menjalankan uji
npm run dev                        # http://localhost:5173
```

## 3. Sebelum mengirim pull request

Jalankan seluruh pemeriksaan ini dan pastikan **semuanya lulus**:

```bash
npm run typecheck          # TypeScript strict
npm run test:verifikasi    # 39 pemeriksaan data kanonik
npm run build              # harus sukses
npm run preview &          # port 4173, untuk uji luring
npm test                   # 47 + 57 + 12 pemeriksaan
```

Bila menyentuh bagian tampilan, **periksa juga secara visual** — beberapa cacat tidak tertangkap uji teks. Ini bukan teori: cacat label butir ganda (`a. a. pencurian …`) pada 189 pasal hanya ketahuan dari tangkapan layar, karena teksnya "benar" secara karakter.

## 4. Gaya kode

- **TypeScript strict** — hindari `any`.
- **Bahasa Indonesia** untuk komentar, nama fungsi, dan teks antarmuka. Nama tipe domain memakai istilah Indonesia (`Pasal`, `Ayat`, `Huruf`, `Rancangan`).
- **Tanpa dependensi baru** kecuali benar-benar perlu dan tidak memerlukan jaringan.
- Komentar menjelaskan **mengapa**, bukan sekadar mengulang **apa**.

## 5. Struktur commit

```
<tiga kata area>: <ringkasan singkat>

Penjelasan mengapa perubahan ini perlu, bila tidak jelas dari judul.
```

Contoh:

```
pembaca: sembunyikan marker peramban agar label tidak ganda

Label butir sudah ada di dalam data (span.huruf). Marker bawaan peramban
menimpanya sehingga tercetak "a. a. pencurian …" pada 189 pasal.
```

## 6. Melaporkan masalah

Saat melaporkan cacat tampilan atau data, sertakan:

- Nomor pasal (dan ayat/huruf bila ada)
- Apa yang tampak vs apa yang seharusnya
- Tangkapan layar bila menyangkut tampilan
- Peramban dan versinya

Gunakan template issue yang tersedia.

## 7. Yang tidak akan diterima

- Perubahan redaksi tanpa sumber pembanding
- Fitur yang memerlukan jaringan
- Klaim hukum normatif yang disajikan sebagai kepastian (mis. "pasal ini pasti berlaku untuk kasus X")
- Dependensi yang menambah ukuran bundel secara berarti tanpa alasan kuat

## 8. Lisensi kontribusi

Dengan mengirim pull request, Anda menyetujui kontribusi Anda dilisensikan dengan MIT, sama seperti proyek ini.
