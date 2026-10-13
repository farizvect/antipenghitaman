# Negative comment classification API

A small HTTP API that decides whether a comment or a piece of text is negative. The client doesn't send an API key; the server holds `OPENROUTER_API_KEY` and calls the OpenRouter Decisions API with a decision model (Jev by default — switch it in the UI or per request).

There's a simulation UI at `http://localhost:3001`. The feed pulls comments from YouTube, TikTok, Twitch, and Kick, and each comment shows a logo for the platform it came from. Send a comment to watch it get classified. Negative ones get flagged and destroyed with an animation. The demo ships 100 comments across a dozen languages. **Paste bulk** takes up to 20 comments at once, one per line. **Speed** sets the parallelism for the demo and bulk runs (1×, 2×, 3×; 3× by default). The **Negative threshold** slider controls how sensitive the classifier is, and the **Decision model** field picks which model answers (type any id, or choose from the list).

## Demo

Short GIF of the moderation flow (paste a batch of comments → classify → negative ones get destroyed):

<img src="docs/demo.gif" width="100%" alt="Comment moderation demo">

Full-quality video: [`docs/demo.mp4`](docs/demo.mp4)

## Which decision model should I use?

There's no single winner, so here's the honest picture. Three things matter: **accuracy**, **price**, and **speed** — and the boards disagree on purpose (vendor-run vs independent).

**Fastest path to a good default:** start with **Perplexity Decider V1.1 27B** (best independent accuracy, $0.02/M) or **Microsoft-Decision-1** (ties the leaders on accuracy, $0.042/M). Keep **Jev** if you want the most battle-tested option. Reach for **Clef Flash** when latency and price dominate.

### Independent accuracy + latency + price

Numbers from [AkitaOnRails' independent test](https://akitaonrails.com/en/2026/10/10/which-jev-like-ai-decision-classifier-model-is-best/) — 168 compact cases, half English half Portuguese, run against each vendor's own API (or locally for the open ones). Treat them as a snapshot, not gospel.

| Model (OpenRouter id) | Maker | $/1M in | Indep. accuracy | Median latency | 10k decisions |
|---|---|---|---|---|---|
| `perplexity/pplx-decider-v1.1-27b` | Perplexity | $0.02 | **99.4%** | 1,547 ms\* | — |
| `~typesafe/jev-latest` | TypeSafe | $0.042 | 97.6% | 255 ms | $0.19 |
| `microsoft/microsoft-decision-1` | Microsoft | $0.042 | 97.6% | 422 ms | **$0.065** |
| `cloudflare/clef` | Cloudflare | $0.042 | 95.8% | 302 ms | $0.63 |
| `openai/gpt-6-luna-decisions` | [OI] | $0.10 | 90.5% | 222 ms | $0.23 |
| `cloudflare/clef-flash` | Cloudflare | $0.021 | 87.5% | 394 ms | $0.10 |
| `jaredpalmer/kev-4b` | Jared Palmer | $0.042 | 87.5% | 246 ms | — |

\* measured on a local LAN box, not an API, so not comparable to the rest.

### Independent quality board (Decision Index 0.3.2)

[The Decision Index](https://huggingface.co/spaces/multimodalart/jev-decision-index) scores 160 models on the same 110,201 requests, then puts 80% of the weight on private tests nobody can train on. Higher is better. Only the models this app lists are shown.

| Model (OpenRouter id) | Full score |
|---|---|
| `perplexity/pplx-decider-v1.1-27b` | 62.8 |
| `~typesafe/jev-latest` | 60.1 |
| `nace-ai/drex-v2.0` | 55.9 |
| `cloudflare/clef` | 53.1 |
| `nace-ai/drex-v1.5` | 49.7 |
| `cloudflare/clef-omni` | 48.3 |
| `cloudflare/clef-flash` | 47.5 |
| `jaredpalmer/kev-4b` | 39.5 |
| `liquid/d1` | 38.9 |
| `togethercomputer/tev1-4b-experimental` | 34.1 |

Microsoft-Decision-1, GPT-6 Luna, Upstage Solar Decide, Inception Mercury, ScaleDown Classify-1 and Respan Span-01 aren't on this board yet — no independent number exists for them.

### What people actually run

Live request volume on OpenRouter ([source](https://openrouter.ai/rankings/decisions), week of Oct 12 2026). Popularity isn't accuracy, but it's a good proxy for "battle-tested."

| Rank | Model | Weekly requests |
|---|---|---|
| 1 | Jev 1.13 | 1.07B |
| 2 | Perplexity Decider V1.1 27B | 21.7M |
| 3 | GPT-6 Luna Decisions | 19.9M |
| 4 | Drex v1.5 | 12.4M |
| 5 | Clef Flash | 11.2M |
| 6 | Mercury Decide (free) | 10.9M |
| 7 | Microsoft-Decision-1 | 10.7M |

### Quick picks

- **Best overall (independent boards):** `perplexity/pplx-decider-v1.1-27b` — top accuracy and top Decision Index, cheap at $0.02/M.
- **Cheapest hosted that keeps up:** `microsoft/microsoft-decision-1` — ties the leaders on accuracy for a third of Jev's cost per decision.
- **Safest default:** `~typesafe/jev-latest` — ~1.07B requests/week and the fastest of the hosted leaders.
- **Fast and cheap:** `cloudflare/clef-flash` at $0.021/M.
- **Free to try:** `inception/mercury-decide:free` and `respan/span-01-lite:free`.
- **Multimodal state (image/audio/video):** `cloudflare/clef-omni`.
- **Long documents:** `upstage/solar-decide-flash` (512K context).

Caveats: some numbers are vendor-run (Microsoft, Perplexity) and can't be compared head to head; the independent boards are small and synthetic. Measure with **your own** comments before you commit — that's what the `model` field is for.

## Running it

Needs Node.js 22.18 or newer.

```bash
npm install
cp .env.example .env
# put your OPENROUTER_API_KEY in .env
npm run dev
```

For production:

```bash
npm run build
npm start
```

## Endpoints

### `POST /classify`

No API key header needed from the client.

```bash
curl http://localhost:3001/classify \
  -H 'Content-Type: application/json' \
  -d '{"text":"Pelayanannya buruk dan sangat mengecewakan"}'
```

Body:

- `text` (required): the comment to classify.
- `threshold` (optional): 0–1, overrides `NEGATIVE_THRESHOLD`.
- `model` (optional): any OpenRouter decision model id, e.g. `~typesafe/jev-latest`, `cloudflare/clef-flash`, or `microsoft/microsoft-decision-1`. Falls back to `DECISION_MODEL` (default `~typesafe/jev-latest`).

Example response:

```json
{
  "negative": true,
  "score": 0.99,
  "confidence": 0.99,
  "model": "typesafe/jev-1.13-20260917"
}
```

- `score`: how likely the text is negative, from 0 to 1.
- `negative`: `true` when `score >= NEGATIVE_THRESHOLD` (default `0.5`).
- `confidence`: how sure the model is about the boolean it picked.
- `model`: the concrete model that answered (an alias resolves to its pinned release).

### `GET /models`

Lists the decision models the app knows about, plus the current default. There are ~22 decision models on OpenRouter across TypeSafe (Jev), Cloudflare (Clef), Microsoft, [OI] (GPT-6 Luna), Perplexity, Nace.AI, Liquid, Upstage, Inception, ScaleDown, Together, and a few community ones. The `/classify` `model` field still accepts any id, listed or not.

```bash
curl http://localhost:3001/models
```

```json
{
  "default": "~typesafe/jev-latest",
  "models": [
    { "id": "~typesafe/jev-latest", "label": "TypeSafe · Jev Latest", "note": "Newest Jev release (alias)" },
    { "id": "cloudflare/clef-flash", "label": "Cloudflare · Clef Flash", "note": "Fast 9B, low latency" },
    { "id": "microsoft/microsoft-decision-1", "label": "Microsoft · Decision-1", "note": "Qwen3.5-9B post-train" },
    { "id": "openai/gpt-6-luna-decisions", "label": "[OI] · GPT-6 Luna Decisions", "note": "Hosted Decisions API" }
  ]
}
```

### `GET /health`

Returns `{ "ok": true }` without calling OpenRouter.

## Live comment integration

Pull comments straight from a platform's live chat. Read-only, no API key.

### `GET /live/stream` (SSE)

```bash
curl -N 'http://localhost:3001/live/stream?platform=twitch&channel=nix'
```

- `platform`: `twitch` | `kick` | `youtube` | `tiktok`
- `channel`: username / slug / handle on that platform
- `video` (optional, YouTube): a live video id, to skip the channel lookup

Events it sends:

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

You can also test an adapter straight from the terminal (no server):

```bash
npm run live -- twitch nix
npm run live -- kick tjr
npm run live -- youtube LofiGirl 1-LpQekNa9g
npm run live -- tiktok <username-currently-live>
```

Per-platform notes (all read-only, no key):

- **Twitch**: `tmi.js` (IRC). The most stable of the four.
- **Kick**: Kick's Centrifugo realtime (`web.kick.com/api/v1/realtime` + websocket). Unofficial, so it can break anytime.
- **YouTube**: `youtubei.js` (innertube). Needs a stream that's live with chat on; the most fragile.
- **TikTok**: `tiktok-live-connector`. Needs an account that's currently LIVE (and TikTok's signature).

Adapters live in `src/sources/`, one file per platform, with `src/sources/index.ts` as the registry. Both the SSE endpoint in `src/server.ts` and the CLI in `src/sources/cli.ts` use it.

## Security

`.env` is gitignored. Don't put the OpenRouter key in source or send it from the client. The endpoint deliberately has no auth for this use case; before you expose it to the internet, add rate limiting or auth first so nobody burns your OpenRouter credits.
