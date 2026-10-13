import { DEFAULT_DECISION_MODEL } from "./decision-models.js";

const OPENROUTER_DECISIONS_URL = "https://openrouter.ai/api/alpha/decisions";
const DEFAULT_THRESHOLD = 0.5;
const DEFAULT_TIMEOUT_MS = 15_000;

type NoulAnswer = {
  type: "noul";
  noul: number;
};

type DecisionsResponse = {
  id?: string;
  model?: string;
  provider?: string;
  answers?: {
    negative?: NoulAnswer;
  };
  usage?: {
    cost?: number;
  };
  error?: {
    code?: number;
    message?: string;
  };
};

export type ClassificationResult = {
  negative: boolean;
  score: number;
  confidence: number;
  model: string;
  cost_usd: number | null;
};

export class ConfigurationError extends Error {}

export class OpenRouterError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export type ClassifierOptions = {
  apiKey?: string;
  model?: string;
  threshold?: number;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

function numberInRange(value: number | undefined, fallback: number, min: number, max: number): number {
  return value !== undefined && Number.isFinite(value) && value >= min && value <= max
    ? value
    : fallback;
}

export async function classifyText(
  text: string,
  options: ClassifierOptions = {},
): Promise<ClassificationResult> {
  const apiKey = options.apiKey ?? process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new ConfigurationError("OPENROUTER_API_KEY belum dikonfigurasi");
  }

  const model = options.model ?? DEFAULT_DECISION_MODEL;
  const threshold = numberInRange(
    options.threshold ?? Number(process.env.NEGATIVE_THRESHOLD),
    DEFAULT_THRESHOLD,
    0,
    1,
  );
  const timeoutMs = numberInRange(
    options.timeoutMs ?? Number(process.env.OPENROUTER_TIMEOUT_MS),
    DEFAULT_TIMEOUT_MS,
    1,
    120_000,
  );

  const response = await (options.fetchImpl ?? fetch)(OPENROUTER_DECISIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      state: { text },
      questions: {
        negative: {
          type: "noul",
          instructions:
            "Apakah `text` merupakan teks negatif? Anggap negatif jika berisi sentimen negatif, keluhan, penghinaan, kebencian, pelecehan, ancaman, permusuhan, atau bahasa merendahkan. Kritik yang sopan tetap negatif bila menyatakan ketidakpuasan. Teks netral, informatif, pertanyaan tanpa sentimen, pujian, dukungan, dan candaan yang tidak menyerang bukan negatif. Nilai berdasarkan makna dan konteks, termasuk slang, sarkasme, serta bahasa Indonesia atau bahasa lain.",
          criteria: {
            true: "Teks mengandung sikap, emosi, atau ujaran negatif.",
            false: "Teks netral atau positif dan tidak mengandung ujaran negatif.",
          },
        },
      },
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  const payload = (await response.json().catch(() => ({}))) as DecisionsResponse;
  if (!response.ok) {
    const detail = payload.error?.message ?? `OpenRouter merespons HTTP ${response.status}`;
    throw new OpenRouterError(detail, response.status);
  }

  const answer = payload.answers?.negative;
  if (answer?.type !== "noul" || !Number.isFinite(answer.noul) || answer.noul < 0 || answer.noul > 1) {
    throw new OpenRouterError("Respons klasifikasi OpenRouter tidak valid", 502);
  }

  const negative = answer.noul >= threshold;
  return {
    negative,
    score: answer.noul,
    confidence: negative ? answer.noul : 1 - answer.noul,
    model: payload.model ?? model,
    cost_usd: typeof payload.usage?.cost === "number" ? payload.usage.cost : null,
  };
}
