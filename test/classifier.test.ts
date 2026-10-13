import assert from "node:assert/strict";
import test from "node:test";
import { classifyText, OpenRouterError } from "../src/classifier.js";

test("mengklasifikasikan teks negatif dari skor Jev", async () => {
  const fetchImpl: typeof fetch = async (_input, init) => {
    const request = JSON.parse(String(init?.body)) as Record<string, unknown>;
    assert.equal(request.model, "~typesafe/jev-latest");
    assert.deepEqual(request.state, { text: "Produk ini buruk sekali" });

    return new Response(
      JSON.stringify({
        model: "typesafe/jev-1.13-20260917",
        answers: { negative: { type: "noul", noul: 0.94 } },
        usage: { cost: 0.00002 },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  const result = await classifyText("Produk ini buruk sekali", {
    apiKey: "test-key",
    fetchImpl,
  });

  assert.deepEqual(result, {
    negative: true,
    score: 0.94,
    confidence: 0.94,
    model: "typesafe/jev-1.13-20260917",
    cost_usd: 0.00002,
  });
});

test("mengklasifikasikan teks non-negatif", async () => {
  const fetchImpl: typeof fetch = async () =>
    new Response(
      JSON.stringify({ answers: { negative: { type: "noul", noul: 0.08 } }, usage: {} }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );

  const result = await classifyText("Terima kasih, sangat membantu", {
    apiKey: "test-key",
    fetchImpl,
  });

  assert.equal(result.negative, false);
  assert.equal(result.score, 0.08);
  assert.equal(result.confidence, 0.92);
});

test("meneruskan kegagalan OpenRouter secara aman", async () => {
  const fetchImpl: typeof fetch = async () =>
    new Response(JSON.stringify({ error: { message: "Rate limit exceeded" } }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });

  await assert.rejects(
    classifyText("contoh", { apiKey: "test-key", fetchImpl }),
    (error: unknown) =>
      error instanceof OpenRouterError && error.status === 429 && error.message === "Rate limit exceeded",
  );
});
