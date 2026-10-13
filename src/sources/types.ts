/** Normalized live-chat comment emitted by every platform adapter. */
export type Platform = "twitch" | "kick" | "youtube" | "tiktok";

export type LiveComment = {
  platform: Platform;
  channel: string;
  id: string;
  author: string;
  text: string;
  /** ISO 8601, UTC. */
  at: string;
};

export type SourceEvents = {
  onComment: (comment: LiveComment) => void;
  onStatus?: (state: string, detail?: string) => void;
  onError?: (error: Error) => void;
};

export type ConnectOptions = SourceEvents & {
  /** Channel/username/slug for the platform (handle without @ is fine). */
  channel: string;
  /** YouTube only: explicit live video id (skips channel->live lookup). */
  video?: string;
};

export type SourceHandle = { close: () => void | Promise<void> };

export const PLATFORMS: readonly Platform[] = ["twitch", "kick", "youtube", "tiktok"];

/** Normalize whatever an adapter's dependency throws into a real Error. */
export function toError(value: unknown): Error {
  if (value instanceof Error) return value;
  if (typeof value === "string") return new Error(value);
  try {
    return new Error(JSON.stringify(value));
  } catch {
    return new Error(String(value));
  }
}
