# API klasifikasi komentar negatif

API HTTP sederhana untuk menentukan apakah komentar/teks bersifat negatif. API publik lokal tidak meminta key dari pemanggil; server menyimpan `OPENROUTER_API_KEY` dan memanggil OpenRouter Decisions API dengan model alias terbaru `~typesafe/jev-latest`.

Website simulasi tersedia di `http://localhost:3001`. Feed menggabungkan komentar dari YouTube, TikTok, Twitch, dan Kick; logo pada setiap komentar menunjukkan platform asalnya. Kirim komentar untuk melihat proses klasifikasi. Komentar negatif akan ditandai dan dihancurkan dengan animasi. Demo berisi 100 komentar multibahasa. Tombol **Paste bulk** menerima hingga 20 komentar sekaligus dengan format satu komentar per baris. Kontrol **Speed** mengatur paralelisme demo dan bulk ke 1×, 2×, atau 3× (default 3×), sementara slider **Negative threshold** mengatur sensitivitas klasifikasi.

## Demo

Rekaman singkat alur moderasi (paste batch komentar → klasifikasi → komentar negatif dihancurkan): [`docs/demo.mp4`](docs/demo.mp4)

https://github.com/farizvect/antipenghitaman/raw/main/docs/demo.mp4


## Menjalankan

Butuh Node.js 22.18 atau lebih baru.

```bash
npm install
cp .env.example .env
# Isi OPENROUTER_API_KEY di .env
npm run dev
```

Untuk production:

```bash
npm run build
npm start
```

## Endpoint

### `POST /classify`

Tidak memerlukan header API key dari client.

```bash
curl http://localhost:3001/classify \
  -H 'Content-Type: application/json' \
  -d '{"text":"Pelayanannya buruk dan sangat mengecewakan"}'
```

Contoh respons:

```json
{
  "negative": true,
  "score": 0.94,
  "confidence": 0.94,
  "model": "typesafe/jev-1.13-20260917",
  "cost_usd": 0.00002
}
```

- `score`: probabilitas teks negatif dari Jev, antara 0 dan 1.
- `negative`: `true` jika `score >= NEGATIVE_THRESHOLD` (default `0.5`).
- `confidence`: keyakinan untuk hasil boolean yang dipilih.

### `GET /health`

Mengembalikan `{ "ok": true }` tanpa memanggil OpenRouter.

## Keamanan

`.env` sudah diabaikan Git. Jangan memasukkan key OpenRouter ke source code atau mengirimkannya dari client. Endpoint sengaja tidak memakai autentikasi sesuai kebutuhan ini; sebelum dipublikasikan ke internet, tambahkan rate limit atau autentikasi agar kredit OpenRouter tidak disalahgunakan.
