/**
 * Decision models ("System One") reachable through the OpenRouter Decisions API.
 *
 * Right now TypeSafe's Jev is the only decision-model family on OpenRouter, so
 * the list is short. It's data-driven on purpose: when another family ships,
 * add an entry here and it shows up in `GET /models` and the UI with no other
 * change. `resolveDecisionModel` still accepts any well-formed id, so you can
 * point the app at a model that isn't listed yet.
 */
export type DecisionModel = {
  id: string;
  label: string;
  note: string;
};

export const DECISION_MODELS: readonly DecisionModel[] = [
  {
    id: "~typesafe/jev-latest",
    label: "Jev Latest",
    note: "Always routes to the newest Jev release",
  },
  {
    id: "typesafe/jev-1.13",
    label: "Jev 1.13",
    note: "Pinned TypeSafe System One model",
  },
];

/** Default model. Override with the DECISION_MODEL env var. */
export const DEFAULT_DECISION_MODEL = process.env.DECISION_MODEL?.trim() || DECISION_MODELS[0]!.id;

const MAX_MODEL_ID_LENGTH = 120;
// "author/model", optional leading "~" alias marker; bare ids like "jev-1.13" pass too.
const MODEL_ID_PATTERN = /^~?[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)?$/;

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
