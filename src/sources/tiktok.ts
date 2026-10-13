import { TikTokLiveConnection, WebcastEvent } from "tiktok-live-connector";
import { toError, type ConnectOptions, type SourceHandle } from "./types.js";

type ChatData = {
  comment?: string;
  common?: { msgId?: string };
  user?: { uniqueId?: string; nickname?: string };
};

// tiktok-live-connector extends a value-typed EventEmitter base; TS can't see
// inherited `.on` through it, so use a minimal emitter interface.
type LooseEmitter = {
  on(event: string, listener: (data: unknown) => void): unknown;
};

/**
 * TikTok LIVE chat via tiktok-live-connector (WebSocket + signature).
 * No key required, but the account must be LIVE and TikTok rotates its
 * signing params, so this adapter is the most fragile of the four.
 */
export async function connectTikTok(opts: ConnectOptions): Promise<SourceHandle> {
  const username = opts.channel.replace(/^@/, "");
  const connection = new TikTokLiveConnection(username, {});
  const emitter = connection as unknown as LooseEmitter;

  emitter.on(WebcastEvent.CHAT, (data) => {
    const d = data as ChatData;
    const text = d.comment;
    if (typeof text !== "string") return;
    opts.onComment({
      platform: "tiktok",
      channel: username,
      id: d.common?.msgId ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      author: d.user?.uniqueId ?? d.user?.nickname ?? "anonymous",
      text,
      at: new Date().toISOString(),
    });
  });
  emitter.on("error", (e) => {
    opts.onError?.(toError(e));
  });
  emitter.on("disconnected", () => opts.onStatus?.("disconnected"));

  const state = await connection.connect();
  opts.onStatus?.("connected", `roomId ${String(state?.roomId ?? "?")}`);
  return {
    close: () => {
      try {
        void connection.disconnect();
      } catch {
        /* ignore */
      }
    },
  };
}
