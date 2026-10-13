# API klasifikasi komentar negatif

API HTTP buat nentuin apakah sebuah komentar atau teks itu negatif. Client nggak perlu kirim API key; server yang nyimpen `OPENROUTER_API_KEY` dan manggil OpenRouter Decisions API pakai model `~typesafe/jev-latest`.

Ada UI simulasi di `http://localhost:3001`. Feed-nya nampilin komentar dari YouTube, TikTok, Twitch, dan Kick, dan logo di tiap komentar nunjukin asalnya dari platform mana. Kirim komentar buat lihat klasifikasinya jalan. Komentar negatif ditandai terus dihancurin pakai animasi. Demo-nya ada 100 komentar multibahasa. Tombol **Paste bulk** nerima sampai 20 komentar sekaligus, satu komentar per baris. **Speed** ngatur paralelisme demo dan bulk (1×, 2×, 3×; default 3×), sementara slider **Negative threshold** ngatur seberapa sensitif klasifikasinya.

## Demo

GIF singkat alur moderasinya (paste batch komentar → klasifikasi → komentar negatif dihancurin):

<img src="docs/demo.gif" width="100%" alt="Demo moderasi komentar">

Video kualitas penuh: [`docs/demo.mp4`](docs/demo.mp4)

## Menjalankan

Butuh Node.js 22.18 ke atas.

```bash
npm install
cp .env.example .env
# isi OPENROUTER_API_KEY di .env
npm run dev
```

Buat production:

```bash
npm run build
npm start
```

## Endpoint

### `POST /classify`

Client nggak perlu header API key.

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

- `score`: peluang teksnya negatif menurut Jev, dari 0 sampai 1.
- `negative`: `true` kalau `score >= NEGATIVE_THRESHOLD` (default `0.5`).
- `confidence`: seberapa yakin model sama hasil boolean yang dipilih.

### `GET /health`

Balikin `{ "ok": true }` tanpa manggil OpenRouter.

## Integrasi live comment

Tarik komentar langsung dari live chat platform. Read-only, nggak butuh API key.

### `GET /live/stream` (SSE)

```bash
curl -N 'http://localhost:3001/live/stream?platform=twitch&channel=nix'
```

- `platform`: `twitch` | `kick` | `youtube` | `tiktok`
- `channel`: username / slug / handle platform
- `video` (opsional, YouTube): id video live, kalau mau skip lookup channel

Event yang dikirim:

```
event: status
data: {"state":"connecting","platform":"twitch","channel":"nix"}

event: status
data: {"state":"open"}

event: comment
data: {"platform":"twitch","channel":"nix","id":"…","author":"ggadki","text":"!турнир","at":"2026-10-13T15:13:20.902Z"}

event: error
data: {"message":"…"}
```

Bisa juga tes adapter-nya langsung dari terminal (tanpa server):

```bash
npm run live -- twitch nix
npm run live -- kick tjr
npm run live -- youtube LofiGirl 1-LpQekNa9g
npm run live -- tiktok <username-yang-sedang-live>
```

Catatan per platform (semuanya read-only, tanpa key):

- **Twitch**: `tmi.js` (IRC). Paling stabil.
- **Kick**: realtime Centrifugo-nya Kick (`web.kick.com/api/v1/realtime` + websocket). Nggak resmi, bisa berubah kapan aja.
- **YouTube**: `youtubei.js` (innertube). Butuh stream yang sedang live dan chat-nya aktif; ini yang paling rapuh.
- **TikTok**: `tiktok-live-connector`. Butuh akun yang sedang LIVE (plus signature TikTok).

Adapter-nya ada di `src/sources/`, satu file per platform, dengan `src/sources/index.ts` sebagai registry. Dipakai bareng sama endpoint SSE di `src/server.ts` dan CLI di `src/sources/cli.ts`.

## Keamanan

`.env` udah masuk `.gitignore`. Jangan taruh key OpenRouter di source code atau kirim dari client. Endpoint-nya sengaja nggak pakai autentikasi sesuai kebutuhan; sebelum dibuka ke internet, tambahin rate limit atau auth dulu biar kredit OpenRouter nggak disalahgunakan orang.
