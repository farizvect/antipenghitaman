/**
 * Decision models reachable through the OpenRouter Decisions API.
 *
 * Source of truth: OpenRouter's model list filtered to decision models
 * (`GET /api/v1/models?output_modalities=decisions`). Every id below was
 * probed against `POST /api/alpha/decisions` and returned a typed answer.
 *
 * `resolveDecisionModel` still accepts any well-formed id, so you can point the
 * app at a model that isn't listed here yet (new decision models ship often).
 */
export type DecisionModel = {
  id: string;
  label: string;
  note: string;
};

export const DECISION_MODELS: readonly DecisionModel[] = [
  // TypeSafe — the original System One family.
  { id: "~typesafe/jev-latest", label: "TypeSafe · Jev Latest", note: "Newest Jev release (alias)" },
  { id: "typesafe/jev-1.13", label: "TypeSafe · Jev 1.13", note: "Pinned Jev 1.13" },
  // Cloudflare — open-weight Clef family.
  { id: "cloudflare/clef", label: "Cloudflare · Clef", note: "27B, multimodal" },
  { id: "cloudflare/clef-flash", label: "Cloudflare · Clef Flash", note: "Fast 9B, low latency" },
  { id: "cloudflare/clef-omni", label: "Cloudflare · Clef Omni", note: "MoE, text/image/audio/video" },
  // Microsoft.
  { id: "microsoft/microsoft-decision-1", label: "Microsoft · Decision-1", note: "Qwen3.5-9B post-train" },
  // OpenAI.
  { id: "openai/gpt-6-luna-decisions", label: "OpenAI · GPT-6 Luna Decisions", note: "Hosted Decisions API" },
  // Perplexity.
  { id: "perplexity/pplx-decider-v1.1-27b", label: "Perplexity · Decider V1.1 27B", note: "Open weights, multimodal" },
  { id: "~perplexity/pplx-decider-27b-latest", label: "Perplexity · Decider 27B Latest", note: "Latest Decider (alias)" },
  // Nace.AI — Drex.
  { id: "nace-ai/drex-v1.5", label: "Nace.AI · Drex v1.5", note: "9B" },
  { id: "nace-ai/drex-v2.0", label: "Nace.AI · Drex v2.0", note: "35B MoE (3B active)" },
  // Liquid AI.
  { id: "liquid/d1", label: "LiquidAI · d1", note: "Text + image" },
  // Upstage — Solar Decide.
  { id: "upstage/solar-decide", label: "Upstage · Solar Decide", note: "512K context" },
  { id: "upstage/solar-decide-flash", label: "Upstage · Solar Decide Flash", note: "Low latency, 512K context" },
  // Inception — Mercury Decide (free tier available).
  { id: "inception/mercury-decide", label: "Inception · Mercury Decide", note: "Hosted" },
  { id: "inception/mercury-decide:free", label: "Inception · Mercury Decide (free)", note: "Rate-limited free tier" },
  // ScaleDown.
  { id: "scaledown/classify-1", label: "ScaleDown · Classify-1", note: "Document scoring" },
  // Together AI.
  { id: "togethercomputer/tev1-4b-experimental", label: "Together · Tev1 4B", note: "Experimental" },
  // Community / open weights.
  { id: "jaredpalmer/kev-4b", label: "Jared Palmer · Kev 4B", note: "Community" },
  { id: "respan/span-01", label: "Respan · Span-01", note: "String state only" },
  { id: "respan/span-01-lite", label: "Respan · Span-01 Lite", note: "String state only" },
  { id: "respan/span-01-lite:free", label: "Respan · Span-01 Lite (free)", note: "Rate-limited free tier" },
];

/** Default model. Override with the DECISION_MODEL env var. */
export const DEFAULT_DECISION_MODEL = process.env.DECISION_MODEL?.trim() || DECISION_MODELS[0]!.id;

const MAX_MODEL_ID_LENGTH = 120;
// "author/model", optional "~" alias prefix and ":free" suffix; bare ids like "jev-1.13" pass too.
const MODEL_ID_PATTERN = /^~?[A-Za-z0-9._-]+(\/[A-Za-z0-9._:-]+)?$/;

export class InvalidModelError extends Error {}

/** Accepts any well-formed OpenRouter model id; blank input falls back to the default. */
export function resolveDecisionModel(input: unknown): string {
  if (input === undefined || input === null) return DEFAULT_DECISION_MODEL;
  if (typeof input !== "string") throw new InvalidModelError('Field "model" must be a string');
  const id = input.trim();
  if (id.length === 0) return DEFAULT_DECISION_MODEL;
  if (id.length > MAX_MODEL_ID_LENGTH || !MODEL_ID_PATTERN.test(id)) {
    throw new InvalidModelError(
      'Field "model" must be an OpenRouter model id such as "~typesafe/jev-latest"',
    );
  }
  return id;
}
